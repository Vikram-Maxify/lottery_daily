import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  Flame,
  Flower2,
  Gift,
  PartyPopper,
  Plus,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Target,
  Ticket,
  TreePine,
  Trophy,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import DailyNumbersSection from "../Components/DailyNumbersSection";
import QuickVerifyTicket from "../Components/QuickVerifyTicket";
import LotteryVideoPlayer from "../Components/LotteryVideoPlayer";
import NumberSoldNotification from "../Components/NumberSoldNotification";

// =====================================================
// REDUX IMPORTS
// =====================================================
import {
  clearLotteryConfigError,
  clearLotteryConfigSuccess,
  getActiveLotteryConfig,
} from "../reducer/slice/lotteryConfigSlice";

// 🔥 FESTIVAL SLICE - all created lotteries (tab images + prizes)
// NOTE: path apni actual festival slice file ke naam se match kar lena
import {
  getAllLotteryConfigs as getAllFestivalConfigs,
  getActiveLotteryConfig as getActiveFestivalConfig,
  selectLotteryConfigs as selectFestivalConfigs,
  selectActiveLottery as selectActiveFestivalLottery,
  selectActiveLotteryLoading as selectFestivalActiveLoading,
} from "../reducer/slice/festivalLotteryReducer";

import {
  formatINR,
  formatDrawDate,
  formatDrawTime,
  getFestivalWinningRules,
} from "../utils/lotteryPrizeRules";

import {
  clearDepositState,
  createDeposit,
  selectDepositError,
  selectDepositLoading,
  selectDepositOrderId,
  selectDepositPaymentUrl,
} from "../reducer/slice/depositSlice";

import { getAmount } from "../reducer/slice/amountReducer";
import { fetchAllSettings } from "../reducer/slice/settingsSlice";

// 🔥 KYC REDUCER IMPORT
import {
  getMyKyc,
  selectKycDocuments,
  selectKycLoading,
} from "../reducer/slice/kycReducer";

// =====================================================
// CONSTANTS
// =====================================================
const BOTTOM_NAV_HEIGHT = 64;
const PURCHASE_BAR_HEIGHT = 90;
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1605196560547-b2f7281b7355?auto=format&fit=crop&w=1400&q=80";

const EN_MONTHS = [
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
const EN_DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const QUICK_OPTIONS = [10, 20, 30, 50, 100];
const MAX_TICKETS = 100;
const MIN_TICKETS = 10;
const TICKET_STEP = 10; // +/- buttons move in steps of 10
const INITIAL_VISIBLE_TICKETS = 10; // tickets shown before "View More"
const ALL_DATES_COUNT = 30;

// Ticket format: 2 digits + 1 alphabet + 5 digits  →  12A12345
const SLOT_PATTERN = ["D", "D", "L", "D", "D", "D", "D", "D"];
const TICKET_LENGTH = SLOT_PATTERN.length;
const TICKET_EXAMPLE = "12A12345";
const TICKET_REGEX = /^\d{2}[A-Z]\d{5}$/;

const DEFAULT_TICKET_PRICE = 20;

// Festival price admin se "10 tickets ke set" ke liye aata hai (e.g. ₹270 = 10 tickets)
const PRICE_SET_SIZE = 10;
const DEFAULT_SET_PRICE = 270;

// count tickets ka total amount (set price ke hisab se), 2 decimal tak round
const calcFestivalAmount = (setPrice, count) =>
  Math.round(((Number(setPrice) || 0) * count * 100) / PRICE_SET_SIZE) / 100;

const CHIP_COLORS = [
  { badge: "bg-[#ed1d43]", row: "bg-[#fff0f2]" },
  { badge: "bg-[#2e7dd7]", row: "bg-[#eef6ff]" },
  { badge: "bg-[#f08a25]", row: "bg-[#fff5ea]" },
  { badge: "bg-[#20a66a]", row: "bg-[#edfff6]" },
  { badge: "bg-[#8c4bd6]", row: "bg-[#f7efff]" },
  { badge: "bg-[#ff4d8d]", row: "bg-[#fff0f6]" },
  { badge: "bg-[#14a3a3]", row: "bg-[#e9fbfb]" },
  { badge: "bg-[#e0a800]", row: "bg-[#fff9e3]" },
  { badge: "bg-[#5b5fe0]", row: "bg-[#eeefff]" },
  { badge: "bg-[#a0561b]", row: "bg-[#fff1e8]" },
];



// =====================================================
// PRIZE HELPERS (Winning Rules)
// =====================================================
const formatPrize = (amount) => formatINR(amount);

// =====================================================
// TICKET HELPERS
// =====================================================
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

// "New Year" / "new-year" / "NEWYEAR" -> "newyear"
const normalizeKey = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

// Format: DD L DDDDD  →  12A12345
const randomTicketNumber = () => {
  const d = () => String(Math.floor(Math.random() * 10));
  const l = () => LETTERS[Math.floor(Math.random() * LETTERS.length)];
  return `${d()}${d()}${l()}${d()}${d()}${d()}${d()}${d()}`;
};

const randomUniqueCode = (usedCodes = []) => {
  const used = new Set(usedCodes);
  let code = randomTicketNumber();
  let guard = 0;
  while (used.has(code) && guard < 100) {
    code = randomTicketNumber();
    guard += 1;
  }
  return code;
};

const generateUniqueTickets = (count, existing = []) => {
  const used = new Set(existing.map((t) => t.code));
  const result = [];
  while (result.length < count) {
    const code = randomTicketNumber();
    if (used.has(code)) continue;
    used.add(code);
    result.push({ id: `${Date.now()}-${Math.random()}`, code });
  }
  return result;
};

const slotAccepts = (index, ch) =>
  SLOT_PATTERN[index] === "D" ? /^\d$/.test(ch) : /^[A-Z]$/.test(ch);

const slotPlaceholder = (index) => (SLOT_PATTERN[index] === "D" ? "0" : "A");

const sanitizeCode = (raw) => {
  const cleaned = String(raw || "")
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "");
  let result = "";
  for (const ch of cleaned) {
    if (result.length >= TICKET_LENGTH) break;
    if (slotAccepts(result.length, ch)) result += ch;
  }
  return result;
};

const readPrice = (raw) => {
  if (raw && typeof raw === "object") {
    return Number(raw.amount ?? raw.price ?? raw.ticketPrice ?? raw.value ?? 0);
  }
  return Number(raw);
};

