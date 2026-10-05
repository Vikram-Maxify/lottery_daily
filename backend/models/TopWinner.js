const mongoose = require("mongoose");

const topWinnerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      required: true,
      trim: true,
    },

    ticketNumber: {
      type: String,
      required: true,
      trim: true,
    },

    winningAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    wonAt: {
      type: Date,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.TopWinner ||
  mongoose.model("TopWinner", topWinnerSchema);