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
  updateLotteryConfig,
  deactivateLotteryConfig,
} = require("../controllers/lotteryConfigController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// =====================================================
// MULTER SETUP (memory storage — buffer controller me jayega)
// =====================================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

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

router.post(
  "/entry/bulk",
  authMiddleware,
  addBulkUserLotteryEntries
);

// =====================================================
// ADMIN ROUTES
// =====================================================

// CREATE lottery config  👈 IMAGE UPLOAD KE SAATH
// POST /api/lottery-config
// multipart/form-data: marketName, month, year, drawDate, drawTime, prizes, image
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),   // 🔑 YE LINE MISSING THI
  createLotteryConfig
);


router.put(
  "/update/:id",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  updateLotteryConfig
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

router.put('/:id/deactivate',authMiddleware,adminMiddleware,deactivateLotteryConfig)

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