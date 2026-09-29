import {
  BarChart3,
  CalendarDays,
  Crown,
  Home,
  UserRound,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  {
    label: "Home",
    path: "/",
    icon: Home,
  },
  {
    label: "Daily Lottery",
    path: "/buy-ticket",
    icon: CalendarDays,
  },
  {
    label: "Festival Lottery",
    path: "/festival",
    icon: Crown,
  },
  {
    label: "Results",
    path: "/results",
    icon: BarChart3,
  },
  {
    label: "Profile",
    path: "/profile",
    icon: UserRound,
  },
];

const BottomNavbar = () => {
  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[490px] -translate-x-1/2 px-0">
      <div className="relative overflow-hidden rounded-t-[28px] border border-b-0 border-white/10 bg-[#061b3d] shadow-[0_-10px_35px_rgba(0,0,0,0.35)]">
        {/* Top glow line */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff3155]/70 to-transparent" />

        <div
          className="
            grid h-[82px] grid-cols-5
            items-center
            px-1
            pb-[env(safe-area-inset-bottom)]
            sm:h-[86px]
            sm:px-2
          "
        >
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `relative flex h-full min-w-0 flex-col items-center justify-center gap-[5px] transition-all duration-200 ${
                    isActive
                      ? "text-[#ff3155]"
                      : "text-white/80 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active indicator */}
                    {isActive && (
                      <div
                        className="
                          absolute
                          top-0
                          left-1/2
                          h-[3px]
                          w-[34px]
                          -translate-x-1/2
                          rounded-b-full
                          bg-[#ff3155]
                          shadow-[0_0_12px_rgba(255,49,85,0.75)]
                        "
                      />
                    )}

                    {/* Icon wrapper */}
                    <div
                      className={`
                        flex
                        h-[30px]
                        w-[38px]
                        items-center
                        justify-center
                        rounded-xl
                        transition-all
                        duration-200
                        ${
                          isActive
                            ? "bg-[#ff3155]/10"
                            : "bg-transparent"
                        }
                      `}
                    >
                      <Icon
                        size={25}
                        strokeWidth={isActive ? 2.5 : 2}
                        className="transition-all duration-200"
                      />
                    </div>

                    {/* Label */}
                    <span
                      className={`
                        max-w-full
                        truncate
                        px-0.5
                        text-center
                        text-[9px]
                        leading-none
                        sm:text-[10px]
                        ${
                          isActive
                            ? "font-bold text-[#ff3155]"
                            : "font-medium text-white/80"
                        }
                      `}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavbar;