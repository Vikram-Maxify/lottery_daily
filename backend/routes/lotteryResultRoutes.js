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
} = require("../controllers/lotteryResultController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

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

// Test number matching
router.post(
  "/check-number",
  authMiddleware,
  adminMiddleware,
  checkNumber
);

// Get result by ID
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