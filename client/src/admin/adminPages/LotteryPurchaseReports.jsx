import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  IndianRupee,
  PartyPopper,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  Ticket,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import api from "../../reducer/api";

/* =========================================================
   WINZOX THEME CONSTANTS & STYLES
========================================================= */
const CARD_CLS =
  "rounded-2xl border border-[#F3E7C4] bg-white shadow-[0_6px_18px_-10px_rgba(247,181,0,0.35)]";

const GOLD_BTN =
  "bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] text-[#1A1204] font-extrabold shadow-[0_4px_10px_-3px_rgba(227,154,0,0.55),inset_0_1px_0_rgba(255,255,255,0.55)] hover:brightness-105 transition-all";

const OUTLINE_BTN =
  "border border-[#F2B705] bg-white font-bold text-[#9A5B00] hover:bg-[#FFEFA8]/60 transition-all";

const INPUT_CLS =
  "w-full rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] px-4 py-2.5 text-sm text-[#1A1A1A] outline-none transition placeholder:text-[#8A8F98] focus:border-[#F2B705] focus:ring-2 focus:ring-[#FFEFA8]";

const TH_CLS =
  "px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-[#9A5B00] whitespace-nowrap";

const TD_CLS = "px-4 py-3.5 text-sm text-[#1A1A1A]";

/* =========================================================
   HELPERS
========================================================= */
const formatINR = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(num);
};

// Safe number formatter (API se field missing ho to crash na ho)
const fmtNum = (val) => (Number(val) || 0).toLocaleString("en-IN");

const getTodayIST = () => {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  } catch {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
};

const getYesterdayIST = () => {
  try {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(d);
  } catch {
    return getTodayIST();
  }
};

const formatDateTimeIST = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const dt = new Date(dateStr);
    return dt.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return String(dateStr);
  }
};

/* =========================================================
   STATUS BADGES
========================================================= */
const PaymentBadge = ({ status }) => {
  const s = String(status || "").toLowerCase();
  if (s === "success") {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="h-3 w-3" />
        Success
      </span>
    );
  }
  if (s === "pending") {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200">
        <Clock className="h-3 w-3" />
        Pending
      </span>
    );
  }
  if (s === "failed") {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-200">
        <XCircle className="h-3 w-3" />
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700 border border-gray-200">
      {status || "Unknown"}
    </span>
  );
};

const TicketStatusBadge = ({ status }) => {
  const s = String(status || "").toLowerCase();
  if (s === "won" || s === "win") {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-50 px-2.5 py-1 text-xs font-extrabold text-amber-800 border border-amber-300">
        <Sparkles className="h-3 w-3 text-amber-600" />
        Won
      </span>
    );
  }
  if (s === "lost") {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 border border-gray-200">
        Lost
      </span>
    );
  }
  if (s === "payment pending") {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 border border-orange-200">
        Payment Pending
      </span>
    );
  }
  if (s === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 border border-rose-200">
        Cancelled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
      Active
    </span>
  );
};

/* =========================================================
   TICKET CHIPS (first ticket + "+N more")
   Table aur mobile card dono me use hota hai
========================================================= */
const TicketChips = ({ tickets, onViewAll }) => {
  const displayFirst = tickets[0] || "-";
  const extraCount = tickets.length - 1;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono text-xs font-bold text-amber-900">
        {displayFirst}
      </span>
      {extraCount > 0 && (
        <button
          onClick={onViewAll}
          className="rounded-md border border-[#F2B705] bg-[#FFEFA8] px-1.5 py-0.5 text-[10px] font-extrabold text-[#9A5B00] transition-colors hover:bg-[#FFD83D]"
          title="Click to view all ticket numbers"
        >
          +{extraCount} more
        </button>
      )}
    </div>
  );
};

