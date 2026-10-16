import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock,
  FileText,
  Headphones,
  Loader2,
  Lock,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  StickyNote,
  Tag,
  Ticket,
  Trash2,
  UserRound,
  Wallet,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  addAdminInternalNote,
  addOptimisticAdminMessage,
  deleteAdminInternalNote,
  fetchAdminTicketMessages,
  fetchAdminTickets,
  markAdminTicketRead,
  receiveSocketMessagesRead,
  receiveSocketNewMessage,
  receiveSocketTicketCreated,
  receiveSocketTicketUpdated,
  receiveSocketUnreadCounts,
  removeFailedMessage,
  sendAdminReply,
  setActiveAdminTicket,
  updateAdminTicketStatus,
} from "../../reducer/slice/supportSlice";
import { ensureSocketAuthenticated, socket } from "../../socket";

const GOLD_BG = "bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00]";

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
  { key: "closed", label: "Closed" },
];

const STATUS_CONFIG = {
  open: {
    label: "Open",
    badge: "bg-emerald-500/15 text-emerald-800 border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  in_progress: {
    label: "In Progress",
    badge: "bg-amber-500/15 text-amber-800 border-amber-500/30",
    dot: "bg-amber-500",
  },
  resolved: {
    label: "Resolved",
    badge: "bg-blue-500/15 text-blue-800 border-blue-500/30",
    dot: "bg-blue-500",
  },
  closed: {
    label: "Closed",
    badge: "bg-slate-500/15 text-slate-700 border-slate-400/30",
    dot: "bg-slate-500",
  },
};

const QUICK_REPLIES = [
  "Hello! Thank you for contacting Customer Support. How can I help you today?",
  "We are currently verifying your transaction details and will update you shortly.",
  "Your ticket purchase has been verified. You can view it under 'My Purchased Tickets'.",
  "Your issue has been resolved. Please let us know if you need any further assistance!",
];

