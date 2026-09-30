const mongoose = require("mongoose");

const kycDocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    documentType: {
      type: String,
      enum: ["aadhaar", "pan"],
      required: true,
    },

    // Aadhaar Front / PAN Document
    documentUrl: {
      type: String,
      required: true,
    },

    documentPublicId: {
      type: String,
      default: null,
    },

    // Only required for Aadhaar
    backDocumentUrl: {
      type: String,
      default: null,
    },

    backDocumentPublicId: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    rejectionReason: {
      type: String,
      default: null,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One Aadhaar + one PAN per user
kycDocumentSchema.index(
  { userId: 1, documentType: 1 },
  { unique: true }
);

module.exports = mongoose.model("KycDocument", kycDocumentSchema);