const express = require("express");
const multer = require("multer");

const router = express.Router();

const {
  createResultImage,
  getAllResultImages,
  getDailyResultImages,
  getFestivalResultImages,
  getResultImageById,
  updateResultImage,
  deleteResultImage,
  toggleResultImage,
} = require("../controllers/resultImageController");

// =====================================================
// MULTER
// =====================================================

const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          "Only JPG, JPEG, PNG and WEBP images are allowed"
        )
      );
    }

    cb(null, true);
  },
});

// =====================================================
// ADMIN
// =====================================================

// Create daily/festival result image
router.post(
  "/",
  upload.single("image"),
  createResultImage
);

// Get all
router.get(
  "/",
  getAllResultImages
);

// Get single
router.get(
  "/:id",
  getResultImageById
);

// Update
router.put(
  "/:id",
  upload.single("image"),
  updateResultImage
);

// Delete
router.delete(
  "/:id",
  deleteResultImage
);

// Toggle active
router.patch(
  "/:id/toggle",
  toggleResultImage
);

// =====================================================
// PUBLIC
// =====================================================

// Daily
router.get(
  "/public/daily",
  getDailyResultImages
);

// Festival
router.get(
  "/public/festival",
  getFestivalResultImages
);

module.exports = router;