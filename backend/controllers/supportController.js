const mongoose = require("mongoose");
const User = require("../models/userModel");
const {
  SupportTicket,
  SUPPORT_CATEGORIES,
  SUPPORT_STATUSES,
} = require("../models/SupportTicket");
const SupportMessage = require("../models/SupportMessage");
const socketManager = require("../socket");

const SAFE_USER_SELECT =
  "_id uuid name mobile role profileImage isKycVerified wallet createdAt";

// =====================================================
// HELPERS
// =====================================================

const sanitizeText = (value, maxLength = 5000) => {
  if (typeof value !== "string") return "";
  return value.replace(/\0/g, "").trim().slice(0, maxLength);
};

const escapeRegex = (str) => {
  if (typeof str !== "string") return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const isValidObjectId = (id) => {
  return (
    typeof id === "string" &&
    mongoose.Types.ObjectId.isValid(id) &&
    String(new mongoose.Types.ObjectId(id)) === id
  );
};

const resolveCurrentUser = async (req) => {
  if (!req.user) return null;
  const query = req.user.id
    ? { _id: req.user.id }
    : req.user.uuid
      ? { uuid: req.user.uuid }
      : null;

  if (!query) return null;
  return User.findOne(query).select(SAFE_USER_SELECT).lean();
};

const generateUniqueTicketNumber = async () => {
  for (let attempt = 0; attempt < 12; attempt++) {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const candidate = `TKT-${randomNum}`;
    const exists = await SupportTicket.exists({ ticketNumber: candidate });
    if (!exists) return candidate;
  }
  const timestampSuffix = Date.now().toString(36).toUpperCase().slice(-6);
  const randSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `TKT-${timestampSuffix}${randSuffix}`;
};

const sanitizeTicketForUser = (ticket) => {
  if (!ticket) return null;
  const plain = typeof ticket.toObject === "function" ? ticket.toObject() : { ...ticket };
  delete plain.internalNotes;
  delete plain.clientRequestId;
  return plain;
};

const safeEmit = (fn) => {
  try {
    const io = socketManager.getIO();
    if (io) fn(io);
  } catch (err) {
    // Socket not initialized or error during broadcast; DB persistence already succeeded
  }
};

const computeAdminCounts = async () => {
  const [
    allCount,
    unreadCount,
    openCount,
    inProgressCount,
    resolvedCount,
    closedCount,
    unreadAgg,
  ] = await Promise.all([
    SupportTicket.countDocuments({}),
    SupportTicket.countDocuments({ unreadByAdmin: { $gt: 0 } }),
    SupportTicket.countDocuments({ status: "open" }),
    SupportTicket.countDocuments({ status: "in_progress" }),
    SupportTicket.countDocuments({ status: "resolved" }),
    SupportTicket.countDocuments({ status: "closed" }),
    SupportTicket.aggregate([
      { $match: { unreadByAdmin: { $gt: 0 } } },
      { $group: { _id: null, totalUnreadMessages: { $sum: "$unreadByAdmin" } } },
    ]),
  ]);

  return {
    all: allCount,
    unread: unreadCount,
    open: openCount,
    in_progress: inProgressCount,
    resolved: resolvedCount,
    closed: closedCount,
    totalUnreadMessages: unreadAgg[0]?.totalUnreadMessages || 0,
  };
};

// =====================================================
// USER CONTROLLERS
// =====================================================

/**
 * POST /api/v1/support/tickets
 * Create a new support ticket and its initial message
 */
const createSupportTicket = async (req, res) => {
  try {
    const currentUser = await resolveCurrentUser(req);
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const rawMessage = sanitizeText(req.body?.message, 5000);
    const rawCategory = sanitizeText(req.body?.category, 80) || "Other";
    let rawSubject = sanitizeText(req.body?.subject, 200);
    const clientRequestId = sanitizeText(req.body?.clientRequestId, 100) || null;
    const clientMessageId = sanitizeText(req.body?.clientMessageId, 100) || null;

    if (!rawMessage) {
      return res.status(400).json({
        success: false,
        message: "Please enter a message describing your issue",
      });
    }

    if (!SUPPORT_CATEGORIES.includes(rawCategory)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Allowed categories: ${SUPPORT_CATEGORIES.join(", ")}`,
      });
    }

    // Derive a sensible subject if user used quick-ask without filling a separate subject
    if (!rawSubject) {
      rawSubject =
        rawMessage.length > 80
          ? `${rawMessage.slice(0, 77)}...`
          : rawMessage;
    }

    if (rawSubject.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Subject must be at least 2 characters long",
      });
    }

    // 1. Check idempotency by clientRequestId if provided
    if (clientRequestId) {
      const existingByReqId = await SupportTicket.findOne({
        user: currentUser._id,
        clientRequestId,
      })
        .populate("user", SAFE_USER_SELECT)
        .lean();

      if (existingByReqId) {
        const existingMsg = await SupportMessage.findOne({
          ticket: existingByReqId._id,
        })
          .sort({ createdAt: 1 })
          .lean();

        return res.status(200).json({
          success: true,
          message: "Support ticket already created",
          data: {
            ticket: sanitizeTicketForUser(existingByReqId),
            initialMessage: existingMsg,
          },
        });
      }
    }

    // 2. Prevent accidental double-click duplicate ticket within 4 seconds
    const fourSecondsAgo = new Date(Date.now() - 4000);
    const recentDuplicate = await SupportTicket.findOne({
      user: currentUser._id,
      subject: rawSubject,
      category: rawCategory,
      lastMessagePreview: rawMessage.slice(0, 300),
      createdAt: { $gte: fourSecondsAgo },
    })
      .populate("user", SAFE_USER_SELECT)
      .lean();

    if (recentDuplicate) {
      const existingMsg = await SupportMessage.findOne({
        ticket: recentDuplicate._id,
      })
        .sort({ createdAt: 1 })
        .lean();

      return res.status(200).json({
        success: true,
        message: "Support ticket already created",
        data: {
          ticket: sanitizeTicketForUser(recentDuplicate),
          initialMessage: existingMsg,
        },
      });
    }

    const ticketNumber = await generateUniqueTicketNumber();
    const now = new Date();

    const newTicket = await SupportTicket.create({
      ticketNumber,
      user: currentUser._id,
      userUuid: currentUser.uuid,
      subject: rawSubject,
      category: rawCategory,
      status: "open",
      lastMessagePreview: rawMessage.slice(0, 300),
      lastMessageAt: now,
      lastMessageSenderRole: "user",
      unreadByAdmin: 1,
      unreadByUser: 0,
      clientRequestId,
    });

    const initialMessage = await SupportMessage.create({
      ticket: newTicket._id,
      sender: currentUser._id,
      senderUuid: currentUser.uuid,
      senderName: currentUser.name,
      senderRole: "user",
      message: rawMessage,
      clientMessageId,
      isRead: false,
      deliveryStatus: "sent",
    });

    const populatedTicket = await SupportTicket.findById(newTicket._id)
      .populate("user", SAFE_USER_SELECT)
      .populate("assignedAdmin", "_id uuid name mobile")
      .lean();

    const userSafeTicket = sanitizeTicketForUser(populatedTicket);
    const counts = await computeAdminCounts();

    safeEmit((io) => {
      const userIdStr = String(currentUser._id);
      const ticketIdStr = String(newTicket._id);

      io.to("support:admins").emit("support:ticketCreated", {
        ticket: populatedTicket,
        initialMessage,
        counts,
      });
      io.to("support:admins").emit("support:unreadCountUpdated", counts);
      io.to(`user:${userIdStr}`).emit("support:ticketCreated", {
        ticket: userSafeTicket,
        initialMessage,
      });
      io.to(`ticket:${ticketIdStr}`).emit("support:newMessage", {
        ticketId: ticketIdStr,
        message: initialMessage,
        ticket: userSafeTicket,
      });
    });

    return res.status(201).json({
      success: true,
      message: `Support ticket ${ticketNumber} created successfully`,
      data: {
        ticket: userSafeTicket,
        initialMessage,
      },
    });
  } catch (error) {
    console.error("Create Support Ticket Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create support ticket",
    });
  }
};

/**
 * GET /api/v1/support/tickets
 * Get authenticated user's tickets
 */
const getUserTickets = async (req, res) => {
  try {
    const currentUser = await resolveCurrentUser(req);
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const statusFilter = sanitizeText(req.query?.status, 30);
    const page = Math.max(1, parseInt(req.query?.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query?.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = { user: currentUser._id };
    if (statusFilter && SUPPORT_STATUSES.includes(statusFilter)) {
      query.status = statusFilter;
    }

    const [tickets, total, unreadAgg] = await Promise.all([
      SupportTicket.find(query)
        .select("-internalNotes -clientRequestId")
        .populate("assignedAdmin", "_id uuid name")
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SupportTicket.countDocuments(query),
      SupportTicket.aggregate([
        { $match: { user: currentUser._id, unreadByUser: { $gt: 0 } } },
        {
          $group: {
            _id: null,
            totalUnread: { $sum: "$unreadByUser" },
          },
        },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: tickets,
      unreadCount: unreadAgg[0]?.totalUnread || 0,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("Get User Tickets Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch support tickets",
    });
  }
};

/**
 * GET /api/v1/support/tickets/:ticketId/messages
 * Get paginated conversation history for a user's ticket
 */
const getUserTicketMessages = async (req, res) => {
  try {
    const currentUser = await resolveCurrentUser(req);
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { ticketId } = req.params;
    if (!isValidObjectId(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    const ticket = await SupportTicket.findById(ticketId)
      .select("-internalNotes -clientRequestId")
      .populate("assignedAdmin", "_id uuid name")
      .lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found",
      });
    }

    if (String(ticket.user) !== String(currentUser._id)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You can only view your own support tickets",
      });
    }

    const page = Math.max(1, parseInt(req.query?.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query?.limit, 10) || 50));

    const total = await SupportMessage.countDocuments({ ticket: ticket._id });
    const totalPages = Math.ceil(total / limit) || 1;

    // Fetch messages in reverse chronological order for pagination, then reverse to chronological
    const skip = (page - 1) * limit;
    const rawMessages = await SupportMessage.find({ ticket: ticket._id })
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const messages = rawMessages.reverse();

    return res.status(200).json({
      success: true,
      data: {
        ticket,
        messages,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Get User Ticket Messages Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversation messages",
    });
  }
};

/**
 * POST /api/v1/support/tickets/:ticketId/messages
 * Send a user message in an existing ticket
 */
const sendUserMessage = async (req, res) => {
  try {
    const currentUser = await resolveCurrentUser(req);
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { ticketId } = req.params;
    if (!isValidObjectId(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    const rawMessage = sanitizeText(req.body?.message, 5000);
    const clientMessageId = sanitizeText(req.body?.clientMessageId, 100) || null;

    if (!rawMessage) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty",
      });
    }

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found",
      });
    }

    if (String(ticket.user) !== String(currentUser._id)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You can only send messages to your own ticket",
      });
    }

    if (ticket.status === "closed") {
      return res.status(400).json({
        success: false,
        message:
          "This support ticket is closed. Please start a new support ticket for further assistance.",
      });
    }

    // Check idempotency if clientMessageId is provided (prevents duplicates on retry)
    if (clientMessageId) {
      const existingMsg = await SupportMessage.findOne({
        ticket: ticket._id,
        sender: currentUser._id,
        clientMessageId,
      }).lean();

      if (existingMsg) {
        const populatedTicket = await SupportTicket.findById(ticket._id)
          .populate("user", SAFE_USER_SELECT)
          .populate("assignedAdmin", "_id uuid name")
          .lean();

        return res.status(200).json({
          success: true,
          message: "Message already sent",
          data: {
            message: existingMsg,
            ticket: sanitizeTicketForUser(populatedTicket),
          },
        });
      }
    }

    const newMessage = await SupportMessage.create({
      ticket: ticket._id,
      sender: currentUser._id,
      senderUuid: currentUser.uuid,
      senderName: currentUser.name,
      senderRole: "user",
      message: rawMessage,
      clientMessageId,
      isRead: false,
      deliveryStatus: "sent",
    });

    // Update ticket metadata
    ticket.lastMessagePreview = rawMessage.slice(0, 300);
    ticket.lastMessageAt = newMessage.createdAt;
    ticket.lastMessageSenderRole = "user";
    ticket.unreadByAdmin = (ticket.unreadByAdmin || 0) + 1;

    // If ticket was resolved, automatically reopen it when user sends a follow-up message
    let statusWasReopened = false;
    if (ticket.status === "resolved") {
      ticket.status = "open";
      ticket.reopenedAt = new Date();
      ticket.resolvedAt = null;
      statusWasReopened = true;
    }

    await ticket.save();

    const populatedTicket = await SupportTicket.findById(ticket._id)
      .populate("user", SAFE_USER_SELECT)
      .populate("assignedAdmin", "_id uuid name mobile")
      .lean();

    const userSafeTicket = sanitizeTicketForUser(populatedTicket);
    const counts = await computeAdminCounts();

    safeEmit((io) => {
      const ticketIdStr = String(ticket._id);
      const userIdStr = String(currentUser._id);

      io.to(`ticket:${ticketIdStr}`).emit("support:newMessage", {
        ticketId: ticketIdStr,
        message: newMessage,
        ticket: userSafeTicket,
      });
      io.to("support:admins").emit("support:newMessage", {
        ticketId: ticketIdStr,
        message: newMessage,
        ticket: populatedTicket,
      });
      io.to("support:admins").emit("support:ticketUpdated", {
        ticket: populatedTicket,
        counts,
      });
      io.to("support:admins").emit("support:unreadCountUpdated", counts);
      io.to(`user:${userIdStr}`).emit("support:ticketUpdated", {
        ticket: userSafeTicket,
      });

      if (statusWasReopened) {
        io.to(`ticket:${ticketIdStr}`).emit("support:statusChanged", {
          ticketId: ticketIdStr,
          status: ticket.status,
          ticket: userSafeTicket,
        });
      }
    });

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: {
        message: newMessage,
        ticket: userSafeTicket,
      },
    });
  } catch (error) {
    console.error("Send User Message Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

/**
 * PATCH /api/v1/support/tickets/:ticketId/read
 * Mark incoming admin messages as read by the user
 */
const markTicketReadByUser = async (req, res) => {
  try {
    const currentUser = await resolveCurrentUser(req);
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { ticketId } = req.params;
    if (!isValidObjectId(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found",
      });
    }

    if (String(ticket.user) !== String(currentUser._id)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You can only update your own support ticket",
      });
    }

    const now = new Date();
    await SupportMessage.updateMany(
      {
        ticket: ticket._id,
        senderRole: "admin",
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: now,
          deliveryStatus: "read",
        },
      }
    );

    if (ticket.unreadByUser > 0) {
      ticket.unreadByUser = 0;
      await ticket.save();
    }

    const populatedTicket = await SupportTicket.findById(ticket._id)
      .populate("user", SAFE_USER_SELECT)
      .populate("assignedAdmin", "_id uuid name mobile")
      .lean();

    const userSafeTicket = sanitizeTicketForUser(populatedTicket);

    safeEmit((io) => {
      const ticketIdStr = String(ticket._id);
      const userIdStr = String(currentUser._id);

      io.to(`ticket:${ticketIdStr}`).emit("support:messagesRead", {
        ticketId: ticketIdStr,
        readerRole: "user",
        readAt: now,
        ticket: userSafeTicket,
      });
      io.to("support:admins").emit("support:messagesRead", {
        ticketId: ticketIdStr,
        readerRole: "user",
        readAt: now,
        ticket: populatedTicket,
      });
      io.to(`user:${userIdStr}`).emit("support:ticketUpdated", {
        ticket: userSafeTicket,
      });
    });

    return res.status(200).json({
      success: true,
      message: "Messages marked as read",
      data: {
        ticket: userSafeTicket,
      },
    });
  } catch (error) {
    console.error("Mark Ticket Read By User Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to mark messages as read",
    });
  }
};

/**
 * PATCH /api/v1/support/tickets/:ticketId/reopen
 * Reopen a resolved ticket when allowed
 */
const reopenTicketByUser = async (req, res) => {
  try {
    const currentUser = await resolveCurrentUser(req);
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { ticketId } = req.params;
    if (!isValidObjectId(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found",
      });
    }

    if (String(ticket.user) !== String(currentUser._id)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You can only reopen your own support ticket",
      });
    }

    if (ticket.status === "closed") {
      return res.status(400).json({
        success: false,
        message:
          "Closed tickets cannot be reopened. Please create a new support ticket.",
      });
    }

    if (ticket.status !== "resolved") {
      return res.status(400).json({
        success: false,
        message: `Ticket is already ${ticket.status.replace("_", " ")}`,
      });
    }

    ticket.status = "open";
    ticket.reopenedAt = new Date();
    ticket.resolvedAt = null;
    ticket.lastMessageAt = new Date();
    await ticket.save();

    const populatedTicket = await SupportTicket.findById(ticket._id)
      .populate("user", SAFE_USER_SELECT)
      .populate("assignedAdmin", "_id uuid name mobile")
      .lean();

    const userSafeTicket = sanitizeTicketForUser(populatedTicket);
    const counts = await computeAdminCounts();

    safeEmit((io) => {
      const ticketIdStr = String(ticket._id);
      const userIdStr = String(currentUser._id);

      io.to(`ticket:${ticketIdStr}`).emit("support:statusChanged", {
        ticketId: ticketIdStr,
        status: "open",
        ticket: userSafeTicket,
      });
      io.to("support:admins").emit("support:statusChanged", {
        ticketId: ticketIdStr,
        status: "open",
        ticket: populatedTicket,
        counts,
      });
      io.to("support:admins").emit("support:ticketUpdated", {
        ticket: populatedTicket,
        counts,
      });
      io.to("support:admins").emit("support:unreadCountUpdated", counts);
      io.to(`user:${userIdStr}`).emit("support:ticketUpdated", {
        ticket: userSafeTicket,
      });
    });

    return res.status(200).json({
      success: true,
      message: "Support ticket reopened successfully",
      data: {
        ticket: userSafeTicket,
      },
    });
  } catch (error) {
    console.error("Reopen Ticket Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to reopen support ticket",
    });
  }
};

// =====================================================
// ADMIN CONTROLLERS
// =====================================================

/**
 * GET /api/v1/admin/support/tickets
 * List and filter customer support tickets for admin dashboard
 */
const adminGetTickets = async (req, res) => {
  try {
    const filter = sanitizeText(
      req.query?.filter || req.query?.status || "all",
      30
    ).toLowerCase();
    const category = sanitizeText(req.query?.category, 80);
    const search = sanitizeText(req.query?.search, 120);
    const page = Math.max(1, parseInt(req.query?.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query?.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const query = {};

    if (filter === "unread") {
      query.unreadByAdmin = { $gt: 0 };
    } else if (SUPPORT_STATUSES.includes(filter)) {
      query.status = filter;
    }

    if (category && SUPPORT_CATEGORIES.includes(category)) {
      query.category = category;
    }

    if (search) {
      const safePattern = new RegExp(escapeRegex(search), "i");
      const matchingUsers = await User.find({
        $or: [
          { name: safePattern },
          { mobile: safePattern },
          { uuid: safePattern },
        ],
      })
        .select("_id")
        .limit(100)
        .lean();

      const matchingUserIds = matchingUsers.map((u) => u._id);

      query.$or = [
        { ticketNumber: safePattern },
        { subject: safePattern },
        { lastMessagePreview: safePattern },
        { userUuid: safePattern },
        ...(matchingUserIds.length > 0 ? [{ user: { $in: matchingUserIds } }] : []),
      ];
    }

    const [tickets, total, counts] = await Promise.all([
      SupportTicket.find(query)
        .populate("user", SAFE_USER_SELECT)
        .populate("assignedAdmin", "_id uuid name mobile")
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SupportTicket.countDocuments(query),
      computeAdminCounts(),
    ]);

    return res.status(200).json({
      success: true,
      data: tickets,
      counts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("Admin Get Tickets Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch support tickets",
    });
  }
};

/**
 * GET /api/v1/admin/support/tickets/:ticketId/messages
 * Get a conversation's messages and full ticket details for admin
 */
const adminGetTicketMessages = async (req, res) => {
  try {
    const { ticketId } = req.params;
    if (!isValidObjectId(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    const ticket = await SupportTicket.findById(ticketId)
      .populate("user", SAFE_USER_SELECT)
      .populate("assignedAdmin", "_id uuid name mobile")
      .lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found",
      });
    }

    const page = Math.max(1, parseInt(req.query?.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query?.limit, 10) || 60));

    const total = await SupportMessage.countDocuments({ ticket: ticket._id });
    const totalPages = Math.ceil(total / limit) || 1;
    const skip = (page - 1) * limit;

    const rawMessages = await SupportMessage.find({ ticket: ticket._id })
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const messages = rawMessages.reverse();

    return res.status(200).json({
      success: true,
      data: {
        ticket,
        messages,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Admin Get Ticket Messages Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversation messages",
    });
  }
};

/**
 * POST /api/v1/admin/support/tickets/:ticketId/messages
 * Admin reply to the selected ticket
 */
const adminReplyToTicket = async (req, res) => {
  try {
    const adminUser = await resolveCurrentUser(req);
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Admin access required",
      });
    }

    const { ticketId } = req.params;
    if (!isValidObjectId(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    const rawMessage = sanitizeText(req.body?.message, 5000);
    const clientMessageId = sanitizeText(req.body?.clientMessageId, 100) || null;

    if (!rawMessage) {
      return res.status(400).json({
        success: false,
        message: "Reply message cannot be empty",
      });
    }

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found",
      });
    }

    if (ticket.status === "closed") {
      return res.status(400).json({
        success: false,
        message:
          "Cannot send a reply to a closed ticket. Change the ticket status to Open or In Progress first.",
      });
    }

    if (clientMessageId) {
      const existingMsg = await SupportMessage.findOne({
        ticket: ticket._id,
        sender: adminUser._id,
        clientMessageId,
      }).lean();

      if (existingMsg) {
        const populatedTicket = await SupportTicket.findById(ticket._id)
          .populate("user", SAFE_USER_SELECT)
          .populate("assignedAdmin", "_id uuid name mobile")
          .lean();

        return res.status(200).json({
          success: true,
          message: "Reply already sent",
          data: {
            message: existingMsg,
            ticket: populatedTicket,
          },
        });
      }
    }

    const now = new Date();

    const newMessage = await SupportMessage.create({
      ticket: ticket._id,
      sender: adminUser._id,
      senderUuid: adminUser.uuid,
      senderName: adminUser.name || "Customer Support",
      senderRole: "admin",
      message: rawMessage,
      clientMessageId,
      isRead: false,
      deliveryStatus: "sent",
    });

    // Mark unread user messages as read since admin is replying
    await SupportMessage.updateMany(
      {
        ticket: ticket._id,
        senderRole: "user",
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: now,
          deliveryStatus: "read",
        },
      }
    );

    ticket.lastMessagePreview = rawMessage.slice(0, 300);
    ticket.lastMessageAt = newMessage.createdAt;
    ticket.lastMessageSenderRole = "admin";
    ticket.unreadByUser = (ticket.unreadByUser || 0) + 1;
    ticket.unreadByAdmin = 0;

    if (!ticket.assignedAdmin) {
      ticket.assignedAdmin = adminUser._id;
    }

    let statusChanged = false;
    if (ticket.status === "open") {
      ticket.status = "in_progress";
      statusChanged = true;
    }

    await ticket.save();

    const populatedTicket = await SupportTicket.findById(ticket._id)
      .populate("user", SAFE_USER_SELECT)
      .populate("assignedAdmin", "_id uuid name mobile")
      .lean();

    const userSafeTicket = sanitizeTicketForUser(populatedTicket);
    const counts = await computeAdminCounts();

    safeEmit((io) => {
      const ticketIdStr = String(ticket._id);
      const userIdStr = String(ticket.user);

      io.to(`ticket:${ticketIdStr}`).emit("support:newMessage", {
        ticketId: ticketIdStr,
        message: newMessage,
        ticket: userSafeTicket,
      });
      io.to(`user:${userIdStr}`).emit("support:newMessage", {
        ticketId: ticketIdStr,
        message: newMessage,
        ticket: userSafeTicket,
      });
      io.to(`user:${userIdStr}`).emit("support:ticketUpdated", {
        ticket: userSafeTicket,
      });
      io.to("support:admins").emit("support:newMessage", {
        ticketId: ticketIdStr,
        message: newMessage,
        ticket: populatedTicket,
      });
      io.to("support:admins").emit("support:ticketUpdated", {
        ticket: populatedTicket,
        counts,
      });
      io.to("support:admins").emit("support:unreadCountUpdated", counts);

      if (statusChanged) {
        io.to(`ticket:${ticketIdStr}`).emit("support:statusChanged", {
          ticketId: ticketIdStr,
          status: ticket.status,
          ticket: userSafeTicket,
        });
      }
    });

    return res.status(201).json({
      success: true,
      message: "Reply sent successfully",
      data: {
        message: newMessage,
        ticket: populatedTicket,
        counts,
      },
    });
  } catch (error) {
    console.error("Admin Reply Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to send reply",
    });
  }
};

/**
 * PATCH /api/v1/admin/support/tickets/:ticketId/status
 * Update ticket status (open, in_progress, resolved, closed)
 */
const adminUpdateTicketStatus = async (req, res) => {
  try {
    const adminUser = await resolveCurrentUser(req);
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Admin access required",
      });
    }

    const { ticketId } = req.params;
    if (!isValidObjectId(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    const status = sanitizeText(req.body?.status, 30).toLowerCase();
    if (!SUPPORT_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${SUPPORT_STATUSES.join(", ")}`,
      });
    }

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found",
      });
    }

    const now = new Date();
    ticket.status = status;

    if (!ticket.assignedAdmin) {
      ticket.assignedAdmin = adminUser._id;
    }

    if (status === "resolved") {
      ticket.resolvedAt = now;
      ticket.closedAt = null;
    } else if (status === "closed") {
      ticket.closedAt = now;
      if (!ticket.resolvedAt) ticket.resolvedAt = now;
    } else {
      ticket.resolvedAt = null;
      ticket.closedAt = null;
    }

    await ticket.save();

    const populatedTicket = await SupportTicket.findById(ticket._id)
      .populate("user", SAFE_USER_SELECT)
      .populate("assignedAdmin", "_id uuid name mobile")
      .lean();

    const userSafeTicket = sanitizeTicketForUser(populatedTicket);
    const counts = await computeAdminCounts();

    safeEmit((io) => {
      const ticketIdStr = String(ticket._id);
      const userIdStr = String(ticket.user);

      io.to(`ticket:${ticketIdStr}`).emit("support:statusChanged", {
        ticketId: ticketIdStr,
        status,
        ticket: userSafeTicket,
      });
      io.to(`user:${userIdStr}`).emit("support:statusChanged", {
        ticketId: ticketIdStr,
        status,
        ticket: userSafeTicket,
      });
      io.to(`user:${userIdStr}`).emit("support:ticketUpdated", {
        ticket: userSafeTicket,
      });
      io.to("support:admins").emit("support:statusChanged", {
        ticketId: ticketIdStr,
        status,
        ticket: populatedTicket,
        counts,
      });
      io.to("support:admins").emit("support:ticketUpdated", {
        ticket: populatedTicket,
        counts,
      });
      io.to("support:admins").emit("support:unreadCountUpdated", counts);
    });

    return res.status(200).json({
      success: true,
      message: `Ticket status updated to ${status.replace("_", " ")}`,
      data: {
        ticket: populatedTicket,
        counts,
      },
    });
  } catch (error) {
    console.error("Admin Update Ticket Status Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update ticket status",
    });
  }
};

