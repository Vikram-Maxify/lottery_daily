import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { adminLogout } from "../../reducer/slice/adminAuthReducer";

const AdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { admin, loading } = useSelector((state) => state.adminAuth);

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = async () => {
    const result = await dispatch(adminLogout());

    if (adminLogout.fulfilled.match(result)) {
      setSidebarOpen(false);

      navigate("/admin/login", {
        replace: true,
      });
    }
  };

  // =========================
  // CLOSE MOBILE SIDEBAR
  // =========================
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // =========================
  // NAV LINK CLASS
  // =========================
  const navClass = ({ isActive }) =>
    `
      flex items-center gap-3 rounded-lg px-4 py-3
      text-sm font-medium transition
      ${isActive
      ? "bg-white/10 text-white"
      : "text-slate-400 hover:bg-white/5 hover:text-white"
    }
    `;

  // =========================
  // PAGE TITLE
  // =========================
  const getPageTitle = () => {
    const path = location.pathname;

    if (path === "/dashboard") {
      return "Dashboard";
    }

    if (path === "/users") {
      return "Users";
    }

    if (path === "/admin/results") {
      return "Results";
    }

    if (path === "/amount") {
      return "Amount";
    }

    if (path === "/settings") {
      return "Settings";
    }

    if (path === "/lottery-config") {
      return "Config";
    }

    if (path === "/admin/lottery") {
      return "Admin Config";
    }
    if (path === "/admin/deposits") {
      return "All deposit"
    }

    if (path === "/admin/withdrawals") {
      return "All withdrawals"
    }


    return "Admin Panel";
  };

  return (
    <div className="min-h-screen bg-slate-100">

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex w-72 max-w-[85vw] flex-col
          bg-slate-950
          shadow-2xl
          transition-transform duration-300 ease-in-out

          lg:w-64
          lg:translate-x-0
          lg:shadow-none

          ${sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
          }
        `}
      >

        {/* =====================================================
            LOGO
        ===================================================== */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-5 sm:px-6">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white">
              <span className="font-bold text-slate-950">
                A
              </span>
            </div>

            <span className="text-lg font-bold text-white">
              Admin Panel
            </span>

          </div>

          {/* MOBILE CLOSE BUTTON */}
          <button
            type="button"
            onClick={closeSidebar}
            className="
              flex h-9 w-9 items-center justify-center
              rounded-lg text-xl text-slate-400
              transition hover:bg-white/10 hover:text-white
              lg:hidden
            "
            aria-label="Close sidebar"
          >
            ✕
          </button>

        </div>

        {/* =====================================================
            NAVIGATION
        ===================================================== */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">

          <NavLink
            to="/dashboard"
            className={navClass}
            onClick={closeSidebar}
          >
            <span className="text-lg">📊</span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/users"
            className={navClass}
            onClick={closeSidebar}
          >
            <span className="text-lg">👥</span>
            <span>Users</span>
          </NavLink>

          <NavLink
            to="/admin/results"
            className={navClass}
            onClick={closeSidebar}
          >
            <span className="text-lg">📋</span>
            <span>Results</span>
          </NavLink>

          <NavLink
            to="/admin/lottery"
            className={navClass}
            onClick={closeSidebar}
          >
            <span className="text-lg">⚙️</span>
            <span>Config</span>
          </NavLink>

          <NavLink
            to="/admin/deposits"
            className={navClass}
            onClick={closeSidebar}
          >
            <span className="text-lg">⚙️</span>
            <span>Deposit</span>
          </NavLink>

          <NavLink
            to="/admin/withdrawals"
            className={navClass}
            onClick={closeSidebar}
          >
            <span className="text-lg">⚙️</span>
            <span>Withdrawals</span>
          </NavLink>



          <NavLink
            to="/amount"
            className={navClass}
            onClick={closeSidebar}
          >
            <span className="text-lg">💰</span>
            <span>Amount</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={navClass}
            onClick={closeSidebar}
          >
            <span className="text-lg">⚙️</span>
            <span>Settings</span>
          </NavLink>

        </nav>

        {/* =====================================================
            ADMIN PROFILE
        ===================================================== */}
        <div className="shrink-0 border-t border-slate-800 p-4">

          <div className="mb-3 flex min-w-0 items-center gap-3 px-2">

            <div className="
              flex h-9 w-9 shrink-0
              items-center justify-center
              rounded-full bg-slate-800
              text-sm font-bold text-white
            ">
              {admin?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>



          </div>

          {/* LOGOUT */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loading}
            className="
              flex w-full items-center gap-3
              rounded-lg px-4 py-3
              text-sm font-medium
              text-red-400
              transition
              hover:bg-red-500/10
              hover:text-red-300
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <span className="text-lg">↪</span>

            <span>
              {loading ? "Logging out..." : "Logout"}
            </span>
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN AREA
      ===================================================== */}
      <div className="min-h-screen lg:ml-64">

        {/* =====================================================
            HEADER
        ===================================================== */}
        <header className="
          sticky top-0 z-30
          flex h-16 items-center
          justify-between
          border-b border-slate-200
          bg-white
          px-4
          sm:px-6
          lg:px-8
        ">

          {/* LEFT */}
          <div className="flex min-w-0 items-center gap-3">

            {/* MOBILE MENU */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="
                flex h-10 w-10 shrink-0
                items-center justify-center
                rounded-lg
                text-xl text-slate-700
                transition
                hover:bg-slate-100
                lg:hidden
              "
              aria-label="Open sidebar"
            >
              ☰
            </button>

            <div className="min-w-0">
              <h2 className="
                truncate
                text-base font-semibold
                text-slate-900
                sm:text-lg
              ">
                {getPageTitle()}
              </h2>
            </div>

          </div>

          {/* ADMIN */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">

            {/* DESKTOP ADMIN INFO */}
            <div className="hidden text-right sm:block">

              <p className="max-w-[180px] truncate text-sm font-semibold text-slate-900">
                {admin?.name || "Admin"}
              </p>

              <p className="max-w-[180px] truncate text-xs text-slate-500">
                {admin?.mobile || ""}
              </p>

            </div>

            {/* ADMIN AVATAR */}
            <div className="
              flex h-9 w-9
              items-center justify-center
              rounded-full
              bg-slate-900
              text-sm font-bold
              text-white
              sm:h-10 sm:w-10
            ">
              {admin?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>

          </div>

        </header>

        {/* =====================================================
            PAGE CONTENT
        ===================================================== */}
        <main className="
          w-full
          p-4
          sm:p-5
          md:p-6
          lg:p-8
        ">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default AdminLayout;
