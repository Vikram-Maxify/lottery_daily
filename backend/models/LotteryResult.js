const mongoose = require("mongoose");

const winnerSchema = new mongoose.Schema(
  {
    userId: { type: String, default: null },
    userNumber: { type: String, required: true },
    matchedNumber: { type: String, default: null },
    amount: { type: Number, default: 0 },
    prizeType: { type: String, enum: ["1st", "2nd", "3rd", "4th", "5th"], default: null },
    matchedDigits: { type: Number, default: 0 },
    prize: {
      first: { type: Number, default: 0 },
      second: { type: Number, default: 0 },
      third: { type: Number, default: 0 },
      fourth: { type: Number, default: 0 },
      fifth: { type: Number, default: 0 },
    },
    prizeAmount: { type: Number, default: 0 },
  },
  { _id: false }
);

const lotteryResultSchema = new mongoose.Schema(
  {
    lotteryConfigId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LotteryConfig",
      required: true,
    },
    date: { type: String, required: true },

    // NEW: multi winning numbers
    winningNumbers: {
      first: { type: String, default: null },
      second: { type: [String], default: [] },
      third: { type: [String], default: [] },
      fourth: { type: [String], default: [] },
      fifth: { type: [String], default: [] },
    },

    // Legacy support (first prize only)
    winningNumber: { type: String, default: null },

    winners: { type: [winnerSchema], default: [] },
    isPublished: { type: Boolean, default: false },
    createdBy: { type: String, default: null },
  },
  { timestamps: true }
);

lotteryResultSchema.index({ lotteryConfigId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("LotteryResult", lotteryResultSchema);