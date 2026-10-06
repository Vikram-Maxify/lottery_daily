import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Flame,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  XCircle,
  Zap,
} from "lucide-react";

import {
  checkNumberAvailability,
  fetchAvailableNumbers,
  fetchSampleLuckyNumbers,
  selectAvailableDailyNumbers,
  selectDailyNumberCheckLoading,
  selectDailyNumberCheckResult,
  selectDailyNumbersLoading,
  selectDailyNumbersSampleLoading,
  selectDailyNumbersTotal,
  selectSampleLuckyNumbers,
  setSelectedDailyNumber,
} from "../reducer/slice/dailyNumberSlice";

// =====================================================
// HELPER: Split ticket code
// Format: 2 digits + 1 letter + 5 digits
// =====================================================

const splitCode = (code) => {
  const clean = String(code || "").toUpperCase();

  if (clean.length < 3) {
    return {
      prefix: clean,
      letter: "",
      suffix: "",
    };
  }

  return {
    prefix: clean.slice(0, 2),
    letter: clean.slice(2, 3),
    suffix: clean.slice(3),
  };
};

// =====================================================
// HELPER: Fisher-Yates shuffle (pure, non-mutating)
// =====================================================

const shuffleArray = (arr) => {
  const a = Array.isArray(arr) ? [...arr] : [];

  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }

  return a;
};

// =====================================================
// DAILY NUMBERS SECTION
// =====================================================

