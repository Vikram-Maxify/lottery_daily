import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock,
  Info,
  Minus,
  Plus,
  Shuffle,
  Ticket,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  createDeposit,
  clearDepositState,
  selectDepositError,
  selectDepositLoading,
  selectDepositOrderId,
  selectDepositPaymentUrl,
} from "../reducer/slice/depositSlice";

import {
  getActiveLotteryConfig,
  clearLotteryConfigError,
  clearLotteryConfigSuccess,
} from "../reducer/slice/createLotteryConfigSlice";

import { getAmount } from "../reducer/slice/amountReducer";

// =====================================================
// CONSTANTS
// =====================================================

const MAX_TICKETS = 100;
const DEFAULT_TICKETS = 10;
const QUICK_COUNTS = [10, 20, 30, 50, 100];
const DEFAULT_TICKET_PRICE = 20;

// Bottom navbar height (px) — apne navbar ke hisaab se set karo
const BOTTOM_NAV_HEIGHT = 72;

// Purchase bar height (px)
const PURCHASE_BAR_HEIGHT = 110;

// Ticket number format: 2 digits + 2 letters + 3 digits  → e.g. 12AB137
const TICKET_REGEX = /^\d{2}[A-Z]{2}\d{3}$/;

const BADGES = ["bg-red-500", "bg-sky-500", "bg-orange-400", "bg-emerald-500", "bg-violet-500"];
const ROW_TINTS = ["bg-red-50", "bg-sky-50", "bg-orange-50", "bg-emerald-50", "bg-violet-50"];

const RULES = [
  { cond: "All digits/characters match", ex: "7A 45823", per: "₹10 Lakh", total: "₹1 Crore" },
  { cond: "Alphabet does not match but all remaining digits match", ex: "1A 45823", per: "₹5 Lakh", total: "₹50 Lakh" },
  { cond: "All numbers after the alphabet match", ex: "9A 45823", per: "₹50,000", total: "₹5 Lakh" },
  { cond: "Left-most 4 digits match", ex: "7A 45XXX", per: "₹10,000", total: "₹1 Lakh" },
  { cond: "Left-most 3 digits match", ex: "7A 4XXXX", per: "₹2,000", total: "₹20,000" },
];

// =====================================================
// HELPERS
// =====================================================

const pad = (n) => String(n).padStart(2, "0");

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const readPrice = (raw) => {
  if (raw && typeof raw === "object") {
    return Number(raw.amount ?? raw.price ?? raw.ticketPrice ?? raw.value ?? 0);
  }
  return Number(raw);
};

const formatCrore = (amount) => {
  if (amount === undefined || amount === null) return "₹0";
  const num = Number(amount);
  if (!Number.isFinite(num) || num <= 0) return "₹0";

  const crore = num / 10000000;
  if (crore >= 1) {
    return `₹${crore % 1 === 0 ? crore.toFixed(0) : crore.toFixed(2)} Crore`;
  }
  const lakh = num / 100000;
  if (lakh >= 1) {
    return `₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(2)} Lakh`;
  }
  return `₹${num.toLocaleString("en-IN")}`;
};

const format12h = (time) => {
  const [h, m] = String(time || "").split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return "--:--";
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
};

// 7-char code: 2 digits + 2 letters + 3 digits
const randomCode = () => {
  const d2 = () => Math.floor(Math.random() * 10);
  const l1 = () => String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `${d2()}${d2()}${l1()}${l1()}${d2()}${d2()}${d2()}`;
};

// n naye unique codes banao
const makeTickets = (count, existing = []) => {
  const used = new Set(existing.map((t) => t.code));
  const out = [];
  while (out.length < count) {
    const code = randomCode();
    if (used.has(code)) continue;
    used.add(code);
    out.push({ id: `${Date.now()}-${Math.random()}`, code });
  }
  return out;
};

