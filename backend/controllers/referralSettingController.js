const ReferralSetting = require("../models/ReferralSetting");

// =====================================================
// GET REFERRAL PERCENTAGE
// =====================================================
const getReferralPercentage = async (req, res) => {
  try {
    let setting = await ReferralSetting.findOne();

    // Create default setting if not exists
    if (!setting) {
      setting = await ReferralSetting.create({
        referralPercentage: 5,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Referral percentage fetched successfully",
      data: setting,
    });
  } catch (error) {
    console.error("Get referral percentage error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch referral percentage",
      error: error.message,
    });
  }
};

// =====================================================
// SET / UPDATE REFERRAL PERCENTAGE
// =====================================================
const setReferralPercentage = async (req, res) => {
  try {
    const { referralPercentage } = req.body;

    // Validate
    if (
      referralPercentage === undefined ||
      referralPercentage === null ||
      referralPercentage === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Referral percentage is required",
      });
    }

    const percentage = Number(referralPercentage);

    if (Number.isNaN(percentage)) {
      return res.status(400).json({
        success: false,
        message: "Referral percentage must be a valid number",
      });
    }

    if (percentage < 0 || percentage > 100) {
      return res.status(400).json({
        success: false,
        message: "Referral percentage must be between 0 and 100",
      });
    }

    // Find existing setting
    let setting = await ReferralSetting.findOne();

    if (setting) {
      setting.referralPercentage = percentage;
      await setting.save();
    } else {
      setting = await ReferralSetting.create({
        referralPercentage: percentage,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Referral percentage updated successfully",
      data: setting,
    });
  } catch (error) {
    console.error("Set referral percentage error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update referral percentage",
      error: error.message,
    });
  }
};

module.exports = {
  getReferralPercentage,
  setReferralPercentage,
};