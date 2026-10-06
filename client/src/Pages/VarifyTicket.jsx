import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  Download,
  FileText,
  Gift,
  Info,
  RefreshCw,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Trophy,
  X,
  XCircle,
  Zap,
} from "lucide-react";

import {
  checkNumber,
  clearCheckResult,
  clearResultMessage,
  selectLotteryCheckLoading,
  selectLotteryCheckResult,
  selectLotteryError,
} from "../reducer/slice/lotteryResultReducer";

// =====================================================
// CONSTANTS
// =====================================================

const BOTTOM_NAV_HEIGHT = 64;

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1605196560547-b2f7281b7355?auto=format&fit=crop&w=1400&q=80";

const EXAMPLES = ["10F68057", "12A12345", "91D44732", "32B90814"];

// 8-character lottery ticket regex (2 digits, 1 letter, 5 digits e.g. 10F68057 or any 8-char alphanumeric)
const TICKET_REGEX = /^[0-9A-Z]{8}$/;

// =====================================================
// HELPERS
// =====================================================

const normalize = (v) => String(v || "").toUpperCase().replace(/\s+/g, "");

// Format stub: 10F68057 -> "10F 68057"
const formatStubNumber = (n) => {
  const v = String(n || "");
  return v.length > 5 ? `${v.slice(0, -5)} ${v.slice(-5)}` : v;
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const VarifyTicket = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("daily"); // "daily" | "festival"
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // Modals for help & rules
  const [showHowToCheck, setShowHowToCheck] = useState(false);
  const [showPrizeRules, setShowPrizeRules] = useState(false);

  // Redux selectors
  const checkLoading = useSelector(selectLotteryCheckLoading);
  const checkResult = useSelector(selectLotteryCheckResult);
  const checkError = useSelector(selectLotteryError);

  // Recent searches saved in localStorage
  const [recent, setRecent] = useState(() => {
    try {
      const saved = localStorage.getItem("recent_ticket_searches");
      return saved ? JSON.parse(saved) : ["10F68057", "12A12345", "32B90814"];
    } catch {
      return ["10F68057", "12A12345", "32B90814"];
    }
  });

  // Local verified result object
  const [result, setResult] = useState(null);

  // Sync Redux checkResult with local state
  useEffect(() => {
    if (checkResult) {
      if (checkResult.winner || checkResult.status === "win") {
        setResult({
          status: "win",
          ticketNumber: checkResult.ticketNumber || checkResult.userNumber || input,
          prizeLabel: checkResult.prizeLabel || "1st Prize",
          prizeAmount: checkResult.prizeAmount || "₹1,00,00,000",
          prizeSub: checkResult.prizeSub || "(Winning Prize)",
          drawDate: checkResult.drawDate || "Official Draw",
          drawDay: checkResult.drawDay || "",
          drawTime: checkResult.drawTime || "8:00 PM",
          lotteryName:
            checkResult.lotteryName ||
            (activeTab === "festival" ? "Dear Festival Lottery" : "Dear Daily Lottery"),
          winningNumber: checkResult.winningNumber || null,
          matchedDigits: checkResult.matchedDigits || null,
        });
      } else {
        setResult({
          status: "loss",
          ticketNumber: checkResult.ticketNumber || checkResult.userNumber || input,
          drawDate: checkResult.drawDate || "Recent Draw",
          drawDay: checkResult.drawDay || "",
          drawTime: checkResult.drawTime || "8:00 PM",
          lotteryName:
            checkResult.lotteryName ||
            (activeTab === "festival" ? "Dear Festival Lottery" : "Dear Daily Lottery"),
          message:
            checkResult.message ||
            "Better luck next time! This ticket number is not among the winning numbers for published draws.",
        });
      }
    }
  }, [checkResult, activeTab, input]);

  // Handle server error
  useEffect(() => {
    if (checkError) {
      setInputError(typeof checkError === "string" ? checkError : "Verification failed");
    }
  }, [checkError]);

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // -----------------------------------------------
  // VERIFY ACTION
  // -----------------------------------------------
  const handleVerify = async () => {
    const value = normalize(input);

    if (!value) {
      setInputError("Please enter a ticket number");
      setResult(null);
      return;
    }

    if (!TICKET_REGEX.test(value)) {
      setInputError("Invalid format. Please enter an 8-character ticket (e.g. 10F68057)");
      setResult(null);
      return;
    }

    setInputError("");
    dispatch(clearResultMessage());
    dispatch(clearCheckResult());

    // Update recent searches
    const updated = [value, ...recent.filter((r) => r !== value)].slice(0, 6);
    setRecent(updated);
    try {
      localStorage.setItem("recent_ticket_searches", JSON.stringify(updated));
    } catch {}

    // Dispatch real backend API call
    dispatch(
      checkNumber({
        userNumber: value,
        ticketNumber: value,
        type: activeTab,
      })
    );
  };

  const pickNumber = (value) => {
    setInput(value);
    setInputError("");
    setResult(null);
    dispatch(clearCheckResult());
  };

  const clearRecent = () => {
    setRecent([]);
    try {
      localStorage.removeItem("recent_ticket_searches");
    } catch {}
  };

  // -----------------------------------------------
  // DOWNLOAD / SHARE
  // -----------------------------------------------
  const handleDownload = () => {
    if (!result) return;

    const isWin = result.status === "win";
    const text = `====================================
DEAR LOTTERY VERIFICATION SLIP
====================================
Ticket Number: ${result.ticketNumber}
Category: ${activeTab === "festival" ? "Festival Bumper" : "Daily Draw"}
Draw Date: ${result.drawDate} ${result.drawDay}
Draw Time: ${result.drawTime}
Status: ${isWin ? "CONGRATULATIONS - WINNER" : "NOT A WINNER"}
Prize Won: ${isWin ? result.prizeLabel : "None"}
Prize Amount: ${isWin ? result.prizeAmount : "₹0"}
====================================
Verified at: ${new Date().toLocaleString("en-IN")}
====================================`;

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ticket-${result.ticketNumber}-result.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage("Verification slip downloaded!");
  };

  const handleShare = async () => {
    if (!result) return;
    const isWin = result.status === "win";
    const text = isWin
      ? `🎉 WINNER! My Ticket ${result.ticketNumber} won ${result.prizeLabel} (${result.prizeAmount}) on ${result.lotteryName}!`
      : `Ticket ${result.ticketNumber} verification checked for ${result.lotteryName}.`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "Lottery Ticket Verification", text });
      } else {
        await navigator.clipboard.writeText(text);
        setToastMessage("Result copied to clipboard!");
      }
    } catch {}
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#eef3fa] text-[#173e70]">
      <div
        className="relative mx-auto w-full max-w-[500px] overflow-x-hidden"
        style={{ paddingBottom: BOTTOM_NAV_HEIGHT + 24 }}
      >
        {/* ================= HERO BANNER ================= */}
        <section
          className="relative overflow-hidden bg-[#3b0a14] bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#2a0610]/95 via-[#4a0b18]/85 to-[#2a0610]/70" />
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

          <div className="relative grid grid-cols-[1.1fr_1fr] items-center gap-2 px-3 pb-9 pt-5">
            <div className="min-w-0">
              <h1 className="bg-gradient-to-b from-[#fff1a8] to-[#e0a11b] bg-clip-text font-serif text-[28px] font-black leading-[0.95] text-transparent">
                VERIFY
                <br />
                YOUR TICKET
              </h1>
              <p className="mt-2 text-[11.5px] font-medium leading-tight text-white/90">
                Check if your ticket number is a winner in official draws
              </p>

              <div className="mt-3 grid grid-cols-4 gap-1">
                <TrustBadge icon={<ShieldCheck size={16} />} label="100%" sub="Official" />
                <TrustBadge icon={<Zap size={16} />} label="Instant" sub="Verified" />
                <TrustBadge icon={<BarChart3 size={16} />} label="Accurate" sub="Result" />
                <TrustBadge icon={<Clock size={16} />} label="Real Time" sub="Updates" />
              </div>
            </div>

            <div className="relative flex items-center justify-center pr-2">
              <div className="relative -rotate-6 rounded-xl border-2 border-[#e0b24a] bg-gradient-to-br from-[#fff8e6] to-[#ffe9b8] p-2.5 shadow-[0_15px_30px_rgba(0,0,0,0.45)]">
                <p className="text-[18px] font-black leading-none text-[#d7193f]">DEAR</p>
                <p className="text-[8px] font-bold text-[#153c78]">
                  {activeTab === "festival" ? "FESTIVAL BUMPER" : "DAILY LOTTERY"}
                </p>
                <p className="mt-1 text-[7px] text-[#5a4a2a]">Top Jackpot</p>
                <p className="text-[16px] font-black leading-none text-[#153c78]">₹1 CRORE</p>
                <p className="mt-1 whitespace-nowrap text-[9px] font-black tracking-[0.15em] text-[#173e70]">
                  10F 68057
                </p>
                <span className="absolute -right-2 -top-2 rounded-full bg-[#d7198c] px-2 py-[3px] text-[8px] font-black text-white">
                  ₹20/-
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= TABS ================= */}
        <section className="relative z-10 -mt-6 px-2">
          <div className="grid grid-cols-2 gap-1.5">
            <TabButton
              active={activeTab === "daily"}
              onClick={() => {
                setActiveTab("daily");
                setResult(null);
                setInputError("");
              }}
              icon={<Crown size={18} />}
              label="DEAR DAILY LOTTERY"
            />
            <TabButton
              active={activeTab === "festival"}
              onClick={() => {
                setActiveTab("festival");
                setResult(null);
                setInputError("");
              }}
              icon={<Gift size={18} />}
              label="DEAR FESTIVAL LOTTERY"
            />
          </div>
        </section>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-[#173e70] px-4 py-2 text-xs font-bold text-white shadow-xl animate-in fade-in">
            {toastMessage}
          </div>
        )}

        <main className="space-y-3 px-2 pt-3">
          {/* ================= ENTER TICKET ================= */}
          <section className="rounded-[16px] bg-white p-3.5 shadow-sm border border-[#e2e5f0]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#ff1744] to-[#c9102f] text-white">
                  <Search size={18} strokeWidth={2.4} />
                </span>
                <h2 className="text-[16px] font-extrabold text-[#173e70]">
                  Enter Ticket Number
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowHowToCheck(true)}
                className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-[#c9d3e3] px-2 py-1.5 text-[11px] font-semibold text-[#173e70] hover:bg-gray-50"
              >
                <Info size={12} /> How to Check?
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => {
                  setInput(
                    e.target.value
                      .toUpperCase()
                      .replace(/[^0-9A-Z]/g, "")
                      .slice(0, 8)
                  );
                  setInputError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                placeholder="Enter 8-digit ticket (e.g. 10F68057)"
                maxLength={8}
                disabled={checkLoading}
                className="h-[46px] min-w-0 flex-1 rounded-xl border border-[#dfe5f0] bg-[#f6f9fe] px-3 text-[14px] font-bold tracking-wider text-[#173e70] outline-none placeholder:text-[12px] placeholder:font-normal placeholder:tracking-normal placeholder:text-[#8a97ab] focus:border-[#ed1d43] focus:bg-white focus:shadow-[0_0_0_3px_rgba(237,29,67,0.12)] disabled:opacity-50"
              />

              <button
                type="button"
                onClick={handleVerify}
                disabled={checkLoading || !input.trim()}
                className="flex h-[46px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-r from-[#ff1744] to-[#e0102f] px-4 text-[13px] font-extrabold text-white shadow-[0_6px_18px_rgba(255,20,67,0.4)] transition active:scale-95 disabled:opacity-50"
              >
                {checkLoading ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Ticket</span>
                    <ChevronRight size={15} strokeWidth={3} />
                  </>
                )}
              </button>
            </div>

            {inputError && (
              <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-center text-[12px] font-medium text-red-600">
                {inputError}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <span className="text-[11.5px] font-medium text-[#4b5563]">Quick Try:</span>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => pickNumber(ex)}
                  className="rounded-md border border-[#dfe5f0] bg-[#f6f9fe] px-2 py-1 text-[11.5px] font-bold text-[#173e70] active:border-[#ed1d43] active:text-[#ed1d43] hover:bg-[#FFEFA8]/40"
                >
                  {ex}
                </button>
              ))}
            </div>
          </section>

          {/* ================= RECENT SEARCHES ================= */}
          <section className="rounded-[16px] bg-white p-3 shadow-sm border border-[#e2e5f0]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-[#ed1d43]" />
                <h2 className="text-[15px] font-extrabold text-[#173e70]">
                  Recent Searches
                </h2>
              </div>

              {recent.length > 0 && (
                <button
                  type="button"
                  onClick={clearRecent}
                  className="shrink-0 whitespace-nowrap rounded-lg border border-[#ed1d43]/50 px-2.5 py-1 text-[11px] font-semibold text-[#ed1d43] hover:bg-red-50"
                >
                  Clear All
                </button>
              )}
            </div>

            {recent.length === 0 ? (
              <p className="mt-3 text-center text-[12px] text-[#6b7280]">
                No recent searches yet
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {recent.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => pickNumber(r)}
                    className="rounded-lg border border-[#dfe5f0] bg-[#f6f9fe] px-2.5 py-1.5 text-[11.5px] font-bold text-[#173e70] active:border-[#ed1d43] active:text-[#ed1d43] hover:bg-gray-100"
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* ================= VERIFICATION RESULT CARD ================= */}
          {result && (
            <ResultCard
              result={result}
              onDownload={handleDownload}
              onShare={handleShare}
            />
          )}

          {/* ================= ACTION GRID ================= */}
          <section className="grid grid-cols-2 min-[401px]:grid-cols-4 gap-1.5">
            <ActionTile
              icon={<Calendar size={18} />}
              title="View All Results"
              sub="Check past charts"
              tone="bg-[#ed1d43]"
              onClick={() => navigate("/results")}
            />

            <ActionTile
              icon={<Trophy size={18} />}
              title="Prize Structure"
              sub="See winning rules"
              tone="bg-[#8c4bd6]"
              onClick={() => setShowPrizeRules(true)}
            />

            <ActionTile
              icon={<FileText size={18} />}
              title="Download Slip"
              sub="Verification summary"
              tone="bg-[#20a66a]"
              onClick={handleDownload}
            />

            <ActionTile
              icon={<Share2 size={18} />}
              title="Share Results"
              sub="With your friends"
              tone="bg-[#f08a25]"
              onClick={handleShare}
            />
          </section>

          {/* ================= IMPORTANT INFO ================= */}
          <section className="rounded-[16px] bg-white p-3.5 shadow-sm border border-[#e2e5f0]">
            <div className="flex items-start gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ed1d43] text-white">
                <Info size={15} />
              </span>

              <div className="min-w-0">
                <p className="text-[14px] font-extrabold text-[#173e70]">
                  Official Draw Information
                </p>
                <p className="mt-1 text-[12px] leading-snug text-[#4b5563]">
                  All ticket checks are computed directly against officially announced and published winning draw numbers in the database.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* ================= HOW TO CHECK MODAL ================= */}
      {showHowToCheck && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowHowToCheck(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-sm font-black text-[#173e70]">
                <Info size={18} className="text-[#ed1d43]" />
                <span>How to Check Your Ticket</span>
              </div>
              <button
                onClick={() => setShowHowToCheck(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-3 space-y-2.5 text-xs text-[#4b5563] leading-relaxed">
              <p>
                <strong>1. Ticket Format:</strong> Dear Lottery tickets are 8 characters long, consisting of 2 digits, 1 series letter, and 5 number digits.
              </p>
              <div className="rounded-xl bg-[#f6f9fe] p-3 text-center font-mono text-sm font-black text-[#173e70]">
                10F 68057
              </div>
              <p>
                <strong>2. Prize Matching Rules:</strong>
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>1st Prize:</strong> Exact 8-character match.</li>
                <li><strong>2nd Prize:</strong> Matching first 7 or last 7 digits.</li>
                <li><strong>3rd Prize:</strong> Matching first 5, middle 5, or last 5 digits.</li>
              </ul>
            </div>

            <button
              onClick={() => setShowHowToCheck(false)}
              className="mt-4 w-full rounded-xl bg-[#173e70] py-2.5 text-xs font-bold text-white"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ================= PRIZE STRUCTURE MODAL ================= */}
      {showPrizeRules && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowPrizeRules(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-sm font-black text-[#173e70]">
                <Trophy size={18} className="text-[#E39A00]" />
                <span>Dear Lottery Prize Rules</span>
              </div>
              <button
                onClick={() => setShowPrizeRules(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5">
                <p className="text-xs font-black text-amber-900">🥇 1st Prize — ₹1 Crore</p>
                <p className="text-[11px] text-amber-800 mt-0.5">All 8 characters must match the winning number exactly.</p>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-2.5">
                <p className="text-xs font-black text-blue-900">🥈 2nd Prize — ₹9,000</p>
                <p className="text-[11px] text-blue-800 mt-0.5">Matches the first 7 or last 7 digits of the winning number.</p>
              </div>

              <div className="rounded-xl border border-purple-200 bg-purple-50 p-2.5">
                <p className="text-xs font-black text-purple-900">🥉 3rd Prize — ₹450</p>
                <p className="text-[11px] text-purple-800 mt-0.5">Matches the first 5, middle 5, or last 5 digits of the winning number.</p>
              </div>
            </div>

            <button
              onClick={() => setShowPrizeRules(false)}
              className="mt-4 w-full rounded-xl bg-[#173e70] py-2.5 text-xs font-bold text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// =====================================================
// SUB COMPONENTS
// =====================================================

const TrustBadge = ({ icon, label, sub }) => (
  <div className="flex min-w-0 flex-col items-center gap-0.5 text-center">
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-b from-[#fff1a8] to-[#e0a11b] text-[#3b0a14]">
      {icon}
    </span>
    <span className="text-[9px] font-black leading-tight text-white">{label}</span>
    <span className="text-[9px] leading-tight text-white/80">{sub}</span>
  </div>
);

const TabButton = ({ active, onClick, icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-1.5 py-3 text-center text-[11px] font-extrabold leading-tight shadow-md transition active:scale-[0.98] ${
      active
        ? "bg-gradient-to-b from-[#ff1744] to-[#c9102f] text-white"
        : "bg-[#fffaf4] text-[#173e70]"
    }`}
  >
    <span className={`shrink-0 ${active ? "text-[#ffd34e]" : "text-[#ed1d43]"}`}>
      {icon}
    </span>
    {label}
  </button>
);

const ActionTile = ({ icon, title, sub, tone, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex min-w-0 items-center gap-1.5 rounded-xl bg-white p-2 text-left shadow-sm border border-[#e2e5f0] transition active:scale-[0.97] hover:bg-gray-50"
  >
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${tone}`}
    >
      {icon}
    </span>
    <span className="min-w-0">
      <span className="block break-words text-[10px] font-extrabold leading-tight text-[#173e70]">
        {title}
      </span>
      <span className="mt-0.5 block break-words text-[8.5px] leading-tight text-[#4b5563]">
        {sub}
      </span>
    </span>
  </button>
);

// -----------------------------------------------------
// RESULT CARD (WINNER / LOSER)
// -----------------------------------------------------

const ResultCard = ({ result, onDownload, onShare }) => {
  const isWin = result.status === "win";

  return (
    <section
      className={`overflow-hidden rounded-[16px] shadow-sm animate-in fade-in ${
        isWin
          ? "border-2 border-[#20a66a]/50 bg-gradient-to-br from-[#e9f8f0] via-white to-[#f2fff7]"
          : "border-2 border-[#ed1d43]/30 bg-gradient-to-br from-[#fff0f2] via-white to-[#fff5f6]"
      }`}
    >
      {isWin ? <WinnerContent result={result} /> : <LoserContent result={result} />}

      <div className="flex items-center justify-end gap-2 border-t border-[#e2e5f0] bg-[#f6f9fe] px-3 py-2">
        <button
          type="button"
          onClick={onDownload}
          className="flex items-center gap-1 rounded-lg border border-[#c9d3e3] bg-white px-3 py-1.5 text-[11.5px] font-semibold text-[#173e70] hover:bg-gray-50"
        >
          <Download size={13} /> Download Slip
        </button>
        <button
          type="button"
          onClick={onShare}
          className="flex items-center gap-1 rounded-lg bg-[#ed1d43] px-3 py-1.5 text-[11.5px] font-bold text-white shadow-sm hover:brightness-105"
        >
          <Share2 size={13} /> Share
        </button>
      </div>
    </section>
  );
};

// -----------------------------------------------------
// WINNER CARD
// -----------------------------------------------------

const WinnerContent = ({ result }) => (
  <div className="p-3.5">
    <div className="grid grid-cols-[auto_1fr] items-center gap-3">
      <TicketStub number={result.ticketNumber} />

      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Trophy size={28} className="shrink-0 text-[#e0a11b]" fill="#ffd34e" />
            <p className="font-serif text-[22px] font-black leading-none text-[#20a66a]">
              WINNER!
            </p>
          </div>
          <p className="mt-1 text-[12px] font-bold text-[#173e70]">
            {result.prizeLabel}
          </p>
          <p className="whitespace-nowrap text-[22px] font-black leading-tight text-[#d7193f]">
            {result.prizeAmount}
          </p>
        </div>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#20a66a] text-white shadow">
          <CheckCircle2 size={22} strokeWidth={2.5} />
        </span>
      </div>
    </div>

    <div className="mt-3 grid grid-cols-4 gap-1 rounded-xl bg-white p-2.5 shadow-sm border border-[#e2e5f0]">
      <MetaItem label="Ticket Number" value={result.ticketNumber} />
      <MetaItem label="Draw Date" value={result.drawDate} sub={result.drawDay} />
      <MetaItem label="Draw Time" value={result.drawTime} />
      <MetaItem label="Lottery" value={result.lotteryName} />
    </div>
  </div>
);

// -----------------------------------------------------
// LOSER CARD
// -----------------------------------------------------

const LoserContent = ({ result }) => (
  <div className="p-3.5">
    <div className="grid grid-cols-[auto_1fr] items-center gap-3">
      <TicketStub number={result.ticketNumber} faded />

      <div className="flex min-w-0 items-start gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ed1d43] text-white shadow">
          <XCircle size={22} strokeWidth={2.5} />
        </span>

        <div className="min-w-0">
          <p className="font-serif text-[18px] font-black leading-none text-[#d7193f]">
            NOT A WINNER
          </p>
          <p className="mt-1 text-[12px] font-bold text-[#173e70]">
            Better luck next time!
          </p>
          <p className="mt-1 text-[11px] leading-snug text-[#4b5563]">
            {result.message || "This ticket number is not among the winning numbers for the published draws."}
          </p>
        </div>
      </div>
    </div>

    <div className="mt-3 flex items-center justify-between rounded-xl bg-white p-2.5 text-xs text-[#6b7280] border border-[#e2e5f0]">
      <span>Checked Ticket: <strong className="text-[#173e70]">{result.ticketNumber}</strong></span>
      <span>Lottery: <strong className="text-[#173e70]">{result.lotteryName}</strong></span>
    </div>
  </div>
);

// -----------------------------------------------------
// TICKET STUB
// -----------------------------------------------------

const TicketStub = ({ number, faded = false }) => (
  <div
    className={`relative w-[104px] shrink-0 -rotate-3 rounded-lg border-2 bg-gradient-to-br from-[#fff8e6] to-[#ffe9b8] p-2 shadow-md ${
      faded ? "border-[#e5c8a4] opacity-80" : "border-[#e0b24a]"
    }`}
  >
    <p className="text-[16px] font-black leading-none text-[#d7193f]">DEAR</p>
    <p className="text-[7.5px] font-bold text-[#153c78]">LOTTERY</p>

    <p className="mt-1 text-[6.5px] text-[#5a4a2a]">Top Jackpot</p>
    <p className="text-[13px] font-black leading-none text-[#153c78]">₹1 CRORE</p>

    <p className="mt-1 whitespace-nowrap text-[10px] font-black tracking-wider text-[#173e70]">
      {formatStubNumber(number)}
    </p>

    <span className="absolute -right-2 -top-2 rounded-full bg-[#d7198c] px-1.5 py-[2px] text-[7.5px] font-black text-white">
      ₹20/-
    </span>
  </div>
);

// -----------------------------------------------------
// META ITEM
// -----------------------------------------------------

const MetaItem = ({ label, value, sub }) => (
  <div className="min-w-0 text-center">
    <p className="break-words text-[8.5px] font-semibold leading-tight text-[#6b7280]">
      {label}
    </p>
    <p className="mt-0.5 break-words text-[10px] font-extrabold leading-tight text-[#173e70]">
      {value}
    </p>
    {sub && (
      <p className="break-words text-[8px] leading-tight text-[#6b7280]">{sub}</p>
    )}
  </div>
);

export default VarifyTicket;