const express = require("express");
const router = express.Router();

const multer = require("multer");

const {
  createTopWinner,
  getAllTopWinners,
  getActiveTopWinners,
  getTopWinnerById,
  updateTopWinner,
  deleteTopWinner,
  toggleTopWinnerStatus,
} = require("../controllers/topWinnerController");

// =====================================================
// MULTER MEMORY STORAGE
// =====================================================

const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },

  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// =====================================================
// ADMIN
// =====================================================

// Create
router.post(
  "/",
  upload.single("image"),
  createTopWinner
);

// Get all
router.get(
  "/",
  getAllTopWinners
);

// Get single
router.get(
  "/:id",
  getTopWinnerById
);

// Update
router.put(
  "/:id",
  upload.single("image"),
  updateTopWinner
);

// Delete
router.delete(
  "/:id",
  deleteTopWinner
);

// Toggle active
router.patch(
  "/:id/toggle",
  toggleTopWinnerStatus
);

// =====================================================
// PUBLIC
// =====================================================

router.get(
  "/public/active",
  getActiveTopWinners
);

module.exports = router;