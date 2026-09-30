import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
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

// ==========================================================
// MENU
// ==========================================================

const MENU_ITEMS = [
  {
    label: "Home",
    icon: Home,
    path: "/",
    tone: "bg-[#ed1d43]",
  },
  {
    label: "Daily Lottery",
    icon: Ticket,
    path: "/daily-lottery",
    tone: "bg-[#2e7dd7]",
  },
  {
    label: "Festival Lottery",
    icon: Crown,
    path: "/festival-lottery",
    tone: "bg-[#f08a25]",
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

// ==========================================================
// HEADER
// ==========================================================

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
    0
  );

  const [menuOpen, setMenuOpen] = useState(false);

  // page change hone par sidebar band
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // sidebar khula ho to page scroll lock + Esc se band
  useEffect(() => {
    if (!menuOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const goTo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* ================= TOP BAR ================= */}
      <header className="fixed left-1/2 top-0 z-[9999] w-[490px] max-w-full -translate-x-1/2 border-b border-[#f1d9a0]/20 bg-gradient-to-br from-[#3a0b17] via-[#2b0a16] to-[#1a0710]">
        <div className="flex h-[75px] items-center justify-between px-3 sm:px-4">
          {/* ---------- LOGO ---------- */}
          <Link to="/" className="flex items-center gap-1.5">
            <svg
              width="42"
              height="34"
              viewBox="0 0 38 30"
              fill="none"
              className="drop-shadow-[0_0_8px_rgba(255,211,78,0.5)]"
            >
              <defs>
                <linearGradient
                  id="crownGrad"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#fff1a8" />
                  <stop offset="50%" stopColor="#ffd34e" />
                  <stop offset="100%" stopColor="#e0a11b" />
                </linearGradient>
              </defs>

              <path
                d="M2 8L9 16L19 3L29 16L36 8L33 26H5L2 8Z"
                fill="url(#crownGrad)"
                stroke="#e0a11b"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />

              <circle
                cx="2"
                cy="8"
                r="2.5"
                fill="url(#crownGrad)"
              />

              <circle
                cx="19"
                cy="3"
                r="2.5"
                fill="url(#crownGrad)"
              />

              <circle
                cx="36"
                cy="8"
                r="2.5"
                fill="url(#crownGrad)"
              />

              <rect
                x="5"
                y="26"
                width="28"
                height="3"
                fill="url(#crownGrad)"
                rx="1"
              />
            </svg>

            <div className="flex flex-col leading-none">
              <h1
                className="text-[27px] font-black tracking-wide"
                style={{
                  background:
                    "linear-gradient(180deg, #fff1a8 0%, #ffd34e 55%, #e0a11b 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                DEAR
              </h1>

              <p className="mt-0.5 text-[8px] font-semibold tracking-[5px] text-white/90">
                LOTTERY
              </p>
            </div>
          </Link>

          {/* ---------- ACTIONS ---------- */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => goTo("/user/withdraw")}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-[#f1d9a0]/30 bg-white/10 px-3 text-xs font-bold text-white active:scale-95"
              >
                <Wallet size={16} className="text-[#ffd34e]" />
                ₹{walletAmount.toLocaleString("en-IN")}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => goTo("/login")}
                  className="h-9 rounded-lg border border-white/60 px-4 text-xs font-semibold text-white transition active:scale-95"
                >
                  Login
                </button>

                <button
                  type="button"
                  onClick={() => goTo("/register")}
                  className="h-9 rounded-lg bg-gradient-to-r from-[#ff1744] to-[#e0102f] px-4 text-xs font-semibold text-white shadow-[0_6px_18px_rgba(255,20,67,0.35)] transition active:scale-95"
                >
                  Register
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="flex h-9 w-9 items-center justify-center text-white active:scale-90"
            >
              <Menu size={26} />
            </button>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-[62px]" />

      {/* ================= SIDEBAR (right se slide) ================= */}
      <div
        className={`fixed inset-0 z-[10000] ${menuOpen
            ? "pointer-events-auto"
            : "pointer-events-none"
          }`}
        aria-hidden={!menuOpen}
      >
        <div className="relative mx-auto h-full w-[490px] max-w-full overflow-hidden">
          {/* overlay */}
          <div
            onClick={() => setMenuOpen(false)}
            className={`absolute inset-0 bg-[#12050a]/70 backdrop-blur-[2px] transition-opacity duration-300 ${menuOpen ? "opacity-100" : "opacity-0"
              }`}
          />

          {/* panel */}
          <aside
            role="dialog"
            aria-label="Main menu"
            className={`absolute right-0 top-0 flex h-full w-[82%] max-w-[320px] flex-col bg-[#eef3fa] shadow-[-12px_0_40px_rgba(0,0,0,0.45)] transition-transform duration-300 ease-out will-change-transform ${menuOpen
                ? "translate-x-0"
                : "translate-x-full"
              }`}
          >
            {/* ---------- panel header ---------- */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#3a0b17] via-[#2b0a16] to-[#1a0710] px-4 pb-5 pt-4">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#ffd34e]/15 blur-3xl" />

              <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-[#ed1d43]/20 blur-3xl" />

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="relative ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/30 text-white transition active:scale-90"
              >
                <X size={20} />
              </button>

              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => goTo("/profile")}
                  className="relative mt-1 flex w-full items-center gap-3 text-left"
                >
                  <span className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full border-[3px] border-[#ffd34e] bg-white/10 shadow-[0_0_20px_rgba(255,211,78,0.25)]">
                    <UserRound
                      size={28}
                      className="text-[#ffd34e]"
                      strokeWidth={1.5}
                    />
                  </span>

                  <span className="min-w-0">
                    <span className="block text-[12px] text-white/70">
                      Hello,
                    </span>

                    <span className="block break-words bg-gradient-to-b from-[#fff1a8] to-[#e0a11b] bg-clip-text font-serif text-[22px] font-black leading-tight text-transparent">
                      {user?.name || "User"}
                    </span>

                    <span className="block text-[12px] text-white/80">
                      +91 {user?.mobile || "----------"}
                    </span>
                  </span>
                </button>
              ) : (
                <div className="relative mt-1">
                  <p className="bg-gradient-to-b from-[#fff1a8] to-[#e0a11b] bg-clip-text font-serif text-[24px] font-black leading-tight text-transparent">
                    Welcome
                  </p>

                  <p className="mt-0.5 text-[12px] text-white/75">
                    Login karke lottery khelo aur jeeto
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => goTo("/login")}
                      className="h-10 rounded-xl border border-white/50 text-[13px] font-bold text-white transition active:scale-95"
                    >
                      Login
                    </button>

                    <button
                      type="button"
                      onClick={() => goTo("/register")}
                      className="h-10 rounded-xl bg-gradient-to-r from-[#ff1744] to-[#e0102f] text-[13px] font-extrabold text-white shadow-[0_6px_18px_rgba(255,20,67,0.45)] transition active:scale-95"
                    >
                      Register
                    </button>
                  </div>
                </div>
              )}

              {/* wallet strip */}
              {isLoggedIn && (
                <button
                  type="button"
                  onClick={() => goTo("/user/withdraw")}
                  className="relative mt-4 flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 transition active:scale-[0.98]"
                >
                  <span className="flex items-center gap-2">
                    <Wallet
                      size={20}
                      className="text-[#ffd34e]"
                    />

                    <span className="text-[12px] text-white/80">
                      Wallet Balance
                    </span>
                  </span>

                  <span className="text-[18px] font-black text-[#ffd34e]">
                    ₹{walletAmount.toLocaleString("en-IN")}
                  </span>
                </button>
              )}
            </div>

            {/* ---------- menu list ---------- */}
            <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
              {MENU_ITEMS.map(
                ({ label, icon: Icon, path, tone }) => {
                  const active =
                    location.pathname === path;

                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => goTo(path)}
                      className={`flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left transition active:scale-[0.98] ${active
                          ? "bg-gradient-to-r from-[#ff1744] to-[#c9102f] shadow-[0_6px_18px_rgba(255,20,67,0.35)]"
                          : "border border-[#f1d9a0]/40 bg-white shadow-sm"
                        }`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${active ? "bg-white/20" : tone
                          }`}
                      >
                        <Icon size={20} />
                      </span>

                      <span
                        className={`min-w-0 flex-1 text-[15px] font-extrabold ${active
                            ? "text-white"
                            : "text-[#173e70]"
                          }`}
                      >
                        {label}
                      </span>

                      <ChevronRight
                        size={20}
                        className={`shrink-0 ${active
                            ? "text-white"
                            : "text-[#173e70]/60"
                          }`}
                      />
                    </button>
                  );
                }
              )}
            </nav>

            {/* ---------- footer ---------- */}
            <div className="shrink-0 border-t border-[#173e70]/10 px-4 py-3">
              <div className="flex items-center justify-center gap-2 text-[#173e70]">
                <ShieldCheck size={18} />

                <p className="text-[13px] font-medium">
                  Play with trust
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
};

export default Header;