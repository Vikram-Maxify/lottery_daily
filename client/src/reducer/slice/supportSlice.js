import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api";

// Helper to deduplicate and merge a message into an existing list
const upsertMessageInList = (list, incomingMsg) => {
  if (!incomingMsg) return list;
  const incomingId = String(incomingMsg._id || "");
  const incomingClientId = incomingMsg.clientMessageId
    ? String(incomingMsg.clientMessageId)
    : null;

  const existingIndex = list.findIndex((m) => {
    if (incomingId && String(m._id) === incomingId) return true;
    if (
      incomingClientId &&
      (String(m.clientMessageId) === incomingClientId ||
        String(m._id) === incomingClientId)
    ) {
      return true;
    }
    return false;
  });

  const normalized = {
    ...incomingMsg,
    sendStatus: incomingMsg.sendStatus || "sent",
    error: null,
  };

  if (existingIndex !== -1) {
    const next = [...list];
    next[existingIndex] = normalized;
    return next;
  }

  return [...list, normalized];
};

// Helper to upsert a ticket in a ticket list and sort by most recent activity
const upsertTicketInList = (list, updatedTicket) => {
  if (!updatedTicket || !updatedTicket._id) return list;
  const targetId = String(updatedTicket._id);
  const idx = list.findIndex((t) => String(t._id) === targetId);
  let next;
  if (idx !== -1) {
    next = [...list];
    next[idx] = { ...next[idx], ...updatedTicket };
  } else {
    next = [updatedTicket, ...list];
  }

  next.sort(
    (a, b) =>
      new Date(b.lastMessageAt || b.updatedAt || b.createdAt || 0).getTime() -
      new Date(a.lastMessageAt || a.updatedAt || a.createdAt || 0).getTime()
  );
  return next;
};

// =====================================================
// USER ASYNC THUNKS
// =====================================================

export const fetchUserTickets = createAsyncThunk(
  "support/fetchUserTickets",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/v1/support/tickets", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load support tickets"
      );
    }
  }
);

export const createSupportTicket = createAsyncThunk(
  "support/createSupportTicket",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post("/v1/support/tickets", payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create support ticket"
      );
    }
  }
);

export const fetchUserTicketMessages = createAsyncThunk(
  "support/fetchUserTicketMessages",
  async ({ ticketId, page = 1, limit = 50 }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/v1/support/tickets/${ticketId}/messages`,
        {
          params: { page, limit },
        }
      );
      return { ...response.data, requestedPage: page, requestedTicketId: ticketId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load conversation messages"
      );
    }
  }
);

export const sendUserSupportMessage = createAsyncThunk(
  "support/sendUserSupportMessage",
  async ({ ticketId, message, clientMessageId }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/v1/support/tickets/${ticketId}/messages`,
        {
          message,
          clientMessageId,
        }
      );
      return {
        ...response.data,
        ticketId,
        clientMessageId,
      };
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || "Failed to send message",
        ticketId,
        clientMessageId,
      });
    }
  }
);

export const markUserTicketRead = createAsyncThunk(
  "support/markUserTicketRead",
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/v1/support/tickets/${ticketId}/read`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to mark messages as read"
      );
    }
  }
);

export const reopenUserTicket = createAsyncThunk(
  "support/reopenUserTicket",
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/v1/support/tickets/${ticketId}/reopen`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to reopen ticket"
      );
    }
  }
);

// =====================================================
// ADMIN ASYNC THUNKS
// =====================================================

export const fetchAdminTickets = createAsyncThunk(
  "support/fetchAdminTickets",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/v1/admin/support/tickets", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load customer tickets"
      );
    }
  }
);

export const fetchAdminTicketMessages = createAsyncThunk(
  "support/fetchAdminTicketMessages",
  async ({ ticketId, page = 1, limit = 60 }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/v1/admin/support/tickets/${ticketId}/messages`,
        {
          params: { page, limit },
        }
      );
      return { ...response.data, requestedPage: page, requestedTicketId: ticketId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load conversation messages"
      );
    }
  }
);

export const sendAdminReply = createAsyncThunk(
  "support/sendAdminReply",
  async ({ ticketId, message, clientMessageId }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/v1/admin/support/tickets/${ticketId}/messages`,
        {
          message,
          clientMessageId,
        }
      );
      return {
        ...response.data,
        ticketId,
        clientMessageId,
      };
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || "Failed to send reply",
        ticketId,
        clientMessageId,
      });
    }
  }
);

