import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  LayoutDashboard,
  Users,
  FileText,
  Ticket,
  PartyPopper,
  Wallet,
  Cog,
  IdCard,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  Calendar,
  Crown,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Trophy,
} from "lucide-react";

import { adminLogout } from "../../reducer/slice/adminAuthReducer";

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
   danger      #D93025
========================================================= */

const GOLD_BG =
  "bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00]";

const AdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { admin, loading } = useSelector((state) => state.adminAuth);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // TODO: apne real notification count se connect karo
  const notificationCount = 5;

  // =========================
  // LIVE CLOCK
  // =========================
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = async () => {
    const result = await dispatch(adminLogout());

    if (adminLogout.fulfilled.match(result)) {
      setSidebarOpen(false);
      navigate("/admin/login", { replace: true });
    }
  };

  const closeSidebar = () => setSidebarOpen(false);

  // =========================
  // NAV ITEMS
  // =========================
  const NAV_ITEMS = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/lottery", label: "Daily Lottery", icon: Ticket },
    { to: "/admin/festival_lottery", label: "Festival Lottery", icon: PartyPopper },
    { to: "/admin/results", label: "Lottery Result", icon: FileText },
    { to: "/admin/festival_result", label: "Festival Result", icon: FileText },
    { to: "/users", label: "Users Management", icon: Users },
    { to: "/adminkyc", label: "KYC Verification", icon: IdCard },
    { to: "/admin/withdrawals", label: "Withdrawals", icon: Wallet },
    { to: "/amount", label: "Amount", icon: Cog },
    { to: "/home_banner", label: "Home Banner", icon: Cog },
    { to: "/admin/top-winners", label: "Top Winners", icon: Trophy },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  // =========================
  // NAV LINK CLASS
  // active  : glossy gold pill + BLACK bold text
  // inactive: transparent, grey text
  // =========================
  const navClass = ({ isActive }) =>
    [
      "group relative flex items-center gap-3 overflow-hidden rounded-xl px-3.5 py-3 text-[13px] transition-all duration-200",
      isActive
        ? `${GOLD_BG} font-extrabold text-[#1A1204] shadow-[0_8px_18px_-4px_rgba(227,154,0,0.7),inset_0_1px_0_rgba(255,255,255,0.6)]`
        : "font-semibold text-[#6B7280] hover:bg-white/70 hover:text-[#9A5B00] hover:shadow-[0_4px_12px_-6px_rgba(247,181,0,0.5)]",
    ].join(" ");

  // =========================
  // PAGE TITLE
  // =========================
  const getPageTitle = () => {
    const path = location.pathname;

    const match = NAV_ITEMS.find((item) => item.to === path);
    if (match) return match.label;

    if (path === "/admin/deposits") return "All Deposits";
    if (path === "/lottery-config") return "Lottery Config";

    return "Admin Panel";
  };

  // =========================
  // FORMAT DATE / TIME
  // =========================
  const formatDate = (d) =>
    d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatTime = (d) =>
    d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

  return (
    <div className="relative min-h-screen bg-[#FFFDF7]">
      {/* soft yellow glow at the bottom, like WINZOX */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 h-72 bg-[radial-gradient(ellipse_at_bottom,rgba(255,216,61,0.28),transparent_70%)]" />

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* =====================================================
          SIDEBAR  (golden effect)
      ===================================================== */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col overflow-hidden",
          "bg-gradient-to-b from-[#FFF3C4] via-[#FFFBEA] to-[#FFE9A0]",
          "shadow-[6px_0_32px_-10px_rgba(247,181,0,0.55)]",
          "transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* golden glow top-left */}
        <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-[#FFD83D]/50 blur-3xl" />
        {/* golden glow bottom-right */}
        <div className="pointer-events-none absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-[#F7B500]/40 blur-3xl" />
        {/* diagonal shine */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent" />

        {/* GOLD EDGE LINE (right side) */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[3px] bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] shadow-[0_0_14px_2px_rgba(247,181,0,0.65)]" />
        {/* thin light line next to it */}
        <div className="pointer-events-none absolute inset-y-0 right-[3px] w-px bg-white/80" />

        {/* tiny sparkles */}
        <Sparkles
          size={12}
          className="pointer-events-none absolute right-6 top-24 text-[#F7B500]/70"
        />
        <Sparkles
          size={9}
          className="pointer-events-none absolute left-3 top-[45%] text-[#F7B500]/50"
        />

        {/* LOGO */}
        <div className="relative flex h-20 shrink-0 items-center justify-between border-b border-[#F2B705]/40 px-4">
          <div className="flex items-center gap-3">
            <div
              className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${GOLD_BG} shadow-[0_6px_16px_-3px_rgba(227,154,0,0.75),inset_0_1px_0_rgba(255,255,255,0.6)] ring-2 ring-white`}
            >
              <Crown size={22} className="text-[#1A1204]" strokeWidth={2.4} />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[8px] font-black text-[#9A5B00] shadow ring-1 ring-[#F2B705]">
                ₹
              </span>
            </div>

            <div className="min-w-0">
              <p className="truncate text-[17px] font-black leading-none tracking-tight text-[#1A1A1A]">
                BHARAT LOTTERY
              </p>
              <p className="mt-1 truncate text-[9px] font-bold uppercase leading-tight tracking-[0.2em] text-[#9A5B00]">
                Admin Panel
              </p>
            </div>
          </div>

          {/* MOBILE CLOSE */}
          <button
            type="button"
            onClick={closeSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-white/70 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="relative flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={navClass}
                onClick={closeSidebar}
              >
                {({ isActive }) => (
                  <>
                    {/* glossy shine on active pill */}
                    {isActive && (
                      <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/45 to-transparent" />
                    )}
                    <Icon
                      size={19}
                      strokeWidth={isActive ? 2.5 : 2.1}
                      className={`relative shrink-0 transition-colors ${
                        isActive
                          ? "text-[#1A1204]"
                          : "text-[#B8860B] group-hover:text-[#9A5B00]"
                      }`}
                    />
                    <span className="relative flex-1 truncate">{item.label}</span>
                    <ChevronRight
                      size={15}
                      className={`relative shrink-0 transition-transform group-hover:translate-x-0.5 ${
                        isActive ? "text-[#1A1204]/70" : "text-[#D9B54A]"
                      }`}
                    />
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* BRAND BADGE */}
        <div className="relative shrink-0 px-4 pb-3">
          <div className="relative overflow-hidden rounded-2xl border border-[#F2B705]/60 bg-gradient-to-br from-[#FFF9E3] via-[#FFE680] to-[#F7B500] p-3 text-center shadow-[0_10px_24px_-10px_rgba(227,154,0,0.8)]">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent" />
            <Crown
              size={18}
              className="relative mx-auto mb-0.5 text-[#9A5B00]"
              strokeWidth={2.4}
            />
            <p className="relative text-[12px] font-black uppercase tracking-widest text-[#1A1204]">
              Bharat Lottery
            </p>
            <p className="relative mt-0.5 text-[9.5px] font-bold text-[#7A4A00]">
              Play • Win • Repeat
            </p>
          </div>
        </div>

        {/* LOGOUT */}
        <div className="relative shrink-0 border-t border-[#F2B705]/40 p-3">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loading}
            className="flex w-full items-center gap-3 rounded-xl bg-white/80 px-3.5 py-2.5 text-[13px] font-bold text-[#D93025] ring-1 ring-[#F3E7C4] transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut size={17} strokeWidth={2.4} />
            <span>{loading ? "Logging out..." : "Logout"}</span>
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN AREA
      ===================================================== */}
      <div className="relative min-h-screen lg:ml-64">
        {/* HEADER */}
        <header className="sticky top-0 z-30 border-b border-[#F3E7C4] bg-white/90 backdrop-blur">
          <div className="flex h-[72px] items-center justify-between gap-2 px-3 sm:gap-4 sm:px-5 lg:px-6">
            {/* LEFT: hamburger + search */}
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#1A1A1A] transition hover:bg-[#FFEFA8]/60 lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu size={21} />
              </button>

              <div className="hidden flex-1 items-center gap-2.5 rounded-full bg-[#FFFDF7] px-4 py-2.5 ring-1 ring-[#F3E7C4] focus-within:ring-[#F2B705] sm:flex sm:max-w-lg">
                <Search size={17} className="shrink-0 text-[#8A8F98]" />
                <input
                  type="text"
                  placeholder="Search users, tickets, draw number, results..."
                  className="w-full border-none bg-transparent text-[13px] font-medium text-[#1A1A1A] placeholder:text-[#8A8F98] focus:outline-none"
                />
              </div>
            </div>

            {/* RIGHT: date/time, bell, profile */}
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {/* DATE / TIME  (wallet-pill style) */}
              <div className="hidden items-center gap-2.5 rounded-full bg-[#FFFDF7] py-1.5 pl-3 pr-1.5 ring-1 ring-[#F2B705] md:flex">
                <div className="leading-tight">
                  <p className="whitespace-nowrap text-[11.5px] font-bold text-[#1A1A1A]">
                    {formatDate(currentTime)}
                  </p>
                  <p className="whitespace-nowrap text-[11px] font-semibold text-[#9A5B00]">
                    {formatTime(currentTime)}
                  </p>
                </div>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${GOLD_BG} text-[#1A1204] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]`}
                >
                  <Calendar size={16} strokeWidth={2.5} />
                </span>
              </div>

              {/* NOTIFICATIONS */}
              <button
                type="button"
                className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#FFFDF7] text-[#9A5B00] ring-1 ring-[#F2B705] transition hover:bg-[#FFEFA8]"
                aria-label="Notifications"
              >
                <Bell size={19} strokeWidth={2.2} />
                {notificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#D93025] px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </button>

              {/* ADMIN PROFILE */}
              <div className="flex cursor-pointer items-center gap-2.5 rounded-full bg-[#FFFDF7] py-1 pl-1 pr-3 ring-1 ring-[#F3E7C4] transition hover:ring-[#F2B705]">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${GOLD_BG} text-[13px] font-black text-[#1A1204] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]`}
                >
                  {admin?.name?.charAt(0)?.toUpperCase() || "A"}
                </div>
                <div className="hidden min-w-0 leading-tight sm:block">
                  <p className="max-w-[130px] truncate text-[13px] font-bold text-[#1A1A1A]">
                    {admin?.name || "Admin"}
                  </p>
                  <p className="max-w-[130px] truncate text-[10.5px] font-medium text-[#6B7280]">
                    {admin?.role || "Super Admin"}
                  </p>
                </div>
                <ChevronDown
                  size={15}
                  className="hidden shrink-0 text-[#6B7280] sm:block"
                />
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="w-full p-3 sm:p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;