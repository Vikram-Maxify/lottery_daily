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
} from "../reducer/slice/lotteryConfigSlice";

import { getAmount } from "../reducer/slice/amountReducer";

import {
  getMyKyc,
  selectKycDocuments,
  selectKycLoading,
} from "../reducer/slice/kycReducer";

// =====================================================
// CONSTANTS
// =====================================================

const MAX_TICKETS = 100;
const DEFAULT_TICKET_PRICE = 20;

const ALL_DATES_COUNT = 30;

const BOTTOM_NAV_HEIGHT = 72;
const PURCHASE_BAR_HEIGHT = 84;

// Ticket format:
// 2 digits + 1 alphabet + 5 digits
// Example: 12B12345
const SLOT_PATTERN = [
  "D",
  "D",
  "L",
  "D",
  "D",
  "D",
  "D",
  "D",
];

const TICKET_LENGTH = SLOT_PATTERN.length;

const TICKET_EXAMPLE = "12B12345";
const HERO_TICKET_NUMBER = "47B39120";

// This regex matches:
// DD + L + DDDDD
// Example: 12B12345
const TICKET_REGEX = /^\d{2}[A-Z]\d{5}$/;

// Winning rules are calculated for 10 winning tickets.
const RULE_TICKETS = 10;

// =====================================================
// WINNING RULE CONFIG
// =====================================================
//
// prizePerTicket = prize for ONE winning ticket.
// totalPrize = prizePerTicket × RULE_TICKETS.
//
// First rule is dynamically replaced using:
// lotteryConfig.prizes.first / RULE_TICKETS
// =====================================================

const RULES = [
  {
    cond: "All digits and alphabet match",
    ex: "12B12345",
    prizePerTicket: 1000000,
  },
  {
    cond: "Alphabet does not match but all digits match",
    ex: "12X12345",
    prizePerTicket: 500000,
  },
  {
    cond: "Last 5 digits match (any alphabet)",
    ex: "99K12345",
    prizePerTicket: 50000,
  }
];

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

// =====================================================
// HELPERS
// =====================================================

const pad = (n) => String(n).padStart(2, "0");

// =====================================================
// READ PRICE
// =====================================================

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

// =====================================================
// FORMAT MONEY
// =====================================================

const formatPrize = (amount) => {
  const num = Number(amount);

  if (!Number.isFinite(num) || num <= 0) {
    return "₹0";
  }

  if (num >= 10000000) {
    const crore = num / 10000000;

    return `₹${
      crore % 1 === 0
        ? crore.toFixed(0)
        : crore.toFixed(2)
    } Crore`;
  }

  if (num >= 100000) {
    const lakh = num / 100000;

    return `₹${
      lakh % 1 === 0
        ? lakh.toFixed(0)
        : lakh.toFixed(2)
    } Lakh`;
  }

  if (num >= 1000) {
    const thousand = num / 1000;

    return `₹${
      thousand % 1 === 0
        ? thousand.toFixed(0)
        : thousand.toFixed(2)
    } Thousand`;
  }

  return `₹${num.toLocaleString("en-IN")}`;
};

// Existing UI compatibility.
const formatCrore = (amount) => {
  return formatPrize(amount);
};

// =====================================================
// CALCULATE WINNING RULES
// =====================================================

const getWinningRules = (firstPrizeTotal) => {
  const backendFirstPrize = Number(firstPrizeTotal);

  return RULES.map((rule, index) => {
    let prizePerTicket = Number(rule.prizePerTicket) || 0;

    let totalPrize =
      prizePerTicket * RULE_TICKETS;

    // -------------------------------------------------
    // FIRST PRIZE
    // -------------------------------------------------
    //
    // Backend first prize is treated as TOTAL prize.
    //
    // Example:
    // Backend = 10000000
    // Total   = ₹1 Crore
    // Per     = ₹10 Lakh
    //
    if (
      index === 0 &&
      Number.isFinite(backendFirstPrize) &&
      backendFirstPrize > 0
    ) {
      totalPrize = backendFirstPrize;

      prizePerTicket =
        backendFirstPrize / RULE_TICKETS;
    }

    return {
      ...rule,
      prizePerTicket,
      totalPrize,
      prizeText: formatPrize(prizePerTicket),
      totalText: formatPrize(totalPrize),
    };
  });
};

// =====================================================
// TIME FORMAT
// =====================================================

