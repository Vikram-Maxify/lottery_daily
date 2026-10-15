import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  Clock,
  Crown,
  Image as ImageIcon,
  IndianRupee,
  Medal,
  Ticket,
  Trophy,
  UserCheck,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getAllUsers } from "../../reducer/slice/adminAuthReducer";
import {
  getAllKyc,
  selectAdminKycDocuments,
} from "../../reducer/slice/adminKycReducer"; // <- path check kar lena
import { fetchDashboardStats } from "../../reducer/slice/adminSlice";

/* ================= CONSTANTS ================= */

const CARD =
  "rounded-2xl border border-[#F3E7C4] bg-white shadow-[0_6px_18px_-10px_rgba(247,181,0,0.4)]";

const PIE_COLORS = ["#EF4444", "#3B82F6", "#A855F7", "#22C55E", "#F7B500"];
const NUMBER_COLORS = ["#EF4444", "#3B82F6", "#A855F7", "#16A34A", "#EF4444"];

const DRAW_TYPE_STYLE = {
  DAILY: "bg-[#E53935]",
  DAY: "bg-[#2F80ED]",
  EVENING: "bg-[#8E24AA]",
  NIGHT: "bg-[#0B7A3E]",
};

/* ================= HELPERS ================= */

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

const fmtDateTime = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  return `${dt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })} ${dt.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

const pill = (tone) => {
  const map = {
    green: "bg-[#DDF7E8] text-[#12A36B]",
    orange: "bg-[#FFEBD0] text-[#C26A00]",
    red: "bg-[#FEE2E2] text-[#DC2626]",
    gold: "bg-[#FFF1BF] text-[#9A5B00]",
    gray: "bg-[#F3F4F6] text-[#6B7280]",
  };
  return `inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${map[tone]}`;
};

// User tab tak Active maana jayega jab tak clearly blocked/inactive na ho
const isUserActive = (u) => {
  if (u.isActive === false) return false;
  if (u.isBlocked === true || u.isSuspended === true || u.isDeleted === true)
    return false;

  const s = String(u.status || "").toLowerCase();
  if (["inactive", "blocked", "suspended", "banned", "deleted"].includes(s))
    return false;

  return true;
};

const isUserSuspended = (u) =>
  u.isBlocked === true ||
  u.isSuspended === true ||
  ["blocked", "suspended", "banned"].includes(
    String(u.status || "").toLowerCase(),
  );

// KYC doc status (pending/approved/rejected) -> label + tone
const KYC_VIEW = {
  approved: { label: "Verified", tone: "green" },
  pending: { label: "Pending", tone: "orange" },
  rejected: { label: "Rejected", tone: "red" },
  none: { label: "Not Submitted", tone: "gray" },
};

// KYC document se user id nikalna (populated object ho ya plain id, dono chalega)
const refId = (ref) => {
  if (!ref) return "";
  if (typeof ref === "object") return String(ref._id || ref.uuid || ref.id || "");
  return String(ref);
};

const kycUserKey = (doc) =>
  refId(doc?.userId) ||
  refId(doc?.user) ||
  String(doc?.userUuid || doc?.uuid || "");

// Higher number = more meaningful KYC status when a user has multiple docs
const KYC_STATUS_RANK = {
  approved: 4,
  pending: 3,
  rejected: 2,
  incomplete: 1,
  none: 0,
};

const EmptyChart = ({ text = "No data yet" }) => (
  <div className="flex h-full items-center justify-center text-[12px] font-semibold text-[#9CA3AF]">
    {text}
  </div>
);

const SectionTitle = ({ icon: Icon, title, to }) => (
  <div className="mb-3 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Icon size={17} className="text-[#E39A00]" strokeWidth={2.4} />
      <h3 className="text-[14px] font-black text-[#1F2A6B]">{title}</h3>
    </div>
    {to && (
      <Link
        to={to}
        className="flex items-center gap-1 text-[11px] font-bold text-[#DC2626] hover:underline"
      >
        View All <ArrowRight size={13} />
      </Link>
    )}
  </div>
);

const SALES_RANGES = [7, 15, 30];

const fmtINR = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

const fmtCompactINR = (v) => {
  const n = Number(v || 0);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
};

const SalesTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-xl border border-[#F3E7C4] bg-white px-3 py-2 text-[11px] shadow-lg">
      <p className="mb-1 font-black text-[#1F2A6B]">{label}</p>
      <p className="flex items-center gap-1.5 text-[#374151]">
        <span className="h-2 w-2 rounded-full bg-[#F7B500]" />
        Daily: <b>{row.dailyTickets.toLocaleString("en-IN")}</b> tickets
      </p>
      <p className="flex items-center gap-1.5 text-[#374151]">
        <span className="h-2 w-2 rounded-full bg-[#A855F7]" />
        Festival: <b>{row.festivalTickets.toLocaleString("en-IN")}</b> tickets
      </p>
      <p className="mt-1 border-t border-[#F3E7C4] pt-1 font-bold text-[#12A36B]">
        Revenue: {fmtINR(row.revenue)}
      </p>
    </div>
  );
};

const DistributionTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-[#F3E7C4] bg-white px-3 py-2 text-[11px] shadow-lg">
      <p className="font-black text-[#1F2A6B]">{d.name}</p>
      <p className="text-[#6B7280]">{d.type} Lottery</p>
      <p className="mt-1 text-[#374151]">
        <b>{Number(d.tickets || 0).toLocaleString("en-IN")}</b> tickets (
        {d.percent}%)
      </p>
      <p className="font-bold text-[#12A36B]">{fmtINR(d.revenue)}</p>
    </div>
  );
};

/* ================= COMPONENT ================= */

const Dashboard = () => {
  const dispatch = useDispatch();

  const { users = [] } = useSelector((state) => state.adminAuth);
  const { dashboardStats = {}, dashboardLoading } = useSelector(
    (state) => state.admin,
  );
  const rawKycDocs = useSelector(selectAdminKycDocuments);
  const kycDocs = useMemo(() => {
    if (Array.isArray(rawKycDocs)) return rawKycDocs;
    if (Array.isArray(rawKycDocs?.data)) return rawKycDocs.data;
    if (Array.isArray(rawKycDocs?.documents)) return rawKycDocs.documents;
    return [];
  }, [rawKycDocs]);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(getAllUsers());
    dispatch(getAllKyc()); // saare KYC docs (status filter ke bina)
  }, [dispatch]);

  /* ---------- TOP STAT CARDS ---------- */
  const num = (v) =>
    dashboardLoading ? "..." : Number(v || 0).toLocaleString("en-IN");

  const statCards = [
    {
      title: "Total Users",
      value: num(dashboardStats.totalUsers ?? users.length),
      icon: Users,
    },
    {
      title: "Total Tickets",
      value: num(dashboardStats.totalEntries),
      icon: Ticket,
    },
    {
      title: "Total Draws",
      value: num(dashboardStats.totalConfigs),
      icon: Trophy,
    },
    {
      title: "Total Winners",
      value: num(dashboardStats.totalWinners),
      icon: Crown,
    },
    {
      title: "Total Prize Amount",
      value: dashboardLoading
        ? "..."
        : `₹${Number(dashboardStats.totalPrizeAmount || 0).toLocaleString("en-IN")}`,
      icon: IndianRupee,
    },
  ];

  /* ---------- KYC MAP: userKey -> status ---------- */
  const kycMap = useMemo(() => {
    const userDocsMap = new Map();
    kycDocs.forEach((doc) => {
      const key = kycUserKey(doc);
      if (!key) return;
      if (!userDocsMap.has(key)) userDocsMap.set(key, []);
      userDocsMap.get(key).push(doc);
    });

    const map = {};
    userDocsMap.forEach((docs, key) => {
      const statuses = docs.map((d) => String(d.status || "none").toLowerCase());

      // If user has any pending document, their KYC is pending review
      if (statuses.includes("pending")) {
        map[key] = { status: "pending" };
      } else if (statuses.includes("rejected") && !statuses.includes("approved")) {
        map[key] = { status: "rejected" };
      } else if (statuses.every((s) => s === "approved")) {
        map[key] = { status: "approved" };
      } else {
        const sorted = [...docs].sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt || 0) -
            new Date(a.updatedAt || a.createdAt || 0),
        );
        map[key] = { status: sorted[0]?.status || "none" };
      }
    });
    return map;
  }, [kycDocs]);

  const getKycStatus = (u) => {
    if (u?.isKycVerified) return "approved";
    return (
      kycMap[String(u?._id)]?.status ||
      kycMap[String(u?.uuid)]?.status ||
      "none"
    );
  };

  /* ---------- TOP 5 RECENT USERS ---------- */
  const recentUsers = useMemo(
    () =>
      [...users]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5),
    [users],
  );

  /* ---------- ACTIVE USERS (LOGGED IN WITHIN LAST 3-4 DAYS) ---------- */
  const activeUsersList = useMemo(() => {
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    const sourceUsers =
      dashboardStats?.activeUsers && dashboardStats.activeUsers.length > 0
        ? dashboardStats.activeUsers
        : users;

    return [...sourceUsers]
      .filter((u) => {
        const loginTime = u.lastLogin?.time ? new Date(u.lastLogin.time) : null;
        return loginTime && loginTime >= fourDaysAgo;
      })
      .sort((a, b) => {
        const timeA = new Date(a.lastLogin?.time || 0).getTime();
        const timeB = new Date(b.lastLogin?.time || 0).getTime();
        return timeB - timeA;
      });
  }, [dashboardStats?.activeUsers, users]);

  /* ---------- USER STATISTICS ---------- */
  const userStats = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const pendingCount =
      dashboardStats?.kycStats?.pending !== undefined
        ? dashboardStats.kycStats.pending
        : dashboardStats?.pendingKyc !== undefined
          ? dashboardStats.pendingKyc
          : users.filter((u) => getKycStatus(u) === "pending").length;

    return [
      { name: "Total Users", value: users.length, color: "#E39A00" },
      {
        name: "Active Users",
        value: users.filter(isUserActive).length,
        color: "#3B82F6",
      },
      {
        name: "New Users",
        value: users.filter((u) => new Date(u.createdAt || 0) >= monthStart)
          .length,
        color: "#22C55E",
      },
      {
        name: "Pending KYC",
        value: pendingCount,
        color: "#FB923C",
      },
      {
        name: "Suspended",
        value: users.filter(isUserSuspended).length,
        color: "#EF4444",
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, kycMap, dashboardStats?.kycStats?.pending, dashboardStats?.pendingKyc]);

  /* ---------- BACKEND DATA ---------- */
  const [salesRange, setSalesRange] = useState(7);

  const allSales = useMemo(
    () => dashboardStats.salesOverview || [],
    [dashboardStats.salesOverview],
  );
  const sales = useMemo(
    () => allSales.slice(-salesRange),
    [allSales, salesRange],
  );
  const salesSummary = useMemo(
    () =>
      sales.reduce(
        (acc, d) => ({
          tickets: acc.tickets + (d.tickets || 0),
          revenue: acc.revenue + (d.revenue || 0),
        }),
        { tickets: 0, revenue: 0 },
      ),
    [sales],
  );
  const hasSales = salesSummary.tickets > 0;

  const distribution = dashboardStats.distribution || [];
  const ticketTotals = dashboardStats.ticketTotals || {};
  const todayDraws = dashboardStats.todayDraws || [];
  const winningTickets = (dashboardStats.recentWinningTickets || []).slice(
    0,
    5,
  );
  const totalDist = distribution.reduce((s, d) => s + (d.value || 0), 0);

  const quickActions = [
    {
      title: "Add New Draw",
      desc: "Create and schedule new draw with prize details",
      icon: CalendarPlus,
      to: "/admin/lottery",
    },
    {
      title: "Publish Result",
      desc: "Add winning number and publish result",
      icon: Trophy,
      to: "/admin/results",
    },
    {
      title: "Manage Banners",
      desc: "Update home banners and promotions",
      icon: ImageIcon,
      to: "/admin/banners",
    },
    {
      title: "Send Notification",
      desc: "Send push/SMS notifications to users",
      icon: Bell,
      to: "/admin/notifications",
    },
    {
      title: "View Reports",
      desc: "Check detailed reports and analytics",
      icon: BarChart3,
      to: "/admin/reports",
    },
  ];

  return (
    <div className="space-y-4">
      {/* ================= 1. STAT CARDS ================= */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.title}
              className={`${CARD} flex items-center gap-3 p-4`}
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#FFEFA8]">
                <Icon size={26} className="text-[#C27A00]" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-[#6B7280]">
                  {c.title}
                </p>
                <h2 className="truncate text-xl font-black text-[#1F2A6B]">
                  {c.value}
                </h2>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= 2. BANNER + TODAY'S DRAWS ================= */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Banner */}
        <div className="relative min-h-[170px] overflow-hidden rounded-2xl bg-gradient-to-r from-[#1A1204] via-[#3A2606] to-[#1A1204] p-6 xl:col-span-2">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[#FFD83D]/30 blur-3xl" />
          <Crown
            size={90}
            className="pointer-events-none absolute left-6 top-6 text-[#F7B500]/80"
            strokeWidth={1.3}
          />
          <div className="relative flex h-full flex-col items-center justify-center text-center sm:ml-24">
            <h1 className="bg-gradient-to-b from-[#FFE46B] via-[#F7B500] to-[#E39A00] bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-5xl">
              DEAR LOTTERY
            </h1>
            <p className="mt-1 text-sm font-semibold tracking-[0.35em] text-white sm:text-lg">
              ADMIN DASHBOARD
            </p>
            <p className="mt-3 text-[10px] font-semibold tracking-wider text-[#FFEFA8]">
              MANAGE DRAWS | PUBLISH RESULTS | VIEW WINNERS | MONITOR ACTIVITY
            </p>
          </div>
        </div>

        {/* Today's Draws */}
        <div className={`${CARD} p-4`}>
          <SectionTitle
            icon={CalendarDays}
            title="Today's Draws"
            to="/admin/lottery"
          />
          {todayDraws.length === 0 ? (
            <div className="h-28">
              <EmptyChart text="No draws today" />
            </div>
          ) : (
            <ul className="space-y-2.5">
              {todayDraws.map((d, i) => {
                const type = String(d.type || "").toUpperCase();
                const published =
                  String(d.status || "").toLowerCase() === "published";
                return (
                  <li
                    key={d.drawNo || i}
                    className="flex items-center justify-between gap-2 text-[11px]"
                  >
                    <span
                      className={`w-[64px] rounded-md px-2 py-1 text-center text-[10px] font-extrabold text-white ${
                        DRAW_TYPE_STYLE[type] || "bg-[#6B7280]"
                      }`}
                    >
                      {type || "DRAW"}
                    </span>
                    <span className="flex-1 truncate font-bold text-[#1F2A6B]">
                      {d.drawNo}
                    </span>
                    <span className="text-[#374151]">{d.time}</span>
                    <span className={pill(published ? "green" : "gold")}>
                      {published ? "Published" : "Scheduled"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ================= 3. CHARTS ROW ================= */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Ticket Sales Overview */}
        <div className={`${CARD} p-4`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 size={17} className="text-[#E39A00]" strokeWidth={2.4} />
              <h3 className="text-[14px] font-black text-[#1F2A6B]">
                Ticket Sales Overview
              </h3>
            </div>
            <div className="flex rounded-lg bg-[#FFF6D6] p-0.5">
              {SALES_RANGES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSalesRange(r)}
                  className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold transition ${
                    salesRange === r
                      ? "bg-gradient-to-b from-[#FFD83D] to-[#E39A00] text-[#1A1204] shadow"
                      : "text-[#9A5B00] hover:bg-[#FFEFA8]"
                  }`}
                >
                  {r}D
                </button>
              ))}
            </div>
          </div>

          <div className="mb-2 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-[#FFF9E3] px-3 py-1.5">
              <p className="text-[9px] font-semibold text-[#6B7280]">
                Tickets ({salesRange} days)
              </p>
              <p className="text-sm font-black text-[#1F2A6B]">
                {dashboardLoading
                  ? "..."
                  : salesSummary.tickets.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="rounded-xl bg-[#E6F6EF] px-3 py-1.5">
              <p className="text-[9px] font-semibold text-[#6B7280]">
                Revenue ({salesRange} days)
              </p>
              <p className="text-sm font-black text-[#12A36B]">
                {dashboardLoading ? "..." : fmtINR(salesSummary.revenue)}
              </p>
            </div>
          </div>

          <div className="h-44">
            {!hasSales ? (
              <EmptyChart
                text={
                  dashboardLoading
                    ? "Loading..."
                    : `No ticket sales in the last ${salesRange} days`
                }
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={sales} margin={{ top: 4, right: 0, left: -18 }}>
                  <defs>
                    <linearGradient id="goldBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFD83D" />
                      <stop offset="100%" stopColor="#E39A00" />
                    </linearGradient>
                    <linearGradient id="purpleBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C084FC" />
                      <stop offset="100%" stopColor="#7E22CE" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#F3E7C4"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={8}
                  />
                  <YAxis
                    yAxisId="tickets"
                    tick={{ fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    yAxisId="revenue"
                    orientation="right"
                    tick={{ fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={fmtCompactINR}
                    width={44}
                  />
                  <Tooltip content={<SalesTooltip />} cursor={{ fill: "#FFF9E3" }} />
                  <Bar
                    yAxisId="tickets"
                    dataKey="dailyTickets"
                    name="Daily"
                    stackId="tickets"
                    fill="url(#goldBar)"
                    maxBarSize={22}
                  />
                  <Bar
                    yAxisId="tickets"
                    dataKey="festivalTickets"
                    name="Festival"
                    stackId="tickets"
                    fill="url(#purpleBar)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={22}
                  />
                  <Line
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#12A36B"
                    strokeWidth={2}
                    dot={salesRange <= 15 ? { r: 2.5 } : false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-2 flex items-center justify-center gap-4 text-[10px] font-semibold text-[#374151]">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#F7B500]" /> Daily
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#A855F7]" /> Festival
            </span>
            <span className="flex items-center gap-1">
              <span className="h-0.5 w-3 bg-[#12A36B]" /> Revenue
            </span>
          </div>
        </div>

        {/* Ticket Distribution */}
        <div className={`${CARD} p-4`}>
          <SectionTitle icon={Ticket} title="Ticket Distribution" />

          <div className="mb-2 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-[#FFF9E3] px-3 py-1.5">
              <p className="text-[9px] font-semibold text-[#6B7280]">
                Daily Lottery
              </p>
              <p className="text-sm font-black text-[#1F2A6B]">
                {Number(ticketTotals.daily || 0).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="rounded-xl bg-[#F5EDFF] px-3 py-1.5">
              <p className="text-[9px] font-semibold text-[#6B7280]">
                Festival Lottery
              </p>
              <p className="text-sm font-black text-[#7E22CE]">
                {Number(ticketTotals.festival || 0).toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div className="h-44">
            {totalDist === 0 ? (
              <EmptyChart
                text={dashboardLoading ? "Loading..." : "No tickets sold yet"}
              />
            ) : (
              <div className="flex h-full items-center gap-2">
                <div className="relative h-full w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distribution}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="62%"
                        outerRadius="92%"
                        paddingAngle={distribution.length > 1 ? 2 : 0}
                        stroke="none"
                      >
                        {distribution.map((d, i) => (
                          <Cell
                            key={d.name}
                            fill={PIE_COLORS[i % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<DistributionTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-base font-black text-[#1F2A6B]">
                      {totalDist.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[9px] text-[#6B7280]">
                      Total Tickets
                    </span>
                  </div>
                </div>
                <ul className="w-1/2 space-y-2">
                  {distribution.map((d, i) => (
                    <li key={d.name} className="text-[11px]">
                      <div className="flex items-center justify-between gap-1">
                        <span className="flex min-w-0 items-center gap-1.5 text-[#374151]">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              background: PIE_COLORS[i % PIE_COLORS.length],
                            }}
                          />
                          <span className="truncate" title={d.name}>
                            {d.name}
                          </span>
                        </span>
                        <span className="font-bold text-[#1F2A6B]">
                          {d.percent}%
                        </span>
                      </div>
                      <p className="pl-4 text-[9px] text-[#9CA3AF]">
                        {Number(d.tickets || 0).toLocaleString("en-IN")} tickets
                        · {fmtINR(d.revenue)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* User Statistics */}
        <div className={`${CARD} p-4`}>
          <SectionTitle icon={Users} title="User Statistics" />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userStats} margin={{ top: 18 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <Tooltip cursor={{ fill: "#FFF9E3" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={30}>
                  {userStats.map((s) => (
                    <Cell key={s.name} fill={s.color} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="top"
                    style={{ fontSize: 10, fontWeight: 700 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ================= 4. WINNING TICKETS + RECENT USERS ================= */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Recent Winning Tickets */}
        <div className={`${CARD} p-4`}>
          <SectionTitle
            icon={Medal}
            title="Recent Winning Tickets"
            to="/admin/results"
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-[11px]">
              <thead>
                <tr className="border-b border-[#F3E7C4] text-[10px] font-bold text-[#6B7280]">
                  <th className="py-2">#</th>
                  <th>Draw No.</th>
                  <th>Date &amp; Time</th>
                  <th>Winning Number</th>
                  <th>Prize</th>
                  <th>Ticket No.</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {winningTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-[#9CA3AF]">
                      No winning tickets yet
                    </td>
                  </tr>
                ) : (
                  winningTickets.map((t, i) => (
                    <tr
                      key={t._id || i}
                      className="border-b border-[#FBF3DB] last:border-0"
                    >
                      <td className="py-2">{i + 1}</td>
                      <td className="font-bold text-[#1F2A6B]">{t.drawNo}</td>
                      <td className="text-[10px] text-[#374151]">
                        {fmtDateTime(t.dateTime)}
                      </td>
                      <td
                        className="text-base font-black"
                        style={{
                          color: NUMBER_COLORS[i % NUMBER_COLORS.length],
                        }}
                      >
                        {t.winningNumber}
                      </td>
                      <td>
                        <div className="text-[10px] font-bold text-[#DC2626]">
                          {t.prizeLabel}
                        </div>
                        <div className="text-[10px] font-extrabold text-[#DC2626]">
                          ₹{Number(t.prizeAmount || 0).toLocaleString("en-IN")}
                        </div>
                      </td>
                      <td className="text-[10px] text-[#374151]">
                        {t.ticketNo}
                      </td>
                      <td>
                        <span className={pill("green")}>
                          {t.status || "Verified"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Users (small) */}
        <div className={`${CARD} p-4`}>
          <SectionTitle icon={UserCheck} title="Recent Users" to="/users" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-[11px]">
              <thead>
                <tr className="border-b border-[#F3E7C4] text-[10px] font-bold text-[#6B7280]">
                  <th className="py-2">Name</th>
                  <th>Mobile No.</th>
                  <th>KYC</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Join Date</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-[#9CA3AF]">
                      No users found
                    </td>
                  </tr>
                ) : (
                  recentUsers.map((u) => {
                    const kyc = KYC_VIEW[getKycStatus(u)] || KYC_VIEW.none;
                    const active = isUserActive(u);
                    return (
                      <tr
                        key={u.uuid || u._id}
                        className="border-b border-[#FBF3DB] last:border-0"
                      >
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFEFA8] text-[10px] font-black text-[#1A1204] ring-1 ring-[#F2B705]">
                              {(u.name || "U").charAt(0).toUpperCase()}
                            </span>
                            <span className="max-w-[90px] truncate font-semibold text-[#1A1A1A]">
                              {u.name || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="text-[#374151]">{u.mobile || "-"}</td>
                        <td>
                          <span className={pill(kyc.tone)}>{kyc.label}</span>
                        </td>
                        <td>
                          <span className={pill(active ? "green" : "red")}>
                            {active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="text-[10px] text-[#374151] whitespace-nowrap">
                          {u.lastLogin?.time ? (
                            <span>{fmtDate(u.lastLogin.time)}</span>
                          ) : (
                            <span className="text-[#9CA3AF]">Never</span>
                          )}
                        </td>
                        <td className="text-[10px] text-[#374151]">
                          {fmtDate(u.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================= ACTIVE USERS BOX (LAST 3-4 DAYS) ================= */}
      <div className={`${CARD} p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F3E7C4] pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E6F6EF] text-[#12A36B] ring-1 ring-[#12A36B]/20">
              <UserCheck size={18} strokeWidth={2.5} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-[#1A1A1A]">
                  Active Users (Last 3-4 Days)
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#E6F6EF] px-2 py-0.5 text-[10px] font-extrabold text-[#12A36B]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#12A36B] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#12A36B]" />
                  </span>
                  {activeUsersList.length} Active
                </span>
              </div>
              <p className="text-[11px] text-[#6B7280]">
                Users who logged into the platform within the past 3 to 4 days
              </p>
            </div>
          </div>

          <Link
            to="/users"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#9A5B00] hover:text-[#E39A00]"
          >
            Manage All Users <ArrowRight size={13} />
          </Link>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[11px]">
            <thead>
              <tr className="border-b border-[#F3E7C4] text-[10px] font-bold text-[#6B7280]">
                <th className="py-2.5">User</th>
                <th>Mobile No.</th>
                <th>Last Login Time</th>
                <th>Device / OS</th>
                <th>Wallet Balance</th>
                <th>KYC</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {activeUsersList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#9CA3AF]">
                    <UserCheck
                      size={28}
                      className="mx-auto mb-2 text-gray-300"
                    />
                    <p className="font-bold text-[#374151]">
                      No active users in the last 3-4 days
                    </p>
                    <p className="mt-0.5 text-xs text-[#9CA3AF]">
                      Users who log in will automatically appear in this box.
                    </p>
                  </td>
                </tr>
              ) : (
                activeUsersList.map((u) => {
                  const kyc = KYC_VIEW[getKycStatus(u)] || KYC_VIEW.none;
                  const active = isUserActive(u);
                  return (
                    <tr
                      key={u.uuid || u._id}
                      className="border-b border-[#FBF3DB] transition hover:bg-[#FFFDF7] last:border-0"
                    >
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFEFA8] text-[10px] font-black text-[#1A1204] ring-1 ring-[#F2B705]">
                            {(u.name || "U").charAt(0).toUpperCase()}
                          </span>
                          <span className="truncate font-semibold text-[#1A1A1A]">
                            {u.name || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="font-mono text-[#374151]">
                        {u.mobile || "-"}
                      </td>
                      <td className="whitespace-nowrap font-medium text-[#1A1A1A]">
                        {u.lastLogin?.time ? (
                          <div className="flex items-center gap-1 text-[11px]">
                            <Clock size={12} className="text-[#12A36B]" />
                            <span>{fmtDateTime(u.lastLogin.time)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Never</span>
                        )}
                      </td>
                      <td className="text-[10px] text-[#6B7280]">
                        {u.lastLogin?.device ? (
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-[#374151]">
                            {u.lastLogin.device}{" "}
                            {u.lastLogin.os ? `• ${u.lastLogin.os}` : ""}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="font-black text-[#9A5B00]">
                        ₹{Number(u.wallet || 0).toLocaleString("en-IN")}
                      </td>
                      <td>
                        <span className={pill(kyc.tone)}>{kyc.label}</span>
                      </td>
                      <td>
                        <span className={pill(active ? "green" : "red")}>
                          {active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= 5. QUICK ACTIONS ================= */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {quickActions.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.title}
              to={a.to}
              className={`${CARD} flex items-center gap-3 p-3 transition hover:-translate-y-0.5 hover:border-[#F2B705]`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFEFA8]">
                <Icon size={22} className="text-[#C27A00]" strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-extrabold text-[#1F2A6B]">
                  {a.title}
                </p>
                <p className="line-clamp-2 text-[10px] leading-snug text-[#6B7280]">
                  {a.desc}
                </p>
              </div>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#F2B705] text-[#E39A00]">
                <ChevronRight size={14} />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
