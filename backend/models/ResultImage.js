const mongoose = require("mongoose");

const resultImageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "",
    },

    type: {
      type: String,
      enum: ["DAILY", "FESTIVAL"],
      required: true,
      index: true,
    },

    imageUrl: {
      type: String,
      required: true,
    },

    displayUrl: {
      type: String,
      default: "",
    },

    thumbUrl: {
      type: String,
      default: "",
    },

    deleteUrl: {
      type: String,
      default: "",
    },

    festivalName: {
      type: String,
      trim: true,
      default: "",
    },

    resultDate: {
      type: Date,
      default: null,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ResultImage", resultImageSchema);