const format12h = (time) => {
  const [h, m] = String(time || "")
    .split(":")
    .map(Number);

  if (
    !Number.isFinite(h) ||
    !Number.isFinite(m)
  ) {
    return "--:--";
  }

  return `${h % 12 || 12}:${pad(m)} ${
    h >= 12 ? "PM" : "AM"
  }`;
};

// =====================================================
// TICKET SLOT HELPERS
// =====================================================

const slotAccepts = (index, ch) =>
  SLOT_PATTERN[index] === "D"
    ? /^\d$/.test(ch)
    : /^[A-Z]$/.test(ch);

const slotPlaceholder = (index) =>
  SLOT_PATTERN[index] === "D" ? "0" : "A";

// =====================================================
// SANITIZE TICKET
// =====================================================

const sanitizeCode = (raw) => {
  const cleaned = String(raw || "")
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "");

  let result = "";

  for (const ch of cleaned) {
    if (result.length >= TICKET_LENGTH) {
      break;
    }

    if (slotAccepts(result.length, ch)) {
      result += ch;
    }
  }

  return result;
};

// =====================================================
// RANDOM TICKET
// =====================================================

const randomCode = () =>
  SLOT_PATTERN.map((slot) =>
    slot === "D"
      ? String(
          Math.floor(Math.random() * 10)
        )
      : String.fromCharCode(
          65 + Math.floor(Math.random() * 26)
        )
  ).join("");

const randomUniqueCode = (usedCodes = []) => {
  const used = new Set(usedCodes);

  let code = randomCode();
  let guard = 0;

  while (
    used.has(code) &&
    guard < 100
  ) {
    code = randomCode();
    guard += 1;
  }

  return code;
};

// =====================================================
// CREATE TICKET
// =====================================================

const makeTicket = (code = "") => ({
  id: `${Date.now()}-${Math.random()}`,
  code,
});

// =====================================================
// DRAW TIMESTAMP
// =====================================================

