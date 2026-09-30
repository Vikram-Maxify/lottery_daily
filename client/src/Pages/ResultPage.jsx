import {
  CheckCircle2,
  Copy,
  Crown,
  ShieldCheck,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";

import { useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

import {
  clearLotteryConfigError,
  getMyLotteryEntries,
} from "../reducer/slice/createLotteryConfigSlice";

import { fetchProfile } from "../reducer/slice/authSlice";

// ==========================================================
// CONSTANTS
// ==========================================================

// ⚠️ Apne bottom navbar ki height (px) yahan daalo.
const BOTTOM_NAV_HEIGHT = 64;

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1605196560547-b2f7281b7355?auto=format&fit=crop&w=1400&q=80";

const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ==========================================================
// RESULT PAGE
// ==========================================================

const ResultPage = () => {
  const dispatch = useDispatch();

  const { user, isAuthenticated, profileLoading } = useSelector(
    (state) => state.auth || {}
  );

  const {
    myEntries = [],
    myEntriesLoading = false,
    error = null,
    activeConfig = null,
  } = useSelector((state) => state.createLotteryConfig || {});

  const profileRequested = useRef(false);

  // AUTH CHECK
  useEffect(() => {
    if (user || isAuthenticated) return;
    if (profileRequested.current) return;
    profileRequested.current = true;
    dispatch(fetchProfile());
  }, [dispatch, user, isAuthenticated]);

  // FETCH RESULTS
  useEffect(() => {
    if (profileLoading) return;
    if (!isAuthenticated || !user) return;

    dispatch(getMyLotteryEntries());

    return () => {
      dispatch(clearLotteryConfigError());
    };
  }, [dispatch, profileLoading, isAuthenticated, user]);

  // MARKET NAME
  const marketName = useMemo(() => {
    const configMarketName =
      activeConfig?.marketName ||
      myEntries?.[0]?.marketName ||
      myEntries?.[0]?.entry?.marketName ||
      "Market";

    return String(configMarketName)
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }, [activeConfig, myEntries]);

  // RESULT TICKETS
  const resultTickets = useMemo(() => {
    const entries = Array.isArray(myEntries) ? myEntries : [];

    return entries
      .map((item, index) => {
        const entry = item?.entry || item;
        const status = normalizeStatus(entry?.status);

        if (status === "pending") return null;

        const number = formatTicketNumber(entry?.number);

        const id =
          item?.entryId ||
          entry?._id ||
          entry?.id ||
          `result-ticket-${index}`;

        const drawDate = formatDrawDate(item);
        const prizes = item?.prizes || entry?.prize || {};

        return {
          id,
          number: number.split(""),
          status,
          statusText: status === "win" ? "Winner" : "Lost",
          drawDate,
          drawTime: item?.drawTime || "—",
          price: formatAmount(entry?.amount),
          purchaseDate: formatDate(entry?.entryDate || entry?.createdAt),
          purchaseTime: formatTime(entry?.createdAt || entry?.entryDate),
          message:
            status === "win"
              ? "Congratulations! Your ticket is a winner."
              : "Better luck next time.",
          prizes: {
            first: Number(prizes?.first) || 0,
            second: Number(prizes?.second) || 0,
            third: Number(prizes?.third) || 0,
          },
          prizeType: entry?.prizeType || null,
        };
      })
      .filter(Boolean);
  }, [myEntries]);

  const totalResults = resultTickets.length;
  const totalWins = resultTickets.filter((t) => t.status === "win").length;
  const totalLost = resultTickets.filter((t) => t.status === "lost").length;

  const authChecking =
    !user && !isAuthenticated && (!profileRequested.current || profileLoading);

  const copyId = async (id) => {
    try {
      await navigator.clipboard.writeText(id);
    } catch { }
  };

  // LOADING
  if (authChecking || profileLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#eef3fa] px-5">
        <div className="flex flex-col items-center gap-4 rounded-[16px] bg-white px-12 py-10 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#ed1d43]/30">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#ed1d43] border-t-transparent" />
          </div>
          <p className="text-sm font-semibold text-[#173e70]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#eef3fa] text-[#173e70]">
      <div
        className="relative mx-auto w-[calc(100%-0px)] max-w-[500px] overflow-x-hidden"
        style={{ paddingBottom: BOTTOM_NAV_HEIGHT + 24 }}
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

          <div className="relative flex items-center gap-3 px-3 pb-16 pt-6">
            <div className="flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-[18px] border-2 border-[#ffd34e] bg-white/10 shadow-[0_0_25px_rgba(255,209,90,0.25)]">
              <Trophy
                className="h-[32px] w-[32px] text-[#ffd34e]"
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0">
              <p className="text-[12px] font-medium text-white/70">
                Lottery Results
              </p>
              <h1 className="mt-0.5 bg-gradient-to-b from-[#fff1a8] to-[#e0a11b] bg-clip-text font-serif text-[34px] font-black leading-none text-transparent">
                My Results
              </h1>
              <p className="mt-1.5 text-[12px] leading-tight text-white/85">
                Your winning and losing tickets appear here
              </p>
            </div>
          </div>
        </section>

        {/* ================= SUMMARY ================= */}
        <section className="relative z-10 -mt-10 px-2">
          <div className="grid grid-cols-3 gap-1.5">
            <ResultStat label="Total Results" value={totalResults} icon={Trophy} tone="red" />
            <ResultStat label="Winners" value={totalWins} icon={CheckCircle2} tone="green" />
            <ResultStat label="Lost" value={totalLost} icon={XCircle} tone="orange" />
          </div>
        </section>

        {/* ================= CONTENT ================= */}
        <main className="mt-3 space-y-3 px-2">
          {myEntriesLoading ? (
            <div className="flex h-[160px] flex-col items-center justify-center rounded-[16px] bg-white shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ed1d43] text-white shadow-[0_8px_20px_rgba(237,29,67,0.25)]">
                <Trophy size={25} className="animate-pulse" />
              </div>
              <p className="mt-3 text-[14px] font-semibold text-[#173e70]">
                Loading your results...
              </p>
            </div>
          ) : null}

          {!myEntriesLoading && error && !resultTickets.length ? (
            <div className="flex h-[160px] flex-col items-center justify-center rounded-[16px] border border-red-200 bg-red-50 px-5 text-center shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ed1d43] text-white">
                <XCircle size={24} />
              </div>
              <p className="mt-3 text-[14px] font-semibold text-[#ed1d43]">
                {typeof error === "string" ? error : error?.message || "Something went wrong"}
              </p>
            </div>
          ) : null}

          {!myEntriesLoading &&
            (resultTickets.length ? (
              resultTickets.map((ticket) => (
                <LotteryResultTicket
                  key={ticket.id}
                  ticket={ticket}
                  copyId={copyId}
                  marketName={marketName}
                />
              ))
            ) : (
              <div className="flex h-[200px] flex-col items-center justify-center rounded-[16px] bg-white px-5 text-center shadow-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#173e70] text-[#ffd34e] shadow-lg">
                  <Trophy size={27} />
                </div>

                <p className="mt-4 text-[16px] font-extrabold text-[#173e70]">
                  No Results Available Yet
                </p>
                <p className="mt-2 max-w-[310px] text-[13px] leading-snug text-[#4b5563]">
                  Your win or loss result will appear here after the draw.
                </p>
              </div>
            ))}

          {/* ================= FOOTER ================= */}
          <div className="flex flex-col items-center px-4 pt-3">
            <div className="flex w-full items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#173e70]/30" />
              <ShieldCheck size={22} className="text-[#173e70]" />
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#173e70]/30" />
            </div>
            <p className="mt-2 text-[14px] font-medium text-[#173e70]">
              Play with trust
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

// ==========================================================
// RESULT STAT
// ==========================================================

const ResultStat = ({ label, value, icon: Icon, tone = "red" }) => {
  const TONES = {
    red: { icon: "bg-[#ed1d43]", color: "text-[#ed1d43]" },
    green: { icon: "bg-[#20a66a]", color: "text-[#168052]" },
    orange: { icon: "bg-[#f08a25]", color: "text-[#d66d10]" },
    navy: { icon: "bg-[#173e70]", color: "text-[#173e70]" },
  };

  const currentTone = TONES[tone] || TONES.red;

  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl bg-white px-1 py-3 text-center shadow-md">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ${currentTone.icon}`}
      >
        <Icon size={19} strokeWidth={2} />
      </div>

      <div className={`text-[22px] font-black leading-none ${currentTone.color}`}>
        {value}
      </div>
      <p className="w-full truncate text-[10.5px] font-semibold text-[#4b5563]">
        {label}
      </p>
    </div>
  );
};

// ==========================================================
// RESULT TICKET
// ==========================================================

const LotteryResultTicket = ({ ticket, copyId, marketName }) => {
  const won = ticket.status === "win";

  return (
    <div
      className={`overflow-hidden rounded-[16px] bg-white shadow-sm ${won ? "border-2 border-[#20a66a]/50" : "border border-[#e2e5f0]"
        }`}
    >
      {/* ---------- Header ---------- */}
      <div className="relative flex items-center justify-between gap-2 overflow-hidden bg-gradient-to-r from-[#3a0b17] via-[#2b0a16] to-[#1a0710] px-3 py-3">
        <div className="pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full bg-[#ff1744]/30 blur-3xl" />

        <div className="relative flex min-w-0 items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <Crown size={24} strokeWidth={1.5} fill="#ffd34e" className="text-[#ffd34e]" />
          </span>
          <div className="min-w-0 leading-tight">
            <h2 className="truncate text-[16px] font-extrabold text-white">
              {marketName} Ticket
            </h2>
            <p className="truncate text-[11px] text-white/70">
              India's Trusted Lottery
            </p>
          </div>
        </div>

        <span
          className={`relative flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-extrabold text-white ${won ? "bg-[#20a66a]" : "bg-[#ed1d43]"
            }`}
        >
          {won ? <CheckCircle2 size={14} strokeWidth={2.5} /> : <XCircle size={14} strokeWidth={2.5} />}
          {ticket.statusText}
        </span>
      </div>

      <div className="p-3">
        {/* ---------- Number ---------- */}
        <p className="text-center text-[13px] font-bold text-[#173e70]">
          Your Selected Number
        </p>

        <div
          className="mt-2 grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${ticket.number.length || 1}, minmax(0, 1fr))`,
          }}
        >
          {ticket.number.map((ch, index) => (
            <div
              key={index}
              className={`flex h-12 items-center justify-center rounded-xl border-2 ${won
                  ? "border-[#20a66a] bg-[#e9f8f0]"
                  : "border-[#c9d3e3] bg-[#f6f9fe]"
                }`}
            >
              <span
                className={`text-[19px] font-black ${won ? "text-[#168052]" : "text-[#173e70]"
                  }`}
              >
                {ch}
              </span>
            </div>
          ))}
        </div>

        {/* ---------- Message ---------- */}
        <div
          className={`mt-3 rounded-lg px-3 py-2 text-center text-[12.5px] font-semibold ${won
              ? "border border-[#bfe8d3] bg-[#e7f8ef] text-[#168052]"
              : "border border-red-200 bg-red-50 text-[#d7193f]"
            }`}
        >
          {ticket.message}
        </div>

        {/* ---------- Prizes ---------- */}
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <MiniPrize
            title="First Prize"
            amount={formatPrize(ticket.prizes.first)}
            subtitle="(6 digits match)"
            row="bg-[#ffe4e8]"
          />
          <MiniPrize
            title="Second Prize"
            amount={formatPrize(ticket.prizes.second)}
            subtitle="(5 digits match)"
            row="bg-[#e3f0ff]"
          />
          <MiniPrize
            title="Third Prize"
            amount={formatPrize(ticket.prizes.third)}
            subtitle="(4 digits match)"
            row="bg-[#ffefdc]"
          />
        </div>

        {/* ---------- Details ---------- */}
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-[#e2e5f0] bg-[#f9fbff] p-2.5">
          <InfoBlock
            label="Draw Date"
            value={`${ticket.drawDate.day} ${ticket.drawDate.month} ${ticket.drawDate.year}`.trim()}
            sub={ticket.drawTime}
          />
          <InfoBlock
            label="Ticket Price"
            value={ticket.price}
            valueClass="text-[16px] font-black text-[#d7193f]"
          />
          <InfoBlock
            label="Purchase Date"
            value={ticket.purchaseDate}
            sub={ticket.purchaseTime}
          />

          {won && ticket.prizeType ? (
            <InfoBlock
              label="Prize Won"
              value={getPrizeLabel(ticket.prizeType)}
              valueClass="text-[13px] font-extrabold text-[#168052]"
            />
          ) : (
            <div />
          )}
        </div>

        {/* ---------- Ticket ID ---------- */}
        <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-[#eef3fa] px-3 py-2">
          <div className="min-w-0">
            <p className="text-[10.5px] text-[#6b7280]">Ticket ID</p>
            <p className="truncate text-[12px] font-bold text-[#173e70]">
              {ticket.id}
            </p>
          </div>
          <button
            type="button"
            onClick={() => copyId(ticket.id)}
            aria-label="Copy ticket id"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#173e70] text-white transition active:scale-90"
          >
            <Copy size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================================
// INFO BLOCK
// ==========================================================

const InfoBlock = ({ label, value, sub, valueClass = "" }) => (
  <div className="min-w-0">
    <p className="text-[10.5px] text-[#6b7280]">{label}</p>
    <p
      className={`mt-0.5 text-[13px] font-bold leading-tight text-[#173e70] ${valueClass}`}
    >
      {value}
    </p>
    {sub ? <p className="mt-0.5 text-[11px] text-[#4b5563]">{sub}</p> : null}
  </div>
);

// ==========================================================
// MINI PRIZE
// ==========================================================

const MiniPrize = ({ title, amount, subtitle, row }) => (
  <div
    className={`min-w-0 rounded-lg border-2 border-white px-1 py-2 text-center shadow-sm ${row}`}
  >
    <p className="text-[10px] font-bold leading-tight text-[#173e70]">{title}</p>
    <p className="mt-1 whitespace-nowrap text-[13px] font-black leading-none text-[#d7193f]">
      {amount}
    </p>
    <p className="mt-1 text-[8.5px] leading-tight text-[#4b5563]">{subtitle}</p>
  </div>
);

// ==========================================================
// HELPERS
// ==========================================================

// Ticket number: letters wala (12AB137) jaisa hai waisa dikhao,
// sirf digits wala purana number ho to 6 digit tak zero-pad karo.
const formatTicketNumber = (raw) => {
  const value = String(raw ?? "").toUpperCase().replace(/\s+/g, "");
  if (!value) return "";
  if (/^\d+$/.test(value)) return value.padStart(6, "0").slice(0, 6);
  return value.slice(0, 10);
};

const getPrizeLabel = (prizeType) => {
  const value = String(prizeType || "").toLowerCase();

  if (value.includes("1st") || value.includes("first")) return "First Prize";
  if (value.includes("2nd") || value.includes("second")) return "Second Prize";
  if (value.includes("3rd") || value.includes("third")) return "Third Prize";
  return "Prize Won";
};

const formatPrize = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "₹0";

  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2).replace(/\.00$/, "")} Crore`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2).replace(/\.00$/, "")} Lakh`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
};

const formatAmount = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "₹0";
  return `₹${amount.toLocaleString("en-IN")}`;
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const normalizeStatus = (status) => {
  const value = String(status || "").toLowerCase().trim();

  if (value === "win" || value === "winner" || value === "won") return "win";
  if (value === "lost" || value === "loss") return "lost";
  return "pending";
};

const formatDrawDate = (item) => {
  const drawDate = item?.drawDate;

  if (drawDate) {
    const date = new Date(drawDate);
    if (!Number.isNaN(date.getTime())) {
      return {
        day: date.toLocaleDateString("en-IN", { day: "2-digit" }),
        month: date.toLocaleDateString("en-IN", { month: "long" }),
        year: date.toLocaleDateString("en-IN", { year: "numeric" }),
      };
    }
  }

  const d = item?.date;
  const m = item?.month;
  const y = item?.year;

  if (d && m && y) {
    return {
      day: String(d),
      month: MONTH_NAMES_EN[Number(m) - 1] || "",
      year: String(y),
    };
  }

  return { day: "—", month: "", year: "" };
};

export default ResultPage;