/**
 * PATCH /api/v1/admin/support/tickets/:ticketId/read
 * Mark incoming user messages as read by admin
 */
const adminMarkTicketRead = async (req, res) => {
  try {
    const { ticketId } = req.params;
    if (!isValidObjectId(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found",
      });
    }

    const now = new Date();
    await SupportMessage.updateMany(
      {
        ticket: ticket._id,
        senderRole: "user",
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: now,
          deliveryStatus: "read",
        },
      }
    );

    if (ticket.unreadByAdmin > 0) {
      ticket.unreadByAdmin = 0;
      await ticket.save();
    }

    const populatedTicket = await SupportTicket.findById(ticket._id)
      .populate("user", SAFE_USER_SELECT)
      .populate("assignedAdmin", "_id uuid name mobile")
      .lean();

    const userSafeTicket = sanitizeTicketForUser(populatedTicket);
    const counts = await computeAdminCounts();

    safeEmit((io) => {
      const ticketIdStr = String(ticket._id);
      const userIdStr = String(ticket.user);

      io.to(`ticket:${ticketIdStr}`).emit("support:messagesRead", {
        ticketId: ticketIdStr,
        readerRole: "admin",
        readAt: now,
        ticket: userSafeTicket,
      });
      io.to(`user:${userIdStr}`).emit("support:messagesRead", {
        ticketId: ticketIdStr,
        readerRole: "admin",
        readAt: now,
        ticket: userSafeTicket,
      });
      io.to("support:admins").emit("support:ticketUpdated", {
        ticket: populatedTicket,
        counts,
      });
      io.to("support:admins").emit("support:unreadCountUpdated", counts);
    });

    return res.status(200).json({
      success: true,
      message: "Conversation marked as read",
      data: {
        ticket: populatedTicket,
        counts,
      },
    });
  } catch (error) {
    console.error("Admin Mark Ticket Read Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to mark conversation as read",
    });
  }
};

