import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  Search,
  RefreshCw,
  FileText,
  Ticket,
  PartyPopper,
  IndianRupee,
  ShoppingBag,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Copy,
  Check,
  X,
  Sparkles,
  User,
  Phone,
  Hash,
} from "lucide-react";
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
  "px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-[#9A5B00]";

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
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="h-3 w-3" />
        Success
      </span>
    );
  }
  if (s === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200">
        <Clock className="h-3 w-3" />
        Pending
      </span>
    );
  }
  if (s === "failed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-200">
        <XCircle className="h-3 w-3" />
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700 border border-gray-200">
      {status || "Unknown"}
    </span>
  );
};

const TicketStatusBadge = ({ status }) => {
  const s = String(status || "").toLowerCase();
  if (s === "won" || s === "win") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-extrabold text-amber-800 border border-amber-300">
        <Sparkles className="h-3 w-3 text-amber-600" />
        Won
      </span>
    );
  }
  if (s === "lost") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 border border-gray-200">
        Lost
      </span>
    );
  }
  if (s === "payment pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 border border-orange-200">
        Payment Pending
      </span>
    );
  }
  if (s === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 border border-rose-200">
        Cancelled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
      Active
    </span>
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
          "Network error while fetching report"
      );
    } finally {
      setLoading(false);
    }
  }, [lotteryType, selectedDate, debouncedSearch, page, limit]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

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
      `Lottery_Purchases_${lotteryType.toUpperCase()}_${selectedDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const { stats, records, pagination } = reportData;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* =====================================================
          HEADER SECTION
      ===================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-[#FFD83D] to-[#F7B500] text-[#1A1204] shadow-md">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-black text-[#1A1A1A]">
                Lottery Purchase Reports
              </h1>
              <p className="text-xs font-semibold text-[#8A8F98]">
                Real-time purchase logs, user tickets & revenue statistics
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: Refresh & Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchReports}
            disabled={loading}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold ${OUTLINE_BTN}`}
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
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-extrabold ${GOLD_BTN} disabled:opacity-50`}
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
      <div className={`${CARD_CLS} p-4 sm:p-5`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Lottery Type Segmented Toggle */}
          <div className="inline-flex rounded-xl bg-[#FFFDF7] p-1.5 border border-[#F3E7C4] shadow-inner">
            <button
              onClick={() => handleTypeChange("daily")}
              className={`flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-black transition-all ${
                lotteryType === "daily"
                  ? "bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] text-[#1A1204] shadow-md"
                  : "text-[#6B7280] hover:text-[#1A1A1A]"
              }`}
            >
              <Ticket className="h-4 w-4" />
              <span>Daily Lottery</span>
            </button>

            <button
              onClick={() => handleTypeChange("festival")}
              className={`flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-black transition-all ${
                lotteryType === "festival"
                  ? "bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] text-[#1A1204] shadow-md"
                  : "text-[#6B7280] hover:text-[#1A1A1A]"
              }`}
            >
              <PartyPopper className="h-4 w-4" />
              <span>Festival Lottery</span>
            </button>
          </div>

          {/* Date Selection Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1 rounded-lg bg-[#FFFDF7] p-1 border border-[#F3E7C4]">
              <button
                onClick={() => {
                  setSelectedDate(getTodayIST());
                  setPage(1);
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedDate === getTodayIST()
                    ? "bg-[#FFEFA8] text-[#9A5B00] shadow-sm font-extrabold"
                    : "text-[#6B7280] hover:bg-[#FFEFA8]/40"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => {
                  setSelectedDate(getYesterdayIST());
                  setPage(1);
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedDate === getYesterdayIST()
                    ? "bg-[#FFEFA8] text-[#9A5B00] shadow-sm font-extrabold"
                    : "text-[#6B7280] hover:bg-[#FFEFA8]/40"
                }`}
              >
                Yesterday
              </button>
            </div>

            {/* Custom Date Picker */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                      setPage(1);
                    }
                  }}
                  className="rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] px-3.5 py-2 text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#F2B705] focus:ring-2 focus:ring-[#FFEFA8]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar Input */}
        <div className="mt-4 pt-4 border-t border-[#F3E7C4]/60">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8F98]" />
            <input
              type="text"
              placeholder="Search by Order ID, User Name, Mobile, or Ticket Number..."
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Orders */}
        <div className={`${CARD_CLS} p-5 relative overflow-hidden`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#9A5B00]">
                Total Orders
              </p>
              <h3 className="mt-1 text-2xl font-black text-[#1A1A1A]">
                {loading ? "..." : stats.totalOrders.toLocaleString("en-IN")}
              </h3>
              <p className="mt-1 text-[11px] font-semibold text-[#8A8F98]">
                {lotteryType === "daily" ? "Daily" : "Festival"} purchases on {selectedDate}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
              <ShoppingBag className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500" />
        </div>

        {/* Card 2: Total Tickets Sold */}
        <div className={`${CARD_CLS} p-5 relative overflow-hidden`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#9A5B00]">
                Total Tickets Sold
              </p>
              <h3 className="mt-1 text-2xl font-black text-[#1A1A1A]">
                {loading
                  ? "..."
                  : stats.totalTicketsSold.toLocaleString("en-IN")}
              </h3>
              <p className="mt-1 text-[11px] font-semibold text-emerald-600">
                {stats.totalTickets > stats.totalTicketsSold
                  ? `(${stats.totalTickets} total including pending)`
                  : "Verified successful tickets"}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
              <Ticket className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-400 to-blue-500" />
        </div>

        {/* Card 3: Total Purchase Amount */}
        <div className={`${CARD_CLS} p-5 relative overflow-hidden`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#9A5B00]">
                Total Purchase Amount
              </p>
              <h3 className="mt-1 text-2xl font-black text-[#1A1A1A]">
                {loading ? "..." : formatINR(stats.totalAmount)}
              </h3>
              <p className="mt-1 text-[11px] font-semibold text-[#8A8F98]">
                Gross volume across all orders
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <IndianRupee className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-500" />
        </div>

        {/* Card 4: Successful Purchases / Revenue */}
        <div className={`${CARD_CLS} p-5 relative overflow-hidden`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#9A5B00]">
                Successful Purchases
              </p>
              <h3 className="mt-1 text-2xl font-black text-emerald-700">
                {loading
                  ? "..."
                  : `${stats.successfulPurchases} orders`}
              </h3>
              <p className="mt-1 text-[11px] font-bold text-emerald-600">
                Revenue: {formatINR(stats.successfulRevenue)}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-b from-[#FFD83D] to-[#F7B500] text-[#1A1204] shadow-sm">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#FFD83D] to-[#F7B500]" />
        </div>
      </div>

      {/* =====================================================
          ERROR STATE WITH RETRY
      ===================================================== */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
          <button
            onClick={fetchReports}
            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* =====================================================
          COMPREHENSIVE RECORDS TABLE
      ===================================================== */}
      <div className={`${CARD_CLS} overflow-hidden`}>
        <div className="px-5 py-4 border-b border-[#F3E7C4] flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-[#1A1A1A]">
              Purchase Records ({pagination.total})
            </h2>
            <p className="text-xs font-semibold text-[#8A8F98]">
              Detailed lottery orders for {selectedDate} ({lotteryType === "daily" ? "Daily Lottery" : "Festival Lottery"})
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
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#F7B500] border-r-transparent align-[-0.125em]" />
            <p className="mt-3 text-sm font-bold text-[#9A5B00]">
              Loading lottery purchase records...
            </p>
          </div>
        ) : records.length === 0 ? (
          /* Empty State */
          <div className="py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFEFA8]/50 text-[#9A5B00]">
              <Ticket className="h-7 w-7" />
            </div>
            <h3 className="mt-3 text-base font-black text-[#1A1A1A]">
              No Purchase Records Found
            </h3>
            <p className="mt-1 text-xs font-semibold text-[#8A8F98] max-w-sm mx-auto">
              There are no {lotteryType} lottery purchases recorded for {selectedDate}.
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
          /* Table */
          <div className="overflow-x-auto">
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
                  const displayFirst = tickets[0] || "-";
                  const extraCount = tickets.length - 1;

                  return (
                    <tr
                      key={row._id}
                      className="hover:bg-[#FFFDF7]/60 transition-colors"
                    >
                      {/* Order ID */}
                      <td className={TD_CLS}>
                        <div className="font-mono text-xs font-bold text-[#1A1A1A]">
                          {row.orderId || "-"}
                        </div>
                        <div className="text-[10px] text-[#8A8F98] uppercase">
                          {row.channel || "QwackPay"}
                        </div>
                      </td>

                      {/* User Info */}
                      <td className={TD_CLS}>
                        <div className="font-bold text-sm text-[#1A1A1A]">
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
                        <div className="font-bold text-xs text-[#1A1A1A]">
                          {row.marketName || (lotteryType === "festival" ? "Festival" : "Daily")}
                        </div>
                        <div className="inline-block mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold bg-[#FFEFA8]/70 text-[#9A5B00]">
                          {row.lotteryType}
                        </div>
                      </td>

                      {/* Ticket Numbers */}
                      <td className={TD_CLS}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-bold bg-amber-50 border border-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                            {displayFirst}
                          </span>
                          {extraCount > 0 && (
                            <button
                              onClick={() =>
                                setTicketModal({
                                  open: true,
                                  orderId: row.orderId,
                                  marketName: row.marketName,
                                  userName: row.userName,
                                  ticketNumbers: tickets,
                                })
                              }
                              className="rounded-md bg-[#FFEFA8] border border-[#F2B705] px-1.5 py-0.5 text-[10px] font-extrabold text-[#9A5B00] hover:bg-[#FFD83D] transition-colors"
                              title="Click to view all ticket numbers"
                            >
                              +{extraCount} more
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Ticket Count */}
                      <td className={TD_CLS}>
                        <span className="inline-flex items-center justify-center rounded-lg bg-gray-100 font-bold px-2 py-1 text-xs text-[#1A1A1A]">
                          {row.ticketCount}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className={TD_CLS}>
                        <div className="font-black text-sm text-[#1A1A1A]">
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
        )}

        {/* =====================================================
            PAGINATION CONTROLS
        ===================================================== */}
        {!loading && pagination.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-[#F3E7C4] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FFFDF7]">
            <p className="text-xs font-bold text-[#8A8F98]">
              Showing page <span className="text-[#1A1A1A]">{page}</span> of{" "}
              <span className="text-[#1A1A1A]">{pagination.totalPages}</span> (
              {pagination.total} total orders)
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 rounded-xl border border-[#F3E7C4] bg-white px-3 py-1.5 text-xs font-bold text-[#1A1A1A] hover:bg-[#FFEFA8]/50 disabled:opacity-40 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              {/* Page Number Pills */}
              <div className="flex items-center gap-1">
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
                  }
                )}
              </div>

              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={page >= pagination.totalPages}
                className="flex items-center gap-1 rounded-xl border border-[#F3E7C4] bg-white px-3 py-1.5 text-xs font-bold text-[#1A1A1A] hover:bg-[#FFEFA8]/50 disabled:opacity-40 transition-all"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================
          VIEW TICKETS MODAL
      ===================================================== */}
      {ticketModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[#F3E7C4] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-[#F3E7C4]">
              <div>
                <h3 className="text-base font-black text-[#1A1A1A]">
                  Purchased Ticket Numbers
                </h3>
                <p className="text-xs font-semibold text-[#8A8F98]">
                  Order: {ticketModal.orderId} • {ticketModal.marketName}
                </p>
              </div>
              <button
                onClick={() => setTicketModal({ open: false, ticketNumbers: [] })}
                className="rounded-xl p-1.5 text-[#8A8F98] hover:bg-gray-100 hover:text-[#1A1A1A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4">
              <p className="text-xs font-bold text-[#9A5B00] mb-2">
                Total {ticketModal.ticketNumbers.length} ticket(s) in this purchase:
              </p>
              <div className="max-h-64 overflow-y-auto rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-3 divide-y divide-[#F3E7C4]/40">
                {ticketModal.ticketNumbers.map((ticket, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 text-xs"
                  >
                    <span className="font-bold text-[#8A8F98]">
                      #{idx + 1}
                    </span>
                    <span className="font-mono font-bold text-sm text-[#1A1A1A] tracking-wider">
                      {ticket}
                    </span>
                    <button
                      onClick={() => handleCopyTicket(ticket, idx)}
                      className="rounded-md p-1 text-[#8A8F98] hover:text-[#1A1A1A]"
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

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setTicketModal({ open: false, ticketNumbers: [] })}
                className={`rounded-xl px-5 py-2.5 text-xs font-black ${GOLD_BTN}`}
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
