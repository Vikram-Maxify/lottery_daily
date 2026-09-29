import {
  CheckCircle2,
  Copy,
  Crown,
  ShieldCheck,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
} from "react";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import { Navigate } from "react-router-dom";

import {
  clearLotteryConfigError,
  getMyLotteryEntries,
} from "../reducer/slice/createLotteryConfigSlice";

import { fetchProfile } from "../reducer/slice/authSlice";

// ==========================================================
// MONTH NAMES (Hindi)
// ==========================================================

const MONTH_NAMES_HI = [
  "जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून",
  "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर",
];

// ==========================================================
// RESULT PAGE
// ==========================================================

const ResultPage = () => {
  const dispatch = useDispatch();

  const {
    user,
    isAuthenticated,
    profileLoading,
  } = useSelector((state) => state.auth || {});

  const {
    myEntries = [],
    myEntriesLoading = false,
    error = null,
    activeConfig = null,
  } = useSelector((state) => state.createLotteryConfig || {});

  const profileRequested = useRef(false);

  // ========================================================
  // AUTH CHECK
  // ========================================================

  useEffect(() => {
    if (user || isAuthenticated) return;
    if (profileRequested.current) return;
    profileRequested.current = true;
    dispatch(fetchProfile());
  }, [dispatch, user, isAuthenticated]);

  // ========================================================
  // FETCH RESULTS
  // ========================================================

  useEffect(() => {
    if (profileLoading) return;
    if (!isAuthenticated || !user) return;

    dispatch(getMyLotteryEntries());

    return () => {
      dispatch(clearLotteryConfigError());
    };
  }, [dispatch, profileLoading, isAuthenticated, user]);

  // ========================================================
  // MARKET NAME
  // ========================================================

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

  // ========================================================
  // RESULT TICKETS
  // ========================================================

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
          statusText: status === "win" ? "विजेता" : "हार गए",
          drawDate,
          drawTime: item?.drawTime || "—",
          price: formatAmount(entry?.amount),
          purchaseDate: formatDate(entry?.entryDate || entry?.createdAt),
          purchaseTime: formatTime(entry?.createdAt || entry?.entryDate),
          message:
            status === "win"
              ? "बधाई हो! आपका टिकट विजेता है"
              : "अगली बार किस्मत आजमाएं",
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

  // ========================================================
  // RESULT COUNTS
  // ========================================================

  const totalResults = resultTickets.length;
  const totalWins = resultTickets.filter((t) => t.status === "win").length;
  const totalLost = resultTickets.filter((t) => t.status === "lost").length;

  // ========================================================
  // AUTH CHECKING
  // ========================================================

  const authChecking =
    !user &&
    !isAuthenticated &&
    (!profileRequested.current || profileLoading);

  const copyId = async (id) => {
    try {
      await navigator.clipboard.writeText(id);
    } catch {}
  };

  // ========================================================
  // LOADING
  // ========================================================

  if (authChecking || profileLoading) {
    return (
      <div className="min-h-screen w-full bg-[#061b3d] flex items-center justify-center px-5">
        <div className="relative flex flex-col items-center gap-4 overflow-hidden rounded-[22px] border border-[#ffd15a]/20 bg-[#0d2547] px-12 py-10 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-[#ff1744]/20 blur-3xl" />

          <div className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#ffd15a]/30">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#ffd15a] border-t-transparent" />
          </div>

          <p className="relative text-sm font-semibold text-white/80">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // ========================================================
  // NOT AUTHENTICATED
  // ========================================================

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // ========================================================
  // MAIN UI
  // ========================================================

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#061b3d] pb-[90px] text-white">
      <div className="mx-auto w-full max-w-[680px]">

        {/* ==================================================
            HEADER
        ================================================== */}

        <section className="relative overflow-hidden bg-gradient-to-br from-[#06132d] via-[#3b0d1c] to-[#7a0f1e] px-4 pb-14 pt-6 sm:px-6">
          <div className="pointer-events-none absolute -left-16 top-4 h-48 w-48 rounded-full bg-[#ff1744]/25 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 top-0 h-56 w-56 rounded-full bg-[#ff8a00]/20 blur-3xl" />

          <Sparkles size={18} className="pointer-events-none absolute right-[10%] top-5 text-[#ffb82e]/80" />
          <Sparkles size={12} className="pointer-events-none absolute left-[46%] top-[22%] text-[#ffcf4a]/70" />
          <Sparkles size={14} className="pointer-events-none absolute bottom-[20%] left-[5%] text-[#ff3155]/70" />

          <Crown size={155} className="pointer-events-none absolute -right-8 -top-8 text-[#ffd15a]/[0.07]" />

          <div className="relative flex items-center gap-3 sm:gap-4">
            <div className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-[18px] border-2 border-[#ffd15a] bg-gradient-to-br from-[#0d2547] to-[#061b3d] shadow-[0_0_25px_rgba(255,209,90,0.25)] sm:h-[72px] sm:w-[72px]">
              <Trophy className="h-[32px] w-[32px] text-[#ffd15a] sm:h-[38px] sm:w-[38px]" strokeWidth={1.7} />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-medium text-white/60 sm:text-[13px]">
                Lottery Results
              </p>

              <h1 className="mt-0.5 text-[25px] font-extrabold leading-tight tracking-tight text-white sm:text-[30px]">
                मेरे रिजल्ट
              </h1>

              <p className="mt-1 text-[11px] leading-[1.35] text-white/75 sm:text-[13px]">
                आपके जीते और हारे हुए टिकट यहाँ दिखेंगे
              </p>
            </div>
          </div>
        </section>

        {/* ==================================================
            RESULT SUMMARY
        ================================================== */}

        <section className="relative z-10 -mt-10 px-3 sm:px-6">
          <div className="grid grid-cols-3 overflow-hidden rounded-[18px] bg-[#fffaf4] shadow-[0_12px_30px_rgba(0,0,0,0.3)]">
            <ResultStat label="कुल रिजल्ट" value={totalResults} icon={Trophy} tone="red" />
            <ResultStat label="विजेता" value={totalWins} icon={CheckCircle2} tone="green" bordered />
            <ResultStat label="हार गए" value={totalLost} icon={XCircle} tone="orange" bordered />
          </div>
        </section>

        {/* ==================================================
            RESULTS CONTENT
        ================================================== */}

        <section className="mt-5 px-3 sm:px-6">

          {/* LOADING */}
          {myEntriesLoading ? (
            <div className="relative flex h-[160px] flex-col items-center justify-center overflow-hidden rounded-[18px] border border-[#d7d0c6] bg-[#fffaf4] shadow-[0_10px_28px_rgba(0,0,0,0.18)]">
              <div className="pointer-events-none absolute -left-12 -top-12 h-32 w-32 rounded-full bg-[#ed1d43]/10 blur-3xl" />

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ed1d43] text-white shadow-[0_8px_20px_rgba(237,29,67,0.25)]">
                <Trophy size={25} className="animate-pulse" />
              </div>

              <p className="relative mt-3 text-[13px] font-semibold text-[#173e70]">
                आपके रिजल्ट लोड हो रहे हैं...
              </p>
            </div>
          ) : null}

          {/* ERROR */}
          {!myEntriesLoading && error && !resultTickets.length ? (
            <div className="flex h-[160px] flex-col items-center justify-center rounded-[18px] border border-[#ed1d43]/20 bg-[#fff0f2] px-5 text-center shadow-[0_10px_28px_rgba(0,0,0,0.15)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ed1d43] text-white">
                <XCircle size={24} />
              </div>

              <p className="mt-3 text-[13px] font-semibold text-[#d7193f]">
                {error}
              </p>
            </div>
          ) : null}

          {/* RESULT CARDS */}
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
                <div className="relative flex h-[190px] flex-col items-center justify-center overflow-hidden rounded-[18px] border border-[#d7d0c6] bg-[#fffaf4] px-5 text-center shadow-[0_10px_28px_rgba(0,0,0,0.18)]">
                  <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#ffd15a]/15 blur-3xl" />

                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#173e70] text-[#ffd15a] shadow-lg">
                    <Trophy size={27} />
                  </div>

                  <p className="mt-4 text-[14px] font-extrabold text-[#173e70]">
                    अभी कोई रिजल्ट उपलब्ध नहीं है
                  </p>

                  <p className="mt-2 max-w-[310px] text-[12px] leading-[1.4] text-[#6b7280]">
                    आपका टिकट ड्रॉ होने के बाद ही यहाँ जीत या हार का रिजल्ट दिखाई देगा।
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="mt-7 flex flex-col items-center px-6">
          <div className="flex w-full items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#ffd15a]/70" />
            <ShieldCheck size={22} className="text-[#ffd15a]" />
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#ffd15a]/70" />
          </div>

          <p className="mt-2 text-[14px] font-medium text-[#ffd15a]">
            विश्वास के साथ खेलें
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
    red: { icon: "bg-[#ed1d43]", color: "text-[#d7193f]" },
    green: { icon: "bg-[#20a66a]", color: "text-[#168052]" },
    orange: { icon: "bg-[#f08a25]", color: "text-[#d66d10]" },
    navy: { icon: "bg-[#173e70]", color: "text-[#173e70]" },
  };

  const currentTone = TONES[tone] || TONES.red;

  return (
    <div
      className={`flex min-w-0 items-center justify-center gap-2 px-2.5 py-3.5 sm:gap-3 sm:px-4 ${
        bordered ? "border-l border-[#d8c8ad]" : ""
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white sm:h-11 sm:w-11 ${currentTone.icon}`}
      >
        <Icon size={20} strokeWidth={2} />
      </div>

      <div className="min-w-0">
        <div
          className={`text-[21px] font-black leading-none sm:text-[24px] ${currentTone.color}`}
        >
          {value}
        </div>

        <p className="mt-1 truncate text-[9px] font-medium text-[#4b5563] sm:text-[11px]">
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
    <div className="relative w-full overflow-hidden rounded-[18px] bg-[#fffaf4] shadow-[0_14px_34px_rgba(0,0,0,0.28)]">
      {/* Outer premium border */}
      <div className="pointer-events-none absolute inset-0 z-[40] rounded-[18px] border border-[#ffd15a]/60" />

      {/* ==================================================
          LEFT
      ================================================== */}

      <div className="absolute bottom-0 left-0 top-0 flex w-[24%] flex-col items-center overflow-hidden border-r border-[#d7193f]/60 bg-gradient-to-b from-[#ed1d43] via-[#c91438] to-[#8f102d] px-[6px] py-[17px] text-center">
        <div className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-[#ff1744]/30 blur-3xl" />

        <Crown
          size={43}
          strokeWidth={1.5}
          fill="#ffd15a"
          className="relative text-[#ffd15a]"
        />

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

        <p className="mt-[3px] text-[10px] font-semibold text-white">
          खेलो विश्वास
        </p>

        <p className="text-[10px] font-semibold text-white">
          के साथ
        </p>
      </div>

      {/* ==================================================
          CENTER
      ================================================== */}

      <div className="absolute bottom-0 left-[24%] right-[24%] top-0 bg-gradient-to-b from-[#fffdf8] via-[#fffaf4] to-[#f5eadb] px-[8px] py-[13px] text-[#173e70]">
        <div className="flex items-center justify-center gap-[4px]">
          <span className="text-[10px] text-[#d7193f]">❧</span>

          <div className="rounded-full border border-[#d8c8ad] bg-[#fffaf4] px-[8px] py-[4px]">
            <p className="whitespace-nowrap text-[9px] font-extrabold text-[#173e70] sm:text-[10px]">
              भारत की भरोसेमंद लॉटरी
            </p>
          </div>

          <span className="text-[10px] text-[#d7193f]">❧</span>
        </div>

        <p className="mt-[11px] text-center text-[11px] font-bold sm:text-[12px]">
          आपका चुना हुआ नंबर
        </p>

        <div className="mt-[7px] grid grid-cols-6 gap-[3px]">
          {ticket.number.map((digit, index) => (
            <div
              key={index}
              className={`flex h-[37px] items-center justify-center rounded-[7px] border ${
                won
                  ? "border-[#20a66a] bg-[#e9f8f0]"
                  : "border-[#d8c8ad] bg-[#fff4d9]"
              }`}
            >
              <span
                className={`text-[18px] font-black ${
                  won ? "text-[#168052]" : "text-[#173e70]"
                }`}
              >
                {digit}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-[11px] grid grid-cols-3 gap-[4px]">
          <MiniPrize
            title="प्रथम पुरस्कार"
            amount={formatPrize(ticket.prizes.first)}
            subtitle="(6 अंक मिलने पर)"
          />

          <MiniPrize
            title="द्वितीय पुरस्कार"
            amount={formatPrize(ticket.prizes.second)}
            subtitle="(5 अंक मिलने पर)"
          />

          <MiniPrize
            title="तृतीय पुरस्कार"
            amount={formatPrize(ticket.prizes.third)}
            subtitle="(4 अंक मिलने पर)"
          />
        </div>

        <div className="mt-[10px] h-px bg-[#d8c8ad]" />

        <div className="mt-[6px] flex items-center justify-center gap-[3px]">
          <span className="text-[9px] text-[#d7193f]">✧</span>

          <p className="text-center text-[8px] font-semibold leading-[1.15] text-[#4b5563]">
            छोटी सी राशि, बड़ी खुशियों की शुरुआत
          </p>

          <span className="text-[9px] text-[#d7193f]">✧</span>
        </div>
      </div>

      {/* ==================================================
          RIGHT
      ================================================== */}

      <div className="absolute bottom-0 right-0 top-0 w-[24%] border-l border-[#d8c8ad] bg-[#fffaf4] px-[7px] py-[11px] text-[#173e70]">
        <div
          className={`flex h-[30px] w-full items-center justify-center gap-[3px] rounded-[8px] text-white ${
            won ? "bg-[#20a66a]" : "bg-[#ed1d43]"
          }`}
        >
          {won ? (
            <CheckCircle2 size={14} strokeWidth={2} />
          ) : (
            <XCircle size={14} strokeWidth={2} />
          )}

          <span className="text-[9px] font-extrabold">
            {ticket.statusText}
          </span>
        </div>

        <SideInfo
          label="ड्रॉ दिनांक"
          value={
            <>
              <span>{ticket.drawDate.day}</span>{" "}
              <span>{ticket.drawDate.month}</span>{" "}
              <span>{ticket.drawDate.year}</span>
            </>
          }
        />

        <SideInfo
          label="टिकट मूल्य"
          value={ticket.price}
          valueClass="text-[#d7193f] text-[15px] font-extrabold"
        />

        {won && ticket.prizeType ? (
          <div className="mt-[10px]">
            <p className="text-[9px] text-[#6b7280]">
              जीता हुआ पुरस्कार
            </p>

            <p className="mt-[3px] text-[10px] font-extrabold text-[#168052]">
              {getPrizeLabel(ticket.prizeType)}
            </p>
          </div>
        ) : null}

        <div className="mt-[10px]">
          <p className="text-[9px] text-[#6b7280]">
            खरीद की तारीख
          </p>

          <p className="mt-[3px] text-[10px] font-bold leading-[1.2] text-[#173e70]">
            {ticket.purchaseDate}
          </p>

          <p className="mt-[2px] text-[9px] text-[#4b5563]">
            {ticket.purchaseTime}
          </p>
        </div>

        <div className="mt-[10px]">
          <p className="text-[9px] text-[#6b7280]">
            टिकट आईडी
          </p>

          <div className="mt-[3px] flex items-start gap-[3px]">
            <span className="break-all text-[9px] font-bold leading-[1.1] text-[#173e70]">
              {ticket.id}
            </span>

            <button
              type="button"
              onClick={() => copyId(ticket.id)}
              className="shrink-0 text-[#d7193f] transition active:scale-90"
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

  if (value.includes("1st") || value.includes("first")) {
    return "प्रथम पुरस्कार";
  }

  if (value.includes("2nd") || value.includes("second")) {
    return "द्वितीय पुरस्कार";
  }

  if (value.includes("3rd") || value.includes("third")) {
    return "तृतीय पुरस्कार";
  }

  return "पुरस्कार जीता";
};

// ==========================================================
// PRIZE FORMAT
// ==========================================================

const formatPrize = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "₹0";
  }

  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2).replace(/\.00$/, "")} करोड़`;
  }

  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2).replace(/\.00$/, "")} लाख`;
  }

  return `₹${amount.toLocaleString("en-IN")}`;
};

// ==========================================================
// FORMAT AMOUNT
// ==========================================================

const formatAmount = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "₹0";
  }

  return `₹${amount.toLocaleString("en-IN")}`;
};

