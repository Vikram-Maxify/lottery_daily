import {
  ArrowRight,
  Banknote,
  CalendarDays,
  ChevronDown,
  Clock,
  Crown,
  Info,
  ScrollText,
  Shuffle,
  Ticket,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import DailyNumbersSection from "../Components/DailyNumbersSection";
import LotteryVideoPlayer from "../Components/LotteryVideoPlayer";
import NumberSoldNotification from "../Components/NumberSoldNotification";
import QuickVerifyTicket from "../Components/QuickVerifyTicket";
import {
  selectAvailableDailyNumbers,
  selectSampleLuckyNumbers,
  verifyNumberForBet,
} from "../reducer/slice/dailyNumberSlice";

import {
  clearDepositState,
  createDeposit,
  selectDepositError,
  selectDepositLoading,
  selectDepositOrderId,
  selectDepositPaymentUrl,
} from "../reducer/slice/depositSlice";

import {
  clearLotteryConfigError,
  clearLotteryConfigSuccess,
  getActiveLotteryConfig,
  getActiveLotteryConfigs,
  getAllLotteryConfigs,
  selectActiveLotteryConfig,
  selectActiveLotteryConfigs,
  selectLotteryConfigs,
} from "../reducer/slice/lotteryConfigSlice";

import {
  getActiveLotteryConfig as getActiveFestivalConfig,
  getAllLotteryConfigs as getAllFestivalConfigs,
  selectActiveLottery as selectActiveFestivalLottery,
  selectLotteryConfigs as selectFestivalConfigs,
} from "../reducer/slice/festivalLotteryReducer";

import {
  formatDrawDate,
  formatDrawTime,
  formatINR,
  getFestivalWinningRules,
  getISTDateString,
} from "../utils/lotteryPrizeRules";

import { getAmount } from "../reducer/slice/amountReducer";
import { fetchAllSettings } from "../reducer/slice/settingsSlice";

import {
  getMyKyc,
  selectKycDocuments,
  selectKycLoading,
} from "../reducer/slice/kycReducer";

import banner from "../assets/dear-1.jpg";

// =====================================================
// CONSTANTS
// =====================================================

const BUY_TICKET_VIDEO_URL =
  "https://player.mediadelivery.net/play/781705/fd1d45cd-5bf7-4264-93fb-c3c38beea85c";

const MAX_TICKETS = 100;
const MIN_TICKETS = 10;
const TICKET_STEP = 10;
const INITIAL_VISIBLE_TICKETS = 10;
const QUICK_OPTIONS = [10, 20, 30, 50, 100];
const PRICE_SET_SIZE = 10;
const DEFAULT_SET_PRICE = 250;
const DEFAULT_TICKET_PRICE = 25;

const ALL_DATES_COUNT = 30;

const BOTTOM_NAV_HEIGHT = 72;
const PURCHASE_BAR_HEIGHT = 84;

// ✅ Betting closes 1 hour before draw time
const BET_CLOSE_OFFSET_MS = 60 * 60 * 1000;

// Ticket format:
// 2 digits + 1 alphabet + 5 digits
// Example: 12B12345
const SLOT_PATTERN = ["D", "D", "L", "D", "D", "D", "D", "D"];

const TICKET_LENGTH = SLOT_PATTERN.length;

const TICKET_EXAMPLE = "12B12345";
const HERO_TICKET_NUMBER = "47B39120";

// ✅ Admin ki API image (imageUrl) premium card ke hero banner me dikhani hai ya nahi.
// false karoge to purana TicketMock layout dikhega.
const USE_API_IMAGE = true;

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

const RULES = [];

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
    return Number(raw.amount ?? raw.price ?? raw.ticketPrice ?? raw.value ?? 0);
  }

  return Number(raw);
};

// =====================================================
// FORMAT MONEY
// =====================================================

const formatPrize = (amount) => formatINR(amount);

// Existing UI compatibility.
const formatCrore = (amount) => formatPrize(amount);

// =====================================================
// CALCULATE WINNING RULES
// =====================================================

const getWinningRules = (prizes) =>
  getFestivalWinningRules(
    typeof prizes === "object" && prizes !== null ? prizes : { first: prizes },
    TICKET_EXAMPLE,
    RULE_TICKETS,
  );

// =====================================================
// TIME FORMAT
// =====================================================

const format12h = (time) => {
  const [h, m] = String(time || "")
    .split(":")
    .map(Number);

  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    return "--:--";
  }

  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
};

// =====================================================
// TICKET SLOT HELPERS
// =====================================================

const slotAccepts = (index, ch) =>
  SLOT_PATTERN[index] === "D" ? /^\d$/.test(ch) : /^[A-Z]$/.test(ch);

const slotPlaceholder = (index) => (SLOT_PATTERN[index] === "D" ? "0" : "A");

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
      ? String(Math.floor(Math.random() * 10))
      : String.fromCharCode(65 + Math.floor(Math.random() * 26)),
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

// =====================================================
// CREATE TICKET
// =====================================================

const makeTicket = (code = "") => ({
  id: `${Date.now()}-${Math.random()}`,
  code,
});

const generateUniqueTickets = (count, existing = []) => {
  const used = new Set(existing.map((t) => t.code).filter(Boolean));
  const newTickets = [];
  while (newTickets.length < count) {
    const code = randomUniqueCode(used);
    used.add(code);
    newTickets.push(makeTicket(code));
  }
  return newTickets;
};

// =====================================================
// DRAW TIMESTAMP (returns BET CLOSING TIME, 1 hour before draw)
// =====================================================

