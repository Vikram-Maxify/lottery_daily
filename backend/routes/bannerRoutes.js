const express = require("express");
const multer = require("multer");

const {
  addBanner,
  getBanners,
  getActiveBanners,
  deleteBanner,
  toggleBanner,
} = require("../controllers/bannerController");

const router = express.Router();

// =====================================================
// MULTER CONFIG
// =====================================================

const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
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
          "Only JPG, JPEG, PNG and WEBP images are allowed."
        )
      );
    }

    cb(null, true);
  },
});

// =====================================================
// ROUTES
// =====================================================

// Upload banner
router.post(
  "/",
  upload.single("banner"),
  addBanner
);

// Get all banners
router.get(
  "/",
  getBanners
);

// Get active banners
router.get(
  "/active",
  getActiveBanners
);

// Delete banner
router.delete(
  "/:id",
  deleteBanner
);

// Activate / deactivate banner
router.patch(
  "/:id/toggle",
  toggleBanner
);

module.exports = router;