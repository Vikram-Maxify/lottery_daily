const express = require("express");

const router = express.Router();

const {
  getAllKyc,
  getSingleKyc,
  approveKyc,
  rejectKyc,
} = require("../controllers/adminKycController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// Get all KYC
router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getAllKyc
);

// Get single KYC
router.get(
  "/:id",
  authMiddleware,
  adminMiddleware,
  getSingleKyc
);

// Approve
router.patch(
  "/:id/approve",
  authMiddleware,
  adminMiddleware,
  approveKyc
);

// Reject
router.patch(
  "/:id/reject",
  authMiddleware,
  adminMiddleware,
  rejectKyc
);

module.exports = router;
