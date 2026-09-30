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

const ALL_DATES_COUNT = 30;

const BOTTOM_NAV_HEIGHT = 72;
const PURCHASE_BAR_HEIGHT = 84;

const SLOT_PATTERN = ["D", "D", "L", "L", "D", "D", "D"];
const TICKET_LENGTH = SLOT_PATTERN.length;
const TICKET_EXAMPLE = "12AB137";

const TICKET_REGEX = new RegExp(
  `^${SLOT_PATTERN.map((s) =>
    s === "D" ? "\\d" : "[A-Z]"
  ).join("")}$`
);

// Festival Lottery reference theme
const BADGES = [
  "bg-[#ed1d43]",
  "bg-[#2e7dd7]",
  "bg-[#f08a25]",
  "bg-[#20a66a]",
  "bg-[#8c4bd6]",
];

const ROW_TINTS = [
  "bg-[#ffe4e8]",
  "bg-[#e3f0ff]",
  "bg-[#ffefdc]",
  "bg-[#dcf8ea]",
  "bg-[#f0e4ff]",
];

const RULES = [
  {
    cond: "All digits/characters match",
    ex: "10AB123",
    per: "₹10 Lakh",
    total: "₹1 Crore",
  },
  {
    cond: "Alphabet does not match but all remaining digits match",
    ex: "10XY123",
    per: "₹5 Lakh",
    total: "₹50 Lakh",
  },
  {
    cond: "All numbers after the alphabet match",
    ex: "99AB123",
    per: "₹50,000",
    total: "₹5 Lakh",
  },
  {
    cond: "Left-most 4 digits match",
    ex: "10AB670",
    per: "₹10,000",
    total: "₹1 Lakh",
  },
  {
    cond: "Left-most 3 digits match",
    ex: "10AP912",
    per: "₹2,000",
    total: "₹20,000",
  },
];

// =====================================================
// HELPERS
// =====================================================

const pad = (n) => String(n).padStart(2, "0");

const readPrice = (raw) => {
  if (raw && typeof raw === "object") {
    return Number(
      raw.amount ??
      raw.price ??
      raw.ticketPrice ??
      raw.value ??
      0
    );
  }

  return Number(raw);
};

const formatCrore = (amount) => {
  if (amount === undefined || amount === null) return "₹0";

  const num = Number(amount);

  if (!Number.isFinite(num) || num <= 0) return "₹0";

  const crore = num / 10000000;

  if (crore >= 1) {
    return `₹${crore % 1 === 0
      ? crore.toFixed(0)
      : crore.toFixed(2)
      } Crore`;
  }

  const lakh = num / 100000;

  if (lakh >= 1) {
    return `₹${lakh % 1 === 0
      ? lakh.toFixed(0)
      : lakh.toFixed(2)
      } Lakh`;
  }

  return `₹${num.toLocaleString("en-IN")}`;
};

