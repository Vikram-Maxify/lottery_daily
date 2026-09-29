const mongoose = require("mongoose");

const transactionHistorySchema =
  new mongoose.Schema(
    {
      userId: {
        type: String,
        required: true,
      },

      uid: {
        type: String,
        required: true,
      },

      phone: {
        type: String,
        required: true,
      },

      orderId: {
        type: String,
        default: "",
      },

      amount: {
        type: Number,
        required: true,
        default: 0,
      },

      type: {
        type: String,
        enum: [
          "Deposit",
          "Withdraw",
          "Investment",
          "Profit",
          "Referral Bonus",
          "Transfer",
          "Penalty",
          "Bonus",
          "Lottery Ticket",
          "Lottery Ticket Purchase",
        ],
        required: true,
      },

      status: {
        type: Number,

        enum: [0, 1, 2],

        default: 0,
      },

      remark: {
        type: String,
        default: "",
      },

      date: {
        type: Date,
        default: Date.now,
      },
    },

    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.model(
    "TransactionHistory",
    transactionHistorySchema
  );