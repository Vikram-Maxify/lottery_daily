const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const User = require("../models/userModel");
const uploadToImgBB = require("../utils/imgbbUpload");

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

const generateToken = (user) =>
  jwt.sign(
    {
      uuid: user.uuid,
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

const setAuthCookie = (res, user) => {
  const token = generateToken(user);
  res.cookie(COOKIE_NAME, token, cookieOptions);
  return token;
};

// 🔥 Helper: upload image if file present, return url or null
const handleProfileImageUpload = async (req) => {
  if (!req.file) return null;
  const { imageUrl } = await uploadToImgBB(req.file);
  return imageUrl;
};

// 🔥 Helper: generate a unique referral code
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
    // fallback guarantee uniqueness using uuid fragment
    code = `REF${uuidv4().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  }

  return code;
};

// =======================
// REGISTER
// =======================
const register = async (req, res) => {
  try {
    const { name, mobile, password, referralBy } = req.body;

    if (!name || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, mobile and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const existingUser = await User.findOne({ mobile });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Mobile number already registered",
      });
    }

    // 🔥 Validate referralBy (if provided)
    let validReferralBy = null;
    if (referralBy) {
      const cleanCode = String(referralBy).trim().toUpperCase();

      const referrer = await User.findOne({ referralCode: cleanCode });

      if (!referrer) {
        return res.status(400).json({
          success: false,
          message: "Invalid referral code",
        });
      }

      validReferralBy = referrer.referralCode;
    }

    // 🔥 Upload profile image if provided
    let profileImage = null;
    if (req.file) {
      profileImage = await handleProfileImageUpload(req);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // 🔥 Generate unique referral code for new user
    const referralCode = await generateUniqueReferralCode(name);

    const user = await User.create({
      uuid: uuidv4(),
      name,
      mobile,
      password: hashedPassword,
      profileImage,
      referralCode,
      referralBy: validReferralBy,
    });

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
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({
        success: false,
        message: "Mobile and password are required",
      });
    }

    const user = await User.findOne({ mobile }).select("+password");

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
    }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
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
    }).select("+password");

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
    }

    // 🔥 Profile image update (file upload or selected avatar)
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
    const users = await User.find().select("-password").sort({ createdAt: -1 });

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

    const user = await User.findOne({ uuid }).select("+password");

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
    }

    // 🔥 Admin can also update image
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
  register,
  login,
  getProfile,
  updateProfile,
  adminUpdateUserProfile,
  getAllUsers,
  logout,
};
