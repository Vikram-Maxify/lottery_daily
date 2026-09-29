const mongoose = require("mongoose");

// =====================================================
// WINNER SCHEMA
// =====================================================
// Har winner ke saath:
// - userId       (kis user ne jeeta)
// - userNumber   (uska 6-digit number)
// - amount       (usne kitna paisa lagaya tha)
// - prizeType    ("1st" / "2nd" / "3rd")
// - matchedDigits (4 / 5 / 6)
// - prize        (object: { first, second, third } — actual amounts)
// - prizeAmount  (total prize amount jo wallet me credit hua)
// =====================================================

const winnerSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    userNumber: {
      type: String,
      required: true,
      match: /^\d{6}$/,
    },

    // ✅ ADDED: user ne kitna amount lagaya tha
    amount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Prize category
    prizeType: {
      type: String,
      enum: ["1st", "2nd", "3rd"],
      required: true,
    },

    // ✅ ADDED: Prize amount breakdown object
    prize: {
      first: {
        type: Number,
        default: 0,
        min: 0,
      },
      second: {
        type: Number,
        default: 0,
        min: 0,
      },
      third: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    // ✅ ADDED: Total prize amount (wallet me jo credit hua)
    prizeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    matchedDigits: {
      type: Number,
      enum: [4, 5, 6],
      required: true,
    },

    // Backward-compat: purana code `prize` ko string samajh sakta hai
    // (controller me `prize: match.prize` bhi set hota tha)
    // Isliye ek virtual alias bhi de dete hain.
  },
  {
    _id: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// =====================================================
// VIRTUAL: prizeLabel
// =====================================================
// Purana controller `winner.prize` ko string ki tarah use karta tha
// (jaise `"1st"`, `"2nd"`, `"3rd"`). Ab `prize` ek object hai,
// to ek virtual field `prizeLabel` bana dete hain jo wahi string de.
// =====================================================

winnerSchema.virtual("prizeLabel").get(function () {
  return this.prizeType || null;
});

// =====================================================
// LOTTERY RESULT SCHEMA
// =====================================================

const lotteryResultSchema = new mongoose.Schema(
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

    winningNumber: {
      type: String,
      required: true,
      match: /^\d{6}$/,
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

// =====================================================
// UNIQUE: Ek config ke ek date ka sirf ek result
// =====================================================

lotteryResultSchema.index(
  {
    lotteryConfigId: 1,
    date: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "LotteryResult",
  lotteryResultSchema
);