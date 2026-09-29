const LotteryConfig = require("../models/LotteryConfig");
const Deposit = require("../models/Deposit");
const mongoose = require("mongoose");

// =====================================================
// GET ALL ENTRIES (ACROSS ALL CONFIGS) - PAGINATED
// =====================================================

const getAllEntries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const status = req.query.status;
    const skip = (page - 1) * limit;

    // Build match stage
    const matchStage = {};

    const pipeline = [
      { $unwind: "$users" },
      {
        $addFields: {
          "users.marketName": "$marketName",
          "users.configId": "$_id",
          "users.configDate": "$date",
          "users.configMonth": "$month",
          "users.configYear": "$year",
        },
      },
      { $replaceRoot: { newRoot: "$users" } },
    ];

    // Add search filter
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { userId: { $regex: search, $options: "i" } },
            { number: { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // Add status filter
    if (status) {
      pipeline.push({
        $match: { status: status },
      });
    }

    // Add sort
    pipeline.push({ $sort: { createdAt: -1 } });

    // Get total count
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await LotteryConfig.aggregate(
      countPipeline
    );
    const total =
      countResult.length > 0 ? countResult[0].total : 0;

    // Add pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const entries = await LotteryConfig.aggregate(pipeline);

    res.status(200).json({
      success: true,
      data: entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get all entries error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch entries",
      error: error.message,
    });
  }
};

// =====================================================
// GET ENTRIES BY CONFIG ID
// =====================================================

const getEntriesByConfig = async (req, res) => {
  try {
    const { configId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const config = await LotteryConfig.findById(configId);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Config not found",
      });
    }

    const total = config.users.length;
    const entries = config.users
      .sort(
        (a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
      )
      .slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      data: {
        config: {
          _id: config._id,
          marketName: config.marketName,
          date: config.date,
          month: config.month,
          year: config.year,
          prizes: config.prizes,
          isActive: config.isActive,
        },
        entries,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get entries by config error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch entries",
      error: error.message,
    });
  }
};

// =====================================================
// GET ENTRY STATS
// =====================================================

const getEntryStats = async (req, res) => {
  try {
    const stats = await LotteryConfig.aggregate([
      { $unwind: "$users" },
      {
        $group: {
          _id: "$users.status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$users.amount" },
        },
      },
    ]);

    const formatted = {
      pending: { count: 0, totalAmount: 0 },
      win: { count: 0, totalAmount: 0 },
      lost: { count: 0, totalAmount: 0 },
    };

    stats.forEach((s) => {
      if (s._id === "pending") formatted.pending = s;
      if (s._id === "win") formatted.win = s;
      if (s._id === "lost") formatted.lost = s;
    });

    // Total entries
    const totalAgg = await LotteryConfig.aggregate([
      {
        $project: {
          count: { $size: "$users" },
          amount: {
            $sum: "$users.amount",
          },
        },
      },
      {
        $group: {
          _id: null,
          totalCount: { $sum: "$count" },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const total =
      totalAgg.length > 0
        ? totalAgg[0]
        : { totalCount: 0, totalAmount: 0 };

    res.status(200).json({
      success: true,
      data: {
        ...formatted,
        total,
      },
    });
  } catch (error) {
    console.error("Entry stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch entry stats",
      error: error.message,
    });
  }
};

module.exports = {
  getAllEntries,
  getEntriesByConfig,
  getEntryStats,
};