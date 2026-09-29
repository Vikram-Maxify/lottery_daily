const User = require("../models/userModel");

// =====================================================
// GET ALL USERS (PAGINATED)
// =====================================================

const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    const query = { role: "user" };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { uuid: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

// =====================================================
// GET SINGLE USER
// =====================================================

const getSingleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get single user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE USER WALLET
// =====================================================

const updateUserWallet = async (req, res) => {
  try {
    const { amount, action } = req.body;

    if (!amount || !action) {
      return res.status(400).json({
        success: false,
        message: "Amount and action are required",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (action === "add") {
      user.wallet += Number(amount);
    } else if (action === "subtract") {
      if (user.wallet < Number(amount)) {
        return res.status(400).json({
          success: false,
          message: "Insufficient wallet balance",
        });
      }
      user.wallet -= Number(amount);
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Use 'add' or 'subtract'",
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Wallet updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Update wallet error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update wallet",
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  getSingleUser,
  updateUserWallet,
};