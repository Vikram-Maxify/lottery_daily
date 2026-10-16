const mongoose = require("mongoose");

const SUPPORT_CATEGORIES = [
  "Payment Issue",
  "Ticket Purchase",
  "Lottery Results",
  "Wallet/Transaction",
  "Account Issue",
  "Technical Issue",
  "Other",
];

const SUPPORT_STATUSES = ["open", "in_progress", "resolved", "closed"];

const internalNoteSchema = new mongoose.Schema(
  {
    note: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    adminName: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    userUuid: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },

    category: {
      type: String,
      required: true,
      enum: SUPPORT_CATEGORIES,
      default: "Other",
      index: true,
    },

    status: {
      type: String,
      required: true,
      enum: SUPPORT_STATUSES,
      default: "open",
      index: true,
    },

    assignedAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    lastMessagePreview: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    lastMessageSenderRole: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    unreadByAdmin: {
      type: Number,
      default: 0,
      min: 0,
    },

    unreadByUser: {
      type: Number,
      default: 0,
      min: 0,
    },

    internalNotes: {
      type: [internalNoteSchema],
      default: [],
    },

    clientRequestId: {
      type: String,
      default: null,
      trim: true,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    closedAt: {
      type: Date,
      default: null,
    },

    reopenedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

supportTicketSchema.index({ user: 1, lastMessageAt: -1 });
supportTicketSchema.index({ status: 1, lastMessageAt: -1 });
supportTicketSchema.index({ unreadByAdmin: 1, lastMessageAt: -1 });
supportTicketSchema.index({ lastMessageAt: -1 });
supportTicketSchema.index(
  { user: 1, clientRequestId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      clientRequestId: { $type: "string" },
    },
  }
);

const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);

module.exports = {
  SupportTicket,
  SUPPORT_CATEGORIES,
  SUPPORT_STATUSES,
};
