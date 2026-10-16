const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("./models/userModel");
const { SupportTicket } = require("./models/SupportTicket");

let io = null;

const parseCookies = (cookieHeader = "") => {
  const list = {};
  if (!cookieHeader || typeof cookieHeader !== "string") return list;

  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    const key = parts.shift()?.trim();
    if (!key) return;
    const value = decodeURIComponent(parts.join("=").trim());
    list[key] = value;
  });

  return list;
};

const authenticateSocket = async (socket) => {
  try {
    const cookies = parseCookies(socket.handshake?.headers?.cookie);
    const token =
      cookies.usertoken ||
      socket.handshake?.auth?.token ||
      (typeof socket.handshake?.headers?.authorization === "string" &&
      socket.handshake.headers.authorization.startsWith("Bearer ")
        ? socket.handshake.headers.authorization.slice(7).trim()
        : null);

    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const query = decoded.id
      ? { _id: decoded.id }
      : decoded.uuid
        ? { uuid: decoded.uuid }
        : null;

    if (!query) return null;

    const user = await User.findOne(query)
      .select("_id uuid name mobile role")
      .lean();

    if (!user) return null;

    socket.user = {
      _id: user._id,
      id: String(user._id),
      uuid: user.uuid,
      name: user.name,
      mobile: user.mobile,
      role: user.role,
    };

    return socket.user;
  } catch (err) {
    return null;
  }
};

const isProtectedRoom = (room) => {
  if (typeof room !== "string") return true;
  const trimmed = room.trim();
  return (
    trimmed.startsWith("support:") ||
    trimmed.startsWith("ticket:") ||
    trimmed.startsWith("user:")
  );
};

const setupSocketHandlers = (socketIoInstance) => {
  socketIoInstance.use(async (socket, next) => {
    await authenticateSocket(socket);
    // Allow connection so public pages (like LiveTickets) continue to work,
    // while support events strictly enforce socket.user authentication & authorization.
    next();
  });

  socketIoInstance.on("connection", (socket) => {
    // Auto-join personal and admin support rooms if authenticated
    if (socket.user) {
      socket.join(`user:${socket.user.id}`);
      if (socket.user.role === "admin") {
        socket.join("support:admins");
      }
    }

    // Legacy room join (restricted from joining protected support rooms)
    socket.on("joinRoom", (room) => {
      if (typeof room === "string" && !isProtectedRoom(room)) {
        socket.join(room);
      }
    });

    // Support initialization / authentication check
    socket.on("support:init", async (payload, ack) => {
      const callback = typeof payload === "function" ? payload : ack;
      if (!socket.user) {
        await authenticateSocket(socket);
      }

      if (!socket.user) {
        if (typeof callback === "function") {
          callback({
            success: false,
            authenticated: false,
            message: "Authentication required",
          });
        }
        return;
      }

      socket.join(`user:${socket.user.id}`);
      if (socket.user.role === "admin") {
        socket.join("support:admins");
      }

      if (typeof callback === "function") {
        callback({
          success: true,
          authenticated: true,
          userId: socket.user.id,
          role: socket.user.role,
        });
      }
    });

    // Join a specific support ticket room (strictly authorized)
    socket.on("support:joinTicket", async (payload, ack) => {
      const callback = typeof ack === "function" ? ack : null;
      try {
        if (!socket.user) {
          await authenticateSocket(socket);
        }

        if (!socket.user) {
          if (callback) {
            callback({
              success: false,
              message: "Authentication required",
            });
          }
          return;
        }

        const ticketId =
          typeof payload === "string" ? payload : payload?.ticketId;

        if (
          !ticketId ||
          typeof ticketId !== "string" ||
          !mongoose.Types.ObjectId.isValid(ticketId)
        ) {
          if (callback) {
            callback({
              success: false,
              message: "Invalid ticket ID",
            });
          }
          return;
        }

        const ticket = await SupportTicket.findById(ticketId)
          .select("_id user status")
          .lean();

        if (!ticket) {
          if (callback) {
            callback({
              success: false,
              message: "Support ticket not found",
            });
          }
          return;
        }

        const isOwner = String(ticket.user) === String(socket.user.id);
        const isAdmin = socket.user.role === "admin";

        if (!isOwner && !isAdmin) {
          if (callback) {
            callback({
              success: false,
              message: "Forbidden: You are not authorized to access this ticket",
            });
          }
          return;
        }

        const roomName = `ticket:${String(ticket._id)}`;
        socket.join(roomName);

        if (callback) {
          callback({
            success: true,
            ticketId: String(ticket._id),
          });
        }
      } catch (err) {
        if (callback) {
          callback({
            success: false,
            message: "Failed to join ticket room",
          });
        }
      }
    });

    // Leave a specific support ticket room
    socket.on("support:leaveTicket", (payload, ack) => {
      const ticketId =
        typeof payload === "string" ? payload : payload?.ticketId;
      if (ticketId && typeof ticketId === "string") {
        socket.leave(`ticket:${ticketId}`);
      }
      if (typeof ack === "function") {
        ack({ success: true });
      }
    });

    // Typing indicator inside an authorized ticket room
    socket.on("support:typing", (payload) => {
      if (!socket.user) return;
      const ticketId = payload?.ticketId;
      if (!ticketId || typeof ticketId !== "string") return;

      const roomName = `ticket:${ticketId}`;
      if (!socket.rooms.has(roomName)) return;

      socket.to(roomName).emit("support:typing", {
        ticketId,
        senderRole: socket.user.role,
        senderName: socket.user.name,
        isTyping: Boolean(payload?.isTyping),
      });
    });
  });
};

module.exports = {
  init: (socketIoInstance) => {
    io = socketIoInstance;
    setupSocketHandlers(socketIoInstance);
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.IO not initialized. Call init(io) first.");
    }
    return io;
  },
};