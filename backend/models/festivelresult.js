const mongoose = require("mongoose");

// =====================================================
// WINNER SCHEMA
// =====================================================
const winnerSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },

    userNumber: {
      type: String,
      required: true,
      match: /^[0-9]{2}[A-Z][0-9]{5}$/,
    },

    // ✅ which winning number matched
    matchedNumber: { type: String, default: null },

    amount: { type: Number, default: 0, min: 0 },

    prizeType: {
      type: String,
      enum: ["1st", "2nd", "3rd", "4th", "5th"],
      required: true,
    },

    prize: {
      first: { type: Number, default: 0, min: 0 },
      second: { type: Number, default: 0, min: 0 },
      third: { type: Number, default: 0, min: 0 },
      fourth: { type: Number, default: 0, min: 0 },
      fifth: { type: Number, default: 0, min: 0 },
    },

    prizeAmount: { type: Number, default: 0, min: 0 },

    // ✅ 1st=8, 2nd=5, 3rd=4, 4th=4, 5th=3
    matchedDigits: {
      type: Number,
      enum: [3, 4, 5, 8],
      required: true,
    },
  },
  {
    _id: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

winnerSchema.virtual("prizeLabel").get(function () {
  return this.prizeType || null;
});

// =====================================================
// FESTIVAL RESULT SCHEMA
// =====================================================
const festivalresultSchema = new mongoose.Schema(
  {
    lotteryConfigId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LotteryConfig",
      required: true,
      index: true,
    },

    date: { type: Date, required: true, index: true },

    // ✅ NEW: multi winning numbers per prize
    winningNumbers: {
      first: { type: String, default: null },
      second: { type: [String], default: [] },
      third: { type: [String], default: [] },
      fourth: { type: [String], default: [] },
      fifth: { type: [String], default: [] },
    },

    // ✅ Legacy single number (kept for backward compat)
    winningNumber: {
      type: String,
      default: null,
      match: /^[0-9]{2}[A-Z][0-9]{5}$/,
    },

    winners: { type: [winnerSchema], default: [] },
    isPublished: { type: Boolean, default: false },
    createdBy: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

festivalresultSchema.index(
  { lotteryConfigId: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model("Festival result", festivalresultSchema);