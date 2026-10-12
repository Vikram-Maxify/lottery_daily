import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Copy,
  Crown,
  Sparkles,
  Ticket,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  clearLotteryConfigError,
  getMyLotteryEntries,
} from "../reducer/slice/createLotteryConfigSlice";

// =====================================================
// CONSTANTS - EXACT COLORS FROM SCREENSHOT
// =====================================================
const COLORS = {
  red: "#D32F2F",
  redSoft: "#E57373",
  navy: "#0F1F3D",
  navyLight: "#1A2C4E",
  grayBg: "#F5F5F5",
  grayBorder: "#E0E0E0",
  grayText: "#6B7280",
  gold: "#F5C542",
  goldDark: "#B8860B",
};

// =====================================================
// ENGLISH MONTH NAMES
// =====================================================
const MONTH_NAMES_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// =====================================================
// DATE FORMATTER
// =====================================================
const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// =====================================================
// TIME FORMATTER
// =====================================================
const formatTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// =====================================================
// TIME STRING FORMATTER
// =====================================================
const formatTimeStr = (str) => {
  if (!str) return "06:30 PM";
  const parts = String(str).trim().split(":");
  if (parts.length < 2) return String(str);
  let h = parseInt(parts[0], 10);
  const m = parts[1].padStart(2, "0");
  if (Number.isNaN(h)) return String(str);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
};

// =====================================================
// AMOUNT FORMATTER
// =====================================================
const formatAmount = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "₹0";
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

// =====================================================
// DRAW DATE FORMATTER
// =====================================================
const formatDrawDate = (item) => {
  const drawDateValue = item?.drawDate;
  if (drawDateValue) {
    const date = new Date(drawDateValue);
    if (!Number.isNaN(date.getTime())) {
      const day = date.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
      });
      const month = date.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        month: "short",
      });
      const year = date.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
      });
      return { day, month, year, full: `${day} ${month} ${year}` };
    }
  }
  const m = item?.month;
  const y = item?.year;
  if (m && y) {
    const month = MONTH_NAMES_EN[Number(m) - 1] || "";
    return { day: "—", month, year: String(y), full: `${month} ${y}` };
  }
  return { day: "—", month: "", year: "", full: "—" };
};

