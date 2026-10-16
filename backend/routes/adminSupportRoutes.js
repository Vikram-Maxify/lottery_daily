const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { messageSendLimiter } = require("../middleware/supportRateLimiter");
const {
  adminGetTickets,
  adminGetTicketMessages,
  adminReplyToTicket,
  adminUpdateTicketStatus,
  adminMarkTicketRead,
  adminAddInternalNote,
  adminDeleteInternalNote,
  adminGetUnreadCount,
} = require("../controllers/supportController");

// All admin support routes require both authentication and admin role authorization
router.use(authMiddleware, adminMiddleware);

// Get unread support counts
router.get("/unread-count", adminGetUnreadCount);

// List and filter customer support tickets
router.get("/tickets", adminGetTickets);

// Get a conversation's messages and full ticket details
router.get("/tickets/:ticketId/messages", adminGetTicketMessages);

// Reply to the selected ticket
router.post(
  "/tickets/:ticketId/messages",
  messageSendLimiter,
  adminReplyToTicket
);
router.post(
  "/tickets/:ticketId/reply",
  messageSendLimiter,
  adminReplyToTicket
);

// Update ticket status (open, in_progress, resolved, closed)
router.patch("/tickets/:ticketId/status", adminUpdateTicketStatus);

// Mark incoming user messages as read
router.patch("/tickets/:ticketId/read", adminMarkTicketRead);

// Internal admin notes
router.post("/tickets/:ticketId/notes", adminAddInternalNote);
router.delete("/tickets/:ticketId/notes/:noteId", adminDeleteInternalNote);

module.exports = router;
