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
} = require("../controllers/lotteryConfigController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// =====================================================
// MULTER SETUP (for market image upload)
// =====================================================
// Memory storage => file.buffer available in controller
// Controller will upload buffer to ImgBB and save URL in DB
// =====================================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },

  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
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
// GET /api/lottery-config/active
router.get("/active", getActiveLotteryConfig);

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

// ADD bulk lottery entries
// POST /api/lottery-config/entry/bulk
router.post(
  "/entry/bulk",
  authMiddleware,
  addBulkUserLotteryEntries
);

// =====================================================
// ADMIN ROUTES
// =====================================================

// CREATE lottery config (with image upload)
// POST /api/lottery-config
// multipart/form-data => field name: "image"
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  upload.single("image"), // 👈 ADDED
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