/* =========================================================
   MAIN COMPONENT
========================================================= */
const LotteryPurchaseReports = () => {
  // State
  const [lotteryType, setLotteryType] = useState("daily"); // "daily" | "festival"
  const [selectedDate, setSelectedDate] = useState(getTodayIST());
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Data State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState({
    stats: {
      totalOrders: 0,
      totalTickets: 0,
      totalTicketsSold: 0,
      totalAmount: 0,
      successfulPurchases: 0,
      successfulRevenue: 0,
      pendingPurchases: 0,
      failedPurchases: 0,
    },
    records: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1,
    },
  });

  // Modal for Viewing Full Ticket Numbers
  const [ticketModal, setTicketModal] = useState({
    open: false,
    orderId: "",
    marketName: "",
    userName: "",
    ticketNumbers: [],
  });
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch Report Data
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/lottery-reports", {
        params: {
          type: lotteryType,
          date: selectedDate,
          search: debouncedSearch,
          page,
          limit,
        },
      });

      if (res.data?.success && res.data?.data) {
        setReportData(res.data.data);
      } else {
        setError(res.data?.message || "Failed to load report data");
      }
    } catch (err) {
      console.error("Fetch lottery reports error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Network error while fetching report",
      );
    } finally {
      setLoading(false);
    }
  }, [lotteryType, selectedDate, debouncedSearch, page, limit]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Modal open/close helpers
  const closeTicketModal = () =>
    setTicketModal({
      open: false,
      orderId: "",
      marketName: "",
      userName: "",
      ticketNumbers: [],
    });

  const openTicketModal = (row) =>
    setTicketModal({
      open: true,
      orderId: row.orderId,
      marketName: row.marketName,
      userName: row.userName,
      ticketNumbers: row.ticketNumbers || [],
    });

  // Modal open hone par background scroll lock + Esc se close
  useEffect(() => {
    if (!ticketModal.open) return undefined;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") closeTicketModal();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [ticketModal.open]);

  // Handle Tab Switch
  const handleTypeChange = (type) => {
    if (type === lotteryType) return;
    setLotteryType(type);
    setPage(1);
  };

  // Copy Ticket Number
  const handleCopyTicket = (ticket, index) => {
    navigator.clipboard.writeText(ticket);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const records = reportData.records || [];
    if (records.length === 0) return;

    const headers = [
      "Order ID",
      "User Name",
      "User UID",
      "Mobile",
      "Lottery Type",
      "Market Name",
      "Ticket Count",
      "Ticket Numbers",
      "Amount (INR)",
      "Purchase Date & Time",
      "Payment Status",
      "Ticket Status",
    ];

    const rows = records.map((r) => [
      `"${r.orderId || ""}"`,
      `"${r.userName || ""}"`,
      `"${r.uid || ""}"`,
      `"${r.mobile || ""}"`,
      `"${r.lotteryType || ""}"`,
      `"${r.marketName || ""}"`,
      r.ticketCount || 0,
      `"${(r.ticketNumbers || []).join(", ")}"`,
      r.amount || 0,
      `"${formatDateTimeIST(r.createdAt)}"`,
      `"${r.paymentStatus || ""}"`,
      `"${r.ticketStatus || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Lottery_Purchases_${lotteryType.toUpperCase()}_${selectedDate}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const { stats, records, pagination } = reportData;

  const todayIST = getTodayIST();
  const yesterdayIST = getYesterdayIST();

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-3 pb-12 sm:space-y-6 sm:px-4 lg:px-0">
      {/* =====================================================
          HEADER SECTION
      ===================================================== */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-[#FFD83D] to-[#F7B500] text-[#1A1204] shadow-md">
            <ShoppingBag className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-lg font-black leading-tight text-[#1A1A1A] sm:text-2xl">
              Lottery Purchase Reports
            </h1>
            <p className="text-[11px] font-semibold text-[#8A8F98] sm:text-xs">
              Real-time purchase logs, user tickets & revenue statistics
            </p>
          </div>
        </div>

        {/* Action Controls: Refresh & Export */}
        <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-center">
          <button
            onClick={fetchReports}
            disabled={loading}
            className={`flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold ${OUTLINE_BTN}`}
            title="Refresh Report Data"
          >
            <RefreshCw
              className={`h-4 w-4 text-[#9A5B00] ${loading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={loading || records.length === 0}
            className={`flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-extrabold ${GOLD_BTN} disabled:opacity-50`}
            title="Export CSV Report"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* =====================================================
          LOTTERY TYPE TOGGLE & DATE FILTER BAR
      ===================================================== */}
      <div className={`${CARD_CLS} p-3 sm:p-5`}>
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Lottery Type Segmented Toggle */}
          <div className="grid w-full grid-cols-2 gap-1 rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-1.5 shadow-inner lg:inline-flex lg:w-auto">
            <button
              onClick={() => handleTypeChange("daily")}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-black transition-all sm:gap-2 sm:px-5 ${
                lotteryType === "daily"
                  ? "bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] text-[#1A1204] shadow-md"
                  : "text-[#6B7280] hover:text-[#1A1A1A]"
              }`}
            >
              <Ticket className="h-4 w-4 shrink-0" />
              <span className="truncate">Daily Lottery</span>
            </button>

            <button
              onClick={() => handleTypeChange("festival")}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-black transition-all sm:gap-2 sm:px-5 ${
                lotteryType === "festival"
                  ? "bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] text-[#1A1204] shadow-md"
                  : "text-[#6B7280] hover:text-[#1A1A1A]"
              }`}
            >
              <PartyPopper className="h-4 w-4 shrink-0" />
              <span className="truncate">Festival Lottery</span>
            </button>
          </div>

          {/* Date Selection Controls */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-[#F3E7C4] bg-[#FFFDF7] p-1 sm:flex sm:items-center">
              <button
                onClick={() => {
                  setSelectedDate(todayIST);
                  setPage(1);
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedDate === todayIST
                    ? "bg-[#FFEFA8] text-[#9A5B00] shadow-sm font-extrabold"
                    : "text-[#6B7280] hover:bg-[#FFEFA8]/40"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => {
                  setSelectedDate(yesterdayIST);
                  setPage(1);
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedDate === yesterdayIST
                    ? "bg-[#FFEFA8] text-[#9A5B00] shadow-sm font-extrabold"
                    : "text-[#6B7280] hover:bg-[#FFEFA8]/40"
                }`}
              >
                Yesterday
              </button>
            </div>

            {/* Custom Date Picker */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(e.target.value);
                  setPage(1);
                }
              }}
              className="w-full rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] px-3.5 py-2 text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#F2B705] focus:ring-2 focus:ring-[#FFEFA8] sm:w-auto"
            />
          </div>
        </div>

        {/* Search Bar Input */}
        <div className="mt-3 border-t border-[#F3E7C4]/60 pt-3 sm:mt-4 sm:pt-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8F98]" />
            <input
              type="text"
              placeholder="Search Order ID, Name, Mobile, Ticket..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${INPUT_CLS} pl-10 pr-9`}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8F98] hover:text-[#1A1A1A]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================
          SUMMARY STATISTICS CARDS (4 Main Cards)
      ===================================================== */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Card 1: Total Orders */}
        <div className={`${CARD_CLS} relative overflow-hidden p-3.5 sm:p-5`}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9A5B00] sm:text-xs">
                Total Orders
              </p>
              <h3 className="mt-1 break-words text-xl font-black text-[#1A1A1A] sm:text-2xl">
                {loading ? "..." : fmtNum(stats.totalOrders)}
              </h3>
              <p className="mt-1 text-[10px] font-semibold text-[#8A8F98] sm:text-[11px]">
                {lotteryType === "daily" ? "Daily" : "Festival"} on{" "}
                {selectedDate}
              </p>
            </div>
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-600 min-[400px]:flex sm:h-12 sm:w-12">
              <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500" />
        </div>

        {/* Card 2: Total Tickets Sold */}
        <div className={`${CARD_CLS} relative overflow-hidden p-3.5 sm:p-5`}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9A5B00] sm:text-xs">
                Tickets Sold
              </p>
              <h3 className="mt-1 break-words text-xl font-black text-[#1A1A1A] sm:text-2xl">
                {loading ? "..." : fmtNum(stats.totalTicketsSold)}
              </h3>
              <p className="mt-1 text-[10px] font-semibold text-emerald-600 sm:text-[11px]">
                {stats.totalTickets > stats.totalTicketsSold
                  ? `(${stats.totalTickets} incl. pending)`
                  : "Verified successful tickets"}
              </p>
            </div>
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-blue-600 min-[400px]:flex sm:h-12 sm:w-12">
              <Ticket className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-400 to-blue-500" />
        </div>

        {/* Card 3: Total Purchase Amount */}
        <div className={`${CARD_CLS} relative overflow-hidden p-3.5 sm:p-5`}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9A5B00] sm:text-xs">
                Purchase Amount
              </p>
              <h3 className="mt-1 break-words text-xl font-black text-[#1A1A1A] sm:text-2xl">
                {loading ? "..." : formatINR(stats.totalAmount)}
              </h3>
              <p className="mt-1 text-[10px] font-semibold text-[#8A8F98] sm:text-[11px]">
                Gross volume, all orders
              </p>
            </div>
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600 min-[400px]:flex sm:h-12 sm:w-12">
              <IndianRupee className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-500" />
        </div>

        {/* Card 4: Successful Purchases / Revenue */}
        <div className={`${CARD_CLS} relative overflow-hidden p-3.5 sm:p-5`}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9A5B00] sm:text-xs">
                Successful
              </p>
              <h3 className="mt-1 break-words text-xl font-black text-emerald-700 sm:text-2xl">
                {loading
                  ? "..."
                  : `${fmtNum(stats.successfulPurchases)} orders`}
              </h3>
              <p className="mt-1 break-words text-[10px] font-bold text-emerald-600 sm:text-[11px]">
                Revenue: {formatINR(stats.successfulRevenue)}
              </p>
            </div>
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-[#FFD83D] to-[#F7B500] text-[#1A1204] shadow-sm min-[400px]:flex sm:h-12 sm:w-12">
              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#FFD83D] to-[#F7B500]" />
        </div>
      </div>

      {/* =====================================================
          ERROR STATE WITH RETRY
      ===================================================== */}
      {error && (
        <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5 sm:items-center">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 sm:mt-0" />
            <p className="break-words text-sm font-semibold">{error}</p>
          </div>
          <button
            onClick={fetchReports}
            className="shrink-0 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 sm:py-1.5"
          >
            Retry
          </button>
        </div>
      )}

      {/* =====================================================
          RECORDS (Cards on mobile/tablet, Table on desktop)
      ===================================================== */}
      <div className={`${CARD_CLS} overflow-hidden`}>
        <div className="flex flex-col gap-3 border-b border-[#F3E7C4] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
          <div className="min-w-0">
            <h2 className="text-base font-black text-[#1A1A1A]">
              Purchase Records ({fmtNum(pagination.total)})
            </h2>
            <p className="text-xs font-semibold text-[#8A8F98]">
              Detailed lottery orders for {selectedDate} (
              {lotteryType === "daily" ? "Daily Lottery" : "Festival Lottery"})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-[#8A8F98]">Show:</label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-[#F3E7C4] bg-[#FFFDF7] px-2 py-1 text-xs font-bold text-[#1A1A1A] outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-16 text-center sm:py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#F7B500] border-r-transparent align-[-0.125em]" />
            <p className="mt-3 text-sm font-bold text-[#9A5B00]">
              Loading lottery purchase records...
            </p>
          </div>
        ) : records.length === 0 ? (
          /* Empty State */
          <div className="px-4 py-14 text-center sm:py-16">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFEFA8]/50 text-[#9A5B00]">
              <Ticket className="h-7 w-7" />
            </div>
            <h3 className="mt-3 text-base font-black text-[#1A1A1A]">
              No Purchase Records Found
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-xs font-semibold text-[#8A8F98]">
              There are no {lotteryType} lottery purchases recorded for{" "}
              {selectedDate}.
              {debouncedSearch && " Try clearing your search query."}
            </p>
            {debouncedSearch && (
              <button
                onClick={() => setSearchTerm("")}
                className={`mt-4 rounded-xl px-4 py-2 text-xs font-bold ${OUTLINE_BTN}`}
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          <>
            {/* ---------- MOBILE / TABLET: CARD LIST ---------- */}
            <div className="grid grid-cols-1 gap-3 bg-[#FFFDF7]/50 p-3 sm:grid-cols-2 sm:p-4 lg:hidden">
              {records.map((row) => {
                const tickets = row.ticketNumbers || [];

                return (
                  <div
                    key={row._id}
                    className="min-w-0 rounded-xl border border-[#F3E7C4] bg-white p-3.5 shadow-sm"
                  >
                    {/* Top: Order ID + Amount */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-all font-mono text-xs font-bold text-[#1A1A1A]">
                          {row.orderId || "-"}
                        </p>
                        <p className="text-[10px] uppercase text-[#8A8F98]">
                          {row.channel || "QwackPay"}
                        </p>
                      </div>
                      <p className="shrink-0 text-base font-black text-[#1A1A1A]">
                        {formatINR(row.amount)}
                      </p>
                    </div>

                    {/* Badges */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <PaymentBadge status={row.paymentStatus} />
                      <TicketStatusBadge status={row.ticketStatus} />
                    </div>

                    {/* User */}
                    <div className="mt-3 flex items-start justify-between gap-3 border-t border-[#F3E7C4]/60 pt-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#1A1A1A]">
                          {row.userName || "User"}
                        </p>
                        <div className="flex items-center gap-1 text-[11px] text-[#6B7280]">
                          <Phone className="h-3 w-3 shrink-0 text-[#9A5B00]" />
                          <span className="truncate">{row.mobile || "-"}</span>
                        </div>
                        {row.uid && row.uid !== "-" && (
                          <p className="truncate text-[10px] text-[#8A8F98]">
                            UID: {row.uid}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="max-w-[120px] truncate text-xs font-bold text-[#1A1A1A]">
                          {row.marketName ||
                            (lotteryType === "festival" ? "Festival" : "Daily")}
                        </p>
                        <span className="mt-0.5 inline-block rounded bg-[#FFEFA8]/70 px-1.5 py-0.5 text-[10px] font-bold text-[#9A5B00]">
                          {row.lotteryType}
                        </span>
                      </div>
                    </div>

                    {/* Tickets */}
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#F3E7C4]/60 pt-3">
                      <div className="min-w-0">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#9A5B00]">
                          Ticket(s)
                        </p>
                        <TicketChips
                          tickets={tickets}
                          onViewAll={() => openTicketModal(row)}
                        />
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#9A5B00]">
                          Count
                        </p>
                        <span className="inline-flex items-center justify-center rounded-lg bg-gray-100 px-2 py-1 text-xs font-bold text-[#1A1A1A]">
                          {row.ticketCount}
                        </span>
                      </div>
                    </div>

                    {/* Date */}
                    <p className="mt-3 text-[11px] font-semibold text-[#8A8F98]">
                      {formatDateTimeIST(row.createdAt)}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* ---------- DESKTOP: TABLE ---------- */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[950px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#F3E7C4] bg-[#FFFDF7]">
                    <th className={TH_CLS}>Order ID</th>
                    <th className={TH_CLS}>User Details</th>
                    <th className={TH_CLS}>Lottery & Market</th>
                    <th className={TH_CLS}>Ticket(s)</th>
                    <th className={TH_CLS}>Count</th>
                    <th className={TH_CLS}>Amount</th>
                    <th className={TH_CLS}>Date & Time</th>
                    <th className={TH_CLS}>Payment</th>
                    <th className={TH_CLS}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3E7C4]/60">
                  {records.map((row) => {
                    const tickets = row.ticketNumbers || [];

                    return (
                      <tr
                        key={row._id}
                        className="transition-colors hover:bg-[#FFFDF7]/60"
                      >
                        {/* Order ID */}
                        <td className={TD_CLS}>
                          <div className="font-mono text-xs font-bold text-[#1A1A1A]">
                            {row.orderId || "-"}
                          </div>
                          <div className="text-[10px] uppercase text-[#8A8F98]">
                            {row.channel || "QwackPay"}
                          </div>
                        </td>

                        {/* User Info */}
                        <td className={TD_CLS}>
                          <div className="text-sm font-bold text-[#1A1A1A]">
                            {row.userName || "User"}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-[#6B7280]">
                            <Phone className="h-3 w-3 text-[#9A5B00]" />
                            <span>{row.mobile || "-"}</span>
                          </div>
                          {row.uid && row.uid !== "-" && (
                            <div className="text-[10px] text-[#8A8F98]">
                              UID: {row.uid}
                            </div>
                          )}
                        </td>

                        {/* Lottery & Market */}
                        <td className={TD_CLS}>
                          <div className="text-xs font-bold text-[#1A1A1A]">
                            {row.marketName ||
                              (lotteryType === "festival"
                                ? "Festival"
                                : "Daily")}
                          </div>
                          <div className="mt-0.5 inline-block rounded bg-[#FFEFA8]/70 px-1.5 py-0.5 text-[10px] font-bold text-[#9A5B00]">
                            {row.lotteryType}
                          </div>
                        </td>

                        {/* Ticket Numbers */}
                        <td className={TD_CLS}>
                          <TicketChips
                            tickets={tickets}
                            onViewAll={() => openTicketModal(row)}
                          />
                        </td>

                        {/* Ticket Count */}
                        <td className={TD_CLS}>
                          <span className="inline-flex items-center justify-center rounded-lg bg-gray-100 px-2 py-1 text-xs font-bold text-[#1A1A1A]">
                            {row.ticketCount}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className={TD_CLS}>
                          <div className="whitespace-nowrap text-sm font-black text-[#1A1A1A]">
                            {formatINR(row.amount)}
                          </div>
                        </td>

                        {/* Date & Time */}
                        <td className={TD_CLS}>
                          <div className="text-xs font-semibold text-[#1A1A1A]">
                            {formatDateTimeIST(row.createdAt)}
                          </div>
                        </td>

                        {/* Payment Status */}
                        <td className={TD_CLS}>
                          <PaymentBadge status={row.paymentStatus} />
                        </td>

                        {/* Ticket Status */}
                        <td className={TD_CLS}>
                          <TicketStatusBadge status={row.ticketStatus} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* =====================================================
            PAGINATION CONTROLS
        ===================================================== */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-[#F3E7C4] bg-[#FFFDF7] px-4 py-3.5 sm:flex-row sm:px-5 sm:py-4">
            <p className="text-center text-xs font-bold text-[#8A8F98] sm:text-left">
              Page <span className="text-[#1A1A1A]">{page}</span> of{" "}
              <span className="text-[#1A1A1A]">{pagination.totalPages}</span> (
              {fmtNum(pagination.total)} total orders)
            </p>

            <div className="flex w-full items-center justify-between gap-1.5 sm:w-auto sm:justify-end">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 rounded-xl border border-[#F3E7C4] bg-white px-3 py-2 text-xs font-bold text-[#1A1A1A] transition-all hover:bg-[#FFEFA8]/50 disabled:opacity-40 sm:py-1.5"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>

              {/* Page Number Pills (sirf sm+ par, mobile par prev/next kaafi) */}
              <div className="hidden items-center gap-1 sm:flex">
                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`h-8 w-8 rounded-xl text-xs font-black transition-all ${
                          page === pageNum
                            ? "bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] text-[#1A1204] shadow-sm"
                            : "border border-[#F3E7C4] bg-white text-[#1A1A1A] hover:bg-[#FFEFA8]/50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  },
                )}
              </div>

              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={page >= pagination.totalPages}
                className="flex items-center gap-1 rounded-xl border border-[#F3E7C4] bg-white px-3 py-2 text-xs font-bold text-[#1A1A1A] transition-all hover:bg-[#FFEFA8]/50 disabled:opacity-40 sm:py-1.5"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================
          VIEW TICKETS MODAL (bottom sheet on mobile)
      ===================================================== */}
      {ticketModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={closeTicketModal}
        >
          <div
            className="flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-2xl border border-[#F3E7C4] bg-white p-4 shadow-2xl animate-in fade-in zoom-in-95 sm:max-h-[85vh] sm:rounded-2xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#F3E7C4] pb-3 sm:pb-4">
              <div className="min-w-0">
                <h3 className="text-base font-black text-[#1A1A1A]">
                  Purchased Ticket Numbers
                </h3>
                <p className="break-words text-xs font-semibold text-[#8A8F98]">
                  Order: {ticketModal.orderId} • {ticketModal.marketName}
                </p>
              </div>
              <button
                onClick={closeTicketModal}
                className="shrink-0 rounded-xl p-1.5 text-[#8A8F98] hover:bg-gray-100 hover:text-[#1A1A1A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 flex min-h-0 flex-1 flex-col sm:mt-4">
              <p className="mb-2 shrink-0 text-xs font-bold text-[#9A5B00]">
                Total {ticketModal.ticketNumbers.length} ticket(s) in this
                purchase:
              </p>
              <div className="min-h-0 flex-1 divide-y divide-[#F3E7C4]/40 overflow-y-auto rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-3">
                {ticketModal.ticketNumbers.map((ticket, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 py-2 text-xs"
                  >
                    <span className="w-10 shrink-0 font-bold text-[#8A8F98]">
                      #{idx + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-center font-mono text-sm font-bold tracking-wider text-[#1A1A1A]">
                      {ticket}
                    </span>
                    <button
                      onClick={() => handleCopyTicket(ticket, idx)}
                      className="shrink-0 rounded-md p-1.5 text-[#8A8F98] hover:text-[#1A1A1A]"
                      title="Copy ticket"
                    >
                      {copiedIndex === idx ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex shrink-0 sm:mt-6 sm:justify-end">
              <button
                onClick={closeTicketModal}
                className={`w-full rounded-xl px-5 py-2.5 text-xs font-black sm:w-auto ${GOLD_BTN}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LotteryPurchaseReports;
