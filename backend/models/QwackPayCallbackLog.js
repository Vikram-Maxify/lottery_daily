const mongoose = require("mongoose");

const qwackPayCallbackLogSchema =
  new mongoose.Schema(
    {
      merchantOrderId: {
        type: String,
        default: "",
        index: true,
      },

      qwackOrderId: {
        type: String,
        default: "",
        index: true,
      },

      amount: {
        type: Number,
        default: 0,
      },

      gatewayStatus: {
        type: String,
        default: "",
      },

      utr: {
        type: String,
        default: "",
      },

      sign: {
        type: String,
        default: "",
      },

      signValid: {
        type: Boolean,
        default: false,
      },

      method: {
        type: String,
        default: "",
      },

      url: {
        type: String,
        default: "",
      },

      ip: {
        type: String,
        default: "",
      },

      body: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },

      headers: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },

      event: {
        type: String,
        default: "RECEIVED",
      },

      processingStatus: {
        type: String,
        default: "RECEIVED",
      },

      message: {
        type: String,
        default: "",
      },

      error: {
        type: String,
        default: "",
      },

      depositId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Deposit",
        default: null,
      },

      processedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.model(
    "QwackPayCallbackLog",
    qwackPayCallbackLogSchema
  );