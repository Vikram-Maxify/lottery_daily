const ReferralSetting = require("../models/ReferralSetting");
const Amount = require("../models/amountModel");
const FestivalAmount = require("../models/festival_amountModel");

// =====================================================
// GET ALL SETTINGS (Daily Amount, Festival Amount, Referral %)
// =====================================================
const getAllSettings = async (req, res) => {
  try {
    // 1. Daily Amount
    let dailyData = await Amount.findOne();
    if (!dailyData) {
      dailyData = await Amount.create({ amount: 0 });
    }

    // 2. Festival Amount
    let festivalData = await FestivalAmount.findOne();
    if (!festivalData) {
      festivalData = await FestivalAmount.create({ amount: 0 });
    }

    // 3. Referral Setting
    let referralData = await ReferralSetting.findOne();
    if (!referralData) {
      referralData = await ReferralSetting.create({ referralPercentage: 5 });
    }

    return res.status(200).json({
      success: true,
      message: "All settings fetched successfully",
      data: {
        dailyLotteryAmount: dailyData.amount ?? 0,
        dailyUpdatedAt: dailyData.updatedAt ?? null,

        festivalLotteryAmount: festivalData.amount ?? 0,
        festivalUpdatedAt: festivalData.updatedAt ?? null,

        referralPercentage: referralData.referralPercentage ?? 5,
        referralUpdatedAt: referralData.updatedAt ?? null,
      },
    });
  } catch (error) {
    console.error("Get all settings error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch settings",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE ALL OR INDIVIDUAL SETTINGS
// =====================================================
const updateAllSettings = async (req, res) => {
  try {
    const {
      dailyLotteryAmount,
      festivalLotteryAmount,
      referralPercentage,
    } = req.body;

    const updatedBy = req.user?.uuid || null;

    // 1. Validate & Update Daily Lottery Amount
    if (dailyLotteryAmount !== undefined && dailyLotteryAmount !== null) {
      const dailyNum = Number(dailyLotteryAmount);
      if (isNaN(dailyNum) || dailyNum < 0) {
        return res.status(400).json({
          success: false,
          message: "Daily lottery amount must be a non-negative number",
        });
      }

      let dailyData = await Amount.findOne();
      if (!dailyData) {
        await Amount.create({ amount: dailyNum, updatedBy });
      } else {
        dailyData.amount = dailyNum;
        dailyData.updatedBy = updatedBy;
        await dailyData.save();
      }
    }

    // 2. Validate & Update Festival Lottery Amount
    if (festivalLotteryAmount !== undefined && festivalLotteryAmount !== null) {
      const festivalNum = Number(festivalLotteryAmount);
      if (isNaN(festivalNum) || festivalNum < 0) {
        return res.status(400).json({
          success: false,
          message: "Festival lottery amount must be a non-negative number",
        });
      }

      let festivalData = await FestivalAmount.findOne();
      if (!festivalData) {
        await FestivalAmount.create({ amount: festivalNum, updatedBy });
      } else {
        festivalData.amount = festivalNum;
        festivalData.updatedBy = updatedBy;
        await festivalData.save();
      }
    }

    // 3. Validate & Update Referral Percentage
    if (referralPercentage !== undefined && referralPercentage !== null) {
      const refNum = Number(referralPercentage);
      if (isNaN(refNum) || refNum < 0 || refNum > 100) {
        return res.status(400).json({
          success: false,
          message: "Referral percentage must be between 0 and 100",
        });
      }

      let referralData = await ReferralSetting.findOne();
      if (!referralData) {
        await ReferralSetting.create({ referralPercentage: refNum });
      } else {
        referralData.referralPercentage = refNum;
        await referralData.save();
      }
    }

    // Fetch refreshed data
    const dailyData = await Amount.findOne();
    const festivalData = await FestivalAmount.findOne();
    const referralData = await ReferralSetting.findOne();

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: {
        dailyLotteryAmount: dailyData?.amount ?? 0,
        dailyUpdatedAt: dailyData?.updatedAt ?? null,

        festivalLotteryAmount: festivalData?.amount ?? 0,
        festivalUpdatedAt: festivalData?.updatedAt ?? null,

        referralPercentage: referralData?.referralPercentage ?? 5,
        referralUpdatedAt: referralData?.updatedAt ?? null,
      },
    });
  } catch (error) {
    console.error("Update settings error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update settings",
      error: error.message,
    });
  }
};

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
  getAllSettings,
  updateAllSettings,
  getReferralPercentage,
  setReferralPercentage,
};