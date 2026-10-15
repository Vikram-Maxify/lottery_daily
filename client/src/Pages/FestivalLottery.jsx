import {
  ArrowRight,
  Banknote,
  CalendarDays,
  Check,
  ChevronDown,
  ScrollText,
  Shuffle,
  Sparkles,
  Ticket,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import DailyNumbersSection from "../Components/DailyNumbersSection";
import NumberSoldNotification from "../Components/NumberSoldNotification";
import QuickVerifyTicket from "../Components/QuickVerifyTicket";
import { verifyNumberForBet } from "../reducer/slice/dailyNumberSlice";

// =====================================================
// REDUX IMPORTS
// =====================================================
import {
  clearLotteryConfigError,
  clearLotteryConfigSuccess,
  getActiveLotteryConfig,
} from "../reducer/slice/lotteryConfigSlice";

import {
  getActiveLotteryConfig as getActiveFestivalConfig,
  getAllLotteryConfigs as getAllFestivalConfigs,
  selectActiveLotteryLoading as selectActiveFestivalLoading,
  selectActiveLottery as selectActiveFestivalLottery,
  selectLotteryConfigs as selectFestivalConfigs,
} from "../reducer/slice/festivalLotteryReducer";

import {
  formatDrawDate,
  formatDrawTime,
  formatINR,
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

import {
  getMyKyc,
  selectKycDocuments,
  selectKycLoading,
} from "../reducer/slice/kycReducer";

import banner from "../assets/dear-fastival-2.jpg";

// =====================================================
// CONSTANTS
// =====================================================
const BOTTOM_NAV_HEIGHT = 64;
const PURCHASE_BAR_HEIGHT = 90;

const QUICK_OPTIONS = [10, 20, 30, 50, 100];
const MAX_TICKETS = 100;
const MIN_TICKETS = 10;
const TICKET_STEP = 10;

// Ticket format: 2 digits + 1 alphabet + 5 digits -> 12A12345
const SLOT_PATTERN = ["D", "D", "L", "D", "D", "D", "D", "D"];
const TICKET_LENGTH = SLOT_PATTERN.length;
const TICKET_EXAMPLE = "12A12345";
const TICKET_REGEX = /^\d{2}[A-Z]\d{5}$/;

const PRICE_SET_SIZE = 10;
const DEFAULT_SET_PRICE = 270;

const calcFestivalAmount = (setPrice, count) =>
  Math.round(((Number(setPrice) || 0) * count * 100) / PRICE_SET_SIZE) / 100;

// =====================================================
// TICKET HELPERS
// =====================================================
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

const normalizeKey = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

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

  // ---------- DAILY LOTTERY CONFIG ----------
  const { activeConfig, activeLoading } = useSelector(
    (state) =>
      state.lotteryConfig || {
        activeConfig: null,
        activeLoading: false,
      },
  );

  // ---------- ALL FESTIVAL LOTTERIES ----------
  const allFestivalConfigs = useSelector(selectFestivalConfigs);
  const activeFestivalConfig = useSelector(selectActiveFestivalLottery);
  const festivalActiveLoading = useSelector(selectActiveFestivalLoading);

  // ---------- FESTIVAL SET PRICE (10 tickets) ----------
  const festivalPriceFromSettings = useSelector(
    (state) => state.settings?.festivalLotteryAmount,
  );
  const apiPrice = readPrice(festivalPriceFromSettings);

  // ---------- DEPOSIT / PAYMENT ----------
  const depositLoading = useSelector(selectDepositLoading);
  const depositError = useSelector(selectDepositError);
  const depositPaymentUrl = useSelector(selectDepositPaymentUrl);
  const depositOrderId = useSelector(selectDepositOrderId);

  // ---------- KYC ----------
  const kycDocuments = useSelector(selectKycDocuments);
  const kycLoading = useSelector(selectKycLoading);

  // ---------- LOCAL UI STATE ----------
  const [festivalKey, setFestivalKey] = useState("");
  const [searchParams] = useSearchParams();
  const [showQuick, setShowQuick] = useState(true);
  const [quantity, setQuantityState] = useState(MIN_TICKETS);
  const [ticketCodes, setTicketCodes] = useState(() => {
    const urlNum = new URLSearchParams(window.location.search).get("number");
    if (urlNum && TICKET_REGEX.test(urlNum.toUpperCase())) {
      return [urlNum.toUpperCase()];
    }
    return [""];
  });
  const [manualError, setManualError] = useState("");
  const [localSuccess, setLocalSuccess] = useState("");

  // ✅ Numbers jo backend ne "sold" bataye (dobara generate/add nahi honge)
  const [soldNumbers, setSoldNumbers] = useState([]);
  // ✅ Purchase se pehle availability check chal raha hai
  const [isChecking, setIsChecking] = useState(false);

  const draftRefs = useRef({});
  const tabsScrollRef = useRef(null);
  const tabRefs = useRef({});
  // =====================================================
  // FESTIVAL TABS (Derived from backend configurations)
  // Order: jo pehle add hua wo pehle, jo sabse last me add hua wo sabse last me
  // =====================================================
  const festivalTabs = useMemo(() => {
    const rawList = Array.isArray(allFestivalConfigs) ? allFestivalConfigs : [];

    // createdAt ascending (oldest -> newest). createdAt na ho to _id (ObjectId
    // time ke saath badhta hai) se fallback.
    const getCreatedTime = (c) => {
      const t = new Date(c?.createdAt).getTime();
      return Number.isFinite(t) ? t : 0;
    };

    const list = [...rawList].sort((a, b) => {
      const diff = getCreatedTime(a) - getCreatedTime(b);
      if (diff !== 0) return diff;
      return String(a?._id || "").localeCompare(String(b?._id || ""));
    });

    const seen = new Set();
    const tabs = [];

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

  const festival = useMemo(() => {
    const found =
      festivalTabs.find((f) => f.key === festivalKey) || festivalTabs[0];
    if (found) return found;

    const fallbackConfig =
      activeFestivalConfig || allFestivalConfigs?.[0] || null;
    if (fallbackConfig) {
      const name = String(fallbackConfig.marketName || "Festival").trim();
      return {
        key: normalizeKey(name),
        tab: name,
        icon: Sparkles,
        name,
        special: `${name} Special`,
        desc: `Play & celebrate ${name} with bigger prizes and more happiness!`,
        price: Number(
          fallbackConfig.ticketPrice ||
            fallbackConfig.price ||
            DEFAULT_SET_PRICE,
        ),
        drawTime: formatDrawTime(fallbackConfig.drawTime) || "9:00 PM",
        imageUrl: fallbackConfig.imageUrl || null,
        config: fallbackConfig,
      };
    }
    return null;
  }, [festivalTabs, festivalKey, activeFestivalConfig, allFestivalConfigs]);

  // =====================================================
  // PRICE RESOLUTION
  // =====================================================
  const SET_PRICE = useMemo(() => {
    if (Number.isFinite(apiPrice) && apiPrice > 0) return apiPrice;
    return DEFAULT_SET_PRICE;
  }, [apiPrice]);

  const price = SET_PRICE;
  const totalTickets = quantity;
  const totalAmount = calcFestivalAmount(SET_PRICE, totalTickets);

  // KYC status
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
    dispatch(getAllFestivalConfigs());
    dispatch(getAmount());
    dispatch(fetchAllSettings());
    dispatch(clearDepositState());
    dispatch(getMyKyc());
  }, [dispatch]);

  // Sync active festival tab

  // Sync the initial festival selection without overriding
  // a market that the user has manually selected.
  useEffect(() => {
    if (!festivalTabs.length) return;

    const selectedExists = festivalTabs.some((tab) => tab.key === festivalKey);

    // Preserve the user's current selection.
    if (selectedExists) return;

    // Use the admin-selected active market only as the default.
    const activeKey = normalizeKey(activeFestivalConfig?.marketName);

    const initialKey = festivalTabs.some((tab) => tab.key === activeKey)
      ? activeKey
      : festivalTabs[0].key;

    setFestivalKey(initialKey);
  }, [activeFestivalConfig?.marketName, festivalTabs, festivalKey]);

  // Reset local selection ONLY when user explicitly changes festival tab
  const prevFestivalKeyRef = useRef(null);

  useEffect(() => {
    if (prevFestivalKeyRef.current === null) {
      prevFestivalKeyRef.current = festivalKey;
      return;
    }
    if (festivalKey && prevFestivalKeyRef.current !== festivalKey) {
      setQuantityState(MIN_TICKETS);
      setTicketCodes([""]);
      setManualError("");
      setLocalSuccess("");
      setSoldNumbers([]);
    }
    prevFestivalKeyRef.current = festivalKey;
  }, [festivalKey]);

  // Center selected tab in scroll row
  useEffect(() => {
    const container = tabsScrollRef.current;
    const el = tabRefs.current[festivalKey];
    if (!container || !el) return;

    container.scrollTo({
      left: el.offsetLeft - (container.clientWidth - el.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [festivalKey, festivalTabs.length]);

  // Cleanup on unmount
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
      setTicketCodes((prev) => {
        const next = [...prev];
        next[0] = numParam.toUpperCase();
        return next;
      });
    }
  }, [searchParams]);

  // =====================================================
  // DYNAMIC CONFIG & PRIZES
  // =====================================================
  const currentLottery = useMemo(() => {
    return (
      festival?.config ||
      (activeFestivalConfig &&
      normalizeKey(activeFestivalConfig.marketName) ===
        normalizeKey(festival?.name)
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
  const drawTimeText = formatDrawTime(
    currentLottery?.drawTime || festival?.drawTime,
  );
  const festivalImageUrl =
    currentLottery?.imageUrl || festival?.imageUrl || null;
  const lotteryPrizes = currentLottery?.prizes || {};
  const firstPrizeAmount = formatINR(lotteryPrizes?.first);

  // Hero banner overlays (admin se aane wala data)
  const hasFirstPrize = Number(lotteryPrizes?.first) > 0;
  const bannerMarketText = String(marketName || "").trim();
  const bannerPrizeText = String(firstPrizeAmount || "").trim();

  // Font size auto-fit (cqw = banner width ka %), lamba text ho to chhota
  const bannerMarketFontSize = `${Math.min(
    3.4,
    19 / (Math.max(bannerMarketText.length, 1) * 0.62),
  ).toFixed(2)}cqw`;
  const bannerPrizeFontSize = `${Math.min(
    4.8,
    22 / (Math.max(bannerPrizeText.length, 1) * 0.66),
  ).toFixed(2)}cqw`;

  const winningRules = useMemo(
    () =>
      getFestivalWinningRules(lotteryPrizes, TICKET_EXAMPLE, PRICE_SET_SIZE),
    [lotteryPrizes],
  );

  const purchaseConfig =
    currentLottery ||
    activeFestivalConfig ||
    allFestivalConfigs?.[0] ||
    activeConfig ||
    null;

  const festivalDesc =
    festival?.desc ||
    `Play & celebrate ${marketName} with bigger prizes and more happiness!`;

  // =====================================================
  // HANDLERS — TICKET SELECTION
  // =====================================================
  const updateQuantity = (next) => {
    if (depositLoading || isChecking) return;

    // Hamesha 10 ke step me, minimum 10, maximum 100
    const stepped = Math.round(Number(next) / TICKET_STEP) * TICKET_STEP;
    const clamped = Math.min(Math.max(stepped, MIN_TICKETS), MAX_TICKETS);
    setQuantityState(clamped);
    const targetCount = Math.max(1, Math.floor(clamped / 10));
    setTicketCodes((prev) => {
      const nextCodes = [...prev];
      if (nextCodes.length < targetCount) {
        while (nextCodes.length < targetCount) nextCodes.push("");
      } else if (nextCodes.length > targetCount) {
        nextCodes.length = targetCount;
      }
      return nextCodes;
    });
    setManualError("");
    setLocalSuccess("");
  };

  const setQuantity = updateQuantity;

  const handleIncrease = () =>
    updateQuantity((Math.floor(quantity / TICKET_STEP) + 1) * TICKET_STEP);

  const handleDecrease = () =>
    updateQuantity((Math.ceil(quantity / TICKET_STEP) - 1) * TICKET_STEP);

  const focusDraft = (tIndex, slotIndex) => {
    const el = draftRefs.current[`${tIndex}_${slotIndex}`];
    if (el) {
      el.focus();
      if (el.select) el.select();
    }
  };

  const handleDraftChange = (tIndex, slotIndex, e) => {
    if (depositLoading || isChecking) return;
    const raw = e.target.value;
    if (raw === "") {
      setTicketCodes((prev) => {
        const next = [...prev];
        const cur = next[tIndex] || "";
        next[tIndex] = cur.slice(0, slotIndex);
        return next;
      });
      setManualError("");
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
    if (!slotAccepts(pos, ch)) return;
    const next = (cur.slice(0, pos) + ch + cur.slice(pos + 1)).slice(
      0,
      TICKET_LENGTH,
    );
    setTicketCodes((prev) => {
      const nextCodes = [...prev];
      nextCodes[tIndex] = next;
      return nextCodes;
    });
    setManualError("");
    setLocalSuccess("");
    if (pos < TICKET_LENGTH - 1) focusDraft(tIndex, pos + 1);
  };

  const handleDraftKeyDown = (tIndex, slotIndex, e) => {
    const cur = ticketCodes[tIndex] || "";
    if (e.key === "Enter") {
      e.preventDefault();
      return;
    }
    if (e.key === "Backspace" && !cur[slotIndex]) {
      e.preventDefault();
      if (slotIndex > 0) {
        setTicketCodes((prev) => {
          const next = [...prev];
          const c = next[tIndex] || "";
          next[tIndex] = c.slice(0, slotIndex - 1);
          return next;
        });
        focusDraft(tIndex, slotIndex - 1);
      }
      return;
    }
    if (e.key === "ArrowLeft" && slotIndex > 0) {
      e.preventDefault();
      focusDraft(tIndex, slotIndex - 1);
    }
    if (e.key === "ArrowRight" && slotIndex < TICKET_LENGTH - 1) {
      e.preventDefault();
      focusDraft(tIndex, slotIndex + 1);
    }
  };

  const handleDraftPaste = (tIndex, e) => {
    e.preventDefault();
    if (depositLoading || isChecking) return;
    const code = sanitizeCode(e.clipboardData.getData("text"));
    if (!code) return;
    setTicketCodes((prev) => {
      const next = [...prev];
      next[tIndex] = code.slice(0, TICKET_LENGTH);
      return next;
    });
    focusDraft(tIndex, Math.min(code.length, TICKET_LENGTH - 1));
  };

  const handleRandomSingleDraft = async (tIndex) => {
    if (depositLoading || isChecking) return;
    setManualError("");
    setLocalSuccess("");
    const usedCodes = ticketCodes
      .filter((_, idx) => idx !== tIndex)
      .concat(soldNumbers)
      .filter(Boolean);

    for (let i = 0; i < 20; i++) {
      const candidate = randomUniqueCode(usedCodes);
      try {
        const avail = await verifyNumberForBet(candidate);
        if (avail?.canBet) {
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

  const handleRandomAllDrafts = async () => {
    if (depositLoading || isChecking) return;
    setManualError("");
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

  const handleClearSingleDraft = (tIndex) => {
    if (depositLoading || isChecking) return;
    setTicketCodes((prev) => {
      const next = [...prev];
      next[tIndex] = "";
      return next;
    });
    focusDraft(tIndex, 0);
    setManualError("");
    setLocalSuccess("");
  };

  const handleClearAllDrafts = () => {
    if (depositLoading || isChecking) return;
    setTicketCodes((prev) => prev.map(() => ""));
    focusDraft(0, 0);
    setManualError("");
    setLocalSuccess("");
  };

  // Status computation for each ticket input
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

  // =====================================================
  // HANDLER — PURCHASE
  // =====================================================
  const handlePurchase = async () => {
    if (depositLoading || isChecking) return;

    try {
      setManualError("");
      setLocalSuccess("");

      dispatch(clearDepositState());
      dispatch(clearLotteryConfigError());
      dispatch(clearLotteryConfigSuccess());

      if (!user) {
        setManualError("Please login first");
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
      if (quantity < MIN_TICKETS) {
        setManualError(
          `Minimum ${MIN_TICKETS} tickets are required to purchase.`,
        );
        return;
      }
      if (quantity % TICKET_STEP !== 0) {
        setManualError(`Tickets must be purchased in sets of ${TICKET_STEP}.`);
        return;
      }

      const setPriceAmount = SET_PRICE;
      if (!Number.isFinite(setPriceAmount) || setPriceAmount <= 0) {
        setManualError("Ticket price is not available");
        return;
      }

      // -------------------------------------------------
      // MULTI-TICKET VALIDATION
      // Formula: Required inputs = quantity / 10
      // -------------------------------------------------
      const expectedInputs = Math.max(1, Math.floor(quantity / 10));

      if (ticketCodes.length !== expectedInputs) {
        setManualError(
          `Please provide ticket numbers for all ${expectedInputs} tickets.`,
        );
        return;
      }

      for (let i = 0; i < ticketCodes.length; i++) {
        const code = String(ticketCodes[i] || "")
          .trim()
          .toUpperCase();

        if (!code || !TICKET_REGEX.test(code)) {
          setManualError(
            `Ticket Number ${i + 1}: Please enter a valid 8-character ticket number (e.g. ${TICKET_EXAMPLE})`,
          );
          return;
        }

        if (soldNumbers.includes(code)) {
          setManualError(
            `Ticket Number ${i + 1} (${code}) has already been sold. Please choose another number.`,
          );
          return;
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
        setManualError(
          "Duplicate ticket numbers are not allowed. Each ticket must have a unique number.",
        );
        return;
      }

      // -------------------------------------------------
      // CHECK NUMBER AVAILABILITY FOR ALL NUMBERS
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
          setManualError(
            availabilityCheck?.message ||
              `Ticket Number ${i + 1} (${code}) has already been sold. Please choose another number.`,
          );
          return;
        }
      }

      // -------------------------------------------------
      // CREATE DEPOSIT WITH ALL VALIDATED TICKETS
      // -------------------------------------------------
      const lotteryNumbers = normalizedCodes;
      const totalPayable = calcFestivalAmount(setPriceAmount, quantity);

      setLocalSuccess(`Creating payment order for ${quantity} ticket(s)...`);

      const result = await dispatch(
        createDeposit({
          paymentMethod: "INR",
          channel: "qwackpay",
          amount: totalPayable,
          configId: purchaseConfig._id,
          lotteryNumbers,
          quantity,
          lotteryType: "festival",
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

      setTicketCodes((prev) => prev.map(() => ""));

      setTimeout(() => {
        window.location.href = paymentUrl;
      }, 600);
    } catch (purchaseErr) {
      console.error("FESTIVAL LOTTERY PURCHASE ERROR:", purchaseErr);
      setLocalSuccess("");
      setManualError(
        typeof purchaseErr === "string"
          ? purchaseErr
          : purchaseErr?.message ||
              purchaseErr?.payload?.message ||
              purchaseErr?.payload ||
              "Could not buy tickets",
      );
    } finally {
      setIsChecking(false);
    }
  };

  const displayError = manualError || depositError;

  const isPurchaseDisabled =
    depositLoading ||
    isChecking ||
    !user ||
    !purchaseConfig?._id ||
    !purchaseConfig?.isActive ||
    !isTicketValid ||
    hasKnownSold ||
    quantity < MIN_TICKETS ||
    quantity % TICKET_STEP !== 0;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#eef3fa] text-[#173e70]">
      {/* Real-time Number Sold Notification */}
      <NumberSoldNotification />

      <div
        className="relative mx-auto w-[calc(100%-0px)] max-w-[500px] overflow-x-hidden"
        style={{
          paddingBottom: BOTTOM_NAV_HEIGHT + PURCHASE_BAR_HEIGHT + 16,
        }}
      >
        {/* ================= HERO (BANNER IMAGE + DYNAMIC DATA) ================= */}
        <section className="relative overflow-hidden bg-[#3b0a14]">
          <div
            className="relative w-full"
            style={{ containerType: "inline-size" }}
          >
            <img
              src={banner}
              alt="Festival Lottery"
              loading="lazy"
              className="block h-auto w-full select-none"
              draggable={false}
            />

            {/* Upper box: Market name (admin se) */}
            {bannerMarketText && (
              <div
                className="pointer-events-none absolute flex items-center justify-center"
                style={{
                  left: "74.8%",
                  top: "40%",
                  width: "21%",
                  transform: "translate(-50%, -50%) rotate(-7deg)",
                }}
              >
                <span
                  className="block whitespace-nowrap text-center font-black uppercase leading-none text-[#d7193f]"
                  style={{
                    fontSize: bannerMarketFontSize,
                    textShadow: "0 1px 0 rgba(255,255,255,0.6)",
                  }}
                >
                  {bannerMarketText}
                </span>
              </div>
            )}

            {/* Lower box: First prize (admin se) */}
            {hasFirstPrize && (
              <div
                className="pointer-events-none absolute flex items-center justify-center"
                style={{
                  left: "76.7%",
                  top: "58.4%",
                  width: "24%",
                  transform: "translate(-50%, -50%) rotate(-7deg)",
                }}
              >
                <span
                  className="block whitespace-nowrap text-center font-black uppercase leading-none text-[#153c78]"
                  style={{
                    fontSize: bannerPrizeFontSize,
                    textShadow: "0 1px 0 rgba(255,255,255,0.6)",
                  }}
                >
                  {bannerPrizeText}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ================= FESTIVAL TABS ================= */}
        <section className="relative z-10 mt-3 px-2">
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
                    disabled={depositLoading || isChecking}
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
                  {festivalDesc}
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

          {/* ================= HOW MANY TICKETS ================= */}
          <section className="rounded-[16px] bg-white p-3 shadow-sm">
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
                    totalTickets <= MIN_TICKETS || depositLoading || isChecking
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
                    totalTickets >= MAX_TICKETS || depositLoading || isChecking
                  }
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

            {/* ================= TICKET BOX INPUTS ================= */}
            <div className="mt-3 rounded-2xl border border-[#dfe5f0] bg-white p-3.5 shadow-sm">
              <div className="flex items-center justify-between gap-2 border-b border-[#eef2f8] pb-3">
                <div className="min-w-0 leading-tight">
                  <h3 className="truncate text-[15px] font-extrabold text-[#173e70]">
                    Enter Ticket Numbers ({ticketCodes.length})
                  </h3>
                  <p className="truncate text-[10px] text-[#4b5563]">
                    Format: {TICKET_EXAMPLE} · {ticketCodes.length}{" "}
                    {ticketCodes.length === 1 ? "input" : "inputs"} for{" "}
                    {quantity} tickets
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearAllDrafts}
                    disabled={
                      depositLoading ||
                      isChecking ||
                      ticketCodes.every((c) => !c)
                    }
                    className="text-[12px] font-medium text-[#3d4468] underline underline-offset-2 disabled:opacity-40"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={handleRandomAllDrafts}
                    disabled={depositLoading || isChecking}
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
                            onClick={() => handleClearSingleDraft(tIndex)}
                            disabled={!code || depositLoading || isChecking}
                            className="text-[11px] font-semibold text-[#6b7280] hover:text-[#ed1d43] disabled:opacity-30"
                          >
                            Clear
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRandomSingleDraft(tIndex)}
                            disabled={depositLoading || isChecking}
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
                                draftRefs.current[`${tIndex}_${sIndex}`] = el;
                              }}
                              value={code[sIndex] || ""}
                              onChange={(e) =>
                                handleDraftChange(tIndex, sIndex, e)
                              }
                              onKeyDown={(e) =>
                                handleDraftKeyDown(tIndex, sIndex, e)
                              }
                              onPaste={(e) => handleDraftPaste(tIndex, e)}
                              onFocus={(e) => e.target.select()}
                              disabled={depositLoading || isChecking}
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
                        <span className="shrink-0 font-medium text-[#6b7280]">
                          {statusInfo.length}/{TICKET_LENGTH}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {manualError && (
                <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-center text-[11px] font-medium text-red-600">
                  {manualError}
                </p>
              )}

              {/* Summary Footer */}
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#eef2f8] pt-2.5">
                <div className="flex min-w-0 items-center gap-1.5 text-[11px]">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      isTicketValid ? "bg-emerald-500" : "bg-[#f08a25]"
                    }`}
                  />
                  <span
                    className={`truncate ${
                      isTicketValid
                        ? "font-bold text-emerald-700"
                        : "text-[#4b5563]"
                    }`}
                  >
                    {isTicketValid
                      ? `All ${ticketCodes.length} Ticket Numbers Ready`
                      : `Fill all ${ticketCodes.length} ticket number inputs`}
                  </span>
                </div>
                <span className="shrink-0 rounded-full border border-[#ed1d43]/30 bg-[#fff0f2] px-2.5 py-1 text-[11px] font-extrabold text-[#ed1d43]">
                  {quantity} Tickets Selected
                </span>
              </div>
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
                      disabled={depositLoading || isChecking}
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
            selectedNumber={ticketCodes[0] || ""}
            onSelectNumber={(code) =>
              setTicketCodes((prev) => {
                const next = [...prev];
                next[0] = code;
                return next;
              })
            }
          />

          {/* ================= QUICK TICKET VERIFICATION WIDGET ================= */}
          <QuickVerifyTicket
            defaultMode="festival"
            title="Verify Festival Bumper Ticket"
            subtitle="Check if your festival ticket is a jackpot winner"
          />

          {/* ================= HOW TO PLAY VIDEO TUTORIAL ================= */}
          {/* <LotteryVideoPlayer /> */}

          {/* ================= WINNING RULES ================= */}
          <section className="overflow-hidden rounded-[18px] bg-gradient-to-br from-[#3a0b17] via-[#2b0a16] to-[#1a0710] p-2.5 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <div className="flex min-w-0 items-center gap-2">
                <ScrollText size={26} className="shrink-0 text-[#ffd34e]" />
                <h2 className="text-[15px] font-extrabold leading-tight text-white">
                  {festival?.name || marketName} Festival Lottery Winning Rules
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
                <Banknote size={30} className="shrink-0 text-[#ffd34e]" />
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
                  {winningRules.map((rule, index) => {
                    const { key: ruleKey, ...ruleProps } = rule;
                    return (
                      <RuleRow
                        key={ruleKey || rule.number || index}
                        {...ruleProps}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* ================= BOTTOM PURCHASE BAR ================= */}
      {(festival || purchaseConfig) && (
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
                  {totalTickets} Tickets • {drawDateText || "Festival Draw"}{" "}
                  <br />
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
              <span>
                {isChecking
                  ? "Checking..."
                  : depositLoading
                    ? "Processing..."
                    : "Purchase Now"}
              </span>
              {!depositLoading && !isChecking && (
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

const FestivalTab = ({ festival, active, disabled, onClick, innerRef }) => {
  const Icon = festival?.icon || Sparkles;
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [festival?.imageUrl]);

  const showImage = Boolean(festival?.imageUrl) && !imgFailed;

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
            src={festival?.imageUrl}
            alt={`${festival?.name || "Festival"} lottery`}
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
        <span className="block truncate">
          {festival?.tab || festival?.name || "Festival"}
        </span>
        <span className="block">Lottery</span>
      </span>
    </button>
  );
};

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
