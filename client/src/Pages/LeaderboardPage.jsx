import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  Check,
  Copy,
  Crown,
  FileText,
  Gift,
  Info,
  Search,
  Sparkles,
  Trophy,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  getActiveTopWinners,
  selectActiveTopWinners,
} from "../reducer/slice/topWinnerSlice";

// =====================================================
// CONSTANTS
// =====================================================

const BOTTOM_NAV_HEIGHT = 64;

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1605196560547-b2f7281b7355?auto=format&fit=crop&w=1400&q=80";

const TICKET_TABS = [
  { key: "daily", label: "DEAR DAILY LOTTERY", icon: Crown },
  { key: "festival", label: "DEAR FESTIVAL LOTTERY", icon: Gift },
];

const FALLBACK_WINNERS = [
  {
    name: "Rakesh Kumar",
    location: "West Bengal",
    prize: "₹1,00,00,000",
    ticket: "28FC200",
    image: "",
  },
  {
    name: "Sunita Devi",
    location: "Assam",
    prize: "₹1,00,00,000",
    ticket: "28FC201",
    image: "",
  },
  {
    name: "Md. Irfan",
    location: "Kolkata",
    prize: "₹1,00,00,000",
    ticket: "28FC202",
    image: "",
  },
  {
    name: "Suresh Patel",
    location: "Guwahati",
    prize: "₹1,00,00,000",
    ticket: "28FC203",
    image: "",
  },
];

// Ticket format generator: First 2 digits + 1 uppercase letter + remaining digits (e.g. 63V40110)
const LETTERS_POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const generateFormattedTicket = (rng) => {
  const prefixDigits = String(10 + Math.floor(rng() * 90)); // First 2 digits (10-99)
  const letter = LETTERS_POOL[Math.floor(rng() * LETTERS_POOL.length)]; // 1 uppercase letter
  const suffixDigits = String(Math.floor(rng() * 100000)).padStart(5, "0"); // Remaining 5 digits
  return `${prefixDigits}${letter}${suffixDigits}`; // e.g., 63V40110
};

// =====================================================
// DETERMINISTIC PSEUDO-RANDOM GENERATOR (MULBERRY32)
// Seeded strictly by date in IST so values remain constant
// throughout the day and only change when the day ends.
// =====================================================

const createSeededRandom = (seedStr) => {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
};

const getTodayISTDateString = () => {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  }); // Returns "YYYY-MM-DD" in Indian Standard Time
};

const getTodayISTFormatted = () => {
  const d = new Date();
  const day = d.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
  });
  const month = d.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    month: "short",
  });
  const year = d.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
  });
  const weekday = d.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
  });
  return `${day} ${month} ${year} (${weekday})`;
};

// =====================================================
// PER-DAY PRIZE & NUMBERS GENERATOR
// 1st Prize: 1 Crore to 5 Crore
// 2nd & 3rd Prize: In Lakhs
// 4th & 5th Prize: In Thousands
// Only changes when the date ends (midnight IST).
// =====================================================

