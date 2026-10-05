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
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import { fetchProfile } from "../reducer/slice/authSlice";

// DAILY lottery slice (existing)
import {
  getActiveLotteryConfig,
  selectActiveLotteryConfig,
  selectLotteryError,
  selectLotterySuccessMessage,
} from "../reducer/slice/createLotteryConfigSlice";

// FESTIVAL lottery slice (existing) - aliased to avoid name clash
// NOTE: agar tumhari file ka naam festivalLotteryReducer.js hai to path wahi kar lena
import {
  getActiveLotteryConfig as getActiveFestivalConfig,
  selectActiveLottery as selectActiveFestivalLottery,
} from "../reducer/slice/festivalLotteryReducer";

import {
  getActiveBanners,
  selectActiveBannerLoading,
  selectActiveBanners,
} from "../reducer/slice/bannerReducer";

import {
  getActiveTopWinners,
  selectActiveTopWinners,
} from "../reducer/slice/topWinnerSlice";

// =====================================================
// HELPERS
// =====================================================

const formatCrore = (amount) => {
  if (amount === undefined || amount === null) return "₹0";

  const num = Number(amount);

  if (!Number.isFinite(num) || num <= 0) {
    return "₹0";
  }

  const crore = num / 10000000;

  if (crore >= 1) {
    const formatted = crore % 1 === 0 ? crore.toFixed(0) : crore.toFixed(2);

    return `₹${formatted} करोड़`;
  }

  const lakh = num / 100000;

  if (lakh >= 1) {
    const formatted = lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(2);

    return `₹${formatted} लाख`;
  }

  return `₹${num.toLocaleString("en-IN")}`;
};

const getTimeAgo = (dateStr) => {
  if (!dateStr) return "Recently";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Recently";
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }
  const months = Math.floor(diffDays / 30);
  return `${months} mo${months > 1 ? "s" : ""} ago`;
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

/* =====================================================
   WINNING RULES DATA
   Dono arrays ki shape same hai (badge + row colors ke saath)
===================================================== */

const DAILY_RULES = [
  {
    n: "1",
    condition: "All digits/characters match",
    example: "10A2123",
    prize: "₹50 Lakh",
    total: "₹5 Crore",
    badge: "bg-[#ed1d43]",
    row: "bg-[#ffe4e8]",
  },
  {
    n: "2",
    condition: "Alphabet does not match but all remaining digits match",
    example: "10X0123",
    prize: "₹30 Lakh",
    total: "₹3 Crore",
    badge: "bg-[#2e7dd7]",
    row: "bg-[#e3f0ff]",
  },
  {
    n: "3",
    condition: "All numbers after the alphabet match",
    example: "99A6123",
    prize: "₹20,000",
    total: "₹2 Lakh",
    badge: "bg-[#f08a25]",
    row: "bg-[#ffefdc]",
  },
  {
    n: "4",
    condition: "Left-most 4 digits match",
    example: "10A80786",
    prize: "₹20,000",
    total: "₹2 Lakh",
    badge: "bg-[#20a66a]",
    row: "bg-[#dcf8ea]",
  },
  {
    n: "5",
    condition: "Left-most 3 digits match",
    example: "10Z3543",
    prize: "₹900",
    total: "₹9,000",
    badge: "bg-[#8c4bd6]",
    row: "bg-[#f0e4ff]",
  },
];

// PLACEHOLDER: festival ke actual prize / conditions yaha replace kar lena
const FESTIVAL_RULES = [
  {
    n: "1",
    condition: "All digits/characters match",
    example: "10B3123",
    prize: "₹1 Crore",
    total: "₹10 Crore",
    badge: "bg-[#ed1d43]",
    row: "bg-[#ffe4e8]",
  },
  {
    n: "2",
    condition: "Alphabet does not match but all remaining digits match",
    example: "10Y1263",
    prize: "₹50 Lakh",
    total: "₹5 Crore",
    badge: "bg-[#2e7dd7]",
    row: "bg-[#e3f0ff]",
  },
  {
    n: "3",
    condition: "All numbers after the alphabet match",
    example: "99B8123",
    prize: "₹50,000",
    total: "₹5 Lakh",
    badge: "bg-[#f08a25]",
    row: "bg-[#ffefdc]",
  },
  {
    n: "4",
    condition: "Left-most 4 digits match",
    example: "10A2786",
    prize: "₹30,000",
    total: "₹3 Lakh",
    badge: "bg-[#20a66a]",
    row: "bg-[#dcf8ea]",
  },
  {
    n: "5",
    condition: "Left-most 3 digits match",
    example: "10Z3543",
    prize: "₹1,500",
    total: "₹15,000",
    badge: "bg-[#8c4bd6]",
    row: "bg-[#f0e4ff]",
  },
];

