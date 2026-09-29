const express = require("express");

const router = express.Router();

const {
  createWithdrawal,
  getMyWithdrawals,
  getAllWithdrawals,
  updateWithdrawalStatus,
} = require("../controllers/withdrawalController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// ==========================================
// USER WITHDRAWAL ROUTES
// ==========================================

// Create withdrawal
router.post(
  "/",
  authMiddleware,
  createWithdrawal
);

// Get logged-in user's withdrawals
router.get(
  "/me",
  authMiddleware,
  getMyWithdrawals
);

// ==========================================
// ADMIN WITHDRAWAL ROUTES
// ==========================================

// Get all withdrawals
router.get(
  "/admin/all",
  authMiddleware,
  adminMiddleware,
  getAllWithdrawals
);

// Update withdrawal status
router.patch(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  updateWithdrawalStatus
);

module.exports = router;