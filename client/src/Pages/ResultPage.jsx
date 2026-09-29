import {
  CheckCircle2,
  Copy,
  Crown,
  ShieldCheck,
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
// MONTH NAMES
// ==========================================================

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

        const number = String(entry?.number ?? "").padStart(6, "0");

        const id =
          item?.entryId ||
          entry?._id ||
          entry?.id ||
          `result-ticket-${index}`;

        const drawDate = formatDrawDate(item);
        const prizes = item?.prizes || entry?.prize || {};

        return {
          id,
          number: number.slice(0, 6).split(""),
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
    } catch {}
  };

  // LOADING
  if (authChecking || profileLoading) {
    return (
      <div className="min-h-screen w-full bg-[#EBF0F7] flex items-center justify-center px-5">
        <div className="flex flex-col items-center gap-4 rounded-[22px] bg-white px-12 py-10 shadow-[0_20px_60px_rgba(15,28,77,0.10)]">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#ed1d43]/30">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#ed1d43] border-t-transparent" />
          </div>
          <p className="text-sm font-semibold text-[#1b2a5c]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#EBF0F7] pb-[90px] text-[#1b2a5c]">
      <div className="mx-auto w-full max-w-[680px]">
        {/* ================= HERO ================= */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0f1c4d] via-[#1b2a5c] to-[#3b0d1c] px-4 pb-16 pt-6 sm:px-6">
          <div className="pointer-events-none absolute -left-16 top-4 h-48 w-48 rounded-full bg-[#ed1d43]/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 top-0 h-56 w-56 rounded-full bg-[#ffd84a]/10 blur-3xl" />
          <Crown size={155} className="pointer-events-none absolute -right-8 -top-8 text-[#ffd84a]/[0.07]" />

          <div className="relative flex items-center gap-3 sm:gap-4">
            <div className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-[18px] border-2 border-[#ffd84a] bg-white/10 shadow-[0_0_25px_rgba(255,209,90,0.25)] sm:h-[72px] sm:w-[72px]">
              <Trophy
                className="h-[32px] w-[32px] text-[#ffd84a] sm:h-[38px] sm:w-[38px]"
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-medium text-white/60 sm:text-[13px]">
                Lottery Results
              </p>
              <h1 className="mt-0.5 text-[25px] font-extrabold leading-tight tracking-tight text-white sm:text-[30px]">
                My Results
              </h1>
              <p className="mt-1 text-[11px] leading-[1.35] text-white/75 sm:text-[13px]">
                Your winning and losing tickets appear here
              </p>
            </div>
          </div>
        </section>

        {/* ================= SUMMARY ================= */}
        <section className="relative z-10 -mt-10 px-3 sm:px-6">
          <div className="grid grid-cols-3 overflow-hidden rounded-[18px] border border-white bg-white shadow-[0_12px_30px_rgba(15,28,77,0.10)]">
            <ResultStat label="Total Results" value={totalResults} icon={Trophy} tone="red" />
            <ResultStat label="Winners" value={totalWins} icon={CheckCircle2} tone="green" bordered />
            <ResultStat label="Lost" value={totalLost} icon={XCircle} tone="orange" bordered />
          </div>
        </section>

        {/* ================= CONTENT ================= */}
        <section className="mt-5 px-3 sm:px-6">
          {myEntriesLoading ? (
            <div className="relative flex h-[160px] flex-col items-center justify-center overflow-hidden rounded-[18px] border border-white bg-white shadow-[0_10px_28px_rgba(15,28,77,0.08)]">
              <div className="pointer-events-none absolute -left-12 -top-12 h-32 w-32 rounded-full bg-[#ed1d43]/10 blur-3xl" />

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ed1d43] text-white shadow-[0_8px_20px_rgba(237,29,67,0.25)]">
                <Trophy size={25} className="animate-pulse" />
              </div>

              <p className="relative mt-3 text-[13px] font-semibold text-[#1b2a5c]">
                Loading your results...
              </p>
            </div>
          ) : null}

          {!myEntriesLoading && error && !resultTickets.length ? (
            <div className="flex h-[160px] flex-col items-center justify-center rounded-[18px] border border-red-200 bg-red-50 px-5 text-center shadow-[0_10px_28px_rgba(15,28,77,0.06)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ed1d43] text-white">
                <XCircle size={24} />
              </div>
              <p className="mt-3 text-[13px] font-semibold text-[#ed1d43]">{error}</p>
            </div>
          ) : null}

          {!myEntriesLoading && (
            <div className="space-y-[22px]">
              {resultTickets.length ? (
                resultTickets.map((ticket) => (
                  <LotteryResultTicket
                    key={ticket.id}
                    ticket={ticket}
                    copyId={copyId}
                    marketName={marketName}
                  />
                ))
              ) : (
                <div className="relative flex h-[190px] flex-col items-center justify-center overflow-hidden rounded-[18px] border border-white bg-white px-5 text-center shadow-[0_10px_28px_rgba(15,28,77,0.08)]">
                  <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#ffd84a]/20 blur-3xl" />

                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1b2a5c] text-[#ffd84a] shadow-lg">
                    <Trophy size={27} />
                  </div>

                  <p className="mt-4 text-[14px] font-extrabold text-[#1b2a5c]">
                    No Results Available Yet
                  </p>
                  <p className="mt-2 max-w-[310px] text-[12px] leading-[1.4] text-[#5a6082]">
                    Your win or loss result will appear here after the draw.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ================= FOOTER ================= */}
        <div className="mt-7 flex flex-col items-center px-6">
          <div className="flex w-full items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#1b2a5c]/30" />
            <ShieldCheck size={22} className="text-[#1b2a5c]" />
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#1b2a5c]/30" />
          </div>
          <p className="mt-2 text-[14px] font-medium text-[#1b2a5c]">
            Play with trust
          </p>
        </div>
      </div>
    </div>
  );
};

// ==========================================================
// RESULT STAT
// ==========================================================

const ResultStat = ({ label, value, icon: Icon, tone = "red", bordered = false }) => {
  const TONES = {
    red: { icon: "bg-[#ed1d43]", color: "text-[#ed1d43]" },
    green: { icon: "bg-[#20a66a]", color: "text-[#168052]" },
    orange: { icon: "bg-[#f08a25]", color: "text-[#d66d10]" },
    navy: { icon: "bg-[#1b2a5c]", color: "text-[#1b2a5c]" },
  };

  const currentTone = TONES[tone] || TONES.red;

  return (
    <div
      className={`flex min-w-0 items-center justify-center gap-2 px-2.5 py-3.5 sm:gap-3 sm:px-4 ${
        bordered ? "border-l border-[#e2e5f0]" : ""
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white sm:h-11 sm:w-11 ${currentTone.icon}`}
      >
        <Icon size={20} strokeWidth={2} />
      </div>

      <div className="min-w-0">
        <div className={`text-[21px] font-black leading-none sm:text-[24px] ${currentTone.color}`}>
          {value}
        </div>
        <p className="mt-1 truncate text-[9px] font-medium text-[#5a6082] sm:text-[11px]">
          {label}
        </p>
      </div>
    </div>
  );
};

// ==========================================================
// RESULT TICKET
// ==========================================================

const LotteryResultTicket = ({ ticket, copyId, marketName }) => {
  const won = ticket.status === "win";

  return (
    <div className="relative w-full overflow-hidden rounded-[18px] bg-white shadow-[0_14px_34px_rgba(15,28,77,0.10)]">
      <div className="pointer-events-none absolute inset-0 z-[40] rounded-[18px] border border-[#e2e5f0]" />

      {/* ================= LEFT (red ticket stub) ================= */}
      <div className="absolute bottom-0 left-0 top-0 flex w-[24%] flex-col items-center overflow-hidden border-r border-[#d7193f]/60 bg-gradient-to-b from-[#ed1d43] via-[#c91438] to-[#8f102d] px-[6px] py-[17px] text-center">
        <div className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-[#ff1744]/30 blur-3xl" />

        <Crown size={43} strokeWidth={1.5} fill="#ffd15a" className="relative text-[#ffd15a]" />

        <h2 className="relative mt-[6px] text-[17px] font-extrabold leading-none text-white">
          {marketName}
        </h2>
        <h2 className="relative mt-[3px] text-[17px] font-extrabold leading-none text-white">
          Ticket
        </h2>

        <div className="mt-[15px] h-px w-[65%] bg-[#ffd15a]/60" />

        <p className="relative mt-[16px] text-[10px] font-semibold leading-[1.35] text-white sm:text-[11px]">
          {ticket.message}
        </p>

        <div className="mt-auto">
          <svg
            width="38"
            height="34"
            viewBox="0 0 52 45"
            fill="none"
            stroke="#ffd15a"
            strokeWidth="2"
          >
            <path d="M26 42C17 36 16 29 26 21C36 29 35 36 26 42Z" />
            <path d="M26 41C17 38 8 31 10 23C18 25 24 31 26 41Z" />
            <path d="M26 41C35 38 44 31 42 23C34 25 28 31 26 41Z" />
            <path d="M26 37C22 28 23 19 26 11C29 19 30 28 26 37Z" />
          </svg>
        </div>

        <p className="mt-[3px] text-[10px] font-semibold text-white">Play with</p>
        <p className="text-[10px] font-semibold text-white">Confidence</p>
      </div>

      {/* ================= CENTER ================= */}
      <div className="absolute bottom-0 left-[24%] right-[24%] top-0 bg-gradient-to-b from-[#f6f9fe] via-white to-[#eef3fb] px-[8px] py-[13px] text-[#1b2a5c]">
        <div className="flex items-center justify-center gap-[4px]">
          <span className="text-[10px] text-[#ed1d43]">❧</span>
          <div className="rounded-full border border-[#e2e5f0] bg-white px-[8px] py-[4px]">
            <p className="whitespace-nowrap text-[9px] font-extrabold text-[#1b2a5c] sm:text-[10px]">
              India's Trusted Lottery
            </p>
          </div>
          <span className="text-[10px] text-[#ed1d43]">❧</span>
        </div>

        <p className="mt-[11px] text-center text-[11px] font-bold sm:text-[12px]">
          Your Selected Number
        </p>

        <div className="mt-[7px] grid grid-cols-6 gap-[3px]">
          {ticket.number.map((digit, index) => (
            <div
              key={index}
              className={`flex h-[37px] items-center justify-center rounded-[7px] border ${
                won
                  ? "border-[#20a66a] bg-[#e9f8f0]"
                  : "border-[#e2e5f0] bg-[#f6f9fe]"
              }`}
            >
              <span
                className={`text-[18px] font-black ${
                  won ? "text-[#168052]" : "text-[#1b2a5c]"
                }`}
              >
                {digit}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-[11px] grid grid-cols-3 gap-[4px]">
          <MiniPrize
            title="First Prize"
            amount={formatPrize(ticket.prizes.first)}
            subtitle="(6 digits match)"
          />
          <MiniPrize
            title="Second Prize"
            amount={formatPrize(ticket.prizes.second)}
            subtitle="(5 digits match)"
          />
          <MiniPrize
            title="Third Prize"
            amount={formatPrize(ticket.prizes.third)}
            subtitle="(4 digits match)"
          />
        </div>

        <div className="mt-[10px] h-px bg-[#e2e5f0]" />

        <div className="mt-[6px] flex items-center justify-center gap-[3px]">
          <span className="text-[9px] text-[#ed1d43]">✧</span>
          <p className="text-center text-[8px] font-semibold leading-[1.15] text-[#5a6082]">
            Small amount, big moments of happiness
          </p>
          <span className="text-[9px] text-[#ed1d43]">✧</span>
        </div>
      </div>

      {/* ================= RIGHT ================= */}
      <div className="absolute bottom-0 right-0 top-0 w-[24%] border-l border-[#e2e5f0] bg-white px-[7px] py-[11px] text-[#1b2a5c]">
        <div
          className={`flex h-[30px] w-full items-center justify-center gap-[3px] rounded-[8px] text-white ${
            won ? "bg-[#20a66a]" : "bg-[#ed1d43]"
          }`}
        >
          {won ? <CheckCircle2 size={14} strokeWidth={2} /> : <XCircle size={14} strokeWidth={2} />}
          <span className="text-[9px] font-extrabold">{ticket.statusText}</span>
        </div>

        <SideInfo
          label="Draw Date"
          value={
            <>
              <span>{ticket.drawDate.day}</span>{" "}
              <span>{ticket.drawDate.month}</span>{" "}
              <span>{ticket.drawDate.year}</span>
            </>
          }
        />

        <SideInfo
          label="Ticket Price"
          value={ticket.price}
          valueClass="text-[#ed1d43] text-[15px] font-extrabold"
        />

        {won && ticket.prizeType ? (
          <div className="mt-[10px]">
            <p className="text-[9px] text-[#8a97ab]">Prize Won</p>
            <p className="mt-[3px] text-[10px] font-extrabold text-[#168052]">
              {getPrizeLabel(ticket.prizeType)}
            </p>
          </div>
        ) : null}

        <div className="mt-[10px]">
          <p className="text-[9px] text-[#8a97ab]">Purchase Date</p>
          <p className="mt-[3px] text-[10px] font-bold leading-[1.2] text-[#1b2a5c]">
            {ticket.purchaseDate}
          </p>
          <p className="mt-[2px] text-[9px] text-[#5a6082]">{ticket.purchaseTime}</p>
        </div>

        <div className="mt-[10px]">
          <p className="text-[9px] text-[#8a97ab]">Ticket ID</p>
          <div className="mt-[3px] flex items-start gap-[3px]">
            <span className="break-all text-[9px] font-bold leading-[1.1] text-[#1b2a5c]">
              {ticket.id}
            </span>
            <button
              type="button"
              onClick={() => copyId(ticket.id)}
              className="shrink-0 text-[#ed1d43] transition active:scale-90"
            >
              <Copy size={12} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>

      <TicketNotches />
    </div>
  );
};

// ==========================================================
// PRIZE LABEL
// ==========================================================

const getPrizeLabel = (prizeType) => {
  const value = String(prizeType || "").toLowerCase();

  if (value.includes("1st") || value.includes("first")) return "First Prize";
  if (value.includes("2nd") || value.includes("second")) return "Second Prize";
  if (value.includes("3rd") || value.includes("third")) return "Third Prize";
  return "Prize Won";
};

// ==========================================================
// PRIZE FORMAT
// ==========================================================

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

// ==========================================================
// FORMAT AMOUNT
// ==========================================================

const formatAmount = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "₹0";
  return `₹${amount.toLocaleString("en-IN")}`;
};

// ==========================================================
// FORMAT DATE / TIME
// ==========================================================

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

// ==========================================================
// NORMALIZE STATUS
// ==========================================================

const normalizeStatus = (status) => {
  const value = String(status || "").toLowerCase().trim();

  if (value === "win" || value === "winner" || value === "won") return "win";
  if (value === "lost" || value === "loss") return "lost";
  return "pending";
};

// ==========================================================
// FORMAT DRAW DATE
// ==========================================================

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

// ==========================================================
// SIDE INFO
// ==========================================================

const SideInfo = ({ label, value, valueClass = "" }) => (
  <div className="mt-[10px]">
    <p className="text-[9px] text-[#8a97ab]">{label}</p>
    <div
      className={`mt-[3px] text-[10px] font-semibold leading-[1.2] text-[#1b2a5c] ${valueClass}`}
    >
      {value}
    </div>
  </div>
);

// ==========================================================
// MINI PRIZE
// ==========================================================

const MiniPrize = ({ title, amount, subtitle }) => (
  <div className="min-w-0 rounded-[8px] border border-[#e2e5f0] bg-[#f6f9fe] px-[1px] py-[5px] text-center">
    <p className="text-[7px] font-bold leading-[1.1] text-[#1b2a5c]">{title}</p>
    <p className="mt-[4px] whitespace-nowrap text-[11px] font-extrabold leading-none text-[#ed1d43]">
      {amount}
    </p>
    <p className="mt-[3px] text-[6px] leading-[1.1] text-[#8a97ab]">{subtitle}</p>
  </div>
);

// ==========================================================
// TICKET NOTCHES
// ==========================================================

const TicketNotches = () => {
  const positions = [
    "top-[8px]", "top-[29px]", "top-[50px]", "top-[71px]",
    "top-[92px]", "top-[113px]", "top-[134px]", "top-[155px]",
    "top-[176px]", "top-[197px]", "top-[218px]",
  ];

  return (
    <>
      {positions.map((position, index) => (
        <span
          key={`left-notch-${index}`}
          className={`pointer-events-none absolute left-[-7px] z-[50] h-[14px] w-[14px] rounded-full bg-[#EBF0F7] ${position}`}
        />
      ))}
      {positions.map((position, index) => (
        <span
          key={`right-notch-${index}`}
          className={`pointer-events-none absolute right-[-7px] z-[50] h-[14px] w-[14px] rounded-full bg-[#EBF0F7] ${position}`}
        />
      ))}
    </>
  );
};

export default ResultPage;