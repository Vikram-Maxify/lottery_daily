const express = require("express");

const router = express.Router();

const upload = require("../middleware/upload");

const {
  uploadKycDocument,
  getMyKyc,
} = require("../controllers/kycController");

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
  uploadKycDocument
);

// =====================================================
// USER'S KYC
// =====================================================

router.get(
  "/my",
  authMiddleware,
  getMyKyc
);

module.exports = router;