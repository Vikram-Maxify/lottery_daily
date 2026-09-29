
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Crown,
  FileText,
  Gift,
  Home,
  Landmark,
  ShieldCheck,
  Sparkles,
  Target,
  Ticket,
  Trophy,
  User,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import { fetchProfile } from "../reducer/slice/authSlice";

import {
  getActiveLotteryConfig,
  selectActiveLotteryConfig,
  selectLotteryActiveLoading,
  selectLotteryError,
  selectLotterySuccessMessage,
} from "../reducer/slice/createLotteryConfigSlice";

// =====================================================
// HELPERS
// =====================================================

const HINDI_MONTHS = [
  "जनवरी",
  "फरवरी",
  "मार्च",
  "अप्रैल",
  "मई",
  "जून",
  "जुलाई",
  "अगस्त",
  "सितंबर",
  "अक्टूबर",
  "नवंबर",
  "दिसंबर",
];

const formatHindiDate = (date, month, year) => {
  if (!date || !month || !year) return null;

  return `${date} ${HINDI_MONTHS[month - 1]} ${year}`;
};

const formatCrore = (amount) => {
  if (amount === undefined || amount === null) return "₹0";

  const num = Number(amount);

  if (!Number.isFinite(num) || num <= 0) {
    return "₹0";
  }

  const crore = num / 10000000;

  if (crore >= 1) {
    const formatted =
      crore % 1 === 0 ? crore.toFixed(0) : crore.toFixed(2);

    return `₹${formatted} करोड़`;
  }

  const lakh = num / 100000;

  if (lakh >= 1) {
    const formatted =
      lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(2);

    return `₹${formatted} लाख`;
  }

  return `₹${num.toLocaleString("en-IN")}`;
};

const getDaysRemaining = (date, month, year) => {
  if (!date || !month || !year) return null;

  const target = new Date(year, month - 1, date);
  const now = new Date();

  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - now.getTime();

  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

// =====================================================
// COUNTDOWN HELPERS
// =====================================================

const getDrawTimestamp = (activeConfig) => {
  if (!activeConfig) return null;

  const drawTime = String(activeConfig.drawTime || "").trim();

  if (!drawTime) return null;

  const [hours, minutes] = drawTime.split(":").map(Number);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  const date = activeConfig.drawDate
    ? new Date(activeConfig.drawDate)
    : new Date(
        Number(activeConfig.year),
        Number(activeConfig.month) - 1,
        Number(activeConfig.date || 1)
      );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  const utcTimestamp = Date.UTC(
    year,
    month,
    day,
    hours - 5,
    minutes - 30,
    0,
    0
  );

  return utcTimestamp;
};

const getCountdown = (drawTimestamp) => {
  if (!drawTimestamp) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: false,
      available: false,
    };
  }

  const difference = drawTimestamp - Date.now();

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: true,
      available: true,
    };
  }

  const totalSeconds = Math.floor(difference / 1000);

  const days = Math.floor(totalSeconds / 86400);

  const hours = Math.floor((totalSeconds % 86400) / 3600);

  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    expired: false,
    available: true,
  };
};

// =====================================================
// DATA
// =====================================================

const NAV_ITEMS = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Daily Lottery", icon: Ticket, path: "/daily-lottery" },
  { label: "Festival Lottery", icon: Crown, path: "/festival-lottery" },
  { label: "Results", icon: BarChart3, path: "/results" },
  { label: "Profile", icon: User, path: "/profile" },
];

const WINNERS = [
  {
    name: "Rakesh S.",
    amount: "₹1,00,00,000",
    ticket: "10F6****",
    time: "2 days ago",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
  },
  {
    name: "Pooja M.",
    amount: "₹25,00,000",
    ticket: "27A9****",
    time: "4 days ago",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
  },
  {
    name: "Imran K.",
    amount: "₹10,00,000",
    ticket: "90B1****",
    time: "6 days ago",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
  },
  {
    name: "Suman T.",
    amount: "₹5,00,000",
    ticket: "33C7****",
    time: "1 week ago",
    image:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=160&q=80",
  },
];

