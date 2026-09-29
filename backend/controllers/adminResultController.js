const LotteryResult = require("../models/LotteryResult");
const LotteryConfig = require("../models/LotteryConfig");

// =====================================================
// GET ALL RESULTS (PAGINATED)
// =====================================================

const getAllResults = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const isPublished = req.query.isPublished;
    const skip = (page - 1) * limit;

    const query = {};

    if (search) {
      query.winningNumber = {
        $regex: search,
        $options: "i",
      };
    }

    if (isPublished !== undefined && isPublished !== "") {
      query.isPublished = isPublished === "true";
    }

    const [results, total] = await Promise.all([
      LotteryResult.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .populate("lotteryConfigId", "marketName")
        .lean(),
      LotteryResult.countDocuments(query),
    ]);

    // Add winner count
    const resultsWithCount = results.map((r) => ({
      ...r,
      winnerCount: r.winners ? r.winners.length : 0,
    }));

    res.status(200).json({
      success: true,
      data: resultsWithCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get all results error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch results",
      error: error.message,
    });
  }
};

// =====================================================
// GET SINGLE RESULT
// =====================================================

const getSingleResult = async (req, res) => {
  try {
    const result = await LotteryResult.findById(
      req.params.id
    )
      .populate("lotteryConfigId", "marketName prizes")
      .lean();

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...result,
        winnerCount: result.winners
          ? result.winners.length
          : 0,
      },
    });
  } catch (error) {
    console.error("Get single result error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch result",
      error: error.message,
    });
  }
};

// =====================================================
// CREATE RESULT
// =====================================================

const createResult = async (req, res) => {
  try {
    const {
      lotteryConfigId,
      date,
      winningNumber,
      winners,
      isPublished,
    } = req.body;

    if (
      !lotteryConfigId ||
      !date ||
      !winningNumber
    ) {
      return res.status(400).json({
        success: false,
        message:
          "lotteryConfigId, date, and winningNumber are required",
      });
    }

    if (!/^\d{6}$/.test(winningNumber)) {
      return res.status(400).json({
        success: false,
        message: "Winning number must be 6 digits",
      });
    }

    const config = await LotteryConfig.findById(
      lotteryConfigId
    );

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Lottery config not found",
      });
    }

    const existing = await LotteryResult.findOne({
      lotteryConfigId,
      date: new Date(date),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Result already exists for this date",
      });
    }

    const result = await LotteryResult.create({
      lotteryConfigId,
      date: new Date(date),
      winningNumber,
      winners: winners || [],
      isPublished: isPublished || false,
      createdBy: req.admin?._id || "admin",
    });

    res.status(201).json({
      success: true,
      message: "Result created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Create result error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create result",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE RESULT
// =====================================================

const updateResult = async (req, res) => {
  try {
    const result = await LotteryResult.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Result updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Update result error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update result",
      error: error.message,
    });
  }
};

// =====================================================
// TOGGLE RESULT PUBLISH STATUS
// =====================================================

const toggleResultPublish = async (req, res) => {
  try {
    const result = await LotteryResult.findById(
      req.params.id
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    result.isPublished = !result.isPublished;
    await result.save();

    res.status(200).json({
      success: true,
      message: `Result ${
        result.isPublished ? "published" : "unpublished"
      }`,
      data: result,
    });
  } catch (error) {
    console.error("Toggle result error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle result",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE RESULT
// =====================================================

const deleteResult = async (req, res) => {
  try {
    const result = await LotteryResult.findByIdAndDelete(
      req.params.id
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Result deleted successfully",
    });
  } catch (error) {
    console.error("Delete result error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete result",
      error: error.message,
    });
  }
};

module.exports = {
  getAllResults,
  getSingleResult,
  createResult,
  updateResult,
  toggleResultPublish,
  deleteResult,
};