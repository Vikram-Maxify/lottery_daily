const User = require("../models/userModel");
const Deposit = require("../models/Deposit");
const LotteryConfig = require("../models/LotteryConfig");
const LotteryResult = require("../models/LotteryResult");

// =====================================================
// GET DASHBOARD STATS
// =====================================================

const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    // ===============================================
    // TOTAL USERS
    // ===============================================
    const totalUsers = await User.countDocuments({
      role: "user",
    });

    // ===============================================
    // TOTAL DEPOSIT AMOUNT (SUCCESS ONLY)
    // ===============================================
    const totalDepositAgg = await Deposit.aggregate([
      {
        $match: {
          status: 1,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const totalDeposit =
      totalDepositAgg.length > 0
        ? totalDepositAgg[0].total
        : 0;

    // ===============================================
    // TOTAL CONFIGS
    // ===============================================
    const totalConfigs =
      await LotteryConfig.countDocuments();

    // ===============================================
    // TOTAL ENTRIES (ACROSS ALL CONFIGS)
    // ===============================================
    const totalEntriesAgg =
      await LotteryConfig.aggregate([
        {
          $project: {
            count: { $size: "$users" },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$count" },
          },
        },
      ]);

    const totalEntries =
      totalEntriesAgg.length > 0
        ? totalEntriesAgg[0].total
        : 0;

    // ===============================================
    // TOTAL RESULTS
    // ===============================================
    const totalResults =
      await LotteryResult.countDocuments();

    // ===============================================
    // TODAY'S RESULTS
    // ===============================================
    const todayResults =
      await LotteryResult.countDocuments({
        date: {
          $gte: startOfDay,
          $lt: endOfDay,
        },
      });

    // ===============================================
    // TODAY'S DEPOSITS
    // ===============================================
    const todayDepositAgg = await Deposit.aggregate([
      {
        $match: {
          status: 1,
          createdAt: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const todayDeposit =
      todayDepositAgg.length > 0
        ? todayDepositAgg[0].total
        : 0;

    // ===============================================
    // RESPONSE
    // ===============================================
    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalDeposit,
        totalConfigs,
        totalEntries,
        totalResults,
        todayResults,
        todayDeposit,
      },
    });
  } catch (error) {
    console.error(
      "Dashboard stats error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
};