const getDailyPrizeTiers = (dateStr, tabKey = "daily") => {
  const seed = `${dateStr}_${tabKey}`;
  const rng = createSeededRandom(seed);

  // 1st Prize: 1 Crore to 5 Crore
  const firstPrizes = [
    "₹1 CRORE",
    "₹1.5 CRORE",
    "₹2 CRORE",
    "₹2.5 CRORE",
    "₹3 CRORE",
    "₹3.5 CRORE",
    "₹4 CRORE",
    "₹5 CRORE",
  ];

  // 2nd Prize: In Lakhs
  const secondPrizes = [
    "₹25 LAKH",
    "₹30 LAKH",
    "₹35 LAKH",
    "₹40 LAKH",
    "₹50 LAKH",
    "₹75 LAKH",
    "₹90 LAKH",
  ];

  // 3rd Prize: In Lakhs
  const thirdPrizes = [
    "₹1 LAKH",
    "₹2 LAKH",
    "₹3 LAKH",
    "₹5 LAKH",
    "₹8 LAKH",
    "₹10 LAKH",
    "₹15 LAKH",
    "₹20 LAKH",
  ];

  // 4th Prize: In Thousands
  const fourthPrizes = [
    "₹10,000",
    "₹15,000",
    "₹20,000",
    "₹25,000",
    "₹30,000",
    "₹40,000",
    "₹50,000",
  ];

  // 5th Prize: In Thousands
  const fifthPrizes = [
    "₹1,000",
    "₹1,500",
    "₹2,000",
    "₹2,500",
    "₹3,000",
    "₹4,000",
    "₹5,000",
    "₹7,500",
    "₹9,000",
  ];

  const pick = (arr) => arr[Math.floor(rng() * arr.length)];

  // Ticket Series & Numbers
  const seriesPool =
    tabKey === "festival"
      ? ["99FS", "88DL", "77MK", "66SP", "55HL", "44DW", "33NV", "22XF"]
      : ["28FC", "37YB", "18TG", "52BN", "74DX", "19AM", "63EL", "41KP"];

  const series = pick(seriesPool);
  const baseNum = 200 + Math.floor(rng() * 700); // 200-899
  const prefix2 = String(baseNum).slice(0, 2);

  return [
    {
      no: 1,
      rank: "1st Prize",
      amount: pick(firstPrizes),
      ticket: `${series}${baseNum}`,
      tickets: "10 Tickets",
      badge: "bg-[#ffd34e] text-[#7a0f1e]",
    },
    {
      no: 2,
      rank: "2nd Prize",
      amount: pick(secondPrizes),
      ticket: `${series}${baseNum + 1}`,
      tickets: "10 Tickets",
      badge: "bg-[#2e7dd7] text-white",
    },
    {
      no: 3,
      rank: "3rd Prize",
      amount: pick(thirdPrizes),
      ticket: `${series}${baseNum + 2}`,
      tickets: "10 Tickets",
      badge: "bg-[#f08a25] text-white",
    },
    {
      no: 4,
      rank: "4th Prize",
      amount: pick(fourthPrizes),
      ticket: `${series}${prefix2}XX`,
      tickets: "10 Tickets",
      badge: "bg-[#20a66a] text-white",
    },
    {
      no: 5,
      rank: "5th Prize",
      amount: pick(fifthPrizes),
      ticket: `${series}XXX`,
      tickets: "10 Tickets",
      badge: "bg-[#8c4bd6] text-white",
    },
  ];
};

// =====================================================
// PER-DAY PAST DRAW RESULTS GENERATOR
// Randomizes past 5 draws per day based on date seed in IST.
// Only changes after midnight IST (when date ends).
// Ticket format: First 2 digits + 1 uppercase letter + remaining 5 digits (e.g. 63V40110).
// =====================================================
const getPastDraws = (dateStr, tabKey = "festival") => {
  const seed = `${dateStr}_past_draws_${tabKey}`;
  const rng = createSeededRandom(seed);

  // Parse YYYY-MM-DD
  const parts = (dateStr || "").split("-");
  const year = parseInt(parts[0], 10) || 2026;
  const month = (parseInt(parts[1], 10) || 10) - 1;
  const day = parseInt(parts[2], 10) || 13;

  // Compute base draw sequence from epoch days
  const daysSinceEpoch = Math.floor(
    Date.UTC(year, month, day) / (1000 * 60 * 60 * 24)
  );
  const baseDrawNo = (daysSinceEpoch % 8000) + 1200;
  const drawPrefix = tabKey === "festival" ? "FL" : "DL";
  const drawTime = tabKey === "festival" ? "8:00 PM" : "6:30 PM";

  const draws = [];
  for (let i = 1; i <= 5; i++) {
    const pastDate = new Date(Date.UTC(year, month, day - i, 12, 0, 0));
    const dateFormatted = pastDate.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const dayName = pastDate.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
    });

    draws.push({
      no: i,
      date: dateFormatted,
      day: dayName,
      time: drawTime,
      drawNumber: `${drawPrefix}-${baseDrawNo - i}`,
      ticket: generateFormattedTicket(rng),
    });
  }

  return draws;
};

