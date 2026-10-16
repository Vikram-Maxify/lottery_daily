const mongoose = require("mongoose");

const supportMessageSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportTicket",
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    senderUuid: {
      type: String,
      required: true,
      trim: true,
    },

    senderName: {
      type: String,
      required: true,
      trim: true,
    },

    senderRole: {
      type: String,
      required: true,
      enum: ["user", "admin"],
      index: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 5000,
    },

    clientMessageId: {
      type: String,
      default: null,
      trim: true,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },

    deliveryStatus: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
  },
  {
    timestamps: true,
  }
);

supportMessageSchema.index({ ticket: 1, createdAt: 1 });
supportMessageSchema.index({ ticket: 1, createdAt: -1 });
supportMessageSchema.index({ ticket: 1, senderRole: 1, isRead: 1 });
supportMessageSchema.index(
  { ticket: 1, sender: 1, clientMessageId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      clientMessageId: { $type: "string" },
    },
  }
);

const SupportMessage = mongoose.model("SupportMessage", supportMessageSchema);

module.exports = SupportMessage;