const DailyNumbersSection = ({
  mode = "home", // "home" | "buyTicket" | "festival"
  onSelectNumber = null,
  selectedNumber = "",
  compact = false,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // =====================================================
  // REDUX SELECTORS
  // =====================================================

  const availableNumbers = useSelector(selectAvailableDailyNumbers);
  const sampleNumbers = useSelector(selectSampleLuckyNumbers);
  const loading = useSelector(selectDailyNumbersLoading);
  const sampleLoading = useSelector(selectDailyNumbersSampleLoading);
  const totalAvailable = useSelector(selectDailyNumbersTotal);
  const checkResult = useSelector(selectDailyNumberCheckResult);
  const checkLoading = useSelector(selectDailyNumberCheckLoading);

  // =====================================================
  // LOCAL STATE
  // =====================================================

  const [searchQuery, setSearchQuery] = useState("");
  const [customCheckInput, setCustomCheckInput] = useState("");
  const [copiedCode, setCopiedCode] = useState(null);
  const [activeTab, setActiveTab] = useState("lucky");

  // Initially show only 10 numbers.
  // Clicking View All will reveal the rest.
  const [showAllNumbers, setShowAllNumbers] = useState(false);

  // 👇 Shuffle trigger: har click pe increment hoga
  // aur useMemo ko force re-run karega
  const [shuffleSeed, setShuffleSeed] = useState(0);

  // =====================================================
  // FETCH INITIAL DATA
  // =====================================================

  useEffect(() => {
    dispatch(fetchSampleLuckyNumbers(10));

    dispatch(
      fetchAvailableNumbers({
        limit: 100,
      }),
    );
  }, [dispatch]);

  // =====================================================
  // RESET VIEW WHEN TAB CHANGES
  // =====================================================

  useEffect(() => {
    setShowAllNumbers(false);
  }, [activeTab]);

  // =====================================================
  // NUMBERS TO DISPLAY
  // =====================================================

  const displayNumbers = useMemo(() => {
    // ---------------------------------------------------
    // SEARCH MODE
    // ---------------------------------------------------

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toUpperCase();

      const combined = [...sampleNumbers, ...availableNumbers];

      const seen = new Set();
      const filtered = [];

      for (const item of combined) {
        const num = typeof item === "string" ? item : item?.number;

        if (num && num.includes(q) && !seen.has(num)) {
          seen.add(num);
          filtered.push(item);
        }
      }

      // Search results can show all matching numbers
      // when View All is enabled, otherwise max 20.
      return showAllNumbers ? filtered : filtered.slice(0, 10);
    }

    // ---------------------------------------------------
    // LUCKY PICKS
    // ---------------------------------------------------

    if (activeTab === "lucky" && sampleNumbers.length > 0) {
      const shuffled = shuffleArray(sampleNumbers);
      return showAllNumbers ? shuffled : shuffled.slice(0, 10);
    }

    // ---------------------------------------------------
    // ALL AVAILABLE
    // ---------------------------------------------------

    const shuffled = shuffleArray(availableNumbers);
    return showAllNumbers ? shuffled : shuffled.slice(0, 10);
  }, [
    activeTab,
    sampleNumbers,
    availableNumbers,
    searchQuery,
    showAllNumbers,
    shuffleSeed, // 👈 force re-shuffle on button click
  ]);

  // =====================================================
  // WHETHER MORE NUMBERS ARE AVAILABLE
  // =====================================================

  const hasMoreNumbers = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toUpperCase();

      const combined = [...sampleNumbers, ...availableNumbers];

      const seen = new Set();

      let count = 0;

      for (const item of combined) {
        const num = typeof item === "string" ? item : item?.number;

        if (num && num.includes(q) && !seen.has(num)) {
          seen.add(num);
          count++;
        }
      }

      return count > 10;
    }

    if (activeTab === "lucky" && sampleNumbers.length > 0) {
      return sampleNumbers.length > 10;
    }

    return availableNumbers.length > 10;
  }, [activeTab, sampleNumbers, availableNumbers, searchQuery]);

  // =====================================================
  // SHUFFLE
  // =====================================================

  const handleShuffle = () => {
    // After shuffle start again from first 10
    setShowAllNumbers(false);

    // 👇 Trigger local shuffle on both Lucky + All Available
    setShuffleSeed((s) => s + 1);

    // 👇 Also ask backend for a fresh set of lucky picks
    // so numbers actually change (not just order)
    dispatch(fetchSampleLuckyNumbers(10));

    // 👇 Refetch available pool so "All Available" bhi
    // naye random order me aaye
    dispatch(
      fetchAvailableNumbers({
        limit: 100,
      }),
    );
  };

  // =====================================================
  // CHECK CUSTOM NUMBER
  // =====================================================

  const handleCheckCustom = (e) => {
    e?.preventDefault();

    if (!customCheckInput.trim()) return;

    dispatch(checkNumberAvailability(customCheckInput.trim()));
  };

  // =====================================================
  // SELECT NUMBER
  // =====================================================

  const handlePickNumber = (code) => {
    if (!code) return;

    dispatch(setSelectedDailyNumber(code));

    if (onSelectNumber) {
      onSelectNumber(code);
    } else {
      // Home mode → Buy Ticket
      navigate(`/buy-ticket?number=${encodeURIComponent(code)}`);
    }
  };

  // =====================================================
  // COPY NUMBER
  // =====================================================

  const handleCopy = (code, e) => {
    e.stopPropagation();

    navigator.clipboard?.writeText(code);

    setCopiedCode(code);

    setTimeout(() => {
      setCopiedCode(null);
    }, 1500);
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <section
      className={`relative overflow-hidden rounded-[20px] border border-[#f3e3be] bg-gradient-to-b from-[#fffef9] via-[#fffbf0] to-[#fff6e3] p-3.5 shadow-sm sm:p-5 ${
        compact ? "my-2" : "my-4"
      }`}
    >
      {/* Decorative background glow */}

      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#f7b500]/15 blur-3xl" />

      <div className="pointer-events-none absolute -left-16 -bottom-16 h-44 w-44 rounded-full bg-[#ed1d43]/10 blur-3xl" />

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="relative flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ed1d43] via-[#ff4767] to-[#f7b500] text-white shadow-md shadow-red-500/20 sm:h-11 sm:w-11">
            <Flame size={22} className="animate-pulse" />
          </div>

          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate font-serif text-[16px] font-black tracking-tight text-[#173e70] sm:text-[18px]">
                {mode === "festival"
                  ? "Festival Lucky Numbers"
                  : "Today's Lucky Numbers"}
              </h3>

              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-[#f59e0b]/40 bg-[#fef3c7] px-2 py-0.5 text-[9.5px] font-extrabold text-[#b45309]">
                <Sparkles size={10} />
                Live
              </span>
            </div>

            <p className="mt-0.5 truncate text-[11px] font-medium text-[#64748b]">
              {mode === "home"
                ? "Click any number to instantly play in Daily Lottery"
                : "Select a lucky number below to apply directly to your ticket"}
            </p>
          </div>
        </div>

        {/* Action Controls */}

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleShuffle}
            disabled={sampleLoading}
            className="flex h-8 items-center gap-1 rounded-lg border border-[#e2d4b5] bg-white px-2.5 text-[11px] font-bold text-[#173e70] shadow-sm transition hover:bg-[#fff9e6] active:scale-95 disabled:opacity-50"
            title="Shuffle lucky picks"
          >
            <RefreshCw
              size={12}
              className={sampleLoading ? "animate-spin text-[#ed1d43]" : ""}
            />

            <span className="hidden min-[380px]:inline">Shuffle</span>
          </button>
        </div>
      </div>

      {/* =====================================================
          SEARCH & TABS ROW
      ===================================================== */}

      <div className="relative mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#f3e3be]/80 pt-3">
        {/* Quick Filter Tabs */}

        <div className="flex items-center gap-1 rounded-lg bg-[#f1f4f9] p-0.5 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab("lucky");
              setSearchQuery("");
              setShowAllNumbers(false);
            }}
            className={`rounded-md px-2.5 py-1 transition ${
              activeTab === "lucky" && !searchQuery
                ? "bg-white text-[#ed1d43] shadow-sm"
                : "text-[#64748b] hover:text-[#173e70]"
            }`}
          >
            🔥 Lucky Picks
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("all");
              setSearchQuery("");
              setShowAllNumbers(false);
            }}
            className={`rounded-md px-2.5 py-1 transition ${
              activeTab === "all" && !searchQuery
                ? "bg-white text-[#173e70] shadow-sm"
                : "text-[#64748b] hover:text-[#173e70]"
            }`}
          >
            All Available (
            {totalAvailable > 0
              ? totalAvailable.toLocaleString("en-IN")
              : "Ready"}
            )
          </button>
        </div>

        {/* Search */}

        <div className="relative min-w-[130px] flex-1 sm:max-w-[210px]">
          <Search
            size={13}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8]"
          />

          <input
            type="text"
            placeholder="Search digits/letter..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value.toUpperCase());
              setShowAllNumbers(false);
            }}
            maxLength={8}
            className="h-8 w-full rounded-lg border border-[#e2d4b5] bg-white pl-7 pr-2 text-[11px] font-bold text-[#173e70] placeholder:text-[#94a3b8] outline-none transition focus:border-[#ed1d43] focus:ring-1 focus:ring-[#ed1d43]"
          />
        </div>
      </div>

      {/* =====================================================
          LUCKY NUMBERS GRID
      ===================================================== */}

      <div className="relative mt-3">
        {loading && displayNumbers.length === 0 ? (
          <div className="flex h-28 items-center justify-center">
            <RefreshCw size={20} className="animate-spin text-[#ed1d43]" />

            <span className="ml-2 text-xs font-semibold text-[#64748b]">
              Loading lucky numbers...
            </span>
          </div>
        ) : displayNumbers.length === 0 ? (
          <div className="flex h-24 flex-col items-center justify-center rounded-xl border border-dashed border-[#e2d4b5] bg-white/60 p-3 text-center">
            <p className="text-xs font-semibold text-[#64748b]">
              No numbers matched your search "{searchQuery}"
            </p>

            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setShowAllNumbers(false);
              }}
              className="mt-1 text-[11px] font-bold text-[#ed1d43] underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 min-[440px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-4">
              {displayNumbers.map((item, index) => {
                const code = typeof item === "string" ? item : item?.number;

                if (!code) return null;

                const { prefix, letter, suffix } = splitCode(code);

                const isSelected = selectedNumber === code;

                const isCopied = copiedCode === code;

                return (
                  <div
                    key={`${code}-${index}`}
                    onClick={() => handlePickNumber(code)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handlePickNumber(code);
                      }
                    }}
                    className={`group relative flex cursor-pointer select-none items-center justify-between overflow-hidden rounded-xl border-2 p-2 transition-all active:scale-[0.97] ${
                      isSelected
                        ? "border-[#ed1d43] bg-gradient-to-r from-[#fff0f2] to-[#ffe4e8] shadow-md shadow-red-500/15 ring-2 ring-[#ed1d43]/30"
                        : "border-[#eddcb2] bg-white shadow-sm hover:border-[#f7b500] hover:bg-[#fffdf8] hover:shadow"
                    }`}
                  >
                    {/* Left: split stylized code */}

                    <div className="flex items-baseline gap-0.5 font-mono leading-none">
                      <span className="text-[13px] font-extrabold text-[#b45309]">
                        {prefix}
                      </span>

                      <span className="rounded bg-[#ed1d43] px-1 py-0.5 text-[11px] font-black text-white">
                        {letter}
                      </span>

                      <span className="text-[14px] font-black tracking-wider text-[#173e70]">
                        {suffix}
                      </span>
                    </div>

                    {/* Right: action icon */}

                    <div className="flex items-center gap-1">
                      {isSelected ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ed1d43] text-white">
                          <Check size={11} strokeWidth={3} />
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleCopy(code, e)}
                          title="Copy number"
                          className="text-[#94a3b8] transition-opacity hover:text-[#173e70] sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          {isCopied ? (
                            <Check size={12} className="text-emerald-600" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Corner indicator */}

                    {isSelected && (
                      <span className="absolute -right-5 -top-5 h-8 w-8 rotate-45 bg-[#ed1d43]" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* =================================================
                VIEW ALL / SHOW LESS
            ================================================= */}

            {hasMoreNumbers && (
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowAllNumbers((prev) => !prev)}
                  className="group flex items-center gap-1.5 rounded-lg border border-[#e2d4b5] bg-white px-4 py-2 text-[11px] font-extrabold text-[#173e70] shadow-sm transition-all hover:border-[#f7b500] hover:bg-[#fff9e6] active:scale-95"
                >
                  {showAllNumbers ? "Show Less" : "View All"}

                  <ArrowRight
                    size={12}
                    className={`transition-transform ${
                      showAllNumbers ? "-rotate-90" : "rotate-90"
                    }`}
                  />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* =====================================================
          CHECK CUSTOM NUMBER
      ===================================================== */}

      <div className="mt-3.5 rounded-xl border border-[#ebd9b0] bg-white/80 p-2.5 sm:p-3">
        <form
          onSubmit={handleCheckCustom}
          className="flex flex-wrap items-center gap-2"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#173e70]">
            <Zap size={13} className="text-[#f59e0b]" />

            <span className="hidden min-[420px]:inline">
              Check Availability:
            </span>
          </div>

          <div className="flex min-w-[150px] flex-1 items-center gap-1.5">
            <input
              type="text"
              placeholder="e.g. 10A78965"
              value={customCheckInput}
              onChange={(e) =>
                setCustomCheckInput(e.target.value.toUpperCase())
              }
              maxLength={8}
              className="h-8 flex-1 rounded-lg border border-[#e2d4b5] bg-[#fffdf8] px-2.5 text-[12px] font-black tracking-wider text-[#173e70] placeholder:font-normal placeholder:tracking-normal placeholder:text-[#94a3b8] outline-none transition focus:border-[#ed1d43]"
            />

            <button
              type="submit"
              disabled={checkLoading || !customCheckInput.trim()}
              className="flex h-8 shrink-0 items-center gap-1 rounded-lg bg-gradient-to-r from-[#173e70] to-[#255ba0] px-3 text-[11px] font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {checkLoading ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                "Check"
              )}
            </button>
          </div>
        </form>

        {/* Check Result */}

        {checkResult && (
          <div
            className={`mt-2 flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${
              checkResult.canBet
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <div className="flex items-center gap-1.5">
              {checkResult.canBet ? (
                <CheckCircle2 size={14} className="text-emerald-600" />
              ) : (
                <XCircle size={14} className="text-red-600" />
              )}

              <span>{checkResult.message}</span>
            </div>

            {checkResult.canBet && (
              <button
                type="button"
                onClick={() => handlePickNumber(customCheckInput.trim())}
                className="rounded bg-emerald-600 px-2 py-0.5 text-[10.5px] font-extrabold text-white transition hover:bg-emerald-700"
              >
                Use this number →
              </button>
            )}
          </div>
        )}
      </div>

      {/* =====================================================
          BOTTOM FOOTER NOTE
      ===================================================== */}

      <div className="mt-2.5 flex items-center justify-between text-[10.5px] text-[#64748b]">
        <span className="flex items-center gap-1">
          <ShieldCheck size={12} className="text-[#10b981]" />
          Verified live daily numbers
        </span>

        {mode === "home" && (
          <button
            type="button"
            onClick={() => navigate("/buy-ticket")}
            className="flex items-center gap-0.5 font-bold text-[#ed1d43] hover:underline"
          >
            Play Daily Lottery
            <ArrowRight size={11} />
          </button>
        )}
      </div>
    </section>
  );
};

export default DailyNumbersSection;
