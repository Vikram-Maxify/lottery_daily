const mongoose = require("mongoose");

// =====================================================
// USER LOTTERY ENTRY SCHEMA
// =====================================================

const lotteryUserEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    // Date on which user purchased the ticket
    // YYYY-MM-DD
    entryDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    // 6 digit lottery number
    number: {
      type: String,
      required: true,
      match: /^\d{6}$/,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    isBuy: {
      type: Boolean,
      default: false,
      index: true,
    },

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

    prizeType: {
      type: String,
      enum: ["1st", "2nd", "3rd", null],
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "win", "lost"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// LOTTERY CONFIG SCHEMA
// =====================================================

const lotteryConfigSchema = new mongoose.Schema(
  {
    // ================================================
    // MARKET NAME
    // ================================================

    marketName: {
      type: String,
      required: true,
      trim: true,
    },

    // ================================================
    // MONTH (1 - 12)
    // ================================================

    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
      index: true,
    },

    // ================================================
    // YEAR (e.g. 2026)
    // ================================================

    year: {
      type: Number,
      required: true,
      min: 2000,
      index: true,
    },

    // ================================================
    // EXACT DRAW DATE
    // Example:
    // 2026-09-20
    // ================================================

    drawDate: {
      type: Date,
      required: true,
      index: true,
    },

    // ================================================
    // DRAW TIME
    // HH:mm
    // Example: 18:30
    // ================================================

    drawTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    // ================================================
    // PRIZES
    // ================================================

    prizes: {
      first: {
        type: Number,
        required: true,
        min: 0,
      },

      second: {
        type: Number,
        required: true,
        min: 0,
      },

      third: {
        type: Number,
        required: true,
        min: 0,
      },
    },

    // ================================================
    // USER ENTRIES
    // ================================================

    users: {
      type: [lotteryUserEntrySchema],
      default: [],
    },

    // ================================================
    // ACTIVE STATUS
    // ================================================

    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// UNIQUE MARKET + DRAW DATE
// =====================================================
// Same market ke same date par 2 lottery nahi banegi.
//
// Example:
//
// Delhi Lottery + 2026-09-20 = allowed
// Delhi Lottery + 2026-09-20 = duplicate ❌
//
// Delhi Lottery + 2026-09-21 = allowed
// =====================================================

lotteryConfigSchema.index(
  {
    marketName: 1,
    drawDate: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "LotteryConfig",
  lotteryConfigSchema
);