import React, { useState } from "react";
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
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";

// =====================================================
// CONSTANTS
// =====================================================

// ⚠️ Apne bottom navbar ki height (px) yahan daalo.
const BOTTOM_NAV_HEIGHT = 64;

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1605196560547-b2f7281b7355?auto=format&fit=crop&w=1400&q=80";

const EXAMPLES = ["10F68057", "7C34682", "91D44732"];
const RECENT_DEFAULT = ["10F68057", "77C34682", "32B90814", "19A55237", "91D44732"];

const TICKET_REGEX = /^[0-9A-Z]{2,3}[A-Z][0-9]{5}$/;

// Mock winners — real API se replace kar dena
const MOCK_WINNERS = {
  "10F68057": {
    status: "win",
    prizeLabel: "1st Prize",
    prizeAmount: "₹1,00,00,000",
    prizeSub: "(1 Crore)",
    drawDate: "26 Sep 2026",
    drawDay: "(Saturday)",
    drawTime: "8:00 PM",
    lotteryName: "Dear Daily Lottery",
  },
};

// =====================================================
// HELPERS
// =====================================================

const normalize = (v) => String(v || "").toUpperCase().replace(/\s+/g, "");

// Last 5 digits alag dikhao: 10F68057 -> "10F 68057", 7C34682 -> "7C 34682"
const formatStubNumber = (n) => {
  const v = String(n || "");
  return v.length > 5 ? `${v.slice(0, -5)} ${v.slice(-5)}` : v;
};

// =====================================================
// MAIN PAGE
// =====================================================