// ==========================================================
// FORMAT DATE
// ==========================================================

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("hi-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

// ==========================================================
// FORMAT TIME
// ==========================================================

const formatTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString("hi-IN", {
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

  if (value === "win" || value === "winner" || value === "won") {
    return "win";
  }

  if (value === "lost" || value === "loss") {
    return "lost";
  }

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
        day: date.toLocaleDateString("hi-IN", { day: "2-digit" }),
        month: date.toLocaleDateString("hi-IN", { month: "long" }),
        year: date.toLocaleDateString("hi-IN", { year: "numeric" }),
      };
    }
  }

  const d = item?.date;
  const m = item?.month;
  const y = item?.year;

  if (d && m && y) {
    return {
      day: String(d),
      month: MONTH_NAMES_HI[Number(m) - 1] || "",
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
    <p className="text-[9px] text-[#6b7280]">{label}</p>

    <div
      className={`mt-[3px] text-[10px] font-semibold leading-[1.2] text-[#173e70] ${valueClass}`}
    >
      {value}
    </div>
  </div>
);

// ==========================================================
// MINI PRIZE
// ==========================================================

const MiniPrize = ({ title, amount, subtitle }) => (
  <div className="min-w-0 rounded-[8px] border border-[#d8c8ad] bg-[#fff4d9] px-[1px] py-[5px] text-center">
    <p className="text-[7px] font-bold leading-[1.1] text-[#173e70]">
      {title}
    </p>

    <p className="mt-[4px] whitespace-nowrap text-[11px] font-extrabold leading-none text-[#d7193f]">
      {amount}
    </p>

    <p className="mt-[3px] text-[6px] leading-[1.1] text-[#6b7280]">
      {subtitle}
    </p>
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
          className={`pointer-events-none absolute left-[-7px] z-[50] h-[14px] w-[14px] rounded-full bg-[#061b3d] ${position}`}
        />
      ))}

      {positions.map((position, index) => (
        <span
          key={`right-notch-${index}`}
          className={`pointer-events-none absolute right-[-7px] z-[50] h-[14px] w-[14px] rounded-full bg-[#061b3d] ${position}`}
        />
      ))}
    </>
  );
};

export default ResultPage;