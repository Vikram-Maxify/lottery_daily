const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    mobile: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    purpose: {
      type: String,
      enum: ["register", "forgot_password"],
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
    attempts: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

otpSchema.index({ mobile: 1, purpose: 1 }, { unique: true });

module.exports = mongoose.model("Otp", otpSchema);