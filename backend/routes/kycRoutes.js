const express = require("express");

const router = express.Router();

const upload = require("../middleware/upload");

const {
  uploadKycDocument,
  getMyKyc,
} = require("../controllers/kycController");

const authMiddleware = require("../middleware/authMiddleware");

// Upload Aadhaar/PAN
router.post(
  "/upload",
  authMiddleware,
  upload.single("document"),
  uploadKycDocument
);

// User's KYC
router.get(
  "/my",
  authMiddleware,
  getMyKyc
);

module.exports = router;