const getDrawTimestamp = (lotteryConfig) => {
  if (!lotteryConfig?.drawDate || !lotteryConfig?.drawTime) {
    return null;
  }

  const drawDate = new Date(lotteryConfig.drawDate);

  if (Number.isNaN(drawDate.getTime())) {
    return null;
  }

  const [hoursString, minutesString] = String(lotteryConfig.drawTime).split(
    ":",
  );

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

  // drawDate is stored as IST midnight (previous day 18:30 UTC), so read the
  // calendar day in Asia/Kolkata (UTC accessors would give the previous day).
  const [istYear, istMonth, istDay] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(drawDate)
    .split("-")
    .map(Number);

  // Draw time (IST) in UTC ms
  const drawTimeUtcMs = Date.UTC(
    istYear,
    istMonth - 1,
    istDay,
    hours - 5,
    minutes - 30,
    0,
    0,
  );

  // ✅ Bet closes 1 hour before draw time
  return drawTimeUtcMs - BET_CLOSE_OFFSET_MS;
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
// KYC STATUS
// =====================================================

const deriveKycStatus = (documents) => {
  if (!Array.isArray(documents) || documents.length === 0) {
    return "not_submitted";
  }

  const statuses = documents.map((document) =>
    String(document?.status || "").toLowerCase(),
  );

  if (statuses.includes("approved") || statuses.includes("verified")) {
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

  const { user } = useSelector((state) => state.auth || {});

  // ===================================================
  // LOTTERY CONFIG
  // ===================================================

  const { activeConfig, activeLoading, error } = useSelector(
    (state) =>
      state.lotteryConfig || {
        configs: [],
        activeConfig: null,
        activeLoading: false,
        error: null,
      },
  );

  const allDailyConfigs = useSelector(selectLotteryConfigs);
  const activeDailyConfig = useSelector(selectActiveLotteryConfig);
  const activeDailyConfigsList = useSelector(selectActiveLotteryConfigs);

  const allFestivalConfigs = useSelector(selectFestivalConfigs);
  const activeFestivalConfig = useSelector(selectActiveFestivalLottery);
  const availableDailyNumbers = useSelector(selectAvailableDailyNumbers);
  const sampleLuckyNumbers = useSelector(selectSampleLuckyNumbers);

  // ===================================================
  // TICKET PRICE
  // ===================================================

  const { amount: ticketPriceFromApi } = useSelector(
    (state) =>
      state.amount || {
        amount: null,
        loading: false,
      },
  );

  const dailyPriceFromSettings = useSelector(
    (state) => state.settings?.dailyLotteryAmount,
  );

  const rawApiAmount = dailyPriceFromSettings ?? ticketPriceFromApi;

  const apiPrice = readPrice(rawApiAmount);

  const hasApiPrice = Number.isFinite(apiPrice) && apiPrice > 0;

  // Admin se 10 tickets ka price aata hai (e.g. ₹250 for 10 tickets -> ₹25/ticket)
  const SET_PRICE = hasApiPrice ? apiPrice : DEFAULT_SET_PRICE;

  const TICKET_PRICE = Math.round((SET_PRICE / PRICE_SET_SIZE) * 100) / 100;

  // ===================================================
  // DEPOSIT
  // ===================================================

  const depositLoading = useSelector(selectDepositLoading);

  const depositError = useSelector(selectDepositError);

  const depositPaymentUrl = useSelector(selectDepositPaymentUrl);

  const depositOrderId = useSelector(selectDepositOrderId);

  // ===================================================
  // KYC
  // ===================================================

  const kycDocuments = useSelector(selectKycDocuments);

  const kycLoading = useSelector(selectKycLoading);

  // ===================================================
  // STATE
  // ===================================================

  const [searchParams] = useSearchParams();
  const [showQuick, setShowQuick] = useState(true);
  const [quantity, setQuantity] = useState(10);
  const [ticketCodes, setTicketCodes] = useState(() => {
    const urlNum = new URLSearchParams(window.location.search).get("number");
    if (urlNum && TICKET_REGEX.test(urlNum.toUpperCase())) {
      return [urlNum.toUpperCase()];
    }
    return [""];
  });

  // Sync if query param changes
  useEffect(() => {
    const numParam = searchParams.get("number");
    if (numParam && TICKET_REGEX.test(numParam.toUpperCase())) {
      setTicketCodes((prev) => {
        const next = [...prev];
        next[0] = numParam.toUpperCase();
        return next;
      });
    }
  }, [searchParams]);

  const [localError, setLocalError] = useState("");

  const [localSuccess, setLocalSuccess] = useState("");

  // ✅ Numbers jo backend ne "sold" bataye (dobara random/purchase nahi honge)
  const [soldNumbers, setSoldNumbers] = useState([]);

  // ✅ Purchase se pehle availability check chal raha hai (double click guard)
  const [isChecking, setIsChecking] = useState(false);

  const [selectedDate, setSelectedDate] = useState(0);

  const [showAllDates, setShowAllDates] = useState(false);

  // ===================================================
  // DATE CHIPS & MARKET RESOLUTION
  // Daily Lottery market is ONLY valid if an active market exists
  // for that exact draw date in Asia/Kolkata timezone.
  // ===================================================

  const dateChips = useMemo(() => {
    const activeMarketMap = new Map();
    const candidates = [
      ...(Array.isArray(activeDailyConfigsList) ? activeDailyConfigsList : []),
      ...(activeDailyConfig && activeDailyConfig._id
        ? [activeDailyConfig]
        : []),
      ...(activeConfig && activeConfig._id ? [activeConfig] : []),
      ...(Array.isArray(allDailyConfigs)
        ? allDailyConfigs.filter((c) => c?.isActive)
        : []),
    ];

    candidates.forEach((cfg) => {
      if (!cfg || !cfg.drawDate) return;
      const istStr = getISTDateString(cfg.drawDate);
      if (istStr && !activeMarketMap.has(istStr)) {
        activeMarketMap.set(istStr, cfg);
      }
    });

    return Array.from({ length: ALL_DATES_COUNT }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateString = getISTDateString(d);
      const matchedMarket = activeMarketMap.get(dateString) || null;

      return {
        index: i,
        day: d.getDate(),
        month: d.toLocaleString("en-US", { month: "short" }),
        weekday: d.toLocaleString("en-US", { weekday: "short" }).toUpperCase(),
        dateString,
        hasMarket: Boolean(matchedMarket && matchedMarket.isActive),
        market: matchedMarket,
      };
    });
  }, [
    activeDailyConfigsList,
    activeDailyConfig,
    activeConfig,
    allDailyConfigs,
  ]);

  const selectedChip = dateChips[selectedDate] || dateChips[0];
  const selectedDailyMarket = selectedChip?.market || null;

  // Auto-select first active market date if today has no market and user has not picked a date yet
  useEffect(() => {
    if (
      dateChips.length > 0 &&
      selectedDate === 0 &&
      !dateChips[0]?.hasMarket
    ) {
      const firstActiveIndex = dateChips.findIndex((c) => c.hasMarket);
      if (firstActiveIndex !== -1) {
        setSelectedDate(firstActiveIndex);
      }
    }
  }, [dateChips, selectedDate]);

  const lotteryConfig = selectedDailyMarket;

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
  // KYC STATUS
  // ===================================================

  const kycStatus = useMemo(
    () => deriveKycStatus(kycDocuments),
    [kycDocuments],
  );

  const isKycApproved = kycStatus === "approved";

  // ===================================================
  // FESTIVAL VS DAILY MODE RESOLUTION
  // BuyTicket.jsx defaults to DAILY LOTTERY.
  // It only enters festival mode when explicit festival params are passed.
  // ===================================================
  const isFestivalMode = useMemo(() => {
    const type = String(searchParams.get("type") || "").toLowerCase();
    if (type === "festival") return true;
    if (type === "daily") return false;
    if (searchParams.get("festivalId") || searchParams.get("festival")) {
      return true;
    }
    return false;
  }, [searchParams]);

  const selectedFestivalLottery = useMemo(() => {
    if (!isFestivalMode) return null;

    const list = Array.isArray(allFestivalConfigs) ? allFestivalConfigs : [];
    const fid = searchParams.get("festivalId") || searchParams.get("id");
    const fname =
      searchParams.get("festival") ||
      searchParams.get("market") ||
      searchParams.get("marketName");

    if (fid) {
      const match = list.find((c) => String(c?._id) === String(fid));
      if (match) return match;
    }
    if (fname) {
      const cleanTarget = String(fname)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const match = list.find(
        (c) =>
          String(c?.marketName || "")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "") === cleanTarget,
      );
      if (match) return match;
    }

    if (activeFestivalConfig && activeFestivalConfig._id) {
      return activeFestivalConfig;
    }
    return list.find((c) => c?.isActive) || list[0] || null;
  }, [isFestivalMode, allFestivalConfigs, activeFestivalConfig, searchParams]);

  const displayLottery = isFestivalMode
    ? selectedFestivalLottery || activeFestivalConfig
    : lotteryConfig;

  const currentLotteryType = isFestivalMode ? "festival" : "daily";

  // Prizes from selected lottery
  const lotteryPrizes = displayLottery?.prizes || {};

  // Exactly 5 dynamic winning rules directly mapped to API prizes
  const winningRules = useMemo(
    () => getFestivalWinningRules(lotteryPrizes, TICKET_EXAMPLE, RULE_TICKETS),
    [lotteryPrizes],
  );

  const firstPrizeAmount = formatINR(lotteryPrizes?.first);

  const firstPrizePerTicket = formatINR(
    RULE_TICKETS > 0
      ? Math.round((Number(lotteryPrizes?.first) || 0) / RULE_TICKETS)
      : lotteryPrizes?.first,
  );

  // Hero banner pe prize tabhi dikhega jab admin se valid prize aaye
  const hasFirstPrize = Number(lotteryPrizes?.first) > 0;

  // Prize text lamba ho to font chhota (banner ke box me fit karne ke liye)
  const bannerPrizeLen = String(firstPrizeAmount || "").length;
  const bannerPrizeFontSize =
    bannerPrizeLen <= 8 ? "4.4cqw" : bannerPrizeLen <= 11 ? "3.6cqw" : "2.8cqw";

  // ===================================================
  // INITIAL API CALLS
  // ===================================================

  useEffect(() => {
    dispatch(getActiveLotteryConfig());
    dispatch(getActiveLotteryConfigs());
    dispatch(getAllLotteryConfigs());
    dispatch(getActiveFestivalConfig());
    dispatch(getAllFestivalConfigs());
    dispatch(getAmount());
    dispatch(fetchAllSettings());
    dispatch(clearDepositState());
    dispatch(getMyKyc());
  }, [dispatch]);

  // ===================================================
  // LIVE COUNTDOWN (counts down to BET CLOSING TIME)
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

    if (!displayLottery?.drawDate || !displayLottery?.drawTime) {
      setCountdown(empty);
      return;
    }

    const drawTimestamp = getDrawTimestamp(displayLottery);

    if (!drawTimestamp) {
      setCountdown(empty);
      return;
    }

    const update = () => {
      setCountdown(getCountdown(drawTimestamp));
    };

    update();

    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [displayLottery?.drawDate, displayLottery?.drawTime]);

  // ===================================================
  // DRAW DATE
  // ===================================================

  const drawDateText = useMemo(() => {
    if (displayLottery?.drawDate) {
      return formatDrawDate(displayLottery.drawDate);
    }
    if (selectedChip?.dateString) {
      return formatDrawDate(selectedChip.dateString);
    }
    return "Draw date soon";
  }, [displayLottery?.drawDate, selectedChip?.dateString]);

  const drawTimeText = useMemo(() => {
    if (displayLottery?.drawTime) {
      return formatDrawTime(displayLottery.drawTime);
    }
    return "--:--";
  }, [displayLottery?.drawTime]);

  // ===================================================
  // TICKET CALCULATIONS
  // ===================================================

  const totalTickets = quantity;
  const totalTicketPrice =
    Math.round(((SET_PRICE * quantity) / PRICE_SET_SIZE) * 100) / 100;

  const priceText = `₹${TICKET_PRICE}/-`;

  // ✅ Bet is closed once countdown expires
  const isBetClosed = countdown.available && countdown.expired;

  // Status for each individual ticket input
  const ticketStatuses = useMemo(() => {
    const counts = {};
    ticketCodes.forEach((c) => {
      const trimmed = String(c || "")
        .trim()
        .toUpperCase();
      if (trimmed.length === TICKET_LENGTH) {
        counts[trimmed] = (counts[trimmed] || 0) + 1;
      }
    });

    return ticketCodes.map((c) => {
      const trimmed = String(c || "")
        .trim()
        .toUpperCase();
      const isValid = TICKET_REGEX.test(trimmed);
      const isSold = soldNumbers.includes(trimmed);
      const isDuplicate = isValid && counts[trimmed] > 1;
      return {
        isValid,
        isSold,
        isDuplicate,
        code: trimmed,
        length: trimmed.length,
      };
    });
  }, [ticketCodes, soldNumbers]);

  const allTicketsValid = useMemo(() => {
    const expectedCount = Math.max(1, Math.floor(quantity / 10));
    if (ticketCodes.length !== expectedCount) return false;
    const normalized = ticketCodes.map((c) =>
      String(c || "")
        .trim()
        .toUpperCase(),
    );
    if (!normalized.every((c) => TICKET_REGEX.test(c))) return false;
    if (new Set(normalized).size !== normalized.length) return false;
    if (normalized.some((c) => soldNumbers.includes(c))) return false;
    return true;
  }, [ticketCodes, quantity, soldNumbers]);

  const isTicketValid = allTicketsValid;
  const hasKnownSold = ticketStatuses.some((s) => s.isSold);

  const countdownText = !countdown.available
    ? "Timer not available"
    : countdown.expired
      ? "Betting Closed"
      : `${countdown.days > 0 ? `${countdown.days}d ` : ""}${pad(
          countdown.hours,
        )}:${pad(countdown.minutes)}:${pad(countdown.seconds)}`;

  // ===================================================
  // MESSAGE CLEAR
  // ===================================================

  const clearMessages = () => {
    setLocalError("");
    setLocalSuccess("");

    dispatch(clearLotteryConfigError());

    dispatch(clearLotteryConfigSuccess());

    dispatch(clearDepositState());
  };

  // ===================================================
  // QUANTITY & TICKET INPUT HELPERS
  // ===================================================

  const updateQuantity = (newQty) => {
    const clamped = Math.max(MIN_TICKETS, Math.min(MAX_TICKETS, newQty));
    setQuantity(clamped);
    const targetCount = Math.max(1, Math.floor(clamped / 10));
    setTicketCodes((prev) => {
      const next = [...prev];
      if (next.length < targetCount) {
        while (next.length < targetCount) next.push("");
      } else if (next.length > targetCount) {
        next.length = targetCount;
      }
      return next;
    });
  };

  // ===================================================
  // INPUT HELPERS
  // ===================================================

  const focusBox = (tIndex, slotIndex) => {
    const element = inputRefs.current[`${tIndex}_${slotIndex}`];

    if (element) {
      element.focus();

      if (element.select) {
        element.select();
      }
    }
  };

  // ===================================================
  // INPUT CHANGE (PER TICKET INPUT)
  // ===================================================

  const handleBoxChange = (tIndex, slotIndex, event) => {
    if (depositLoading || isChecking || isBetClosed) return;

    const raw = event.target.value;

    if (raw === "") {
      setTicketCodes((prev) => {
        const next = [...prev];
        const cur = next[tIndex] || "";
        next[tIndex] = cur.slice(0, slotIndex);
        return next;
      });
      setLocalError("");
      setLocalSuccess("");
      return;
    }

    const ch = raw
      .toUpperCase()
      .replace(/[^0-9A-Z]/g, "")
      .slice(-1);

    if (!ch) return;

    const cur = ticketCodes[tIndex] || "";
    const pos = Math.min(slotIndex, cur.length);

    if (!slotAccepts(pos, ch)) {
      return;
    }

    const next = (cur.slice(0, pos) + ch + cur.slice(pos + 1)).slice(
      0,
      TICKET_LENGTH,
    );

    setTicketCodes((prev) => {
      const nextCodes = [...prev];
      nextCodes[tIndex] = next;
      return nextCodes;
    });
    setLocalError("");
    setLocalSuccess("");

    if (pos < TICKET_LENGTH - 1) {
      focusBox(tIndex, pos + 1);
    }
  };

  // ===================================================
  // INPUT KEYDOWN (PER TICKET INPUT)
  // ===================================================

  const handleBoxKeyDown = (tIndex, slotIndex, event) => {
    const cur = ticketCodes[tIndex] || "";

    if (event.key === "Backspace" && !cur[slotIndex]) {
      event.preventDefault();

      if (slotIndex > 0) {
        setTicketCodes((prev) => {
          const next = [...prev];
          const c = next[tIndex] || "";
          next[tIndex] = c.slice(0, slotIndex - 1);
          return next;
        });
        focusBox(tIndex, slotIndex - 1);
      }

      return;
    }

    if (event.key === "ArrowLeft" && slotIndex > 0) {
      event.preventDefault();
      focusBox(tIndex, slotIndex - 1);
    }

    if (event.key === "ArrowRight" && slotIndex < TICKET_LENGTH - 1) {
      event.preventDefault();
      focusBox(tIndex, slotIndex + 1);
    }
  };

  // ===================================================
  // PASTE (PER TICKET INPUT)
  // ===================================================

  const handleBoxPaste = (tIndex, event) => {
    event.preventDefault();

    if (depositLoading || isChecking || isBetClosed) return;

    const code = sanitizeCode(event.clipboardData.getData("text"));

    if (!code) return;

    setTicketCodes((prev) => {
      const next = [...prev];
      next[tIndex] = code.slice(0, TICKET_LENGTH);
      return next;
    });
    focusBox(tIndex, Math.min(code.length, TICKET_LENGTH - 1));
  };

  // ===================================================
  // RANDOM TICKET (SINGLE & ALL)
  // ===================================================

  const handleRandomSingleTicket = async (tIndex) => {
    if (depositLoading || isChecking || isBetClosed) return;
    setLocalError("");
    setLocalSuccess("");

    const usedCodes = ticketCodes
      .filter((_, idx) => idx !== tIndex)
      .concat(soldNumbers)
      .filter(Boolean);

    if (selectedFestivalLottery) {
      for (let i = 0; i < 20; i++) {
        const candidate = randomUniqueCode(usedCodes);
        try {
          const check = await verifyNumberForBet(candidate);
          if (check?.canBet) {
            setTicketCodes((prev) => {
              const next = [...prev];
              next[tIndex] = candidate;
              return next;
            });
            return;
          }
          usedCodes.push(candidate);
          setSoldNumbers((prev) =>
            prev.includes(candidate) ? prev : [...prev, candidate],
          );
        } catch {
          setTicketCodes((prev) => {
            const next = [...prev];
            next[tIndex] = candidate;
            return next;
          });
          return;
        }
      }
      setTicketCodes((prev) => {
        const next = [...prev];
        next[tIndex] = randomUniqueCode(usedCodes);
        return next;
      });
      return;
    }

    // Daily Lottery: Pick from pool if available
    const pool =
      availableDailyNumbers && availableDailyNumbers.length > 0
        ? availableDailyNumbers
        : sampleLuckyNumbers && sampleLuckyNumbers.length > 0
          ? sampleLuckyNumbers
          : [];

    const availableCandidates = pool
      .map((item) => (typeof item === "string" ? item : item?.number))
      .filter((c) => c && TICKET_REGEX.test(c) && !usedCodes.includes(c));

    if (availableCandidates.length > 0) {
      const picked =
        availableCandidates[
          Math.floor(Math.random() * availableCandidates.length)
        ];
      setTicketCodes((prev) => {
        const next = [...prev];
        next[tIndex] = picked;
        return next;
      });
      return;
    }

    for (let i = 0; i < 20; i++) {
      const candidate = randomUniqueCode(usedCodes);
      try {
        const check = await verifyNumberForBet(candidate);
        if (check?.canBet) {
          setTicketCodes((prev) => {
            const next = [...prev];
            next[tIndex] = candidate;
            return next;
          });
          return;
        }
        usedCodes.push(candidate);
        setSoldNumbers((prev) =>
          prev.includes(candidate) ? prev : [...prev, candidate],
        );
      } catch {
        setTicketCodes((prev) => {
          const next = [...prev];
          next[tIndex] = candidate;
          return next;
        });
        return;
      }
    }

    setTicketCodes((prev) => {
      const next = [...prev];
      next[tIndex] = randomUniqueCode(usedCodes);
      return next;
    });
  };

  const handleRandomAllTickets = async () => {
    if (depositLoading || isChecking || isBetClosed) return;
    setLocalError("");
    setLocalSuccess("");

    const usedCodes = [...soldNumbers].filter(Boolean);
    const newCodes = [];

    for (let t = 0; t < ticketCodes.length; t++) {
      let picked = "";
      for (let i = 0; i < 15; i++) {
        const candidate = randomUniqueCode([...newCodes, ...usedCodes]);
        try {
          const check = await verifyNumberForBet(candidate);
          if (check?.canBet) {
            picked = candidate;
            break;
          }
          usedCodes.push(candidate);
          setSoldNumbers((prev) =>
            prev.includes(candidate) ? prev : [...prev, candidate],
          );
        } catch {
          picked = candidate;
          break;
        }
      }
      if (!picked) {
        picked = randomUniqueCode([...newCodes, ...usedCodes]);
      }
      newCodes.push(picked);
      usedCodes.push(picked);
    }

    setTicketCodes(newCodes);
  };

  // ===================================================
  // CLEAR TICKET (SINGLE & ALL)
  // ===================================================

  const handleClearSingleTicket = (tIndex) => {
    if (depositLoading || isChecking || isBetClosed) return;
    setTicketCodes((prev) => {
      const next = [...prev];
      next[tIndex] = "";
      return next;
    });
    focusBox(tIndex, 0);
    setLocalError("");
    setLocalSuccess("");
  };

  const handleClearAllTickets = () => {
    if (depositLoading || isChecking || isBetClosed) return;
    setTicketCodes((prev) => prev.map(() => ""));
    focusBox(0, 0);
    setLocalError("");
    setLocalSuccess("");
  };

  // Backward compatibility alias
  const handleClearTicket = () => handleClearSingleTicket(0);
  const handleRandomTicket = () => handleRandomSingleTicket(0);

  // ===================================================
  // QUANTITY STEPPERS & QUICK SELECTION
  // ===================================================

  const handleIncrease = () => {
    if (depositLoading || isChecking || isBetClosed) return;
    const nextQty = Math.min(
      MAX_TICKETS,
      (Math.floor(quantity / TICKET_STEP) + 1) * TICKET_STEP,
    );
    updateQuantity(nextQty);
    setLocalError("");
    setLocalSuccess("");
  };

  const handleDecrease = () => {
    if (depositLoading || isChecking || isBetClosed) return;
    const nextQty = Math.max(
      MIN_TICKETS,
      (Math.ceil(quantity / TICKET_STEP) - 1) * TICKET_STEP,
    );
    updateQuantity(nextQty);
    setLocalError("");
    setLocalSuccess("");
  };

  const handleQuickSelect = (count) => {
    if (depositLoading || isChecking || isBetClosed) return;
    updateQuantity(count);
    setLocalError("");
    setLocalSuccess("");
  };

  // ===================================================
  // PURCHASE
  // ===================================================

  const handlePurchase = async () => {
    if (depositLoading || isChecking) return;

    try {
      setLocalError("");
      setLocalSuccess("");

      dispatch(clearDepositState());

      dispatch(clearLotteryConfigError());

      dispatch(clearLotteryConfigSuccess());

      // -------------------------------------------------
      // LOGIN
      // -------------------------------------------------

      if (!user) {
        return setLocalError("Please login first");
      }

      if (quantity < MIN_TICKETS) {
        return setLocalError(`Minimum ${MIN_TICKETS} tickets are required`);
      }

      // -------------------------------------------------
      // LOTTERY CONFIG
      // -------------------------------------------------

      const activePurchaseConfig = displayLottery;

      if (!activePurchaseConfig?._id) {
        return setLocalError(
          !isFestivalMode
            ? `Daily lottery market for ${selectedChip?.day} ${selectedChip?.month} has not been created yet.`
            : "Active lottery configuration not found",
        );
      }

      if (!activePurchaseConfig?.isActive) {
        return setLocalError("Lottery is not active right now");
      }

      if (!isFestivalMode && (!selectedChip || !selectedChip.hasMarket)) {
        return setLocalError(
          `Daily lottery market for ${selectedChip?.day} ${selectedChip?.month} is not active or available.`,
        );
      }

      // -------------------------------------------------
      // ✅ BET CLOSE CHECK (1 hour before draw)
      // -------------------------------------------------

      if (countdown.available && countdown.expired) {
        return setLocalError(
          "Betting is closed for this draw. Betting closes 1 hour before draw time.",
        );
      }

      // -------------------------------------------------
      // TICKET PRICE
      // -------------------------------------------------

      const setPriceAmount = SET_PRICE;

      if (!Number.isFinite(setPriceAmount) || setPriceAmount <= 0) {
        return setLocalError("Ticket price is not available");
      }

      // -------------------------------------------------
      // MULTI-TICKET VALIDATION
      // Formula: Required inputs = quantity / 10
      // -------------------------------------------------

      const expectedInputs = Math.max(1, Math.floor(quantity / 10));

      if (ticketCodes.length !== expectedInputs) {
        return setLocalError(
          `Please provide ticket numbers for all ${expectedInputs} tickets.`,
        );
      }

      for (let i = 0; i < ticketCodes.length; i++) {
        const code = String(ticketCodes[i] || "")
          .trim()
          .toUpperCase();

        if (!code || !TICKET_REGEX.test(code)) {
          return setLocalError(
            `Ticket Number ${i + 1}: Please enter a valid 8-character ticket number (e.g. ${TICKET_EXAMPLE})`,
          );
        }

        if (soldNumbers.includes(code)) {
          return setLocalError(
            `Ticket Number ${i + 1} (${code}) has already been sold. Please choose another number.`,
          );
        }
      }

      // Check duplicates among entered tickets
      const normalizedCodes = ticketCodes.map((c) =>
        String(c || "")
          .trim()
          .toUpperCase(),
      );
      const uniqueCodes = new Set(normalizedCodes);

      if (uniqueCodes.size !== normalizedCodes.length) {
        return setLocalError(
          "Duplicate ticket numbers are not allowed. Each ticket must have a unique number.",
        );
      }

      // -------------------------------------------------
      // CHECK AVAILABILITY FOR ALL NUMBERS
      // -------------------------------------------------

      setIsChecking(true);
      setLocalSuccess("Checking ticket availability...");

      for (let i = 0; i < normalizedCodes.length; i++) {
        const code = normalizedCodes[i];
        const availabilityCheck = await verifyNumberForBet(code);

        if (!availabilityCheck?.canBet) {
          setSoldNumbers((prev) =>
            prev.includes(code) ? prev : [...prev, code],
          );
          setLocalSuccess("");
          setIsChecking(false);
          return setLocalError(
            availabilityCheck?.message ||
              `Ticket Number ${i + 1} (${code}) has already been sold. Please choose another number.`,
          );
        }
      }

      // -------------------------------------------------
      // LOTTERY NUMBERS — ALL VALIDATED TICKETS
      // -------------------------------------------------

      const lotteryNumbers = normalizedCodes;
      const totalAmount = totalTicketPrice;

      setLocalSuccess(`Creating payment order for ${quantity} ticket(s)...`);

      // -------------------------------------------------
      // CREATE DEPOSIT
      // -------------------------------------------------

      const result = await dispatch(
        createDeposit({
          paymentMethod: "INR",
          channel: "qwackpay",
          amount: totalAmount,
          configId: activePurchaseConfig._id,
          lotteryNumbers,
          quantity,
          lotteryType: currentLotteryType,
          drawDate: !isFestivalMode ? selectedChip?.dateString : undefined,
        }),
      ).unwrap();

      const paymentUrl = result?.paymentUrl || depositPaymentUrl || "";

      const orderId = result?.orderId || depositOrderId || "";

      if (!paymentUrl) {
        setLocalSuccess("");

        return setLocalError(
          result?.message || "Payment URL not received. Please try again.",
        );
      }

      setLocalError("");

      setLocalSuccess(
        `Order ${orderId} created. Redirecting to payment page...`,
      );

      setTimeout(() => {
        window.location.href = paymentUrl;
      }, 600);

      setTicketCodes((prev) => prev.map(() => randomCode()));
    } catch (purchaseError) {
      console.error("LOTTERY PURCHASE ERROR:", purchaseError);

      setLocalSuccess("");

      setLocalError(
        typeof purchaseError === "string"
          ? purchaseError
          : purchaseError?.message ||
              purchaseError?.payload?.message ||
              purchaseError?.payload ||
              "Could not buy tickets",
      );
    } finally {
      setIsChecking(false);
    }
  };

  // ===================================================
  // DISPLAY STATES
  // ===================================================

  const displayError = localError || depositError || error;

  const isPurchaseDisabled =
    activeLoading ||
    depositLoading ||
    isChecking ||
    !displayLottery?._id ||
    !displayLottery?.isActive ||
    !hasApiPrice ||
    !allTicketsValid ||
    quantity < MIN_TICKETS ||
    isBetClosed ||
    (!isFestivalMode && (!selectedChip || !selectedChip.hasMarket));

  const visibleDateChips = showAllDates ? dateChips : dateChips.slice(0, 7);

  // ===================================================
  // UI
  // ===================================================

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden bg-[#eef3fa] text-[#173e70]"
      style={{
        paddingBottom: BOTTOM_NAV_HEIGHT + PURCHASE_BAR_HEIGHT + 24,
      }}
    >
      {/* Real-time Number Sold Notification */}
      <NumberSoldNotification />

      {/* =================================================
          HERO (BANNER IMAGE + DYNAMIC FIRST PRIZE)
      ================================================= */}

      <section className="relative overflow-hidden bg-[#3b0a14]">
        <div
          className="relative w-full"
          style={{ containerType: "inline-size" }}
        >
          <img
            src={banner}
            alt="Daily Lottery"
            loading="lazy"
            className="block h-auto w-full select-none"
            draggable={false}
          />

          {/* Admin se aane wala First Prize — banner ke empty box me */}
          {hasFirstPrize && (
            <div
              className="pointer-events-none absolute flex items-center justify-center"
              style={{
                left: "74.3%",
                top: "55.8%",
                width: "24%",
                transform: "translate(-50%, -50%) rotate(-10deg)",
              }}
            >
              <span
                className="block whitespace-nowrap text-center font-black uppercase leading-none text-[#153c78]"
                style={{
                  fontSize: bannerPrizeFontSize,
                  textShadow: "0 1px 0 rgba(255,255,255,0.6)",
                }}
              >
                {firstPrizeAmount}
              </span>
            </div>
          )}
        </div>
      </section>

      <main className="relative mt-3 space-y-3 px-2">
        {/* =================================================
            BETTING CLOSED BANNER
        ================================================= */}

        {isBetClosed && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <p className="font-bold">Betting Closed</p>

            <p className="mt-0.5 text-xs">
              Betting for this draw closed 1 hour before the draw time. Please
              wait for the next draw.
            </p>
          </div>
        )}

        {/* =================================================
            NO ACTIVE MARKET BANNER
        ================================================= */}

        {!isFestivalMode && (!selectedChip || !selectedChip.hasMarket) && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            <p className="font-bold">No Active Market for Selected Date</p>

            <p className="mt-0.5 text-xs">
              Daily Lottery market for {selectedChip?.day} {selectedChip?.month}{" "}
              has not been created or activated yet. Markets are created daily
              on scheduled draw dates. Please select an active draw date to
              purchase tickets.
            </p>
          </div>
        )}

        {/* =================================================
            SELECT DRAW DATE
        ================================================= */}

        <Card>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <CalendarDays size={24} className="shrink-0 text-[#173e70]" />

              <h2 className="truncate text-[16px] font-extrabold text-[#173e70]">
                Select Draw Date
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setShowAllDates((value) => !value)}
              className="flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-[#c9d3e3] bg-white px-2.5 text-[10px] font-semibold text-[#173e70]"
            >
              {showAllDates ? "Show Less" : "View Full Schedule"}

              <ArrowRight
                size={12}
                className={`transition-transform ${
                  showAllDates ? "rotate-90" : ""
                }`}
              />
            </button>
          </div>

          {showAllDates ? (
            <div className="mt-3 grid grid-cols-4 gap-2 min-[400px]:grid-cols-5">
              {visibleDateChips.map((chip, index) => (
                <DateChip
                  key={index}
                  chip={chip}
                  today={index === 0}
                  active={index === selectedDate}
                  onClick={() => setSelectedDate(index)}
                  fluid
                />
              ))}
            </div>
          ) : (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {visibleDateChips.map((chip, index) => (
                <DateChip
                  key={index}
                  chip={chip}
                  today={index === 0}
                  active={index === selectedDate}
                  onClick={() => setSelectedDate(index)}
                />
              ))}
            </div>
          )}
        </Card>

        {/* =================================================
            DAILY LOTTERY TICKET (PREMIUM)
        ================================================= */}

        <PremiumTicketCard
          imageUrl={USE_API_IMAGE ? displayLottery?.imageUrl : null}
          marketName={displayLottery?.marketName}
          firstPrizeAmount={firstPrizeAmount}
          firstPrizePerTicket={firstPrizePerTicket}
          priceText={priceText}
          drawDateText={drawDateText}
          drawTimeText={drawTimeText}
          countdownText={countdownText}
          isBetClosed={isBetClosed}
          ruleTickets={RULE_TICKETS}
          maxTickets={MAX_TICKETS}
          heroNumber={HERO_TICKET_NUMBER}
        />

        {/* =================================================
            HOW MANY TICKETS
        ================================================= */}

        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket size={26} className="-rotate-[30deg] text-[#173e70]" />
              <h2 className="text-[16px] font-extrabold text-[#173e70]">
                How Many Tickets?
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowQuick((v) => !v)}
                className="h-8 whitespace-nowrap rounded-lg border border-[#c9d3e3] bg-white px-3 text-[11px] font-semibold text-[#173e70]"
              >
                Quick Select
              </button>
              <button
                type="button"
                onClick={() => setShowQuick((v) => !v)}
                aria-label="Toggle quick select"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef3fa] text-[#173e70]"
              >
                <ChevronDown
                  size={18}
                  className={`transition ${showQuick ? "rotate-180" : ""}`}
                />
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-[auto_1fr] gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-[#dfe5f0] bg-white px-2 py-2 shadow-sm">
              <button
                type="button"
                onClick={handleDecrease}
                disabled={
                  totalTickets <= MIN_TICKETS ||
                  depositLoading ||
                  isChecking ||
                  isBetClosed
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9eef7] text-[22px] font-bold text-[#173e70] disabled:opacity-50"
              >
                −
              </button>
              <span className="min-w-[30px] text-center text-[24px] font-black text-[#173e70]">
                {totalTickets}
              </span>
              <button
                type="button"
                onClick={handleIncrease}
                disabled={
                  totalTickets >= MAX_TICKETS ||
                  depositLoading ||
                  isChecking ||
                  isBetClosed
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9eef7] text-[22px] font-bold text-[#173e70] disabled:opacity-50"
              >
                +
              </button>
            </div>

            <div className="grid min-w-0 grid-cols-[1fr_auto_1fr_auto_1.2fr] items-center gap-1 rounded-xl bg-[#f3f6fb] px-2 py-2 text-center">
              <div className="min-w-0">
                <p className="text-[9px] text-[#4b5563]">Ticket Price</p>
                <p className="text-[14px] font-black text-[#d7193f]">
                  ₹{TICKET_PRICE}/-
                </p>
              </div>
              <span className="text-[15px] text-[#9aa5b8]">×</span>
              <div className="min-w-0">
                <p className="text-[9px] text-[#4b5563]">Total Tickets</p>
                <p className="text-[14px] font-black text-[#d7193f]">
                  {quantity}
                </p>
              </div>
              <span className="text-[15px] text-[#9aa5b8]">=</span>
              <div className="min-w-0">
                <p className="text-[9px] text-[#4b5563]">Total Amount</p>
                <p className="truncate text-[14px] font-black text-[#14a06a]">
                  ₹ {totalTicketPrice.toLocaleString("en-IN")} /-
                </p>
              </div>
            </div>
          </div>

          {/* Quick Select Options */}
          {showQuick && (
            <div className="mt-3 grid grid-cols-5 gap-1.5">
              {QUICK_OPTIONS.map((count) => {
                const active = quantity === count;
                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handleQuickSelect(count)}
                    disabled={depositLoading || isChecking || isBetClosed}
                    className={`relative min-w-0 rounded-lg border px-0.5 py-2 text-center transition active:scale-95 disabled:opacity-60 ${
                      active
                        ? "border-2 border-[#ed1d43] bg-[#fff0f2]"
                        : "border-[#dfe5f0] bg-white"
                    }`}
                  >
                    <p
                      className={`whitespace-nowrap text-[9.5px] font-semibold ${
                        active ? "text-[#ed1d43]" : "text-[#26354b]"
                      }`}
                    >
                      {count} Tickets
                    </p>
                    <p
                      className={`whitespace-nowrap text-[12px] font-black ${
                        active ? "text-[#ed1d43]" : "text-[#173e70]"
                      }`}
                    >
                      ₹{" "}
                      {(
                        Math.round(
                          ((SET_PRICE * count) / PRICE_SET_SIZE) * 100,
                        ) / 100
                      ).toLocaleString("en-IN")}
                    </p>
                    {active && (
                      <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-[#ed1d43]" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* =================================================
            CHOOSE YOUR TICKET NUMBER (SINGLE INPUT FIELD)
        ================================================= */}

        <Card>
          <div className="flex items-center justify-between gap-2 border-b border-[#eef2f8] pb-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#e6c97c] bg-[#fff6df] text-[#8a4b12]">
                <Ticket size={22} className="-rotate-45" />
              </span>

              <div className="min-w-0 leading-tight">
                <h2 className="truncate text-[16px] sm:text-[17px] font-extrabold text-[#173e70]">
                  Enter Ticket Numbers ({ticketCodes.length})
                </h2>

                <p className="truncate text-[10px] text-[#4b5563]">
                  Format: {TICKET_EXAMPLE} · {ticketCodes.length}{" "}
                  {ticketCodes.length === 1 ? "input" : "inputs"} for {quantity}{" "}
                  tickets
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={handleClearAllTickets}
                disabled={
                  depositLoading ||
                  isChecking ||
                  isBetClosed ||
                  ticketCodes.every((c) => !c)
                }
                className="text-[12px] font-medium text-[#3d4468] underline underline-offset-2 disabled:opacity-40"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={handleRandomAllTickets}
                disabled={depositLoading || isChecking || isBetClosed}
                className="flex items-center gap-1 rounded-lg border border-[#c9d3e3] bg-white px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-[12px] font-bold text-[#173e70] disabled:opacity-50 active:scale-95 transition"
              >
                <Shuffle size={13} /> Random All
              </button>
            </div>
          </div>

          {/* List of independent ticket inputs */}
          <div className="mt-3 space-y-3.5">
            {ticketCodes.map((code, tIndex) => {
              const statusInfo = ticketStatuses[tIndex] || {
                isValid: false,
                isSold: false,
                isDuplicate: false,
                length: 0,
              };

              return (
                <div
                  key={tIndex}
                  className={`rounded-xl border p-2.5 sm:p-3 transition-colors ${
                    statusInfo.isDuplicate || statusInfo.isSold
                      ? "border-red-300 bg-red-50/40"
                      : statusInfo.isValid
                        ? "border-emerald-300 bg-emerald-50/30"
                        : "border-[#e2e7f0] bg-[#f9fbff]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#173e70] text-[10px] font-black text-white">
                        {tIndex + 1}
                      </span>
                      <span className="text-[12.5px] font-extrabold text-[#173e70]">
                        Ticket Number {tIndex + 1}
                      </span>
                      <span className="rounded bg-[#eef3fa] px-1.5 py-0.5 text-[9.5px] font-bold text-[#4b5563]">
                        10 Tickets
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleClearSingleTicket(tIndex)}
                        disabled={
                          !code || depositLoading || isChecking || isBetClosed
                        }
                        className="text-[11px] font-semibold text-[#6b7280] hover:text-[#ed1d43] disabled:opacity-30"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRandomSingleTicket(tIndex)}
                        disabled={depositLoading || isChecking || isBetClosed}
                        className="flex items-center gap-1 rounded-md border border-[#c9d3e3] bg-white px-2 py-1 text-[10.5px] font-bold text-[#173e70] hover:bg-[#eef3fa] active:scale-95 disabled:opacity-50"
                      >
                        <Shuffle size={11} /> Random
                      </button>
                    </div>
                  </div>

                  {/* 8 character slot boxes */}
                  <div
                    className="mt-2 grid gap-1 sm:gap-1.5"
                    style={{
                      gridTemplateColumns: `repeat(${TICKET_LENGTH}, minmax(0, 1fr))`,
                    }}
                  >
                    {SLOT_PATTERN.map((slot, sIndex) => {
                      const filled = Boolean(code[sIndex]);
                      const isLetter = slot === "L";
                      return (
                        <input
                          key={sIndex}
                          ref={(el) => {
                            inputRefs.current[`${tIndex}_${sIndex}`] = el;
                          }}
                          value={code[sIndex] || ""}
                          onChange={(e) => handleBoxChange(tIndex, sIndex, e)}
                          onKeyDown={(e) => handleBoxKeyDown(tIndex, sIndex, e)}
                          onPaste={(e) => handleBoxPaste(tIndex, e)}
                          onFocus={(e) => e.target.select()}
                          disabled={depositLoading || isChecking || isBetClosed}
                          inputMode={isLetter ? "text" : "numeric"}
                          autoCapitalize="characters"
                          autoComplete="off"
                          spellCheck={false}
                          placeholder={slotPlaceholder(sIndex)}
                          aria-label={`Ticket ${tIndex + 1} character ${sIndex + 1}`}
                          className={`h-10 sm:h-11 w-full min-w-0 rounded-lg border-2 p-0 text-center text-[16px] sm:text-[17px] font-extrabold outline-none transition placeholder:font-bold placeholder:text-[#c3c8de] focus:border-[#ed1d43] focus:shadow-[0_0_0_3px_rgba(237,29,67,0.15)] disabled:opacity-50 ${
                            filled
                              ? isLetter
                                ? "border-[#ed1d43] bg-[#fff0f2] text-[#ed1d43]"
                                : "border-[#173e70] bg-white text-[#173e70]"
                              : isLetter
                                ? "border-[#f3b6c1] bg-[#fff7f8] text-[#173e70]"
                                : "border-[#c9d3e3] bg-[#f1f3fa] text-[#173e70]"
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Status pill for this specific input */}
                  <div className="mt-2 flex items-center justify-between gap-1 text-[10.5px]">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          statusInfo.isDuplicate || statusInfo.isSold
                            ? "bg-red-500"
                            : statusInfo.isValid
                              ? "bg-emerald-500"
                              : "bg-[#f08a25]"
                        }`}
                      />
                      <span
                        className={`truncate ${
                          statusInfo.isDuplicate
                            ? "font-bold text-red-600"
                            : statusInfo.isSold
                              ? "font-bold text-red-600"
                              : statusInfo.isValid
                                ? "font-bold text-emerald-700"
                                : "text-[#4b5563]"
                        }`}
                      >
                        {statusInfo.isDuplicate
                          ? `Duplicate number: already used in another ticket`
                          : statusInfo.isSold
                            ? `Number ${code} is already sold`
                            : statusInfo.isValid
                              ? `Ready: ${code}`
                              : `Enter ${TICKET_LENGTH} chars (${statusInfo.length}/${TICKET_LENGTH})`}
                      </span>
                    </div>

                    <span className="shrink-0 font-mono text-[10px] text-[#8a92a6]">
                      {code.length}/{TICKET_LENGTH}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-[#eef2f8] pt-2.5">
            <span className="text-[11px] font-bold text-[#173e70]">
              Total Required: {ticketCodes.length} Number
              {ticketCodes.length > 1 ? "s" : ""}
            </span>
            <span className="shrink-0 rounded-full border border-[#ed1d43]/30 bg-[#fff0f2] px-2.5 py-1 text-[11px] font-extrabold text-[#ed1d43]">
              {quantity} Tickets Selected
            </span>
          </div>

          <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-[#bfe8d3] bg-[#e7f8ef] px-3 py-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#14a06a] text-white">
              <Info size={13} />
            </span>
            <p className="text-[10.5px] leading-snug text-[#26354b]">
              Purchasing <strong>{quantity} tickets</strong> (
              {ticketCodes.length} number{ticketCodes.length > 1 ? "s" : ""}, 10
              tickets per number ={" "}
              <strong>₹{totalTicketPrice.toLocaleString("en-IN")}</strong>) for
              the draw on {drawDateText}. Each ticket costs ₹{TICKET_PRICE}.
            </p>
          </div>
        </Card>

        {/* =================================================
            TODAY'S LUCKY NUMBERS SELECTOR
        ================================================= */}
        <DailyNumbersSection
          mode="buyTicket"
          selectedNumber={ticketCodes[0] || ""}
          onSelectNumber={(code) => {
            if (isBetClosed || isChecking) return;
            setTicketCodes((prev) => {
              const next = [...prev];
              const emptyIdx = next.findIndex(
                (c) => !c || c.length < TICKET_LENGTH,
              );
              if (emptyIdx !== -1) {
                next[emptyIdx] = code;
              } else {
                next[0] = code;
              }
              return next;
            });
          }}
        />

        {/* =================================================
            QUICK TICKET VERIFICATION WIDGET
        ================================================= */}
        <QuickVerifyTicket
          defaultMode="daily"
          title="Verify Daily Ticket"
          subtitle="Check if your ticket is among today's winning numbers"
        />

        {/* =================================================
            HOW TO PLAY VIDEO TUTORIAL
        ================================================= */}
        <LotteryVideoPlayer videoUrl={BUY_TICKET_VIDEO_URL} />

        {/* =================================================
            WINNING RULES
        ================================================= */}

        <section className="overflow-hidden rounded-[18px] bg-gradient-to-br from-[#3a0b17] via-[#2b0a16] to-[#1a0710] p-2.5 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex min-w-0 items-center gap-2">
              <ScrollText size={26} className="shrink-0 text-[#ffd34e]" />

              <h2 className="text-[15px] font-extrabold leading-tight text-white">
                {displayLottery?.marketName
                  ? `${displayLottery.marketName} Winning Rules`
                  : "Lottery Winning Rules"}
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
                <span className="text-[#d7193f]">12B</span>

                <span className="text-[#173e70]">12345</span>
              </span>
            </div>

            <div className="flex min-w-0 items-center gap-1.5 rounded-xl border border-[#ffd34e]/30 bg-white/5 px-2.5 py-2">
              <Banknote size={30} className="shrink-0 text-[#ffd34e]" />

              <div className="min-w-0">
                <p className="text-[10px] text-white/80">Total First Prize</p>

                <p className="whitespace-nowrap text-[20px] font-black uppercase leading-none text-[#ffd34e]">
                  {firstPrizeAmount}
                </p>

                <p className="mt-0.5 whitespace-nowrap text-[9px] text-white/75">
                  ({RULE_TICKETS} Tickets × {firstPrizePerTicket})
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
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-1.5 py-2.5 text-[10px] font-semibold leading-tight"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {winningRules.map((rule, index) => (
                  <RuleRow
                    key={rule.number || index}
                    number={rule.number || index + 1}
                    condition={rule.condition || rule.cond}
                    example={rule.example || rule.ex}
                    prize={rule.prizeText}
                    total={rule.totalText}
                    badge={rule.badge || BADGES[index]}
                    row={rule.row || ROW_TINTS[index]}
                  />
                ))}
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
                ₹{totalTicketPrice.toLocaleString("en-IN")}
                /-
              </span>

              <p className="min-w-0 truncate text-[7.5px] leading-tight text-white/70 sm:text-[8.5px]">
                {totalTickets} {totalTickets === 1 ? "Ticket" : "Tickets"} •{" "}
                {drawDateText}
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
              {isChecking
                ? "Checking..."
                : depositLoading
                  ? "Creating..."
                  : isBetClosed
                    ? "Betting Closed"
                    : !isFestivalMode &&
                        (!selectedChip || !selectedChip.hasMarket)
                      ? "No Market"
                      : "Purchase Now"}
            </span>

            {!depositLoading &&
              !isChecking &&
              !isBetClosed &&
              (isFestivalMode || (selectedChip && selectedChip.hasMarket)) && (
                <ArrowRight size={16} className="shrink-0" />
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

const Card = ({ children }) => (
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
  active: activeProp,
  onClick,
  fluid = false,
}) => {
  const hasMarket = Boolean(chip?.hasMarket);

  // ✅ Jis date ka market active nahi hai wo kabhi "active/selected" nahi dikhega
  const active = activeProp && hasMarket;

  const handleClick = () => {
    if (!hasMarket) return;
    onClick?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!hasMarket}
      aria-disabled={!hasMarket}
      className={`relative flex h-[66px] ${
        fluid ? "w-full" : "w-[64px] shrink-0"
      } flex-col items-center justify-center rounded-xl border text-center transition ${
        hasMarket ? "active:scale-95" : "cursor-not-allowed"
      } ${
        active
          ? "border-2 border-green-500 bg-[#fff0f2]"
          : hasMarket
            ? "border-transparent bg-[#e3e9f3] hover:bg-[#d9e2ef]"
            : "border-dashed border-gray-300 bg-gray-100 opacity-60"
      }`}
    >
      {/* ✅ Active Badge */}
      {active && (
        <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-2 py-0.5 text-[8px] font-bold text-white shadow-sm">
          Active
        </span>
      )}

      {today && (
        <span className="text-[10px] mt-1 font-semibold text-[#ed1d43]">
          Today
        </span>
      )}

      <span
        className={`whitespace-nowrap text-[13px] font-extrabold ${
          active
            ? "text-[#ed1d43]"
            : hasMarket
              ? "text-[#26354b]"
              : "text-gray-500"
        }`}
      >
        {chip.day} {chip.month}
      </span>

      <span
        className={`text-[10px] ${
          active
            ? "text-[#ed1d43]"
            : hasMarket
              ? "text-[#6b7280]"
              : "text-gray-400"
        }`}
      >
        {chip.weekday}
      </span>

      {hasMarket ? (
        <span
          className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${
            active ? "bg-[#ed1d43]" : "bg-[#20a66a]"
          }`}
          title="Market Active"
        />
      ) : (
        <span
          className="absolute bottom-1 h-1 w-1 rounded-full bg-gray-400"
          title="No active market for this date"
        />
      )}
    </button>
  );
};

// =====================================================
// INFO ITEM
// =====================================================

const InfoItem = ({ icon, title, sub }) => (
  <div className="flex min-w-0 flex-col items-center gap-0.5 text-center">
    <span className="shrink-0">{icon}</span>

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

const TicketMock = ({ prize, price, number, small = false }) => (
  <div
    className={`relative ${
      small ? "p-1.5" : "p-3"
    } -rotate-3 rounded-lg border-[3px] border-[#f2d1b8] bg-[#fffaf0] shadow-lg`}
    style={{
      fontSize: small ? "9px" : "10px",
    }}
  >
    <div className="absolute inset-0 -z-10 -rotate-[7deg] rounded-lg border border-[#e5c8a4] bg-[#fdf1dc]" />

    <div className="flex items-start justify-between gap-1">
      <div className="min-w-0">
        <p
          className={`font-black leading-none text-[#d7193f] ${
            small ? "text-[15px]" : "text-[25px]"
          }`}
        >
          DEAR
        </p>

        <p
          className={`font-bold text-[#153c78] ${
            small ? "text-[6px]" : "text-[8px]"
          }`}
        >
          DAILY LOTTERY
        </p>
      </div>

      <span
        className={`shrink-0 rounded-full bg-[#d7198c] text-center font-black leading-tight text-white ${
          small ? "px-1 py-0.5 text-[5px]" : "px-1.5 py-1 text-[7px]"
        }`}
      >
        Price
        <span className="block text-[1.3em]">{price}</span>
      </span>
    </div>

    <p
      className={`mt-1 font-bold text-[#26354b] ${
        small ? "text-[5px]" : "text-[6px]"
      }`}
    >
      First Prize
    </p>

    <p
      className={`whitespace-nowrap font-black uppercase leading-none text-[#153c78] ${
        small ? "text-[12px]" : "text-[20px]"
      }`}
    >
      {prize}
    </p>

    <div className="mt-1 border-y border-[#d7bba5] py-0.5 text-center">
      <p
        className={`font-bold text-[#26354b] ${
          small ? "text-[5px]" : "text-[6px]"
        }`}
      >
        Ticket Number
      </p>

      <p
        className={`whitespace-nowrap font-black tracking-[0.12em] text-[#173e70] ${
          small ? "text-[7px]" : "text-[9px]"
        }`}
      >
        {number}
      </p>
    </div>
  </div>
);

// =====================================================
// PREMIUM TICKET CARD (Festival Info style)
// Left: API image (imageUrl) / TicketMock fallback
// Right: title + tagline + First Prize | Draw Date | Draw Time
// =====================================================

const PREMIUM_CSS = `
@keyframes dl-glow {
  0%, 100% { box-shadow: 0 6px 18px rgba(240,180,41,0.28); }
  50%      { box-shadow: 0 6px 26px rgba(240,180,41,0.55); }
}
@keyframes dl-shine {
  0%   { transform: translateX(-130%) skewX(-20deg); }
  100% { transform: translateX(380%) skewX(-20deg); }
}
.dl-glow  { animation: dl-glow 2.6s ease-in-out infinite; }
.dl-shine { animation: dl-shine 3.6s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .dl-glow, .dl-shine { animation: none !important; }
}
`;

const InfoMini = ({ icon, title, sub }) => (
  <div className="flex min-w-0 flex-col items-center gap-0.5 text-center">
    <span className="shrink-0 text-[#8a4b12]">{icon}</span>
    <div className="w-full min-w-0">
      <p className="truncate text-[10.5px] font-bold leading-tight text-[#173e70]">
        {title}
      </p>
      <p className="truncate text-[8px] leading-tight text-[#4b5563]">{sub}</p>
    </div>
  </div>
);

const PremiumTicketCard = ({
  imageUrl,
  marketName,
  firstPrizeAmount,
  firstPrizePerTicket,
  priceText,
  drawDateText,
  drawTimeText,
  countdownText,
  isBetClosed,
  ruleTickets,
  maxTickets,
  heroNumber,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  // Image URL badle (date/market change) to dobara try karo
  useEffect(() => {
    setImgFailed(false);
  }, [imageUrl]);

  const showImage = Boolean(imageUrl) && !imgFailed;

  return (
    <section className="dl-glow relative rounded-[18px] bg-gradient-to-br from-[#ffe58a] via-[#f0b429] to-[#ed1d43] p-[2px]">
      <style>{PREMIUM_CSS}</style>

      <div className="relative overflow-hidden rounded-[16px] border border-[#f1d9a0] bg-gradient-to-r from-[#fff0c9] via-[#fff8e8] to-[#ffe7b8]">
        {/* soft shine sweep */}
        <span className="dl-shine pointer-events-none absolute inset-y-0 left-0 w-1/5 bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        {/* ---------- MAIN ROW: IMAGE + INFO ---------- */}
        <div className="relative grid grid-cols-[auto_1fr] items-center gap-3 p-3">
          {showImage ? (
            <div className="relative h-[95px] w-[104px] shrink-0 overflow-hidden rounded-xl border-2 border-[#f1d9a0] bg-white shadow-md">
              <img
                src={imageUrl}
                alt={`${marketName || "Daily"} Lottery`}
                loading="lazy"
                onError={() => setImgFailed(true)}
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-1 right-1 rounded bg-[#d7198c] px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                {priceText}
              </span>
            </div>
          ) : (
            <div className="w-[104px]">
              <TicketMock
                small
                prize={firstPrizeAmount}
                price={priceText}
                number={heroNumber}
              />
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="min-w-0 truncate font-serif text-[16px] font-black leading-tight text-[#173e70]">
                Daily Lottery Ticket
              </h3>
              <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-[#2b0a16] px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-[#ffd34e]">
                <Crown size={9} />
                Premium
              </span>
            </div>

            <p className="mt-0.5 text-[10px] leading-snug text-[#4b5563]">
              Small Ticket, Big Opportunities. Pick your numbers and play for a
              bigger prize!
            </p>

            <div className="mt-2 grid grid-cols-3 gap-1">
              <InfoMini
                icon={<Trophy size={20} />}
                title={firstPrizeAmount}
                sub="First Prize"
              />
              <InfoMini
                icon={<CalendarDays size={20} />}
                title={drawDateText}
                sub="Draw Date"
              />
              <InfoMini
                icon={<Clock size={20} />}
                title={drawTimeText}
                sub="Draw Time"
              />
            </div>
          </div>
        </div>

        {/* ---------- STATUS STRIP: BETS CLOSE IN + MAX ---------- */}
        <div className="relative flex items-center justify-between gap-2 border-t border-[#f1d9a0] bg-white/60 px-3 py-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                isBetClosed ? "bg-red-500" : "animate-pulse bg-[#14a06a]"
              }`}
            />
            <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-[#4b5563]">
              {isBetClosed ? "Betting" : "Bets close in"}
            </span>
            <span
              className={`truncate font-mono text-[12px] font-black ${
                isBetClosed ? "text-red-600" : "text-[#14a06a]"
              }`}
            >
              {countdownText}
            </span>
          </div>

          <span className="shrink-0 rounded-md border border-[#e6c97c] bg-[#fff6df] px-2 py-0.5 text-[10px] font-bold text-[#8a4b12]">
            Max {maxTickets} / order
          </span>
        </div>
      </div>
    </section>
  );
};

// =====================================================
// RULE ROW
// =====================================================

const RuleRow = ({ number, condition, example, prize, total, badge, row }) => (
  <tr className={`${row} border-b border-white/60`}>
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
