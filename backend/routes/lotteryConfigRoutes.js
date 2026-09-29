const express = require("express");

const router = express.Router();

const {
  createLotteryConfig,
  addUserLotteryEntry,
  getMyLotteryEntries,
  getAllLotteryConfigs,
  getActiveLotteryConfig,
  getLotteryConfigById,
  activateLotteryConfig,
  updateEntryStatus,
  deleteLotteryConfig,
  addBulkUserLotteryEntries,
} = require("../controllers/lotteryConfigController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// =====================================================
// PUBLIC ROUTES
// =====================================================

// GET active lottery
// GET /api/lottery-config/active
router.get(
  "/active",
  getActiveLotteryConfig
);

// =====================================================
// USER ROUTES
// =====================================================

// GET my lottery entries
// GET /api/lottery-config/my-entries
router.get(
  "/my-entries",
  authMiddleware,
  getMyLotteryEntries
);

// ADD lottery entry
// POST /api/lottery-config/entry
router.post(
  "/entry",
  authMiddleware,
  addUserLotteryEntry
);

router.post("/entry/bulk", authMiddleware, addBulkUserLotteryEntries);


// =====================================================
// ADMIN ROUTES
// =====================================================

// CREATE lottery config
// POST /api/lottery-config
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  createLotteryConfig
);

// GET all lottery configs
// GET /api/lottery-config/all
router.get(
  "/all",
  authMiddleware,
  adminMiddleware,
  getAllLotteryConfigs
);

// GET lottery config by ID
// GET /api/lottery-config/:id
router.get(
  "/:id",
  authMiddleware,
  adminMiddleware,
  getLotteryConfigById
);

// ACTIVATE lottery config
// PATCH /api/lottery-config/:id/activate
router.patch(
  "/:id/activate",
  authMiddleware,
  adminMiddleware,
  activateLotteryConfig
);

// UPDATE user entry status
// PATCH /api/lottery-config/:configId/entry/:entryId/status
router.patch(
  "/:configId/entry/:entryId/status",
  authMiddleware,
  adminMiddleware,
  updateEntryStatus
);

// DELETE lottery config
// DELETE /api/lottery-config/:id
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  deleteLotteryConfig
);

module.exports = router;