const express = require("express");
const multer = require("multer");

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
  deactivateLotteryConfig, // ✅ ADD
} = require("../controllers/festival_lottery");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// =====================================================
// MULTER SETUP (market image upload)
// =====================================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (allowed.includes(file.mimetype)) {
      return cb(null, true);
    }

    return cb(
      new Error("Only JPEG, PNG or WEBP images are allowed"),
      false
    );
  },
});

// =====================================================
// PUBLIC ROUTES
// =====================================================

// GET active lottery
// GET /api/festival/active
router.get(
  "/active",
  getActiveLotteryConfig
);

// =====================================================
// USER ROUTES
// =====================================================

// GET my lottery entries
// GET /api/festival/my-entries
router.get(
  "/my-entries",
  authMiddleware,
  getMyLotteryEntries
);

// ADD lottery entry
// POST /api/festival/entry
router.post(
  "/entry",
  authMiddleware,
  addUserLotteryEntry
);

// ADD bulk entries
// POST /api/festival/entry/bulk
router.post(
  "/entry/bulk",
  authMiddleware,
  addBulkUserLotteryEntries
);

// =====================================================
// ADMIN ROUTES
// =====================================================

// CREATE lottery config
// POST /api/festival
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  createLotteryConfig
);

// GET all lottery configs
// GET /api/festival/all
router.get(
  "/all",
  authMiddleware,
  adminMiddleware,
  getAllLotteryConfigs
);

// GET lottery config by ID
// GET /api/festival/:id
router.get(
  "/:id",
  authMiddleware,
  adminMiddleware,
  getLotteryConfigById
);

// ACTIVATE lottery config
// PATCH /api/festival/:id/activate
router.patch(
  "/:id/activate",
  authMiddleware,
  adminMiddleware,
  activateLotteryConfig
);

// =====================================================
// DEACTIVATE LOTTERY CONFIG
// =====================================================

// PUT /api/festival/:id/deactivate
router.put(
  "/:id/deactivate",
  authMiddleware,
  adminMiddleware,
  deactivateLotteryConfig
);

// UPDATE user entry status
// PATCH /api/festival/:configId/entry/:entryId/status
router.patch(
  "/:configId/entry/:entryId/status",
  authMiddleware,
  adminMiddleware,
  updateEntryStatus
);

// DELETE lottery config
// DELETE /api/festival/:id
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  deleteLotteryConfig
);

module.exports = router;