const mongoose = require("mongoose");

const referralSettingSchema = new mongoose.Schema(
  {
    referralPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 5,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "ReferralSetting",
  referralSettingSchema
);