// =====================================================
// MAIN LEADERBOARD PAGE COMPONENT
// =====================================================

const LeaderboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("festival");
  const [selectedTier, setSelectedTier] = useState(1);
  const [copied, setCopied] = useState(false);

  // ===================================================
  // TOP WINNERS FROM ADMIN REDUX STORE
  // ===================================================

  const activeWinners = useSelector(selectActiveTopWinners);

  useEffect(() => {
    dispatch(getActiveTopWinners());
  }, [dispatch]);

  // Display top winners coming from admin (same as Home page)
  const displayWinners = useMemo(() => {
    if (Array.isArray(activeWinners) && activeWinners.length > 0) {
      return activeWinners.map((w) => ({
        name: w.name || "Winner",
        location: w.wonAt
          ? new Date(w.wonAt).toLocaleDateString("en-IN", {
              timeZone: "Asia/Kolkata",
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "Verified Winner",
        prize: `₹${Number(w.winningAmount || 0).toLocaleString("en-IN")}`,
        ticket: w.ticketNumber || "—",
        image: w.image || "",
      }));
    }
    return FALLBACK_WINNERS;
  }, [activeWinners]);

  // ===================================================
  // PER-DAY PRIZE TIERS (1st to 5th)
  // Changes ONLY after midnight IST, not on page refresh
  // ===================================================

  const todayDateStr = useMemo(() => getTodayISTDateString(), []);
  const todayFormatted = useMemo(() => getTodayISTFormatted(), []);

  const todayPrizeTiers = useMemo(() => {
    return getDailyPrizeTiers(todayDateStr, activeTab);
  }, [todayDateStr, activeTab]);

  const pastDraws = useMemo(() => {
    return getPastDraws(todayDateStr, activeTab);
  }, [todayDateStr, activeTab]);

  const activeTierObj = useMemo(() => {
    return (
      todayPrizeTiers.find((t) => t.no === selectedTier) || todayPrizeTiers[0]
    );
  }, [todayPrizeTiers, selectedTier]);

  const lotteryName =
    activeTab === "festival" ? "FESTIVAL LOTTERY" : "DAILY LOTTERY";

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(
        activeTierObj.ticket.replace(/\s+/g, ""),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  // Harmonized Winning Rules based on day's generated tiers
  const dynamicWinningRules = useMemo(() => {
    const p1 = todayPrizeTiers[0];
    const p2 = todayPrizeTiers[1];
    const p3 = todayPrizeTiers[2];
    const p4 = todayPrizeTiers[3];
    const p5 = todayPrizeTiers[4];

    return [
      {
        no: 1,
        condition: "All digits/characters match",
        example: p1.ticket,
        prize: p1.amount,
        total: p1.amount,
        badge: "bg-[#ed1d43]",
        row: "bg-[#ffe4e8]",
      },
      {
        no: 2,
        condition: "Alphabet does not match but all remaining digits match",
        example: p2.ticket,
        prize: p2.amount,
        total: p2.amount,
        badge: "bg-[#2e7dd7]",
        row: "bg-[#e3f0ff]",
      },
      {
        no: 3,
        condition: "All numbers after the alphabet match",
        example: p3.ticket,
        prize: p3.amount,
        total: p3.amount,
        badge: "bg-[#f08a25]",
        row: "bg-[#ffefdc]",
      },
      {
        no: 4,
        condition: "Left-most 4 digits match",
        example: p4.ticket,
        prize: p4.amount,
        total: p4.amount,
        badge: "bg-[#20a66a]",
        row: "bg-[#dcf8ea]",
      },
      {
        no: 5,
        condition: "Left-most 3 digits match",
        example: p5.ticket,
        prize: p5.amount,
        total: p5.amount,
        badge: "bg-[#8c4bd6]",
        row: "bg-[#f0e4ff]",
      },
    ];
  }, [todayPrizeTiers]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#eef3fa] text-[#173e70]">
      <div
        className="relative mx-auto w-full max-w-[500px] overflow-x-hidden"
        style={{ paddingBottom: BOTTOM_NAV_HEIGHT + 24 }}
      >
        {/* ================= TABS ================= */}
        <section className="px-2 pt-3">
          <div className="grid grid-cols-2 gap-1.5">
            {TICKET_TABS.map((t) => {
              const Icon = t.icon;
              const active = t.key === activeTab;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={`flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-1.5 py-3 text-center text-[10.5px] font-extrabold leading-tight shadow-md transition active:scale-[0.98] ${
                    active
                      ? "bg-gradient-to-b from-[#ff1744] to-[#c9102f] text-white"
                      : "bg-[#fffaf4] text-[#173e70]"
                  }`}
                >
                  <Icon
                    size={17}
                    className={`shrink-0 ${
                      active ? "text-[#ffd34e]" : "text-[#ed1d43]"
                    }`}
                  />
                  <span className="min-w-0">{t.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ================= LATEST RESULT HERO ================= */}
        <section className="mt-3 px-2">
          <div
            className="relative overflow-hidden rounded-[16px] bg-[#3b0a14] bg-cover bg-center shadow-lg"
            style={{ backgroundImage: `url(${HERO_IMAGE})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#2a0610]/95 via-[#4a0b18]/80 to-[#2a0610]/60" />
            <div className="pointer-events-none absolute -right-10 top-0 h-48 w-48 rounded-full bg-[#ff8a00]/25 blur-3xl" />
            <div className="pointer-events-none absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-[#ff1744]/20 blur-3xl" />

            <Sparkles
              size={14}
              className="pointer-events-none absolute left-[42%] top-3 text-[#ffcf4a]/80"
            />

            <div className="relative grid grid-cols-[104px_minmax(0,1fr)] items-center gap-3 p-3">
              {/* ticket */}
              <div className="relative min-w-0">
                <div className="absolute inset-0 -rotate-[8deg] rounded-md border border-[#e5c8a4] bg-[#fdf1dc]" />
                <div className="relative -rotate-[3deg] rounded-md border-[3px] border-[#f2d1b8] bg-[#fffaf0] p-1.5 shadow-lg">
                  <p className="text-[8.5px] font-bold leading-tight text-[#153c78]">
                    Government Lottery
                  </p>
                  <p className="text-[19px] font-black leading-none text-[#d7193f]">
                    DEAR
                  </p>
                  <p className="text-[8.5px] font-black leading-tight text-[#153c78]">
                    {lotteryName}
                  </p>
                  <p className="mt-1.5 text-[8px] font-semibold text-[#5a4a2a]">
                    Draw No:
                  </p>
                  <p className="whitespace-nowrap text-[12px] font-black tracking-wide text-[#173e70]">
                    {activeTierObj.ticket}
                  </p>
                </div>
              </div>

              {/* info */}
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-[15px] font-black leading-tight tracking-wide text-white">
                    LATEST RESULT
                  </h2>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#ed1d43] px-2 py-[3px] text-[10px] font-black text-white">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                    LIVE
                  </span>
                </div>

                <p className="mt-1 text-[10.5px] leading-tight text-white/85">
                  Draw Date: {todayFormatted}
                  <br />
                  Draw Time: 8:00 PM
                </p>

                <div className="mt-2 flex items-end justify-between gap-1">
                  <div className="min-w-0">
                    <p className="bg-gradient-to-b from-[#fff1a8] to-[#e0a11b] bg-clip-text font-serif text-[15px] font-black leading-none text-transparent">
                      {activeTierObj.rank.toUpperCase()}
                    </p>
                    <p
                      className="mt-0.5 whitespace-nowrap font-black leading-none text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                      style={{ fontSize: "clamp(22px, 7vw, 30px)" }}
                    >
                      {activeTierObj.amount}
                    </p>
                  </div>

                  <span className="relative flex h-9 w-9 shrink-0 items-center justify-center">
                    <span className="absolute inset-0 rounded-full bg-[#ffd34e]/30 blur-md" />
                    <Trophy
                      size={32}
                      className="relative text-[#ffd34e]"
                      fill="#ffd34e"
                    />
                  </span>
                </div>

                <div className="mt-2 flex">
                  <div className="flex min-w-0 max-w-full items-center gap-2 rounded-lg border border-[#ffd34e]/60 bg-white px-2 py-1">
                    <span className="whitespace-nowrap font-mono text-[15px] font-black tracking-wide text-[#173e70]">
                      {activeTierObj.ticket}
                    </span>
                    <button
                      type="button"
                      onClick={copyNumber}
                      aria-label="Copy number"
                      className="shrink-0 text-[#173e70] active:scale-90"
                      title="Copy ticket number"
                    >
                      {copied ? (
                        <Check size={14} className="text-emerald-600" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                </div>

                <span className="mt-1.5 inline-block rounded-full bg-gradient-to-b from-[#ffb800] to-[#d99a00] px-2 py-[2px] text-[8.5px] font-black uppercase tracking-wide text-[#3b0a14]">
                  Congratulations Winner
                </span>
              </div>
            </div>
          </div>
        </section>

        <main className="space-y-3 px-2 pt-3">
          {/* ================= PRIZE TIERS (1st to 5th TABS) ================= */}
          <section className="grid grid-cols-5 gap-1">
            {todayPrizeTiers.map((tier) => (
              <PrizeTile
                key={tier.no}
                {...tier}
                active={tier.no === selectedTier}
                onClick={() => setSelectedTier(tier.no)}
              />
            ))}
          </section>

          {/* ================= QUICK ACTIONS (2 x 2) ================= */}
          <section className="grid grid-cols-2 gap-2">
            <QuickAction
              icon={<Search size={20} />}
              title="Check Result"
              sub="Enter Ticket Number"
              tone="bg-[#ed1d43]"
              onClick={() => navigate("/results")}
            />
            <QuickAction
              icon={<BarChart3 size={20} />}
              title="All Draw Results"
              sub="View past results"
              tone="bg-[#2e7dd7]"
              onClick={() => navigate("/results")}
            />
            <QuickAction
              icon={<Trophy size={20} />}
              title="Prize Structure"
              sub="See winning rules"
              tone="bg-[#8c4bd6]"
              onClick={() => {
                const el = document.getElementById("winning-rules-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            />
            <QuickAction
              icon={<FileText size={20} />}
              title="Official PDF"
              sub="Download result"
              tone="bg-[#20a66a]"
              onClick={() => navigate("/results")}
            />
          </section>

          {/* ================= TOP WINNERS (FROM ADMIN) ================= */}
          <section className="rounded-[16px] bg-white p-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
              <div className="flex min-w-0 items-center gap-2">
                <Trophy
                  size={20}
                  className="shrink-0 text-[#d4a017]"
                  fill="#ffd34e"
                />
                <h2 className="text-[14px] font-extrabold text-[#173e70]">
                  Top Winners
                </h2>
              </div>

              <span className="text-[10px] font-bold text-[#8a99ad]">
                Total: {displayWinners.length}
              </span>
            </div>

            {/* swipe row with actual admin top winners */}
            <div className="-mx-3 mt-3 flex snap-x gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {displayWinners.map((w, i) => (
                <WinnerCard key={i} rank={i + 1} {...w} />
              ))}
            </div>
          </section>

          {/* ================= PAST DRAW RESULTS ================= */}
          <section className="rounded-[16px] bg-white p-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
              <div className="flex min-w-0 items-center gap-2">
                <CalendarDays size={20} className="shrink-0 text-[#ed1d43]" />
                <h2 className="text-[14px] font-extrabold text-[#173e70]">
                  Past Draw Results
                </h2>
              </div>

              <button
                type="button"
                onClick={() => navigate("/results")}
                className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-[#c9d3e3] bg-white px-2 py-1.5 text-[10.5px] font-semibold text-[#173e70] active:scale-95 transition"
              >
                View All Results
                <ArrowRight size={12} />
              </button>
            </div>

            <div className="mt-3 overflow-hidden rounded-lg border border-[#e2e5f0]">
              <table className="w-full table-fixed border-collapse text-left">
                <colgroup>
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "27%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "25%" }} />
                  <col style={{ width: "23%" }} />
                </colgroup>

                <thead>
                  <tr className="bg-[#3a0b17] text-white">
                    {[
                      "#",
                      "Draw Date",
                      "Draw No.",
                      "1st Prize No.",
                      "Result",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-1 py-2 text-[9px] font-semibold leading-tight"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {pastDraws.map((d, i) => (
                    <tr
                      key={d.no}
                      className={`${
                        i % 2 === 0 ? "bg-white" : "bg-[#f6f9fe]"
                      } border-b border-[#e2e5f0]`}
                    >
                      <td className="px-1 py-2.5 text-[11px] font-black text-[#ed1d43]">
                        {d.no}
                      </td>
                      <td className="px-1 py-2.5">
                        <p className="text-[10px] font-bold leading-tight text-[#173e70]">
                          {d.date}
                        </p>
                        <p className="mt-0.5 text-[8.5px] leading-tight text-[#4b5563]">
                          {d.day} · {d.time}
                        </p>
                      </td>
                      <td className="px-1 py-2.5 font-mono text-[9.5px] font-bold leading-tight text-[#173e70]">
                        {d.drawNumber}
                      </td>
                      <td className="px-1 py-2.5">
                        <span className="whitespace-nowrap font-mono text-[10px] font-black text-[#d7193f]">
                          {d.ticket}
                        </span>
                      </td>
                      <td className="px-1 py-2.5">
                        <button
                          type="button"
                          onClick={() => navigate("/results")}
                          className="flex items-center gap-0.5 whitespace-nowrap rounded-md bg-gradient-to-b from-[#ffb800] to-[#d99a00] px-1.5 py-1 text-[9px] font-extrabold text-white shadow-sm active:scale-95 transition"
                        >
                          <span className="min-[400px]:hidden">View</span>
                          <span className="hidden min-[400px]:inline">
                            View Result
                          </span>
                          <ArrowRight size={9} strokeWidth={3} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ================= WINNING RULES ================= */}
          <section
            id="winning-rules-section"
            className="overflow-hidden rounded-[18px] bg-gradient-to-br from-[#3a0b17] via-[#2b0a16] to-[#1a0710] p-2.5 shadow-lg"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <BookOpen size={22} className="shrink-0 text-[#ffd34e]" />
                <h2 className="text-[14px] font-extrabold leading-tight text-white">
                  Winning Rules
                </h2>
              </div>

              <span className="text-[10px] font-bold text-[#ffd34e]/80">
                Official Multipliers
              </span>
            </div>

            <p className="mt-2 px-1 text-[11px] leading-snug text-white/80">
              Match your ticket number with the drawn number and see exciting
              prizes!
            </p>

            <div className="mt-2 overflow-hidden rounded-lg">
              <table className="w-full table-fixed border-collapse text-left">
                <colgroup>
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "30%" }} />
                  <col style={{ width: "24%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "19%" }} />
                </colgroup>

                <thead>
                  <tr className="bg-[#1a0710] text-white">
                    {[
                      "#",
                      "Match Condition",
                      "Example",
                      "Prize / Ticket",
                      "Total (×10)",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-1 py-2.5 text-[9.5px] font-semibold leading-tight"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {dynamicWinningRules.map((r) => (
                    <RuleRow key={r.no} {...r} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ================= IMPORTANT INFO ================= */}
          <section className="flex items-start gap-2 rounded-[16px] border border-[#bfe8d3] bg-[#e7f8ef] px-3 py-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#14a06a] text-white">
              <Info size={13} />
            </span>
            <p className="min-w-0 text-[11.5px] leading-snug text-[#26354b]">
              All results are verified against official government lottery draw
              publications. Winners are listed as per the official release.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
};

// =====================================================
// SMALL COMPONENTS
// =====================================================

const PrizeTile = ({
  no,
  rank,
  amount,
  ticket,
  tickets,
  badge,
  active,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative min-w-0 rounded-xl px-0.5 py-2 text-center shadow-md transition-all active:scale-95 ${
      active
        ? "bg-gradient-to-b from-[#ff1744] to-[#c9102f] ring-2 ring-[#ffd34e]/60"
        : "bg-white hover:bg-[#fff9f0]"
    }`}
  >
    <span
      className={`mx-auto flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${badge}`}
    >
      {no}
    </span>

    <p
      className={`mt-1 text-[9px] font-bold leading-tight ${
        active ? "text-white" : "text-[#4b5563]"
      }`}
    >
      {rank}
    </p>

    <p
      className={`mt-0.5 whitespace-nowrap text-[10px] sm:text-[10.5px] font-black leading-tight ${
        active ? "text-white" : "text-[#173e70]"
      }`}
    >
      {amount}
    </p>

    <span
      className={`mt-1 inline-block max-w-full whitespace-nowrap rounded px-0.5 py-[1px] font-mono text-[8px] font-black leading-tight ${
        active
          ? "bg-white text-[#c9102f]"
          : "border border-[#dfe5f0] bg-[#f6f9fe] text-[#173e70]"
      }`}
    >
      {ticket}
    </span>

    <p
      className={`mt-1 text-[8.5px] leading-tight ${
        active ? "text-white/90" : "text-[#4b5563]"
      }`}
    >
      {tickets}
    </p>
  </button>
);

const QuickAction = ({ icon, title, sub, tone, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex min-w-0 items-center gap-2.5 rounded-xl bg-white p-2.5 text-left shadow-sm transition active:scale-[0.97] hover:shadow-md"
  >
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white ${tone}`}
    >
      {icon}
    </span>
    <span className="min-w-0">
      <span className="block text-[12px] font-extrabold leading-tight text-[#173e70]">
        {title}
      </span>
      <span className="mt-0.5 block text-[10px] leading-tight text-[#4b5563]">
        {sub}
      </span>
    </span>
  </button>
);

const WinnerCard = ({ rank, name, location, prize, ticket, image }) => (
  <div className="flex w-[114px] shrink-0 snap-start flex-col items-center rounded-xl border border-[#f1d9a0] bg-gradient-to-b from-[#fff0c9] to-[#fff8e8] px-1.5 pb-2 pt-1.5 text-center shadow-sm">
    <span className="mt-1 flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#d4a017] bg-[#fff5d1] text-[#a0561b] overflow-hidden shadow-xs">
      {image ? (
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <User size={22} />
      )}
    </span>

    <p className="mt-1 text-[11px] font-black leading-tight text-[#173e70] truncate max-w-full">
      {name}
    </p>
    <p className="mt-0.5 text-[9px] leading-tight text-[#4b5563] truncate max-w-full">
      {location}
    </p>
    <p className="mt-1 whitespace-nowrap text-[9px] leading-tight text-[#4b5563]">
      Ticket:{" "}
      <span className="font-mono font-bold text-[#173e70]">{ticket}</span>
    </p>

    <span className="mt-1.5 w-full whitespace-nowrap rounded-full bg-gradient-to-r from-[#ff1744] to-[#c9102f] px-1 py-1 text-[9.5px] font-black text-white shadow-xs">
      {prize}
    </span>
  </div>
);

const RuleRow = ({ no, condition, example, prize, total, badge, row }) => (
  <tr className={`${row} border-b border-white/60`}>
    <td className="px-1 py-2.5">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-black text-white ${badge}`}
      >
        {no}
      </span>
    </td>

    <td className="px-1 py-2.5 text-[10px] font-medium leading-tight text-[#26354b]">
      {condition}
    </td>

    <td className="px-1 py-2.5">
      <span className="whitespace-nowrap rounded border border-[#e6c97c] bg-[#fffdf5] px-0.5 py-0.5 font-mono text-[9.5px] font-black text-[#d7193f]">
        {example}
      </span>
    </td>

    <td className="px-1 py-2.5 text-[10.5px] font-bold leading-tight text-[#173e70]">
      {prize}
    </td>

    <td className="px-1 py-2.5 text-[10.5px] font-black leading-tight text-[#d7193f]">
      {total}
    </td>
  </tr>
);

export default LeaderboardPage;
