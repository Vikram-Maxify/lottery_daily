const mongoose = require("mongoose");

const lotteryEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    configId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LotteryConfig",
      required: true,
      index: true,
    },

    depositId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deposit",
      default: null,
      index: true,
    },

    orderId: {
      type: String,
      default: "",
      index: true,
    },

    uid: { type: String, default: "" },
    phone: { type: String, default: "" },
    username: { type: String, default: "" },

    number: {
      type: String,
      required: true,
      validate: {
        validator: function (value) {
          return /^\d{6}$/.test(String(value));
        },
        message: "Lottery number must be exactly 6 digits",
      },
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: Number,
      enum: [0, 1, 2, 3],
      default: 1,
    },
  },
  { timestamps: true }
);

// Prevent duplicate number per config per user
lotteryEntrySchema.index(
  { userId: 1, configId: 1, number: 1 },
  { unique: true }
);

module.exports = mongoose.model("LotteryEntry", lotteryEntrySchema);