const getDrawTimestamp = (lotteryConfig) => {
  if (
    !lotteryConfig?.drawDate ||
    !lotteryConfig?.drawTime
  ) {
    return null;
  }

  const drawDate = new Date(
    lotteryConfig.drawDate
  );

  if (Number.isNaN(drawDate.getTime())) {
    return null;
  }

  const [
    hoursString,
    minutesString,
  ] = String(
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

// =====================================================
// COUNTDOWN
// =====================================================

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

  const difference =
    drawTimestamp - Date.now();

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
    days: Math.floor(
      totalSeconds / 86400
    ),
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
// KYC STATUS
// =====================================================

const deriveKycStatus = (documents) => {
  if (
    !Array.isArray(documents) ||
    documents.length === 0
  ) {
    return "not_submitted";
  }

  const statuses = documents.map(
    (document) =>
      String(
        document?.status || ""
      ).toLowerCase()
  );

  if (
    statuses.includes("approved") ||
    statuses.includes("verified")
  ) {
    return "approved";
  }

  if (statuses.includes("pending")) {
    return "pending";
  }

  if (statuses.includes("rejected")) {
    return "rejected";
  }

  return "not_submitted";
};

// =====================================================
// BUY TICKET
// =====================================================

const BuyTicket = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ===================================================
  // AUTH
  // ===================================================

  const { user } = useSelector(
    (state) => state.auth || {}
  );

  // ===================================================
  // LOTTERY CONFIG
  // ===================================================

  const {
    activeConfig,
    activeLoading,
    error,
  } = useSelector(
    (state) =>
      state.lotteryConfig || {
        configs: [],
        activeConfig: null,
        activeLoading: false,
        error: null,
      }
  );

  const lotteryConfig = activeConfig;

  // ===================================================
  // TICKET PRICE
  // ===================================================

  const {
    amount: ticketPriceFromApi,
  } = useSelector(
    (state) =>
      state.amount || {
        amount: null,
        loading: false,
      }
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

  // ===================================================
  // DEPOSIT
  // ===================================================

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

  // ===================================================
  // KYC
  // ===================================================

  const kycDocuments = useSelector(
    selectKycDocuments
  );

  const kycLoading = useSelector(
    selectKycLoading
  );

  // ===================================================
  // STATE
  // ===================================================

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

  const [countdown, setCountdown] =
    useState({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: false,
      available: false,
    });

  // ===================================================
  // KYC STATUS
  // ===================================================

  const kycStatus = useMemo(
    () =>
      deriveKycStatus(kycDocuments),
    [kycDocuments]
  );

  const isKycApproved =
    kycStatus === "approved";

  // ===================================================
  // WINNING RULES
  // ===================================================

  const backendFirstPrize = readPrice(
    lotteryConfig?.prizes?.first
  );

  const winningRules = useMemo(
    () =>
      getWinningRules(
        backendFirstPrize
      ),
    [backendFirstPrize]
  );

  // Total first prize.
  const calculatedFirstPrize =
    winningRules[0]?.totalPrize || 0;

  const firstPrizeAmount =
    formatPrize(calculatedFirstPrize);

  // First prize for ONE winning ticket.
  const firstPrizePerTicket =
    winningRules[0]?.prizeText || "₹0";

  // ===================================================
  // INITIAL API CALLS
  // ===================================================

  useEffect(() => {
    dispatch(getActiveLotteryConfig());
    dispatch(getAmount());
    dispatch(clearDepositState());
    dispatch(getMyKyc());
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

    const update = () => {
      setCountdown(
        getCountdown(drawTimestamp)
      );
    };

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
  // DATE CHIPS
  // ===================================================

  const dateChips = useMemo(
    () =>
      Array.from(
        {
          length: ALL_DATES_COUNT,
        },
        (_, i) => {
          const d = new Date();

          d.setDate(
            d.getDate() + i
          );

          return {
            day: d.getDate(),
            month:
              d.toLocaleString(
                "en-US",
                {
                  month: "short",
                }
              ),
            weekday:
              d
                .toLocaleString(
                  "en-US",
                  {
                    weekday: "short",
                  }
                )
                .toUpperCase(),
          };
        }
      ),
    []
  );

  // ===================================================
  // DRAW DATE
  // ===================================================

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

  // ===================================================
  // TICKET CALCULATIONS
  // ===================================================

  const totalTickets = tickets.length;

  const codeCounts = useMemo(() => {
    const counts = {};

    tickets.forEach((ticket) => {
      if (
        ticket.code.length ===
        TICKET_LENGTH
      ) {
        counts[ticket.code] =
          (counts[ticket.code] || 0) +
          1;
      }
    });

    return counts;
  }, [tickets]);

  const hasDuplicates =
    Object.values(codeCounts).some(
      (count) => count > 1
    );

  const totalTicketPrice =
    TICKET_PRICE * totalTickets;

  const priceText =
    `₹${TICKET_PRICE}/-`;

  const countdownText =
    !countdown.available
      ? "Timer not available"
      : countdown.expired
        ? "Draw started"
        : `${
            countdown.days > 0
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
  // MESSAGE CLEAR
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

  // ===================================================
  // INPUT HELPERS
  // ===================================================

  const focusBox = (
    ticketId,
    index
  ) => {
    const element =
      inputRefs.current[
        `${ticketId}-${index}`
      ];

    if (element) {
      element.focus();

      if (element.select) {
        element.select();
      }
    }
  };

  const setTicketCode = (
    ticketId,
    code
  ) => {
    setTickets((previous) =>
      previous.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              code,
            }
          : ticket
      )
    );

    setLocalError("");
    setLocalSuccess("");
  };

  // ===================================================
  // INPUT CHANGE
  // ===================================================

  const handleBoxChange = (
    ticket,
    index,
    event
  ) => {
    if (depositLoading) return;

    const raw = event.target.value;

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

    if (!slotAccepts(pos, ch)) {
      return;
    }

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

  // ===================================================
  // INPUT KEYDOWN
  // ===================================================

  const handleBoxKeyDown = (
    ticket,
    index,
    event
  ) => {
    if (
      event.key === "Backspace" &&
      !ticket.code[index]
    ) {
      event.preventDefault();

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
      event.key === "ArrowLeft" &&
      index > 0
    ) {
      event.preventDefault();

      focusBox(
        ticket.id,
        index - 1
      );
    }

    if (
      event.key === "ArrowRight" &&
      index <
        TICKET_LENGTH - 1
    ) {
      event.preventDefault();

      focusBox(
        ticket.id,
        index + 1
      );
    }
  };

  // ===================================================
  // PASTE
  // ===================================================

  const handleBoxPaste = (
    ticket,
    event
  ) => {
    event.preventDefault();

    if (depositLoading) return;

    const code = sanitizeCode(
      event.clipboardData.getData(
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

  // ===================================================
  // RANDOM TICKET
  // ===================================================

  const handleRandomTicket = (
    ticketId
  ) => {
    if (depositLoading) return;

    const others = tickets
      .filter(
        (ticket) =>
          ticket.id !== ticketId
      )
      .map(
        (ticket) => ticket.code
      );

    setTicketCode(
      ticketId,
      randomUniqueCode(others)
    );
  };

  // ===================================================
  // CLEAR TICKET
  // ===================================================

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

  // ===================================================
  // REMOVE TICKET
  // ===================================================

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

    setTickets((previous) =>
      previous.filter(
        (ticket) =>
          ticket.id !== ticketId
      )
    );

    clearMessages();
  };

  // ===================================================
  // ADD TICKET
  // ===================================================

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

    const newTicket =
      makeTicket();

    setTickets((previous) => [
      ...previous,
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
  // PURCHASE
  // ===================================================

  const handlePurchase =
    async () => {
      if (depositLoading) return;

      try {
        setLocalError("");
        setLocalSuccess("");

        dispatch(
          clearDepositState()
        );

        dispatch(
          clearLotteryConfigError()
        );

        dispatch(
          clearLotteryConfigSuccess()
        );

        // -------------------------------------------------
        // LOGIN
        // -------------------------------------------------

        if (!user) {
          return setLocalError(
            "Please login first"
          );
        }

        // -------------------------------------------------
        // KYC
        // -------------------------------------------------

        if (!isKycApproved) {
          if (
            kycStatus ===
            "pending"
          ) {
            return setLocalError(
              "Your KYC is pending approval. Please wait for admin verification."
            );
          }

          if (
            kycStatus ===
            "rejected"
          ) {
            setLocalError(
              "Your KYC was rejected. Redirecting to KYC page..."
            );

            setTimeout(
              () =>
                navigate("/kyc"),
              1500
            );

            return;
          }

          setLocalError(
            "Please complete your KYC first. Redirecting to KYC page..."
          );

          setTimeout(
            () =>
              navigate("/kyc"),
            1500
          );

          return;
        }

        // -------------------------------------------------
        // LOTTERY CONFIG
        // -------------------------------------------------

        if (!lotteryConfig?._id) {
          return setLocalError(
            "Active lottery configuration not found"
          );
        }

        if (
          !lotteryConfig?.isActive
        ) {
          return setLocalError(
            "Lottery is not active right now"
          );
        }

        // -------------------------------------------------
        // TICKET PRICE
        // -------------------------------------------------

        const ticketAmount =
          apiPrice;

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

        // -------------------------------------------------
        // TICKET VALIDATION
        // -------------------------------------------------

        const invalidTicket =
          tickets.findIndex(
            (ticket) =>
              !TICKET_REGEX.test(
                ticket.code
              )
          );

        if (
          invalidTicket !== -1
        ) {
          return setLocalError(
            `Ticket ${
              invalidTicket + 1
            } is not valid (e.g. ${TICKET_EXAMPLE})`
          );
        }

        // -------------------------------------------------
        // LOTTERY NUMBERS
        // -------------------------------------------------

        const lotteryNumbers =
          tickets.map(
            (ticket) =>
              ticket.code
          );

        // -------------------------------------------------
        // DUPLICATES
        // -------------------------------------------------

        const duplicates =
          lotteryNumbers.filter(
            (number, index) =>
              lotteryNumbers.indexOf(
                number
              ) !== index
          );

        if (
          duplicates.length > 0
        ) {
          return setLocalError(
            "Two tickets cannot have the same number."
          );
        }

        // -------------------------------------------------
        // TOTAL AMOUNT
        // -------------------------------------------------

        const totalAmount =
          ticketAmount *
          tickets.length;

        setLocalSuccess(
          `Creating payment order for ${tickets.length} ticket(s)...`
        );

        // -------------------------------------------------
        // CREATE DEPOSIT
        // -------------------------------------------------

        const result =
          await dispatch(
            createDeposit({
              paymentMethod:
                "INR",
              channel:
                "qwackpay",
              amount:
                totalAmount,
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
      } catch (
        purchaseError
      ) {
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

  // ===================================================
  // DISPLAY STATES
  // ===================================================

  const displayError =
    localError ||
    depositError ||
    error;

  const isPurchaseDisabled =
    activeLoading ||
    depositLoading ||
    !lotteryConfig?._id ||
    !lotteryConfig?.isActive ||
    !hasApiPrice ||
    tickets.length === 0 ||
    hasDuplicates ||
    tickets.some(
      (ticket) =>
        !TICKET_REGEX.test(
          ticket.code
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
      {/* =================================================
          HERO
      ================================================= */}

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
                  <Trophy size={21} />
                }
                l1={firstPrizeAmount}
                l2="Total Prize"
              />

              <HeroFeature
                icon={
                  <Users size={21} />
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
              number={
                HERO_TICKET_NUMBER
              }
            />
          </div>
        </div>
      </section>

      <main className="relative -mt-4 space-y-3 px-2">
        {/* =================================================
            KYC STATUS
        ================================================= */}

        {!kycLoading &&
          kycStatus !==
            "approved" && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                kycStatus ===
                "pending"
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : kycStatus ===
                      "rejected"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-blue-200 bg-blue-50 text-blue-700"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  {kycStatus ===
                    "pending" && (
                    <>
                      <p className="font-bold">
                        KYC Verification
                        Pending
                      </p>

                      <p className="mt-0.5 text-xs">
                        Your KYC is under
                        review. You
                        cannot purchase
                        tickets until
                        approved.
                      </p>
                    </>
                  )}

                  {kycStatus ===
                    "rejected" && (
                    <>
                      <p className="font-bold">
                        KYC Rejected
                      </p>

                      <p className="mt-0.5 text-xs">
                        Your KYC was
                        rejected. Please
                        re-submit your
                        documents.
                      </p>
                    </>
                  )}

                  {kycStatus ===
                    "not_submitted" && (
                    <>
                      <p className="font-bold">
                        KYC Required
                      </p>

                      <p className="mt-0.5 text-xs">
                        Please complete
                        your KYC to
                        purchase lottery
                        tickets.
                      </p>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/kyc")
                  }
                  className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-bold shadow-sm"
                >
                  {kycStatus ===
                  "rejected"
                    ? "Re-submit"
                    : "Complete KYC"}
                </button>
              </div>
            </div>
          )}

        {kycLoading && (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
            Checking KYC status...
          </div>
        )}

        {/* =================================================
            SELECT DRAW DATE
        ================================================= */}

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
                  (value) =>
                    !value
                )
              }
              className="flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-[#c9d3e3] bg-white px-2.5 text-[10px] font-semibold text-[#173e70]"
            >
              {showAllDates
                ? "Show Less"
                : "View Full Schedule"}

              <ArrowRight
                size={12}
                className={`transition-transform ${
                  showAllDates
                    ? "rotate-90"
                    : ""
                }`}
              />
            </button>
          </div>

          {showAllDates ? (
            <div className="mt-3 grid grid-cols-4 gap-2 min-[400px]:grid-cols-5">
              {visibleDateChips.map(
                (
                  chip,
                  index
                ) => (
                  <DateChip
                    key={index}
                    chip={chip}
                    today={
                      index === 0
                    }
                    active={
                      index ===
                      selectedDate
                    }
                    onClick={() =>
                      setSelectedDate(
                        index
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
                (
                  chip,
                  index
                ) => (
                  <DateChip
                    key={index}
                    chip={chip}
                    today={
                      index === 0
                    }
                    active={
                      index ===
                      selectedDate
                    }
                    onClick={() =>
                      setSelectedDate(
                        index
                      )
                    }
                  />
                )
              )}
            </div>
          )}
        </Card>

        {/* =================================================
            DAILY LOTTERY TICKET
        ================================================= */}

        <section className="relative overflow-hidden rounded-[16px] border border-[#f1d9a0] bg-gradient-to-r from-[#fff0c9] via-[#fff8e8] to-[#ffe7b8] p-3 shadow-sm">
          <div className="grid grid-cols-[auto_1fr] items-center gap-3">
            <div className="w-[104px]">
              <TicketMock
                small
                prize={firstPrizeAmount}
                price={priceText}
                number={
                  HERO_TICKET_NUMBER
                }
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-serif text-[17px] font-black leading-tight text-[#173e70]">
                  Daily Lottery Ticket
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
                  sub={
                    countdownText
                  }
                />
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            CHOOSE YOUR TICKETS
        ================================================= */}

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
                  Choose Your Tickets
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

          <div className="mt-3 space-y-3">
            {tickets.map(
              (ticket, index) => {
                const complete =
                  TICKET_REGEX.test(
                    ticket.code
                  );

                const duplicate =
                  ticket.code
                    .length ===
                    TICKET_LENGTH &&
                  codeCounts[
                    ticket.code
                  ] > 1;

                return (
                  <div
                    key={
                      ticket.id
                    }
                    className={`rounded-2xl border p-3 ${
                      duplicate
                        ? "border-red-300 bg-red-50/60"
                        : complete
                          ? "border-emerald-300 bg-emerald-50/40"
                          : "border-[#dfe5f0] bg-[#f9fbff]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white ${
                            BADGES[
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
                            {index +
                              1}
                          </h3>

                          <p className="truncate text-[9px] text-[#4b5563]">
                            Format:{" "}
                            {
                              TICKET_EXAMPLE
                            }
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
                          aria-label={`Remove ticket ${
                            index + 1
                          }`}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ed1d43] text-white disabled:opacity-40"
                        >
                          <Trash2
                            size={14}
                          />
                        </button>
                      )}
                    </div>

                    {/* INPUT BOXES */}

                    <div
                      className="mt-3 grid gap-1"
                      style={{
                        gridTemplateColumns: `repeat(${TICKET_LENGTH}, minmax(0, 1fr))`,
                      }}
                    >
                      {SLOT_PATTERN.map(
                        (
                          slot,
                          slotIndex
                        ) => {
                          const filled =
                            Boolean(
                              ticket
                                .code[
                                slotIndex
                              ]
                            );

                          const isLetter =
                            slot ===
                            "L";

                          return (
                            <input
                              key={
                                slotIndex
                              }
                              ref={(
                                element
                              ) => {
                                inputRefs.current[
                                  `${ticket.id}-${slotIndex}`
                                ] =
                                  element;
                              }}
                              value={
                                ticket
                                  .code[
                                  slotIndex
                                ] ||
                                ""
                              }
                              onChange={(
                                event
                              ) =>
                                handleBoxChange(
                                  ticket,
                                  slotIndex,
                                  event
                                )
                              }
                              onKeyDown={(
                                event
                              ) =>
                                handleBoxKeyDown(
                                  ticket,
                                  slotIndex,
                                  event
                                )
                              }
                              onPaste={(
                                event
                              ) =>
                                handleBoxPaste(
                                  ticket,
                                  event
                                )
                              }
                              onFocus={(
                                event
                              ) =>
                                event.target.select()
                              }
                              disabled={
                                depositLoading
                              }
                              inputMode={
                                isLetter
                                  ? "text"
                                  : "numeric"
                              }
                              autoCapitalize="characters"
                              autoComplete="off"
                              spellCheck={
                                false
                              }
                              maxLength={
                                2
                              }
                              placeholder={slotPlaceholder(
                                slotIndex
                              )}
                              aria-label={`Ticket ${
                                index +
                                1
                              } character ${
                                slotIndex +
                                1
                              }`}
                              className={`h-11 w-full min-w-0 rounded-lg border-2 p-0 text-center text-[17px] font-extrabold outline-none transition placeholder:font-bold placeholder:text-[#c3c8de] focus:border-[#ed1d43] focus:shadow-[0_0_0_3px_rgba(237,29,67,0.15)] disabled:opacity-50 min-[380px]:h-12 min-[380px]:rounded-xl min-[380px]:text-[18px] ${
                                duplicate
                                  ? "border-red-400 bg-white text-red-600"
                                  : filled
                                    ? isLetter
                                      ? "border-[#ed1d43] bg-[#fff0f2] text-[#ed1d43]"
                                      : "border-[#173e70] bg-white text-[#173e70]"
                                    : isLetter
                                      ? "border-[#f3b6c1] bg-[#fff7f8] text-[#173e70]"
                                      : "border-[#c9d3e3] bg-[#f1f3fa] text-[#173e70]"
                              }`}
                            />
                          );
                        }
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5 text-[10px]">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            duplicate
                              ? "bg-red-500"
                              : complete
                                ? "bg-emerald-500"
                                : "bg-[#f08a25]"
                          }`}
                        />

                        <span
                          className={`truncate ${
                            duplicate
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

          <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#bfe8d3] bg-[#e7f8ef] px-3 py-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#14a06a] text-white">
              <Info size={13} />
            </span>

            <p className="text-[10.5px] leading-snug text-[#26354b]">
              {totalTickets}{" "}
              {totalTickets ===
              1
                ? "ticket"
                : "unique tickets"}{" "}
              for the draw on{" "}
              {drawDateText}.
              Each ticket costs ₹
              {TICKET_PRICE}.
            </p>
          </div>
        </Card>

        {/* =================================================
            WINNING RULES
        ================================================= */}

        <section className="overflow-hidden rounded-[18px] bg-gradient-to-br from-[#3a0b17] via-[#2b0a16] to-[#1a0710] p-2.5 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex min-w-0 items-center gap-2">
              <BookOpen
                size={26}
                className="shrink-0 text-[#ffd34e]"
              />

              <h2 className="text-[15px] font-extrabold leading-tight text-white">
                Daily Lottery Winning Rules
              </h2>
            </div>

            <button
              type="button"
              className="flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-white/40 px-2.5 text-[11px] font-semibold text-white"
            >
              View Official Terms
              <ArrowRight size={12} />
            </button>
          </div>

          {/* TOP WINNING SUMMARY */}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="flex min-w-0 flex-col items-start justify-center gap-1 rounded-xl border border-white/15 bg-white/5 px-2.5 py-2">
              <span className="text-[11px] font-medium leading-tight text-white">
                Example Winning Number
              </span>

              <span className="whitespace-nowrap rounded-md bg-white px-2 py-1 text-[17px] font-black tracking-wider">
                <span className="text-[#d7193f]">
                  12B
                </span>

                <span className="text-[#173e70]">
                  12345
                </span>
              </span>
            </div>

            <div className="flex min-w-0 items-center gap-1.5 rounded-xl border border-[#ffd34e]/30 bg-white/5 px-2.5 py-2">
              <Trophy
                size={30}
                className="shrink-0 text-[#ffd34e]"
                fill="#ffd34e"
              />

              <div className="min-w-0">
                <p className="text-[10px] text-white/80">
                  Total First Prize
                </p>

                <p className="whitespace-nowrap text-[20px] font-black uppercase leading-none text-[#ffd34e]">
                  {
                    firstPrizeAmount
                  }
                </p>

                <p className="mt-0.5 whitespace-nowrap text-[9px] text-white/75">
                  (
                  {
                    RULE_TICKETS
                  }{" "}
                  Tickets ×{" "}
                  {
                    firstPrizePerTicket
                  }
                  )
                </p>
              </div>
            </div>
          </div>

          {/* WINNING RULE TABLE */}

          <div className="mt-3 overflow-hidden rounded-lg">
            <table className="w-full table-fixed border-collapse text-left">
              <colgroup>
                <col
                  style={{
                    width: "9%",
                  }}
                />

                <col
                  style={{
                    width: "28%",
                  }}
                />

                <col
                  style={{
                    width: "26%",
                  }}
                />

                <col
                  style={{
                    width: "17%",
                  }}
                />

                <col
                  style={{
                    width: "20%",
                  }}
                />
              </colgroup>

              <thead>
                <tr className="bg-[#1a0710] text-white">
                  {[
                    "#",
                    "Match Condition",
                    `Example (For ${TICKET_EXAMPLE})`,
                    "Prize Per Ticket",
                    `Total Prize (${RULE_TICKETS} Tickets)`,
                  ].map(
                    (heading) => (
                      <th
                        key={
                          heading
                        }
                        className="px-1.5 py-2.5 text-[10px] font-semibold leading-tight"
                      >
                        {
                          heading
                        }
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {winningRules.map(
                  (
                    rule,
                    index
                  ) => (
                    <RuleRow
                      key={
                        rule.ex
                      }
                      number={
                        index + 1
                      }
                      condition={
                        rule.cond
                      }
                      example={
                        rule.ex
                      }
                      prize={
                        rule.prizeText
                      }
                      total={
                        rule.totalText
                      }
                      badge={
                        BADGES[
                          index
                        ]
                      }
                      row={
                        ROW_TINTS[
                          index
                        ]
                      }
                    />
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* =================================================
          PURCHASE BAR
      ================================================= */}

      <div
        className="fixed inset-x-2 z-[100] mx-auto mb-1 w-auto max-w-[450px] overflow-hidden rounded-lg border-t border-[#ff3155]/20 bg-gradient-to-b from-[#2b0a16] to-[#160610] shadow-[0_-4px_14px_rgba(0,0,0,0.4)] sm:inset-x-3 sm:mb-2"
        style={{
          bottom:
            BOTTOM_NAV_HEIGHT +
            8,
        }}
      >
        {displayError && (
          <div className="mx-3 mt-2 rounded-lg border border-red-400/40 bg-red-500/15 px-2.5 py-1.5 text-center text-[10px] text-red-200">
            {typeof displayError ===
            "string"
              ? displayError
              : displayError?.message ||
                "Could not buy tickets"}
          </div>
        )}

        {localSuccess &&
          !displayError && (
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
                {totalTicketPrice.toLocaleString(
                  "en-IN"
                )}
                /-
              </span>

              <p className="min-w-0 truncate text-[7.5px] leading-tight text-white/70 sm:text-[8.5px]">
                {totalTickets}{" "}
                {totalTickets ===
                1
                  ? "Ticket"
                  : "Tickets"}{" "}
                •{" "}
                {drawDateText}
                <br />
                Daily Lottery
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              handlePurchase
            }
            disabled={
              isPurchaseDisabled
            }
            className="flex h-[44px] w-auto min-w-[108px] shrink-0 items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-[#ff1744] to-[#e0102f] px-2.5 text-[12px] font-extrabold text-white shadow-[0_8px_25px_rgba(255,20,67,0.45)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:h-[48px] sm:min-w-[125px] sm:text-[14px]"
          >
            <span className="truncate">
              {depositLoading
                ? "Creating..."
                : "Purchase Now"}
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

// =====================================================
// DATE CHIP
// =====================================================

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
    className={`relative flex h-[66px] ${
      fluid
        ? "w-full"
        : "w-[64px] shrink-0"
    } flex-col items-center justify-center rounded-xl border text-center transition active:scale-95 ${
      active
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
      className={`whitespace-nowrap text-[13px] font-extrabold ${
        active
          ? "text-[#ed1d43]"
          : "text-[#26354b]"
      }`}
    >
      {chip.day}{" "}
      {chip.month}
    </span>

    <span
      className={`text-[10px] ${
        active
          ? "text-[#ed1d43]"
          : "text-[#6b7280]"
      }`}
    >
      {chip.weekday}
    </span>

    <span
      className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${
        active
          ? "bg-[#ed1d43]"
          : "bg-[#20a66a]"
      }`}
    />
  </button>
);

// =====================================================
// HERO FEATURE
// =====================================================

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

// =====================================================
// INFO ITEM
// =====================================================

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

// =====================================================
// TICKET MOCK
// =====================================================

const TicketMock = ({
  prize,
  price,
  number,
  small = false,
}) => (
  <div
    className={`relative ${
      small
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
          className={`font-black leading-none text-[#d7193f] ${
            small
              ? "text-[15px]"
              : "text-[25px]"
          }`}
        >
          DEAR
        </p>

        <p
          className={`font-bold text-[#153c78] ${
            small
              ? "text-[6px]"
              : "text-[8px]"
          }`}
        >
          DAILY LOTTERY
        </p>
      </div>

      <span
        className={`shrink-0 rounded-full bg-[#d7198c] text-center font-black leading-tight text-white ${
          small
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
      className={`mt-1 font-bold text-[#26354b] ${
        small
          ? "text-[5px]"
          : "text-[6px]"
      }`}
    >
      First Prize
    </p>

    <p
      className={`whitespace-nowrap font-black uppercase leading-none text-[#153c78] ${
        small
          ? "text-[12px]"
          : "text-[20px]"
      }`}
    >
      {prize}
    </p>

    <div className="mt-1 border-y border-[#d7bba5] py-0.5 text-center">
      <p
        className={`font-bold text-[#26354b] ${
          small
            ? "text-[5px]"
            : "text-[6px]"
        }`}
      >
        Ticket Number
      </p>

      <p
        className={`whitespace-nowrap font-black tracking-[0.12em] text-[#173e70] ${
          small
            ? "text-[7px]"
            : "text-[9px]"
        }`}
      >
        {number}
      </p>
    </div>
  </div>
);

// =====================================================
// RULE ROW
// =====================================================

const RuleRow = ({
  number,
  condition,
  example,
  prize,
  total,
  badge,
  row,
}) => (
  <tr
    className={`${row} border-b border-white/60`}
  >
    <td className="px-1.5 py-2.5">
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-black text-white ${badge}`}
      >
        {number}
      </span>
    </td>

    <td className="px-1.5 py-2.5 text-[10.5px] font-medium leading-tight text-[#26354b]">
      {condition}
    </td>

    <td className="px-1.5 py-2.5">
      <span className="whitespace-nowrap rounded border border-[#e6c97c] bg-[#fffdf5] px-1 py-0.5 font-mono text-[10px] font-black tracking-[0.2px] text-[#d7193f]">
        {example}
      </span>
    </td>

    <td className="px-1.5 py-2.5 text-[11.5px] font-bold leading-tight text-[#173e70]">
      {prize}
    </td>

    <td className="px-1.5 py-2.5 text-[11.5px] font-black leading-tight text-[#d7193f]">
      {total}
    </td>
  </tr>
);

export default BuyTicket;