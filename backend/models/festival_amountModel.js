const mongoose = require("mongoose");

const festivalamountSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    updatedBy: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("FestivalAmount", festivalamountSchema);