export const updateAdminTicketStatus = createAsyncThunk(
  "support/updateAdminTicketStatus",
  async ({ ticketId, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/v1/admin/support/tickets/${ticketId}/status`,
        { status }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update ticket status"
      );
    }
  }
);

export const markAdminTicketRead = createAsyncThunk(
  "support/markAdminTicketRead",
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/v1/admin/support/tickets/${ticketId}/read`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to mark conversation as read"
      );
    }
  }
);

export const addAdminInternalNote = createAsyncThunk(
  "support/addAdminInternalNote",
  async ({ ticketId, note }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/v1/admin/support/tickets/${ticketId}/notes`,
        { note }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add internal note"
      );
    }
  }
);

export const deleteAdminInternalNote = createAsyncThunk(
  "support/deleteAdminInternalNote",
  async ({ ticketId, noteId }, { rejectWithValue }) => {
    try {
      const response = await api.delete(
        `/v1/admin/support/tickets/${ticketId}/notes/${noteId}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete internal note"
      );
    }
  }
);

export const fetchAdminUnreadCount = createAsyncThunk(
  "support/fetchAdminUnreadCount",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/v1/admin/support/unread-count");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch unread count"
      );
    }
  }
);

// =====================================================
// INITIAL STATE
// =====================================================

const initialState = {
  // User State
  userTickets: [],
  userTicketsLoading: false,
  userTicketsError: null,
  userUnreadCount: 0,

  activeUserTicket: null,
  userMessages: [],
  userMessagesPagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
    hasMore: false,
  },
  userMessagesLoading: false,
  userMessagesError: null,

  creatingTicket: false,
  createTicketError: null,
  createTicketSuccess: null,

  sendingUserMessage: false,
  reopeningTicket: false,

  // Admin State
  adminTickets: [],
  adminTicketsLoading: false,
  adminTicketsError: null,
  adminCounts: {
    all: 0,
    unread: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
    totalUnreadMessages: 0,
  },

  activeAdminTicket: null,
  adminMessages: [],
  adminMessagesPagination: {
    page: 1,
    limit: 60,
    total: 0,
    totalPages: 1,
    hasMore: false,
  },
  adminMessagesLoading: false,
  adminMessagesError: null,

  sendingAdminReply: false,
  updatingTicketStatus: false,
  addingInternalNote: false,
};

// =====================================================
// SLICE
// =====================================================

