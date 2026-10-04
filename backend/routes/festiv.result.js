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
} = require("../controllers/festival_result_controller");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// ==========================================
// STATIC ROUTES PEHLE
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

// ==========================================
// DYNAMIC ROUTES (/:id) BAAD ME
// ==========================================

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