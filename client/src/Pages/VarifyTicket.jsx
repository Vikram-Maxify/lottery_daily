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
    Menu,
    Search,
    Share2,
    ShieldCheck,
    Ticket,
    Trophy,
    XCircle,
    Zap,
} from "lucide-react";

// =====================================================
// CONSTANTS
// =====================================================

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

    const handleExampleClick = (value) => {
        setInput(value);
        setInputError("");
        setResult(null);
    };

    const handleRecentClick = (value) => {
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

        const text = `Ticket: ${result.ticketNumber}\nStatus: ${result.status === "win" ? "Winner" : "Not a Winner"
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
        const text = `Ticket ${result.ticketNumber} — ${result.status === "win"
                ? `Winner! ${result.prizeAmount}`
                : "Not a winner"
            }`;
        try {
            if (navigator.share) {
                await navigator.share({ title: "Lottery Result", text });
            } else {
                await navigator.clipboard.writeText(text);
            }
        } catch { }
    };

    // =====================================================
    // UI
    // =====================================================

    return (
        <div className="min-h-screen w-full overflow-x-hidden bg-[#EBF0F7] text-[#1b2a5c]">
            <div className="mx-auto w-full max-w-[480px] pb-8">

                {/* ================= HERO BANNER ================= */}
                <section className="relative overflow-hidden bg-gradient-to-br from-[#3b0d1c] via-[#7a0f1e] to-[#b9121f] px-3 pb-4 pt-20">
                    <div className="pointer-events-none absolute -right-12 top-0 h-52 w-52 rounded-full bg-[#ffd84a]/25 blur-3xl" />
                    <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-[#ff1744]/25 blur-3xl" />

                    <div className="relative grid grid-cols-[1.1fr_1fr] items-center gap-2">
                        <div className="min-w-0">
                            <h1 className="font-serif text-[26px] font-black leading-[0.95] text-white">
                                VERIFY
                                <br />
                                YOUR TICKET
                            </h1>
                            <p className="mt-2 text-[10.5px] font-medium leading-tight text-white/90">
                                Check if your ticket number is a winner
                            </p>

                            <div className="mt-3 grid grid-cols-4 gap-1">
                                <TrustBadge icon={<ShieldCheck size={16} />} label="100%" sub="Official Results" />
                                <TrustBadge icon={<Zap size={16} />} label="Instant" sub="Verification" />
                                <TrustBadge icon={<BarChart3 size={16} />} label="Accurate" sub="& Secure" />
                                <TrustBadge icon={<Clock size={16} />} label="Real Time" sub="Results" />
                            </div>
                        </div>

                        <div className="relative flex justify-center">
                            <div className="relative -rotate-6 rounded-lg border-2 border-[#ffd84a] bg-gradient-to-br from-[#fff8e6] to-[#ffe9b8] p-2 shadow-[0_15px_30px_rgba(0,0,0,0.4)]">
                                <p className="text-[10px] font-black text-[#ed1d43]">DEAR</p>
                                <p className="text-[7px] font-bold text-[#1b2a5c]">DAILY LOTTERY</p>
                                <p className="mt-1 text-[6px] text-[#5a4a2a]">First Prize</p>
                                <p className="text-[14px] font-black text-[#1b2a5c]">₹1 CRORE</p>
                                <p className="mt-1 tracking-[0.15em] text-[8px] font-black text-[#1b2a5c]">
                                    10F 68057
                                </p>
                                <span className="absolute -right-1 -top-1 rounded-full bg-[#ed1d43] px-2 py-[2px] text-[7px] font-black text-white">
                                    ₹20/-
                                </span>
                            </div>

                            {/* magnifier */}
                            <div className="pointer-events-none absolute -right-2 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full border-[3px] border-[#ffd84a]/80 bg-white/10 backdrop-blur-sm">
                                <div className="absolute right-[-14px] bottom-[-8px] h-6 w-2 rotate-45 rounded-sm bg-[#ffd84a]" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================= TABS ================= */}
                <section className="grid grid-cols-2 gap-2 bg-white px-3 py-3 shadow-sm">
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
                </section>

                {/* ================= ENTER TICKET ================= */}
                <section className="mt-3 px-3">
                    <div className="rounded-[18px] border border-[#e2e5f0] bg-white p-3 shadow-[0_6px_18px_rgba(15,28,77,0.06)]">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ffd84a] text-[#1b2a5c]">
                                    <Search size={18} strokeWidth={2.4} />
                                </div>
                                <h2 className="text-[15px] font-extrabold text-[#1b2a5c]">
                                    Enter Ticket Number
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="flex items-center gap-1 rounded-lg border border-[#c9d3e3] px-2 py-1.5 text-[10px] font-semibold text-[#1b2a5c]"
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
                                placeholder="Enter your ticket number (e.g. 10F68057)"
                                maxLength={8}
                                className="h-[46px] min-w-0 flex-1 rounded-xl border border-[#dfe5f0] bg-[#f6f9fe] px-3 text-[14px] font-bold tracking-wider text-[#1b2a5c] outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-[#8a97ab] focus:border-[#ed1d43] focus:bg-white focus:shadow-[0_0_0_3px_rgba(237,29,67,0.12)]"
                            />

                            <button
                                type="button"
                                onClick={handleVerify}
                                className="flex h-[46px] shrink-0 items-center gap-1 rounded-xl bg-gradient-to-b from-[#ffb800] to-[#d99a00] px-4 text-[13px] font-extrabold text-white shadow-[0_6px_18px_rgba(217,154,0,0.45)] active:scale-95"
                            >
                                Verify Ticket <ChevronRight size={14} strokeWidth={3} />
                            </button>
                        </div>

                        {inputError && (
                            <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-center text-[11px] font-medium text-red-600">
                                {inputError}
                            </p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="text-[10.5px] font-medium text-[#5a6082]">
                                Example:
                            </span>
                            {EXAMPLES.map((ex) => (
                                <button
                                    key={ex}
                                    type="button"
                                    onClick={() => handleExampleClick(ex)}
                                    className="rounded-md border border-[#dfe5f0] bg-[#f6f9fe] px-2 py-1 text-[10px] font-bold text-[#1b2a5c] hover:border-[#ed1d43] hover:text-[#ed1d43]"
                                >
                                    {ex}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ================= RECENT SEARCHES ================= */}
                <section className="mt-3 px-3">
                    <div className="rounded-[18px] border border-[#e2e5f0] bg-white p-3 shadow-[0_6px_18px_rgba(15,28,77,0.06)]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-[#ed1d43]" />
                                <h2 className="text-[14px] font-extrabold text-[#1b2a5c]">
                                    Recent Searches
                                </h2>
                            </div>

                            {recent.length > 0 && (
                                <button
                                    type="button"
                                    onClick={clearRecent}
                                    className="flex items-center gap-1 rounded-lg border border-[#ed1d43]/40 px-2 py-1 text-[10px] font-semibold text-[#ed1d43]"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>

                        {recent.length === 0 ? (
                            <p className="mt-3 text-center text-[11px] text-[#8a97ab]">
                                No recent searches
                            </p>
                        ) : (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {recent.map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => handleRecentClick(r)}
                                        className="rounded-lg border border-[#dfe5f0] bg-[#f6f9fe] px-2.5 py-1.5 text-[10.5px] font-bold text-[#1b2a5c] hover:border-[#ed1d43] hover:text-[#ed1d43]"
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* ================= RESULT ================= */}
                {result && (
                    <section className="mt-3 px-3">
                        <ResultCard
                            result={result}
                            onDownload={handleDownload}
                            onShare={handleShare}
                        />
                    </section>
                )}

                {/* ================= ACTION GRID ================= */}
                <section className="mt-3 px-3">
                    <div className="grid grid-cols-4 gap-2">
                        <ActionTile
                            icon={<Calendar size={20} />}
                            title="View All Results"
                            sub="Check past draw results"
                            tone="red"
                        />
                        <ActionTile
                            icon={<Trophy size={20} />}
                            title="Prize Structure"
                            sub="See winning rules"
                            tone="violet"
                        />
                        <ActionTile
                            icon={<Download size={20} />}
                            title="Download Result PDF"
                            sub="Official result list"
                            tone="green"
                            onClick={handleDownload}
                        />
                        <ActionTile
                            icon={<Share2 size={20} />}
                            title="Share Results"
                            sub="With your friends"
                            tone="orange"
                            onClick={handleShare}
                        />
                    </div>
                </section>

                {/* ================= IMPORTANT INFO ================= */}
                <section className="mt-3 px-3">
                    <div className="rounded-[16px] border border-[#e2e5f0] bg-white p-3 shadow-[0_6px_18px_rgba(15,28,77,0.06)]">
                        <div className="flex items-start gap-2">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ed1d43] text-white">
                                <Info size={13} />
                            </div>

                            <div className="min-w-0">
                                <p className="text-[12px] font-extrabold text-[#1b2a5c]">
                                    Important Information
                                </p>
                                <p className="mt-1 text-[10.5px] leading-snug text-[#5a6082]">
                                    Results are based on official government lottery draw
                                    publications. In case of any discrepancy, please refer to the
                                    official gazette or contact official authorities.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

// =====================================================
// SUB COMPONENTS
// =====================================================

const HeaderIcon = ({ icon, label }) => (
    <div className="flex flex-col items-center gap-0.5">
        <span className="text-[#1b2a5c]">{icon}</span>
        <span className="text-[8px] font-semibold">{label}</span>
    </div>
);

const TrustBadge = ({ icon, label, sub }) => (
    <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ffd84a] text-[#1b2a5c]">
            {icon}
        </span>
        <span className="text-[8px] font-black leading-tight text-white">
            {label}
        </span>
        <span className="text-[7px] leading-tight text-white/80">{sub}</span>
    </div>
);

const TabButton = ({ active, onClick, icon, label }) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-[11px] font-extrabold transition active:scale-[0.98] ${active
                ? "bg-gradient-to-b from-[#c9143a] to-[#8f102d] text-white shadow-[0_6px_18px_rgba(201,20,58,0.35)]"
                : "border border-[#dfe5f0] bg-[#f6f9fe] text-[#1b2a5c]"
            }`}
    >
        <span className={active ? "text-[#ffd84a]" : "text-[#ed1d43]"}>{icon}</span>
        {label}
    </button>
);

