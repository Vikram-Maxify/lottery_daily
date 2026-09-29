const mongoose = require("mongoose");

const adminGatewaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    mode: {
      type: String,
      required: true,
      enum: ["manual", "automatic"],
      default: "manual",
    },

    type: {
      type: String,
      required: function () {
        return this.mode === "manual";
      },
      enum: ["UPI", "Crypto", "Bank"],
    },

    minLimit: {
      type: Number,
      min: 0,
      default: 100,
    },

    maxLimit: {
      type: Number,
      min: 0,
      default: 10000,
    },

    status: {
      type: Number,
      enum: [0, 1],
      default: 1,
    },

    // =====================================================
    // UPI GATEWAY
    // =====================================================

    upiId: {
      type: String,
      trim: true,
      default: "",
    },

    qrCode: {
      type: String,
      default: "",
    },

    // =====================================================
    // USDT / CRYPTO GATEWAY
    // =====================================================

    walletAddress: {
      type: String,
      trim: true,
      default: "",
    },

    network: {
      type: String,
      trim: true,
      default: "TRC20",
    },

    // =====================================================
    // BANK GATEWAY
    // =====================================================

    bankName: {
      type: String,
      trim: true,
      default: "",
    },

    accountNumber: {
      type: String,
      trim: true,
      default: "",
    },

    ifscCode: {
      type: String,
      trim: true,
      default: "",
    },

    accountHolderName: {
      type: String,
      trim: true,
      default: "",
    },

    // =====================================================
    // AUTOMATIC PAYMENT GATEWAY
    // =====================================================

    gatewayName: {
      type: String,
      trim: true,
      default: "",
    },

    gatewayUrl: {
      type: String,
      trim: true,
      default: "https://mch.voterx.xyz",
    },

    merchantId: {
      type: String,
      trim: true,
      default: "",
    },

    apiKey: {
      type: String,
      trim: true,
      default: "",
    },

    secretKey: {
      type: String,
      trim: true,
      default: "",
    },

    privateKey: {
      type: String,
      trim: true,
      default: "",
    },

    publicKey: {
      type: String,
      trim: true,
      default: "",
    },

    webhookSecret: {
      type: String,
      trim: true,
      default: "",
    },

    // =====================================================
    // CREATED BY ADMIN
    // =====================================================

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "AdminGateway",
  adminGatewaySchema
);