const VarifyTicket = () => {
  const [activeTab, setActiveTab] = useState("daily");
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState("");
  const [recent, setRecent] = useState(RECENT_DEFAULT);
  const [result, setResult] = useState(null);

  // -----------------------------------------------
  // VERIFY
  // -----------------------------------------------
  const handleVerify = () => {
    const value = normalize(input);

    if (!value) {
      setInputError("Please enter a ticket number");
      setResult(null);
      return;
    }

    if (!TICKET_REGEX.test(value)) {
      setInputError("Invalid format. Example: 10F68057");
      setResult(null);
      return;
    }

    setInputError("");

    setRecent((prev) => {
      const filtered = prev.filter((r) => r !== value);
      return [value, ...filtered].slice(0, 5);
    });

    const match = MOCK_WINNERS[value];
    if (match) {
      setResult({ ticketNumber: value, ...match });
    } else {
      setResult({ ticketNumber: value, status: "loss" });
    }
  };

  const pickNumber = (value) => {
    setInput(value);
    setInputError("");
    setResult(null);
  };

  const clearRecent = () => setRecent([]);

  // -----------------------------------------------
  // DOWNLOAD / SHARE
  // -----------------------------------------------
  const handleDownload = () => {
    if (!result) return;

    const text = `Ticket: ${result.ticketNumber}\nStatus: ${
      result.status === "win" ? "Winner" : "Not a Winner"
    }\nPrize: ${result.prizeAmount || "-"}`;

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ticket-${result.ticketNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!result) return;
    const text = `Ticket ${result.ticketNumber} — ${
      result.status === "win" ? `Winner! ${result.prizeAmount}` : "Not a winner"
    }`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Lottery Result", text });
      } else {
        await navigator.clipboard.writeText(text);
      }
    } catch {}
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#eef3fa] text-[#173e70]">
      <div
        className="relative mx-auto w-full max-w-[450px] overflow-x-hidden"
        style={{ paddingBottom: BOTTOM_NAV_HEIGHT + 24 }}
      >
        {/* ================= HERO BANNER ================= */}
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

          <div className="relative grid grid-cols-[1.1fr_1fr] items-center gap-2 px-3 pb-12 pt-5">
            <div className="min-w-0">
              <h1 className="bg-gradient-to-b from-[#fff1a8] to-[#e0a11b] bg-clip-text font-serif text-[30px] font-black leading-[0.95] text-transparent">
                VERIFY
                <br />
                YOUR TICKET
              </h1>
              <p className="mt-2 text-[11.5px] font-medium leading-tight text-white/90">
                Check if your ticket number is a winner
              </p>

              <div className="mt-3 grid grid-cols-4 gap-1">
                <TrustBadge icon={<ShieldCheck size={16} />} label="100%" sub="Official Results" />
                <TrustBadge icon={<Zap size={16} />} label="Instant" sub="Verification" />
                <TrustBadge icon={<BarChart3 size={16} />} label="Accurate" sub="& Secure" />
                <TrustBadge icon={<Clock size={16} />} label="Real Time" sub="Results" />
              </div>
            </div>

            <div className="relative flex items-center justify-center pr-2">
              <div className="relative -rotate-6 rounded-lg border-2 border-[#e0b24a] bg-gradient-to-br from-[#fff8e6] to-[#ffe9b8] p-2.5 shadow-[0_15px_30px_rgba(0,0,0,0.45)]">
                <p className="text-[18px] font-black leading-none text-[#d7193f]">DEAR</p>
                <p className="text-[8px] font-bold text-[#153c78]">DAILY LOTTERY</p>
                <p className="mt-1 text-[7px] text-[#5a4a2a]">First Prize</p>
                <p className="text-[16px] font-black leading-none text-[#153c78]">₹1 CRORE</p>
                <p className="mt-1 whitespace-nowrap text-[9px] font-black tracking-[0.15em] text-[#173e70]">
                  10F 68057
                </p>
                <span className="absolute -right-2 -top-2 rounded-full bg-[#d7198c] px-2 py-[3px] text-[8px] font-black text-white">
                  ₹20/-
                </span>
              </div>

              {/* magnifier */}
              <div className="pointer-events-none absolute -right-1 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full border-[3px] border-[#ffd34e]/90 bg-white/10 backdrop-blur-[1px]">
                <div className="absolute -bottom-3 right-[-6px] h-6 w-2 rotate-[-45deg] rounded-sm bg-[#ffd34e]" />
              </div>
            </div>
          </div>
        </section>

        {/* ================= TABS ================= */}
        <section className="relative z-10 -mt-6 px-2">
          <div className="grid grid-cols-2 gap-1.5">
            <TabButton
              active={activeTab === "daily"}
              onClick={() => setActiveTab("daily")}
              icon={<Crown size={18} />}
              label="DEAR DAILY LOTTERY"
            />
            <TabButton
              active={activeTab === "festival"}
              onClick={() => setActiveTab("festival")}
              icon={<Gift size={18} />}
              label="DEAR FESTIVAL LOTTERY"
            />
          </div>
        </section>

        <main className="space-y-3 px-2 pt-3">
          {/* ================= ENTER TICKET ================= */}
          <section className="rounded-[16px] bg-white p-3 shadow-sm">
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
                className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-[#c9d3e3] px-2 py-1.5 text-[11px] font-semibold text-[#173e70]"
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
                placeholder="Enter ticket no. (e.g. 10F68057)"
                maxLength={8}
                className="h-[46px] min-w-0 flex-1 rounded-xl border border-[#dfe5f0] bg-[#f6f9fe] px-3 text-[14px] font-bold tracking-wider text-[#173e70] outline-none placeholder:text-[12px] placeholder:font-normal placeholder:tracking-normal placeholder:text-[#8a97ab] focus:border-[#ed1d43] focus:bg-white focus:shadow-[0_0_0_3px_rgba(237,29,67,0.12)]"
              />

              <button
                type="button"
                onClick={handleVerify}
                className="flex h-[46px] shrink-0 items-center gap-1 whitespace-nowrap rounded-xl bg-gradient-to-r from-[#ff1744] to-[#e0102f] px-3.5 text-[13px] font-extrabold text-white shadow-[0_6px_18px_rgba(255,20,67,0.4)] transition active:scale-95"
              >
                Verify Ticket <ChevronRight size={15} strokeWidth={3} />
              </button>
            </div>

            {inputError && (
              <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-center text-[12px] font-medium text-red-600">
                {inputError}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <span className="text-[11.5px] font-medium text-[#4b5563]">Example:</span>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => pickNumber(ex)}
                  className="rounded-md border border-[#dfe5f0] bg-[#f6f9fe] px-2 py-1 text-[11.5px] font-bold text-[#173e70] active:border-[#ed1d43] active:text-[#ed1d43]"
                >
                  {ex}
                </button>
              ))}
            </div>
          </section>

          {/* ================= RECENT SEARCHES ================= */}
          <section className="rounded-[16px] bg-white p-3 shadow-sm">
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
                  className="shrink-0 whitespace-nowrap rounded-lg border border-[#ed1d43]/50 px-2.5 py-1 text-[11px] font-semibold text-[#ed1d43]"
                >
                  Clear All
                </button>
              )}
            </div>

            {recent.length === 0 ? (
              <p className="mt-3 text-center text-[12px] text-[#6b7280]">
                No recent searches
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {recent.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => pickNumber(r)}
                    className="rounded-lg border border-[#dfe5f0] bg-[#f6f9fe] px-2.5 py-1.5 text-[11.5px] font-bold text-[#173e70] active:border-[#ed1d43] active:text-[#ed1d43]"
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* ================= RESULT ================= */}
          {result && (
            <ResultCard
              result={result}
              onDownload={handleDownload}
              onShare={handleShare}
            />
          )}

          {/* ================= ACTION GRID ================= */}
          <section className="grid grid-cols-4 gap-1.5">
            <ActionTile
              icon={<Calendar size={18} />}
              title="View All Results"
              sub="Check past draw results"
              tone="bg-[#ed1d43]"
            />
            <ActionTile
              icon={<Trophy size={18} />}
              title="Prize Structure"
              sub="See winning rules"
              tone="bg-[#8c4bd6]"
            />
            <ActionTile
              icon={<FileText size={18} />}
              title="Download Result PDF"
              sub="Official result list"
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
          <section className="rounded-[16px] bg-white p-3 shadow-sm">
            <div className="flex items-start gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ed1d43] text-white">
                <Info size={15} />
              </span>

              <div className="min-w-0">
                <p className="text-[14px] font-extrabold text-[#173e70]">
                  Important Information
                </p>
                <p className="mt-1 text-[12px] leading-snug text-[#4b5563]">
                  Results are based on official government lottery draw
                  publications. In case of any discrepancy, please refer to the
                  official gazette or contact official authorities.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>
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
    <span className="text-[8px] leading-tight text-white/80">{sub}</span>
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
    className="flex min-w-0 items-center gap-1.5 rounded-xl bg-white p-1.5 text-left shadow-sm transition active:scale-[0.97]"
  >
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${tone}`}
    >
      {icon}
    </span>
    <span className="min-w-0">
      <span className="block break-words text-[9.5px] font-extrabold leading-tight text-[#173e70]">
        {title}
      </span>
      <span className="mt-0.5 block break-words text-[8.5px] leading-tight text-[#4b5563]">
        {sub}
      </span>
    </span>
  </button>
);

// -----------------------------------------------------
// RESULT CARD
// -----------------------------------------------------

const ResultCard = ({ result, onDownload, onShare }) => {
  const isWin = result.status === "win";

  return (
    <section
      className={`overflow-hidden rounded-[16px] shadow-sm ${
        isWin
          ? "border-2 border-[#20a66a]/50 bg-gradient-to-br from-[#e9f8f0] via-white to-[#f2fff7]"
          : "border-2 border-[#ed1d43]/30 bg-gradient-to-br from-[#fff0f2] via-white to-[#fff5f6]"
      }`}
    >
      {isWin ? <WinnerContent result={result} /> : <LoserContent result={result} />}

      {isWin && (
        <div className="flex items-center justify-end gap-2 border-t border-[#e2e5f0] bg-[#f6f9fe] px-3 py-2">
          <button
            type="button"
            onClick={onDownload}
            className="flex items-center gap-1 rounded-lg border border-[#c9d3e3] bg-white px-3 py-1.5 text-[11.5px] font-semibold text-[#173e70]"
          >
            <Download size={13} /> PDF
          </button>
          <button
            type="button"
            onClick={onShare}
            className="flex items-center gap-1 rounded-lg bg-[#ed1d43] px-3 py-1.5 text-[11.5px] font-bold text-white"
          >
            <Share2 size={13} /> Share
          </button>
        </div>
      )}
    </section>
  );
};

// -----------------------------------------------------
// WINNER
// -----------------------------------------------------

const WinnerContent = ({ result }) => (
  <div className="p-3">
    <div className="grid grid-cols-[auto_1fr] items-center gap-3">
      <TicketStub number={result.ticketNumber} />

      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Trophy size={30} className="shrink-0 text-[#e0a11b]" fill="#ffd34e" />
            <p className="font-serif text-[24px] font-black leading-none text-[#20a66a]">
              WINNER!
            </p>
          </div>
          <p className="mt-1 text-[12px] font-bold text-[#173e70]">
            {result.prizeLabel}
          </p>
          <p className="whitespace-nowrap text-[24px] font-black leading-tight text-[#d7193f]">
            {result.prizeAmount}
          </p>
        </div>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#20a66a] text-white shadow">
          <CheckCircle2 size={22} strokeWidth={2.5} />
        </span>
      </div>
    </div>

    <div className="mt-3 grid grid-cols-5 gap-1 rounded-xl bg-white p-2 shadow-sm">
      <MetaItem label="Ticket Number" value={result.ticketNumber} />
      <MetaItem label="Draw Date" value={result.drawDate} sub={result.drawDay} />
      <MetaItem label="Draw Time" value={result.drawTime} />
      <MetaItem label="Lottery" value={result.lotteryName} />
      <MetaItem
        label="Prize Amount"
        value={result.prizeAmount}
        sub={result.prizeSub}
        highlight
      />
    </div>
  </div>
);

// -----------------------------------------------------
// LOSER
// -----------------------------------------------------

const LoserContent = ({ result }) => (
  <div className="grid grid-cols-[auto_1fr] items-center gap-3 p-3">
    <TicketStub number={result.ticketNumber} faded />

    <div className="flex min-w-0 items-start gap-2">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ed1d43] text-white shadow">
        <XCircle size={24} strokeWidth={2.5} />
      </span>

      <div className="min-w-0">
        <p className="font-serif text-[20px] font-black leading-none text-[#d7193f]">
          NOT A WINNER
        </p>
        <p className="mt-1 text-[12.5px] font-bold text-[#173e70]">
          Better luck next time!
        </p>
        <p className="mt-1 text-[11.5px] leading-snug text-[#4b5563]">
          Please check the latest draw results or try another ticket number.
        </p>
      </div>
    </div>
  </div>
);

// -----------------------------------------------------
// TICKET STUB
// -----------------------------------------------------

const TicketStub = ({ number, faded = false }) => (
  <div
    className={`relative w-[104px] shrink-0 -rotate-3 rounded-lg border-2 bg-gradient-to-br from-[#fff8e6] to-[#ffe9b8] p-2 shadow-md ${
      faded ? "border-[#e5c8a4]" : "border-[#e0b24a]"
    }`}
  >
    <p className="text-[16px] font-black leading-none text-[#d7193f]">DEAR</p>
    <p className="text-[7.5px] font-bold text-[#153c78]">DAILY LOTTERY</p>

    <p className="mt-1 text-[6.5px] text-[#5a4a2a]">First Prize</p>
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

const MetaItem = ({ label, value, sub, highlight = false }) => (
  <div className="min-w-0 text-center">
    <p className="break-words text-[8.5px] font-semibold leading-tight text-[#6b7280]">
      {label}
    </p>
    <p
      className={`mt-0.5 break-words text-[10px] font-extrabold leading-tight ${
        highlight ? "text-[#d7193f]" : "text-[#173e70]"
      }`}
    >
      {value}
    </p>
    {sub && (
      <p className="break-words text-[8.5px] leading-tight text-[#6b7280]">{sub}</p>
    )}
  </div>
);

export default VarifyTicket;