const supportSlice = createSlice({
  name: "support",
  initialState,
  reducers: {
    clearSupportFeedback: (state) => {
      state.createTicketError = null;
      state.createTicketSuccess = null;
      state.userTicketsError = null;
      state.userMessagesError = null;
      state.adminTicketsError = null;
      state.adminMessagesError = null;
    },

    setActiveUserTicket: (state, action) => {
      const nextTicket = action.payload;
      const currentId = state.activeUserTicket?._id
        ? String(state.activeUserTicket._id)
        : null;
      const nextId = nextTicket?._id ? String(nextTicket._id) : null;

      state.activeUserTicket = nextTicket;
      if (currentId !== nextId) {
        state.userMessages = [];
        state.userMessagesError = null;
      }
    },

    setActiveAdminTicket: (state, action) => {
      const nextTicket = action.payload;
      const currentId = state.activeAdminTicket?._id
        ? String(state.activeAdminTicket._id)
        : null;
      const nextId = nextTicket?._id ? String(nextTicket._id) : null;

      state.activeAdminTicket = nextTicket;
      if (currentId !== nextId) {
        state.adminMessages = [];
        state.adminMessagesError = null;
      }
    },

    addOptimisticUserMessage: (state, action) => {
      const { ticketId, clientMessageId, message, senderName, senderUuid } =
        action.payload;
      if (
        !state.activeUserTicket ||
        String(state.activeUserTicket._id) !== String(ticketId)
      ) {
        return;
      }

      const optimisticMsg = {
        _id: clientMessageId,
        clientMessageId,
        ticket: ticketId,
        senderRole: "user",
        senderName: senderName || "You",
        senderUuid: senderUuid || "",
        message,
        createdAt: new Date().toISOString(),
        isRead: false,
        deliveryStatus: "sent",
        sendStatus: "sending",
        error: null,
      };

      state.userMessages = upsertMessageInList(
        state.userMessages,
        optimisticMsg
      );
    },

    addOptimisticAdminMessage: (state, action) => {
      const { ticketId, clientMessageId, message, senderName, senderUuid } =
        action.payload;
      if (
        !state.activeAdminTicket ||
        String(state.activeAdminTicket._id) !== String(ticketId)
      ) {
        return;
      }

      const optimisticMsg = {
        _id: clientMessageId,
        clientMessageId,
        ticket: ticketId,
        senderRole: "admin",
        senderName: senderName || "Customer Support",
        senderUuid: senderUuid || "",
        message,
        createdAt: new Date().toISOString(),
        isRead: false,
        deliveryStatus: "sent",
        sendStatus: "sending",
        error: null,
      };

      state.adminMessages = upsertMessageInList(
        state.adminMessages,
        optimisticMsg
      );
    },

    removeFailedMessage: (state, action) => {
      const { clientMessageId, role } = action.payload;
      if (role === "admin") {
        state.adminMessages = state.adminMessages.filter(
          (m) =>
            String(m.clientMessageId) !== String(clientMessageId) &&
            String(m._id) !== String(clientMessageId)
        );
      } else {
        state.userMessages = state.userMessages.filter(
          (m) =>
            String(m.clientMessageId) !== String(clientMessageId) &&
            String(m._id) !== String(clientMessageId)
        );
      }
    },

    // Socket Event Reducers
    receiveSocketTicketCreated: (state, action) => {
      const { ticket, initialMessage, counts, forRole } = action.payload || {};
      if (!ticket) return;

      if (forRole === "admin") {
        state.adminTickets = upsertTicketInList(state.adminTickets, ticket);
        if (counts) state.adminCounts = { ...state.adminCounts, ...counts };
      } else {
        state.userTickets = upsertTicketInList(state.userTickets, ticket);
        if (
          state.activeUserTicket &&
          String(state.activeUserTicket._id) === String(ticket._id) &&
          initialMessage
        ) {
          state.userMessages = upsertMessageInList(
            state.userMessages,
            initialMessage
          );
        }
      }
    },

    receiveSocketNewMessage: (state, action) => {
      const { ticketId, message, ticket } = action.payload || {};
      if (!message) return;
      const targetTicketId = String(ticketId || message.ticket || "");

      // Update User Active Conversation if matching
      if (
        state.activeUserTicket &&
        String(state.activeUserTicket._id) === targetTicketId
      ) {
        state.userMessages = upsertMessageInList(state.userMessages, message);
        if (ticket) {
          state.activeUserTicket = {
            ...state.activeUserTicket,
            ...ticket,
          };
        }
      }

      // Update User Ticket List if present
      if (ticket) {
        const existsInUserList = state.userTickets.some(
          (t) => String(t._id) === targetTicketId
        );
        if (existsInUserList) {
          state.userTickets = upsertTicketInList(state.userTickets, ticket);
          state.userUnreadCount = state.userTickets.reduce(
            (sum, t) => sum + (Number(t.unreadByUser) || 0),
            0
          );
        }
      }

      // Update Admin Active Conversation if matching
      if (
        state.activeAdminTicket &&
        String(state.activeAdminTicket._id) === targetTicketId
      ) {
        state.adminMessages = upsertMessageInList(state.adminMessages, message);
        if (ticket) {
          state.activeAdminTicket = {
            ...state.activeAdminTicket,
            ...ticket,
          };
        }
      }

      // Update Admin Ticket List
      if (ticket) {
        state.adminTickets = upsertTicketInList(state.adminTickets, ticket);
      }
    },

    receiveSocketTicketUpdated: (state, action) => {
      const { ticket, counts } = action.payload || {};
      if (counts) {
        state.adminCounts = { ...state.adminCounts, ...counts };
      }
      if (!ticket || !ticket._id) return;
      const targetId = String(ticket._id);

      // Update user side
      if (
        state.activeUserTicket &&
        String(state.activeUserTicket._id) === targetId
      ) {
        state.activeUserTicket = {
          ...state.activeUserTicket,
          ...ticket,
        };
      }
      if (state.userTickets.some((t) => String(t._id) === targetId)) {
        state.userTickets = upsertTicketInList(state.userTickets, ticket);
        state.userUnreadCount = state.userTickets.reduce(
          (sum, t) => sum + (Number(t.unreadByUser) || 0),
          0
        );
      }

      // Update admin side
      if (
        state.activeAdminTicket &&
        String(state.activeAdminTicket._id) === targetId
      ) {
        state.activeAdminTicket = {
          ...state.activeAdminTicket,
          ...ticket,
        };
      }
      state.adminTickets = upsertTicketInList(state.adminTickets, ticket);
    },

    receiveSocketMessagesRead: (state, action) => {
      const { ticketId, readerRole, readAt, ticket } = action.payload || {};
      const targetId = String(ticketId || ticket?._id || "");

      if (
        state.activeUserTicket &&
        String(state.activeUserTicket._id) === targetId
      ) {
        state.userMessages = state.userMessages.map((msg) => {
          if (readerRole === "admin" && msg.senderRole === "user") {
            return { ...msg, isRead: true, readAt, deliveryStatus: "read" };
          }
          if (readerRole === "user" && msg.senderRole === "admin") {
            return { ...msg, isRead: true, readAt, deliveryStatus: "read" };
          }
          return msg;
        });
        if (ticket) {
          state.activeUserTicket = { ...state.activeUserTicket, ...ticket };
        }
      }

      if (
        state.activeAdminTicket &&
        String(state.activeAdminTicket._id) === targetId
      ) {
        state.adminMessages = state.adminMessages.map((msg) => {
          if (readerRole === "admin" && msg.senderRole === "user") {
            return { ...msg, isRead: true, readAt, deliveryStatus: "read" };
          }
          if (readerRole === "user" && msg.senderRole === "admin") {
            return { ...msg, isRead: true, readAt, deliveryStatus: "read" };
          }
          return msg;
        });
        if (ticket) {
          state.activeAdminTicket = { ...state.activeAdminTicket, ...ticket };
        }
      }

      if (ticket) {
        if (state.userTickets.some((t) => String(t._id) === targetId)) {
          state.userTickets = upsertTicketInList(state.userTickets, ticket);
          state.userUnreadCount = state.userTickets.reduce(
            (sum, t) => sum + (Number(t.unreadByUser) || 0),
            0
          );
        }
        state.adminTickets = upsertTicketInList(state.adminTickets, ticket);
      }
    },

    receiveSocketUnreadCounts: (state, action) => {
      if (action.payload) {
        state.adminCounts = {
          ...state.adminCounts,
          ...action.payload,
        };
      }
    },
  },

  extraReducers: (builder) => {
    // =====================================
    // USER: FETCH TICKETS
    // =====================================
    builder
      .addCase(fetchUserTickets.pending, (state) => {
        state.userTicketsLoading = true;
        state.userTicketsError = null;
      })
      .addCase(fetchUserTickets.fulfilled, (state, action) => {
        state.userTicketsLoading = false;
        const tickets = action.payload?.data || [];
        state.userTickets = tickets;
        state.userUnreadCount =
          action.payload?.unreadCount ??
          tickets.reduce((sum, t) => sum + (Number(t.unreadByUser) || 0), 0);

        if (state.activeUserTicket) {
          const updatedActive = tickets.find(
            (t) => String(t._id) === String(state.activeUserTicket._id)
          );
          if (updatedActive) {
            state.activeUserTicket = updatedActive;
          }
        }
      })
      .addCase(fetchUserTickets.rejected, (state, action) => {
        state.userTicketsLoading = false;
        state.userTicketsError = action.payload;
      });

    // =====================================
    // USER: CREATE TICKET
    // =====================================
    builder
      .addCase(createSupportTicket.pending, (state) => {
        state.creatingTicket = true;
        state.createTicketError = null;
        state.createTicketSuccess = null;
      })
      .addCase(createSupportTicket.fulfilled, (state, action) => {
        state.creatingTicket = false;
        const ticket = action.payload?.data?.ticket;
        const initialMessage = action.payload?.data?.initialMessage;

        state.createTicketSuccess =
          action.payload?.message || "Support ticket created successfully";

        if (ticket) {
          state.userTickets = upsertTicketInList(state.userTickets, ticket);
          state.activeUserTicket = ticket;
          state.userMessages = initialMessage
            ? [{ ...initialMessage, sendStatus: "sent", error: null }]
            : [];
        }
      })
      .addCase(createSupportTicket.rejected, (state, action) => {
        state.creatingTicket = false;
        state.createTicketError = action.payload;
      });

    // =====================================
    // USER: FETCH MESSAGES
    // =====================================
    builder
      .addCase(fetchUserTicketMessages.pending, (state) => {
        state.userMessagesLoading = true;
        state.userMessagesError = null;
      })
      .addCase(fetchUserTicketMessages.fulfilled, (state, action) => {
        state.userMessagesLoading = false;
        const { data, requestedPage, requestedTicketId } = action.payload || {};
        const ticket = data?.ticket;
        const incomingMessages = (data?.messages || []).map((m) => ({
          ...m,
          sendStatus: "sent",
          error: null,
        }));

        if (ticket) {
          state.activeUserTicket = ticket;
          state.userTickets = upsertTicketInList(state.userTickets, ticket);
        }

        // Guard against race condition if user switched tickets while request was in flight
        if (
          state.activeUserTicket &&
          String(state.activeUserTicket._id) !== String(requestedTicketId)
        ) {
          return;
        }

        if (requestedPage > 1) {
          const existingIds = new Set(
            state.userMessages.map((m) => String(m._id))
          );
          const olderUnique = incomingMessages.filter(
            (m) => !existingIds.has(String(m._id))
          );
          state.userMessages = [...olderUnique, ...state.userMessages];
        } else {
          state.userMessages = incomingMessages;
        }

        if (data?.pagination) {
          state.userMessagesPagination = data.pagination;
        }
      })
      .addCase(fetchUserTicketMessages.rejected, (state, action) => {
        state.userMessagesLoading = false;
        state.userMessagesError = action.payload;
      });

    // =====================================
    // USER: SEND MESSAGE
    // =====================================
    builder
      .addCase(sendUserSupportMessage.pending, (state) => {
        state.sendingUserMessage = true;
      })
      .addCase(sendUserSupportMessage.fulfilled, (state, action) => {
        state.sendingUserMessage = false;
        const msg = action.payload?.data?.message;
        const ticket = action.payload?.data?.ticket;
        const { ticketId } = action.payload || {};

        if (
          msg &&
          state.activeUserTicket &&
          String(state.activeUserTicket._id) === String(ticketId)
        ) {
          state.userMessages = upsertMessageInList(state.userMessages, {
            ...msg,
            sendStatus: "sent",
            error: null,
          });
        }

        if (ticket) {
          if (
            state.activeUserTicket &&
            String(state.activeUserTicket._id) === String(ticket._id)
          ) {
            state.activeUserTicket = ticket;
          }
          state.userTickets = upsertTicketInList(state.userTickets, ticket);
        }
      })
      .addCase(sendUserSupportMessage.rejected, (state, action) => {
        state.sendingUserMessage = false;
        const { clientMessageId, message: errMsg } = action.payload || {};
        if (clientMessageId) {
          state.userMessages = state.userMessages.map((m) =>
            String(m.clientMessageId) === String(clientMessageId) ||
            String(m._id) === String(clientMessageId)
              ? { ...m, sendStatus: "failed", error: errMsg }
              : m
          );
        }
      });

    // =====================================
    // USER: MARK READ
    // =====================================
    builder.addCase(markUserTicketRead.fulfilled, (state, action) => {
      const ticket = action.payload?.data?.ticket;
      if (ticket) {
        if (
          state.activeUserTicket &&
          String(state.activeUserTicket._id) === String(ticket._id)
        ) {
          state.activeUserTicket = ticket;
        }
        state.userTickets = upsertTicketInList(state.userTickets, ticket);
        state.userUnreadCount = state.userTickets.reduce(
          (sum, t) => sum + (Number(t.unreadByUser) || 0),
          0
        );
      }
    });

    // =====================================
    // USER: REOPEN TICKET
    // =====================================
    builder
      .addCase(reopenUserTicket.pending, (state) => {
        state.reopeningTicket = true;
      })
      .addCase(reopenUserTicket.fulfilled, (state, action) => {
        state.reopeningTicket = false;
        const ticket = action.payload?.data?.ticket;
        if (ticket) {
          if (
            state.activeUserTicket &&
            String(state.activeUserTicket._id) === String(ticket._id)
          ) {
            state.activeUserTicket = ticket;
          }
          state.userTickets = upsertTicketInList(state.userTickets, ticket);
        }
      })
      .addCase(reopenUserTicket.rejected, (state) => {
        state.reopeningTicket = false;
      });

    // =====================================
    // ADMIN: FETCH TICKETS
    // =====================================
    builder
      .addCase(fetchAdminTickets.pending, (state) => {
        state.adminTicketsLoading = true;
        state.adminTicketsError = null;
      })
      .addCase(fetchAdminTickets.fulfilled, (state, action) => {
        state.adminTicketsLoading = false;
        state.adminTickets = action.payload?.data || [];
        if (action.payload?.counts) {
          state.adminCounts = {
            ...state.adminCounts,
            ...action.payload.counts,
          };
        }

        if (state.activeAdminTicket) {
          const updatedActive = state.adminTickets.find(
            (t) => String(t._id) === String(state.activeAdminTicket._id)
          );
          if (updatedActive) {
            state.activeAdminTicket = {
              ...state.activeAdminTicket,
              ...updatedActive,
            };
          }
        }
      })
      .addCase(fetchAdminTickets.rejected, (state, action) => {
        state.adminTicketsLoading = false;
        state.adminTicketsError = action.payload;
      });

    // =====================================
    // ADMIN: FETCH MESSAGES
    // =====================================
    builder
      .addCase(fetchAdminTicketMessages.pending, (state) => {
        state.adminMessagesLoading = true;
        state.adminMessagesError = null;
      })
      .addCase(fetchAdminTicketMessages.fulfilled, (state, action) => {
        state.adminMessagesLoading = false;
        const { data, requestedPage, requestedTicketId } = action.payload || {};
        const ticket = data?.ticket;
        const incomingMessages = (data?.messages || []).map((m) => ({
          ...m,
          sendStatus: "sent",
          error: null,
        }));

        // Prevent mixing messages if admin clicked another conversation while request was in flight
        if (
          state.activeAdminTicket &&
          String(state.activeAdminTicket._id) !== String(requestedTicketId)
        ) {
          return;
        }

        if (ticket) {
          state.activeAdminTicket = ticket;
          state.adminTickets = upsertTicketInList(state.adminTickets, ticket);
        }

        if (requestedPage > 1) {
          const existingIds = new Set(
            state.adminMessages.map((m) => String(m._id))
          );
          const olderUnique = incomingMessages.filter(
            (m) => !existingIds.has(String(m._id))
          );
          state.adminMessages = [...olderUnique, ...state.adminMessages];
        } else {
          state.adminMessages = incomingMessages;
        }

        if (data?.pagination) {
          state.adminMessagesPagination = data.pagination;
        }
      })
      .addCase(fetchAdminTicketMessages.rejected, (state, action) => {
        state.adminMessagesLoading = false;
        state.adminMessagesError = action.payload;
      });

    // =====================================
    // ADMIN: SEND REPLY
    // =====================================
    builder
      .addCase(sendAdminReply.pending, (state) => {
        state.sendingAdminReply = true;
      })
      .addCase(sendAdminReply.fulfilled, (state, action) => {
        state.sendingAdminReply = false;
        const msg = action.payload?.data?.message;
        const ticket = action.payload?.data?.ticket;
        const counts = action.payload?.data?.counts;
        const { ticketId } = action.payload || {};

        if (counts) {
          state.adminCounts = { ...state.adminCounts, ...counts };
        }

        if (
          msg &&
          state.activeAdminTicket &&
          String(state.activeAdminTicket._id) === String(ticketId)
        ) {
          state.adminMessages = upsertMessageInList(state.adminMessages, {
            ...msg,
            sendStatus: "sent",
            error: null,
          });
        }

        if (ticket) {
          if (
            state.activeAdminTicket &&
            String(state.activeAdminTicket._id) === String(ticket._id)
          ) {
            state.activeAdminTicket = ticket;
          }
          state.adminTickets = upsertTicketInList(state.adminTickets, ticket);
        }
      })
      .addCase(sendAdminReply.rejected, (state, action) => {
        state.sendingAdminReply = false;
        const { clientMessageId, message: errMsg } = action.payload || {};
        if (clientMessageId) {
          state.adminMessages = state.adminMessages.map((m) =>
            String(m.clientMessageId) === String(clientMessageId) ||
            String(m._id) === String(clientMessageId)
              ? { ...m, sendStatus: "failed", error: errMsg }
              : m
          );
        }
      });

    // =====================================
    // ADMIN: UPDATE STATUS
    // =====================================
    builder
      .addCase(updateAdminTicketStatus.pending, (state) => {
        state.updatingTicketStatus = true;
      })
      .addCase(updateAdminTicketStatus.fulfilled, (state, action) => {
        state.updatingTicketStatus = false;
        const ticket = action.payload?.data?.ticket;
        const counts = action.payload?.data?.counts;

        if (counts) {
          state.adminCounts = { ...state.adminCounts, ...counts };
        }

        if (ticket) {
          if (
            state.activeAdminTicket &&
            String(state.activeAdminTicket._id) === String(ticket._id)
          ) {
            state.activeAdminTicket = ticket;
          }
          state.adminTickets = upsertTicketInList(state.adminTickets, ticket);
        }
      })
      .addCase(updateAdminTicketStatus.rejected, (state) => {
        state.updatingTicketStatus = false;
      });

    // =====================================
    // ADMIN: MARK READ
    // =====================================
    builder.addCase(markAdminTicketRead.fulfilled, (state, action) => {
      const ticket = action.payload?.data?.ticket;
      const counts = action.payload?.data?.counts;

      if (counts) {
        state.adminCounts = { ...state.adminCounts, ...counts };
      }

      if (ticket) {
        if (
          state.activeAdminTicket &&
          String(state.activeAdminTicket._id) === String(ticket._id)
        ) {
          state.activeAdminTicket = ticket;
        }
        state.adminTickets = upsertTicketInList(state.adminTickets, ticket);
      }
    });

    // =====================================
    // ADMIN: INTERNAL NOTES
    // =====================================
    builder
      .addCase(addAdminInternalNote.pending, (state) => {
        state.addingInternalNote = true;
      })
      .addCase(addAdminInternalNote.fulfilled, (state, action) => {
        state.addingInternalNote = false;
        const ticket = action.payload?.data?.ticket;
        if (ticket) {
          if (
            state.activeAdminTicket &&
            String(state.activeAdminTicket._id) === String(ticket._id)
          ) {
            state.activeAdminTicket = ticket;
          }
          state.adminTickets = upsertTicketInList(state.adminTickets, ticket);
        }
      })
      .addCase(addAdminInternalNote.rejected, (state) => {
        state.addingInternalNote = false;
      })
      .addCase(deleteAdminInternalNote.fulfilled, (state, action) => {
        const ticket = action.payload?.data?.ticket;
        if (ticket) {
          if (
            state.activeAdminTicket &&
            String(state.activeAdminTicket._id) === String(ticket._id)
          ) {
            state.activeAdminTicket = ticket;
          }
          state.adminTickets = upsertTicketInList(state.adminTickets, ticket);
        }
      });

    // =====================================
    // ADMIN: UNREAD COUNT
    // =====================================
    builder.addCase(fetchAdminUnreadCount.fulfilled, (state, action) => {
      if (action.payload?.data) {
        state.adminCounts = {
          ...state.adminCounts,
          ...action.payload.data,
        };
      }
    });
  },
});

export const {
  clearSupportFeedback,
  setActiveUserTicket,
  setActiveAdminTicket,
  addOptimisticUserMessage,
  addOptimisticAdminMessage,
  removeFailedMessage,
  receiveSocketTicketCreated,
  receiveSocketNewMessage,
  receiveSocketTicketUpdated,
  receiveSocketMessagesRead,
  receiveSocketUnreadCounts,
} = supportSlice.actions;

export default supportSlice.reducer;
