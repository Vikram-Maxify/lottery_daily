import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Users,
  Wallet,
  Settings,
  Ticket,
  FileText,
  BarChart3,
  TrendingUp,
  Crown,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import { fetchDashboardStats } from "../../reducer/slice/adminSlice";

/* =========================================================
   WINZOX THEME TOKENS  (Bright Gold + White)
   bg          #FFFDF7
   border      #F3E7C4
   gold        #FFD83D -> #F7B500 -> #E39A00
   gold-soft   #FFEFA8
   gold-line   #F2B705
   on-gold     #1A1204  (text on gold is DARK)
   text        #1A1A1A
   muted       #6B7280
   brown       #9A5B00
   live        #12A36B
========================================================= */

const GOLD_BTN =
  "bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] text-[#1A1204] font-extrabold shadow-[0_6px_14px_-4px_rgba(227,154,0,0.6),inset_0_1px_0_rgba(255,255,255,0.55)]";

const Dashboard = () => {
  const dispatch = useDispatch();

  const { admin } = useSelector((state) => state.adminAuth);
  const { dashboardStats, dashboardLoading } = useSelector(
    (state) => state.admin
  );

  // =====================================================
  // FETCH DASHBOARD STATS ON MOUNT
  // =====================================================
  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  // =====================================================
  // CARD DATA
  // =====================================================
  const cards = [
    {
      title: "Total Users",
      value: dashboardLoading ? "..." : dashboardStats.totalUsers || 0,
      icon: Users,
    },
    {
      title: "Total Deposit",
      value: dashboardLoading
        ? "..."
        : `₹${(dashboardStats.totalDeposit || 0).toLocaleString("en-IN")}`,
      icon: Wallet,
    },
    {
      title: "Total Configs",
      value: dashboardLoading ? "..." : dashboardStats.totalConfigs || 0,
      icon: Settings,
    },
    {
      title: "Total Entries",
      value: dashboardLoading ? "..." : dashboardStats.totalEntries || 0,
      icon: Ticket,
    },
    {
      title: "Total Results",
      value: dashboardLoading ? "..." : dashboardStats.totalResults || 0,
      icon: FileText,
    },
    {
      title: "Today's Results",
      value: dashboardLoading ? "..." : dashboardStats.todayResults || 0,
      icon: BarChart3,
    },
    {
      title: "Today's Deposit",
      value: dashboardLoading
        ? "..."
        : `₹${(dashboardStats.todayDeposit || 0).toLocaleString("en-IN")}`,
      icon: TrendingUp,
    },
  ];

  // =====================================================
  // QUICK LINKS
  // =====================================================
  const quickLinks = [
    { label: "Manage Users", to: "/users" },
    { label: "Publish Results", to: "/admin/results" },
    { label: "Review KYC", to: "/adminkyc" },
  ];

  return (
    <div className="space-y-5">
      {/* ============================================ */}
      {/* HEADING BANNER                               */}
      {/* ============================================ */}
      <div className="relative overflow-hidden rounded-2xl border border-[#F3E7C4] bg-gradient-to-br from-white via-[#FFF9E3] to-[#FFEFA8]/70 p-5 shadow-[0_8px_24px_-12px_rgba(247,181,0,0.45)] sm:p-6">
        <Sparkles
          size={18}
          className="pointer-events-none absolute right-6 top-4 text-[#F7B500]"
        />
        <Sparkles
          size={12}
          className="pointer-events-none absolute right-16 top-12 text-[#FFD83D]"
        />
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#FFD83D]/30 blur-3xl" />

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl">
              DASHBOARD
            </h1>
            <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
              Welcome back,{" "}
              <span className="font-bold text-[#1A1A1A]">
                {admin?.name || "Admin"}
              </span>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-start rounded-full bg-white px-3.5 py-1.5 ring-1 ring-[#F3E7C4] sm:self-center">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#12A36B]" />
            <span className="text-[11px] font-extrabold tracking-wide text-[#12A36B]">
              LIVE
            </span>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* STAT CARDS                                   */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[#F3E7C4] bg-white p-5 shadow-[0_6px_18px_-10px_rgba(247,181,0,0.4)] transition hover:-translate-y-0.5 hover:border-[#F2B705] hover:shadow-[0_12px_26px_-12px_rgba(247,181,0,0.55)]"
            >
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold uppercase tracking-wider text-[#8A8F98]">
                  {card.title}
                </p>
                <h2 className="mt-2 truncate text-2xl font-black text-[#1A1A1A]">
                  {card.value}
                </h2>
              </div>

              {/* result-ball style icon */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FFEFA8] ring-2 ring-[#F2B705]">
                <Icon size={22} className="text-[#1A1204]" strokeWidth={2.3} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================ */}
      {/* WELCOME SECTION                              */}
      {/* ============================================ */}
      <div className="rounded-2xl border border-[#F3E7C4] bg-white p-5 shadow-[0_6px_18px_-10px_rgba(247,181,0,0.4)] sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Crown size={18} className="text-[#F7B500]" strokeWidth={2.4} />
            <h2 className="text-[15px] font-black uppercase tracking-tight text-[#1A1A1A]">
              Welcome to Admin Panel
            </h2>
          </div>
          <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#12A36B]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#12A36B]" />
            LIVE
          </span>
        </div>

        <p className="mt-2 text-[13px] leading-relaxed text-[#6B7280]">
          From here you can manage users, deposits, configs, entries and
          results.
        </p>

        {/* Gold CTA buttons */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {quickLinks.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13px] uppercase tracking-wide transition hover:brightness-105 active:scale-[0.98] ${GOLD_BTN}`}
            >
              {item.label}
              <ArrowRight size={16} strokeWidth={2.8} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;