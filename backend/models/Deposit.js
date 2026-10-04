const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    gatewayId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminGateway",
      default: null,
    },

    // ===============================================
    // LOTTERY CONFIG
    // ===============================================

    configId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LotteryConfig",
      default: null,
      index: true,
    },

    entryId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    // ===============================================
    // SINGLE LOTTERY NUMBER
    // Exactly 8 alphanumeric characters
    // Example: 70ab786c
    // ===============================================

    number: {
      type: String,
      default: null,
      validate: {
        validator: function (value) {
          if (value === null || value === "") return true;

          return /^[a-zA-Z0-9]{8}$/.test(String(value).trim());
        },
        message:
          "Lottery number must be exactly 8 alphanumeric characters",
      },
    },

    // ===============================================
    // MULTIPLE LOTTERY NUMBERS
    // Exactly 7 alphanumeric characters each
    // Example:
    // ["70ab786", "ABC1234", "a1b2c3d"]
    // ===============================================

    lotteryNumbers: {
      type: [String],
      default: [],
      validate: {
        validator: function (arr) {
          if (!arr || arr.length === 0) return true;

          return arr.every((n) =>
            /^[a-zA-Z0-9]{8}$/.test(String(n).trim())
          );
        },
        message:
          "All lottery numbers must be exactly 8 alphanumeric characters",
      },
    },

    // ===============================================
    // USER DETAILS
    // ===============================================

    uid: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      required: true,
    },

    username: {
      type: String,
      default: "",
    },

    // ===============================================
    // ORDER
    // ===============================================

    orderId: {
      type: String,
      unique: true,
      required: true,
    },

    paymentMethod: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      default: "",
    },

    channel: {
      type: String,
      default: "",
    },

    // ===============================================
    // AMOUNT
    // ===============================================

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    exchangeRate: {
      type: Number,
      default: 0,
    },

    // ===============================================
    // TRANSACTION
    // ===============================================

    transactionId: {
      type: String,
      default: "",
    },

    utr: {
      type: String,
      default: "",
    },

    paymentProof: {
      type: String,
      default: "",
    },

    paymentUrl: {
      type: String,
      default: "",
    },

    // ===============================================
    // STATUS
    // 0 = pending
    // 1 = success
    // 2 = failed
    // 3 = cancelled
    // ===============================================

    status: {
      type: Number,
      enum: [0, 1, 2, 3],
      default: 0,
      index: true,
    },

    adminRemark: {
      type: String,
      default: "",
    },

    // ===============================================
    // CANCEL META
    // ===============================================

    cancelReason: {
      type: String,
      default: "",
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancelledBy: {
      type: String,
      enum: ["USER", "ADMIN", "SYSTEM", ""],
      default: "",
    },

    // ===============================================
    // LOTTERY PROCESSING FLAG
    // ===============================================

    lotteryProcessed: {
      type: Boolean,
      default: false,
      index: true,
    },

    lotteryProcessedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// INDEX
// =====================================================

depositSchema.index({
  userId: 1,
  createdAt: -1,
});

depositSchema.index({
  configId: 1,
  entryId: 1,
});

depositSchema.index({
  status: 1,
  createdAt: -1,
});

depositSchema.index({
  lotteryProcessed: 1,
  status: 1,
});

module.exports = mongoose.model("Deposit", depositSchema);