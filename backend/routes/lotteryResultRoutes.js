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
  getPublishedResults,
  getPublishedResultByDate,
  getUnbetLotteryNumbers,
} = require("../controllers/lotteryResultController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// ==========================================
// PUBLIC / USER RESULT ROUTES
// ==========================================

// Verify / Check ticket number
router.post(
  "/check-number",
  checkNumber
);

// Get published results
router.get(
  "/published",
  getPublishedResults
);

// Get published result by date
router.get(
  "/published/:date",
  getPublishedResultByDate
);

// ==========================================
// ADMIN RESULT ROUTES
// ==========================================

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

// ==========================================
// GET UNBET LOTTERY NUMBERS
// IMPORTANT: This must come BEFORE /:id
// ==========================================
router.get(
  "/unbet-numbers",
  // authMiddleware,
  // adminMiddleware,
  getUnbetLotteryNumbers
);

// ==========================================
// GET RESULT BY ID
// ==========================================
router.get(
  "/:id",
  authMiddleware,
  adminMiddleware,
  getResultById
);

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

// Delete result
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  deleteResult
);

module.exports = router;
