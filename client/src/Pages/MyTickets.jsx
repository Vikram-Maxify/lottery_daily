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
  Trophy,
  Wallet,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  clearLotteryConfigError,
  getMyLotteryEntries,
} from "../reducer/slice/createLotteryConfigSlice";

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

// Page background (notch cutouts use the same color)
const PAGE_BG = "#EEF3FA";

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
    () => successfulTickets.filter((t) => t.status === "won").length,
    [successfulTickets],
  );
  const lostCount = useMemo(
    () => successfulTickets.filter((t) => t.status === "lost").length,
    [successfulTickets],
  );

  const tabs = [
    { key: "all", label: "All", count: successfulTickets.length },
    { key: "daily", label: "Daily", count: dailyCount },
    { key: "festival", label: "Festival", count: festivalCount },
    { key: "won", label: "Winners", count: winnerCount },
    { key: "lost", label: "Lost", count: lostCount },
  ];

  const filteredTickets = useMemo(() => {
    if (activeTab === "all") return successfulTickets;
    if (activeTab === "daily")
      return successfulTickets.filter((t) => t.lotteryType === "daily");
    if (activeTab === "festival")
      return successfulTickets.filter((t) => t.lotteryType === "festival");
    if (activeTab === "won")
      return successfulTickets.filter((t) => t.status === "won");
    if (activeTab === "lost")
      return successfulTickets.filter((t) => t.status === "lost");
    return successfulTickets;
  }, [successfulTickets, activeTab]);

  const copyId = async (id) => {
    try {
      await navigator.clipboard.writeText(String(id));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {}
  };

  const statChips = [
    { label: "Total", value: successfulTickets.length },
    { label: "Daily", value: dailyCount },
    { label: "Festival", value: festivalCount },
    { label: "Winners", value: winnerCount },
  ];

  return (
    <div
      className="w-full min-h-screen text-[#131E3D] selection:bg-[#FFD84A] selection:text-black"
      style={{ backgroundColor: PAGE_BG }}
    >
      <main className="relative mx-auto w-full max-w-[500px] min-h-screen pb-[96px]">
        {/* =====================================================
            HERO HEADER
        ===================================================== */}
        <div className="relative overflow-hidden rounded-b-[32px] bg-gradient-to-br from-[#0E1A45] via-[#1B2B65] to-[#142050] px-4 pt-5 pb-14 text-white shadow-[0_14px_35px_rgba(15,28,77,0.25)]">
          <div className="pointer-events-none absolute -right-14 -top-14 h-52 w-52 rounded-full bg-[#ED1D43]/25 blur-3xl" />
          <div className="pointer-events-none absolute -left-14 top-10 h-44 w-44 rounded-full bg-[#FFD84A]/15 blur-3xl" />

          <div className="relative flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label="Go back"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md transition hover:bg-white/20 active:scale-95"
              >
                <ArrowLeft size={18} />
              </button>

              <div className="min-w-0">
                <h1 className="flex items-center gap-2 truncate text-[22px] font-black leading-tight tracking-tight">
                  <Ticket
                    size={22}
                    className="shrink-0 -rotate-12 text-[#FFD84A]"
                  />
                  <span className="truncate">My Tickets</span>
                </h1>
                <p className="truncate text-[11px] text-white/65">
                  Confirmed Daily & Festival purchases
                </p>
              </div>
            </div>

            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#FFD84A]/40 bg-[#FFD84A]/15 px-3 py-1 text-[11px] font-black text-[#FFD84A]">
              <Sparkles size={12} />
              {successfulTickets.length}{" "}
              {successfulTickets.length === 1 ? "Ticket" : "Tickets"}
            </span>
          </div>
        </div>

        {/* =====================================================
            FLOATING STAT CHIPS
        ===================================================== */}
        <div className="relative z-10 -mt-9 px-3.5">
          <div className="grid grid-cols-4 gap-1.5 rounded-[22px] border border-[#E2E8F0] bg-white p-2 shadow-[0_10px_28px_rgba(15,28,77,0.12)]">
            {statChips.map((s, i) => (
              <div
                key={s.label}
                className={`flex flex-col items-center rounded-2xl py-2 ${
                  i === 3
                    ? "border border-emerald-200 bg-emerald-50"
                    : "bg-[#F8FAFC]"
                }`}
              >
                <span
                  className={`text-lg font-black leading-none ${
                    i === 3 ? "text-emerald-600" : "text-[#131E3D]"
                  }`}
                >
                  {myEntriesLoading ? "–" : s.value}
                </span>
                <span
                  className={`mt-1 text-[10px] font-bold uppercase tracking-wide ${
                    i === 3 ? "text-emerald-700" : "text-[#5A6788]"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* =====================================================
            TABS
        ===================================================== */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto px-3.5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            const activeClass =
              tab.key === "won"
                ? "bg-gradient-to-r from-emerald-500 to-emerald-700 text-white shadow-[0_6px_16px_rgba(16,185,129,0.4)]"
                : "bg-gradient-to-r from-[#ED1D43] to-[#C70F31] text-white shadow-[0_6px_16px_rgba(237,29,67,0.35)]";
            const idleClass =
              tab.key === "won"
                ? "border border-emerald-200 bg-white text-emerald-700 hover:border-emerald-300"
                : tab.key === "lost"
                  ? "border border-red-200 bg-white text-red-600 hover:border-red-300"
                  : "border border-[#E2E8F0] bg-white text-[#5A6788] hover:border-[#CBD5E1]";

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs font-extrabold transition-all active:scale-95 ${
                  active ? activeClass : idleClass
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 text-[10px] font-black leading-[16px] ${
                    active
                      ? "bg-white/25 text-white"
                      : "bg-[#F1F5F9] text-[#5A6788]"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* =====================================================
            STATES + LIST
        ===================================================== */}
        <div className="mt-3 space-y-3 px-3.5">
          {/* LOADING SKELETON */}
          {myEntriesLoading && (
            <>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="animate-pulse overflow-hidden rounded-[16px] border border-[#E2E8F0] bg-white shadow-sm"
                >
                  <div className="h-9 bg-[#1B2B65]/80" />
                  <div className="space-y-2 p-3">
                    <div className="flex gap-1">
                      {Array.from({ length: 8 }).map((_, k) => (
                        <div
                          key={k}
                          className="h-7 w-6 rounded-md bg-[#F1F5F9]"
                        />
                      ))}
                    </div>
                    <div className="h-8 rounded-lg bg-[#F8FAFC]" />
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ERROR */}
          {!myEntriesLoading && error && !successfulTickets.length && (
            <div className="flex flex-col items-center rounded-[22px] border border-red-200 bg-red-50 p-5 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-[#ED1D43]">
                <AlertCircle size={24} />
              </div>
              <p className="mt-2 text-xs font-semibold text-red-700">
                {String(error)}
              </p>
              <button
                type="button"
                onClick={() => dispatch(getMyLotteryEntries())}
                className="mt-3 rounded-xl bg-gradient-to-r from-[#0E1A45] to-[#1B2B65] px-5 py-2 text-xs font-black text-white shadow-md transition active:scale-95"
              >
                Retry
              </button>
            </div>
          )}

          {/* TICKETS */}
          {!myEntriesLoading &&
            filteredTickets.map((ticket, idx) => (
              <TicketCard
                key={`${ticket.id}-${idx}`}
                ticket={ticket}
                copyId={copyId}
                copiedId={copiedId}
              />
            ))}

          {/* EMPTY */}
          {!myEntriesLoading && !error && filteredTickets.length === 0 && (
            <div className="flex flex-col items-center rounded-[24px] border border-[#E2E8F0] bg-white p-7 text-center shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-[#FFD84A]/50 bg-gradient-to-br from-amber-50 to-white">
                <Ticket size={30} className="-rotate-12 text-[#B8860B]" />
              </div>
              <h3 className="mt-3 text-base font-black text-[#131E3D]">
                No Confirmed Tickets Found
              </h3>
              <p className="mt-1 max-w-[260px] text-xs text-[#5A6788]">
                {activeTab === "all"
                  ? "You have not purchased any tickets yet. Pick your lucky numbers today!"
                  : `No confirmed tickets found in ${activeTab} category.`}
              </p>

              <div className="mt-4 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => navigate("/buy-ticket")}
                  className="rounded-xl bg-gradient-to-r from-[#ED1D43] to-[#C70F31] px-4 py-2.5 text-xs font-black text-white shadow-[0_6px_18px_rgba(237,29,67,0.35)] transition active:scale-95"
                >
                  Daily Lottery
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/festival")}
                  className="rounded-xl bg-gradient-to-r from-[#0E1A45] to-[#1B2B65] px-4 py-2.5 text-xs font-black text-white shadow-[0_6px_18px_rgba(15,28,77,0.3)] transition active:scale-95"
                >
                  Festival Lottery
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// =====================================================
// STATUS THEMES (won = green, lost = red, default = navy)
// =====================================================
const THEMES = {
  won: {
    header: "from-[#064E3B] via-[#047857] to-[#065F46]",
    badge: "border-emerald-200/60 bg-emerald-400 text-[#022C22]",
    digit:
      "border-emerald-400 bg-gradient-to-b from-emerald-50 to-emerald-100 text-emerald-800",
    divider: "border-emerald-300",
    notch: "border-emerald-500",
    stubBox: "border-emerald-200 bg-emerald-50",
    stubIcon: "text-emerald-700",
    paidBox: "bg-[#064E3B]",
    paidText: "text-emerald-300",
    paidIcon: "text-emerald-300",
  },
  lost: {
    header: "from-[#4C0519] via-[#9F1239] to-[#7F1D1D]",
    badge: "border-red-200/50 bg-red-500/30 text-red-100",
    digit:
      "border-red-300 bg-gradient-to-b from-red-50 to-red-100 text-red-800",
    divider: "border-red-300",
    notch: "border-red-400",
    stubBox: "border-red-200 bg-red-50",
    stubIcon: "text-red-700",
    paidBox: "bg-[#7F1D1D]",
    paidText: "text-red-200",
    paidIcon: "text-red-200",
  },
  default: {
    header: "from-[#0E1A45] via-[#1B2B65] to-[#142050]",
    badge: "border-emerald-400/40 bg-emerald-500/20 text-emerald-300",
    digit:
      "border-[#E2E8F0] bg-gradient-to-b from-white to-[#F1F5F9] text-[#131E3D]",
    divider: "border-[#CBD5E1]",
    notch: "border-[#E2E8F0]",
    stubBox: "border-[#E2E8F0] bg-[#F8FAFC]",
    stubIcon: "text-[#1B2B65]",
    paidBox: "bg-[#0E1A45]",
    paidText: "text-[#FFD84A]",
    paidIcon: "text-[#FFD84A]",
  },
};

// =====================================================
// TICKET CARD COMPONENT (COMPACT)
// =====================================================
const TicketCard = ({ ticket, copyId, copiedId }) => {
  const [showAllTickets, setShowAllTickets] = useState(false);
  const isWinner = ticket.status === "won";
  const isLost = ticket.status === "lost";
  const isFestival = ticket.isFestival;
  const isCopied = copiedId === ticket.id;

  const t = isWinner ? THEMES.won : isLost ? THEMES.lost : THEMES.default;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-[16px] bg-white ${t.card}`}
    >
      {/* ================= HEADER ================= */}
      <div
        className={`relative flex items-center justify-between gap-2 bg-gradient-to-r px-3 py-2 ${t.header}`}
      >
        <div className="relative flex min-w-0 items-center gap-1.5">
          <span
            className={`shrink-0 rounded border border-white/25 px-1.5 py-[1px] text-[8px] font-black uppercase tracking-wider text-white ${
              isFestival
                ? "bg-gradient-to-r from-[#B8860B] to-[#D4A017]"
                : "bg-gradient-to-r from-[#ED1D43] to-[#C70F31]"
            }`}
          >
            {isFestival ? "Festival" : "Daily"}
          </span>
          <span className="truncate text-xs font-black text-white">
            {ticket.marketName}
          </span>
        </div>

        <span
          className={`relative inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-[2px] text-[9px] font-extrabold ${t.badge}`}
        >
          {isWinner ? (
            <Trophy size={10} />
          ) : isLost ? (
            <XCircle size={10} />
          ) : (
            <CheckCircle2 size={10} />
          )}
          {isWinner ? "Winner" : isLost ? "Lost" : "Confirmed"}
        </span>
      </div>

      {/* ================= TICKET NUMBER ================= */}
      <div className="px-3 pt-2 pb-2.5">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#8A97AB]">
            Ticket No.
          </span>

          <div className="flex items-center gap-1">
            {ticket.ticketCount > 1 && (
              <span className="rounded-full bg-[#ED1D43] px-1.5 py-[1px] text-[8px] font-black text-white">
                {ticket.ticketCount} Tickets
              </span>
            )}
            {ticket.prizes?.first > 0 && (
              <span className="inline-flex items-center gap-0.5 rounded-full border border-[#FFD84A]/60 bg-amber-50 px-1.5 py-[1px] text-[8px] font-black text-[#8A6100]">
                <Crown size={9} />
                1st {formatPrize(ticket.prizes.first)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-nowrap items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ticket.digits.length > 0 ? (
            ticket.digits.map((char, idx) => (
              <div
                key={idx}
                className={`flex h-7 w-6 shrink-0 select-all items-center justify-center rounded-md border font-mono text-sm font-black ${t.digit}`}
              >
                {char}
              </div>
            ))
          ) : (
            <span className="text-xs text-[#8A97AB]">—</span>
          )}
        </div>

        {/* BULK EXPAND */}
        {ticket.ticketCount > 1 && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setShowAllTickets((p) => !p)}
              className={`flex items-center gap-1 text-[10px] font-extrabold hover:underline ${
                isWinner ? "text-emerald-600" : "text-[#ED1D43]"
              }`}
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
              <div className="mt-1.5 flex max-h-28 flex-wrap gap-1 overflow-y-auto pr-1">
                {ticket.ticketNumbers.map((num, i) => (
                  <button
                    type="button"
                    key={`${num}-${i}`}
                    onClick={() => copyId(num)}
                    title="Tap to copy"
                    className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-black text-[#131E3D] transition active:scale-95 ${t.stubBox}`}
                  >
                    {copiedId === num ? (
                      <span className="text-[9px] text-emerald-600">
                        Copied!
                      </span>
                    ) : (
                      <>
                        {num}
                        <Copy size={9} className="text-[#8A97AB]" />
                      </>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= DASHED DIVIDER WITH NOTCHES ================= */}
      <div className="relative h-0">
        <div
          className={`absolute -left-2 -top-2 h-4 w-4 rounded-full border ${t.notch}`}
          style={{ backgroundColor: PAGE_BG }}
        />
        <div
          className={`absolute -right-2 -top-2 h-4 w-4 rounded-full border ${t.notch}`}
          style={{ backgroundColor: PAGE_BG }}
        />
        <div className={`mx-3 border-t border-dashed ${t.divider}`} />
      </div>

      {/* ================= STUB ================= */}
      <div className="px-3 pt-2.5 pb-2">
        {/* 3 columns: Draw / Purchased / Amount */}
        <div className="grid grid-cols-3 gap-1.5">
          <div className={`min-w-0 rounded-lg border px-2 py-1.5 ${t.stubBox}`}>
            <p className="flex items-center gap-1 text-[8px] font-extrabold uppercase leading-none tracking-wide text-[#8A97AB]">
              <Calendar size={9} className={t.stubIcon} />
              Draw
            </p>
            <p className="mt-1 truncate text-[10px] font-black leading-tight text-[#131E3D]">
              {ticket.drawDate.full}
            </p>
            <p className="text-[9px] font-semibold leading-tight text-[#5A6788]">
              {ticket.drawTime}
            </p>
          </div>

          <div className={`min-w-0 rounded-lg border px-2 py-1.5 ${t.stubBox}`}>
            <p className="flex items-center gap-1 text-[8px] font-extrabold uppercase leading-none tracking-wide text-[#8A97AB]">
              <Clock3 size={9} className={t.stubIcon} />
              Bought
            </p>
            <p className="mt-1 truncate text-[10px] font-black leading-tight text-[#131E3D]">
              {ticket.purchaseDate}
            </p>
            <p className="text-[9px] font-semibold leading-tight text-[#5A6788]">
              {ticket.purchaseTime}
            </p>
          </div>

          <div
            className={`flex min-w-0 flex-col justify-center rounded-lg px-2 py-1.5 ${t.paidBox}`}
          >
            <p className="flex items-center gap-1 text-[8px] font-extrabold uppercase leading-none tracking-wide text-white/60">
              <Wallet size={9} className={t.paidIcon} />
              Paid
            </p>
            <p
              className={`mt-1 truncate text-sm font-black leading-tight ${t.paidText}`}
            >
              {ticket.price}
            </p>
          </div>
        </div>

        {/* ORDER ID */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1 text-[9px]">
            <span className="font-bold text-[#8A97AB]">Order</span>
            <span className="truncate font-mono font-black text-[#131E3D]">
              {ticket.id}
            </span>
          </div>

          <button
            type="button"
            onClick={() => copyId(ticket.id)}
            title="Copy Order ID"
            className={`flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-extrabold transition active:scale-95 ${
              isCopied
                ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                : "border-[#E2E8F0] bg-white text-[#5A6788] hover:bg-[#F8FAFC]"
            }`}
          >
            {isCopied ? (
              "Copied!"
            ) : (
              <>
                <Copy size={9} />
                Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyTickets;