// 🔥 KYC STATUS DERIVE HELPER
const deriveKycStatus = (documents) => {
  if (!Array.isArray(documents) || documents.length === 0) {
    return "not_submitted";
  }
  const statuses = documents.map((d) => String(d?.status || "").toLowerCase());
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
// COMPONENT
// =====================================================
const FestivalLottery = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ---------- AUTH ----------
  const user = useSelector((state) => state.auth?.user);

  // ---------- LOTTERY CONFIG ----------
  const {
    activeConfig,
    activeLoading,
    error: configError,
  } = useSelector(
    (state) =>
      state.lotteryConfig || {
        activeConfig: null,
        activeLoading: false,
        error: null,
      },
  );

  // ---------- ALL FESTIVAL LOTTERIES (tab images + prizes) ----------
  const allFestivalConfigs = useSelector(selectFestivalConfigs);
  const activeFestivalConfig = useSelector(selectActiveFestivalLottery);
  const festivalActiveLoading = useSelector(selectActiveFestivalLoading);

  // ---------- FESTIVAL SET PRICE (10 tickets) FROM SETTINGS SLICE ----------
  const festivalPriceFromSettings = useSelector(
    (state) => state.settings?.festivalLotteryAmount,
  );

  const apiPrice = readPrice(festivalPriceFromSettings);

  // ---------- DEPOSIT / PAYMENT ----------
  const depositLoading = useSelector(selectDepositLoading);
  const depositError = useSelector(selectDepositError);
  const depositPaymentUrl = useSelector(selectDepositPaymentUrl);
  const depositOrderId = useSelector(selectDepositOrderId);

  // 🔥 KYC SELECTORS
  const kycDocuments = useSelector(selectKycDocuments);
  const kycLoading = useSelector(selectKycLoading);

  // ---------- LOCAL UI STATE ----------
  const [festivalKey, setFestivalKey] = useState("");
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [showAllDates, setShowAllDates] = useState(false);
  const [searchParams] = useSearchParams();
  const [showQuick, setShowQuick] = useState(true);
  const [tickets, setTickets] = useState(() =>
    generateUniqueTickets(MIN_TICKETS, []),
  );
  const [showAllTickets, setShowAllTickets] = useState(false);
  const [draft, setDraft] = useState(() => {
    const urlNum = new URLSearchParams(window.location.search).get("number");
    if (urlNum && TICKET_REGEX.test(urlNum.toUpperCase())) {
      return urlNum.toUpperCase();
    }
    return "";
  });
  const [manualError, setManualError] = useState("");
  const [localSuccess, setLocalSuccess] = useState("");
  const draftRefs = useRef([]);
  const tabsScrollRef = useRef(null);
  const tabRefs = useRef({});

  // =====================================================
  // FESTIVAL TABS (Derived strictly from backend configurations)
  // =====================================================
  const festivalTabs = useMemo(() => {
    const list = Array.isArray(allFestivalConfigs) ? allFestivalConfigs : [];
    const seen = new Set();
    const tabs = [];

    // same marketName ki multiple configs ho to active wali preferred
    const pickConfig = (normalizedName) => {
      const matches = list.filter(
        (c) => normalizeKey(c?.marketName) === normalizedName,
      );
      return matches.find((c) => c?.isActive) || matches[0] || null;
    };

    list.forEach((c) => {
      const k = normalizeKey(c?.marketName);
      if (!k || seen.has(k)) return;
      seen.add(k);

      const cfg = pickConfig(k);
      const name = String(c?.marketName || "Festival").trim();

      tabs.push({
        key: k,
        tab: name,
        icon: Sparkles,
        name,
        special: `${name} Special`,
        desc: `Play & celebrate ${name} with bigger prizes and more happiness!`,
        price: Number(cfg?.ticketPrice || cfg?.price || DEFAULT_SET_PRICE),
        drawTime: formatDrawTime(cfg?.drawTime) || "9:00 PM",
        imageUrl: cfg?.imageUrl || null,
        config: cfg || null,
      });
    });

    return tabs;
  }, [allFestivalConfigs]);

  const festival = useMemo(
    () => festivalTabs.find((f) => f.key === festivalKey) || festivalTabs[0] || null,
    [festivalTabs, festivalKey],
  );

  // =====================================================
  // PRICE RESOLUTION
  // SET_PRICE = 10 tickets ka price (admin settings se, default ₹270)
  // =====================================================
  const SET_PRICE = useMemo(() => {
    if (Number.isFinite(apiPrice) && apiPrice > 0) return apiPrice;
    return DEFAULT_SET_PRICE;
  }, [apiPrice]);

  const price = SET_PRICE;
  const totalTickets = tickets.length;
  const totalAmount = calcFestivalAmount(SET_PRICE, totalTickets);

  // Tickets list: first 10 only, rest behind "View More"
  const visibleTickets = showAllTickets
    ? tickets
    : tickets.slice(0, INITIAL_VISIBLE_TICKETS);
  const hiddenTicketsCount = Math.max(
    tickets.length - INITIAL_VISIBLE_TICKETS,
    0,
  );

  // 🔥 KYC STATUS
  const kycStatus = useMemo(
    () => deriveKycStatus(kycDocuments),
    [kycDocuments],
  );
  const isKycApproved = kycStatus === "approved";

  // =====================================================
  // INITIAL FETCH
  // =====================================================
  useEffect(() => {
    dispatch(getActiveFestivalConfig());
    dispatch(getActiveLotteryConfig());
    dispatch(getAllFestivalConfigs()); // 🔥 tab images + prizes
    dispatch(getAmount());
    dispatch(fetchAllSettings());
    dispatch(clearDepositState());
    // 🔥 FETCH KYC
    dispatch(getMyKyc());
  }, [dispatch]);

  // Sync active festival tab on initial load or when festival configs update
  useEffect(() => {
    if (activeFestivalConfig?.marketName) {
      const activeKey = normalizeKey(activeFestivalConfig.marketName);
      if (activeKey) {
        setFestivalKey(activeKey);
        return;
      }
    }
    if (festivalTabs.length > 0) {
      const exists = festivalTabs.some((t) => t.key === festivalKey);
      if (!exists) {
        setFestivalKey(festivalTabs[0].key);
      }
    }
  }, [activeFestivalConfig, festivalTabs, festivalKey]);

  // =====================================================
  // RESET LOCAL SELECTION ON FESTIVAL / DATE CHANGE
  // Preserves default 10 tickets on initial load, only resets when user explicitly changes tab or date
  // =====================================================
  const prevFestivalKeyRef = useRef(null);
  const prevDateIndexRef = useRef(selectedDateIndex);

  useEffect(() => {
    if (prevFestivalKeyRef.current === null) {
      prevFestivalKeyRef.current = festivalKey;
      return;
    }
    // Only reset tickets if the user explicitly switches festival tab or date
    if (
      (festivalKey && prevFestivalKeyRef.current !== festivalKey) ||
      prevDateIndexRef.current !== selectedDateIndex
    ) {
      setTickets(generateUniqueTickets(MIN_TICKETS, []));
      setShowAllTickets(false);
      setDraft("");
      setManualError("");
      setLocalSuccess("");
    }
    prevFestivalKeyRef.current = festivalKey;
    prevDateIndexRef.current = selectedDateIndex;
  }, [festivalKey, selectedDateIndex]);

  // =====================================================
  // KEEP SELECTED TAB CENTERED IN THE SCROLL ROW
  // =====================================================
  useEffect(() => {
    const container = tabsScrollRef.current;
    const el = tabRefs.current[festivalKey];
    if (!container || !el) return;

    container.scrollTo({
      left: el.offsetLeft - (container.clientWidth - el.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [festivalKey, festivalTabs.length]);

  // =====================================================
  // CLEANUP ON UNMOUNT
  // =====================================================
  useEffect(() => {
    return () => {
      dispatch(clearLotteryConfigError());
      dispatch(clearLotteryConfigSuccess());
      dispatch(clearDepositState());
    };
  }, [dispatch]);

  // Handle URL query parameter ?number=
  useEffect(() => {
    const numParam = searchParams.get("number");
    if (numParam && TICKET_REGEX.test(numParam.toUpperCase())) {
      updateDraft(numParam.toUpperCase());
    }
  }, [searchParams]);

  // =====================================================
  // DATES
  // =====================================================
  const dateOptions = useMemo(() => {
    const today = new Date();
    return Array.from({ length: ALL_DATES_COUNT }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return {
        day: d.getDate(),
        month: EN_MONTHS[d.getMonth()],
        year: d.getFullYear(),
        weekday: EN_DAYS[d.getDay()],
        raw: d,
      };
    });
  }, []);

  const visibleDates = showAllDates ? dateOptions : dateOptions.slice(0, 8);
  const selectedDate = dateOptions[selectedDateIndex] || dateOptions[0];
  const summaryDate = `${String(selectedDate.day).padStart(2, "0")} ${selectedDate.month} ${selectedDate.year}`;

  // =====================================================
  // DYNAMIC FESTIVAL LOTTERY CONFIG & PRIZES FROM API
  // =====================================================
  const currentLottery = useMemo(() => {
    return (
      festival?.config ||
      (activeFestivalConfig &&
      normalizeKey(activeFestivalConfig.marketName) === normalizeKey(festival?.name)
        ? activeFestivalConfig
        : null) ||
      (activeConfig &&
      normalizeKey(activeConfig.marketName) === normalizeKey(festival?.name)
        ? activeConfig
        : null) ||
      activeFestivalConfig ||
      allFestivalConfigs?.[0] ||
      null
    );
  }, [festival, activeFestivalConfig, activeConfig, allFestivalConfigs]);

  const marketName = currentLottery?.marketName || festival?.name || "Festival";
  const drawDateText = formatDrawDate(currentLottery?.drawDate);
  const drawTimeText = formatDrawTime(currentLottery?.drawTime || festival?.drawTime);
  const festivalImageUrl = currentLottery?.imageUrl || festival?.imageUrl || null;
  const lotteryPrizes = currentLottery?.prizes || {};
  const firstPrizeAmount = formatINR(lotteryPrizes?.first);
  const firstPrizeText = firstPrizeAmount;

  // Exactly 5 dynamic winning rules directly mapped to API prizes
  const winningRules = useMemo(
    () => getFestivalWinningRules(lotteryPrizes, TICKET_EXAMPLE, PRICE_SET_SIZE),
    [lotteryPrizes]
  );

  // Purchase config — prefer festival-matched, fallback to any active
  const purchaseConfig =
    currentLottery ||
    activeFestivalConfig ||
    allFestivalConfigs?.[0] ||
    activeConfig ||
    null;

  // =====================================================
  // HANDLERS — TICKET SELECTION
  // =====================================================
  const setQuantity = (next) => {
    if (depositLoading) return;
    if (next <= 0) {
      setTickets([]);
      setManualError("");
      setLocalSuccess("");
      return;
    }
    const quantity = Math.min(Math.max(next, MIN_TICKETS), MAX_TICKETS);
    setTickets((prev) => {
      if (quantity === prev.length) return prev;
      if (quantity < prev.length) return prev.slice(0, quantity);
      return [...prev, ...generateUniqueTickets(quantity - prev.length, prev)];
    });
    setManualError("");
    setLocalSuccess("");
  };

  // + / − always move to the next / previous multiple of 10 (10 → 20 → 30 ...)
  const handleIncrease = () =>
    setQuantity(totalTickets === 0 ? MIN_TICKETS : (Math.floor(totalTickets / TICKET_STEP) + 1) * TICKET_STEP);

  const handleDecrease = () =>
    setQuantity(totalTickets <= MIN_TICKETS ? 0 : (Math.ceil(totalTickets / TICKET_STEP) - 1) * TICKET_STEP);

  const handleClear = () => {
    if (depositLoading) return;
    setTickets([]);
    setShowAllTickets(false);
    setManualError("");
    setLocalSuccess("");
  };

  const focusDraft = (index) => {
    const el = draftRefs.current[index];
    if (el) {
      el.focus();
      if (el.select) el.select();
    }
  };

  const updateDraft = (code) => {
    setDraft(code);
    setManualError("");
    setLocalSuccess("");
  };

  const handleDraftChange = (index, e) => {
    if (depositLoading) return;
    const raw = e.target.value;
    if (raw === "") {
      updateDraft(draft.slice(0, index));
      return;
    }
    const ch = raw
      .toUpperCase()
      .replace(/[^0-9A-Z]/g, "")
      .slice(-1);
    if (!ch) return;
    const pos = Math.min(index, draft.length);
    if (!slotAccepts(pos, ch)) return;
    const next = draft.slice(0, pos) + ch + draft.slice(pos + 1);
    updateDraft(next);
    if (pos < TICKET_LENGTH - 1) focusDraft(pos + 1);
  };

  const handleDraftKeyDown = (index, e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleManualAdd();
      return;
    }
    if (e.key === "Backspace" && !draft[index]) {
      e.preventDefault();
      if (index > 0) {
        updateDraft(draft.slice(0, index - 1));
        focusDraft(index - 1);
      }
      return;
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusDraft(index - 1);
    }
    if (e.key === "ArrowRight" && index < TICKET_LENGTH - 1) {
      e.preventDefault();
      focusDraft(index + 1);
    }
  };

  const handleDraftPaste = (e) => {
    e.preventDefault();
    if (depositLoading) return;
    const code = sanitizeCode(e.clipboardData.getData("text"));
    if (!code) return;
    updateDraft(code);
    focusDraft(Math.min(code.length, TICKET_LENGTH - 1));
  };

  const handleRandomDraft = () => {
    if (depositLoading) return;
    updateDraft(randomUniqueCode(tickets.map((t) => t.code)));
  };

  const handleClearDraft = () => {
    if (depositLoading) return;
    updateDraft("");
    focusDraft(0);
  };

  const handleManualAdd = () => {
    if (depositLoading) return;
    if (!TICKET_REGEX.test(draft)) {
      setManualError(`Enter full ticket number (e.g. ${TICKET_EXAMPLE})`);
      return;
    }
    if (tickets.some((t) => t.code === draft)) {
      setManualError("This number is already added");
      return;
    }
    if (tickets.length >= MAX_TICKETS) {
      setManualError(`Maximum ${MAX_TICKETS} tickets allowed`);
      return;
    }

    setTickets((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, code: draft },
    ]);
    setDraft("");
    setManualError("");
    setTimeout(() => focusDraft(0), 60);
  };

  const handleRemoveTicket = (id) => {
    if (depositLoading) return;
    setTickets((prev) => prev.filter((t) => t.id !== id));
  };

  // =====================================================
  // HANDLER — PURCHASE (same flow as BuyTicket)
  // =====================================================
  const handlePurchase = async () => {
    if (depositLoading) return;

    try {
      setManualError("");
      setLocalSuccess("");

      dispatch(clearDepositState());
      dispatch(clearLotteryConfigError());
      dispatch(clearLotteryConfigSuccess());

      // ---------- VALIDATIONS ----------
      if (!user) {
        setManualError("Please login first");
        return;
      }

      // 🔥 KYC CHECK
      if (!isKycApproved) {
        if (kycStatus === "pending") {
          setManualError(
            "Your KYC is pending approval. Please wait for admin verification.",
          );
          return;
        }
        if (kycStatus === "rejected") {
          setManualError("Your KYC was rejected. Redirecting to KYC page...");
          setTimeout(() => navigate("/kyc"), 1500);
          return;
        }
        // not_submitted
        setManualError(
          "Please complete your KYC first. Redirecting to KYC page...",
        );
        setTimeout(() => navigate("/kyc"), 1500);
        return;
      }

      if (!purchaseConfig?._id) {
        setManualError(
          "No active lottery configuration found. Please try again later.",
        );
        return;
      }
      if (!purchaseConfig?.isActive) {
        setManualError("Lottery is not active right now");
        return;
      }
      if (tickets.length < MIN_TICKETS) {
        setManualError(
          `Minimum ${MIN_TICKETS} tickets are required to purchase.`,
        );
        return;
      }

      // ---------- RESOLVE PRICE (10 tickets ka set price) ----------
      const setPriceAmount = SET_PRICE;

      if (!Number.isFinite(setPriceAmount) || setPriceAmount <= 0) {
        setManualError("Ticket price is not available");
        return;
      }

      // ---------- VALIDATE TICKETS ----------
      const invalidIndex = tickets.findIndex((t) => !TICKET_REGEX.test(t.code));
      if (invalidIndex !== -1) {
        setManualError(
          `Ticket ${invalidIndex + 1} is not valid (e.g. ${TICKET_EXAMPLE})`,
        );
        return;
      }

      const lotteryNumbers = tickets.map((t) => t.code);
      const duplicates = lotteryNumbers.filter(
        (n, i) => lotteryNumbers.indexOf(n) !== i,
      );
      if (duplicates.length > 0) {
        setManualError("Two tickets cannot have the same number.");
        return;
      }

      const totalPayable = calcFestivalAmount(setPriceAmount, tickets.length);

      setLocalSuccess(
        `Creating payment order for ${tickets.length} ticket(s)...`,
      );

      // ---------- CREATE PAYMENT ORDER (same as BuyTicket) ----------
      const result = await dispatch(
        createDeposit({
          paymentMethod: "INR",
          channel: "qwackpay",
          amount: totalPayable,
          configId: purchaseConfig._id,
          lotteryNumbers,
        }),
      ).unwrap();

      const paymentUrl = result?.paymentUrl || depositPaymentUrl || "";
      const orderId = result?.orderId || depositOrderId || "";

      if (!paymentUrl) {
        setLocalSuccess("");
        setManualError(
          result?.message || "Payment URL not received. Please try again.",
        );
        return;
      }

      setManualError("");
      setLocalSuccess(
        `Order ${orderId} created. Redirecting to payment page...`,
      );

      // Reset local selection to empty
      setTickets([]);
      setShowAllTickets(false);
      setDraft("");

      // ---------- REDIRECT TO PAYMENT GATEWAY ----------
      setTimeout(() => {
        window.location.href = paymentUrl;
      }, 600);
    } catch (purchaseError) {
      console.error("FESTIVAL LOTTERY PURCHASE ERROR:", purchaseError);
      setLocalSuccess("");
      setManualError(
        typeof purchaseError === "string"
          ? purchaseError
          : purchaseError?.message ||
              purchaseError?.payload?.message ||
              purchaseError?.payload ||
              "Could not buy tickets",
      );
    }
  };

  // =====================================================
  // DERIVED — VALIDATION
  // =====================================================
  const hasDuplicates = useMemo(() => {
    const codes = tickets
      .filter((t) => t.code.length === TICKET_LENGTH)
      .map((t) => t.code);
    return codes.some((c, i) => codes.indexOf(c) !== i);
  }, [tickets]);

  const displayError = manualError || depositError;

  // Purchase enabled when:
  //  • user logged in
  //  • active config exists & is active
  //  • tickets.length > 0 AND >= MIN_TICKETS valid unique tickets
  // NOTE: KYC check intentionally NOT in disabled — so user gets a clear message on click
  const isPurchaseDisabled =
    depositLoading ||
    !user ||
    !purchaseConfig?._id ||
    !purchaseConfig?.isActive ||
    tickets.length === 0 ||
    tickets.length < MIN_TICKETS ||
    hasDuplicates ||
    tickets.some((t) => !TICKET_REGEX.test(t.code));

  // =====================================================
  // UI
  // =====================================================
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#eef3fa] text-[#173e70]">
      {/* Real-time Number Sold Notification */}
      <NumberSoldNotification />

      <div
        className="relative mx-auto w-[calc(100%-0px)] max-w-[500px] overflow-x-hidden"
        style={{
          paddingBottom:
            (festival
              ? BOTTOM_NAV_HEIGHT + PURCHASE_BAR_HEIGHT
              : BOTTOM_NAV_HEIGHT) + 16,
        }}
      >
        {/* ================= HERO ================= */}
        <section
          className="relative overflow-hidden bg-[#3b0a14] bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#2a0610]/95 via-[#4a0b18]/75 to-[#2a0610]/55" />
          <div className="pointer-events-none absolute -right-10 top-0 h-52 w-52 rounded-full bg-[#ff8a00]/25 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-[#ff1744]/20 blur-3xl" />
          <Sparkles
            size={16}
            className="pointer-events-none absolute left-[46%] top-4 text-[#ffcf4a]/80"
          />
          <Sparkles
            size={12}
            className="pointer-events-none absolute bottom-[30%] left-[4%] text-[#ffb82e]/70"
          />
          <div className="relative grid grid-cols-[1.05fr_1fr] items-center gap-2 px-2 pb-14 pt-5">
            <div className="relative z-10 min-w-0">
              <h1 className="font-serif font-black leading-[0.9] tracking-tight">
                <span className="block bg-gradient-to-b from-[#fff1a8] to-[#e0a11b] bg-clip-text text-[42px] text-transparent">
                  Festival
                </span>
                <span className="block bg-gradient-to-b from-[#fff1a8] to-[#e0a11b] bg-clip-text text-[46px] text-transparent">
                  Lottery
                </span>
              </h1>
              <p className="mt-2 text-[11px] font-medium leading-tight text-white">
                Bigger Draws, Bigger Celebrations
              </p>
              <div className="mt-3 grid grid-cols-4 gap-1">
                <HeroFeature icon={<Gift size={20} />} text="Mega Prizes" />
                <HeroFeature
                  icon={<ShieldCheck size={20} />}
                  text="Special Draws"
                />
                <HeroFeature
                  icon={<Trophy size={20} />}
                  text="Limited Period"
                />
                <HeroFeature icon={<Users size={20} />} text="More Chances" />
              </div>
            </div>
            <div className="relative flex items-center justify-center">
              <FestivalHeroTicket
                special={`${marketName} Special`}
                price={price}
                number={TICKET_EXAMPLE}
                firstPrize={firstPrizeAmount}
              />
            </div>
          </div>
        </section>

        {/* ================= FESTIVAL TABS ================= */}
        <section className="relative z-10 -mt-10 px-2">
          <div className="rounded-2xl border border-[#e3d3ae] bg-[#fffaf4] p-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.10)]">
            <div className="flex items-center justify-between gap-2 px-0.5">
              <div className="min-w-0">
                <h2 className="text-[13px] font-extrabold leading-tight text-[#173e70]">
                  Select Festival Lottery
                </h2>
                <p className="text-[10px] leading-tight text-[#6b7280]">
                  Tap on a festival to choose it
                </p>
              </div>

              {festivalTabs.length > 4 && (
                <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-[#ed1d43]">
                  Swipe <ArrowRight size={12} />
                </span>
              )}
            </div>

            <div
              ref={tabsScrollRef}
              className="relative mt-2 flex snap-x gap-2 overflow-x-auto px-0.5 pb-2 pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {festivalTabs.length === 0 ? (
                <div className="w-full py-2 text-center text-[11px] text-gray-500">
                  No festival lotteries available right now
                </div>
              ) : (
                festivalTabs.map((f) => (
                  <FestivalTab
                    key={f.key}
                    festival={f}
                    active={f.key === festivalKey}
                    disabled={depositLoading}
                    onClick={() => setFestivalKey(f.key)}
                    innerRef={(el) => {
                      tabRefs.current[f.key] = el;
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </section>

        <main className="space-y-3 px-2 pt-3">
          {/* ================= API ERROR BANNER ================= */}
          {!purchaseConfig && !activeLoading && !festivalActiveLoading && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-700">
              No active lottery right now. Please check back soon.
            </div>
          )}

          {/* 🔥 KYC STATUS BANNER */}
          {!kycLoading && kycStatus !== "approved" && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                kycStatus === "pending"
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : kycStatus === "rejected"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-blue-200 bg-blue-50 text-blue-700"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {kycStatus === "pending" && (
                    <>
                      <p className="font-bold">KYC Verification Pending</p>
                      <p className="mt-0.5 text-xs">
                        Your KYC is under review. You cannot purchase tickets
                        until approved.
                      </p>
                    </>
                  )}
                  {kycStatus === "rejected" && (
                    <>
                      <p className="font-bold">KYC Rejected</p>
                      <p className="mt-0.5 text-xs">
                        Your KYC was rejected. Please re-submit your documents.
                      </p>
                    </>
                  )}
                  {kycStatus === "not_submitted" && (
                    <>
                      <p className="font-bold">KYC Required</p>
                      <p className="mt-0.5 text-xs">
                        Please complete your KYC to purchase lottery tickets.
                      </p>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/kyc")}
                  className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-bold shadow-sm"
                >
                  {kycStatus === "rejected" ? "Re-submit" : "Complete KYC"}
                </button>
              </div>
            </div>
          )}

          {kycLoading && (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
              Checking KYC status...
            </div>
          )}

          {/* ================= FESTIVAL INFO ================= */}
          <section className="relative overflow-hidden rounded-[16px] border border-[#f1d9a0] bg-gradient-to-r from-[#fff0c9] via-[#fff8e8] to-[#ffe7b8] p-3 shadow-sm">
            <div className="grid grid-cols-[auto_1fr] items-center gap-3">
              {festivalImageUrl ? (
                <div className="relative h-[95px] w-[104px] shrink-0 overflow-hidden rounded-xl border-2 border-[#f1d9a0] bg-white shadow-md">
                  <img
                    src={festivalImageUrl}
                    alt={`${marketName} Lottery`}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 rounded bg-[#d7198c] px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                    ₹{price}/-
                  </span>
                </div>
              ) : (
                <MiniTicket
                  className="w-[104px]"
                  title={`${marketName.toUpperCase()} LOTTERY`}
                  price={price}
                  firstPrize={firstPrizeAmount}
                />
              )}
              <div className="min-w-0">
                <h3 className="font-serif text-[16px] font-black leading-tight text-[#173e70]">
                  {marketName} Festival Lottery
                </h3>
                <p className="mt-0.5 text-[10px] leading-snug text-[#4b5563]">
                  {festival.desc}
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
                    icon={<CalendarDays size={20} />}
                    title={drawTimeText}
                    sub="Draw Time"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ================= SELECT DRAW DATE ================= */}
          {/* <section className="rounded-[16px] bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalendarDays size={24} className="text-[#173e70]" />
                <h2 className="text-[16px] font-extrabold text-[#173e70]">
                  Select Draw Date
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAllDates((s) => !s)}
                className="flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-[#c9d3e3] bg-white px-2.5 text-[10px] font-semibold text-[#173e70]"
              >
                {showAllDates ? "Show Less" : "View Full Schedule"}
                <ArrowRight
                  size={12}
                  className={`transition-transform ${showAllDates ? "rotate-90" : ""}`}
                />
              </button>
            </div>

            {showAllDates ? (
              <div className="mt-3 grid grid-cols-4 gap-2 min-[400px]:grid-cols-5">
                {visibleDates.map((d, index) => (
                  <DateChip
                    key={`${d.day}-${d.month}-${index}`}
                    date={d}
                    today={index === 0}
                    active={index === selectedDateIndex}
                    onClick={() => setSelectedDateIndex(index)}
                    fluid
                  />
                ))}
              </div>
            ) : (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {visibleDates.map((d, index) => (
                  <DateChip
                    key={`${d.day}-${d.month}-${index}`}
                    date={d}
                    today={index === 0}
                    active={index === selectedDateIndex}
                    onClick={() => setSelectedDateIndex(index)}
                  />
                ))}
              </div>
            )}
          </section> */}

          {/* ================= HOW MANY TICKETS ================= */}
          <section className="rounded-[16px] bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket
                  size={26}
                  className="-rotate-[30deg] text-[#173e70]"
                  fill="#173e70"
                />
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
                  disabled={totalTickets <= MIN_TICKETS || depositLoading}
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
                  disabled={totalTickets >= MAX_TICKETS || depositLoading}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9eef7] text-[22px] font-bold text-[#173e70] disabled:opacity-50"
                >
                  +
                </button>
              </div>

              <div className="grid min-w-0 grid-cols-[1fr_auto_1fr_auto_1.2fr] items-center gap-1 rounded-xl bg-[#f3f6fb] px-2 py-2 text-center">
                <div className="min-w-0">
                  <p className="text-[9px] text-[#4b5563]">
                    Price / {PRICE_SET_SIZE} Tickets
                  </p>
                  <p className="text-[14px] font-black text-[#d7193f]">
                    ₹{price}/-
                  </p>
                </div>
                <span className="text-[15px] text-[#9aa5b8]">•</span>
                <div className="min-w-0">
                  <p className="text-[9px] text-[#4b5563]">Total Tickets</p>
                  <p className="text-[14px] font-black text-[#d7193f]">
                    {totalTickets}
                  </p>
                </div>
                <span className="text-[15px] text-[#9aa5b8]">→</span>
                <div className="min-w-0">
                  <p className="text-[9px] text-[#4b5563]">Total Amount</p>
                  <p className="truncate text-[14px] font-black text-[#14a06a]">
                    ₹ {totalAmount.toLocaleString("en-IN")} /-
                  </p>
                </div>
              </div>
            </div>

            {/* ================= TICKET BOX INPUT ================= */}
            <div
              className={`mt-3 rounded-2xl border p-3 ${
                displayError
                  ? "border-red-300 bg-red-50/50"
                  : TICKET_REGEX.test(draft)
                    ? "border-emerald-300 bg-emerald-50/40"
                    : "border-[#dfe5f0] bg-[#f9fbff]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 leading-tight">
                  <h3 className="text-[14px] font-extrabold text-[#173e70]">
                    Enter Ticket Number
                  </h3>
                  <p className="truncate text-[10px] text-[#4b5563]">
                    Format: {TICKET_EXAMPLE} ( {draft.length}/{TICKET_LENGTH})
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearDraft}
                    disabled={!draft || depositLoading}
                    className="text-[12px] font-medium text-[#3d4468] underline underline-offset-2 disabled:opacity-40"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={handleRandomDraft}
                    disabled={depositLoading}
                    className="flex items-center gap-1 rounded-lg border border-[#c9d3e3] bg-white px-3 py-1.5 text-[12px] font-bold text-[#173e70] disabled:opacity-50"
                  >
                    <Shuffle size={13} /> Random
                  </button>
                </div>
              </div>

              <div
                className="mt-3 grid gap-1.5"
                style={{
                  gridTemplateColumns: `repeat(${TICKET_LENGTH}, minmax(0, 1fr))`,
                }}
              >
                {SLOT_PATTERN.map((_, i) => {
                  const filled = Boolean(draft[i]);
                  return (
                    <input
                      key={i}
                      ref={(el) => {
                        draftRefs.current[i] = el;
                      }}
                      value={draft[i] || ""}
                      onChange={(e) => handleDraftChange(i, e)}
                      onKeyDown={(e) => handleDraftKeyDown(i, e)}
                      onPaste={handleDraftPaste}
                      onFocus={(e) => e.target.select()}
                      disabled={depositLoading}
                      inputMode={SLOT_PATTERN[i] === "D" ? "numeric" : "text"}
                      autoCapitalize="characters"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder={slotPlaceholder(i)}
                      aria-label={`Ticket character ${i + 1}`}
                      className={`h-12 w-full min-w-0 rounded-xl border-2 text-center text-[18px] font-extrabold outline-none transition placeholder:font-bold placeholder:text-[#c3c8de] focus:border-[#ed1d43] focus:shadow-[0_0_0_3px_rgba(237,29,67,0.15)] disabled:opacity-50 ${
                        filled
                          ? "border-[#173e70] bg-white text-[#173e70]"
                          : "border-[#c9d3e3] bg-[#f1f3fa] text-[#173e70]"
                      }`}
                    />
                  );
                })}
              </div>

              {manualError && (
                <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-center text-[11px] font-medium text-red-600">
                  {manualError}
                </p>
              )}

              <button
                type="button"
                onClick={handleManualAdd}
                disabled={totalTickets >= MAX_TICKETS || depositLoading}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#ed1d43]/50 bg-[#fff0f2]/60 py-3 text-[14px] font-extrabold text-[#ed1d43] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#ed1d43]">
                  <Plus size={14} strokeWidth={3} />
                </span>
                Add More Tickets
              </button>
            </div>

            {/* ================= BULK / QUICK SELECT ================= */}
            {showQuick && (
              <div className="mt-3 grid grid-cols-5 gap-1.5">
                {QUICK_OPTIONS.map((count) => {
                  const active = totalTickets === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setQuantity(count)}
                      disabled={depositLoading}
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
                        {calcFestivalAmount(price, count).toLocaleString(
                          "en-IN",
                        )}
                      </p>
                      {active && (
                        <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-[#ed1d43]" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* ================= LUCKY / DAILY NUMBERS SELECTOR ================= */}
          <DailyNumbersSection
            mode="festival"
            selectedNumber={draft}
            onSelectNumber={(code) => updateDraft(code)}
          />

          {/* ================= SELECTED TICKETS ================= */}
          {/* <section className="rounded-[16px] bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <FileText size={22} className="shrink-0 text-[#173e70]" />
                <h2 className="truncate text-[15px] font-extrabold text-[#173e70]">
                  Selected Tickets ({totalTickets})
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClear}
                disabled={depositLoading}
                className="flex h-8 shrink-0 items-center gap-1 px-1 text-[12px] font-semibold text-[#173e70] disabled:opacity-50"
              >
                <Trash2 size={14} /> Clear
              </button>
            </div>

            <div className="mt-3 rounded-xl border border-[#e2e5f0] bg-[#f9fbff] p-2">
              {tickets.length === 0 ? (
                <div className="flex min-h-[100px] items-center justify-center px-3 text-center">
                  <p className="text-[12px] font-medium leading-relaxed text-[#6b7280]">
                    No tickets selected yet. Use Quick Select to select your tickets.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {visibleTickets.map((ticket, index) => {
                      const color = CHIP_COLORS[index % CHIP_COLORS.length];
                      return (
                        <div
                          key={ticket.id}
                          className={`flex min-w-0 items-center gap-1.5 rounded-lg border-2 border-white px-1.5 py-2 shadow-sm ${color.row}`}
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-black text-white ${color.badge}`}
                          >
                            {index + 1}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[13px] font-bold tracking-wider text-[#26354b]">
                            {ticket.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTicket(ticket.id)}
                            disabled={tickets.length <= MIN_TICKETS || depositLoading}
                            aria-label={`Remove ticket ${index + 1}`}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ed1d43] text-white disabled:opacity-40"
                          >
                            <X size={13} strokeWidth={3} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {hiddenTicketsCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAllTickets((s) => !s)}
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#c9d3e3] bg-white py-2 text-[12px] font-bold text-[#173e70] transition active:scale-[0.99]"
                    >
                      {showAllTickets
                        ? "Show Less"
                        : `View More Tickets (${hiddenTicketsCount} more)`}
                      <ChevronDown
                        size={16}
                        className={`transition ${showAllTickets ? "rotate-180" : ""}`}
                      />
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#bfe8d3] bg-[#e7f8ef] px-3 py-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#14a06a] text-white">
                <Info size={13} />
              </span>
              <p className="text-[11px] leading-snug text-[#26354b]">
                {totalTickets} unique tickets for the draw on {summaryDate}. Every{" "}
                {PRICE_SET_SIZE} tickets cost ₹{price} (minimum {MIN_TICKETS} tickets).
              </p>
            </div>
          </section> */}

          {/* ================= QUICK TICKET VERIFICATION WIDGET ================= */}
          <QuickVerifyTicket
            defaultMode="festival"
            title="Verify Festival Bumper Ticket"
            subtitle="Check if your festival ticket is a jackpot winner"
          />

          {/* ================= HOW TO PLAY VIDEO TUTORIAL ================= */}
          <LotteryVideoPlayer />

          {/* ================= WINNING RULES ================= */}
          <section className="overflow-hidden rounded-[18px] bg-gradient-to-br from-[#3a0b17] via-[#2b0a16] to-[#1a0710] p-2.5 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <div className="flex min-w-0 items-center gap-2">
                <BookOpen size={26} className="shrink-0 text-[#ffd34e]" />
                <h2 className="text-[15px] font-extrabold leading-tight text-white">
                  {festival.name} Festival Lottery Winning Rules
                </h2>
              </div>
              <button
                type="button"
                className="flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-white/40 px-2.5 text-[11px] font-semibold text-white"
              >
                View Official Terms <ArrowRight size={12} />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="flex min-w-0 flex-col items-start justify-center gap-1 rounded-xl border border-white/15 bg-white/5 px-2.5 py-2">
                <span className="text-[11px] font-medium leading-tight text-white">
                  Example Winning Number
                </span>
                <span className="whitespace-nowrap rounded-md bg-white px-2 py-1 text-[17px] font-black tracking-wider text-[#d7193f]">
                  12A <span className="text-[#173e70]">12345</span>
                </span>
              </div>
              <div className="flex min-w-0 items-center gap-1.5 rounded-xl border border-[#ffd34e]/30 bg-white/5 px-2.5 py-2">
                <Trophy
                  size={30}
                  className="shrink-0 text-[#ffd34e]"
                  fill="#ffd34e"
                />
                <div className="min-w-0">
                  <p className="text-[10px] text-white/80">Total First Prize</p>
                  <p className="whitespace-nowrap text-[20px] font-black leading-none text-[#ffd34e]">
                    {firstPrizeAmount}
                  </p>
                  <p className="mt-0.5 whitespace-nowrap text-[9px] text-white/75">
                    (10 Tickets × {winningRules[0]?.prize || "₹0"})
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 overflow-hidden rounded-lg">
              <table className="w-full table-fixed border-collapse text-left">
                <colgroup>
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "28%" }} />
                  <col style={{ width: "26%" }} />
                  <col style={{ width: "17%" }} />
                  <col style={{ width: "20%" }} />
                </colgroup>
                <thead>
                  <tr className="bg-[#1a0710] text-white">
                    {[
                      "#",
                      "Match Condition",
                      `Example (For ${TICKET_EXAMPLE})`,
                      "Prize Per Ticket",
                      "Total Prize (10 Tickets)",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-1.5 py-2.5 text-[10px] font-semibold leading-tight"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {winningRules.map((rule) => (
                    <RuleRow key={rule.number} {...rule} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* ================= BOTTOM PURCHASE BAR ================= */}
      {festival && (
        <div
          className="fixed left-1/2 z-[70] mb-[11px] w-[calc(100%-16px)] max-w-[450px] -translate-x-1/2 overflow-hidden rounded-lg border-t border-[#ff3155]/20 bg-gradient-to-b from-[#2b0a16] to-[#160610] shadow-[0_-4px_14px_rgba(0,0,0,0.4)] sm:mb-4"
          style={{ bottom: BOTTOM_NAV_HEIGHT + 8 }}
        >
          {/* ERROR BANNER */}
          {displayError && (
            <div className="mx-3 mt-2 rounded-lg border border-red-400/40 bg-red-500/15 px-2.5 py-1.5 text-center text-[10px] text-red-200">
              {typeof displayError === "string"
                ? displayError
                : displayError?.message || "Could not buy tickets"}
            </div>
          )}

          {/* SUCCESS BANNER */}
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
              <div className="mt-1 flex min-w-0 items-end gap-1.5">
                <span className="shrink-0 whitespace-nowrap text-[20px] font-black leading-none text-[#2ee59d] xs:text-[22px] sm:text-[24px]">
                  ₹ {totalAmount.toLocaleString("en-IN")} /-
                </span>
                <span className="min-w-0 truncate pb-0.5 text-[7.5px] leading-tight text-white/70 sm:text-[8.5px]">
                  {totalTickets} Tickets • {summaryDate} <br />
                  {festival?.name || marketName || "Festival"} Lottery
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handlePurchase}
              disabled={isPurchaseDisabled}
              className="flex h-[44px] w-auto min-w-[108px] shrink-0 items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-[#ff1744] to-[#e0102f] px-2.5 text-[12px] font-extrabold text-white shadow-[0_8px_25px_rgba(255,20,67,0.45)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:h-[50px] sm:min-w-[125px] sm:gap-1.5 sm:px-3 sm:text-[14px]"
            >
              <span>{depositLoading ? "Processing..." : tickets.length === 0 ? "Select Tickets" : "Purchase Now"}</span>
              {!depositLoading && (
                <ArrowRight
                  size={17}
                  className="shrink-0 sm:h-[18px] sm:w-[18px]"
                />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// =====================================================
// SMALL COMPONENTS
// =====================================================

// 🔥 FESTIVAL TAB (image from backend, icon fallback, clear clickable look)
const FestivalTab = ({ festival, active, disabled, onClick, innerRef }) => {
  const Icon = festival.icon;
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [festival.imageUrl]);

  const showImage = Boolean(festival.imageUrl) && !imgFailed;

  return (
    <button
      ref={innerRef}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`relative flex w-[78px] shrink-0 snap-center flex-col items-center gap-1.5 rounded-2xl border-2 px-1.5 pb-2 pt-2 text-center transition active:scale-95 disabled:opacity-60 ${
        active
          ? "border-[#ed1d43] bg-gradient-to-b from-[#ff1744] to-[#c9102f] text-white shadow-[0_3px_8px_rgba(237,29,67,0.30)]"
          : "border-[#d5dcec] bg-white text-[#173e70] shadow-sm hover:border-[#ed1d43]/60"
      }`}
    >
      {active && (
        <span className="absolute -right-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#14a06a] text-white shadow-sm">
          <Check size={11} strokeWidth={4} />
        </span>
      )}

      <span
        className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border-2 ${
          active ? "border-white bg-white/20" : "border-[#e3d3ae] bg-[#fff6e0]"
        }`}
      >
        {showImage ? (
          <img
            src={festival.imageUrl}
            alt={`${festival.name} lottery`}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <Icon
            size={24}
            className={active ? "text-white" : "text-[#173e70]"}
          />
        )}
      </span>

      <span className="w-full min-w-0 text-[10px] font-bold leading-tight">
        <span className="block truncate">{festival.tab}</span>
        <span className="block">Lottery</span>
      </span>
    </button>
  );
};

const DateChip = ({ date, today, active, onClick, fluid = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative flex h-[66px] ${
      fluid ? "w-full" : "w-[64px] shrink-0"
    } flex-col items-center justify-center rounded-xl border text-center transition active:scale-95 ${
      active
        ? "border-2 border-[#ed1d43] bg-[#fff0f2]"
        : "border-transparent bg-[#e3e9f3]"
    }`}
  >
    {today && (
      <span className="text-[10px] font-semibold text-[#ed1d43]">Today</span>
    )}
    <span
      className={`whitespace-nowrap text-[13px] font-extrabold ${
        active ? "text-[#ed1d43]" : "text-[#26354b]"
      }`}
    >
      {date.day} {date.month}
    </span>
    <span
      className={`text-[10px] ${active ? "text-[#ed1d43]" : "text-[#6b7280]"}`}
    >
      {date.weekday}
    </span>
    <span
      className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${
        active ? "bg-[#ed1d43]" : "bg-[#20a66a]"
      }`}
    />
  </button>
);

const HeroFeature = ({ icon, text }) => (
  <div className="flex min-w-0 flex-col items-center gap-1 text-center">
    <span className="text-[#ffd34e]">{icon}</span>
    <span className="text-[8px] font-medium leading-tight text-white/90">
      {text}
    </span>
  </div>
);

const FestivalHeroTicket = ({ special, price, number, firstPrize }) => (
  <div className="relative w-full max-w-[230px]">
    <div className="absolute inset-0 -rotate-[5deg] rounded-lg border border-[#e5c8a4] bg-[#fdf1dc]" />
    <div
      className="relative rotate-[2deg] rounded-lg border-[0.3em] border-[#f7d9a8] bg-[#fffaf0] p-[0.7em] shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
      style={{ fontSize: "11px" }}
    >
      <div className="flex items-start justify-between gap-[0.4em]">
        <div className="min-w-0">
          <p className="text-[1.8em] font-black leading-none text-[#d7193f]">
            DEAR
          </p>
          <p className="text-[0.7em] font-bold text-[#153c78]">
            FESTIVAL LOTTERY
          </p>
          <p className="mt-[0.2em] font-serif text-[1.15em] font-black leading-tight text-[#d7193f]">
            {special}
          </p>
        </div>
        <div className="flex h-[3.4em] w-[3.4em] shrink-0 flex-col items-center justify-center rounded-full bg-[#d7198c] text-center text-[0.65em] font-black leading-tight text-white">
          Price <span className="text-[1.4em]">₹{price}/-</span>
        </div>
      </div>
      <p className="mt-[0.4em] text-[0.8em] font-bold text-[#26354b]">
        First Prize
      </p>
      <p className="whitespace-nowrap text-[2.4em] font-black leading-none text-[#153c78]">
        {firstPrize || "₹0"}
      </p>
      <div className="mt-[0.5em] border-y border-[#d7bba5] py-[0.3em] text-center">
        <p className="text-[0.55em] font-bold text-[#26354b]">Ticket Number</p>
        <p className="whitespace-nowrap text-[1.4em] font-black tracking-[0.15em] text-[#173e70]">
          {number}
        </p>
      </div>
    </div>
  </div>
);

const MiniTicket = ({ className = "", title, price, firstPrize }) => (
  <div className={`relative ${className}`}>
    <div className="absolute inset-0 -rotate-[8deg] rounded-md border border-[#e5c8a4] bg-[#fdf1dc]" />
    <div
      className="relative -rotate-[3deg] rounded-md border-[3px] border-[#f2d1b8] bg-[#fffaf0] p-[0.45em] shadow-lg"
      style={{ fontSize: "10px" }}
    >
      <div className="flex items-start justify-between">
        <p className="text-[1.9em] font-black leading-none text-[#d7193f]">
          DEAR
        </p>
        <div className="flex h-[2.6em] w-[2.6em] flex-col items-center justify-center rounded-full bg-[#d7198c] text-center text-[0.5em] font-black leading-tight text-white">
          Price <span className="text-[1.3em]">₹{price}/-</span>
        </div>
      </div>
      <p className="truncate text-[0.6em] font-bold text-[#153c78]">{title}</p>
      <p className="text-[0.55em] font-bold text-[#d7193f]">First Prize</p>
      <p className="whitespace-nowrap text-[1.5em] font-black leading-none text-[#153c78]">
        {firstPrize || "₹0"}
      </p>
    </div>
  </div>
);

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

export default FestivalLottery;
