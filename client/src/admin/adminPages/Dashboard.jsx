import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDashboardStats } from "../../reducer/slice/adminSlice";

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
      icon: "👥",
      color: "bg-blue-100",
    },
    {
      title: "Total Deposit",
      value: dashboardLoading
        ? "..."
        : `₹${(dashboardStats.totalDeposit || 0).toLocaleString()}`,
      icon: "💰",
      color: "bg-green-100",
    },
    {
      title: "Total Configs",
      value: dashboardLoading ? "..." : dashboardStats.totalConfigs || 0,
      icon: "⚙️",
      color: "bg-purple-100",
    },
    {
      title: "Total Entries",
      value: dashboardLoading ? "..." : dashboardStats.totalEntries || 0,
      icon: "🎟️",
      color: "bg-yellow-100",
    },
    {
      title: "Total Results",
      value: dashboardLoading ? "..." : dashboardStats.totalResults || 0,
      icon: "📋",
      color: "bg-slate-100",
    },
    {
      title: "Today's Results",
      value: dashboardLoading ? "..." : dashboardStats.todayResults || 0,
      icon: "📊",
      color: "bg-blue-100",
    },
    {
      title: "Today's Deposit",
      value: dashboardLoading
        ? "..."
        : `₹${(dashboardStats.todayDeposit || 0).toLocaleString()}`,
      icon: "📈",
      color: "bg-green-100",
    },
  ];

  return (
    <div>
      {/* ============================================ */}
      {/* HEADING                                      */}
      {/* ============================================ */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Welcome back,{" "}
          <span className="font-semibold text-slate-700">
            {admin?.name || "Admin"}
          </span>
        </p>
      </div>

      {/* ============================================ */}
      {/* STAT CARDS                                   */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {card.title}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  {card.value}
                </h2>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${card.color}`}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ============================================ */}
      {/* WELCOME SECTION                              */}
      {/* ============================================ */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Welcome to Admin Panel
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          From here you can manage users, deposits, configs, entries and
          results.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;