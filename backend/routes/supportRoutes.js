const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  ticketCreationLimiter,
  messageSendLimiter,
} = require("../middleware/supportRateLimiter");
const {
  createSupportTicket,
  getUserTickets,
  getUserTicketMessages,
  sendUserMessage,
  markTicketReadByUser,
  reopenTicketByUser,
} = require("../controllers/supportController");

// All user support routes require user authentication
router.use(authMiddleware);

// Create a support ticket and its initial message
router.post("/tickets", ticketCreationLimiter, createSupportTicket);

// Get the authenticated user's tickets
router.get("/tickets", getUserTickets);

// Get paginated conversation history for a ticket
router.get("/tickets/:ticketId/messages", getUserTicketMessages);

// Send a user message in a ticket conversation
router.post(
  "/tickets/:ticketId/messages",
  messageSendLimiter,
  sendUserMessage
);

// Mark incoming admin messages in a ticket as read
router.patch("/tickets/:ticketId/read", markTicketReadByUser);

// Reopen a resolved ticket
router.patch("/tickets/:ticketId/reopen", reopenTicketByUser);

module.exports = router;
