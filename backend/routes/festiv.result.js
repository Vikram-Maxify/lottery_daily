const express = require("express");

const {
  createResult,
  getAllResults,
  getResultById,
  publishResult,
  unpublishResult,
  updateResult,
  deleteResult,
  checkNumber,
  getUnbetLotteryNumbers,
} = require("../controllers/festival_result_controller");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// =====================================================
// STATIC ROUTES — ALWAYS BEFORE /:id
// =====================================================

// Create result
router.post(
  "/create",
  authMiddleware,
  adminMiddleware,
  createResult
);

// Get all results
router.get(
  "/all",
  authMiddleware,
  adminMiddleware,
  getAllResults
);

// Test number matching
router.post(
  "/check-number",
  authMiddleware,
  adminMiddleware,
  checkNumber
);

// Get lottery numbers on which NO BET was placed
router.get(
  "/unbet-numbers",
  // authMiddleware,
  // adminMiddleware,
  getUnbetLotteryNumbers
);

// =====================================================
// DYNAMIC ROUTES — AFTER ALL STATIC ROUTES
// =====================================================

// Update result
router.patch(
  "/:id",
  authMiddleware,
  adminMiddleware,
  updateResult
);

// Publish result
router.patch(
  "/:id/publish",
  authMiddleware,
  adminMiddleware,
  publishResult
);

// Unpublish result
router.patch(
  "/:id/unpublish",
  authMiddleware,
  adminMiddleware,
  unpublishResult
);

// Get result by ID
router.get(
  "/:id",
  authMiddleware,
  adminMiddleware,
  getResultById
);

// Delete result
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  deleteResult
);

module.exports = router;