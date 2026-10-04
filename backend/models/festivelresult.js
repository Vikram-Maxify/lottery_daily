const mongoose = require("mongoose");

// =====================================================
// WINNER SCHEMA
// =====================================================
// Har winner ke saath:
// - userId       (kis user ne jeeta)
// - userNumber   (uska 8-digit number)
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
      match: /^\d{8}$/,
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

winnerSchema.virtual("prizeLabel").get(function () {
  return this.prizeType || null;
});

// =====================================================
// FESTIVAL SCHEMA
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

    winningNumber: {
      type: String,
      required: true,
      match: /^\d{8}$/,
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
// UNIQUE: Ek config ke ek date ka sirf ek festival result result
// =====================================================

festivalresultSchema.index(
  {
    lotteryConfigId: 1,
    date: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("Festival result", festivalresultSchema);