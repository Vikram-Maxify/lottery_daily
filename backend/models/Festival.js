const mongoose = require("mongoose");

const lotteryUserEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    entryDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    number: {
      type: String,
      required: true,
      trim: true,
      match: /^[a-zA-Z0-9]{8}$/,
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
      fourth: {
        type: Number,
        default: 0,
        min: 0,
      },
      fifth: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    prizeType: {
      type: String,
      enum: ["1st", "2nd", "3rd", "4th", "5th", null],
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
  },
);

const festivalSchema = new mongoose.Schema(
  {
    marketName: {
      type: String,
      required: true,
      trim: true,
    },

    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
      index: true,
    },

    imageUrl: {
      type: String,
      trim: true,
    },

    year: {
      type: Number,
      required: true,
      min: 2000,
      index: true,
    },

    drawDate: {
      type: Date,
      required: true,
      index: true,
    },

    drawTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

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
      fourth: {
        type: Number,
        required: true,
        min: 0,
      },
      fifth: {
        type: Number,
        required: true,
        min: 0,
      },
    },

    users: {
      type: [lotteryUserEntrySchema],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

festivalSchema.index(
  {
    marketName: 1,
    drawDate: 1,
  },
  {
    unique: true,
  },
);

module.exports = mongoose.model("Festival", festivalSchema);
