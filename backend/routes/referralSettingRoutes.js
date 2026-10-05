const express = require("express");

const router = express.Router();

const {
  getAllSettings,
  updateAllSettings,
  getReferralPercentage,
  setReferralPercentage,
} = require("../controllers/referralSettingController");

// =====================================================
// ALL SETTINGS (Daily Amount, Festival Amount, Referral %)
// =====================================================
router.get("/", getAllSettings);
router.put("/", updateAllSettings);

// =====================================================
// SPECIFIC REFERRAL PERCENTAGE
// =====================================================
router.get("/referral-percentage", getReferralPercentage);
router.put("/referral-percentage", setReferralPercentage);

module.exports = router;