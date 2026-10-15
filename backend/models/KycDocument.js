const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      default: null,
    },

    publicId: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
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
  { _id: false }
);

const kycDocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ==========================================
    // LEGACY DOCUMENT FIELDS
    // ==========================================

    documentType: {
      type: String,
      default: null,
    },

    documentUrl: {
      type: String,
      default: null,
    },

    documentPublicId: {
      type: String,
      default: null,
    },

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
      default: null,
    },

    rejectionReason: {
      type: String,
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ==========================================
    // DATE OF BIRTH
    // ==========================================

    dob: {
      type: Date,
      default: null,
    },

    // ==========================================
    // USER SELFIE
    // ==========================================

    selfie: {
      type: documentSchema,
      default: null,
    },

    // ==========================================
    // AADHAAR
    // ==========================================

    aadhaar: {
      front: {
        type: documentSchema,
        default: null,
      },

      back: {
        type: documentSchema,
        default: null,
      },

      review: {
        type: reviewSchema,
        default: () => ({
          status: "pending",
        }),
      },
    },

    // ==========================================
    // PAN
    // ==========================================

    pan: {
      front: {
        type: documentSchema,
        default: null,
      },

      review: {
        type: reviewSchema,
        default: () => ({
          status: "pending",
        }),
      },
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

module.exports = mongoose.model("KycDocument", kycDocumentSchema);