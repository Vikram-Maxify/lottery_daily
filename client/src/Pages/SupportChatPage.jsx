import {
  AlertCircle,
  Check,
  CheckCheck,
  ChevronDown,
  Clock,
  Headphones,
  HelpCircle,
  Loader2,
  MessageSquarePlus,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Tag,
  Ticket,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  addOptimisticUserMessage,
  clearSupportFeedback,
  createSupportTicket,
  fetchUserTicketMessages,
  fetchUserTickets,
  markUserTicketRead,
  receiveSocketMessagesRead,
  receiveSocketNewMessage,
  receiveSocketTicketCreated,
  receiveSocketTicketUpdated,
  removeFailedMessage,
  reopenUserTicket,
  sendUserSupportMessage,
  setActiveUserTicket,
} from "../reducer/slice/supportSlice";
import { ensureSocketAuthenticated, socket } from "../socket";

const SUPPORT_CATEGORIES = [
  "Payment Issue",
  "Ticket Purchase",
  "Lottery Results",
  "Wallet/Transaction",
  "Account Issue",
  "Technical Issue",
  "Other",
];

const SUGGESTED_QUESTIONS = [
  {
    id: 1,
    question: "How can I purchase a lottery ticket?",
    category: "Ticket Purchase",
    subject: "Help with purchasing a lottery ticket",
  },
  {
    id: 2,
    question: "My payment was deducted, but my ticket was not purchased.",
    category: "Payment Issue",
    subject: "Payment deducted but ticket not received",
  },
  {
    id: 3,
    question: "How can I check my lottery results?",
    category: "Lottery Results",
    subject: "How to check lottery draw results",
  },
  {
    id: 4,
    question: "Where can I see my ticket purchase history?",
    category: "Ticket Purchase",
    subject: "Finding my ticket purchase history",
  },
  {
    id: 5,
    question: "I need help with a winning ticket or prize.",
    category: "Lottery Results",
    subject: "Winning ticket & prize claim assistance",
  },
  {
    id: 6,
    question: "How can I update my profile or account details?",
    category: "Account Issue",
    subject: "Updating profile or account details",
  },
  {
    id: 7,
    question: "I am facing an issue with my wallet or balance.",
    category: "Wallet/Transaction",
    subject: "Wallet balance issue",
  },
  {
    id: 8,
    question: "I want to report an incorrect transaction.",
    category: "Wallet/Transaction",
    subject: "Reporting an incorrect transaction",
  },
  {
    id: 9,
    question: "I am facing a technical issue with the website.",
    category: "Technical Issue",
    subject: "Website technical issue",
  },
  {
    id: 10,
    question: "I have another question.",
    category: "Other",
    subject: "General customer support inquiry",
  },
];

const STATUS_META = {
  open: {
    label: "Open",
    badgeClass:
      "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
    dotClass: "bg-emerald-500",
  },
  in_progress: {
    label: "In Progress",
    badgeClass: "bg-amber-500/15 text-amber-700 border-amber-500/30",
    dotClass: "bg-amber-500",
  },
  resolved: {
    label: "Resolved",
    badgeClass: "bg-blue-500/15 text-blue-700 border-blue-500/30",
    dotClass: "bg-blue-500",
  },
  closed: {
    label: "Closed",
    badgeClass: "bg-slate-500/15 text-slate-700 border-slate-500/30",
    dotClass: "bg-slate-500",
  },
};

