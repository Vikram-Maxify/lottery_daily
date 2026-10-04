const mongoose = require("mongoose");

// =====================================================
// WINNER SCHEMA
// =====================================================

const winnerSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    // ✅ 8-char alphanumeric: 2 digits + 1 letter + 5 digits
    userNumber: {
      type: String,
      required: true,
      match: /^[0-9]{2}[A-Z][0-9]{5}$/,
    },

    amount: {
      type: Number,
      default: 0,
      min: 0,
    },

    prizeType: {
      type: String,
      enum: ["1st", "2nd", "3rd"],
      required: true,
    },

    prize: {
      first: { type: Number, default: 0, min: 0 },
      second: { type: Number, default: 0, min: 0 },
      third: { type: Number, default: 0, min: 0 },
    },

    prizeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ✅ 1st=8, 2nd=7, 3rd=5
    matchedDigits: {
      type: Number,
      enum: [5, 7, 8],
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

    date: {
      type: Date,
      required: true,
      index: true,
    },

    // ✅ 8-char alphanumeric: 2 digits + 1 letter + 5 digits
    winningNumber: {
      type: String,
      required: true,
      match: /^[0-9]{2}[A-Z][0-9]{5}$/,
    },

    winners: {
      type: [winnerSchema],
      default: [],
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: String,
      required: true,
    },
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