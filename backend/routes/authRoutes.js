const express = require("express");
const multer = require("multer");

const {
  // OTP
  sendRegisterOtp,
  verifyRegisterOtp,
  sendForgotPasswordOtp,
  resetPasswordWithOtp,
  // Auth
  register,
  login,
  getProfile,
  logout,
  updateProfile,
  getAllUsers,
  adminUpdateUserProfile,
  adminDeleteUser,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// =======================
// MULTER CONFIG
// =======================
// Memory storage → req.file.buffer → passed to ImgBB helper
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// =======================
// OTP ROUTES (PUBLIC)
// =======================
// 1️⃣ Register flow
router.post("/send-otp", sendRegisterOtp);              // send OTP for registration
router.post("/verify-otp", verifyRegisterOtp);          // verify OTP (marks verified=true)

// 2️⃣ Forgot password flow
router.post("/forgot-password/send-otp", sendForgotPasswordOtp);
router.post("/forgot-password/reset", resetPasswordWithOtp);

// =======================
// PUBLIC ROUTES
// =======================
router.post("/register", register);                     // now requires verified OTP + otp in body
router.post("/login", login);
router.post("/logout", logout);

// =======================
// PROTECTED ROUTES
// =======================
router.get("/profile", authMiddleware, getProfile);

router.put(
  "/profile",
  authMiddleware,
  upload.single("profileImage"),
  updateProfile
);

// =======================
// ADMIN ROUTES
// =======================
router.get("/all", authMiddleware, adminMiddleware, getAllUsers);

router.put(
  "/:uuid",
  authMiddleware,
  adminMiddleware,
  upload.single("profileImage"),
  adminUpdateUserProfile
);

router.delete(
  "/:uuid",
  authMiddleware,
  adminMiddleware,
  adminDeleteUser
);

module.exports = router;