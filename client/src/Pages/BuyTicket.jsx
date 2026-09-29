import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock,
  Info,
  Plus,
  Shuffle,
  Ticket,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
const DEFAULT_TICKET_PRICE = 20;

// Kitne din ki dates "View All Dates" me dikhani hain
const ALL_DATES_COUNT = 30;

// Bottom navbar height (px) — apne navbar ke hisaab se set karo
const BOTTOM_NAV_HEIGHT = 72;

// Purchase bar height (px)
const PURCHASE_BAR_HEIGHT = 84;

// Ticket number format (D = digit, L = letter)
// Current: 2 digits + 2 letters + 3 digits → e.g. 12AB137
const SLOT_PATTERN = ["D", "D", "L", "L", "D", "D", "D"];
const TICKET_LENGTH = SLOT_PATTERN.length;
const TICKET_EXAMPLE = "12AB137";

const TICKET_REGEX = new RegExp(
  `^${SLOT_PATTERN.map((s) => (s === "D" ? "\\d" : "[A-Z]")).join("")}$`
);

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

// Slot (box) ke hisaab se character allowed hai ya nahi
const slotAccepts = (index, ch) =>
  SLOT_PATTERN[index] === "D" ? /^\d$/.test(ch) : /^[A-Z]$/.test(ch);

const slotPlaceholder = (index) => (SLOT_PATTERN[index] === "D" ? "0" : "A");

// Pasted / raw text ko valid ticket code me badalta hai
const sanitizeCode = (raw) => {
  const cleaned = String(raw || "").toUpperCase().replace(/[^0-9A-Z]/g, "");
  let result = "";
  for (const ch of cleaned) {
    if (result.length >= TICKET_LENGTH) break;
    if (slotAccepts(result.length, ch)) result += ch;
  }
  return result;
};