// =====================================================
// PRIZE FORMAT HELPER
// =====================================================
const formatPrize = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "₹0";
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2).replace(/\.00$/, "")} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2).replace(/\.00$/, "")} Lakh`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
};

// =====================================================
// STATUS NORMALIZER
// =====================================================
const normalizeStatus = (status) => {
  const value = String(status || "")
    .toLowerCase()
    .trim();
  if (value === "win" || value === "winner" || value === "won") return "won";
  if (value === "lost" || value === "loss") return "lost";
  if (value === "cancelled" || value === "canceled") return "cancelled";
  if (value === "pending") return "pending";
  return "confirmed";
};

// =====================================================
// MAIN COMPONENT: MY TICKETS
// =====================================================
const MyTickets = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("all");
  const [copiedId, setCopiedId] = useState(null);

  const {
    myEntries = [],
    myEntriesLoading = false,
    error = null,
  } = useSelector((state) => state.createLotteryConfig || {});

  useEffect(() => {
    dispatch(getMyLotteryEntries());
    return () => {
      dispatch(clearLotteryConfigError());
    };
  }, [dispatch]);

  const rawTickets = useMemo(() => {
    const entries = Array.isArray(myEntries) ? myEntries : [];
    return entries.map((item, index) => {
      const entry = item?.entry || item;
      const lotteryType = String(
        item?.lotteryType || (item?.isFestival ? "festival" : "daily"),
      ).toLowerCase();
      const isFestival = lotteryType === "festival";
      const lotteryTypeLabel = isFestival
        ? "Festival Lottery"
        : "Daily Lottery";

      const marketName =
        String(
          item?.marketName ||
            entry?.marketName ||
            (isFestival ? "Festival Lottery" : "Daily Lottery"),
        )
          .trim()
          .replace(/\s+/g, " ") || "Lottery";

      const rawNumbers =
        Array.isArray(item?.ticketNumbers) && item.ticketNumbers.length > 0
          ? item.ticketNumbers
          : Array.isArray(entry?.lotteryNumbers) &&
              entry.lotteryNumbers.length > 0
            ? entry.lotteryNumbers
            : item?.number
              ? [String(item.number)]
              : entry?.number
                ? [String(entry.number)]
                : [];

      const ticketNumbers = rawNumbers
        .map((n) => String(n).trim())
        .filter(Boolean);
      const primaryNumber = String(ticketNumbers[0] || "").trim();
      const status = normalizeStatus(entry?.status ?? item?.status);

      const id =
        item?.orderId ||
        item?.entryId ||
        entry?._id ||
        entry?.id ||
        item?._id ||
        `TCK-${index}`;

      const drawDate = formatDrawDate(item);
      const drawTime = item?.drawTime
        ? formatTimeStr(item.drawTime)
        : "06:30 PM";
      const prizes = item?.prizes || entry?.prizes || {};
      const purchaseDate = formatDate(entry?.createdAt ?? item?.createdAt);
      const purchaseTime = formatTime(entry?.createdAt ?? item?.createdAt);
      const amount = Number(entry?.amount ?? item?.amount ?? item?.price ?? 0);

      const paymentStatusCode =
        item?.paymentStatusCode ??
        (item?.paymentStatus === "Success" ? 1 : entry?.status === 1 ? 1 : 0);

      const isSuccessful =
        item?.isSuccessful === true ||
        item?.paymentStatus === "Success" ||
        paymentStatusCode === 1;

      return {
        id,
        orderId: item?.orderId || null,
        lotteryType,
        lotteryTypeLabel,
        isFestival,
        marketName,
        ticketNumbers,
        primaryNumber,
        digits: primaryNumber ? primaryNumber.split("") : [],
        ticketCount: ticketNumbers.length || 1,
        status,
        paymentStatusCode,
        isSuccessful,
        drawDate,
        drawTime,
        price: formatAmount(amount),
        rawAmount: amount,
        purchaseDate,
        purchaseTime,
        prizes: {
          first: Number(prizes?.first) || 0,
          second: Number(prizes?.second) || 0,
          third: Number(prizes?.third) || 0,
        },
      };
    });
  }, [myEntries]);

  const successfulTickets = useMemo(() => {
    return rawTickets.filter((t) => {
      return (
        t.isSuccessful &&
        t.paymentStatusCode === 1 &&
        t.status !== "pending" &&
        t.status !== "cancelled"
      );
    });
  }, [rawTickets]);

  const dailyCount = useMemo(
    () => successfulTickets.filter((t) => t.lotteryType === "daily").length,
    [successfulTickets],
  );
  const festivalCount = useMemo(
    () => successfulTickets.filter((t) => t.lotteryType === "festival").length,
    [successfulTickets],
  );
  const winnerCount = useMemo(
    () =>
      successfulTickets.filter((t) => t.status === "won" || t.status === "win")
        .length,
    [successfulTickets],
  );

  const tabs = [
    { key: "all", label: "All", count: successfulTickets.length },
    { key: "daily", label: "Daily Lottery", count: dailyCount },
    { key: "festival", label: "Festival Lottery", count: festivalCount },
    { key: "won", label: "Winners", count: winnerCount },
  ];

  const filteredTickets = useMemo(() => {
    if (activeTab === "all") return successfulTickets;
    if (activeTab === "daily")
      return successfulTickets.filter((t) => t.lotteryType === "daily");
    if (activeTab === "festival")
      return successfulTickets.filter((t) => t.lotteryType === "festival");
    if (activeTab === "won")
      return successfulTickets.filter(
        (t) => t.status === "won" || t.status === "win",
      );
    return successfulTickets;
  }, [successfulTickets, activeTab]);

  const copyId = async (id) => {
    try {
      await navigator.clipboard.writeText(String(id));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {}
  };

  return (
    <div
      className="w-full min-h-screen pt-6 pb-[96px] px-3 sm:px-4"
      style={{ backgroundColor: "#FFFFFF" }}
    >
      <main className="w-full max-w-[490px] mx-auto">
        {/* ============================================ */}
        {/* HEADER - Navy & Gold like screenshot */}
        {/* ============================================ */}
        <div
          className="flex items-center justify-between gap-3 border-b pb-3"
          style={{ borderColor: COLORS.grayBorder }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center transition active:scale-95 shadow-sm"
              style={{
                backgroundColor: COLORS.grayBg,
                border: `1px solid ${COLORS.grayBorder}`,
                color: COLORS.navy,
              }}
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Ticket
                  size={20}
                  strokeWidth={2}
                  className="rotate-[-15deg] shrink-0"
                  style={{ color: COLORS.gold }}
                />
                <h1
                  className="text-lg sm:text-xl font-black tracking-tight truncate"
                  style={{ color: COLORS.navy }}
                >
                  My Tickets
                </h1>
              </div>
              <p
                className="text-[11px] truncate"
                style={{ color: COLORS.grayText }}
              >
                Confirmed Daily & Festival lottery purchases
              </p>
            </div>
          </div>

          <div
            className="shrink-0 px-2.5 py-1 rounded-lg text-right"
            style={{
              backgroundColor: "#FEF3C7",
              border: `1px solid ${COLORS.gold}`,
            }}
          >
            <span
              className="text-xs font-black"
              style={{ color: COLORS.goldDark }}
            >
              {successfulTickets.length}{" "}
              {successfulTickets.length === 1 ? "Ticket" : "Tickets"}
            </span>
          </div>
        </div>

        {/* ============================================ */}
        {/* TABS - Exact style from screenshot */}
        {/* ============================================ */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mt-3 pb-1">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0"
                style={
                  active
                    ? {
                        backgroundColor: COLORS.navy,
                        color: "#FFFFFF",
                        border: `1px solid ${COLORS.navy}`,
                        boxShadow: "0 2px 6px rgba(15, 31, 61, 0.25)",
                      }
                    : {
                        backgroundColor: COLORS.grayBg,
                        color: COLORS.grayText,
                        border: `1px solid ${COLORS.grayBorder}`,
                      }
                }
              >
                <span>{tab.label}</span>
                <span
                  className="text-[10px] px-1.5 py-0.2 rounded-full font-black"
                  style={
                    active
                      ? {
                          backgroundColor: "rgba(255,255,255,0.2)",
                          color: "#FFFFFF",
                        }
                      : { backgroundColor: "#E5E7EB", color: COLORS.grayText }
                  }
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ============================================ */}
        {/* LOADING STATE */}
        {/* ============================================ */}
        {myEntriesLoading ? (
          <div
            className="mt-6 h-[160px] rounded-xl flex flex-col items-center justify-center"
            style={{
              backgroundColor: COLORS.grayBg,
              border: `1px solid ${COLORS.grayBorder}`,
            }}
          >
            <Ticket
              size={32}
              className="animate-pulse"
              style={{ color: COLORS.gold }}
            />
            <p
              className="mt-2 text-xs font-semibold"
              style={{ color: COLORS.grayText }}
            >
              Loading your tickets...
            </p>
          </div>
        ) : error && !successfulTickets.length ? (
          <div
            className="mt-6 rounded-xl p-4 flex flex-col items-center text-center"
            style={{
              backgroundColor: "#FEF2F2",
              border: "1px solid #FECACA",
            }}
          >
            <AlertCircle size={28} style={{ color: COLORS.red }} />
            <p
              className="mt-1.5 text-xs font-medium"
              style={{ color: COLORS.red }}
            >
              {error}
            </p>
            <button
              type="button"
              onClick={() => dispatch(getMyLotteryEntries())}
              className="mt-2.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition"
              style={{
                backgroundColor: COLORS.navy,
                color: "#FFFFFF",
              }}
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* ============================================ */}
        {/* TICKETS LIST */}
        {/* ============================================ */}
        <div className="mt-3.5 space-y-3">
          {filteredTickets.length > 0 ? (
            filteredTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                copyId={copyId}
                isCopied={copiedId === ticket.id}
              />
            ))
          ) : !myEntriesLoading ? (
            <div
              className="mt-6 rounded-xl p-6 flex flex-col items-center text-center"
              style={{
                backgroundColor: COLORS.grayBg,
                border: `1px solid ${COLORS.grayBorder}`,
              }}
            >
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: "#FEF3C7",
                  border: `1px solid ${COLORS.gold}`,
                }}
              >
                <Ticket size={24} style={{ color: COLORS.goldDark }} />
              </div>
              <h3
                className="mt-2.5 text-sm font-bold"
                style={{ color: COLORS.navy }}
              >
                No Confirmed Tickets Found
              </h3>
              <p
                className="mt-1 text-xs max-w-[260px]"
                style={{ color: COLORS.grayText }}
              >
                {activeTab === "all"
                  ? "You have not purchased any tickets yet. Pick your lucky numbers today!"
                  : `No confirmed tickets found in ${activeTab} category.`}
              </p>
              <div className="mt-3.5 flex items-center gap-2">
                {/* Daily Lottery - RED button like screenshot */}
                <button
                  type="button"
                  onClick={() => navigate("/buy-ticket")}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-black text-white shadow transition active:scale-95"
                  style={{ backgroundColor: COLORS.red }}
                >
                  Daily Lottery
                </button>
                {/* Festival Lottery - NAVY button like screenshot */}
                <button
                  type="button"
                  onClick={() => navigate("/festival")}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-black text-white shadow transition active:scale-95"
                  style={{ backgroundColor: COLORS.navy }}
                >
                  Festival Lottery
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
};

// =====================================================
// TICKET CARD COMPONENT
// =====================================================
const TicketCard = ({ ticket, copyId, isCopied }) => {
  const [showAllTickets, setShowAllTickets] = useState(false);
  const isWinner = ticket.status === "won" || ticket.status === "win";
  const isFestival = ticket.isFestival;

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden shadow-md"
      style={{
        backgroundColor: "#FFFFFF",
        border: `1px solid ${COLORS.grayBorder}`,
      }}
    >
      {/* ============================================ */}
      {/* TOP HEADER BAR - Navy like screenshot */}
      {/* ============================================ */}
      <div
        className="relative z-[20] flex items-center justify-between gap-2 px-3 py-2"
        style={{
          backgroundColor: COLORS.navy,
          borderBottom: `1px solid ${COLORS.navyLight}`,
        }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-white"
            style={{
              backgroundColor: isFestival ? COLORS.goldDark : COLORS.red,
            }}
          >
            {ticket.lotteryTypeLabel}
          </span>
          <span className="text-xs font-black text-white truncate">
            {ticket.marketName}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-black" style={{ color: COLORS.gold }}>
            {ticket.price}
          </span>
          <span
            className="px-1.5 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1"
            style={
              isWinner
                ? {
                    backgroundColor: "rgba(16, 185, 129, 0.2)",
                    color: "#6EE7B7",
                    border: "1px solid rgba(16, 185, 129, 0.4)",
                  }
                : {
                    backgroundColor: "rgba(96, 165, 250, 0.2)",
                    color: "#93C5FD",
                    border: "1px solid rgba(96, 165, 250, 0.4)",
                  }
            }
          >
            {isWinner ? (
              <>
                <Sparkles size={10} style={{ color: "#6EE7B7" }} />
                Winner
              </>
            ) : (
              <>
                <CheckCircle2 size={10} style={{ color: "#93C5FD" }} />
                Confirmed
              </>
            )}
          </span>
        </div>
      </div>

      {/* ============================================ */}
      {/* BODY */}
      {/* ============================================ */}
      <div className="relative z-[20] p-2.5 sm:p-3 space-y-2">
        {/* TICKET NUMBER STRIP */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: COLORS.grayText }}
            >
              Ticket Number
            </span>
            {ticket.ticketCount > 1 && (
              <span
                className="text-[9px] font-extrabold px-1.5 py-0.2 rounded text-white"
                style={{ backgroundColor: COLORS.red }}
              >
                {ticket.ticketCount} Tickets
              </span>
            )}
          </div>

          {/* 8-CHARACTER HORIZONTAL STRIP */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-nowrap overflow-x-auto no-scrollbar">
            {ticket.digits.map((char, idx) => (
              <div
                key={idx}
                className="h-8 w-7 sm:h-8.5 sm:w-7.5 shrink-0 rounded-md flex items-center justify-center text-sm sm:text-base font-black font-mono select-all"
                style={{
                  backgroundColor: COLORS.grayBg,
                  border: `1px solid ${COLORS.grayBorder}`,
                  color: COLORS.navy,
                }}
              >
                {char}
              </div>
            ))}
          </div>
        </div>

        {/* BULK EXPANDABLE TICKETS */}
        {ticket.ticketCount > 1 && (
          <div
            className="pt-1"
            style={{ borderTop: `1px solid ${COLORS.grayBorder}` }}
          >
            <button
              type="button"
              onClick={() => setShowAllTickets((prev) => !prev)}
              className="text-[11px] font-bold flex items-center gap-1 hover:underline"
              style={{ color: COLORS.red }}
            >
              <span>
                {showAllTickets
                  ? "Hide all tickets"
                  : `View all ${ticket.ticketCount} ticket numbers`}
              </span>
              {showAllTickets ? (
                <ChevronUp size={12} />
              ) : (
                <ChevronDown size={12} />
              )}
            </button>

            {showAllTickets && (
              <div className="mt-1.5 flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-1">
                {ticket.ticketNumbers.map((num, i) => (
                  <span
                    key={i}
                    onClick={() => copyId(num)}
                    className="cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-black transition active:scale-95"
                    style={{
                      backgroundColor: COLORS.grayBg,
                      border: `1px solid ${COLORS.grayBorder}`,
                      color: COLORS.navy,
                    }}
                    title="Click to copy"
                  >
                    {num}
                    <Copy size={9} style={{ color: COLORS.grayText }} />
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DETAILS ROW */}
        <div
          className="grid grid-cols-2 gap-2 rounded-lg px-2.5 py-1.5 text-[11px]"
          style={{
            backgroundColor: COLORS.grayBg,
            border: `1px solid ${COLORS.grayBorder}`,
          }}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Calendar
              size={12}
              style={{ color: COLORS.navy }}
              className="shrink-0"
            />
            <div className="min-w-0">
              <span
                className="block text-[9px] uppercase font-bold leading-none"
                style={{ color: COLORS.grayText }}
              >
                Draw Date & Time
              </span>
              <span
                className="font-extrabold truncate block mt-0.5"
                style={{ color: COLORS.navy }}
              >
                {ticket.drawDate.full} • {ticket.drawTime}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 min-w-0">
            <Clock3
              size={12}
              style={{ color: COLORS.navy }}
              className="shrink-0"
            />
            <div className="min-w-0">
              <span
                className="block text-[9px] uppercase font-bold leading-none"
                style={{ color: COLORS.grayText }}
              >
                Purchased On
              </span>
              <span
                className="font-semibold truncate block mt-0.5"
                style={{ color: COLORS.navy }}
              >
                {ticket.purchaseDate}, {ticket.purchaseTime}
              </span>
            </div>
          </div>
        </div>

        {/* FOOTER ROW */}
        <div
          className="pt-1 flex items-center justify-between text-[10px]"
          style={{ borderTop: `1px solid ${COLORS.grayBorder}` }}
        >
          <div className="flex items-center gap-1 min-w-0 truncate">
            <span style={{ color: COLORS.grayText }}>Order:</span>
            <span
              className="font-mono font-bold truncate"
              style={{ color: COLORS.navy }}
            >
              {ticket.id}
            </span>
            <button
              type="button"
              onClick={() => copyId(ticket.id)}
              className="p-0.5 transition shrink-0"
              style={{ color: COLORS.grayText }}
              title="Copy Order ID"
            >
              {isCopied ? (
                <span
                  className="text-[9px] font-bold"
                  style={{ color: "#059669" }}
                >
                  Copied!
                </span>
              ) : (
                <Copy size={10} />
              )}
            </button>
          </div>

          {ticket.prizes?.first > 0 && (
            <div
              className="flex items-center gap-1 text-[10px] font-black shrink-0"
              style={{ color: COLORS.goldDark }}
            >
              <Crown size={11} style={{ color: COLORS.goldDark }} />
              <span>1st Prize: {formatPrize(ticket.prizes.first)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyTickets;