/**
 * POST /api/v1/admin/support/tickets/:ticketId/notes
 * Add an internal admin note (never visible to customers)
 */
const adminAddInternalNote = async (req, res) => {
  try {
    const adminUser = await resolveCurrentUser(req);
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Admin access required",
      });
    }

    const { ticketId } = req.params;
    if (!isValidObjectId(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    const rawNote = sanitizeText(req.body?.note, 2000);
    if (!rawNote) {
      return res.status(400).json({
        success: false,
        message: "Note text cannot be empty",
      });
    }

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found",
      });
    }

    ticket.internalNotes.push({
      note: rawNote,
      adminId: adminUser._id,
      adminName: adminUser.name || "Admin",
      createdAt: new Date(),
    });

    await ticket.save();

    const populatedTicket = await SupportTicket.findById(ticket._id)
      .populate("user", SAFE_USER_SELECT)
      .populate("assignedAdmin", "_id uuid name mobile")
      .lean();

    safeEmit((io) => {
      io.to("support:admins").emit("support:ticketUpdated", {
        ticket: populatedTicket,
      });
    });

    return res.status(201).json({
      success: true,
      message: "Internal note added",
      data: {
        internalNotes: populatedTicket.internalNotes,
        ticket: populatedTicket,
      },
    });
  } catch (error) {
    console.error("Admin Add Note Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to add internal note",
    });
  }
};