const randomCode = () =>
  SLOT_PATTERN.map((s) =>
    s === "D"
      ? String(Math.floor(Math.random() * 10))
      : String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join("");

const randomUniqueCode = (usedCodes = []) => {
  const used = new Set(usedCodes);
  let code = randomCode();
  let guard = 0;
  while (used.has(code) && guard < 100) {
    code = randomCode();
    guard += 1;
  }
  return code;
};

const makeTicket = (code = "") => ({
  id: `${Date.now()}-${Math.random()}`,
  code,
});

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

  // Shuru me sirf 1 khaali ticket
  const [tickets, setTickets] = useState(() => [makeTicket()]);
  const [localError, setLocalError] = useState("");
  const [localSuccess, setLocalSuccess] = useState("");
  const [selectedDate, setSelectedDate] = useState(0);
  const [showAllDates, setShowAllDates] = useState(false);

  const inputRefs = useRef({});

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
      Array.from({ length: ALL_DATES_COUNT }, (_, i) => {
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

  const codeCounts = useMemo(() => {
    const counts = {};
    tickets.forEach((t) => {
      if (t.code.length === TICKET_LENGTH) {
        counts[t.code] = (counts[t.code] || 0) + 1;
      }
    });
    return counts;
  }, [tickets]);

  const hasDuplicates = Object.values(codeCounts).some((c) => c > 1);

  // Price ab total added tickets ke hisaab se badhta hai
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

  const focusBox = (ticketId, index) => {
    const el = inputRefs.current[`${ticketId}-${index}`];
    if (el) {
      el.focus();
      if (el.select) el.select();
    }
  };

  const setTicketCode = (ticketId, code) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, code } : t))
    );
    setLocalError("");
    setLocalSuccess("");
  };

  // Box me type karna
  const handleBoxChange = (ticket, index, e) => {
    if (depositLoading) return;

    const raw = e.target.value;

    // Mobile keyboard backspace → empty value
    if (raw === "") {
      setTicketCode(ticket.id, ticket.code.slice(0, index));
      return;
    }

    const ch = raw.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(-1);
    if (!ch) return;

    // Hamesha agle khaali box se bharna shuru karo (beech me gap nahi)
    const pos = Math.min(index, ticket.code.length);
    if (!slotAccepts(pos, ch)) return;

    const next = ticket.code.slice(0, pos) + ch + ticket.code.slice(pos + 1);
    setTicketCode(ticket.id, next);

    if (pos < TICKET_LENGTH - 1) focusBox(ticket.id, pos + 1);
  };

  const handleBoxKeyDown = (ticket, index, e) => {
    if (e.key === "Backspace" && !ticket.code[index]) {
      e.preventDefault();
      if (index > 0) {
        setTicketCode(ticket.id, ticket.code.slice(0, index - 1));
        focusBox(ticket.id, index - 1);
      }
      return;
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusBox(ticket.id, index - 1);
    }
    if (e.key === "ArrowRight" && index < TICKET_LENGTH - 1) {
      e.preventDefault();
      focusBox(ticket.id, index + 1);
    }
  };

  const handleBoxPaste = (ticket, e) => {
    e.preventDefault();
    if (depositLoading) return;
    const code = sanitizeCode(e.clipboardData.getData("text"));
    if (!code) return;
    setTicketCode(ticket.id, code);
    focusBox(ticket.id, Math.min(code.length, TICKET_LENGTH - 1));
  };

  const handleRandomTicket = (ticketId) => {
    if (depositLoading) return;
    const others = tickets.filter((t) => t.id !== ticketId).map((t) => t.code);
    setTicketCode(ticketId, randomUniqueCode(others));
  };

  const handleClearTicket = (ticketId) => {
    if (depositLoading) return;
    setTicketCode(ticketId, "");
    focusBox(ticketId, 0);
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

  const handleAddTicket = () => {
    if (depositLoading) return;

    if (tickets.length >= MAX_TICKETS) {
      setLocalError(`Maximum ${MAX_TICKETS} tickets allowed`);
      setLocalSuccess("");
      return;
    }

    const newTicket = makeTicket();
    setTickets((prev) => [...prev, newTicket]);
    clearMessages();

    setTimeout(() => focusBox(newTicket.id, 0), 60);
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

      const invalidTicket = tickets.findIndex((t) => !TICKET_REGEX.test(t.code));
      if (invalidTicket !== -1) {
        return setLocalError(
          `Ticket ${invalidTicket + 1} is not valid (e.g. ${TICKET_EXAMPLE})`
        );
      }

      const lotteryNumbers = tickets.map((t) => t.code);

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

      setTickets([makeTicket()]);
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

  // Button tabhi active jab saari tickets poori bhari hon, koi duplicate na ho
  const isPurchaseDisabled =
    activeLoading ||
    amountLoading ||
    depositLoading ||
    !lotteryConfig?._id ||
    !lotteryConfig?.isActive ||
    !hasApiPrice ||
    tickets.length === 0 ||
    hasDuplicates ||
    tickets.some((t) => !TICKET_REGEX.test(t.code));

  const visibleDateChips = showAllDates ? dateChips : dateChips.slice(0, 7);

  // ===================================================
  // UI
  // ===================================================

  return (
    <div
      className=" overflow-x-hidden bg-[#f3f4fa] text-[#151a33]"
      style={{ paddingBottom: BOTTOM_NAV_HEIGHT + PURCHASE_BAR_HEIGHT + 24 }}
    >
      {/* ================= HERO ================= */}
      <section className="grid min-h-[190px] grid-cols-[1.05fr_1fr] items-center gap-2 bg-gradient-to-br from-[#bfe1ff] via-[#e6f3ff] to-white px-3 py-6">
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
              onClick={() => setShowAllDates((s) => !s)}
              className="flex items-center gap-1 rounded-lg border border-[#c9cde0] px-3 py-1.5 text-[12px] font-medium text-[#1b2a5c]"
            >
              {showAllDates ? "Show Less" : "View All Dates"}
              <ArrowRight
                size={14}
                className={`transition-transform ${showAllDates ? "rotate-90" : ""}`}
              />
            </button>
          </div>

          {showAllDates ? (
            <div className="mt-3 grid grid-cols-4 gap-2 min-[400px]:grid-cols-5">
              {visibleDateChips.map((chip, i) => (
                <DateChip
                  key={i}
                  chip={chip}
                  today={i === 0}
                  active={i === selectedDate}
                  onClick={() => setSelectedDate(i)}
                  fluid
                />
              ))}
            </div>
          ) : (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {visibleDateChips.map((chip, i) => (
                <DateChip
                  key={i}
                  chip={chip}
                  today={i === 0}
                  active={i === selectedDate}
                  onClick={() => setSelectedDate(i)}
                />
              ))}
            </div>
          )}
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

        {/* ================= CHOOSE YOUR TICKETS ================= */}
        <Card>
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#c9cde0] bg-[#eceff8] text-[#1b2a5c]">
                <Ticket size={22} className="-rotate-45" />
              </span>
              <div className="min-w-0 leading-tight">
                <h2 className="truncate text-[18px] font-extrabold text-[#0b1a4a]">
                  Choose Your Tickets
                </h2>
                <p className="truncate text-[11px] text-[#5a6082]">
                  Buy one or more tickets
                </p>
              </div>
            </div>

            <span className="shrink-0 rounded-full border border-red-300 bg-red-50 px-3 py-1.5 text-[12px] font-extrabold text-red-600">
              {totalTickets} {totalTickets === 1 ? "Ticket" : "Tickets"}
            </span>
          </div>

          {/* Ticket cards */}
          <div className="mt-3 space-y-3">
            {tickets.map((ticket, index) => {
              const complete = TICKET_REGEX.test(ticket.code);
              const duplicate =
                ticket.code.length === TICKET_LENGTH && codeCounts[ticket.code] > 1;

              return (
                <div
                  key={ticket.id}
                  className={`rounded-2xl border p-3 ${duplicate
                    ? "border-red-400 bg-red-50/60"
                    : complete
                      ? "border-emerald-300 bg-emerald-50/40"
                      : "border-[#dfe3f1] bg-[#f9fbff]"
                    }`}
                >
                  {/* Ticket title */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white ${BADGES[index % 5]}`}
                      >
                        <Ticket size={18} className="-rotate-45" />
                      </span>
                      <div className="min-w-0 leading-tight">
                        <h3 className="text-[15px] font-extrabold text-[#0b1a4a]">
                          Ticket {index + 1}
                        </h3>
                        <p className="truncate text-[10px] text-[#5a6082]">
                          Enter your {TICKET_LENGTH}-character number
                        </p>
                      </div>
                    </div>

                    {totalTickets > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTicket(ticket.id)}
                        disabled={depositLoading}
                        aria-label={`Remove ticket ${index + 1}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500 text-white disabled:opacity-40"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Digit boxes */}
                  <div
                    className="mt-3 grid gap-1.5"
                    style={{ gridTemplateColumns: `repeat(${TICKET_LENGTH}, minmax(0, 1fr))` }}
                  >
                    {SLOT_PATTERN.map((_, i) => {
                      const filled = Boolean(ticket.code[i]);
                      return (
                        <input
                          key={i}
                          ref={(el) => {
                            inputRefs.current[`${ticket.id}-${i}`] = el;
                          }}
                          value={ticket.code[i] || ""}
                          onChange={(e) => handleBoxChange(ticket, i, e)}
                          onKeyDown={(e) => handleBoxKeyDown(ticket, i, e)}
                          onPaste={(e) => handleBoxPaste(ticket, e)}
                          onFocus={(e) => e.target.select()}
                          disabled={depositLoading}
                          inputMode={SLOT_PATTERN[i] === "D" ? "numeric" : "text"}
                          autoCapitalize="characters"
                          autoComplete="off"
                          spellCheck={false}
                          placeholder={slotPlaceholder(i)}
                          aria-label={`Ticket ${index + 1} character ${i + 1}`}
                          className={`h-12 w-full min-w-0 rounded-xl border-2 text-center text-[18px] font-extrabold outline-none transition placeholder:font-bold placeholder:text-[#c3c8de] focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)] disabled:opacity-50 ${duplicate
                            ? "border-red-400 bg-white text-red-600"
                            : filled
                              ? "border-[#1b2a5c] bg-white text-[#0b1a4a]"
                              : "border-[#c9cde0] bg-[#f1f3fa] text-[#0b1a4a]"
                            }`}
                        />
                      );
                    })}
                  </div>

                  {/* Footer */}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5 text-[11px]">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${duplicate
                          ? "bg-red-500"
                          : complete
                            ? "bg-emerald-500"
                            : "bg-orange-400"
                          }`}
                      />
                      <span
                        className={`truncate ${duplicate
                          ? "font-semibold text-red-600"
                          : complete
                            ? "font-semibold text-emerald-600"
                            : "text-[#5a6082]"
                          }`}
                      >
                        {duplicate
                          ? "Number already added"
                          : complete
                            ? "Ticket ready"
                            : `Enter ${TICKET_LENGTH} characters (${ticket.code.length}/${TICKET_LENGTH})`}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleClearTicket(ticket.id)}
                        disabled={depositLoading || !ticket.code}
                        className="text-[12px] font-medium text-[#3d4468] underline underline-offset-2 disabled:opacity-40"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRandomTicket(ticket.id)}
                        disabled={depositLoading}
                        className="flex items-center gap-1 rounded-lg border border-[#c9cde0] bg-white px-3 py-1.5 text-[12px] font-bold text-[#1b2a5c] disabled:opacity-50"
                      >
                        <Shuffle size={13} /> Random
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add more tickets */}
          <button
            type="button"
            onClick={handleAddTicket}
            disabled={depositLoading || totalTickets >= MAX_TICKETS}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-red-300 bg-red-50/50 py-3.5 text-[15px] font-extrabold text-red-600 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-red-500">
              <Plus size={14} strokeWidth={3} />
            </span>
            Add More Tickets
          </button>

          {/* Price summary */}
          <div className="mt-3 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center rounded-xl bg-[#f6f7fc] px-2 py-2 text-center">
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

          <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[12px] text-[#1f4d3a]">
            <Info size={18} className="shrink-0 text-emerald-600" />
            {totalTickets} {totalTickets === 1 ? "ticket" : "unique tickets"} for the draw on{" "}
            {drawDateText}. Each ticket costs ₹{TICKET_PRICE}.
          </div>
        </Card>

        {/* ================= WINNING RULES ================= */}
        <section className="overflow-hidden rounded-[18px] bg-[#0f1c4d] text-white">
          <div className="p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BookOpen size={26} className="shrink-0 text-[#ffd84a]" />
                <h2 className="text-[17px] font-extrabold sm:text-[18px]">
                  Daily Lottery Winning Rules
                </h2>
              </div>
              <button
                type="button"
                className="flex items-center gap-1 whitespace-nowrap rounded-lg border border-white/30 px-2.5 py-1.5 text-[11px] sm:text-[12px]"
              >
                View Official Terms <ArrowRight size={13} />
              </button>
            </div>

            {/* Dono boxes ek hi row me */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="flex min-w-0 flex-col items-start justify-center gap-1 rounded-xl border border-[#2c3a72] bg-[#14235a] px-2.5 py-2">
                <span className="text-[10px] leading-tight text-white/80 min-[360px]:text-[11px]">
                  Example Winning Number
                </span>
                <span className="whitespace-nowrap rounded-md bg-white px-2 py-1 text-[15px] font-black text-[#0b1a4a] min-[360px]:text-[17px]">
                  <span className="text-red-600">7A</span> 45823
                </span>
              </div>

              <div className="flex min-w-0 items-center gap-1.5 rounded-xl border border-[#2c3a72] bg-[#14235a] px-2.5 py-2">
                <Trophy size={24} className="shrink-0 text-[#ffd84a]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[9px] text-white/70 min-[360px]:text-[10px]">
                    Total First Prize
                  </p>
                  <p className="truncate text-[15px] font-black uppercase leading-tight text-[#ffd84a] min-[360px]:text-[17px]">
                    {firstPrizeAmount}
                  </p>
                  <p className="truncate text-[8px] text-white/60 min-[360px]:text-[9px]">
                    (10 Tickets × ₹10 Lakh)
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white text-[#151a33]">
            <div className="grid grid-cols-[22px_1.4fr_1.1fr_0.9fr_0.9fr] gap-1.5 bg-[#0f1c4d] px-2 py-2.5 text-[9.5px] font-semibold text-white sm:grid-cols-[26px_1.4fr_1.1fr_0.9fr_1fr] sm:gap-2 sm:px-3 sm:text-[11px]">
              <span>#</span>
              <span>Match Condition</span>
              <span>Example (For 7A 45823)</span>
              <span className="text-center">Prize Per Ticket</span>
              <span className="text-center">Total Prize (10 Tickets)</span>
            </div>

            {RULES.map((rule, i) => (
              <div
                key={i}
                className={`grid grid-cols-[22px_1.4fr_1.1fr_0.9fr_0.9fr] items-center gap-1.5 px-2 py-3 sm:grid-cols-[26px_1.4fr_1.1fr_0.9fr_1fr] sm:gap-2 sm:px-3 sm:py-3.5 ${ROW_TINTS[i]}`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold text-white sm:h-6 sm:w-6 sm:text-[12px] ${BADGES[i]}`}
                >
                  {i + 1}
                </span>
                <span className="text-[10.5px] leading-tight text-[#3d4468] sm:text-[12px]">
                  {rule.cond}
                </span>
                <span className="whitespace-nowrap font-mono text-[11.5px] font-bold tracking-wide text-[#0b1a4a] sm:text-[13px]">
                  {rule.ex}
                </span>
                <span className="text-center text-[11px] font-extrabold sm:text-[13px]">
                  {rule.per}
                </span>
                <span className="text-center text-[11px] font-extrabold text-red-600 sm:text-[13px]">
                  {rule.total}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ================= PURCHASE BAR (above bottom navbar) ================= */}
      <div
        className="fixed inset-x-3 z-[70] mx-auto w-auto max-w-[400px] rounded-xl bg-[#0f1c4d] px-3 py-3 shadow-[0_-4px_14px_rgba(0,0,0,0.22)]"
        style={{ bottom: BOTTOM_NAV_HEIGHT + 8 }}
      >
        {displayError && (
          <div className="mb-2 rounded-lg border border-red-400/40 bg-red-500/15 px-2.5 py-1 text-center text-[10px] text-red-200">
            {typeof displayError === "string"
              ? displayError
              : displayError?.message || "Could not buy tickets"}
          </div>
        )}

        {localSuccess && !displayError && (
          <div className="mb-2 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-center text-[10px] text-emerald-200">
            {localSuccess}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] leading-none text-white/80">Total Amount</p>
            <p className="mt-1 whitespace-nowrap text-[19px] font-extrabold leading-none text-emerald-400">
              ₹{totalTicketPrice}/-
            </p>
            <p className="mt-1 whitespace-nowrap text-[8.5px] leading-none text-white/60">
              {totalTickets} {totalTickets === 1 ? "Ticket" : "Tickets"} · {drawDateText}
            </p>
          </div>

          <button
            type="button"
            onClick={handlePurchase}
            disabled={isPurchaseDisabled}
            className="flex h-[34px] w-[120px] shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-gradient-to-b from-red-500 to-red-700 px-2 text-[12px] font-bold text-white shadow-[0_3px_10px_rgba(239,68,68,0.4)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            <span className="truncate">
              {depositLoading ? "Creating..." : "Purchase Now"}
            </span>
            {!depositLoading && <ArrowRight size={14} className="shrink-0" />}
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

const DateChip = ({ chip, today, active, onClick, fluid = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={`${fluid ? "w-full" : "w-[62px] shrink-0"} rounded-xl border px-1 py-2 text-center ${active
      ? "border-red-500 bg-red-50 text-red-600 shadow-[0_0_0_1px_rgba(239,68,68,0.4)]"
      : "border-transparent bg-[#eceff8] text-[#3d4468]"
      }`}
  >
    <p className="h-[12px] text-[11px] font-medium leading-none">{today ? "Today" : ""}</p>
    <p className="mt-1 whitespace-nowrap text-[14px] font-extrabold leading-tight">
      {chip.day} {chip.month}
    </p>
    <p className="mt-1 text-[11px] leading-none opacity-70">{chip.weekday}</p>
    {active && <span className="mx-auto mt-1.5 block h-[5px] w-[5px] rounded-full bg-red-500" />}
  </button>
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
    className={`relative -rotate-6 rounded-lg border-2 border-[#e0b24a] bg-gradient-to-br from-[#fff8e6] to-[#ffe9b8] shadow-md ${small ? "p-1.5" : "p-3"
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
      className={`font-black uppercase leading-none text-[#0b1a4a] ${small ? "text-[12px]" : "text-[22px]"
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
      className={`absolute right-1 top-1 rounded-full bg-pink-400 font-extrabold text-white ${small ? "px-1 text-[6px]" : "px-2 py-1 text-[10px]"
        }`}
    >
      {price}
    </span>
  </div>
);

export default BuyTicket;