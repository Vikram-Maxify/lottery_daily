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
const { uploadKycDocument, getMyKyc } = require("../controllers/kycController");

const authMiddleware = require("../middleware/authMiddleware");

// =====================================================
// UPLOAD KYC
// Aadhaar:
//   front = Aadhaar Front
//   back  = Aadhaar Back
//
// PAN:
//   front = PAN Card
// =====================================================

router.post(
  "/upload",
  authMiddleware,
  upload.fields([
    {
      name: "front",
      maxCount: 1,
    },
    {
      name: "back",
      maxCount: 1,
    },
  ]),
  uploadKycDocument,
);

// =====================================================
// USER'S KYC
// =====================================================

router.get("/my", authMiddleware, getMyKyc);

module.exports = router;
