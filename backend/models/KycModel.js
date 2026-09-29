const mongoose = require("mongoose");

const kycSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    uid: {
      type: Number,
      required: true,
    },

    username: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    fullName: {
      type: String,
      required: true,
    },

    dob: {
      type: String,
      required: true,
    },

    state: {
      type: String,
      required: true,
    },

    selfie: {
      type: String,
      required: true,
    },

    governmentId: {
      type: String,
      required: true,
    },

    // 1 = Pending
    // 2 = Approved
    // 3 = Rejected
    status: {
      type: Number,
      enum: [1, 2, 3],
      default: 1,
    },

    adminRemark: {
      type: String,
      default: "",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("KYC", kycSchema);