const getDrawTimestamp = (lotteryConfig) => {
  if (!lotteryConfig?.drawDate || !lotteryConfig?.drawTime) return null;

  const drawDate = new Date(lotteryConfig.drawDate);
  if (Number.isNaN(drawDate.getTime())) return null;

  const [hoursString, minutesString] = String(lotteryConfig.drawTime).split(":");
  const hours = Number(hoursString);
  const minutes = Number(minutesString);

  if (
    !Number.isFinite(hours) || !Number.isFinite(minutes) ||
    hours < 0 || hours > 23 || minutes < 0 || minutes > 59
  ) return null;

  return Date.UTC(
    drawDate.getUTCFullYear(),
    drawDate.getUTCMonth(),
    drawDate.getUTCDate(),
    hours - 5,
    minutes - 30,
    0,
    0
  );
};

const getCountdown = (drawTimestamp) => {
  if (!drawTimestamp) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: false, available: false };
  }
  const difference = drawTimestamp - Date.now();
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true, available: true };
  }
  const totalSeconds = Math.floor(difference / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    expired: false,
    available: true,
  };
};

// =====================================================
// BUY TICKET
// =====================================================

const BuyTicket = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth || {});

  const { config, activeConfig, activeLoading, error } = useSelector(
    (state) =>
      state.createLotteryConfig || {
        config: null,
        activeConfig: null,
        activeLoading: false,
        error: null,
      }
  );

  const { amount: ticketPriceFromApi, loading: amountLoading } = useSelector(
    (state) => state.amount || { amount: null, loading: false }
  );

  const depositLoading = useSelector(selectDepositLoading);
  const depositError = useSelector(selectDepositError);
  const depositPaymentUrl = useSelector(selectDepositPaymentUrl);
  const depositOrderId = useSelector(selectDepositOrderId);

  const apiPrice = readPrice(ticketPriceFromApi);
  const hasApiPrice = Number.isFinite(apiPrice) && apiPrice > 0;
  const TICKET_PRICE = hasApiPrice ? apiPrice : DEFAULT_TICKET_PRICE;

  const lotteryConfig = config || activeConfig;

  const [tickets, setTickets] = useState(() => makeTickets(DEFAULT_TICKETS));
  const [manualInput, setManualInput] = useState("");
  const [localError, setLocalError] = useState("");
  const [localSuccess, setLocalSuccess] = useState("");
  const [showPicker, setShowPicker] = useState(true);
  const [selectedDate, setSelectedDate] = useState(0);

  const [countdown, setCountdown] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0, expired: false, available: false,
  });

  // ===================================================
  // INITIAL API CALLS
  // ===================================================

  useEffect(() => {
    dispatch(getActiveLotteryConfig());
    dispatch(getAmount());
    dispatch(clearDepositState());
  }, [dispatch]);

  // ===================================================
  // LIVE COUNTDOWN
  // ===================================================

  useEffect(() => {
    const empty = { days: 0, hours: 0, minutes: 0, seconds: 0, expired: false, available: false };

    if (!lotteryConfig?.drawDate || !lotteryConfig?.drawTime) {
      setCountdown(empty);
      return;
    }
    const drawTimestamp = getDrawTimestamp(lotteryConfig);
    if (!drawTimestamp) {
      setCountdown(empty);
      return;
    }

    const update = () => setCountdown(getCountdown(drawTimestamp));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [lotteryConfig?.drawDate, lotteryConfig?.drawTime]);

  // ===================================================
  // DERIVED VALUES
  // ===================================================

  const dateChips = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return {
          day: d.getDate(),
          month: d.toLocaleString("en-US", { month: "short" }),
          weekday: d.toLocaleString("en-US", { weekday: "short" }).toUpperCase(),
        };
      }),
    []
  );

  const drawDateText = useMemo(() => {
    if (lotteryConfig?.drawDate) {
      const date = new Date(lotteryConfig.drawDate);
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        });
      }
    }
    return "Draw soon";
  }, [lotteryConfig]);

  const firstPrizeAmount = formatCrore(lotteryConfig?.prizes?.first);
  const totalTickets = tickets.length;
  const totalTicketPrice = TICKET_PRICE * totalTickets;
  const priceText = `₹${TICKET_PRICE}/-`;

  const countdownText = !countdown.available
    ? "Timer not available"
    : countdown.expired
    ? "Draw started"
    : `${countdown.days > 0 ? `${countdown.days}d ` : ""}${pad(countdown.hours)}:${pad(
        countdown.minutes
      )}:${pad(countdown.seconds)}`;

  // ===================================================
  // HANDLERS
  // ===================================================

  const clearMessages = () => {
    setLocalError("");
    setLocalSuccess("");
    dispatch(clearLotteryConfigError());
    dispatch(clearLotteryConfigSuccess());
    dispatch(clearDepositState());
  };

  const setTicketCount = (count) => {
    if (depositLoading) return;
    const next = Math.min(Math.max(count, 1), MAX_TICKETS);

    setTickets((prev) => {
      if (next === prev.length) return prev;
      if (next > prev.length) {
        return [...prev, ...makeTickets(next - prev.length, prev)];
      }
      return prev.slice(0, next);
    });
    clearMessages();
  };

  const handleTicketInput = (ticketId, value) => {
    const cleaned = value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 7);
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, code: cleaned } : t))
    );
    setLocalError("");
    setLocalSuccess("");
  };

  const handleQuickSelect = () => {
    if (depositLoading) return;
    setTickets((prev) => makeTickets(prev.length));
    clearMessages();
  };

  const clearAllTickets = () => {
    if (depositLoading) return;
    setTickets((prev) => prev.map((t) => ({ ...t, code: "" })));
    clearMessages();
  };

  const handleRemoveTicket = (ticketId) => {
    if (depositLoading) return;

    if (tickets.length === 1) {
      setLocalError("At least one ticket is required");
      return;
    }
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    clearMessages();
  };

  // ✅ MANUAL ADD — validate + duplicate check
  const handleManualAdd = () => {
    if (depositLoading) return;

    const value = manualInput.trim().toUpperCase();

    // 1. format check
    if (!TICKET_REGEX.test(value)) {
      setLocalError("Add valid number (e.g. 12AB137)");
      setLocalSuccess("");
      return;
    }

    // 2. duplicate check (existing tickets)
    if (tickets.some((t) => t.code === value)) {
      setLocalError("This number is already added");
      setLocalSuccess("");
      return;
    }

    // 3. max limit
    if (tickets.length >= MAX_TICKETS) {
      setLocalError(`Maximum ${MAX_TICKETS} tickets allowed`);
      setLocalSuccess("");
      return;
    }

    // 4. add
    setTickets((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, code: value },
    ]);
    setManualInput("");
    setLocalError("");
    setLocalSuccess("Number added successfully");
    setTimeout(() => setLocalSuccess(""), 1500);
  };

  // ===================================================
  // HANDLE PURCHASE
  // ===================================================

  const handlePurchase = async () => {
    if (depositLoading) return;

    try {
      setLocalError("");
      setLocalSuccess("");

      dispatch(clearDepositState());
      dispatch(clearLotteryConfigError());
      dispatch(clearLotteryConfigSuccess());

      if (!user) return setLocalError("Please login first");
      if (!lotteryConfig?._id) return setLocalError("Active lottery configuration not found");
      if (!lotteryConfig?.isActive) return setLocalError("Lottery is not active right now");

      const ticketAmount = apiPrice;
      if (!Number.isFinite(ticketAmount) || ticketAmount <= 0) {
        return setLocalError("Ticket price is not available");
      }

      // all tickets must match format
      const invalidTicket = tickets.findIndex((t) => !TICKET_REGEX.test(t.code));
      if (invalidTicket !== -1) {
        return setLocalError(`Ticket ${invalidTicket + 1} is not valid (e.g. 12AB137)`);
      }

      const lotteryNumbers = tickets.map((t) => t.code);

      // duplicate check
      const duplicates = lotteryNumbers.filter((n, i) => lotteryNumbers.indexOf(n) !== i);
      if (duplicates.length > 0) {
        return setLocalError("Two tickets cannot have the same number.");
      }

      const totalAmount = ticketAmount * tickets.length;

      setLocalSuccess(`Creating payment order for ${tickets.length} ticket(s)...`);

      const result = await dispatch(
        createDeposit({
          paymentMethod: "INR",
          channel: "qwackpay",
          amount: totalAmount,
          configId: lotteryConfig._id,
          lotteryNumbers,
        })
      ).unwrap();

      const paymentUrl = result?.paymentUrl || depositPaymentUrl || "";
      const orderId = result?.orderId || depositOrderId || "";

      if (!paymentUrl) {
        setLocalSuccess("");
        return setLocalError(result?.message || "Payment URL not received. Please try again.");
      }

      setLocalError("");
      setLocalSuccess(`Order ${orderId} created. Redirecting to payment page...`);

      setTimeout(() => {
        window.location.href = paymentUrl;
      }, 600);

      setTickets(makeTickets(DEFAULT_TICKETS));
    } catch (purchaseError) {
      console.error("LOTTERY PURCHASE ERROR:", purchaseError);
      setLocalSuccess("");
      setLocalError(
        typeof purchaseError === "string"
          ? purchaseError
          : purchaseError?.message ||
              purchaseError?.payload?.message ||
              purchaseError?.payload ||
              "Could not buy tickets"
      );
    }
  };

  const displayError = localError || depositError || error;

  const isPurchaseDisabled =
    activeLoading ||
    amountLoading ||
    depositLoading ||
    !lotteryConfig?._id ||
    !lotteryConfig?.isActive ||
    !hasApiPrice ||
    tickets.some((t) => !TICKET_REGEX.test(t.code));

  // ===================================================
  // UI
  // ===================================================

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-[#f3f4fa] text-[#151a33]"
      style={{ paddingBottom: BOTTOM_NAV_HEIGHT + PURCHASE_BAR_HEIGHT + 16 }}
    >
      {/* ================= HERO (height increased) ================= */}
      <section className="grid grid-cols-[1.05fr_1fr] items-center gap-2 bg-gradient-to-br from-[#bfe1ff] via-[#e6f3ff] to-white px-3 py-6 min-h-[190px]">
        <TicketMock prize={firstPrizeAmount} price={priceText} />

        <div className="text-center">
          <h1 className="font-serif text-[27px] font-black leading-none text-[#0b1a4a]">
            Daily <span className="text-red-600">Lottery</span>
          </h1>
          <p className="mt-2 text-[11px] text-[#2b3358]">Small Ticket, Big Opportunities</p>

          <div className="mt-3 grid grid-cols-3 gap-1 text-[9px] leading-tight text-[#2b3358]">
            <HeroFeature icon={<CalendarDays size={22} />} l1="Every Day" l2="Draw" />
            <HeroFeature icon={<Trophy size={22} />} l1={firstPrizeAmount} l2="Total Prize" />
            <HeroFeature icon={<Users size={22} />} l1="10 Tickets" l2="per Draw" />
          </div>
        </div>
      </section>

      <main className="relative -mt-2 space-y-3 px-3">
        {/* ================= SELECT DRAW DATE ================= */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays size={26} className="text-[#1b2a5c]" />
              <h2 className="text-[17px] font-extrabold">Select Draw Date</h2>
            </div>
            <button
              type="button"
              className="flex items-center gap-1 rounded-lg border border-[#c9cde0] px-3 py-1.5 text-[12px] font-medium text-[#1b2a5c]"
            >
              View All Dates <ArrowRight size={14} />
            </button>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {dateChips.map((chip, i) => {
              const active = i === selectedDate;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedDate(i)}
                  className={`w-[62px] shrink-0 rounded-xl border px-1 py-2 text-center ${
                    active
                      ? "border-red-500 bg-red-50 text-red-600 shadow-[0_0_0_1px_rgba(239,68,68,0.4)]"
                      : "border-transparent bg-[#eceff8] text-[#3d4468]"
                  }`}
                >
                  <p className="h-[12px] text-[11px] font-medium leading-none">
                    {i === 0 ? "Today" : ""}
                  </p>
                  <p className="mt-1 text-[14px] font-extrabold leading-tight">
                    {chip.day} {chip.month}
                  </p>
                  <p className="mt-1 text-[11px] leading-none opacity-70">{chip.weekday}</p>
                  {active && (
                    <span className="mx-auto mt-1.5 block h-[5px] w-[5px] rounded-full bg-red-500" />
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* ================= DAILY LOTTERY TICKET ================= */}
        <section className="rounded-[18px] border border-[#f1d38a] bg-gradient-to-r from-[#fff1cf] to-[#fffaf0] p-3">
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <div className="w-[104px]">
              <TicketMock small prize={firstPrizeAmount} price={priceText} />
            </div>

            <div className="min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-serif text-[19px] font-black leading-tight text-[#1b2a5c]">
                  Daily Lottery Ticket
                </h2>
                <span className="shrink-0 rounded-md bg-red-600 px-2 py-1.5 text-[13px] font-extrabold text-white">
                  {priceText} <span className="text-[9px] font-medium">per ticket</span>
                </span>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-1">
                <InfoItem
                  icon={<Trophy size={24} className="text-[#7a4a12]" />}
                  title={firstPrizeAmount}
                  sub="Total First Prize"
                />
                <InfoItem
                  icon={<Users size={24} className="text-[#7a4a12]" />}
                  title={`${MAX_TICKETS} Tickets`}
                  sub="Max per Order"
                />
                <InfoItem
                  icon={<Clock size={24} className="text-[#7a4a12]" />}
                  title={format12h(lotteryConfig?.drawTime)}
                  sub={countdownText}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ================= HOW MANY TICKETS ================= */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket size={26} className="-rotate-45 text-[#1b2a5c]" />
              <h2 className="text-[17px] font-extrabold">How Many Tickets?</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowPicker((s) => !s)}
              aria-label="Toggle"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eceff8]"
            >
              {showPicker ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>

          {/* ✅ QUICK SELECT + MANUAL INPUT */}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleQuickSelect}
              disabled={depositLoading}
              className="flex shrink-0 items-center gap-1 rounded-lg border border-[#c9cde0] px-3 py-2 text-[12px] font-medium text-[#1b2a5c] disabled:opacity-50"
            >
              <Shuffle size={13} /> Quick Select
            </button>

            <div className="relative min-w-0 flex-1">
              <input
                value={manualInput}
                onChange={(e) =>
                  setManualInput(
                    e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 7)
                  )
                }
                onKeyDown={(e) => e.key === "Enter" && handleManualAdd()}
                disabled={depositLoading}
                placeholder="12AB137"
                maxLength={7}
                className="w-full rounded-lg border border-[#c9cde0] bg-white px-3 py-2 text-[14px] font-bold tracking-wider text-[#151a33] outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-[#a5aac4] focus:border-red-500 focus:shadow-[0_0_0_2px_rgba(239,68,68,0.15)] disabled:opacity-50"
              />
            </div>

            <button
              type="button"
              onClick={handleManualAdd}
              disabled={depositLoading || !manualInput}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-[#1b2a5c] px-3 py-2 text-[12px] font-bold text-white disabled:opacity-40"
            >
              <Plus size={14} /> Add
            </button>
          </div>

          {showPicker && (
            <>
              <div className="mt-3 grid grid-cols-[auto_1fr] gap-2">
                <div className="flex items-center gap-3 rounded-xl border border-[#e2e5f0] px-2 py-2">
                  <button
                    type="button"
                    onClick={() => setTicketCount(totalTickets - 1)}
                    disabled={depositLoading || totalTickets <= 1}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eceff8] disabled:opacity-40"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="min-w-[32px] text-center text-[26px] font-extrabold">
                    {totalTickets}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTicketCount(totalTickets + 1)}
                    disabled={depositLoading || totalTickets >= MAX_TICKETS}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eceff8] disabled:opacity-40"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center rounded-xl bg-[#f6f7fc] px-2 text-center">
                  <div>
                    <p className="text-[10px] text-[#5a6082]">Ticket Price</p>
                    <p className="text-[15px] font-extrabold text-red-600">{priceText}</p>
                  </div>
                  <span className="px-1 text-[#9aa0bd]">×</span>
                  <div>
                    <p className="text-[10px] text-[#5a6082]">Total Tickets</p>
                    <p className="text-[15px] font-extrabold text-red-600">{totalTickets}</p>
                  </div>
                  <span className="px-1 text-[#9aa0bd]">=</span>
                  <div>
                    <p className="text-[10px] text-[#5a6082]">Total Amount</p>
                    <p className="text-[15px] font-extrabold text-emerald-600">
                      ₹{totalTicketPrice}/-
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-5 gap-1.5">
                {QUICK_COUNTS.map((count) => {
                  const active = count === totalTickets;
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setTicketCount(count)}
                      disabled={depositLoading}
                      className={`relative flex min-w-0 flex-col items-center justify-center rounded-xl border px-0.5 py-2 ${
                        active
                          ? "border-red-500 bg-red-50 text-red-600"
                          : "border-[#e2e5f0] bg-white text-[#1b2a5c]"
                      }`}
                    >
                      {active && (
                        <span className="absolute right-1 top-1 h-[6px] w-[6px] rounded-full bg-red-500" />
                      )}
                      <span className="whitespace-nowrap text-[10px] font-medium leading-none">
                        {count} Tickets
                      </span>
                      <span className="mt-1.5 whitespace-nowrap text-[13px] font-extrabold leading-none">
                        {inr(TICKET_PRICE * count)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </Card>

        {/* ================= SELECTED TICKETS ================= */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket size={22} className="text-[#1b2a5c]" />
              <h2 className="text-[17px] font-extrabold">Selected Tickets ({totalTickets})</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTicketCount(totalTickets + 1)}
                disabled={depositLoading || !lotteryConfig?.isActive}
                className="flex items-center gap-1 rounded-lg border border-red-500 px-3 py-1.5 text-[12px] font-bold text-red-600 disabled:opacity-50"
              >
                Add More <Plus size={13} />
              </button>
              <button
                type="button"
                onClick={clearAllTickets}
                disabled={depositLoading}
                className="flex items-center gap-1 text-[12px] font-medium text-[#3d4468] disabled:opacity-50"
              >
                <Trash2 size={14} /> Clear
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {tickets.map((ticket, index) => (
              <div
                key={ticket.id}
                className={`flex items-center gap-2 rounded-xl px-2 py-2 ${ROW_TINTS[index % 5]}`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[12px] font-bold text-white ${
                    BADGES[index % 5]
                  }`}
                >
                  {index + 1}
                </span>

                <input
                  value={ticket.code}
                  onChange={(e) => handleTicketInput(ticket.id, e.target.value)}
                  disabled={depositLoading}
                  maxLength={7}
                  placeholder="12AB137"
                  className="min-w-0 flex-1 bg-transparent text-[14px] font-bold tracking-wider text-[#151a33] outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-[#a5aac4]"
                />

                <button
                  type="button"
                  onClick={() => handleRemoveTicket(ticket.id)}
                  disabled={depositLoading || totalTickets === 1}
                  aria-label={`Remove ticket ${index + 1}`}
                  className="shrink-0 text-[#a5aac4] disabled:opacity-30"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[12px] text-[#1f4d3a]">
            <Info size={18} className="shrink-0 text-emerald-600" />
            {totalTickets} unique tickets for the draw on {drawDateText}. Each ticket costs ₹
            {TICKET_PRICE}.
          </div>
        </Card>

        {/* ================= WINNING RULES ================= */}
       <section className="overflow-hidden rounded-[18px] bg-[#0f1c4d] text-white">
  <div className="p-3 sm:p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <BookOpen size={24} className="shrink-0 text-[#ffd84a]" />
        <h2 className="text-[15px] font-extrabold sm:text-[16px]">
          Daily Lottery Winning Rules
        </h2>
      </div>
      <button
        type="button"
        className="flex items-center gap-1 whitespace-nowrap rounded-lg border border-white/30 px-2 py-1.5 text-[10px] sm:text-[11px]"
      >
        View Official Terms <ArrowRight size={12} />
      </button>
    </div>

    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
      {/* Example Winning Number — text top, number bottom */}
      <div className="flex flex-col items-start gap-1.5 rounded-xl border border-[#2c3a72] bg-[#14235a] px-3 py-2.5">
        <span className="text-[10px] leading-tight text-white/80 sm:text-[11px]">
          Example Winning Number
        </span>
        <span className="rounded-md bg-white px-2.5 py-1 text-[16px] font-black text-[#0b1a4a] sm:text-[17px]">
          <span className="text-red-600">7A</span> 45823
        </span>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-[#2c3a72] bg-[#14235a] px-3 py-2.5">
        <Trophy size={28} className="shrink-0 text-[#ffd84a] sm:size-[30px]" />
        <div className="min-w-0">
          <p className="text-[8px] text-white/70 sm:text-[9px]">Total First Prize</p>
          <p className="truncate text-[16px] font-black uppercase leading-tight text-[#ffd84a] sm:text-[17px]">
            {firstPrizeAmount}
          </p>
          <p className="text-[7px] text-white/60 sm:text-[8px]">(10 Tickets × ₹10 Lakh)</p>
        </div>
      </div>
    </div>
  </div>

  <div className="bg-white text-[#151a33]">
    {/* Header row */}
    <div className="grid grid-cols-[20px_1.4fr_1.1fr_0.9fr_0.9fr] gap-1.5 bg-[#0f1c4d] px-2 py-2 text-[7.5px] font-semibold text-white sm:grid-cols-[24px_1.4fr_1.1fr_0.9fr_1fr] sm:gap-2 sm:px-3 sm:py-2.5 sm:text-[9px]">
      <span>#</span>
      <span>Match Condition</span>
      <span>Example (For 7A 45823)</span>
      <span className="text-center">Prize Per Ticket</span>
      <span className="text-center">Total Prize (10 Tickets)</span>
    </div>

    {/* Rows */}
    {RULES.map((rule, i) => (
      <div
        key={i}
        className={`grid grid-cols-[20px_1.4fr_1.1fr_0.9fr_0.9fr] items-center gap-1.5 px-2 py-2.5 sm:grid-cols-[24px_1.4fr_1.1fr_0.9fr_1fr] sm:gap-2 sm:px-3 sm:py-3 ${ROW_TINTS[i]}`}
      >
        <span
          className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white sm:h-[22px] sm:w-[22px] sm:text-[11px] ${BADGES[i]}`}
        >
          {i + 1}
        </span>
        <span className="text-[8.5px] leading-tight text-[#3d4468] sm:text-[10px]">
          {rule.cond}
        </span>
        <span className="whitespace-nowrap font-mono text-[10px] font-bold tracking-wider text-[#0b1a4a] sm:text-[12px]">
          {rule.ex}
        </span>
        <span className="text-center text-[9.5px] font-extrabold sm:text-[11px]">
          {rule.per}
        </span>
        <span className="text-center text-[9.5px] font-extrabold text-red-600 sm:text-[11px]">
          {rule.total}
        </span>
      </div>
    ))}
  </div>
</section>
      </main>

      {/* ================= PURCHASE BAR (sits above bottom navbar) ================= */}
      <div
        className="fixed inset-x-0 z-40 mx-auto w-full max-w-[480px] bg-[#0f1c4d] px-3 py-3 shadow-[0_-6px_20px_rgba(0,0,0,0.25)]"
        style={{ bottom: BOTTOM_NAV_HEIGHT }}
      >
        {displayError && (
          <div className="mb-2 rounded-lg border border-red-400/40 bg-red-500/15 px-3 py-1.5 text-center text-[11px] text-red-200">
            {typeof displayError === "string"
              ? displayError
              : displayError?.message || "Could not buy tickets"}
          </div>
        )}

        {localSuccess && !displayError && (
          <div className="mb-2 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-center text-[11px] text-emerald-200">
            {localSuccess}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="min-w-0 shrink-0">
            <p className="text-[11px] leading-none text-white/80">Total Amount</p>
            <p className="mt-1 whitespace-nowrap text-[24px] font-extrabold leading-none text-emerald-400">
              ₹{totalTicketPrice}/-
            </p>
            <p className="mt-1 whitespace-nowrap text-[9px] leading-none text-white/60">
              {totalTickets} Tickets · {drawDateText}
            </p>
          </div>

          <button
            type="button"
            onClick={handlePurchase}
            disabled={isPurchaseDisabled}
            className="flex h-[52px] min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-b from-red-500 to-red-700 px-2 text-[15px] font-bold text-white shadow-[0_6px_18px_rgba(239,68,68,0.45)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="truncate">
              {depositLoading ? "Creating..." : "Purchase Now"}
            </span>
            {!depositLoading && <ArrowRight size={18} className="shrink-0" />}
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// SMALL COMPONENTS
// =====================================================

const Card = ({ children }) => (
  <section className="rounded-[18px] bg-white p-3 shadow-sm">{children}</section>
);

const HeroFeature = ({ icon, l1, l2 }) => (
  <div className="flex flex-col items-center gap-1">
    <span className="text-[#7a4a12]">{icon}</span>
    <span className="break-words">
      {l1}
      <br />
      {l2}
    </span>
  </div>
);

const InfoItem = ({ icon, title, sub }) => (
  <div className="flex min-w-0 flex-col items-center gap-0.5 text-center">
    {icon}
    <p className="w-full truncate text-[11px] font-extrabold leading-tight text-[#1b2a5c]">
      {title}
    </p>
    <p className="w-full truncate text-[8px] leading-tight text-[#5a6082]">{sub}</p>
  </div>
);

const TicketMock = ({ prize, price, small = false }) => (
  <div
    className={`relative -rotate-6 rounded-lg border-2 border-[#e0b24a] bg-gradient-to-br from-[#fff8e6] to-[#ffe9b8] shadow-md ${
      small ? "p-1.5" : "p-3"
    }`}
  >
    <p className={`font-black leading-none text-red-600 ${small ? "text-[15px]" : "text-[26px]"}`}>
      DEAR
    </p>
    <p className={`font-bold text-[#0b1a4a] ${small ? "text-[6px]" : "text-[9px]"}`}>
      DAILY LOTTERY
    </p>
    <p className={`mt-1 text-[#5a4a2a] ${small ? "text-[6px]" : "text-[9px]"}`}>First Prize</p>
    <p
      className={`font-black uppercase leading-none text-[#0b1a4a] ${
        small ? "text-[12px]" : "text-[22px]"
      }`}
    >
      {prize}
    </p>
    <p
      className={`mt-1 tracking-[0.2em] text-[#5a4a2a] ${small ? "text-[6px]" : "text-[10px]"}`}
    >
      47B 39120
    </p>
    <span
      className={`absolute right-1 top-1 rounded-full bg-pink-400 font-extrabold text-white ${
        small ? "px-1 text-[6px]" : "px-2 py-1 text-[10px]"
      }`}
    >
      {price}
    </span>
  </div>
);

export default BuyTicket;