const express = require("express");
const multer = require("multer");

const {
  register,
  login,
  getProfile,
  logout,
  updateProfile,
  getAllUsers,
  adminUpdateUserProfile,
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
// PUBLIC ROUTES
// =======================
router.post(
  "/register",
  register
);

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

module.exports = router;