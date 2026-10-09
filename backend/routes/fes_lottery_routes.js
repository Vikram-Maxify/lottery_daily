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
  checkLotteryResult,
  getNumbersWithoutBets,
} = require("../controllers/festival_lottery");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// =====================================================
// MULTER SETUP (market image upload)
// =====================================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
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

// ADD bulk entries
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


router.put(
  "/update/:id",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  updateLotteryConfig
);

router.get(
  "/all",
  authMiddleware,
  adminMiddleware,
  getAllLotteryConfigs
);

router.get(
  "/:id",
  authMiddleware,
  adminMiddleware,
  getLotteryConfigById
);

router.patch(
  "/:id/activate",
  authMiddleware,
  adminMiddleware,
  activateLotteryConfig
);


router.patch(
  "/:configId/entry/:entryId/status",
  authMiddleware,
  adminMiddleware,
  updateEntryStatus
);

router.get("/:id/no-bets", getNumbersWithoutBets);


router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  deleteLotteryConfig
);


router.get(
  "/check-result/:number",
  authMiddleware,
  checkLotteryResult
);


module.exports = router;