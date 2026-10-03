const Banner = require("../models/bannerModel");
const uploadToImgBB = require("../utils/imgbbUpload");

// =====================================================
// ADD BANNER
// Maximum 4 banners
// =====================================================

const addBanner = async (req, res) => {
  try {
    // Check current banner count
    const bannerCount = await Banner.countDocuments();

    if (bannerCount >= 4) {
      return res.status(400).json({
        success: false,
        message: "Maximum 4 banners are allowed.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Banner image is required.",
      });
    }

    const { title } = req.body;

    // Upload to ImgBB
    const uploadedImage = await uploadToImgBB(
      req.file.buffer,
      req.file.originalname
    );

    // Save banner
    const banner = await Banner.create({
      imageUrl: uploadedImage.imageUrl,
      deleteUrl: uploadedImage.deleteUrl,
      title: title || "",
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Banner uploaded successfully.",
      data: banner,
    });
  } catch (error) {
    console.error("Add Banner Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload banner.",
    });
  }
};

// =====================================================
// GET ALL BANNERS
// =====================================================

const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: banners.length,
      data: banners,
    });
  } catch (error) {
    console.error("Get Banners Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch banners.",
    });
  }
};

// =====================================================
// GET ACTIVE BANNERS
// =====================================================

const getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.find({
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: banners.length,
      data: banners,
    });
  } catch (error) {
    console.error("Get Active Banners Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch active banners.",
    });
  }
};

// =====================================================
// DELETE BANNER
// =====================================================

const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found.",
      });
    }

    /*
      ImgBB images can be deleted using deleteUrl.

      We intentionally delete the database record even if
      ImgBB deletion fails.
    */

    if (banner.deleteUrl) {
      try {
        await require("axios").get(banner.deleteUrl);
      } catch (imgError) {
        console.log(
          "ImgBB delete warning:",
          imgError.message
        );
      }
    }

    await Banner.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Banner deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Banner Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete banner.",
    });
  }
};

// =====================================================
// TOGGLE BANNER
// =====================================================

const toggleBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found.",
      });
    }

    banner.isActive = !banner.isActive;

    await banner.save();

    return res.status(200).json({
      success: true,
      message: `Banner ${
        banner.isActive ? "activated" : "deactivated"
      } successfully.`,
      data: banner,
    });
  } catch (error) {
    console.error("Toggle Banner Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update banner.",
    });
  }
};

module.exports = {
  addBanner,
  getBanners,
  getActiveBanners,
  deleteBanner,
  toggleBanner,
};