const RULE_TABS = [
  { key: "daily", label: "Daily Lottery" },
  { key: "festival", label: "Festival Lottery" },
];

const RULES_BY_TAB = {
  daily: DAILY_RULES,
  festival: FESTIVAL_RULES,
};

const RULES_GRID = "grid-cols-[24px_minmax(0,1fr)_70px_54px_58px]";

// =====================================================
// COMPONENT
// =====================================================

const HomeLotterySection = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const [rulesTab, setRulesTab] = useState("daily");
  const activeRules = RULES_BY_TAB[rulesTab];

  // =====================================================
  // REDUX STATE
  // =====================================================

  // Daily active lottery
  const activeConfig = useSelector(selectActiveLotteryConfig);
  const error = useSelector(selectLotteryError);
  const successMessage = useSelector(selectLotterySuccessMessage);

  // Festival active lottery
  const festivalConfig = useSelector(selectActiveFestivalLottery);

  // =====================================================
  // DYNAMIC IMAGES (from backend imageUrl)
  // =====================================================

  const dailyImageUrl = activeConfig?.imageUrl || null;
  const festivalImageUrl = festivalConfig?.imageUrl || null;

  // =====================================================
  // BANNERS
  // =====================================================

  const activeBanners = useSelector(selectActiveBanners);
  const activeBannerLoading = useSelector(selectActiveBannerLoading);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // =====================================================
  // TOP WINNERS
  // =====================================================

  const activeWinners = useSelector(selectActiveTopWinners);

  // =====================================================
  // FETCH DATA ON MOUNT
  // =====================================================

  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(getActiveLotteryConfig()); // Daily
    dispatch(getActiveFestivalConfig()); // Festival
    dispatch(getActiveBanners());
    dispatch(getActiveTopWinners());
  }, [dispatch]);

  const displayWinners = useMemo(() => {
    let list = WINNERS;
    if (activeWinners && activeWinners.length > 0) {
      list = activeWinners.map((w) => ({
        name: w.name,
        amount: `₹${Number(w.winningAmount || 0).toLocaleString("en-IN")}`,
        ticket: w.ticketNumber,
        time: getTimeAgo(w.wonAt),
        image:
          w.image ||
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
      }));
    }
    let filled = [...list];
    while (filled.length < 4) {
      filled = [...filled, ...list];
    }
    return filled;
  }, [activeWinners]);

  // =====================================================
  // BANNER INDEX SAFETY
  // =====================================================

  useEffect(() => {
    if (!activeBanners.length) {
      setCurrentBannerIndex(0);
      return;
    }

    if (currentBannerIndex >= activeBanners.length) {
      setCurrentBannerIndex(0);
    }
  }, [activeBanners.length, currentBannerIndex]);

  // =====================================================
  // AUTO BANNER SLIDER
  // =====================================================

  useEffect(() => {
    if (activeBanners.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % activeBanners.length);
    }, 4000);

    return () => {
      clearInterval(interval);
    };
  }, [activeBanners.length]);

  // =====================================================
  // DERIVED VALUES
  // =====================================================

  const firstPrize = formatCrore(activeConfig?.prizes?.first);
  const secondPrize = formatCrore(activeConfig?.prizes?.second);

  const currentBanner = activeBanners[currentBannerIndex] || null;

  const handleBannerDotClick = (index) => {
    setCurrentBannerIndex(index);
  };

  return (
    <div className="min-h-screen w-full bg-[#EEF3FA] flex justify-center">
      {/* Winners infinite scroll animation */}

      <style>{`
        @keyframes winners-marquee {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-50%);
          }
        }

        .winners-track {
          display: flex;
          width: max-content;
          animation: winners-marquee 24s linear infinite;
          will-change: transform;
        }

        .winners-wrap:hover .winners-track,
        .winners-wrap:active .winners-track {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .winners-track {
            animation: none;
          }
        }
      `}</style>

      <main className="relative w-full max-w-[500px] min-h-screen bg-[#EEF3FA] shadow-xl">
        {/* =====================================================
            HOMEPAGE BANNERS
            ACTIVE BANNERS FROM ADMIN
        ====================================================== */}

        {(activeBannerLoading || activeBanners.length > 0) && (
          <section className="pt-[9px]">
            <div className="relative overflow-hidden bg-[#d9dee8] shadow-[0_8px_22px_rgba(0,0,0,0.15)]">
              {/* LOADING */}

              {activeBannerLoading && !activeBanners.length && (
                <div className="aspect-[16/7] w-full animate-pulse bg-[#dfe4ec]" />
              )}

              {/* BANNER IMAGE */}

              {currentBanner && (
                <div className="relative aspect-[16/7] w-full overflow-hidden">
                  <img
                    key={currentBanner._id}
                    src={currentBanner.imageUrl}
                    alt={
                      currentBanner.title ||
                      `Homepage Banner ${currentBannerIndex + 1}`
                    }
                    className="h-full w-full object-cover"
                    loading={currentBannerIndex === 0 ? "eager" : "lazy"}
                  />

                  {/* Slight bottom overlay for dots */}

                  {activeBanners.length > 1 && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/35 to-transparent" />
                  )}

                  {/* SLIDER DOTS */}

                  {activeBanners.length > 1 && (
                    <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
                      {activeBanners.map((banner, index) => (
                        <button
                          key={banner._id}
                          type="button"
                          onClick={() => handleBannerDotClick(index)}
                          aria-label={`Show banner ${index + 1}`}
                          className={`h-1.5 rounded-full transition-all ${
                            index === currentBannerIndex
                              ? "w-5 bg-white"
                              : "w-1.5 bg-white/60"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* =====================================================
            TOP WINNERS
        ====================================================== */}

        <section className="px-2.5 pt-2">
          <div className="overflow-hidden rounded-2xl border border-[#ff3155]/40 bg-gradient-to-br from-[#5d1028] via-[#461025] to-[#27102a] py-3 shadow-[0_10px_28px_rgba(0,0,0,0.25)]">
            <div className="flex items-center gap-2 px-3">
              <Trophy size={21} className="text-[#ffd24c]" />

              <div className="leading-tight">
                <h2 className="text-[16px] font-extrabold text-white">
                  Top Winners
                </h2>

                <p className="text-[10px] text-white/65">
                  Real People. Real Winnings.
                </p>
              </div>
            </div>

            <div
              className="winners-wrap mt-3 overflow-hidden"
              style={{
                WebkitMaskImage:
                  "linear-gradient(to right, transparent 0, #000 7%, #000 93%, transparent 100%)",
                maskImage:
                  "linear-gradient(to right, transparent 0, #000 7%, #000 93%, transparent 100%)",
              }}
            >
              <div className="winners-track">
                {[0, 1].map((set) => (
                  <div
                    key={set}
                    className="flex shrink-0"
                    aria-hidden={set === 1}
                  >
                    {displayWinners.map((winner, idx) => (
                      <WinnerCard
                        key={`${set}-${winner.name}-${idx}`}
                        {...winner}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            LICENSED
        ====================================================== */}

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
        ====================================================== */}

        <section className="px-2.5 pt-3">
          <div className="grid grid-cols-2 gap-2.5">
            <LotteryTypeCard
              daily
              imageUrl={dailyImageUrl}
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

            <LotteryTypeCard
              imageUrl={festivalImageUrl}
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
            DAILY / LUCKY NUMBERS SECTION
        ====================================================== */}
        {/* <section className="px-2.5 pt-1">
          <DailyNumbersSection mode="home" />
        </section> */}

        {/* =====================================================
            WINNING RULES
        ====================================================== */}

        <section className="px-2.5 pt-3 pb-24">
          <div className="overflow-hidden rounded-[20px] bg-[#fffaf4] shadow-[0_12px_35px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between gap-3 px-3 pb-3 pt-4">
              <div className="min-w-0">
                <h2 className="font-serif text-[22px] font-black leading-none tracking-tight text-[#173e70]">
                  Winning <span className="text-[#d7193f]">Rules</span>
                </h2>

                <p className="mt-2 max-w-[200px] text-[11px] leading-snug text-[#4b5563]">
                  Match your ticket number with the drawn number and win
                  exciting prizes!
                </p>
              </div>

              <div className="shrink-0 overflow-hidden rounded-lg border border-[#e6c97c] bg-[#fffdf5] text-center shadow-sm">
                <p className="bg-[#fff6d9] px-2 py-1 text-[9px] font-semibold leading-tight text-gray-600">
                  Example Winning Number
                </p>

                <p className="px-2 py-1.5 text-[17px] font-black tracking-[2px] text-[#d7193f]">
                  10FD <span className="text-[#173e70]">8057</span>
                </p>
              </div>
            </div>

            {/* Pill Toggle */}
            <div className="px-3 pb-3">
              <div
                role="tablist"
                aria-label="Lottery type"
                className="relative grid grid-cols-2 rounded-full border border-[#e8e0d4] bg-[#f3ece0] p-1"
              >
                {/* Sliding highlight */}
                <span
                  aria-hidden="true"
                  className={`absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-full bg-gradient-to-r from-[#ff1744] to-[#d60f38] shadow-md transition-transform duration-300 ease-out ${
                    rulesTab === "festival"
                      ? "translate-x-full"
                      : "translate-x-0"
                  }`}
                />

                {RULE_TABS.map((tab) => {
                  const isTabActive = rulesTab === tab.key;

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={isTabActive}
                      onClick={() => setRulesTab(tab.key)}
                      className={`relative z-10 rounded-full py-2 text-[12px] font-bold transition-colors duration-300 ${
                        isTabActive ? "text-white" : "text-[#173e70]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-2 pb-3">
              <div className="overflow-hidden rounded-lg border border-[#e8e0d4]">
                <div
                  className={`grid ${RULES_GRID} items-center gap-1.5 bg-[#0d2547] px-2 py-2 text-[10px] font-semibold leading-tight text-white`}
                >
                  <span className="text-center">₹</span>

                  <span>Match Condition</span>

                  <span>Example</span>

                  <span>Prize / Ticket</span>

                  <span>Total (×10)</span>
                </div>

                {activeRules.map((rule) => (
                  <RuleRow key={`${rulesTab}-${rule.n}`} {...rule} />
                ))}
              </div>
            </div>

            <div className="mx-2 mb-3 flex items-start gap-2 rounded-xl border border-[#f2c4c4] bg-[#fff0f0] px-3 py-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d7193f] text-[11px] font-black text-white">
                i
              </div>

              <p className="text-[10px] leading-relaxed text-[#6b2737]">
                <strong>Note:</strong> The above is a general representation of
                winning rules. Actual prizes, rules, and draw details are
                subject to the official published terms and conditions.
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
            {typeof error === "string" ? error : "Something went wrong"}
          </p>
        )}

        {/* =====================================================
            BOTTOM NAV
        ====================================================== */}

        <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[500px] -translate-x-1/2 border-t border-white/10 backdrop-blur">
          <div className="grid h-[68px] grid-cols-5">
            {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
              const active = location.pathname === path;

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => navigate(path)}
                  className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                    active ? "text-[#ff1744]" : "text-white/85 hover:text-white"
                  }`}
                >
                  <Icon size={21} fill={active ? "#ff1744" : "none"} />

                  <span
                    className={`text-[10px] ${
                      active ? "font-bold" : "font-medium"
                    }`}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </main>
    </div>
  );
};

// =====================================================
// WINNER CARD
// =====================================================

const WinnerCard = ({ name, amount, ticket, time, image }) => (
  <div className="flex min-w-[170px] shrink-0 items-center gap-2.5 pl-4 pr-2">
    <img
      src={image}
      alt={name}
      className="h-11 w-11 shrink-0 rounded-full border-2 border-[#ffd34e] object-cover"
    />

    <div className="min-w-0 leading-tight">
      <p className="truncate text-[11px] font-medium text-white">{name}</p>

      <p className="truncate text-[14px] font-black text-[#ffd34e]">{amount}</p>

      <p className="truncate text-[9px] text-white/70">Tkt: {ticket}</p>

      <p className="truncate text-[9px] text-white/55">{time}</p>
    </div>
  </div>
);

// =====================================================
// TRUST FEATURE
// =====================================================

const TrustFeature = ({ icon, text }) => (
  <div className="flex flex-col items-center justify-center gap-0.5 border-l border-[#d8c8ad] px-1 py-2 first:border-l-0">
    <span className="text-[#173e70]">{icon}</span>

    <span className="text-center text-[8px] font-medium leading-tight text-[#344054]">
      {text}
    </span>
  </div>
);

// =====================================================
// LOTTERY TYPE CARD
// imageUrl (backend) -> show uploaded image
// imageUrl missing / null / load error -> existing ticket mock fallback
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
  imageUrl,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  // imageUrl change ho to error state reset
  useEffect(() => {
    setImgFailed(false);
  }, [imageUrl]);

  const showImage = Boolean(imageUrl) && !imgFailed;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[#d7d0c6] bg-[#fffaf4] p-1.5 shadow-[0_8px_22px_rgba(0,0,0,0.15)]">
      <div
        className={`relative flex h-[84px] items-center justify-center overflow-hidden rounded-xl ${
          daily
            ? "bg-gradient-to-br from-[#ffb3a8] via-[#ffd9c2] to-[#ffefe0]"
            : "bg-gradient-to-br from-[#123c75] via-[#2a5ea8] to-[#f2c95a]"
        }`}
      >
        {showImage ? (
          /* Backend se aayi uploaded image */
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          /* Fallback: existing ticket mock UI */
          <>
            <Sparkles
              size={13}
              className={`absolute right-2 top-2 ${
                daily ? "text-[#ff3155]" : "text-[#ffd34e]"
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

              <p className="text-[0.65em] font-bold text-[#153c78]">{label}</p>

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
                  <span className="text-[1.25em]">{price}</span>
                </div>
              </div>

              <p className="mt-[0.25em] border-t border-[#d7bba5] pt-[0.15em] text-center text-[0.98em] font-black tracking-[0.15em] text-[#173e70]">
                {number}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col px-1 pt-2">
        <h3
          className={`font-serif text-[18px] font-black leading-none ${
            daily ? "text-[#d7193f]" : "text-[#173e70]"
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
                  daily ? "bg-[#ed1d43]" : "bg-[#173e70]"
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
};

// =====================================================
// RULE ROW
// =====================================================

const RuleRow = ({ n, condition, example, prize, total, badge, row }) => (
  <div
    className={`grid ${RULES_GRID} items-center gap-1.5 border-t border-white/70 px-2 py-2.5 ${row}`}
  >
    <span
      className={`mx-auto flex h-6 w-6 items-center justify-center rounded-md text-[12px] font-black text-white ${badge}`}
    >
      {n}
    </span>

    <span className="text-[11px] font-medium leading-snug text-[#26354b]">
      {condition}
    </span>

    <span className="rounded border border-[#e6c97c] bg-[#fffdf5] px-0.5 py-1 text-center font-mono text-[10px] font-black tracking-normal text-[#d7193f]">
      {example}
    </span>

    <span className="text-[11px] font-bold leading-tight text-[#173e70]">
      {prize}
    </span>

    <span className="text-[11px] font-black leading-tight text-[#d7193f]">
      {total}
    </span>
  </div>
);

export default HomeLotterySection;