/**
 * DELETE /api/v1/admin/support/tickets/:ticketId/notes/:noteId
 * Delete an internal admin note
 */
const adminDeleteInternalNote = async (req, res) => {
  try {
    const adminUser = await resolveCurrentUser(req);
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Admin access required",
      });
    }

    const { ticketId, noteId } = req.params;
    if (!isValidObjectId(ticketId) || !isValidObjectId(noteId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID",
      });
    }

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found",
      });
    }

    ticket.internalNotes = ticket.internalNotes.filter(
      (n) => String(n._id) !== String(noteId)
    );
    await ticket.save();

    const populatedTicket = await SupportTicket.findById(ticket._id)
      .populate("user", SAFE_USER_SELECT)
      .populate("assignedAdmin", "_id uuid name mobile")
      .lean();

    safeEmit((io) => {
      io.to("support:admins").emit("support:ticketUpdated", {
        ticket: populatedTicket,
      });
    });

    return res.status(200).json({
      success: true,
      message: "Internal note removed",
      data: {
        internalNotes: populatedTicket.internalNotes,
        ticket: populatedTicket,
      },
    });
  } catch (error) {
    console.error("Admin Delete Note Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete internal note",
    });
  }
};

/**
 * GET /api/v1/admin/support/unread-count
 * Get unread support counts for admin navigation badge
 */
const adminGetUnreadCount = async (req, res) => {
  try {
    const counts = await computeAdminCounts();
    return res.status(200).json({
      success: true,
      data: counts,
    });
  } catch (error) {
    console.error("Admin Get Unread Count Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch unread count",
    });
  }
};

module.exports = {
  createSupportTicket,
  getUserTickets,
  getUserTicketMessages,
  sendUserMessage,
  markTicketReadByUser,
  reopenTicketByUser,
  adminGetTickets,
  adminGetTicketMessages,
  adminReplyToTicket,
  adminUpdateTicketStatus,
  adminMarkTicketRead,
  adminAddInternalNote,
  adminDeleteInternalNote,
  adminGetUnreadCount,
};
