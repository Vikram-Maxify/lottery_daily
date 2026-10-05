const express = require("express");

const router = express.Router();

const {
  getReferralPercentage,
  setReferralPercentage,
} = require("../controllers/referralSettingController");

// Get current referral percentage
router.get(
  "/referral-percentage",
  getReferralPercentage
);

// Set / update referral percentage
router.put(
  "/referral-percentage",
  setReferralPercentage
);

module.exports = router;