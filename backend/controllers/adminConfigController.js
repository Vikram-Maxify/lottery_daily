const LotteryConfig = require("../models/LotteryConfig");
const Deposit = require("../models/Deposit");

// =====================================================
// GET ALL CONFIGS (PAGINATED)
// =====================================================

const getAllConfigs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const isActive = req.query.isActive;
    const skip = (page - 1) * limit;

    const query = {};

    if (search) {
      query.marketName = { $regex: search, $options: "i" };
    }

    if (isActive !== undefined && isActive !== "") {
      query.isActive = isActive === "true";
    }

    const [configs, total] = await Promise.all([
      LotteryConfig.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LotteryConfig.countDocuments(query),
    ]);

    // Add entry count to each config
    const configsWithCount = configs.map((c) => ({
      ...c,
      entryCount: c.users ? c.users.length : 0,
    }));

    res.status(200).json({
      success: true,
      data: configsWithCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get all configs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch configs",
      error: error.message,
    });
  }
};

// =====================================================
// GET SINGLE CONFIG (WITH ENTRIES)
// =====================================================

const getSingleConfig = async (req, res) => {
  try {
    const config = await LotteryConfig.findById(
      req.params.id
    ).lean();

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Config not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...config,
        entryCount: config.users ? config.users.length : 0,
      },
    });
  } catch (error) {
    console.error("Get single config error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch config",
      error: error.message,
    });
  }
};

// =====================================================
// CREATE CONFIG
// =====================================================

const createConfig = async (req, res) => {
  try {
    const {
      marketName,
      date,
      month,
      year,
      prizes,
      isActive,
    } = req.body;

    if (!marketName || !date || !month || !year || !prizes) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existing = await LotteryConfig.findOne({
      marketName,
      month,
      year,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message:
          "Config already exists for this market and month/year",
      });
    }

    const config = await LotteryConfig.create({
      marketName,
      date,
      month,
      year,
      prizes,
      isActive: isActive || false,
      users: [],
    });

    res.status(201).json({
      success: true,
      message: "Config created successfully",
      data: config,
    });
  } catch (error) {
    console.error("Create config error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create config",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE CONFIG
// =====================================================

const updateConfig = async (req, res) => {
  try {
    const config = await LotteryConfig.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Config not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Config updated successfully",
      data: config,
    });
  } catch (error) {
    console.error("Update config error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update config",
      error: error.message,
    });
  }
};

// =====================================================
// TOGGLE CONFIG ACTIVE STATUS
// =====================================================

const toggleConfigActive = async (req, res) => {
  try {
    const config = await LotteryConfig.findById(req.params.id);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Config not found",
      });
    }

    config.isActive = !config.isActive;
    await config.save();

    res.status(200).json({
      success: true,
      message: `Config ${config.isActive ? "activated" : "deactivated"}`,
      data: config,
    });
  } catch (error) {
    console.error("Toggle config error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle config",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE CONFIG
// =====================================================

const deleteConfig = async (req, res) => {
  try {
    const config = await LotteryConfig.findByIdAndDelete(
      req.params.id
    );

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Config not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Config deleted successfully",
    });
  } catch (error) {
    console.error("Delete config error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete config",
      error: error.message,
    });
  }
};

module.exports = {
  getAllConfigs,
  getSingleConfig,
  createConfig,
  updateConfig,
  toggleConfigActive,
  deleteConfig,
};