const format12h = (time) => {
  const [h, m] = String(time || "")
    .split(":")
    .map(Number);

  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    return "--:--";
  }

  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? "PM" : "AM"
    }`;
};

const slotAccepts = (index, ch) =>
  SLOT_PATTERN[index] === "D"
    ? /^\d$/.test(ch)
    : /^[A-Z]$/.test(ch);

const slotPlaceholder = (index) =>
  SLOT_PATTERN[index] === "D" ? "0" : "A";

const sanitizeCode = (raw) => {
  const cleaned = String(raw || "")
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "");

  let result = "";

  for (const ch of cleaned) {
    if (result.length >= TICKET_LENGTH) break;

    if (slotAccepts(result.length, ch)) {
      result += ch;
    }
  }

  return result;
};

const randomCode = () =>
  SLOT_PATTERN.map((s) =>
    s === "D"
      ? String(Math.floor(Math.random() * 10))
      : String.fromCharCode(
        65 + Math.floor(Math.random() * 26)
      )
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
  if (
    !lotteryConfig?.drawDate ||
    !lotteryConfig?.drawTime
  ) {
    return null;
  }

  const drawDate = new Date(lotteryConfig.drawDate);

  if (Number.isNaN(drawDate.getTime())) {
    return null;
  }

  const [hoursString, minutesString] = String(
    lotteryConfig.drawTime
  ).split(":");

  const hours = Number(hoursString);
  const minutes = Number(minutesString);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

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
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: false,
      available: false,
    };
  }

  const difference = drawTimestamp - Date.now();

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: true,
      available: true,
    };
  }

  const totalSeconds = Math.floor(
    difference / 1000
  );

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor(
      (totalSeconds % 86400) / 3600
    ),
    minutes: Math.floor(
      (totalSeconds % 3600) / 60
    ),
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

  const { user } = useSelector(
    (state) => state.auth || {}
  );

  const {
    config,
    activeConfig,
    activeLoading,
    error,
  } = useSelector(
    (state) =>
      state.createLotteryConfig || {
        config: null,
        activeConfig: null,
        activeLoading: false,
        error: null,
      }
  );

  const {
    amount: ticketPriceFromApi,
    loading: amountLoading,
  } = useSelector(
    (state) =>
      state.amount || {
        amount: null,
        loading: false,
      }
  );

  const depositLoading = useSelector(
    selectDepositLoading
  );

  const depositError = useSelector(
    selectDepositError
  );

  const depositPaymentUrl = useSelector(
    selectDepositPaymentUrl
  );

  const depositOrderId = useSelector(
    selectDepositOrderId
  );

  const apiPrice = readPrice(
    ticketPriceFromApi
  );

  const hasApiPrice =
    Number.isFinite(apiPrice) &&
    apiPrice > 0;

  const TICKET_PRICE = hasApiPrice
    ? apiPrice
    : DEFAULT_TICKET_PRICE;

  const lotteryConfig =
    config || activeConfig;

  const [tickets, setTickets] = useState(() => [
    makeTicket(),
  ]);

  const [localError, setLocalError] =
    useState("");

  const [localSuccess, setLocalSuccess] =
    useState("");

  const [selectedDate, setSelectedDate] =
    useState(0);

  const [showAllDates, setShowAllDates] =
    useState(false);

  const inputRefs = useRef({});

  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
    available: false,
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
    const empty = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: false,
      available: false,
    };

    if (
      !lotteryConfig?.drawDate ||
      !lotteryConfig?.drawTime
    ) {
      setCountdown(empty);
      return;
    }

    const drawTimestamp =
      getDrawTimestamp(lotteryConfig);

    if (!drawTimestamp) {
      setCountdown(empty);
      return;
    }

    const update = () =>
      setCountdown(
        getCountdown(drawTimestamp)
      );

    update();

    const interval = setInterval(
      update,
      1000
    );

    return () =>
      clearInterval(interval);
  }, [
    lotteryConfig?.drawDate,
    lotteryConfig?.drawTime,
  ]);

  // ===================================================
  // DERIVED VALUES
  // ===================================================

  const dateChips = useMemo(
    () =>
      Array.from(
        { length: ALL_DATES_COUNT },
        (_, i) => {
          const d = new Date();

          d.setDate(
            d.getDate() + i
          );

          return {
            day: d.getDate(),
            month: d.toLocaleString(
              "en-US",
              { month: "short" }
            ),
            weekday: d
              .toLocaleString(
                "en-US",
                { weekday: "short" }
              )
              .toUpperCase(),
          };
        }
      ),
    []
  );

  const drawDateText = useMemo(() => {
    if (lotteryConfig?.drawDate) {
      const date = new Date(
        lotteryConfig.drawDate
      );

      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleString(
          "en-GB",
          {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "UTC",
          }
        );
      }
    }

    return "Draw soon";
  }, [lotteryConfig]);

  const firstPrizeAmount = formatCrore(
    lotteryConfig?.prizes?.first
  );

  const totalTickets = tickets.length;

  const codeCounts = useMemo(() => {
    const counts = {};

    tickets.forEach((t) => {
      if (
        t.code.length ===
        TICKET_LENGTH
      ) {
        counts[t.code] =
          (counts[t.code] || 0) + 1;
      }
    });

    return counts;
  }, [tickets]);

  const hasDuplicates =
    Object.values(codeCounts).some(
      (c) => c > 1
    );

  const totalTicketPrice =
    TICKET_PRICE * totalTickets;

  const priceText = `₹${TICKET_PRICE}/-`;

  const countdownText =
    !countdown.available
      ? "Timer not available"
      : countdown.expired
        ? "Draw started"
        : `${countdown.days > 0
          ? `${countdown.days}d `
          : ""
        }${pad(
          countdown.hours
        )}:${pad(
          countdown.minutes
        )}:${pad(
          countdown.seconds
        )}`;

  // ===================================================
  // HANDLERS
  // ===================================================

  const clearMessages = () => {
    setLocalError("");
    setLocalSuccess("");

    dispatch(
      clearLotteryConfigError()
    );

    dispatch(
      clearLotteryConfigSuccess()
    );

    dispatch(clearDepositState());
  };

  const focusBox = (
    ticketId,
    index
  ) => {
    const el =
      inputRefs.current[
      `${ticketId}-${index}`
      ];

    if (el) {
      el.focus();

      if (el.select) {
        el.select();
      }
    }
  };

  const setTicketCode = (
    ticketId,
    code
  ) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, code }
          : t
      )
    );

    setLocalError("");
    setLocalSuccess("");
  };

  // ===================================================
  // BOX INPUT
  // ===================================================

  const handleBoxChange = (
    ticket,
    index,
    e
  ) => {
    if (depositLoading) return;

    const raw = e.target.value;

    if (raw === "") {
      setTicketCode(
        ticket.id,
        ticket.code.slice(0, index)
      );
      return;
    }

    const ch = raw
      .toUpperCase()
      .replace(/[^0-9A-Z]/g, "")
      .slice(-1);

    if (!ch) return;

    const pos = Math.min(
      index,
      ticket.code.length
    );

    if (!slotAccepts(pos, ch))
      return;

    const next =
      ticket.code.slice(0, pos) +
      ch +
      ticket.code.slice(pos + 1);

    setTicketCode(
      ticket.id,
      next
    );

    if (
      pos <
      TICKET_LENGTH - 1
    ) {
      focusBox(
        ticket.id,
        pos + 1
      );
    }
  };

  const handleBoxKeyDown = (
    ticket,
    index,
    e
  ) => {
    if (
      e.key === "Backspace" &&
      !ticket.code[index]
    ) {
      e.preventDefault();

      if (index > 0) {
        setTicketCode(
          ticket.id,
          ticket.code.slice(
            0,
            index - 1
          )
        );

        focusBox(
          ticket.id,
          index - 1
        );
      }

      return;
    }

    if (
      e.key === "ArrowLeft" &&
      index > 0
    ) {
      e.preventDefault();

      focusBox(
        ticket.id,
        index - 1
      );
    }

    if (
      e.key === "ArrowRight" &&
      index <
      TICKET_LENGTH - 1
    ) {
      e.preventDefault();

      focusBox(
        ticket.id,
        index + 1
      );
    }
  };

  const handleBoxPaste = (
    ticket,
    e
  ) => {
    e.preventDefault();

    if (depositLoading) return;

    const code = sanitizeCode(
      e.clipboardData.getData(
        "text"
      )
    );

    if (!code) return;

    setTicketCode(
      ticket.id,
      code
    );

    focusBox(
      ticket.id,
      Math.min(
        code.length,
        TICKET_LENGTH - 1
      )
    );
  };

  const handleRandomTicket = (
    ticketId
  ) => {
    if (depositLoading) return;

    const others = tickets
      .filter(
        (t) => t.id !== ticketId
      )
      .map((t) => t.code);

    setTicketCode(
      ticketId,
      randomUniqueCode(others)
    );
  };

  const handleClearTicket = (
    ticketId
  ) => {
    if (depositLoading) return;

    setTicketCode(
      ticketId,
      ""
    );

    focusBox(
      ticketId,
      0
    );
  };

  const handleRemoveTicket = (
    ticketId
  ) => {
    if (depositLoading) return;

    if (tickets.length === 1) {
      setLocalError(
        "At least one ticket is required"
      );
      return;
    }

    setTickets((prev) =>
      prev.filter(
        (t) => t.id !== ticketId
      )
    );

    clearMessages();
  };

  const handleAddTicket = () => {
    if (depositLoading) return;

    if (
      tickets.length >=
      MAX_TICKETS
    ) {
      setLocalError(
        `Maximum ${MAX_TICKETS} tickets allowed`
      );

      setLocalSuccess("");

      return;
    }

    const newTicket = makeTicket();

    setTickets((prev) => [
      ...prev,
      newTicket,
    ]);

    clearMessages();

    setTimeout(
      () =>
        focusBox(
          newTicket.id,
          0
        ),
      60
    );
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

      dispatch(
        clearLotteryConfigError()
      );

      dispatch(
        clearLotteryConfigSuccess()
      );

      if (!user) {
        return setLocalError(
          "Please login first"
        );
      }

      if (!lotteryConfig?._id) {
        return setLocalError(
          "Active lottery configuration not found"
        );
      }

      if (!lotteryConfig?.isActive) {
        return setLocalError(
          "Lottery is not active right now"
        );
      }

      const ticketAmount = apiPrice;

      if (
        !Number.isFinite(
          ticketAmount
        ) ||
        ticketAmount <= 0
      ) {
        return setLocalError(
          "Ticket price is not available"
        );
      }

      const invalidTicket =
        tickets.findIndex(
          (t) =>
            !TICKET_REGEX.test(
              t.code
            )
        );

      if (invalidTicket !== -1) {
        return setLocalError(
          `Ticket ${invalidTicket + 1
          } is not valid (e.g. ${TICKET_EXAMPLE})`
        );
      }

      const lotteryNumbers =
        tickets.map(
          (t) => t.code
        );

      const duplicates =
        lotteryNumbers.filter(
          (n, i) =>
            lotteryNumbers.indexOf(
              n
            ) !== i
        );

      if (duplicates.length > 0) {
        return setLocalError(
          "Two tickets cannot have the same number."
        );
      }

      const totalAmount =
        ticketAmount *
        tickets.length;

      setLocalSuccess(
        `Creating payment order for ${tickets.length} ticket(s)...`
      );

      const result =
        await dispatch(
          createDeposit({
            paymentMethod: "INR",
            channel: "qwackpay",
            amount: totalAmount,
            configId:
              lotteryConfig._id,
            lotteryNumbers,
          })
        ).unwrap();

      const paymentUrl =
        result?.paymentUrl ||
        depositPaymentUrl ||
        "";

      const orderId =
        result?.orderId ||
        depositOrderId ||
        "";

      if (!paymentUrl) {
        setLocalSuccess("");

        return setLocalError(
          result?.message ||
          "Payment URL not received. Please try again."
        );
      }

      setLocalError("");

      setLocalSuccess(
        `Order ${orderId} created. Redirecting to payment page...`
      );

      setTimeout(() => {
        window.location.href =
          paymentUrl;
      }, 600);

      setTickets([
        makeTicket(),
      ]);
    } catch (purchaseError) {
      console.error(
        "LOTTERY PURCHASE ERROR:",
        purchaseError
      );

      setLocalSuccess("");

      setLocalError(
        typeof purchaseError ===
          "string"
          ? purchaseError
          : purchaseError?.message ||
          purchaseError?.payload
            ?.message ||
          purchaseError?.payload ||
          "Could not buy tickets"
      );
    }
  };

  const displayError =
    localError ||
    depositError ||
    error;

  const isPurchaseDisabled =
    activeLoading ||
    amountLoading ||
    depositLoading ||
    !lotteryConfig?._id ||
    !lotteryConfig?.isActive ||
    !hasApiPrice ||
    tickets.length === 0 ||
    hasDuplicates ||
    tickets.some(
      (t) =>
        !TICKET_REGEX.test(
          t.code
        )
    );

  const visibleDateChips =
    showAllDates
      ? dateChips
      : dateChips.slice(0, 7);

  // ===================================================
  // UI
  // ===================================================

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden bg-[#eef3fa] text-[#173e70]"
      style={{
        paddingBottom:
          BOTTOM_NAV_HEIGHT +
          PURCHASE_BAR_HEIGHT +
          24,
      }}
    >
      {/* ================= HERO ================= */}

      <section className="relative min-h-[190px] overflow-hidden bg-[#3b0a14]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#2a0610]/95 via-[#4a0b18]/85 to-[#2a0610]/70" />

        <div className="pointer-events-none absolute -right-10 top-0 h-52 w-52 rounded-full bg-[#ff8a00]/25 blur-3xl" />

        <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-[#ff1744]/20 blur-3xl" />

        <div className="relative grid min-h-[190px] grid-cols-[1.05fr_1fr] items-center gap-2 px-3 py-5">
          <div className="relative z-10 min-w-0">
            <h1 className="font-serif font-black leading-[0.9] tracking-tight">
              <span className="block bg-gradient-to-b from-[#fff1a8] to-[#e0a11b] bg-clip-text text-[40px] text-transparent">
                Daily
              </span>

              <span className="block bg-gradient-to-b from-[#fff1a8] to-[#e0a11b] bg-clip-text text-[42px] text-transparent">
                Lottery
              </span>
            </h1>

            <p className="mt-2 text-[11px] font-medium leading-tight text-white">
              Small Ticket, Big Opportunities
            </p>

            <div className="mt-3 grid grid-cols-3 gap-1">
              <HeroFeature
                icon={
                  <CalendarDays
                    size={21}
                  />
                }
                l1="Every Day"
                l2="Draw"
              />

              <HeroFeature
                icon={
                  <Trophy
                    size={21}
                  />
                }
                l1={firstPrizeAmount}
                l2="Total Prize"
              />

              <HeroFeature
                icon={
                  <Users
                    size={21}
                  />
                }
                l1="10 Tickets"
                l2="per Draw"
              />
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <TicketMock
              prize={firstPrizeAmount}
              price={priceText}
            />
          </div>
        </div>
      </section>

      <main className="relative -mt-4 space-y-3 px-2">
        {/* ================= SELECT DRAW DATE ================= */}

        <Card>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <CalendarDays
                size={24}
                className="shrink-0 text-[#173e70]"
              />

              <h2 className="truncate text-[16px] font-extrabold text-[#173e70]">
                Select Draw Date
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowAllDates(
                  (s) => !s
                )
              }
              className="flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-[#c9d3e3] bg-white px-2.5 text-[10px] font-semibold text-[#173e70]"
            >
              {showAllDates
                ? "Show Less"
                : "View Full Schedule"}

              <ArrowRight
                size={12}
                className={`transition-transform ${showAllDates
                  ? "rotate-90"
                  : ""
                  }`}
              />
            </button>
          </div>

          {showAllDates ? (
            <div className="mt-3 grid grid-cols-4 gap-2 min-[400px]:grid-cols-5">
              {visibleDateChips.map(
                (chip, i) => (
                  <DateChip
                    key={i}
                    chip={chip}
                    today={i === 0}
                    active={
                      i ===
                      selectedDate
                    }
                    onClick={() =>
                      setSelectedDate(
                        i
                      )
                    }
                    fluid
                  />
                )
              )}
            </div>
          ) : (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {visibleDateChips.map(
                (chip, i) => (
                  <DateChip
                    key={i}
                    chip={chip}
                    today={i === 0}
                    active={
                      i ===
                      selectedDate
                    }
                    onClick={() =>
                      setSelectedDate(
                        i
                      )
                    }
                  />
                )
              )}
            </div>
          )}
        </Card>

        {/* ================= DAILY LOTTERY TICKET ================= */}

        <section className="relative overflow-hidden rounded-[16px] border border-[#f1d9a0] bg-gradient-to-r from-[#fff0c9] via-[#fff8e8] to-[#ffe7b8] p-3 shadow-sm">
          <div className="grid grid-cols-[auto_1fr] items-center gap-3">
            <div className="w-[104px]">
              <TicketMock
                small
                prize={firstPrizeAmount}
                price={priceText}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-serif text-[17px] font-black leading-tight text-[#173e70]">
                  Daily Lottery
                  Ticket
                </h2>

                <span className="shrink-0 rounded-md bg-[#ed1d43] px-2 py-1.5 text-[11px] font-extrabold text-white">
                  {priceText}{" "}
                  <span className="text-[8px] font-medium">
                    per ticket
                  </span>
                </span>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-1">
                <InfoItem
                  icon={
                    <Trophy
                      size={20}
                      className="text-[#8a4b12]"
                    />
                  }
                  title={
                    firstPrizeAmount
                  }
                  sub="Total First Prize"
                />

                <InfoItem
                  icon={
                    <Users
                      size={20}
                      className="text-[#8a4b12]"
                    />
                  }
                  title={`${MAX_TICKETS} Tickets`}
                  sub="Max per Order"
                />

                <InfoItem
                  icon={
                    <Clock
                      size={20}
                      className="text-[#8a4b12]"
                    />
                  }
                  title={format12h(
                    lotteryConfig?.drawTime
                  )}
                  sub={countdownText}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ================= CHOOSE YOUR TICKETS ================= */}

        <Card>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#e6c97c] bg-[#fff6df] text-[#8a4b12]">
                <Ticket
                  size={22}
                  className="-rotate-45"
                />
              </span>

              <div className="min-w-0 leading-tight">
                <h2 className="truncate text-[17px] font-extrabold text-[#173e70]">
                  Choose Your
                  Tickets
                </h2>

                <p className="truncate text-[10px] text-[#4b5563]">
                  Buy one or more
                  tickets
                </p>
              </div>
            </div>

            <span className="shrink-0 rounded-full border border-[#ed1d43]/30 bg-[#fff0f2] px-2.5 py-1.5 text-[11px] font-extrabold text-[#ed1d43]">
              {totalTickets}{" "}
              {totalTickets === 1
                ? "Ticket"
                : "Tickets"}
            </span>
          </div>

          {/* Ticket cards */}

          <div className="mt-3 space-y-3">
            {tickets.map(
              (ticket, index) => {
                const complete =
                  TICKET_REGEX.test(
                    ticket.code
                  );

                const duplicate =
                  ticket.code.length ===
                  TICKET_LENGTH &&
                  codeCounts[
                  ticket.code
                  ] > 1;

                return (
                  <div
                    key={ticket.id}
                    className={`rounded-2xl border p-3 ${duplicate
                      ? "border-red-300 bg-red-50/60"
                      : complete
                        ? "border-emerald-300 bg-emerald-50/40"
                        : "border-[#dfe5f0] bg-[#f9fbff]"
                      }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white ${BADGES[
                            index %
                            BADGES.length
                          ]
                            }`}
                        >
                          <Ticket
                            size={18}
                            className="-rotate-45"
                          />
                        </span>

                        <div className="min-w-0 leading-tight">
                          <h3 className="text-[14px] font-extrabold text-[#173e70]">
                            Ticket{" "}
                            {index + 1}
                          </h3>

                          <p className="truncate text-[9px] text-[#4b5563]">
                            Enter your{" "}
                            {
                              TICKET_LENGTH
                            }
                            -character
                            number
                          </p>
                        </div>
                      </div>

                      {totalTickets >
                        1 && (
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveTicket(
                                ticket.id
                              )
                            }
                            disabled={
                              depositLoading
                            }
                            aria-label={`Remove ticket ${index + 1
                              }`}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ed1d43] text-white disabled:opacity-40"
                          >
                            <Trash2
                              size={14}
                            />
                          </button>
                        )}
                    </div>

                    {/* Digit boxes */}

                    <div
                      className="mt-3 grid gap-1.5"
                      style={{
                        gridTemplateColumns: `repeat(${TICKET_LENGTH}, minmax(0, 1fr))`,
                      }}
                    >
                      {SLOT_PATTERN.map(
                        (_, i) => {
                          const filled =
                            Boolean(
                              ticket
                                .code[i]
                            );

                          return (
                            <input
                              key={i}
                              ref={(el) => {
                                inputRefs.current[
                                  `${ticket.id}-${i}`
                                ] = el;
                              }}
                              value={
                                ticket
                                  .code[
                                i
                                ] || ""
                              }
                              onChange={(
                                e
                              ) =>
                                handleBoxChange(
                                  ticket,
                                  i,
                                  e
                                )
                              }
                              onKeyDown={(
                                e
                              ) =>
                                handleBoxKeyDown(
                                  ticket,
                                  i,
                                  e
                                )
                              }
                              onPaste={(
                                e
                              ) =>
                                handleBoxPaste(
                                  ticket,
                                  e
                                )
                              }
                              onFocus={(e) =>
                                e.target.select()
                              }
                              disabled={
                                depositLoading
                              }
                              inputMode={
                                SLOT_PATTERN[
                                  i
                                ] ===
                                  "D"
                                  ? "numeric"
                                  : "text"
                              }
                              autoCapitalize="characters"
                              autoComplete="off"
                              spellCheck={
                                false
                              }
                              placeholder={slotPlaceholder(
                                i
                              )}
                              aria-label={`Ticket ${index + 1
                                } character ${i + 1
                                }`}
                              className={`h-12 w-full min-w-0 rounded-xl border-2 text-center text-[18px] font-extrabold outline-none transition placeholder:font-bold placeholder:text-[#c3c8de] focus:border-[#ed1d43] focus:shadow-[0_0_0_3px_rgba(237,29,67,0.15)] disabled:opacity-50 ${duplicate
                                ? "border-red-400 bg-white text-red-600"
                                : filled
                                  ? "border-[#173e70] bg-white text-[#173e70]"
                                  : "border-[#c9d3e3] bg-[#f1f3fa] text-[#173e70]"
                                }`}
                            />
                          );
                        }
                      )}
                    </div>

                    {/* Footer */}

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5 text-[10px]">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${duplicate
                            ? "bg-red-500"
                            : complete
                              ? "bg-emerald-500"
                              : "bg-[#f08a25]"
                            }`}
                        />

                        <span
                          className={`truncate ${duplicate
                            ? "font-semibold text-red-600"
                            : complete
                              ? "font-semibold text-emerald-600"
                              : "text-[#4b5563]"
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
                          onClick={() =>
                            handleClearTicket(
                              ticket.id
                            )
                          }
                          disabled={
                            depositLoading ||
                            !ticket.code
                          }
                          className="text-[11px] font-medium text-[#3d4468] underline underline-offset-2 disabled:opacity-40"
                        >
                          Clear
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleRandomTicket(
                              ticket.id
                            )
                          }
                          disabled={
                            depositLoading
                          }
                          className="flex items-center gap-1 rounded-lg border border-[#c9d3e3] bg-white px-3 py-1.5 text-[11px] font-bold text-[#173e70] disabled:opacity-50"
                        >
                          <Shuffle
                            size={13}
                          />

                          Random
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>

          {/* Add more tickets */}

          <button
            type="button"
            onClick={
              handleAddTicket
            }
            disabled={
              depositLoading ||
              totalTickets >=
              MAX_TICKETS
            }
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#ed1d43]/50 bg-[#fff0f2]/60 py-3.5 text-[14px] font-extrabold text-[#ed1d43] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#ed1d43]">
              <Plus
                size={14}
                strokeWidth={3}
              />
            </span>

            Add More Tickets
          </button>

          {/* Price summary */}

          {/* <div className="mt-3 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center rounded-xl bg-[#f3f6fb] px-2 py-2 text-center">
            <div>
              <p className="text-[9px] text-[#4b5563]">
                Ticket Price
              </p>

              <p className="text-[14px] font-black text-[#ed1d43]">
                {priceText}
              </p>
            </div>

            <span className="px-1 text-[#9aa5b8]">
              ×
            </span>

            <div>
              <p className="text-[9px] text-[#4b5563]">
                Total Tickets
              </p>

              <p className="text-[14px] font-black text-[#ed1d43]">
                {totalTickets}
              </p>
            </div>

            <span className="px-1 text-[#9aa5b8]">
              =
            </span>

            <div>
              <p className="text-[9px] text-[#4b5563]">
                Total Amount
              </p>

              <p className="text-[14px] font-black text-[#14a06a]">
                ₹
                {totalTicketPrice.toLocaleString(
                  "en-IN"
                )}
                /-
              </p>
            </div>
          </div> */}

          <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#bfe8d3] bg-[#e7f8ef] px-3 py-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#14a06a] text-white">
              <Info size={13} />
            </span>

            <p className="text-[10.5px] leading-snug text-[#26354b]">
              {totalTickets}{" "}
              {totalTickets === 1
                ? "ticket"
                : "unique tickets"}{" "}
              for the draw on{" "}
              {drawDateText}. Each
              ticket costs ₹
              {TICKET_PRICE}.
            </p>
          </div>
        </Card>

        {/* ================= WINNING RULES ================= */}

        <section className="overflow-hidden rounded-[18px] bg-gradient-to-br from-[#3a0b17] via-[#2b0a16] to-[#1a0710] shadow-lg">
          <div className="p-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <div className="flex min-w-0 items-center gap-2">
                <BookOpen
                  size={26}
                  className="shrink-0 text-[#ffd34e]"
                />

                <h2 className="text-[15px] font-extrabold leading-tight text-white">
                  Daily Lottery
                  Winning Rules
                </h2>
              </div>

              <button
                type="button"
                className="flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-white/40 px-2.5 text-[11px] font-semibold text-white"
              >
                View Official Terms
                <ArrowRight
                  size={12}
                />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="flex min-w-0 flex-col items-start justify-center gap-1 rounded-xl border border-white/15 bg-white/5 px-2.5 py-2">
                <span className="text-[10px] font-medium leading-tight text-white min-[360px]:text-[11px]">
                  Example Winning
                  Number
                </span>

                <span className="whitespace-nowrap rounded-md bg-white px-2 py-1 text-[15px] font-black tracking-wider text-[#d7193f] min-[360px]:text-[17px]">
                  <span className="text-[#d7193f]">
                    70AB
                  </span>

                  <span className="text-[#173e70]">
                    823
                  </span>
                </span>
              </div>

              <div className="flex min-w-0 items-center gap-1.5 rounded-xl border border-[#ffd34e]/30 bg-white/5 px-2.5 py-2">
                <Trophy
                  size={28}
                  className="shrink-0 text-[#ffd34e]"
                  fill="#ffd34e"
                />

                <div className="min-w-0">
                  <p className="text-[9px] text-white/80 min-[360px]:text-[10px]">
                    Total First Prize
                  </p>

                  <p className="whitespace-nowrap text-[17px] font-black uppercase leading-tight text-[#ffd34e] min-[360px]:text-[20px]">
                    {firstPrizeAmount}
                  </p>

                  <p className="mt-0.5 whitespace-nowrap text-[8px] text-white/75 min-[360px]:text-[9px]">
                    (10 Tickets ×
                    ₹10 Lakh)
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-b-[18px] bg-white">
            <div className="overflow-x-auto">
              <div className="min-w-[650px]">
                <div className="grid grid-cols-[22px_1.4fr_1.1fr_0.9fr_0.9fr] gap-1.5 bg-[#1a0710] px-2 py-2.5 text-[9.5px] font-semibold text-white sm:grid-cols-[26px_1.4fr_1.1fr_0.9fr_1fr] sm:gap-2 sm:px-3 sm:text-[11px]">
                  <span>#</span>

                  <span>
                    Match Condition
                  </span>

                  <span>
                    Example (For
                    7A 45823)
                  </span>

                  <span className="text-center">
                    Prize Per
                    Ticket
                  </span>

                  <span className="text-center">
                    Total Prize
                    (10 Tickets)
                  </span>
                </div>

                {RULES.map(
                  (rule, i) => (
                    <div
                      key={i}
                      className={`grid grid-cols-[22px_1.4fr_1.1fr_0.9fr_0.9fr] items-center gap-1.5 px-2 py-3 sm:grid-cols-[26px_1.4fr_1.1fr_0.9fr_1fr] sm:gap-2 sm:px-3 sm:py-3.5 ${ROW_TINTS[i]}`}
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-black text-white sm:h-6 sm:w-6 sm:text-[12px] ${BADGES[i]}`}
                      >
                        {i + 1}
                      </span>

                      <span className="text-[10.5px] leading-tight text-[#26354b] sm:text-[12px]">
                        {rule.cond}
                      </span>

                      <span className="whitespace-nowrap rounded border border-[#e6c97c] bg-[#fffdf5] px-1 py-0.5 font-mono text-[10.5px] font-black tracking-[0.3px] text-[#d7193f] sm:text-[11.5px]">
                        {rule.ex}
                      </span>

                      <span className="text-center text-[11px] font-extrabold leading-tight text-[#173e70] sm:text-[13px]">
                        {rule.per}
                      </span>

                      <span className="text-center text-[11px] font-black leading-tight text-[#d7193f] sm:text-[13px]">
                        {rule.total}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ================= PURCHASE BAR ================= */}

      <div
        className="fixed inset-x-2 z-[100] mb-1 sm:mb-2 mx-auto w-auto max-w-[450px] overflow-hidden rounded-lg border-t border-[#ff3155]/20 bg-gradient-to-b from-[#2b0a16] to-[#160610] shadow-[0_-4px_14px_rgba(0,0,0,0.4)] sm:inset-x-3"
        style={{
          bottom: BOTTOM_NAV_HEIGHT + 8,
        }}
      >
        {displayError && (
          <div className="mx-3 mt-2 rounded-lg border border-red-400/40 bg-red-500/15 px-2.5 py-1.5 text-center text-[10px] text-red-200">
            {typeof displayError === "string"
              ? displayError
              : displayError?.message || "Could not buy tickets"}
          </div>
        )}

        {localSuccess && !displayError && (
          <div className="mx-3 mt-2 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1.5 text-center text-[10px] text-emerald-200">
            {localSuccess}
          </div>
        )}

        <div className="flex w-full items-center gap-2 px-3 py-3 sm:gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium leading-none text-white/90 sm:text-[11px]">
              Total Amount
            </p>

            <div className="mt-1 flex min-w-0 items-center gap-2">
              <span className="shrink-0 whitespace-nowrap text-[20px] font-black leading-none text-[#2ee59d] sm:text-[23px]">
                ₹
                {totalTicketPrice.toLocaleString("en-IN")}
                /-
              </span>

              <p className="min-w-0 truncate text-[7.5px] leading-tight text-white/70 sm:text-[8.5px]">
                {totalTickets}{" "}
                {totalTickets === 1 ? "Ticket" : "Tickets"} • {drawDateText}
                <br />
                Daily Lottery
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePurchase}
            disabled={isPurchaseDisabled}
            className="flex h-[44px] w-auto min-w-[108px] shrink-0 items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-[#ff1744] to-[#e0102f] px-2.5 text-[12px] font-extrabold text-white shadow-[0_8px_25px_rgba(255,20,67,0.45)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:h-[48px] sm:min-w-[125px] sm:text-[14px]"
          >
            <span className="truncate">
              {depositLoading ? "Creating..." : "Purchase Now"}
            </span>

            {!depositLoading && (
              <ArrowRight
                size={16}
                className="shrink-0"
              />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// SMALL COMPONENTS
// =====================================================

const Card = ({
  children,
}) => (
  <section className="rounded-[16px] bg-white p-3 shadow-sm">
    {children}
  </section>
);

const DateChip = ({
  chip,
  today,
  active,
  onClick,
  fluid = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative flex h-[66px] ${fluid
      ? "w-full"
      : "w-[64px] shrink-0"
      } flex-col items-center justify-center rounded-xl border text-center transition active:scale-95 ${active
        ? "border-2 border-[#ed1d43] bg-[#fff0f2]"
        : "border-transparent bg-[#e3e9f3]"
      }`}
  >
    {today && (
      <span className="text-[10px] font-semibold text-[#ed1d43]">
        Today
      </span>
    )}

    <span
      className={`whitespace-nowrap text-[13px] font-extrabold ${active
        ? "text-[#ed1d43]"
        : "text-[#26354b]"
        }`}
    >
      {chip.day}{" "}
      {chip.month}
    </span>

    <span
      className={`text-[10px] ${active
        ? "text-[#ed1d43]"
        : "text-[#6b7280]"
        }`}
    >
      {chip.weekday}
    </span>

    <span
      className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${active
        ? "bg-[#ed1d43]"
        : "bg-[#20a66a]"
        }`}
    />
  </button>
);

const HeroFeature = ({
  icon,
  l1,
  l2,
}) => (
  <div className="flex min-w-0 flex-col items-center gap-1 text-center">
    <span className="text-[#ffd34e]">
      {icon}
    </span>

    <span className="break-words text-[8px] font-medium leading-tight text-white/90">
      {l1}
      <br />
      {l2}
    </span>
  </div>
);

const InfoItem = ({
  icon,
  title,
  sub,
}) => (
  <div className="flex min-w-0 flex-col items-center gap-0.5 text-center">
    <span className="shrink-0">
      {icon}
    </span>

    <p className="w-full truncate text-[10px] font-bold leading-tight text-[#173e70]">
      {title}
    </p>

    <p className="w-full truncate text-[8px] leading-tight text-[#4b5563]">
      {sub}
    </p>
  </div>
);

const TicketMock = ({
  prize,
  price,
  small = false,
}) => (
  <div
    className={`relative ${small
      ? "p-1.5"
      : "p-3"
      } -rotate-3 rounded-lg border-[3px] border-[#f2d1b8] bg-[#fffaf0] shadow-lg`}
    style={{
      fontSize: small
        ? "9px"
        : "10px",
    }}
  >
    <div className="absolute inset-0 -z-10 -rotate-[7deg] rounded-lg border border-[#e5c8a4] bg-[#fdf1dc]" />

    <div className="flex items-start justify-between gap-1">
      <div className="min-w-0">
        <p
          className={`font-black leading-none text-[#d7193f] ${small
            ? "text-[15px]"
            : "text-[25px]"
            }`}
        >
          DEAR
        </p>

        <p
          className={`font-bold text-[#153c78] ${small
            ? "text-[6px]"
            : "text-[8px]"
            }`}
        >
          DAILY LOTTERY
        </p>
      </div>

      <span
        className={`shrink-0 rounded-full bg-[#d7198c] text-center font-black leading-tight text-white ${small
          ? "px-1 py-0.5 text-[5px]"
          : "px-1.5 py-1 text-[7px]"
          }`}
      >
        Price
        <span className="block text-[1.3em]">
          {price}
        </span>
      </span>
    </div>

    <p
      className={`mt-1 font-bold text-[#26354b] ${small
        ? "text-[6px]"
        : "text-[8px]"
        }`}
    >
      First Prize
    </p>

    <p
      className={`whitespace-nowrap font-black uppercase leading-none text-[#153c78] ${small
        ? "text-[12px]"
        : "text-[20px]"
        }`}
    >
      {prize}
    </p>

    <div className="mt-1 border-y border-[#d7bba5] py-0.5 text-center">
      <p
        className={`font-bold text-[#26354b] ${small
          ? "text-[5px]"
          : "text-[6px]"
          }`}
      >
        Ticket Number
      </p>

      <p
        className={`whitespace-nowrap font-black tracking-[0.12em] text-[#173e70] ${small
          ? "text-[7px]"
          : "text-[9px]"
          }`}
      >
        47B39120
      </p>
    </div>
  </div>
);

export default BuyTicket;