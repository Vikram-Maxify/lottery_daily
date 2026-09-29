const Deposit = require("../models/Deposit");
const User = require("../models/userModel");
const mongoose = require("mongoose");

// =====================================================
// GET ALL DEPOSITS (PAGINATED + FILTERS)
// =====================================================

const getAllDeposits = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    const query = {};

    // Status filter (0 = pending, 1 = success, 2 = failed)
    if (status !== undefined && status !== "") {
      query.status = Number(status);
    }

    // Search filter
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { uid: { $regex: search, $options: "i" } },
        { utr: { $regex: search, $options: "i" } },
        { transactionId: { $regex: search, $options: "i" } },
        { number: { $regex: search, $options: "i" } },
      ];
    }

    const [deposits, total] = await Promise.all([
      Deposit.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name mobile uuid wallet")
        .populate("configId", "marketName")
        .lean(),
      Deposit.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: deposits,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get all deposits error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch deposits",
      error: error.message,
    });
  }
};

// =====================================================
// GET SINGLE DEPOSIT
// =====================================================

const getSingleDeposit = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid deposit ID",
      });
    }

    const deposit = await Deposit.findById(id)
      .populate("userId", "name mobile uuid wallet")
      .populate("configId", "marketName prizes")
      .populate("gatewayId")
      .lean();

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found",
      });
    }

    res.status(200).json({
      success: true,
      data: deposit,
    });
  } catch (error) {
    console.error("Get single deposit error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch deposit",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE DEPOSIT STATUS
// 0 = pending, 1 = success, 2 = failed
// =====================================================

const updateDepositStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminRemark } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid deposit ID",
      });
    }

    if (status === undefined || status === null) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const statusNum = Number(status);

    if (![0, 1, 2].includes(statusNum)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Use 0 (pending), 1 (success), or 2 (failed)",
      });
    }

    const deposit = await Deposit.findById(id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found",
      });
    }

    // Prevent duplicate wallet credit
    const wasAlreadySuccess = deposit.status === 1;

    deposit.status = statusNum;
    if (adminRemark !== undefined) {
      deposit.adminRemark = adminRemark;
    }

    await deposit.save();

    // =====================================================
    // WALLET CREDIT LOGIC
    // Jab status 0 → 1 ho, tab user ke wallet me amount add karo
    // =====================================================
    let walletUpdated = false;

    if (statusNum === 1 && !wasAlreadySuccess && deposit.userId) {
      try {
        const user = await User.findById(deposit.userId);

        if (user) {
          user.wallet = (user.wallet || 0) + Number(deposit.amount || 0);
          await user.save();
          walletUpdated = true;
        }
      } catch (walletError) {
        console.error("Wallet credit error:", walletError);
        // Deposit update ho gaya, lekin wallet fail hua
        // Isko log karo but response fail mat karo
      }
    }

    res.status(200).json({
      success: true,
      message: `Deposit status updated to ${
        statusNum === 0
          ? "pending"
          : statusNum === 1
          ? "success"
          : "failed"
      }${walletUpdated ? " and wallet credited" : ""}`,
      data: deposit,
      walletUpdated,
    });
  } catch (error) {
    console.error("Update deposit error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update deposit",
      error: error.message,
    });
  }
};

// =====================================================
// GET DEPOSIT STATS
// =====================================================

const getDepositStats = async (req, res) => {
  try {
    const stats = await Deposit.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const formatted = {
      pending: { count: 0, totalAmount: 0 },
      success: { count: 0, totalAmount: 0 },
      failed: { count: 0, totalAmount: 0 },
      total: { count: 0, totalAmount: 0 },
    };

    stats.forEach((s) => {
      if (s._id === 0) formatted.pending = s;
      if (s._id === 1) formatted.success = s;
      if (s._id === 2) formatted.failed = s;

      formatted.total.count += s.count || 0;
      formatted.total.totalAmount += s.totalAmount || 0;
    });

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("Deposit stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch deposit stats",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE DEPOSIT (Optional — admin only)
// =====================================================

const deleteDeposit = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid deposit ID",
      });
    }

    const deposit = await Deposit.findByIdAndDelete(id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Deposit deleted successfully",
    });
  } catch (error) {
    console.error("Delete deposit error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete deposit",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  getAllDeposits,
  getSingleDeposit,
  updateDepositStatus,
  getDepositStats,
  deleteDeposit,
};