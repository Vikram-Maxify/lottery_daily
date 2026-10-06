const ResultImage = require("../models/ResultImage");
const uploadToImgBB = require("../utils/imgbbUpload");

// =====================================================
// CREATE RESULT IMAGE
// DAILY / FESTIVAL
// =====================================================

const createResultImage = async (req, res) => {
  try {
    const {
      title,
      type,
      festivalName,
      resultDate,
      isActive,
      sortOrder,
    } = req.body;

    // ---------------------------------------------
    // VALIDATION
    // ---------------------------------------------

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Type is required",
      });
    }

    const imageType = String(type).toUpperCase();

    if (!["DAILY", "FESTIVAL"].includes(imageType)) {
      return res.status(400).json({
        success: false,
        message: "Type must be DAILY or FESTIVAL",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Result image is required",
      });
    }

    // ---------------------------------------------
    // FESTIVAL VALIDATION
    // ---------------------------------------------

    if (imageType === "FESTIVAL" && !festivalName) {
      return res.status(400).json({
        success: false,
        message: "Festival name is required for festival result",
      });
    }

    // ---------------------------------------------
    // DAILY VALIDATION
    // ---------------------------------------------

    if (imageType === "DAILY" && !resultDate) {
      return res.status(400).json({
        success: false,
        message: "Result date is required for daily result",
      });
    }

    // ---------------------------------------------
    // UPLOAD TO IMGBB
    // ---------------------------------------------

    const uploaded = await uploadToImgBB(req.file);

    // ---------------------------------------------
    // CREATE DATABASE RECORD
    // ---------------------------------------------

    const resultImage = await ResultImage.create({
      title: title || "",
      type: imageType,

      imageUrl: uploaded.imageUrl,
      displayUrl: uploaded.displayUrl,
      thumbUrl: uploaded.thumbUrl,
      deleteUrl: uploaded.deleteUrl,

      festivalName:
        imageType === "FESTIVAL"
          ? festivalName || ""
          : "",

      resultDate:
        imageType === "DAILY"
          ? resultDate
          : null,

      isActive:
        isActive === undefined
          ? true
          : String(isActive) !== "false",

      sortOrder: Number(sortOrder) || 0,
    });

    return res.status(201).json({
      success: true,
      message: `${imageType} result image created successfully`,
      data: resultImage,
    });
  } catch (error) {
    console.error("Create Result Image Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create result image",
    });
  }
};

// =====================================================
// GET ALL RESULT IMAGES - ADMIN
// =====================================================

const getAllResultImages = async (req, res) => {
  try {
    const { type, isActive } = req.query;

    const filter = {};

    if (type) {
      const imageType = String(type).toUpperCase();

      if (!["DAILY", "FESTIVAL"].includes(imageType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid type",
        });
      }

      filter.type = imageType;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const images = await ResultImage.find(filter)
      .sort({
        sortOrder: 1,
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: images.length,
      data: images,
    });
  } catch (error) {
    console.error("Get All Result Images Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get result images",
    });
  }
};

// =====================================================
// GET DAILY RESULT IMAGES
// =====================================================

const getDailyResultImages = async (req, res) => {
  try {
    const { date } = req.query;

    const filter = {
      type: "DAILY",
      isActive: true,
    };

    // Optional date filter
    if (date) {
      const start = new Date(date);

      if (isNaN(start.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date",
        });
      }

      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      filter.resultDate = {
        $gte: start,
        $lt: end,
      };
    }

    const images = await ResultImage.find(filter)
      .sort({
        sortOrder: 1,
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: images.length,
      data: images,
    });
  } catch (error) {
    console.error("Get Daily Result Images Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get daily result images",
    });
  }
};

// =====================================================
// GET FESTIVAL RESULT IMAGES
// =====================================================

const getFestivalResultImages = async (req, res) => {
  try {
    const images = await ResultImage.find({
      type: "FESTIVAL",
      isActive: true,
    })
      .sort({
        sortOrder: 1,
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: images.length,
      data: images,
    });
  } catch (error) {
    console.error("Get Festival Result Images Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get festival result images",
    });
  }
};

// =====================================================
// GET SINGLE RESULT IMAGE
// =====================================================

const getResultImageById = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await ResultImage.findById(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Result image not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: image,
    });
  } catch (error) {
    console.error("Get Result Image Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get result image",
    });
  }
};

// =====================================================
// UPDATE RESULT IMAGE
// IMAGE IS OPTIONAL
// =====================================================

const updateResultImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await ResultImage.findById(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Result image not found",
      });
    }

    const {
      title,
      type,
      festivalName,
      resultDate,
      isActive,
      sortOrder,
    } = req.body;

    // ---------------------------------------------
    // UPDATE TYPE
    // ---------------------------------------------

    if (type !== undefined) {
      const imageType = String(type).toUpperCase();

      if (!["DAILY", "FESTIVAL"].includes(imageType)) {
        return res.status(400).json({
          success: false,
          message: "Type must be DAILY or FESTIVAL",
        });
      }

      image.type = imageType;
    }

    // ---------------------------------------------
    // UPDATE BASIC FIELDS
    // ---------------------------------------------

    if (title !== undefined) {
      image.title = title;
    }

    if (festivalName !== undefined) {
      image.festivalName = festivalName;
    }

    if (resultDate !== undefined) {
      image.resultDate = resultDate || null;
    }

    if (isActive !== undefined) {
      image.isActive =
        String(isActive) === "true";
    }

    if (sortOrder !== undefined) {
      image.sortOrder = Number(sortOrder) || 0;
    }

    // ---------------------------------------------
    // NEW IMAGE
    // ---------------------------------------------

    if (req.file) {
      const uploaded = await uploadToImgBB(req.file);

      image.imageUrl = uploaded.imageUrl;
      image.displayUrl = uploaded.displayUrl;
      image.thumbUrl = uploaded.thumbUrl;
      image.deleteUrl = uploaded.deleteUrl;
    }

    // ---------------------------------------------
    // FINAL VALIDATION
    // ---------------------------------------------

    if (
      image.type === "FESTIVAL" &&
      !image.festivalName
    ) {
      return res.status(400).json({
        success: false,
        message: "Festival name is required",
      });
    }

    if (
      image.type === "DAILY" &&
      !image.resultDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Result date is required for daily result",
      });
    }

    if (image.type === "DAILY") {
      image.festivalName = "";
    }

    if (image.type === "FESTIVAL") {
      image.resultDate = null;
    }

    await image.save();

    return res.status(200).json({
      success: true,
      message: "Result image updated successfully",
      data: image,
    });
  } catch (error) {
    console.error("Update Result Image Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update result image",
    });
  }
};

// =====================================================
// DELETE RESULT IMAGE
// =====================================================

const deleteResultImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await ResultImage.findById(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Result image not found",
      });
    }

    await ResultImage.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Result image deleted successfully",
    });
  } catch (error) {
    console.error("Delete Result Image Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete result image",
    });
  }
};

// =====================================================
// TOGGLE ACTIVE / INACTIVE
// =====================================================

const toggleResultImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await ResultImage.findById(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Result image not found",
      });
    }

    image.isActive = !image.isActive;

    await image.save();

    return res.status(200).json({
      success: true,
      message: `Result image ${
        image.isActive ? "activated" : "deactivated"
      } successfully`,
      data: image,
    });
  } catch (error) {
    console.error("Toggle Result Image Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to toggle result image",
    });
  }
};

module.exports = {
  createResultImage,
  getAllResultImages,
  getDailyResultImages,
  getFestivalResultImages,
  getResultImageById,
  updateResultImage,
  deleteResultImage,
  toggleResultImage,
};