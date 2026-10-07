const express = require("express");

const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  getAllSettings,
  updateAllSettings,
  getReferralPercentage,
  setReferralPercentage,
  getMyReferralDetails,
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

// =====================================================
// USER REFERRAL DETAILS & EARNINGS
// =====================================================
router.get("/my-referral", authMiddleware, getMyReferralDetails);

module.exports = router;