const formatShortTime = (dateInput) => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();

  if (isToday) {
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const formatMessageClock = (dateInput) => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDateDivider = (dateInput) => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const makeClientId = (prefix = "adm") =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const AdminSupportChat = () => {
  const dispatch = useDispatch();
  const { admin } = useSelector((state) => state.adminAuth);
  const {
    adminTickets,
    adminTicketsLoading,
    adminTicketsError,
    adminCounts,
    activeAdminTicket,
    adminMessages,
    adminMessagesPagination,
    adminMessagesLoading,
    adminMessagesError,
    updatingTicketStatus,
    addingInternalNote,
  } = useSelector((state) => state.support);

  // Filter & Search state
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Mobile responsive view toggle (false = list view, true = active chat view)
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // Composer & Notes state
  const [replyText, setReplyText] = useState("");
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [showCustomerInfoPanel, setShowCustomerInfoPanel] = useState(false);
  const [toast, setToast] = useState(null);

  // Socket & typing state
  const [socketConnected, setSocketConnected] = useState(socket.connected);
  const [userTyping, setUserTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const replyInputRef = useRef(null);
  const joinedTicketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const activeTicketId = activeAdminTicket?._id
    ? String(activeAdminTicket._id)
    : null;

  const showToast = useCallback((type, text) => {
    setToast({ type, text });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch tickets when filter or debouncedSearch changes
  useEffect(() => {
    dispatch(
      fetchAdminTickets({
        filter: activeFilter,
        search: debouncedSearch,
        limit: 80,
      })
    );
  }, [dispatch, activeFilter, debouncedSearch]);

  // Load messages and mark read when activeAdminTicket changes
  useEffect(() => {
    if (!activeTicketId) return;

    dispatch(fetchAdminTicketMessages({ ticketId: activeTicketId, page: 1 }));
    dispatch(markAdminTicketRead(activeTicketId));
    const timer = setTimeout(() => {
      replyInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [activeTicketId, dispatch]);

  // Socket.IO connection, room management, and real-time listeners
  useEffect(() => {
    let isMounted = true;

    const initSocket = async () => {
      await ensureSocketAuthenticated();
      if (!isMounted) return;
      setSocketConnected(socket.connected);

      if (activeTicketId) {
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

    initSocket();

    const handleConnect = async () => {
      setSocketConnected(true);
      await ensureSocketAuthenticated();
      if (activeTicketId) {
        socket.emit("support:joinTicket", { ticketId: activeTicketId });
        joinedTicketRef.current = activeTicketId;
        dispatch(
          fetchAdminTicketMessages({ ticketId: activeTicketId, page: 1 })
        );
      }
      dispatch(
        fetchAdminTickets({
          filter: activeFilter,
          search: debouncedSearch,
          limit: 80,
        })
      );
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    const handleTicketCreated = (payload) => {
      dispatch(receiveSocketTicketCreated({ ...payload, forRole: "admin" }));
    };

    const handleNewMessage = (payload) => {
      dispatch(receiveSocketNewMessage(payload));
      const incomingTicketId = String(
        payload?.ticketId || payload?.message?.ticket || ""
      );
      if (
        activeTicketId &&
        incomingTicketId === activeTicketId &&
        payload?.message?.senderRole === "user"
      ) {
        setUserTyping(false);
        dispatch(markAdminTicketRead(activeTicketId));
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

    const handleUnreadCounts = (payload) => {
      dispatch(receiveSocketUnreadCounts(payload));
    };

    const handleTyping = (payload) => {
      if (
        activeTicketId &&
        String(payload?.ticketId) === activeTicketId &&
        payload?.senderRole === "user"
      ) {
        setUserTyping(Boolean(payload?.isTyping));
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("support:ticketCreated", handleTicketCreated);
    socket.on("support:newMessage", handleNewMessage);
    socket.on("support:ticketUpdated", handleTicketUpdated);
    socket.on("support:statusChanged", handleStatusChanged);
    socket.on("support:messagesRead", handleMessagesRead);
    socket.on("support:unreadCountUpdated", handleUnreadCounts);
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
      socket.off("support:unreadCountUpdated", handleUnreadCounts);
      socket.off("support:typing", handleTyping);
    };
  }, [activeTicketId, activeFilter, debouncedSearch, dispatch]);

  useEffect(() => {
    return () => {
      if (joinedTicketRef.current) {
        socket.emit("support:leaveTicket", {
          ticketId: joinedTicketRef.current,
        });
      }
    };
  }, []);

  // Scroll to bottom when new messages arrive in active conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [adminMessages.length, userTyping, activeTicketId]);

  // Client-side filter + search refinement over adminTickets so real-time socket additions also match filter
  const displayedTickets = useMemo(() => {
    let list = [...adminTickets];

    if (activeFilter === "unread") {
      list = list.filter((t) => (Number(t.unreadByAdmin) || 0) > 0);
    } else if (
      ["open", "in_progress", "resolved", "closed"].includes(activeFilter)
    ) {
      list = list.filter((t) => t.status === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((t) => {
        const name = String(t.user?.name || "").toLowerCase();
        const mobile = String(t.user?.mobile || "").toLowerCase();
        const uuid = String(t.user?.uuid || t.userUuid || "").toLowerCase();
        const tNum = String(t.ticketNumber || "").toLowerCase();
        const subj = String(t.subject || "").toLowerCase();
        const cat = String(t.category || "").toLowerCase();
        return (
          name.includes(q) ||
          mobile.includes(q) ||
          uuid.includes(q) ||
          tNum.includes(q) ||
          subj.includes(q) ||
          cat.includes(q)
        );
      });
    }

    list.sort(
      (a, b) =>
        new Date(b.lastMessageAt || b.updatedAt || b.createdAt || 0).getTime() -
        new Date(a.lastMessageAt || a.updatedAt || a.createdAt || 0).getTime()
    );

    return list;
  }, [adminTickets, activeFilter, searchQuery]);

  // Group active messages with date dividers
  const groupedMessages = useMemo(() => {
    const groups = [];
    let lastDate = null;

    adminMessages.forEach((msg) => {
      const label = formatDateDivider(msg.createdAt);
      if (label && label !== lastDate) {
        groups.push({ type: "divider", label, id: `div_${label}_${msg._id}` });
        lastDate = label;
      }
      groups.push({
        type: "message",
        data: msg,
        id: msg._id || msg.clientMessageId,
      });
    });

    return groups;
  }, [adminMessages]);

  // Select a conversation from left sidebar
  const handleSelectConversation = (ticket) => {
    setUserTyping(false);
    dispatch(setActiveAdminTicket(ticket));
    setMobileShowChat(true);
    setReplyText("");
  };

  // Typing handler
  const handleReplyInputChange = (e) => {
    const val = e.target.value;
    setReplyText(val);

    if (activeTicketId) {
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

  // Send admin reply
  const handleSendReply = async (e) => {
    e?.preventDefault();
    const trimmed = replyText.trim();
    if (!trimmed || !activeTicketId) return;

    if (activeAdminTicket?.status === "closed") {
      showToast(
        "error",
        "Cannot reply to a closed ticket. Change status to In Progress first."
      );
      return;
    }

    const targetTicketId = activeTicketId;
    const clientMessageId = makeClientId("adm_msg");
    setReplyText("");

    dispatch(
      addOptimisticAdminMessage({
        ticketId: targetTicketId,
        clientMessageId,
        message: trimmed,
        senderName: admin?.name || "Customer Support",
        senderUuid: admin?.uuid || "",
      })
    );

    const res = await dispatch(
      sendAdminReply({
        ticketId: targetTicketId,
        message: trimmed,
        clientMessageId,
      })
    );

    if (sendAdminReply.rejected.match(res)) {
      showToast("error", res.payload?.message || "Failed to send reply");
    }
  };

  // Retry failed admin message
  const handleRetryReply = async (failedMsg) => {
    if (!activeTicketId || !failedMsg) return;
    const retryClientId = failedMsg.clientMessageId || makeClientId("adm_msg");

    dispatch(
      addOptimisticAdminMessage({
        ticketId: activeTicketId,
        clientMessageId: retryClientId,
        message: failedMsg.message,
        senderName: admin?.name || "Customer Support",
        senderUuid: admin?.uuid || "",
      })
    );

    await dispatch(
      sendAdminReply({
        ticketId: activeTicketId,
        message: failedMsg.message,
        clientMessageId: retryClientId,
      })
    );
  };

  // Change ticket status
  const handleStatusChange = async (newStatus) => {
    if (!activeTicketId || updatingTicketStatus) return;
    if (activeAdminTicket?.status === newStatus) return;

    const result = await dispatch(
      updateAdminTicketStatus({
        ticketId: activeTicketId,
        status: newStatus,
      })
    );

    if (updateAdminTicketStatus.fulfilled.match(result)) {
      showToast(
        "success",
        `Ticket #${activeAdminTicket?.ticketNumber} marked as ${
          STATUS_CONFIG[newStatus]?.label || newStatus
        }`
      );
    } else {
      showToast("error", result.payload || "Failed to update status");
    }
  };

  // Add internal note
  const handleAddNote = async (e) => {
    e.preventDefault();
    const trimmed = noteInput.trim();
    if (!trimmed || !activeTicketId || addingInternalNote) return;

    const result = await dispatch(
      addAdminInternalNote({
        ticketId: activeTicketId,
        note: trimmed,
      })
    );

    if (addAdminInternalNote.fulfilled.match(result)) {
      setNoteInput("");
      showToast("success", "Internal note saved");
    } else {
      showToast("error", result.payload || "Failed to add note");
    }
  };

  // Delete internal note
  const handleDeleteNote = async (noteId) => {
    if (!activeTicketId || !noteId) return;
    await dispatch(
      deleteAdminInternalNote({
        ticketId: activeTicketId,
        noteId,
      })
    );
  };

  // Load older messages
  const handleLoadOlderMessages = () => {
    if (
      !activeTicketId ||
      adminMessagesLoading ||
      !adminMessagesPagination?.hasMore
    ) {
      return;
    }
    dispatch(
      fetchAdminTicketMessages({
        ticketId: activeTicketId,
        page: (adminMessagesPagination.page || 1) + 1,
      })
    );
  };

  const customer = activeAdminTicket?.user || {};
  const activeStatusMeta =
    STATUS_CONFIG[activeAdminTicket?.status] || STATUS_CONFIG.open;
  const internalNotes = activeAdminTicket?.internalNotes || [];

  return (
    <div className="relative flex h-[calc(100vh-112px)] min-h-[600px] w-full flex-col overflow-hidden rounded-[24px] border border-[#F3E7C4] bg-white shadow-[0_12px_40px_-12px_rgba(154,91,0,0.18)]">
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div
          className={`absolute right-4 top-3 z-50 flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-extrabold shadow-lg ${
            toast.type === "error"
              ? "border-red-300 bg-red-50 text-red-800"
              : "border-emerald-300 bg-emerald-50 text-emerald-800"
          }`}
        >
          <CheckCircle2 size={15} />
          <span>{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-1 rounded p-0.5 hover:bg-black/5"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* =====================================================
          WHATSAPP WEB SPLIT CONTAINER
      ===================================================== */}
      <div className="flex h-full w-full overflow-hidden">
        {/* ===================================================
            LEFT SIDEBAR — CUSTOMER & TICKET LIST
        =================================================== */}
        <div
          className={`flex h-full w-full flex-col border-r border-[#F3E7C4] bg-[#FFFDF7] md:w-[360px] lg:w-[400px] shrink-0 ${
            mobileShowChat ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Sidebar Header */}
          <div className="border-b border-[#F3E7C4] bg-gradient-to-r from-[#FFF9E3] via-[#FFFDF7] to-[#FFF3C4] px-4 py-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${GOLD_BG} text-[#1A1204] shadow-sm`}
                >
                  <Headphones size={20} strokeWidth={2.4} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-[15px] font-black tracking-tight text-[#1A1A1A]">
                      Support Desk
                    </h1>
                    {adminCounts.totalUnreadMessages > 0 && (
                      <span className="rounded-full bg-[#D93025] px-2 py-0.5 text-[10px] font-black text-white shadow-2xs">
                        {adminCounts.totalUnreadMessages} unread
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#9A5B00]">
                    {socketConnected ? (
                      <>
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span>Real-Time Live Sync</span>
                      </>
                    ) : (
                      <>
                        <WifiOff size={11} className="text-amber-600" />
                        <span>Reconnecting...</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  dispatch(
                    fetchAdminTickets({
                      filter: activeFilter,
                      search: debouncedSearch,
                      limit: 80,
                    })
                  )
                }
                title="Refresh Conversations"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#F3E7C4] bg-white text-[#9A5B00] transition hover:bg-[#FFEFA8]/60"
              >
                <RefreshCw
                  size={15}
                  className={adminTicketsLoading ? "animate-spin" : ""}
                />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mt-3">
              <Search
                size={15}
                className=" absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A5B00]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customer name, phone, or #TKT..."
                className="h-10 w-full rounded-xl border border-[#F3E7C4] bg-white pl-9 pr-8 text-xs font-semibold text-[#1A1A1A] placeholder:text-[#8A8F98] outline-none transition focus:border-[#F2B705] focus:ring-2 focus:ring-[#FFD83D]/30"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[#6B7280] hover:bg-gray-100"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {FILTER_TABS.map((tab) => {
                const isActive = activeFilter === tab.key;
                const count = adminCounts?.[tab.key] ?? 0;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveFilter(tab.key)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold transition ${
                      isActive
                        ? `${GOLD_BG} text-[#1A1204] shadow-xs`
                        : "border border-[#F3E7C4] bg-white text-[#6B7280] hover:bg-[#FFF9E3] hover:text-[#9A5B00]"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[9.5px] font-black ${
                        isActive
                          ? "bg-[#1A1204]/15 text-[#1A1204]"
                          : tab.key === "unread" && count > 0
                            ? "bg-[#D93025] text-white"
                            : "bg-[#F3E7C4]/70 text-[#7A4A00]"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#F3E7C4]/60">
            {adminTicketsLoading && displayedTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#9A5B00]">
                <Loader2 size={26} className="animate-spin" />
                <p className="mt-2 text-xs font-bold">
                  Loading customer conversations...
                </p>
              </div>
            ) : adminTicketsError && displayedTickets.length === 0 ? (
              <div className="p-6 text-center">
                <AlertCircle size={24} className="mx-auto text-red-500" />
                <p className="mt-2 text-xs font-bold text-red-600">
                  {adminTicketsError}
                </p>
              </div>
            ) : displayedTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF3C4] text-[#9A5B00]">
                  <MessageSquare size={22} />
                </div>
                <p className="mt-3 text-sm font-extrabold text-[#1A1A1A]">
                  No conversations found
                </p>
                <p className="mt-1 text-xs text-[#6B7280]">
                  {searchQuery
                    ? "Try clearing your search or switching filter tabs."
                    : "Customer support tickets will appear here in real time."}
                </p>
              </div>
            ) : (
              displayedTickets.map((ticket) => {
                const isSelected =
                  activeTicketId && String(ticket._id) === activeTicketId;
                const unread = Number(ticket.unreadByAdmin) || 0;
                const isUnread = unread > 0;
                const cust = ticket.user || {};
                const statusInfo =
                  STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;

                return (
                  <button
                    key={ticket._id}
                    type="button"
                    onClick={() => handleSelectConversation(ticket)}
                    className={`group relative flex w-full items-start gap-3 px-4 py-3.5 text-left transition ${
                      isSelected
                        ? "bg-gradient-to-r from-[#FFF3C4] via-[#FFF9E3] to-white border-l-4 border-l-[#F7B500]"
                        : isUnread
                          ? "bg-[#FFFBEA] hover:bg-[#FFF3C4]/60"
                          : "bg-white hover:bg-[#FFFDF7]"
                    }`}
                  >
                    {/* Customer Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 ${
                          isUnread
                            ? "border-[#F7B500] bg-[#FFF3C4]"
                            : "border-[#F3E7C4] bg-[#FFF9E3]"
                        } text-sm font-black text-[#9A5B00]`}
                      >
                        {cust.name
                          ? cust.name.charAt(0).toUpperCase()
                          : "U"}
                      </div>
                      {cust.isKycVerified && (
                        <span
                          className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white"
                          title="KYC Verified"
                        >
                          <Check size={9} strokeWidth={3} />
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`truncate text-[13.5px] ${
                            isUnread
                              ? "font-black text-[#1A1204]"
                              : "font-bold text-[#1A1A1A]"
                          }`}
                        >
                          {cust.name || "Customer"}
                        </p>
                        <span
                          className={`shrink-0 text-[10.5px] ${
                            isUnread
                              ? "font-extrabold text-[#D93025]"
                              : "font-medium text-[#8A8F98]"
                          }`}
                        >
                          {formatShortTime(ticket.lastMessageAt)}
                        </span>
                      </div>

                      {/* Phone + Ticket Number + Status */}
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[10.5px] font-extrabold text-[#9A5B00]">
                          #{ticket.ticketNumber}
                        </span>
                        {cust.mobile && (
                          <span className="text-[10.5px] font-semibold text-[#6B7280]">
                            • {cust.mobile}
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.2 text-[9px] font-extrabold ${statusInfo.badge}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`}
                          />
                          {statusInfo.label}
                        </span>
                      </div>

                      {/* Subject & Preview */}
                      <p className="mt-1 truncate text-xs font-bold text-[#374151]">
                        {ticket.subject}
                      </p>

                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <p
                          className={`truncate text-[11.5px] ${
                            isUnread
                              ? "font-bold text-[#1A1204]"
                              : "font-medium text-[#6B7280]"
                          }`}
                        >
                          {ticket.lastMessageSenderRole === "admin" && (
                            <span className="mr-1 text-[#9A5B00]">You:</span>
                          )}
                          {ticket.lastMessagePreview || "No messages"}
                        </p>

                        {isUnread && (
                          <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[#10B981] px-1.5 text-[10px] font-black text-white shadow-xs">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ===================================================
            RIGHT PANEL — ACTIVE CONVERSATION
        =================================================== */}
        <div
          className={`flex h-full flex-1 flex-col bg-[#F8F6F0] ${
            mobileShowChat ? "flex" : "hidden md:flex"
          }`}
        >
          {!activeAdminTicket ? (
            /* EMPTY STATE WHEN NO CONVERSATION IS SELECTED */
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-3xl ${GOLD_BG} text-[#1A1204] shadow-[0_12px_30px_rgba(247,181,0,0.4)]`}
              >
                <Headphones size={38} strokeWidth={2.2} />
              </div>
              <h2 className="mt-5 text-xl font-black text-[#1A1A1A]">
                Dear Lottery Support Center
              </h2>
              <p className="mt-1.5 max-w-md text-xs font-medium leading-relaxed text-[#6B7280]">
                Select any customer conversation from the left panel to view
                their ticket details, message history, and reply in real time.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[11px] font-bold text-[#9A5B00]">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F3E7C4] bg-white px-3 py-1.5 shadow-2xs">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  End-to-End Authenticated
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F3E7C4] bg-white px-3 py-1.5 shadow-2xs">
                  <Wifi size={14} className="text-[#F7B500]" />
                  Instant Socket.IO Delivery
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* =============================================
                  ACTIVE CONVERSATION TOP HEADER
              ============================================= */}
              <div className="border-b border-[#F3E7C4] bg-white px-4 py-3 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Left: Back button (mobile) + Customer Info */}
                  <div className="flex min-w-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setMobileShowChat(false)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] text-[#1A1A1A] md:hidden"
                      aria-label="Back to conversations"
                    >
                      <ArrowLeft size={17} />
                    </button>

                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${GOLD_BG} text-sm font-black text-[#1A1204] shadow-xs`}
                    >
                      {customer.name
                        ? customer.name.charAt(0).toUpperCase()
                        : "U"}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h2 className="truncate text-sm font-black text-[#1A1A1A]">
                          {customer.name || "Customer"}
                        </h2>
                        {customer.isKycVerified && (
                          <BadgeCheck
                            size={16}
                            className="shrink-0 text-emerald-600"
                            title="KYC Verified"
                          />
                        )}
                        <span className="rounded-md bg-[#1A1204] px-2 py-0.5 font-mono text-[10.5px] font-black text-[#FFD83D]">
                          #{activeAdminTicket.ticketNumber}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md border border-[#F3E7C4] bg-[#FFFDF7] px-2 py-0.5 text-[10.5px] font-bold text-[#9A5B00]">
                          <Tag size={10} />
                          {activeAdminTicket.category}
                        </span>
                      </div>

                      <div className="mt-0.5 flex flex-wrap items-center gap-2.5 text-[11px] font-semibold text-[#6B7280]">
                        {customer.mobile && (
                          <span className="inline-flex items-center gap-1">
                            <Phone size={11} className="text-[#9A5B00]" />
                            +91 {customer.mobile}
                          </span>
                        )}
                        {customer.uuid && (
                          <span className="font-mono text-[10.5px]">
                            UID: {customer.uuid.slice(0, 8)}
                          </span>
                        )}
                        {customer.wallet !== undefined && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                            <Wallet size={11} />₹
                            {Number(customer.wallet || 0).toLocaleString(
                              "en-IN"
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Status Controls & Internal Notes Toggle */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Status Action Buttons */}
                    <div className="flex items-center rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-1">
                      {[
                        { key: "open", label: "Open" },
                        { key: "in_progress", label: "In Progress" },
                        { key: "resolved", label: "Resolved" },
                        { key: "closed", label: "Closed" },
                      ].map((st) => {
                        const isCurrent = activeAdminTicket.status === st.key;
                        return (
                          <button
                            key={st.key}
                            type="button"
                            disabled={updatingTicketStatus}
                            onClick={() => handleStatusChange(st.key)}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-extrabold transition ${
                              isCurrent
                                ? `${GOLD_BG} text-[#1A1204] shadow-2xs`
                                : "text-[#6B7280] hover:text-[#1A1A1A]"
                            }`}
                          >
                            {st.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Internal Notes Button */}
                    <button
                      type="button"
                      onClick={() => setShowNotesPanel((prev) => !prev)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-extrabold transition ${
                        showNotesPanel
                          ? "border-[#F2B705] bg-[#FFF3C4] text-[#1A1204]"
                          : "border-[#F3E7C4] bg-white text-[#9A5B00] hover:bg-[#FFF9E3]"
                      }`}
                    >
                      <StickyNote size={14} />
                      <span>Notes ({internalNotes.length})</span>
                    </button>

                    {/* Customer Profile Drawer Toggle */}
                    <button
                      type="button"
                      onClick={() => setShowCustomerInfoPanel((prev) => !prev)}
                      className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition ${
                        showCustomerInfoPanel
                          ? "border-[#F2B705] bg-[#FFF3C4] text-[#1A1204]"
                          : "border-[#F3E7C4] bg-white text-[#6B7280] hover:bg-[#FFF9E3]"
                      }`}
                      title="Customer Info"
                    >
                      <UserRound size={14} />
                    </button>
                  </div>
                </div>

                {/* Subject bar */}
                <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-[#F3E7C4]/80 bg-[#FFFDF7] px-3 py-1.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText size={13} className="shrink-0 text-[#9A5B00]" />
                    <p className="truncate text-xs font-extrabold text-[#1A1A1A]">
                      Subject: {activeAdminTicket.subject}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${activeStatusMeta.badge}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${activeStatusMeta.dot}`}
                    />
                    {activeStatusMeta.label}
                  </span>
                </div>
              </div>

              {/* =============================================
                  MAIN BODY: MESSAGES + OPTIONAL SIDE PANELS
              ============================================= */}
              <div className="relative flex flex-1 overflow-hidden">
                {/* MESSAGE LIST */}
                <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
                  {/* Load older messages */}
                  {adminMessagesPagination?.hasMore && (
                    <div className="mb-3 text-center">
                      <button
                        type="button"
                        onClick={handleLoadOlderMessages}
                        disabled={adminMessagesLoading}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#F3E7C4] bg-white px-3.5 py-1 text-xs font-bold text-[#9A5B00] shadow-2xs hover:bg-[#FFF9E3]"
                      >
                        {adminMessagesLoading ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <RefreshCw size={13} />
                        )}
                        <span>Load older messages</span>
                      </button>
                    </div>
                  )}

                  {adminMessagesLoading && adminMessages.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center py-12 text-[#9A5B00]">
                      <Loader2 size={28} className="animate-spin" />
                      <p className="mt-2 text-xs font-bold">
                        Loading conversation messages...
                      </p>
                    </div>
                  ) : adminMessagesError && adminMessages.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                      <AlertCircle size={28} className="text-red-500" />
                      <p className="mt-2 text-xs font-bold text-red-600">
                        {adminMessagesError}
                      </p>
                    </div>
                  ) : groupedMessages.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center py-12 text-center text-[#6B7280]">
                      <Ticket size={28} className="text-[#9A5B00]" />
                      <p className="mt-2 text-xs font-bold">
                        No messages in this conversation yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {groupedMessages.map((item) => {
                        if (item.type === "divider") {
                          return (
                            <div
                              key={item.id}
                              className="my-2 flex items-center justify-center"
                            >
                              <span className="rounded-full border border-[#F3E7C4] bg-white px-3 py-0.5 text-[10.5px] font-extrabold text-[#9A5B00] shadow-2xs">
                                {item.label}
                              </span>
                            </div>
                          );
                        }

                        const msg = item.data;
                        const isAdminMsg = msg.senderRole === "admin";
                        const isFailed = msg.sendStatus === "failed";
                        const isSending = msg.sendStatus === "sending";

                        return (
                          <div
                            key={item.id}
                            className={`flex flex-col ${
                              isAdminMsg ? "items-end" : "items-start"
                            }`}
                          >
                            <div
                              className={`max-w-[78%] rounded-2xl px-4 py-2.5 shadow-xs ${
                                isAdminMsg
                                  ? isFailed
                                    ? "rounded-br-xs border border-red-300 bg-red-50 text-red-900"
                                    : "rounded-br-xs border border-[#F2B705]/60 bg-gradient-to-br from-[#FFF3C4] via-[#FFE680] to-[#FFD83D] text-[#1A1204]"
                                  : "rounded-bl-xs border border-[#E5E7EB] bg-white text-[#1A1A1A]"
                              }`}
                            >
                              <div className="mb-1 flex items-center justify-between gap-3">
                                <span
                                  className={`text-[10.5px] font-black ${
                                    isAdminMsg
                                      ? "text-[#7A4A00]"
                                      : "text-[#ED1D43]"
                                  }`}
                                >
                                  {isAdminMsg
                                    ? msg.senderName || "Support Admin"
                                    : msg.senderName ||
                                      customer.name ||
                                      "Customer"}
                                </span>
                              </div>

                              <p className="whitespace-pre-wrap break-words text-[13px] font-medium leading-relaxed">
                                {msg.message}
                              </p>

                              <div
                                className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                                  isAdminMsg
                                    ? "text-[#7A4A00]"
                                    : "text-[#9CA3AF]"
                                }`}
                              >
                                <span>{formatMessageClock(msg.createdAt)}</span>
                                {isAdminMsg && (
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
                                      <CheckCheck
                                        size={13}
                                        className="text-emerald-700"
                                        title="Read by Customer"
                                      />
                                    ) : (
                                      <Check
                                        size={12}
                                        title="Delivered"
                                      />
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            {isFailed && (
                              <div className="mt-1 flex items-center gap-2 text-[11px]">
                                <span className="text-red-600">
                                  {msg.error || "Failed to send"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRetryReply(msg)}
                                  className="font-extrabold text-[#9A5B00] underline"
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
                                        role: "admin",
                                      })
                                    )
                                  }
                                  className="text-gray-500 hover:underline"
                                >
                                  Dismiss
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {userTyping && (
                        <div className="flex items-start">
                          <div className="rounded-2xl rounded-bl-xs border border-[#E5E7EB] bg-white px-3.5 py-2 text-xs font-semibold text-[#6B7280] shadow-2xs">
                            {customer.name || "Customer"} is typing...
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* ===========================================
                    INTERNAL ADMIN NOTES DRAWER (ADMIN ONLY)
                =========================================== */}
                {showNotesPanel && (
                  <div className="flex w-72 shrink-0 flex-col border-l border-[#F3E7C4] bg-[#FFFDF7] p-3.5 sm:w-80">
                    <div className="mb-3 flex items-center justify-between border-b border-[#F3E7C4] pb-2.5">
                      <div className="flex items-center gap-1.5">
                        <Lock size={14} className="text-[#9A5B00]" />
                        <h3 className="text-xs font-black uppercase tracking-wider text-[#1A1A1A]">
                          Internal Admin Notes
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowNotesPanel(false)}
                        className="rounded-lg p-1 text-[#6B7280] hover:bg-gray-100"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <p className="mb-2.5 rounded-lg border border-amber-200 bg-amber-50/80 px-2.5 py-1.5 text-[10.5px] font-semibold text-[#9A5B00]">
                      Private notes visible only to administrators. Never shown
                      to the customer.
                    </p>

                    <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                      {internalNotes.length === 0 ? (
                        <p className="py-8 text-center text-xs text-[#8A8F98]">
                          No internal notes added yet.
                        </p>
                      ) : (
                        internalNotes.map((n) => (
                          <div
                            key={n._id}
                            className="rounded-xl border border-[#F3E7C4] bg-white p-2.5 text-xs shadow-2xs"
                          >
                            <div className="mb-1 flex items-center justify-between gap-1">
                              <span className="font-extrabold text-[#9A5B00]">
                                {n.adminName || "Admin"}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-[#8A8F98]">
                                  {formatShortTime(n.createdAt)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteNote(n._id)}
                                  className="text-red-500 hover:text-red-700"
                                  title="Delete note"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                            <p className="whitespace-pre-wrap break-words text-[#1A1A1A]">
                              {n.note}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    <form onSubmit={handleAddNote} className="mt-3 pt-2 border-t border-[#F3E7C4]">
                      <textarea
                        rows={2}
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="Add private admin note..."
                        maxLength={2000}
                        className="w-full resize-none rounded-xl border border-[#F3E7C4] bg-white p-2.5 text-xs font-medium text-[#1A1A1A] outline-none focus:border-[#F2B705]"
                      />
                      <button
                        type="submit"
                        disabled={addingInternalNote || !noteInput.trim()}
                        className={`mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-black text-[#1A1204] shadow-xs transition disabled:opacity-50 ${GOLD_BG}`}
                      >
                        {addingInternalNote ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Plus size={13} />
                        )}
                        <span>Save Internal Note</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* ===========================================
                    CUSTOMER PROFILE DETAILS SIDE PANEL
                =========================================== */}
                {showCustomerInfoPanel && (
                  <div className="flex w-72 shrink-0 flex-col border-l border-[#F3E7C4] bg-[#FFFDF7] p-4">
                    <div className="mb-3 flex items-center justify-between border-b border-[#F3E7C4] pb-2.5">
                      <h3 className="text-xs font-black uppercase tracking-wider text-[#1A1A1A]">
                        Customer Profile
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowCustomerInfoPanel(false)}
                        className="rounded-lg p-1 text-[#6B7280] hover:bg-gray-100"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="rounded-xl border border-[#F3E7C4] bg-white p-3">
                        <p className="text-[10.5px] font-bold uppercase text-[#8A8F98]">
                          Full Name
                        </p>
                        <p className="mt-0.5 font-extrabold text-[#1A1A1A]">
                          {customer.name || "N/A"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#F3E7C4] bg-white p-3">
                        <p className="text-[10.5px] font-bold uppercase text-[#8A8F98]">
                          Mobile Number
                        </p>
                        <p className="mt-0.5 font-mono font-extrabold text-[#1A1A1A]">
                          +91 {customer.mobile || "N/A"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#F3E7C4] bg-white p-3">
                        <p className="text-[10.5px] font-bold uppercase text-[#8A8F98]">
                          Customer UID
                        </p>
                        <p className="mt-0.5 break-all font-mono text-[11px] font-bold text-[#9A5B00]">
                          {customer.uuid || activeAdminTicket.userUuid || "N/A"}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-[#F3E7C4] bg-white p-3">
                          <p className="text-[10.5px] font-bold uppercase text-[#8A8F98]">
                            Wallet
                          </p>
                          <p className="mt-0.5 font-black text-emerald-700">
                            ₹
                            {Number(customer.wallet || 0).toLocaleString(
                              "en-IN"
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#F3E7C4] bg-white p-3">
                          <p className="text-[10.5px] font-bold uppercase text-[#8A8F98]">
                            KYC Status
                          </p>
                          <p
                            className={`mt-0.5 font-black ${
                              customer.isKycVerified
                                ? "text-emerald-600"
                                : "text-amber-600"
                            }`}
                          >
                            {customer.isKycVerified ? "Verified" : "Pending"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* =============================================
                  MESSAGE COMPOSER & QUICK REPLIES
              ============================================= */}
              <div className="border-t border-[#F3E7C4] bg-white p-3">
                {/* Quick Replies Bar */}
                {activeAdminTicket.status !== "closed" && (
                  <div className="mb-2 flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-wider text-[#9A5B00]">
                      Quick Reply:
                    </span>
                    {QUICK_REPLIES.map((qr, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setReplyText(qr);
                          replyInputRef.current?.focus();
                        }}
                        className="shrink-0 rounded-full border border-[#F3E7C4] bg-[#FFFDF7] px-2.5 py-1 text-[11px] font-semibold text-[#6B7280] transition hover:border-[#F2B705] hover:bg-[#FFF3C4] hover:text-[#1A1204]"
                      >
                        {qr.length > 48 ? `${qr.slice(0, 48)}...` : qr}
                      </button>
                    ))}
                  </div>
                )}

                {activeAdminTicket.status === "closed" ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                    <p className="text-xs font-bold text-slate-600">
                      This support ticket is closed. Reopen it to send a new
                      message to the customer.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleStatusChange("in_progress")}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-black text-[#1A1204] shadow-xs ${GOLD_BG}`}
                    >
                      <RotateCcw size={13} />
                      <span>Reopen as In Progress</span>
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSendReply}
                    className="flex items-end gap-2.5"
                  >
                    <textarea
                      ref={replyInputRef}
                      rows={2}
                      value={replyText}
                      onChange={handleReplyInputChange}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply(e);
                        }
                      }}
                      placeholder={`Reply to ${
                        customer.name || "customer"
                      } (#${activeAdminTicket.ticketNumber})...`}
                      maxLength={5000}
                      className="max-h-28 min-h-[44px] flex-1 resize-none rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] px-3.5 py-2.5 text-xs font-semibold text-[#1A1A1A] placeholder:text-[#8A8F98] outline-none transition focus:border-[#F2B705] focus:bg-white focus:ring-2 focus:ring-[#FFD83D]/30"
                    />

                    <button
                      type="submit"
                      disabled={!replyText.trim()}
                      className={`flex h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl px-5 text-xs font-black text-[#1A1204] shadow-[0_6px_16px_-3px_rgba(227,154,0,0.6)] transition hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${GOLD_BG}`}
                    >
                      <Send size={15} />
                      <span>Send Reply</span>
                    </button>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSupportChat;