const RULES = [
  {
    n: "1",
    condition: "All digits/characters match",
    example: "10F68057",
    prize: "₹50 Lakh",
    total: "₹5 Crore",
    badge: "bg-[#ed1d43]",
    row: "bg-[#ffe4e8]",
  },
  {
    n: "2",
    condition: "Alphabet does not match but all remaining digits match",
    example: "11F68057",
    prize: "₹30 Lakh",
    total: "₹3 Crore",
    badge: "bg-[#2e7dd7]",
    row: "bg-[#e3f0ff]",
  },
  {
    n: "3",
    condition: "All numbers after the alphabet match",
    example: "99F68057",
    prize: "₹20,000",
    total: "₹2 Lakh",
    badge: "bg-[#f08a25]",
    row: "bg-[#ffefdc]",
  },
  {
    n: "4",
    condition: "Left-most 4 digits match",
    example: "10F6XXXX",
    prize: "₹20,000",
    total: "₹2 Lakh",
    badge: "bg-[#20a66a]",
    row: "bg-[#dcf8ea]",
  },
  {
    n: "5",
    condition: "Left-most 3 digits match",
    example: "10AXXXXX",
    prize: "₹900",
    total: "₹9,000",
    badge: "bg-[#8c4bd6]",
    row: "bg-[#f0e4ff]",
  },
];

// =====================================================
// COMPONENT
// =====================================================