const formatMessageTime = (dateInput) => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDateLabel = (dateInput) => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return "Today";

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const makeClientId = (prefix = "msg") =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const SupportChatPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);
  const {
    userTickets,
    userTicketsLoading,
    activeUserTicket,
    userMessages,
    userMessagesPagination,
    userMessagesLoading,
    userMessagesError,
    creatingTicket,
    reopeningTicket,
  } = useSelector((state) => state.support);

  // Socket connection state (accurate real-time indicator)
  const [socketConnected, setSocketConnected] = useState(socket.connected);
  const [adminTyping, setAdminTyping] = useState(false);

  // UI view state
  const [isNewTicketMode, setIsNewTicketMode] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showTicketListDrawer, setShowTicketListDrawer] = useState(false);
  const [showSuggestedQuestions, setShowSuggestedQuestions] = useState(true);

  // Composer & New Ticket form state
  const [messageInput, setMessageInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Other");
  const [ticketSubject, setTicketSubject] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [toastBanner, setToastBanner] = useState(null);

  const messagesEndRef = useRef(null);
  const composerInputRef = useRef(null);
  const joinedTicketRef = useRef(null);
  const initialSelectionDoneRef = useRef(false);
  const typingTimeoutRef = useRef(null);

  // Show temporary confirmation banner
  const triggerToast = useCallback((type, text) => {
    setToastBanner({ type, text });
  }, []);

  useEffect(() => {
    if (!toastBanner) return;
    const t = setTimeout(() => setToastBanner(null), 5000);
    return () => clearTimeout(t);
  }, [toastBanner]);

  // 1. Fetch user's support tickets on mount
  useEffect(() => {
    dispatch(fetchUserTickets());
  }, [dispatch]);

  // 2. Automatically select the most recent ticket on initial load if available
  useEffect(() => {
    if (userTicketsLoading) return;
    if (initialSelectionDoneRef.current) return;

    initialSelectionDoneRef.current = true;
    if (userTickets.length > 0 && !activeUserTicket) {
      const preferred =
        userTickets.find(
          (t) => t.status === "open" || t.status === "in_progress",
        ) || userTickets[0];
      dispatch(setActiveUserTicket(preferred));
    }
  }, [userTickets, userTicketsLoading, activeUserTicket, dispatch]);

  // 3. Load messages & mark read whenever activeUserTicket changes
  const activeTicketId = activeUserTicket?._id
    ? String(activeUserTicket._id)
    : null;

  useEffect(() => {
    if (!activeTicketId || isNewTicketMode) return;

    dispatch(fetchUserTicketMessages({ ticketId: activeTicketId, page: 1 }));
    dispatch(markUserTicketRead(activeTicketId));
  }, [activeTicketId, isNewTicketMode, dispatch]);

  // 4. Socket.IO authentication, room joining, and real-time listeners
  useEffect(() => {
    let isMounted = true;

    const setupSocket = async () => {
      await ensureSocketAuthenticated();
      if (!isMounted) return;
      setSocketConnected(socket.connected);

      if (activeTicketId && !isNewTicketMode) {
        if (
          joinedTicketRef.current &&
          joinedTicketRef.current !== activeTicketId
        ) {
          socket.emit("support:leaveTicket", {
            ticketId: joinedTicketRef.current,
          });
        }
        socket.emit("support:joinTicket", { ticketId: activeTicketId });
        joinedTicketRef.current = activeTicketId;
      }
    };

    setupSocket();

    const handleConnect = async () => {
      setSocketConnected(true);
      await ensureSocketAuthenticated();
      if (activeTicketId && !isNewTicketMode) {
        socket.emit("support:joinTicket", { ticketId: activeTicketId });
        joinedTicketRef.current = activeTicketId;
        // Sync any missed messages on reconnect
        dispatch(
          fetchUserTicketMessages({ ticketId: activeTicketId, page: 1 }),
        );
      }
      dispatch(fetchUserTickets());
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    const handleTicketCreated = (payload) => {
      dispatch(receiveSocketTicketCreated({ ...payload, forRole: "user" }));
    };

    const handleNewMessage = (payload) => {
      dispatch(receiveSocketNewMessage(payload));
      const incomingTicketId = String(
        payload?.ticketId || payload?.message?.ticket || "",
      );
      if (
        activeTicketId &&
        incomingTicketId === activeTicketId &&
        payload?.message?.senderRole === "admin"
      ) {
        setAdminTyping(false);
        dispatch(markUserTicketRead(activeTicketId));
      }
    };

    const handleTicketUpdated = (payload) => {
      dispatch(receiveSocketTicketUpdated(payload));
    };

    const handleStatusChanged = (payload) => {
      dispatch(receiveSocketTicketUpdated(payload));
    };

    const handleMessagesRead = (payload) => {
      dispatch(receiveSocketMessagesRead(payload));
    };

    const handleTyping = (payload) => {
      if (
        activeTicketId &&
        String(payload?.ticketId) === activeTicketId &&
        payload?.senderRole === "admin"
      ) {
        setAdminTyping(Boolean(payload?.isTyping));
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("support:ticketCreated", handleTicketCreated);
    socket.on("support:newMessage", handleNewMessage);
    socket.on("support:ticketUpdated", handleTicketUpdated);
    socket.on("support:statusChanged", handleStatusChanged);
    socket.on("support:messagesRead", handleMessagesRead);
    socket.on("support:typing", handleTyping);

    return () => {
      isMounted = false;
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("support:ticketCreated", handleTicketCreated);
      socket.off("support:newMessage", handleNewMessage);
      socket.off("support:ticketUpdated", handleTicketUpdated);
      socket.off("support:statusChanged", handleStatusChanged);
      socket.off("support:messagesRead", handleMessagesRead);
      socket.off("support:typing", handleTyping);
    };
  }, [activeTicketId, isNewTicketMode, dispatch]);

  // Clean up room on unmount
  useEffect(() => {
    return () => {
      if (joinedTicketRef.current) {
        socket.emit("support:leaveTicket", {
          ticketId: joinedTicketRef.current,
        });
      }
    };
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [userMessages.length, adminTyping]);

  // Group messages by date for clean date dividers
  const groupedMessages = useMemo(() => {
    const groups = [];
    let lastDateLabel = null;

    userMessages.forEach((msg) => {
      const label = formatDateLabel(msg.createdAt);
      if (label && label !== lastDateLabel) {
        groups.push({ type: "divider", label, id: `div_${label}_${msg._id}` });
        lastDateLabel = label;
      }
      groups.push({
        type: "message",
        data: msg,
        id: msg._id || msg.clientMessageId,
      });
    });

    return groups;
  }, [userMessages]);

  // Handle clicking a suggested question
  const handleSelectSuggestedQuestion = (item) => {
    setFormError("");
    setMessageInput(item.question);
    setSelectedCategory(item.category);
    setTicketSubject(item.subject);
    composerInputRef.current?.focus();
  };

  // Start a new ticket view
  const handleStartNewTicket = () => {
    setFormError("");
    setIsNewTicketMode(true);
    setShowTicketListDrawer(false);
    setShowSuggestedQuestions(true);
    setMessageInput("");
    setTicketSubject("");
    setSelectedCategory("Other");
    setTimeout(() => composerInputRef.current?.focus(), 100);
  };

  // Select an existing ticket from history
  const handleSelectTicket = (ticket) => {
    setFormError("");
    setIsNewTicketMode(false);
    setShowTicketListDrawer(false);
    dispatch(setActiveUserTicket(ticket));
  };

  // Handle typing emission
  const handleComposerChange = (e) => {
    const val = e.target.value;
    setMessageInput(val);
    if (formError) setFormError("");

    if (activeTicketId && !isNewTicketMode) {
      socket.emit("support:typing", {
        ticketId: activeTicketId,
        isTyping: val.trim().length > 0,
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("support:typing", {
          ticketId: activeTicketId,
          isTyping: false,
        });
      }, 2000);
    }
  };

  // Send message or create ticket from composer
  const handleSendFromComposer = async (e) => {
    e?.preventDefault();
    const trimmedMessage = messageInput.trim();

    if (!trimmedMessage) {
      setFormError("Please enter a message before sending.");
      return;
    }

    if (creatingTicket) return;
    setFormError("");

    // Case 1: Creating a new ticket (no active ticket or user is in New Ticket mode)
    if (isNewTicketMode || !activeUserTicket) {
      const finalCategory = SUPPORT_CATEGORIES.includes(selectedCategory)
        ? selectedCategory
        : "Other";
      const finalSubject =
        ticketSubject.trim().length >= 3
          ? ticketSubject.trim()
          : trimmedMessage.length > 75
            ? `${trimmedMessage.slice(0, 72)}...`
            : trimmedMessage;

      const clientRequestId = makeClientId("req");
      const clientMessageId = makeClientId("msg");

      const result = await dispatch(
        createSupportTicket({
          subject: finalSubject,
          category: finalCategory,
          message: trimmedMessage,
          clientRequestId,
          clientMessageId,
        }),
      );

      if (createSupportTicket.fulfilled.match(result)) {
        setMessageInput("");
        setTicketSubject("");
        setIsNewTicketMode(false);
        setShowSuggestedQuestions(false);
        triggerToast(
          "success",
          result.payload?.message || "Support ticket created successfully",
        );
        dispatch(clearSupportFeedback());
      } else {
        setFormError(result.payload || "Failed to create support ticket.");
      }
      return;
    }

    // Case 2: Sending a message in the active ticket conversation
    if (activeUserTicket.status === "closed") {
      setFormError(
        "This ticket is closed. Please click 'New Ticket' to open a new support request.",
      );
      return;
    }

    const clientMessageId = makeClientId("msg");
    setMessageInput("");

    dispatch(
      addOptimisticUserMessage({
        ticketId: activeTicketId,
        clientMessageId,
        message: trimmedMessage,
        senderName: user?.name || "You",
        senderUuid: user?.uuid || "",
      }),
    );

    await dispatch(
      sendUserSupportMessage({
        ticketId: activeTicketId,
        message: trimmedMessage,
        clientMessageId,
      }),
    );
  };

  // Retry a failed optimistic message
  const handleRetryFailedMessage = async (failedMsg) => {
    if (!activeTicketId || !failedMsg) return;
    const retryClientId = failedMsg.clientMessageId || makeClientId("msg");

    dispatch(
      addOptimisticUserMessage({
        ticketId: activeTicketId,
        clientMessageId: retryClientId,
        message: failedMsg.message,
        senderName: user?.name || "You",
        senderUuid: user?.uuid || "",
      }),
    );

    await dispatch(
      sendUserSupportMessage({
        ticketId: activeTicketId,
        message: failedMsg.message,
        clientMessageId: retryClientId,
      }),
    );
  };

  // Create ticket from the structured modal
  const handleCreateTicketModalSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const cleanSubject = ticketSubject.trim();
    const cleanDesc = modalDescription.trim();

    if (cleanSubject.length < 3) {
      setFormError("Please enter a subject (at least 3 characters).");
      return;
    }

    if (cleanDesc.length < 5) {
      setFormError(
        "Please describe your issue in detail (at least 5 characters).",
      );
      return;
    }

    if (creatingTicket) return;

    const clientRequestId = makeClientId("req");
    const clientMessageId = makeClientId("msg");

    const result = await dispatch(
      createSupportTicket({
        subject: cleanSubject,
        category: selectedCategory,
        message: cleanDesc,
        clientRequestId,
        clientMessageId,
      }),
    );

    if (createSupportTicket.fulfilled.match(result)) {
      setShowTicketModal(false);
      setTicketSubject("");
      setModalDescription("");
      setMessageInput("");
      setIsNewTicketMode(false);
      setShowSuggestedQuestions(false);
      triggerToast(
        "success",
        result.payload?.message || "Support ticket created successfully",
      );
      dispatch(clearSupportFeedback());
    } else {
      setFormError(result.payload || "Failed to create support ticket.");
    }
  };

  // Reopen a resolved ticket
  const handleReopenTicket = async () => {
    if (!activeTicketId || reopeningTicket) return;
    const result = await dispatch(reopenUserTicket(activeTicketId));
    if (reopenUserTicket.fulfilled.match(result)) {
      triggerToast("success", "Ticket reopened! You can continue chatting.");
    } else {
      triggerToast(
        "error",
        result.payload || "Could not reopen this support ticket.",
      );
    }
  };

  // Load older messages
  const handleLoadOlderMessages = () => {
    if (
      !activeTicketId ||
      userMessagesLoading ||
      !userMessagesPagination?.hasMore
    ) {
      return;
    }
    dispatch(
      fetchUserTicketMessages({
        ticketId: activeTicketId,
        page: (userMessagesPagination.page || 1) + 1,
      }),
    );
  };

  const currentStatusMeta =
    STATUS_META[activeUserTicket?.status] || STATUS_META.open;

  return (
    <div className="min-h-screen w-full bg-[#EEF3FA] text-[#131E3D] pb-[96px]">
      <div className="mx-auto flex w-full max-w-[490px] flex-col">
        {/* =====================================================
            A. SUPPORT HEADER
        ===================================================== */}
        <div className="relative overflow-hidden rounded-b-[28px] bg-gradient-to-br from-[#25050e] via-[#3b0816] to-[#150409] px-4 pt-4 pb-5 text-white shadow-[0_10px_28px_rgba(20,8,24,0.28)]">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#ED1D43]/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-12 bottom-0 h-36 w-36 rounded-full bg-[#FFD84A]/15 blur-2xl" />

          {/* Main Header Title & Subtitle */}
          <div className="relative mt-4 flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#FFD84A]/40 bg-gradient-to-br from-[#ED1D43] to-[#9F1239] shadow-[0_0_20px_rgba(237,29,67,0.45)]">
              <Headphones size={24} className="text-[#FFD84A]" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-black tracking-tight text-white">
                Customer Support
              </h1>
              <p className="text-xs font-medium text-white/80">
                How can we help you today?
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            TOAST / CONFIRMATION BANNER
        ===================================================== */}
        {toastBanner && (
          <div
            className={`mx-3 mt-3 flex items-center justify-between gap-2 rounded-2xl border px-3.5 py-2.5 text-xs font-bold shadow-sm ${
              toastBanner.type === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="shrink-0" />
              <span>{toastBanner.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastBanner(null)}
              className="rounded-full p-0.5 hover:bg-black/5"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* =====================================================
            TICKET SWITCHER DRAWER (IF USER HAS TICKETS)
        ===================================================== */}
        {showTicketListDrawer && userTickets.length > 0 && (
          <div className="mx-3 mt-3 overflow-hidden rounded-2xl border border-[#CBD5E1] bg-white p-3 shadow-lg">
            <div className="mb-2.5 flex items-center justify-between border-b border-[#F1F5F9] pb-2">
              <div className="flex items-center gap-1.5">
                <Ticket size={15} className="text-[#ED1D43]" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#131E3D]">
                  Your Support Tickets ({userTickets.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartNewTicket}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#ED1D43]/10 px-2 py-1 text-[11px] font-extrabold text-[#ED1D43] hover:bg-[#ED1D43]/20"
                >
                  <MessageSquarePlus size={12} />
                  <span>Start Fresh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowTicketListDrawer(false)}
                  className="rounded-lg p-1 text-[#64748B] hover:bg-[#F1F5F9]"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
              {userTickets.map((t) => {
                const isSelected =
                  !isNewTicketMode &&
                  activeUserTicket &&
                  String(activeUserTicket._id) === String(t._id);
                const meta = STATUS_META[t.status] || STATUS_META.open;

                return (
                  <button
                    key={t._id}
                    type="button"
                    onClick={() => handleSelectTicket(t)}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl border p-2.5 text-left transition ${
                      isSelected
                        ? "border-[#ED1D43] bg-rose-50/60 ring-1 ring-[#ED1D43]/20"
                        : "border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] font-black text-[#ED1D43]">
                          #{t.ticketNumber}
                        </span>
                        <span className="rounded-md bg-[#E2E8F0]/70 px-1.5 py-0.5 text-[9.5px] font-bold text-[#475569]">
                          {t.category}
                        </span>
                        {t.unreadByUser > 0 && (
                          <span className="rounded-full bg-[#ED1D43] px-1.5 py-0.2 text-[9px] font-black text-white">
                            {t.unreadByUser} new
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs font-extrabold text-[#131E3D]">
                        {t.subject}
                      </p>
                      <p className="truncate text-[11px] text-[#64748B]">
                        {t.lastMessagePreview || "No messages yet"}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9.5px] font-extrabold ${meta.badgeClass}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`}
                        />
                        {meta.label}
                      </span>
                      <span className="text-[10px] font-medium text-[#94A3B8]">
                        {formatMessageTime(t.lastMessageAt)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* =====================================================
            ACTIVE TICKET STATUS BAR (WHEN VIEWING A TICKET)
        ===================================================== */}
        {!isNewTicketMode && activeUserTicket && (
          <div className="mx-3 mt-3 rounded-2xl border border-[#E2E8F0] bg-white p-3 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-lg bg-[#131E3D] px-2 py-0.5 font-mono text-[11px] font-black text-[#FFD84A]">
                    #{activeUserTicket.ticketNumber}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-[#F1F5F9] px-2 py-0.5 text-[10.5px] font-bold text-[#475569]">
                    <Tag size={11} className="text-[#ED1D43]" />
                    {activeUserTicket.category}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10.5px] font-extrabold ${currentStatusMeta.badgeClass}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${currentStatusMeta.dotClass}`}
                    />
                    {currentStatusMeta.label}
                  </span>
                </div>
                <h2 className="mt-1.5 truncate text-sm font-extrabold text-[#131E3D]">
                  {activeUserTicket.subject}
                </h2>
              </div>

              <div className="flex items-center gap-1.5">
                {activeUserTicket.status === "resolved" && (
                  <button
                    type="button"
                    onClick={handleReopenTicket}
                    disabled={reopeningTicket}
                    className="inline-flex items-center gap-1 rounded-xl border border-blue-300 bg-blue-50 px-2.5 py-1.5 text-[11px] font-extrabold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
                  >
                    {reopeningTicket ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <RotateCcw size={12} />
                    )}
                    <span>Reopen</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleStartNewTicket}
                  className="inline-flex items-center gap-1 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-[11px] font-bold text-[#131E3D] transition hover:bg-[#F1F5F9]"
                >
                  <MessageSquarePlus size={12} className="text-[#ED1D43]" />
                  <span>New Issue</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            B. SUGGESTED QUESTIONS SECTION
        ===================================================== */}
        <div className="mx-3 mt-3 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-xs">
          <button
            type="button"
            onClick={() => setShowSuggestedQuestions((prev) => !prev)}
            className="flex w-full items-center justify-between px-3.5 py-2.5 text-left transition hover:bg-[#F8FAFC]"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-50 text-[#ED1D43]">
                <HelpCircle size={14} />
              </span>
              <div>
                <p className="text-xs font-extrabold text-[#131E3D]">
                  Suggested Questions
                </p>
                <p className="text-[10.5px] text-[#64748B]">
                  Tap any topic below to pre-fill your question
                </p>
              </div>
            </div>
            <ChevronDown
              size={16}
              className={`text-[#64748B] transition-transform duration-200 ${
                showSuggestedQuestions ? "rotate-180" : ""
              }`}
            />
          </button>

          {showSuggestedQuestions && (
            <div className="border-t border-[#F1F5F9] px-3 py-2.5">
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_QUESTIONS.map((item) => {
                  const isCurrent = messageInput === item.question;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSuggestedQuestion(item)}
                      className={`rounded-xl border px-2.5 py-1.5 text-left text-[11px] font-semibold leading-snug transition active:scale-[0.99] ${
                        isCurrent
                          ? "border-[#ED1D43] bg-rose-50 text-[#ED1D43] shadow-2xs"
                          : "border-[#E2E8F0] bg-[#F8FAFC] text-[#1E293B] hover:border-[#CBD5E1] hover:bg-white"
                      }`}
                    >
                      {item.question}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* =====================================================
            CONVERSATION AREA / NEW TICKET PROMPT
        ===================================================== */}
        <div className="mx-3 mt-3 flex flex-col rounded-2xl border border-[#E2E8F0] bg-white shadow-xs">
          {isNewTicketMode || !activeUserTicket ? (
            /* NEW TICKET INLINE SETUP */
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#ED1D43]" />
                  <h3 className="text-sm font-black text-[#131E3D]">
                    Start a Support Conversation
                  </h3>
                </div>
                {userTickets.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewTicketMode(false);
                      if (!activeUserTicket && userTickets[0]) {
                        dispatch(setActiveUserTicket(userTickets[0]));
                      }
                    }}
                    className="text-[11px] font-bold text-[#ED1D43] hover:underline"
                  >
                    Back to Active Chat →
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-[#475569]">
                    Issue Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="h-10 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 text-xs font-bold text-[#131E3D] outline-none focus:border-[#ED1D43] focus:bg-white"
                  >
                    {SUPPORT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-[#475569]">
                    Subject (Optional — auto-filled if blank)
                  </label>
                  <input
                    type="text"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="Brief summary of your issue..."
                    maxLength={200}
                    className="h-10 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 text-xs font-medium text-[#131E3D] placeholder:text-[#94A3B8] outline-none focus:border-[#ED1D43] focus:bg-white"
                  />
                </div>
              </div>

              <p className="mt-2.5 text-[11px] text-[#64748B]">
                Select a suggested question above or type your problem below and
                press <strong>Send</strong> to open your support ticket.
              </p>
            </div>
          ) : (
            /* ACTIVE CONVERSATION MESSAGE HISTORY */
            <div className="flex max-h-[380px] min-h-[260px] flex-col overflow-y-auto bg-[#F8FAFC] p-3">
              {/* Load Older Messages */}
              {userMessagesPagination?.hasMore && (
                <div className="mb-3 text-center">
                  <button
                    type="button"
                    onClick={handleLoadOlderMessages}
                    disabled={userMessagesLoading}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#CBD5E1] bg-white px-3 py-1 text-[11px] font-bold text-[#475569] shadow-2xs hover:bg-[#F1F5F9]"
                  >
                    {userMessagesLoading ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <RefreshCw size={12} />
                    )}
                    <span>Load older messages</span>
                  </button>
                </div>
              )}

              {userMessagesLoading && userMessages.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center py-12 text-[#64748B]">
                  <Loader2 size={24} className="animate-spin text-[#ED1D43]" />
                  <p className="mt-2 text-xs font-semibold">
                    Loading conversation...
                  </p>
                </div>
              ) : userMessagesError && userMessages.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                  <AlertCircle size={24} className="text-red-500" />
                  <p className="mt-1.5 text-xs font-bold text-red-600">
                    {userMessagesError}
                  </p>
                </div>
              ) : groupedMessages.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center py-10 text-center text-[#64748B]">
                  <Headphones size={28} className="text-[#94A3B8]" />
                  <p className="mt-2 text-xs font-bold text-[#131E3D]">
                    No messages in this ticket yet
                  </p>
                  <p className="text-[11px] text-[#64748B]">
                    Send a message below and our team will respond shortly.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {groupedMessages.map((item) => {
                    if (item.type === "divider") {
                      return (
                        <div
                          key={item.id}
                          className="my-2 flex items-center justify-center"
                        >
                          <span className="rounded-full border border-[#E2E8F0] bg-white px-3 py-0.5 text-[10px] font-bold text-[#64748B] shadow-2xs">
                            {item.label}
                          </span>
                        </div>
                      );
                    }

                    const msg = item.data;
                    const isUser = msg.senderRole === "user";
                    const isFailed = msg.sendStatus === "failed";
                    const isSending = msg.sendStatus === "sending";

                    return (
                      <div
                        key={item.id}
                        className={`flex flex-col ${
                          isUser ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 shadow-2xs ${
                            isUser
                              ? isFailed
                                ? "rounded-br-xs border border-red-300 bg-red-50 text-red-900"
                                : "rounded-br-xs bg-gradient-to-br from-[#ED1D43] to-[#BE123C] text-white"
                              : "rounded-bl-xs border border-[#E2E8F0] bg-white text-[#131E3D]"
                          }`}
                        >
                          {/* Sender label for admin replies */}
                          {!isUser && (
                            <div className="mb-1 flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[9.5px] font-black text-amber-900">
                                <ShieldCheck size={10} />
                                {msg.senderName || "Customer Support"}
                              </span>
                            </div>
                          )}

                          <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">
                            {msg.message}
                          </p>

                          {/* Timestamp & Delivery Status */}
                          <div
                            className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                              isUser
                                ? isFailed
                                  ? "text-red-600"
                                  : "text-white/80"
                                : "text-[#94A3B8]"
                            }`}
                          >
                            <span>{formatMessageTime(msg.createdAt)}</span>
                            {isUser && (
                              <>
                                {isSending ? (
                                  <span className="inline-flex items-center gap-0.5">
                                    <Clock size={10} /> Sending...
                                  </span>
                                ) : isFailed ? (
                                  <span className="font-bold text-red-600">
                                    • Failed
                                  </span>
                                ) : msg.isRead ||
                                  msg.deliveryStatus === "read" ? (
                                  <span
                                    className="inline-flex items-center gap-0.5 text-[#FFD84A]"
                                    title="Read by Support"
                                  >
                                    <CheckCheck size={13} />
                                  </span>
                                ) : (
                                  <span
                                    className="inline-flex items-center gap-0.5"
                                    title="Sent"
                                  >
                                    <Check size={12} />
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Failed Message Actions (Retry / Remove) */}
                        {isFailed && (
                          <div className="mt-1 flex items-center gap-2 text-[11px]">
                            <span className="text-red-600">
                              {msg.error || "Message not sent"}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRetryFailedMessage(msg)}
                              className="font-extrabold text-[#ED1D43] underline"
                            >
                              Retry
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                dispatch(
                                  removeFailedMessage({
                                    clientMessageId:
                                      msg.clientMessageId || msg._id,
                                    role: "user",
                                  }),
                                )
                              }
                              className="text-[#64748B] hover:underline"
                            >
                              Dismiss
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {adminTyping && (
                    <div className="flex items-start">
                      <div className="rounded-2xl rounded-bl-xs border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-semibold text-[#64748B] shadow-2xs">
                        Support agent is typing...
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          )}

          {/* =====================================================
              C. MESSAGE INPUT & SEND BAR
          ===================================================== */}
          <div className="border-t border-[#E2E8F0] bg-white p-3 rounded-b-2xl">
            {formError && (
              <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-bold text-red-700">
                <div className="flex items-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{formError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormError("")}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {!isNewTicketMode &&
            activeUserTicket &&
            activeUserTicket.status === "closed" ? (
              <div className="flex flex-col items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center sm:flex-row sm:text-left">
                <p className="text-xs font-semibold text-slate-600">
                  This ticket is closed. Need help with another issue?
                </p>
                <button
                  type="button"
                  onClick={handleStartNewTicket}
                  className="shrink-0 rounded-xl bg-[#ED1D43] px-3.5 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-[#C70F31]"
                >
                  Create New Ticket
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSendFromComposer}
                className="flex items-end gap-2"
              >
                <textarea
                  ref={composerInputRef}
                  rows={2}
                  value={messageInput}
                  onChange={handleComposerChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendFromComposer(e);
                    }
                  }}
                  placeholder={
                    isNewTicketMode || !activeUserTicket
                      ? "Describe your problem in your own words..."
                      : "Type your message to support..."
                  }
                  maxLength={5000}
                  className="max-h-28 min-h-[44px] flex-1 resize-none rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2.5 text-xs font-medium text-[#131E3D] placeholder:text-[#94A3B8] outline-none transition focus:border-[#ED1D43] focus:bg-white"
                />

                <button
                  type="submit"
                  disabled={creatingTicket || !messageInput.trim()}
                  className="flex h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ED1D43] to-[#C70F31] px-4 text-xs font-black text-white shadow-[0_6px_16px_rgba(237,29,67,0.35)] transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingTicket ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={15} />
                      <span>
                        {isNewTicketMode || !activeUserTicket
                          ? "Create & Send"
                          : "Send"}
                      </span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================
          MODAL: CREATE DETAILED SUPPORT TICKET
      ===================================================== */}
      {showTicketModal && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 p-0 backdrop-blur-xs sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-t-[28px] border border-[#E2E8F0] bg-white p-5 text-[#131E3D] shadow-2xl sm:rounded-[28px]">
            <div className="mb-4 flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <div>
                <h3 className="text-lg font-black text-[#131E3D]">
                  Create Support Ticket
                </h3>
                <p className="text-xs text-[#64748B]">
                  Provide details so our team can resolve your issue faster
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTicketModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-bold text-red-700">
                {formError}
              </div>
            )}

            <form
              onSubmit={handleCreateTicketModalSubmit}
              className="space-y-3.5"
            >
              <div>
                <label className="mb-1 block text-xs font-bold text-[#1E293B]">
                  Category <span className="text-[#ED1D43]">*</span>
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 text-xs font-bold text-[#131E3D] outline-none focus:border-[#ED1D43] focus:bg-white"
                >
                  {SUPPORT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[#1E293B]">
                  Subject <span className="text-[#ED1D43]">*</span>
                </label>
                <input
                  type="text"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="E.g., Payment deducted for Daily Lottery"
                  maxLength={200}
                  required
                  className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 text-xs font-medium text-[#131E3D] placeholder:text-[#94A3B8] outline-none focus:border-[#ED1D43] focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[#1E293B]">
                  Detailed Description <span className="text-[#ED1D43]">*</span>
                </label>
                <textarea
                  rows={4}
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  placeholder="Describe your issue clearly (include ticket number or transaction details if relevant)..."
                  maxLength={5000}
                  required
                  className="w-full resize-none rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3.5 text-xs font-medium text-[#131E3D] placeholder:text-[#94A3B8] outline-none focus:border-[#ED1D43] focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTicketModal(false)}
                  className="rounded-xl border border-[#CBD5E1] bg-white px-4 py-2.5 text-xs font-bold text-[#475569] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTicket}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ED1D43] to-[#C70F31] px-5 py-2.5 text-xs font-black text-white shadow-md hover:brightness-110 disabled:opacity-50"
                >
                  {creatingTicket ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Submit Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportChatPage;
