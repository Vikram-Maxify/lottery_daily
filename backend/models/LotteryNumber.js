const mongoose = require("mongoose");

const lotteryNumberSchema = new mongoose.Schema(
  {
    // Example: 10A78965
    number: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
      match: /^\d{2}[A-Z]\d{5}$/,
    },

    // Example: 2026-10-03
    batchDate: {
      type: String,
      required: true,
      index: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    status: {
      type: String,
      enum: ["available", "sold"],
      default: "available",
      index: true,
    },

    betCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    soldAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// IMPORTANT:
// number globally unique hona chahiye.
// Isliye old aur new kisi bhi batch me same number allowed nahi hoga.
lotteryNumberSchema.index(
  { number: 1 },
  { unique: true }
);

lotteryNumberSchema.index({
  batchDate: 1,
  status: 1,
});

module.exports = mongoose.model(
  "LotteryNumber",
  lotteryNumberSchema
);