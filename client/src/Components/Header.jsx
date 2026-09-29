import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  BarChart3,
  Crown,
  Home,
  Menu,
  Ticket,
  User,
  Wallet,
  X,
} from "lucide-react";

// ==========================================================
// ROUTES / MENU
// ==========================================================

const ADMIN_ROUTES = [
  "/admin",
  "/admin/dashboard",
  "/admin/users",
  "/admin/deposits",
  "/admin/withdrawals",
  "/admin/transactions",
  "/admin/reports",
  "/admin/notifications",
  "/admin/settings",
];

const MENU_ITEMS = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Daily Lottery", icon: Ticket, path: "/daily-lottery" },
  { label: "Festival Lottery", icon: Crown, path: "/festival-lottery" },
  { label: "Results", icon: BarChart3, path: "/results" },
  { label: "Profile", icon: User, path: "/profile" },
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
    user?.balance ?? user?.walletBalance ?? user?.wallet ?? user?.walletAmount ?? 0
  );

  const [menuOpen, setMenuOpen] = useState(false);

  const isAdminRoute = ADMIN_ROUTES.some(
    (route) =>
      location.pathname === route ||
      location.pathname.startsWith(`${route}/`)
  );

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const goTo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      <header className="fixed left-1/2 top-0 z-[9999] w-[490px] max-w-full -translate-x-1/2 border-b border-white/5 bg-[#061b3d]/95 backdrop-blur-md">
        <div className="flex h-[62px] items-center justify-between px-3 sm:px-4">
          {/* ================= LEFT: LOGO ================= */}

          <Link to="/" className="flex items-center gap-1.5">
            <svg
              width="42"
              height="34"
              viewBox="0 0 38 30"
              fill="none"
              className="drop-shadow-[0_0_8px_rgba(255,201,60,0.5)]"
            >
              <defs>
                <linearGradient id="crownGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFE47A" />
                  <stop offset="50%" stopColor="#f5c542" />
                  <stop offset="100%" stopColor="#d4a017" />
                </linearGradient>
              </defs>

              <path
                d="M2 8L9 16L19 3L29 16L36 8L33 26H5L2 8Z"
                fill="url(#crownGrad)"
                stroke="#d4a017"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <circle cx="2" cy="8" r="2.5" fill="url(#crownGrad)" />
              <circle cx="19" cy="3" r="2.5" fill="url(#crownGrad)" />
              <circle cx="36" cy="8" r="2.5" fill="url(#crownGrad)" />
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
                    "linear-gradient(180deg, #FFE08A 0%, #f5c542 55%, #d4a017 100%)",
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

          {/* ================= RIGHT: ACTIONS ================= */}

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => goTo("/user/withdraw")}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-white/25 bg-[#09234a] px-3 text-xs font-bold text-white active:scale-95"
              >
                <Wallet size={16} className="text-[#ff3155]" />₹
                {walletAmount.toLocaleString("en-IN")}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => goTo("/login")}
                  className="h-9 rounded-lg border border-white/70 px-4 text-xs font-semibold text-white transition active:scale-95"
                >
                  Login
                </button>

                <button
                  type="button"
                  onClick={() => goTo("/register")}
                  className="h-9 rounded-lg bg-[#ff1744] px-4 text-xs font-semibold text-white shadow-lg shadow-red-900/40 transition active:scale-95"
                >
                  Register
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Menu"
              className="flex h-9 w-9 items-center justify-center text-white"
            >
              {menuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        {/* ================= DROPDOWN MENU ================= */}

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 top-[62px] z-[-1] bg-black/50"
              onClick={() => setMenuOpen(false)}
            />

            <nav className="absolute left-0 right-0 top-[62px] border-b border-white/10 bg-[#09234a] px-3 py-2 shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
              {MENU_ITEMS.map(({ label, icon: Icon, path }) => {
                const active = location.pathname === path;

                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => goTo(path)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition active:scale-[0.98] ${
                      active
                        ? "bg-[#ff1744]/15 text-[#ff3155]"
                        : "text-white/90 hover:bg-white/5"
                    }`}
                  >
                    <Icon size={20} />
                    {label}
                  </button>
                );
              })}
            </nav>
          </>
        )}
      </header>

      {/* Spacer for fixed header */}
      <div className="h-[62px]" />
    </>
  );
};

export default Header;