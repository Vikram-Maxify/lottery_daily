const mongoose = require("mongoose");

const lotteryNumberSchema = new mongoose.Schema(
  {
    number: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    batchDate: {
      type: String, // "YYYY-MM-DD"
      required: true,
      index: true,
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
    },
    soldAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Speed up common queries
lotteryNumberSchema.index({ batchDate: 1, status: 1 });

module.exports = mongoose.model(
  "LotteryNumber",
  lotteryNumberSchema
);