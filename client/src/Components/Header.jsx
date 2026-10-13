import {
  BarChart3,
  ChevronRight,
  Crown,
  Home,
  Menu,
  ShieldCheck,
  Ticket,
  User,
  UserRound,
  Wallet,
  X,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";

const MENU_ITEMS = [
  { label: "Home", icon: Home, path: "/", tone: "bg-[#ed1d43]" },
  {
    label: "Daily Lottery",
    icon: Ticket,
    path: "/buy-ticket",
    tone: "bg-[#2e7dd7]",
  },
  {
    label: "Festival Lottery",
    icon: Crown,
    path: "/festival",
    tone: "bg-[#f08a25]",
  },
  {
    label: "My Tickets",
    icon: Ticket,
    path: "/my-tickets",
    tone: "bg-[#e11d48]",
  },
  {
    label: "Results",
    icon: BarChart3,
    path: "/results",
    tone: "bg-[#20a66a]",
  },
  {
    label: "Profile",
    icon: User,
    path: "/profile",
    tone: "bg-[#8c4bd6]",
  },
];

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const user = useSelector((state) => state.auth?.user);
  const isLoggedIn = Boolean(user);

  const walletAmount = Number(
    user?.balance ??
      user?.walletBalance ??
      user?.wallet ??
      user?.walletAmount ??
      0,
  );

  const [menuOpen, setMenuOpen] = useState(false);

  // Close drawer whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Lock background scrolling and support Escape key.
  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const goTo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* ================= TOP HEADER ================= */}
      <header className="fixed left-1/2 top-0 z-[9999] w-full max-w-[490px] -translate-x-1/2 border-b border-white/10 bg-[#061b3d] shadow-md">
        <div className="flex h-[70px] items-center justify-between gap-2 px-3 sm:px-4">
          {/* LOGO */}
          <Link
            to="/"
            aria-label="Dear Lottery Home"
            className="flex min-w-0 shrink items-center"
          >
            <img
              src="https://i.ibb.co/DPFc7fpd/Dear-logo.png"
              alt="Dear Lottery"
              className="h-14 w-auto max-w-[125px] object-contain sm:h-16 sm:max-w-[150px]"
              draggable={false}
            />
          </Link>

          {/* HEADER ACTIONS */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => goTo("/user/withdraw")}
                className="flex h-9 items-center gap-1 rounded-lg border border-white/20 bg-[#09234a] px-2 text-xs font-bold text-white transition active:scale-95 sm:gap-1.5 sm:px-3"
                aria-label={`Wallet balance ₹${walletAmount}`}
              >
                <Wallet size={16} className="shrink-0 text-[#ff3155]" />
                <span>₹{walletAmount.toLocaleString("en-IN")}</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => goTo("/login")}
                  className="h-9 rounded-lg border border-white/50 px-2.5 text-xs font-semibold text-white transition hover:bg-white/10 active:scale-95 sm:px-4"
                >
                  Login
                </button>

                <button
                  type="button"
                  onClick={() => goTo("/register")}
                  className="h-9 rounded-lg bg-[#ff1744] px-2.5 text-xs font-bold text-white shadow-md shadow-red-900/30 transition hover:bg-[#e9123b] active:scale-95 sm:px-4"
                >
                  Register
                </button>
              </>
            )}

            {/* MENU TOGGLE */}
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition hover:bg-white/10 active:scale-95"
            >
              {menuOpen ? <X size={25} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </header>

      {/* SPACE FOR FIXED HEADER */}
      <div className="h-[70px]" />

      {/* ================= MOBILE DRAWER ================= */}
      <div
        className={`fixed inset-0 z-[10000] ${
          menuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!menuOpen}
      >
        {/* Backdrop */}
        <button
          type="button"
          tabIndex={menuOpen ? 0 : -1}
          aria-label="Close navigation menu"
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 h-full w-full cursor-default bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Drawer container */}
        <div className="relative mx-auto h-full w-full max-w-[490px] overflow-hidden">
          <aside
            id="mobile-navigation"
            role="dialog"
            aria-modal={menuOpen ? "true" : undefined}
            aria-label="Main navigation"
            className={`absolute right-0 top-0 z-10 flex h-full w-[88%] max-w-[340px] flex-col overflow-hidden rounded-l-2xl bg-[#f4f6fb] shadow-[-12px_0_40px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-out ${
              menuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* DRAWER HEADER */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#102b50] via-[#173e70] to-[#071a35] px-4 pb-4 pt-3">
              <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#e8b64e]/15 blur-3xl" />
              <div className="pointer-events-none absolute -left-12 bottom-0 h-28 w-28 rounded-full bg-[#ff1744]/10 blur-3xl" />

              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#e8c778]">
                    DEAR LOTTERY
                  </p>
                  <h2 className="mt-1 text-lg font-extrabold text-white">
                    {isLoggedIn ? "My Account" : "Welcome"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>

              {/* USER PROFILE */}
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => goTo("/profile")}
                  className="relative mt-4 flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-3 text-left transition hover:bg-white/10"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#e8c778] bg-white/10">
                    <UserRound
                      size={25}
                      className="text-[#f5d47d]"
                      strokeWidth={1.7}
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] text-white/65">
                      Welcome back,
                    </span>
                    <span className="mt-0.5 block break-words text-base font-extrabold leading-tight text-[#ffe39b]">
                      {user?.name || "User"}
                    </span>
                    <span className="mt-1 block truncate text-xs text-white/75">
                      {user?.mobile
                        ? `+91 ${user.mobile}`
                        : "View your profile"}
                    </span>
                  </span>

                  <ChevronRight size={19} className="shrink-0 text-white/60" />
                </button>
              ) : (
                <div className="relative mt-2">
                  <p className="text-xs leading-relaxed text-white/75">
                    Login karke lottery khelo aur jeeto.
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => goTo("/login")}
                      className="h-10 rounded-xl border border-white/35 text-sm font-bold text-white transition hover:bg-white/10 active:scale-95"
                    >
                      Login
                    </button>

                    <button
                      type="button"
                      onClick={() => goTo("/register")}
                      className="h-10 rounded-xl bg-gradient-to-r from-[#ff1744] to-[#d80e34] text-sm font-extrabold text-white shadow-md transition active:scale-95"
                    >
                      Register
                    </button>
                  </div>
                </div>
              )}

              {/* WALLET */}
              {isLoggedIn && (
                <button
                  type="button"
                  onClick={() => goTo("/user/withdraw")}
                  className="relative mt-3 flex min-h-[48px] w-full items-center justify-between gap-2 rounded-xl border border-[#e8c778]/25 bg-white/[0.08] px-3 py-2 transition hover:bg-white/[0.13] active:scale-[0.99]"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Wallet size={19} className="shrink-0 text-[#f5d47d]" />
                    <span className="text-xs font-medium text-white/85">
                      Wallet Balance
                    </span>
                  </span>

                  <span className="shrink-0 text-base font-extrabold text-[#ffe39b]">
                    ₹{walletAmount.toLocaleString("en-IN")}
                  </span>
                </button>
              )}
            </div>

            {/* NAVIGATION LINKS */}
            <nav
              aria-label="Main navigation links"
              className="flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-4"
            >
              {MENU_ITEMS.map(({ label, icon: Icon, path, tone }) => {
                const active =
                  path === "/"
                    ? location.pathname === "/"
                    : location.pathname === path ||
                      location.pathname.startsWith(`${path}/`);

                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    tabIndex={menuOpen ? 0 : -1}
                    className={`group flex min-h-[52px] w-full items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors duration-200 active:scale-[0.98] ${
                      active
                        ? "border-[#173e70] bg-[#173e70] shadow-md shadow-blue-950/15"
                        : "border-[#e2e8f0] bg-white hover:border-[#b6c8df] hover:bg-[#f9fbff]"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${
                        active ? "bg-white/15" : tone
                      }`}
                    >
                      <Icon size={20} strokeWidth={2} />
                    </span>

                    <span
                      className={`min-w-0 flex-1 text-sm font-bold ${
                        active ? "text-white" : "text-[#173e70]"
                      }`}
                    >
                      {label}
                    </span>

                    <ChevronRight
                      size={19}
                      className={`shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ${
                        active
                          ? "text-white"
                          : "text-[#173e70]/45 group-hover:text-[#173e70]"
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            {/* DRAWER FOOTER */}
            <div className="shrink-0 border-t border-[#173e70]/10 bg-white/80 px-4 py-3">
              <div className="flex items-center justify-center gap-2 text-[#173e70]">
                <ShieldCheck size={17} className="text-[#bd9135]" />
                <p className="text-xs font-semibold">Play Responsibly</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
};

export default Header;