const HomeLotterySection = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  // =====================================================
  // REDUX STATE
  // =====================================================

  const activeConfig = useSelector(selectActiveLotteryConfig);

  const loading = useSelector(selectLotteryActiveLoading);

  const error = useSelector(selectLotteryError);

  const successMessage = useSelector(selectLotterySuccessMessage);

  // =====================================================
  // USER / WALLET
  // =====================================================

  const user = useSelector((state) => state.auth?.user);

  const isAuthenticated = useSelector(
    (state) => state.auth?.isAuthenticated
  );

  const walletAmount = user?.wallet ?? user?.balance ?? 0;

  // =====================================================
  // COUNTDOWN
  // =====================================================

  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
    available: false,
  });

  // =====================================================
  // FETCH PROFILE
  // =====================================================

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  // =====================================================
  // FETCH ACTIVE LOTTERY
  // =====================================================

  useEffect(() => {
    dispatch(getActiveLotteryConfig());
  }, [dispatch]);

  // =====================================================
  // DERIVED VALUES
  // =====================================================

  const drawDateText = useMemo(() => {
    if (!activeConfig) {
      return "जल्द घोषित होगा";
    }

    return (
      formatHindiDate(
        activeConfig.date,
        activeConfig.month,
        activeConfig.year
      ) || "जल्द घोषित होगा"
    );
  }, [activeConfig]);

  const daysRemaining = useMemo(() => {
    if (!activeConfig) return null;

    return getDaysRemaining(
      activeConfig.date,
      activeConfig.month,
      activeConfig.year
    );
  }, [activeConfig]);

  const isActive = Boolean(activeConfig?.isActive);

  const firstPrize = formatCrore(activeConfig?.prizes?.first);

  const secondPrize = formatCrore(activeConfig?.prizes?.second);

  const thirdPrize = formatCrore(activeConfig?.prizes?.third);

  // =====================================================
  // LIVE COUNTDOWN
  // =====================================================

  useEffect(() => {
    if (!activeConfig) {
      return;
    }

    const drawTimestamp = getDrawTimestamp(activeConfig);

    if (!drawTimestamp) {
      setCountdown({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        expired: false,
        available: false,
      });

      return;
    }

    const updateCountdown = () => {
      setCountdown(getCountdown(drawTimestamp));
    };

    updateCountdown();

    const interval = setInterval(updateCountdown, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [activeConfig?.drawDate, activeConfig?.drawTime]);

  const formattedHours = String(countdown.hours).padStart(2, "0");

  const formattedMinutes = String(countdown.minutes).padStart(2, "0");

  const formattedSeconds = String(countdown.seconds).padStart(2, "0");

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleBuyTicket = () => {
    if (!isActive) {
      alert("कोई सक्रिय लॉटरी उपलब्ध नहीं है");
      return;
    }

    navigate("/buy-ticket");
  };

  const handleWithdraw = () => {
    navigate("/user/withdraw");
  };

  // =====================================================
  // WINNERS TOGGLE
  // =====================================================

  const [showAllWinners, setShowAllWinners] = useState(false);

  // =====================================================
  // DRAW DISPLAY DATA
  // =====================================================

  const dynamicPrize = firstPrize !== "₹0" ? firstPrize : "₹0";

  return (
    <div className="min-h-screen w-full bg-[#EEF3FA] flex justify-center">
      <main className="relative w-full max-w-[500px] min-h-screen bg-[#EEF3FA] pb-[84px] shadow-xl">

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="relative overflow-hidden bg-[#1a0a1c]">

          <div className="relative overflow-hidden bg-cover bg-center">
            <div className="absolute inset-0 bg-gradient-to-br from-[#06132d]/95 via-[#3b0d1c]/88 to-[#7a0f1e]/80" />

            <div className="pointer-events-none absolute -left-16 top-10 h-52 w-52 rounded-full bg-[#ff1744]/25 blur-3xl" />

            <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-[#ff8a00]/30 blur-3xl" />

            <Sparkles
              size={16}
              className="pointer-events-none absolute right-[8%] top-3 text-[#ffb82e]/80"
            />

            <Sparkles
              size={12}
              className="pointer-events-none absolute left-[46%] top-[20%] text-[#ffcf4a]/70"
            />

            <Sparkles
              size={14}
              className="pointer-events-none absolute bottom-[22%] left-[3%] text-[#ff3155]/70"
            />

            <div className="relative grid w-full grid-cols-[1fr_1.08fr] items-center gap-2 px-3 pb-5 pt-4">

              {/* LEFT */}

              <div className="relative z-10 min-w-0">

                <p className="text-[11px] font-medium text-white">
                  India's Most Exciting
                </p>

                <h1 className="mt-1 font-black leading-[0.9] tracking-tight">

                  <span
                    className="block bg-gradient-to-b from-[#ffe08a] to-[#e0a11b] bg-clip-text text-transparent"
                    style={{
                      fontSize: "clamp(38px,10vw,66px)",
                    }}
                  >
                    DEAR
                  </span>

                  <span
                    className="block text-white"
                    style={{
                      fontSize: "clamp(24px,7vw,46px)",
                    }}
                  >
                    LOTTERY
                  </span>

                </h1>

                <p className="mt-1.5 text-[13px] font-medium leading-tight text-white">
                  Small Ticket
                  <br />
                  Big Dreams
                </p>

                <div className="mt-3 flex items-start gap-3">

                  <HeroFeature
                    icon={<Trophy size={17} />}
                    text="Big Prizes"
                  />

                  <HeroFeature
                    icon={<ShieldCheck size={17} />}
                    text="Fair Draws"
                  />

                  <HeroFeature
                    icon={<Users size={17} />}
                    text="Lakhs of Winners"
                  />

                </div>

                <button
                  type="button"
                  onClick={handleBuyTicket}
                  disabled={!isActive}
                  className={`mt-3.5 inline-flex h-10 w-full max-w-[205px] items-center justify-center gap-1.5 rounded-xl text-[12px] font-extrabold text-white shadow-[0_8px_25px_rgba(255,20,67,0.4)] transition active:scale-[0.98] ${
                    isActive
                      ? "bg-gradient-to-r from-[#ff1744] to-[#e8263f]"
                      : "cursor-not-allowed bg-gray-600 opacity-70"
                  }`}
                >
                  Buy Ticket Now
                  <ArrowRight size={15} />
                </button>

              </div>

              {/* RIGHT - DYNAMIC TICKET */}

              <div className="relative flex items-center justify-center">

                <Coin className="-left-1 top-[26%] h-6 w-6 rotate-[-20deg]" />

                <Coin className="-right-1 top-[44%] h-6 w-6 rotate-[15deg]" />

                <Coin className="bottom-[4%] right-[6%] h-5 w-5 rotate-[25deg]" />

                <div className="relative w-full max-w-[220px]">

                  <div
                    className="relative z-10 rotate-[3deg] rounded-[0.9em] border-[0.35em] border-[#f7d9a8] bg-[#fffaf0] p-[0.55em] shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
                    style={{
                      fontSize: "clamp(6px, 1.8vw, 10px)",
                    }}
                  >

                    <div className="absolute -inset-[0.3em] rounded-[1em] border border-[#ff4d68]/50" />

                    <div className="border border-[#e5c8a4] p-[0.55em]">

                      <div className="flex items-start justify-between gap-[0.4em]">

                        <div className="flex items-center gap-[0.4em]">

                          <div className="flex h-[2.3em] w-[2.3em] shrink-0 items-center justify-center rounded-full bg-[#d7193f] text-white">
                            <Crown size="1.3em" />
                          </div>

                          <p className="text-[0.75em] font-bold leading-tight text-[#d22a43]">
                            Nagaland State Lotteries
                          </p>

                        </div>

                        <div className="text-right leading-tight">

                          <p className="text-[0.75em] font-black text-[#d22a43]">
                            Draw on
                          </p>

                          <p className="text-[0.88em] font-black text-[#d22a43]">
                            {drawDateText}
                          </p>

                          <p className="text-[0.53em] font-bold text-[#d22a43]">
                            {activeConfig?.drawTime || "8.00 P.M."}
                          </p>

                          <span className="mt-[0.2em] inline-block bg-[#d7193f] px-[0.8em] py-[0.1em] text-[0.7em] font-black text-white">
                            DAILY
                          </span>

                        </div>

                      </div>

                      <p className="text-[3em] font-black leading-[0.95] text-[#d7193f]">
                        DEAR
                      </p>

                      <p className="text-[0.5em] font-bold text-[#153c78]">
                        DEAR DAILY LOTTERY
                      </p>

                      <div className="mt-[0.2em] flex items-center justify-between gap-[0.3em]">

                        <div className="text-[0.75em] font-bold leading-tight text-[#d7193f]">
                          First
                          <br />
                          Prize
                          <br />
                          ₹
                        </div>

                        <div className="text-center">

                          <p className="whitespace-nowrap text-[2.7em] font-black leading-none text-[#153c78]">
                            {dynamicPrize}
                          </p>

                          <p className="text-[0.5em] font-bold text-[#153c78]">
                            (First Prize)
                          </p>

                        </div>

                        <div className="flex h-[3.2em] w-[3.2em] shrink-0 flex-col items-center justify-center rounded-full bg-[#d7198c] text-center text-[0.65em] font-black leading-tight text-white">
                          Price
                          <span className="text-[1.25em]">
                            ₹6/-
                          </span>
                        </div>

                      </div>

                      <div className="mt-[0.45em] border-y border-[#d7bba5] py-[0.25em] text-center">

                        <p className="text-[0.58em] font-bold text-[#26354b]">
                          Ticket Number
                        </p>

                        <p className="text-[1.8em] font-black tracking-[0.2em] text-[#173e70]">
                          47B 39120
                        </p>

                      </div>

                    </div>

                  </div>

                  <div className="relative mx-auto -mt-3 h-5 w-[92%] rounded-[50%] bg-gradient-to-r from-[#8a5210] via-[#ffd85c] to-[#8a5210] shadow-[0_0_30px_rgba(255,190,50,0.6)]" />

                  <div className="mx-auto -mt-3 h-4 w-[80%] rounded-[50%] bg-gradient-to-r from-[#6d3f0a] via-[#e0a11b] to-[#6d3f0a]" />

                </div>

              </div>

            </div>
          </div>

        </section>

        {/* =====================================================
            TOP WINNERS
        ===================================================== */}

        <section className="px-2.5 pt-3">

          <div className="rounded-2xl border border-[#ff3155]/40 bg-gradient-to-br from-[#5d1028] via-[#461025] to-[#27102a] px-3 py-3 shadow-[0_10px_28px_rgba(0,0,0,0.25)]">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">

                <Trophy
                  size={21}
                  className="text-[#ffd24c]"
                  fill="#ffd24c"
                />

                <div className="leading-tight">

                  <h2 className="text-[16px] font-extrabold text-white">
                    Top Winners
                  </h2>

                  <p className="text-[10px] text-white/65">
                    Real People. Real Winnings.
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAllWinners(!showAllWinners)
                }
                className="flex h-8 items-center gap-1 rounded-full border border-white/40 px-3 text-[11px] font-semibold text-white transition hover:bg-white/10"
              >
                {showAllWinners
                  ? "Show Less"
                  : "View All"}

                <ArrowRight
                  size={13}
                  className={
                    showAllWinners ? "rotate-90" : ""
                  }
                />
              </button>

            </div>

            <div className="mt-2.5 flex gap-3 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

              {WINNERS.slice(0, 4).map((winner) => (
                <WinnerCard
                  key={winner.name}
                  {...winner}
                />
              ))}

            </div>

            {showAllWinners && (
              <div className="mt-4 border-t border-white/10 pt-4">

                <h3 className="mb-3 text-[14px] font-bold text-white">
                  All Winners
                </h3>

                <div className="grid grid-cols-2 gap-3">

                  {WINNERS.map((winner) => (
                    <WinnerCard
                      key={winner.name}
                      {...winner}
                    />
                  ))}

                </div>

              </div>
            )}

          </div>

        </section>

        {/* =====================================================
            LICENSED
        ===================================================== */}

        <section className="px-2.5 pt-3">

          <div className="flex items-stretch overflow-hidden rounded-2xl bg-[#fffaf2] shadow-lg">

            <div className="flex min-w-0 flex-[1.35] items-center gap-2 px-2.5 py-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#d8c8ad] bg-[#f7f0e4] text-[#173e70]">
                <Landmark size={23} />
              </div>

              <div className="min-w-0 leading-tight">

                <h2 className="text-[14px] font-black text-[#173e70]">
                  Licensed & Regulated
                </h2>

                <p className="mt-0.5 text-[10px] font-medium text-[#344054]">
                  By Government of Nagaland
                </p>

                <p className="text-[9px] text-gray-500">
                  Nagaland State Lotteries
                </p>

              </div>

            </div>

            <div className="grid flex-1 grid-cols-3 border-l border-[#d8c8ad]">

              <TrustFeature
                icon={<ShieldCheck size={19} />}
                text="100% Legal"
              />

              <TrustFeature
                icon={<FileText size={19} />}
                text="Verified Draws"
              />

              <TrustFeature
                icon={<Users size={19} />}
                text="Transparent System"
              />

            </div>

          </div>

        </section>

        {/* =====================================================
            DAILY + FESTIVAL
        ===================================================== */}

        <section className="px-2.5 pt-3">

          <div className="grid grid-cols-2 gap-2.5">

            {/* DAILY LOTTERY */}

            <LotteryTypeCard
              daily
              title="Daily Lottery"
              subtitle="Small Ticket, Big Opportunities"
              button="Buy Daily Lottery"
              prize={firstPrize}
              label="DAILY LOTTERY"
              number="47B 39120"
              price="₹6/-"
              items={[
                {
                  icon: <Zap size={11} />,
                  text: "Daily Draws",
                },
                {
                  icon: <Gift size={11} />,
                  text: "Exciting Prizes",
                },
                {
                  icon: <Target size={11} />,
                  text: "Easy to Play",
                },
              ]}
              onClick={() => navigate("/buy-ticket")}
            />

            {/* FESTIVAL LOTTERY */}

            <LotteryTypeCard
              title="Festival Lottery"
              subtitle="Bigger Draws, Bigger Celebrations"
              button="Buy Festival Lottery"
              prize={secondPrize}
              label="FESTIVAL LOTTERY"
              number="10F 68057"
              price="₹50/-"
              items={[
                {
                  icon: <Crown size={11} />,
                  text: "Mega Prizes",
                },
                {
                  icon: <Gift size={11} />,
                  text: "Special Draws",
                },
                {
                  icon: <CalendarDays size={11} />,
                  text: "Limited Period",
                },
              ]}
              onClick={() => navigate("/festival")}
            />

          </div>

        </section>

        {/* =====================================================
            WINNING RULES
        ===================================================== */}

        <section className="px-2.5 pt-3">

          <div className="overflow-hidden rounded-[20px] bg-[#fffaf4] shadow-[0_12px_35px_rgba(0,0,0,0.2)]">

            <div className="flex items-center justify-between gap-2 px-3 pb-2.5 pt-3.5">

              <div className="min-w-0">

                <h2 className="font-serif text-[23px] font-black leading-none tracking-tight text-[#173e70]">
                  Winning{" "}
                  <span className="text-[#d7193f]">
                    Rules
                  </span>
                </h2>

                <p className="mt-1.5 max-w-[185px] text-[9px] leading-snug text-[#4b5563]">
                  Match your ticket number with the drawn number and win exciting prizes!
                </p>

              </div>

              <div className="shrink-0 overflow-hidden rounded-lg border border-[#e6c97c] bg-[#fffdf5] text-center shadow-sm">

                <p className="bg-[#fff6d9] px-2 py-0.5 text-[8px] font-medium text-gray-600">
                  Example Winning Number
                </p>

                <p className="px-2 py-1 text-[14px] font-black tracking-[2px] text-[#d7193f]">
                  10F{" "}
                  <span className="text-[#173e70]">
                    68057
                  </span>
                </p>

              </div>

            </div>

            <div className="px-2 pb-2.5">

              <div className="overflow-hidden rounded-lg border border-[#e8e0d4]">

                <div className="grid grid-cols-[20px_1fr_60px_45px_45px] items-center gap-1 bg-[#0d2547] px-1.5 py-1.5 text-[8px] font-semibold text-white">

                  <span className="text-center">
                    ₹
                  </span>

                  <span>Match Condition</span>

                  <span>Example</span>

                  <span>Prize/Ticket</span>

                  <span>Total (×10)</span>

                </div>

                {RULES.map((rule) => (
                  <RuleRow
                    key={rule.n}
                    {...rule}
                  />
                ))}

              </div>

            </div>

            <div className="mx-2 mb-3 flex items-start gap-2 rounded-xl border border-[#f2c4c4] bg-[#fff0f0] px-2.5 py-2.5">

              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d7193f] text-[10px] font-black text-white">
                i
              </div>

              <p className="text-[8px] leading-relaxed text-[#6b2737]">
                <strong>Note:</strong> The above is a general representation of winning rules. Actual prizes, rules, and draw details are subject to the official published terms and conditions.
              </p>

            </div>

          </div>

        </section>

        {successMessage && (
          <p className="px-4 pt-3 text-center text-[13px] text-green-600">
            {successMessage}
          </p>
        )}

        {error && (
          <p className="px-4 pt-3 text-center text-[13px] text-red-500">
            {typeof error === "string"
              ? error
              : "Something went wrong"}
          </p>
        )}

        {/* =====================================================
            BOTTOM NAV
        ===================================================== */}

        <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[500px] -translate-x-1/2 border-t border-white/10 bg-[#061b3d]/95 backdrop-blur">

          <div className="grid h-[68px] grid-cols-5">

            {NAV_ITEMS.map(
              ({ label, icon: Icon, path }) => {

                const active =
                  location.pathname === path;

                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => navigate(path)}
                    className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                      active
                        ? "text-[#ff1744]"
                        : "text-white/85 hover:text-white"
                    }`}
                  >

                    <Icon
                      size={21}
                      fill={
                        active
                          ? "#ff1744"
                          : "none"
                      }
                    />

                    <span
                      className={`text-[10px] ${
                        active
                          ? "font-bold"
                          : "font-medium"
                      }`}
                    >
                      {label}
                    </span>

                  </button>
                );
              }
            )}

          </div>

        </nav>

      </main>
    </div>
  );
};

// =====================================================
// TIME BOX
// =====================================================

const TimeBox = ({ value, label }) => (
  <div className="flex flex-col items-center">

    <div className="flex h-[23px] min-w-[24px] items-center justify-center rounded-[4px] border border-white/[0.08] bg-black/15">

      <span className="text-[15px] font-extrabold leading-none text-white">
        {value}
      </span>

    </div>

    <span className="mt-[2px] text-[7px] font-semibold text-white/65">
      {label}
    </span>

  </div>
);

// =====================================================
// COIN
// =====================================================

const Coin = ({ className = "" }) => (
  <div
    className={`absolute z-20 flex items-center justify-center rounded-full border-2 border-[#f5bf35] bg-gradient-to-br from-[#fff08a] to-[#d9950b] text-[10px] font-black text-[#855500] shadow-lg ${className}`}
  >
    ₹
  </div>
);

// =====================================================
// HERO FEATURE
// =====================================================

const HeroFeature = ({ icon, text }) => (
  <div className="flex flex-col items-center gap-0.5 text-center">

    <span className="text-[#ffd34e]">
      {icon}
    </span>

    <span className="text-[8px] font-medium leading-tight text-white/90">
      {text}
    </span>

  </div>
);

// =====================================================
// WINNER CARD
// =====================================================

const WinnerCard = ({
  name,
  amount,
  ticket,
  time,
  image,
}) => (
  <div className="flex min-w-[140px] shrink-0 items-center gap-2">

    <img
      src={image}
      alt={name}
      className="h-10 w-10 shrink-0 rounded-full border-2 border-[#ffd34e] object-cover"
    />

    <div className="min-w-0 leading-tight">

      <p className="truncate text-[11px] font-medium text-white">
        {name}
      </p>

      <p className="truncate text-[13px] font-black text-[#ffd34e]">
        {amount}
      </p>

      <p className="truncate text-[9px] text-white/70">
        Tkt: {ticket}
      </p>

      <p className="truncate text-[9px] text-white/55">
        {time}
      </p>

    </div>

  </div>
);

// =====================================================
// TRUST FEATURE
// =====================================================

const TrustFeature = ({ icon, text }) => (
  <div className="flex flex-col items-center justify-center gap-0.5 border-l border-[#d8c8ad] px-1 py-2 first:border-l-0">

    <span className="text-[#173e70]">
      {icon}
    </span>

    <span className="text-center text-[8px] font-medium leading-tight text-[#344054]">
      {text}
    </span>

  </div>
);

// =====================================================
// LOTTERY TYPE CARD
// =====================================================

const LotteryTypeCard = ({
  daily = false,
  title,
  subtitle,
  button,
  items,
  onClick,
  prize,
  label,
  number,
  price,
}) => (
  <div className="flex flex-col overflow-hidden rounded-2xl border border-[#d7d0c6] bg-[#fffaf4] p-1.5 shadow-[0_8px_22px_rgba(0,0,0,0.15)]">

    <div
      className={`relative flex h-[84px] items-center justify-center overflow-hidden rounded-xl ${
        daily
          ? "bg-gradient-to-br from-[#ffb3a8] via-[#ffd9c2] to-[#ffefe0]"
          : "bg-gradient-to-br from-[#123c75] via-[#2a5ea8] to-[#f2c95a]"
      }`}
    >

      <Sparkles
        size={13}
        className={`absolute right-2 top-2 ${
          daily
            ? "text-[#ff3155]"
            : "text-[#ffd34e]"
        }`}
      />

      <div className="absolute h-[68%] w-[72%] -rotate-[10deg] rounded-md border border-[#e5c8a4] bg-[#fdf1dc]" />

      <div className="absolute h-[68%] w-[72%] rotate-[8deg] rounded-md border border-[#e5c8a4] bg-[#fdf1dc]" />

      <div
        className="relative w-[76%] -rotate-[4deg] rounded-md border-[2px] border-[#f2d1b8] bg-[#fffaf0] p-[0.45em] shadow-xl"
        style={{
          fontSize: "clamp(5px, 1.6vw, 11px)",
        }}
      >

        <p className="text-[1.5em] font-black leading-none text-[#d7193f]">
          DEAR
        </p>

        <p className="text-[0.65em] font-bold text-[#153c78]">
          {label}
        </p>

        <div className="mt-[0.15em] flex items-center justify-between gap-1">

          <div>

            <p className="text-[0.52em] font-bold leading-tight text-[#d7193f]">
              First Prize
            </p>

            <p className="whitespace-nowrap text-[1.55em] font-black leading-none text-[#153c78]">
              {prize}
            </p>

          </div>

          <div className="flex h-[2.5em] w-[2.5em] shrink-0 flex-col items-center justify-center rounded-full bg-[#d7198c] text-center text-[0.5em] font-black leading-tight text-white">

            Price

            <span className="text-[1.25em]">
              {price}
            </span>

          </div>

        </div>

        <p className="mt-[0.25em] border-t border-[#d7bba5] pt-[0.15em] text-center text-[0.98em] font-black tracking-[0.15em] text-[#173e70]">
          {number}
        </p>

      </div>

    </div>

    <div className="flex flex-1 flex-col px-1 pt-2">

      <h3
        className={`font-serif text-[18px] font-black leading-none ${
          daily
            ? "text-[#d7193f]"
            : "text-[#173e70]"
        }`}
      >
        {title}
      </h3>

      <p className="mt-1 text-[9px] leading-snug text-[#4b5563]">
        {subtitle}
      </p>

      <div className="mt-2 space-y-1">

        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-1.5 text-[10px] font-medium text-[#344054]"
          >

            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white ${
                daily
                  ? "bg-[#ed1d43]"
                  : "bg-[#173e70]"
              }`}
            >
              {item.icon}
            </span>

            {item.text}

          </div>
        ))}

      </div>

      <button
        type="button"
        onClick={onClick}
        className={`mb-0.5 mt-2.5 flex h-9 w-full items-center justify-center gap-1 rounded-xl text-[11px] font-extrabold text-white shadow-lg transition active:scale-[0.98] ${
          daily
            ? "bg-gradient-to-r from-[#ff1744] to-[#d60f38] hover:brightness-110"
            : "bg-gradient-to-r from-[#173e70] to-[#0d2547] hover:brightness-110"
        }`}
      >

        {button}

        <ArrowRight size={13} />

      </button>

    </div>

  </div>
);

// =====================================================
// RULE ROW
// =====================================================

const RuleRow = ({
  n,
  condition,
  example,
  prize,
  total,
  badge,
  row,
}) => (
  <div
    className={`grid grid-cols-[20px_1fr_60px_45px_45px] items-center gap-1 border-t border-white/70 px-1.5 py-1.5 ${row}`}
  >

    <span
      className={`mx-auto flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-black text-white ${badge}`}
    >
      {n}
    </span>

    <span className="text-[8px] font-medium leading-tight text-[#26354b]">
      {condition}
    </span>

    <span className="rounded border border-[#e6c97c] bg-[#fffdf5] px-1 py-0.5 text-center font-mono text-[9px] font-black tracking-[0.5px] text-[#d7193f]">
      {example}
    </span>

    <span className="text-[9px] font-bold leading-tight text-[#173e70]">
      {prize}
    </span>

    <span className="text-[9px] font-black leading-tight text-[#d7193f]">
      {total}
    </span>

  </div>
);

export default HomeLotterySection;