const ActionTile = ({ icon, title, sub, tone = "red", onClick }) => {
    const TONES = {
        red: "bg-[#ed1d43]",
        violet: "bg-[#8c4bd6]",
        green: "bg-[#20a66a]",
        orange: "bg-[#f08a25]",
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className="flex flex-col items-center gap-1.5 rounded-[14px] border border-[#e2e5f0] bg-white p-2 text-center shadow-[0_4px_14px_rgba(15,28,77,0.06)] transition active:scale-[0.97]"
        >
            <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl text-white ${TONES[tone]}`}
            >
                {icon}
            </span>
            <span className="text-[9.5px] font-extrabold leading-tight text-[#1b2a5c]">
                {title}
            </span>
            <span className="text-[8px] leading-tight text-[#8a97ab]">{sub}</span>
        </button>
    );
};

// -----------------------------------------------------
// RESULT CARD
// -----------------------------------------------------

const ResultCard = ({ result, onDownload, onShare }) => {
    const isWin = result.status === "win";

    return (
        <div className="overflow-hidden rounded-[18px] border border-[#e2e5f0] bg-white shadow-[0_10px_28px_rgba(15,28,77,0.10)]">
            {isWin ? <WinnerContent result={result} /> : <LoserContent result={result} />}

            {isWin && (
                <div className="flex items-center justify-end gap-2 border-t border-[#e2e5f0] bg-[#f6f9fe] px-3 py-2">
                    <button
                        type="button"
                        onClick={onDownload}
                        className="flex items-center gap-1 rounded-lg border border-[#dfe5f0] bg-white px-2 py-1.5 text-[10px] font-semibold text-[#1b2a5c]"
                    >
                        <Download size={12} /> PDF
                    </button>
                    <button
                        type="button"
                        onClick={onShare}
                        className="flex items-center gap-1 rounded-lg bg-[#ed1d43] px-2 py-1.5 text-[10px] font-bold text-white"
                    >
                        <Share2 size={12} /> Share
                    </button>
                </div>
            )}
        </div>
    );
};

// -----------------------------------------------------
// WINNER
// -----------------------------------------------------

const WinnerContent = ({ result }) => (
    <div className="bg-gradient-to-br from-[#e9f8f0] via-white to-[#f2fff7] p-3">
        <div className="grid grid-cols-[auto_1fr] gap-3">
            <TicketStub number={result.ticketNumber} />

            <div className="min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="font-serif text-[22px] font-black leading-none text-[#20a66a]">
                            WINNER!
                        </p>
                        <p className="mt-1 text-[11px] font-bold text-[#1b2a5c]">
                            {result.prizeLabel}
                        </p>
                        <p className="mt-0.5 whitespace-nowrap text-[22px] font-black leading-tight text-[#ed1d43]">
                            {result.prizeAmount}
                        </p>
                        <p className="text-[10px] font-semibold text-[#5a6082]">
                            {result.prizeSub}
                        </p>
                    </div>

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#20a66a] text-white shadow">
                        <CheckCircle2 size={20} strokeWidth={2.5} />
                    </span>
                </div>
            </div>
        </div>

        <div className="mt-3 grid grid-cols-5 gap-1 rounded-xl bg-white p-2 shadow-[0_4px_14px_rgba(15,28,77,0.06)]">
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
    <div className="bg-gradient-to-br from-[#fff0f2] via-white to-[#fff5f6] p-3">
        <div className="grid grid-cols-[auto_1fr] gap-3">
            <TicketStub number={result.ticketNumber} faded />

            <div className="min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="font-serif text-[20px] font-black leading-none text-[#ed1d43]">
                            NOT A WINNER
                        </p>
                        <p className="mt-2 text-[11px] font-bold text-[#1b2a5c]">
                            Better luck next time!
                        </p>
                        <p className="mt-1.5 text-[10px] leading-snug text-[#5a6082]">
                            Please check the latest draw results or try another ticket number.
                        </p>
                    </div>

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ed1d43] text-white shadow">
                        <XCircle size={20} strokeWidth={2.5} />
                    </span>
                </div>
            </div>
        </div>
    </div>
);

// -----------------------------------------------------
// TICKET STUB
// -----------------------------------------------------

const TicketStub = ({ number, faded = false }) => (
    <div
        className={`relative w-[86px] shrink-0 rounded-lg border-2 ${faded ? "border-[#e2e5f0]" : "border-[#ffd84a]"
            } bg-gradient-to-br from-[#fff8e6] to-[#ffe9b8] p-1.5 shadow`}
    >
        <p className="text-[11px] font-black leading-none text-[#ed1d43]">DEAR</p>
        <p className="text-[6.5px] font-bold text-[#1b2a5c]">DAILY LOTTERY</p>

        <p className="mt-1 text-[5.5px] text-[#5a4a2a]">First Prize</p>
        <p className="text-[11px] font-black leading-none text-[#1b2a5c]">
            ₹1 CRORE
        </p>

        <p className="mt-1 whitespace-nowrap text-[7px] font-black tracking-wider text-[#1b2a5c]">
            {number?.length === 8
                ? `${number.slice(0, 3)} ${number.slice(3)}`
                : number}
        </p>

        <span className="absolute -right-1 -top-1 rounded-full bg-[#ed1d43] px-1.5 py-[1px] text-[6px] font-black text-white">
            ₹20
        </span>
    </div>
);

// -----------------------------------------------------
// META ITEM
// -----------------------------------------------------

const MetaItem = ({ label, value, sub, highlight = false }) => (
    <div className="min-w-0 text-center">
        <p className="text-[8px] font-semibold text-[#8a97ab]">{label}</p>
        <p
            className={`mt-0.5 truncate text-[9.5px] font-extrabold ${highlight ? "text-[#ed1d43]" : "text-[#1b2a5c]"
                }`}
        >
            {value}
        </p>
        {sub && <p className="text-[7.5px] leading-tight text-[#8a97ab]">{sub}</p>}
    </div>
);

export default VarifyTicket;