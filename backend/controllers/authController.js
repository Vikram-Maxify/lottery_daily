const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const User = require("../models/userModel");
const Otp = require("../models/otpModel");
const uploadToImgBB = require("../utils/imgbbUpload");
const { sendOtpSms, generateOtp } = require("../utils/smsService");

// =======================
// HELPERS
// =======================
const COOKIE_NAME = "usertoken";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

const generateToken = (user) =>
  jwt.sign(
    {
      uuid: user.uuid,
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

const setAuthCookie = (res, user) => {
  const token = generateToken(user);
  res.cookie(COOKIE_NAME, token, cookieOptions);
  return token;
};

const handleProfileImageUpload = async (req) => {
  if (!req.file) return null;
  const { imageUrl } = await uploadToImgBB(req.file);
  return imageUrl;
};

const generateUniqueReferralCode = async (name = "USER") => {
  const prefix = (name || "USER")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 4)
    .padEnd(4, "X");

  let code;
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 10) {
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    code = `${prefix}${random}`;
    exists = await User.exists({ referralCode: code });
    attempts++;
  }

  if (exists) {
    code = `REF${uuidv4().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  }

  return code;
};

const getClientInfo = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = forwarded
    ? forwarded.split(",")[0].trim()
    : req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      null;

  const userAgent = req.headers["user-agent"] || "";

  let browser = "Unknown";
  let os = "Unknown";
  let device = "Desktop";

  if (/edg/i.test(userAgent)) browser = "Edge";
  else if (/opr|opera/i.test(userAgent)) browser = "Opera";
  else if (/chrome|crios/i.test(userAgent)) browser = "Chrome";
  else if (/firefox|fxios/i.test(userAgent)) browser = "Firefox";
  else if (/safari/i.test(userAgent)) browser = "Safari";
  else if (/msie|trident/i.test(userAgent)) browser = "Internet Explorer";

  if (/windows nt/i.test(userAgent)) os = "Windows";
  else if (/android/i.test(userAgent)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(userAgent)) os = "iOS";
  else if (/mac os x/i.test(userAgent)) os = "macOS";
  else if (/linux/i.test(userAgent)) os = "Linux";

  if (
    /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  ) {
    device = "Mobile";
  } else if (/ipad|tablet|kindle|silk/i.test(userAgent)) {
    device = "Tablet";
  }

  return { ip, browser, os, device, userAgent };
};

// 🔥 Create/refresh OTP record and send SMS
const issueOtp = async (mobile, purpose) => {
  const cleanMobile = String(mobile).trim();
  const otpCode = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await Otp.findOneAndUpdate(
    { mobile: cleanMobile, purpose },
    { code: otpCode, expiresAt, attempts: 0, verified: false },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const smsResult = await sendOtpSms(cleanMobile, otpCode);
  if (!smsResult.success) {
    console.error("SMS send failed:", smsResult.statusCode, smsResult.data);
    // Cleanup so client can retry immediately
    await Otp.deleteOne({ mobile: cleanMobile, purpose });
    const err = new Error("Failed to send OTP. Please try again.");
    err.statusCode = 502;
    throw err;
  }

  return cleanMobile;
};

// 🔥 Verify OTP record (throws with statusCode)
const checkOtp = async (mobile, purpose, otp) => {
  const cleanMobile = String(mobile).trim();
  const record = await Otp.findOne({
    mobile: cleanMobile,
    purpose,
  }).select("+code");

  if (!record) {
    const err = new Error("OTP not requested");
    err.statusCode = 400;
    throw err;
  }

  if (record.expiresAt && record.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: record._id });
    const err = new Error("OTP expired");
    err.statusCode = 400;
    throw err;
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    await Otp.deleteOne({ _id: record._id });
    const err = new Error("Too many attempts. Request a new OTP.");
    err.statusCode = 429;
    throw err;
  }

  if (String(otp) !== String(record.code)) {
    record.attempts += 1;
    await record.save();
    const err = new Error("Invalid OTP");
    err.statusCode = 400;
    throw err;
  }

  return record;
};

// =======================
// OTP: SEND (REGISTER)
// =======================
const sendRegisterOtp = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile || !/^\d{10}$/.test(String(mobile).trim())) {
      return res.status(400).json({
        success: false,
        message: "Valid 10-digit mobile number is required",
      });
    }

    const cleanMobile = String(mobile).trim();

    const existingUser = await User.findOne({ mobile: cleanMobile });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Mobile number already registered. Please login.",
      });
    }

    await issueOtp(cleanMobile, "register");

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your mobile",
      data: {
        mobile: cleanMobile,
        expiresIn: OTP_EXPIRY_MINUTES * 60,
      },
    });
  } catch (error) {
    console.error("Send Register OTP Error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// =======================
// OTP: VERIFY (REGISTER)
// =======================
const verifyRegisterOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        message: "Mobile and OTP are required",
      });
    }

    const record = await checkOtp(mobile, "register", otp);
    record.verified = true;
    await record.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. You can now complete registration.",
    });
  } catch (error) {
    console.error("Verify Register OTP Error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// =======================
// OTP: SEND (FORGOT PASSWORD)
// =======================
const sendForgotPasswordOtp = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile || !/^\d{10}$/.test(String(mobile).trim())) {
      return res.status(400).json({
        success: false,
        message: "Valid 10-digit mobile number is required",
      });
    }

    const cleanMobile = String(mobile).trim();

    const user = await User.findOne({ mobile: cleanMobile });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Mobile number not registered",
      });
    }

    await issueOtp(cleanMobile, "forgot_password");

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your mobile",
      data: {
        mobile: cleanMobile,
        expiresIn: OTP_EXPIRY_MINUTES * 60,
      },
    });
  } catch (error) {
    console.error("Send Forgot Password OTP Error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// =======================
// OTP: RESET PASSWORD
// =======================
const resetPasswordWithOtp = async (req, res) => {
  try {
    const { mobile, otp, newPassword } = req.body;

    if (!mobile || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Mobile, OTP and new password are required",
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const cleanMobile = String(mobile).trim();

    const record = await checkOtp(cleanMobile, "forgot_password", otp);

    const user = await User.findOne({ mobile: cleanMobile }).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.plainPassword = newPassword;
    await user.save();

    await Otp.deleteOne({ _id: record._id });

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please login.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// =======================
// REGISTER (requires verified OTP)
// =======================
const register = async (req, res) => {
  try {
    const { name, mobile, password, referralBy, otp } = req.body;

    if (!name || !mobile || !password || !otp) {
      return res.status(400).json({
        success: false,
        message: "Name, mobile, password and OTP are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const cleanMobile = String(mobile).trim();

    // 🔥 OTP must be verified
    const otpRecord = await Otp.findOne({
      mobile: cleanMobile,
      purpose: "register",
    }).select("+code");

    if (!otpRecord || !otpRecord.verified) {
      return res.status(400).json({
        success: false,
        message: "Please verify OTP before registering",
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new one.",
      });
    }

    if (String(otp) !== String(otpRecord.code)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const existingUser = await User.findOne({ mobile: cleanMobile });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Mobile number already registered",
      });
    }

    // 🔥 Validate referralBy (if provided)
    let validReferralBy = null;
    if (referralBy && String(referralBy).trim()) {
      const cleanCode = String(referralBy).trim().toUpperCase();

      const referrer = await User.findOne({
        $or: [
          { referralCode: cleanCode },
          { referralCode: { $regex: new RegExp(`^${cleanCode}$`, "i") } },
          { refCode: cleanCode },
          { refCode: { $regex: new RegExp(`^${cleanCode}$`, "i") } },
        ],
      });

      if (!referrer) {
        return res.status(400).json({
          success: false,
          message: "Invalid referral code",
        });
      }

      validReferralBy = referrer.referralCode || referrer.refCode;
    }

    // 🔥 Upload profile image if provided
    let profileImage = null;
    if (req.file) {
      profileImage = await handleProfileImageUpload(req);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const referralCode = await generateUniqueReferralCode(name);
    const clientInfo = getClientInfo(req);

    const user = await User.create({
      uuid: uuidv4(),
      name,
      mobile: cleanMobile,
      password: hashedPassword,
      plainPassword: password,
      profileImage,
      referralCode,
      referralBy: validReferralBy,
      lastLogin: {
        ...clientInfo,
        time: new Date(),
      },
      loginHistory: [
        {
          ...clientInfo,
          time: new Date(),
        },
      ],
    });

    // 🔥 Delete OTP after successful registration
    await Otp.deleteOne({ _id: otpRecord._id });

    setAuthCookie(res, user);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        uuid: user.uuid,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        profileImage: user.profileImage,
        referralCode: user.referralCode,
        referralBy: user.referralBy,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Mobile number or UUID already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// =======================
// LOGIN
// =======================
const login = async (req, res) => {
  try {
    const { mobile, password, referralBy } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({
        success: false,
        message: "Mobile and password are required",
      });
    }

    const user = await User.findOne({ mobile: String(mobile).trim() }).select(
      "+password"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid mobile or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid mobile or password",
      });
    }

    if (!user.referralCode) {
      user.referralCode = await generateUniqueReferralCode(user.name);
    }

    if (referralBy && String(referralBy).trim() && !user.referralBy) {
      const cleanCode = String(referralBy).trim().toUpperCase();
      if (cleanCode !== user.referralCode) {
        const referrer = await User.findOne({
          $or: [
            { referralCode: cleanCode },
            { referralCode: { $regex: new RegExp(`^${cleanCode}$`, "i") } },
            { refCode: cleanCode },
            { refCode: { $regex: new RegExp(`^${cleanCode}$`, "i") } },
          ],
        });

        if (referrer && referrer._id.toString() !== user._id.toString()) {
          user.referralBy = referrer.referralCode || referrer.refCode;
        }
      }
    }

    const clientInfo = getClientInfo(req);

    user.lastLogin = {
      ...clientInfo,
      time: new Date(),
    };

    if (!Array.isArray(user.loginHistory)) user.loginHistory = [];
    user.loginHistory.unshift({
      ...clientInfo,
      time: new Date(),
    });
    if (user.loginHistory.length > 10) {
      user.loginHistory = user.loginHistory.slice(0, 10);
    }

    await user.save();

    setAuthCookie(res, user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        uuid: user.uuid,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        profileImage: user.profileImage,
        referralCode: user.referralCode,
        referralBy: user.referralBy,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// =======================
// GET PROFILE
// =======================
const getProfile = async (req, res) => {
  try {
    const user = await User.findOne({
      uuid: req.user.uuid,
    }).select("-password +plainPassword");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.referralCode) {
      user.referralCode = await generateUniqueReferralCode(user.name);
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: {
        uuid: user.uuid,
        name: user.name,
        mobile: user.mobile,
        wallet: user.wallet,
        role: user.role,
        isKycVerified: Boolean(user.isKycVerified),
        profileImage: user.profileImage,
        referralCode: user.referralCode,
        referralBy: user.referralBy,
        plainPassword: user.plainPassword,
        lastLogin: user.lastLogin,
        loginHistory: user.loginHistory,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// =======================
// UPDATE PROFILE
// =======================
const updateProfile = async (req, res) => {
  try {
    const { name, mobile, password } = req.body;

    const user = await User.findOne({
      uuid: req.user.uuid,
    }).select("+password +plainPassword");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }

      user.name = name.trim();
    }

    if (mobile !== undefined) {
      if (typeof mobile !== "string" || !mobile.trim()) {
        return res.status(400).json({
          success: false,
          message: "Mobile cannot be empty",
        });
      }

      const existingUser = await User.findOne({
        mobile: mobile.trim(),
        uuid: { $ne: req.user.uuid },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Mobile number already registered",
        });
      }

      user.mobile = mobile.trim();
    }

    if (password !== undefined) {
      if (typeof password !== "string" || password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters",
        });
      }

      user.password = await bcrypt.hash(password, 12);
      user.plainPassword = password;
    }

    if (req.file) {
      const imageUrl = await handleProfileImageUpload(req);
      if (imageUrl) user.profileImage = imageUrl;
    } else if (req.body.profileImage !== undefined) {
      if (typeof req.body.profileImage === "string") {
        user.profileImage = req.body.profileImage.trim();
      }
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        uuid: user.uuid,
        name: user.name,
        mobile: user.mobile,
        profileImage: user.profileImage,
        referralCode: user.referralCode,
        referralBy: user.referralBy,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Mobile number already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// =======================
// GET ALL USERS
// =======================
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password +plainPassword")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Get All Users Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// =======================
// ADMIN UPDATE USER PROFILE
// =======================
const adminUpdateUserProfile = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { name, mobile, password } = req.body;

    if (!uuid) {
      return res.status(400).json({
        success: false,
        message: "User UUID is required",
      });
    }

    const user = await User.findOne({ uuid }).select(
      "+password +plainPassword"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }

      user.name = name.trim();
    }

    if (mobile !== undefined) {
      if (typeof mobile !== "string" || !mobile.trim()) {
        return res.status(400).json({
          success: false,
          message: "Mobile cannot be empty",
        });
      }

      const cleanMobile = mobile.trim();

      const existingUser = await User.findOne({
        mobile: cleanMobile,
        uuid: { $ne: uuid },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Mobile number already registered",
        });
      }

      user.mobile = cleanMobile;
    }

    if (password !== undefined && password !== "") {
      if (typeof password !== "string" || password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters",
        });
      }

      user.password = await bcrypt.hash(password, 12);
      user.plainPassword = password;
    }

    if (req.body.isKycVerified !== undefined) {
      user.isKycVerified = Boolean(req.body.isKycVerified);
    }

    if (
      req.body.wallet !== undefined &&
      !Number.isNaN(Number(req.body.wallet))
    ) {
      user.wallet = Math.max(0, Number(req.body.wallet));
    }

    if (req.file) {
      const imageUrl = await handleProfileImageUpload(req);
      if (imageUrl) user.profileImage = imageUrl;
    } else if (req.body.profileImage !== undefined) {
      if (typeof req.body.profileImage === "string") {
        user.profileImage = req.body.profileImage.trim();
      }
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User profile updated successfully",
      data: {
        uuid: user.uuid,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        wallet: user.wallet,
        profileImage: user.profileImage,
        isKycVerified: user.isKycVerified,
        referralCode: user.referralCode,
        referralBy: user.referralBy,
        plainPassword: user.plainPassword,
        lastLogin: user.lastLogin,
        loginHistory: user.loginHistory,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Admin Update User Profile Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Mobile number already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// =======================
// ADMIN DELETE USER
// =======================
const adminDeleteUser = async (req, res) => {
  try {
    const { uuid } = req.params;

    if (!uuid) {
      return res.status(400).json({
        success: false,
        message: "User identifier is required",
      });
    }

    const mongoose = require("mongoose");
    const user = await User.findOneAndDelete({
      $or: [
        { uuid },
        ...(mongoose.Types.ObjectId.isValid(uuid) ? [{ _id: uuid }] : []),
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: {
        uuid: user.uuid,
        id: user._id,
      },
    });
  } catch (error) {
    console.error("Admin Delete User Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// =======================
// LOGOUT
// =======================
const logout = async (req, res) => {
  try {
    const { maxAge, ...clearOptions } = cookieOptions;
    res.clearCookie(COOKIE_NAME, clearOptions);

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  // OTP
  sendRegisterOtp,
  verifyRegisterOtp,
  sendForgotPasswordOtp,
  resetPasswordWithOtp,
  // Auth
  register,
  login,
  logout,
  // User
  getProfile,
  updateProfile,
  getAllUsers,
  adminUpdateUserProfile,
  adminDeleteUser,
  generateUniqueReferralCode,
};