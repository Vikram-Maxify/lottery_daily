const express = require("express");

const multer = require("multer");
const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG, JPEG, PNG and WEBP images are allowed."));
    }

    cb(null, true);
  },
});
const {
  uploadKycDocument,
  getMyKyc,
  getKycStatus,
} = require("../controllers/kycController");

const authMiddleware = require("../middleware/authMiddleware");

// =====================================================
// UPLOAD KYC
// Fields:
//   aadhaarFront (or front)
//   aadhaarBack  (or back)
//   panFront     (or pan)
//   selfie
// =====================================================

const uploadFields = upload.fields([
  { name: "aadhaarFront", maxCount: 1 },
  { name: "aadhaarBack", maxCount: 1 },
  { name: "panFront", maxCount: 1 },
  { name: "pan", maxCount: 1 },
  { name: "selfie", maxCount: 1 },
  { name: "front", maxCount: 1 },
  { name: "back", maxCount: 1 },
]);

const handleUpload = (req, res, next) => {
  uploadFields(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: err.message || "File upload error",
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Invalid file",
      });
    }
    next();
  });
};

router.post("/upload", authMiddleware, handleUpload, uploadKycDocument);

// =====================================================
// USER'S KYC
// =====================================================

router.get("/my", authMiddleware, getMyKyc);
router.get("/status", authMiddleware, getKycStatus);

module.exports = router;
