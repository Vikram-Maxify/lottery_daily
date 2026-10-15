const User = require("../models/userModel");
const Deposit = require("../models/Deposit");
const LotteryConfig = require("../models/LotteryConfig");
const Festival = require("../models/Festival");
const LotteryResult = require("../models/LotteryResult");
const KycDocument = require("../models/KycDocument");
const { getOverallKycStatus } = require("./adminKycController");

// =====================================================
// KYC STATS HELPER
// =====================================================

const getKycStats = async () => {
  const [users, kycDocs] = await Promise.all([
    User.find({ role: "user" }).select("_id isKycVerified").lean(),
    KycDocument.find({}).lean(),
  ]);

  const docsByUser = new Map();
  for (const doc of kycDocs) {
    const uid = String(doc.userId);
    if (!docsByUser.has(uid)) docsByUser.set(uid, []);
    docsByUser.get(uid).push(doc);
  }

  const counts = { pending: 0, approved: 0, rejected: 0, none: 0 };

  for (const u of users) {
    const uid = String(u._id);
    const docs = docsByUser.get(uid) || [];

    if (u.isKycVerified) {
      counts.approved++;
      continue;
    }

    if (docs.length === 0) {
      counts.none++;
      continue;
    }

    const statuses = docs.map((d) => getOverallKycStatus(d));
    if (statuses.includes("pending")) {
      counts.pending++;
    } else if (statuses.includes("rejected")) {
      counts.rejected++;
    } else if (statuses.every((s) => s === "approved")) {
      counts.approved++;
    } else {
      counts.none++;
    }
  }

  return counts;
};

// =====================================================
// TICKET CHART HELPERS
// =====================================================

const SALES_DAYS = 30;
const MAX_DISTRIBUTION_SLICES = 5;

const toDateKey = (d) =>
  `${d.getFullYear()}-` +
  `${String(d.getMonth() + 1).padStart(2, "0")}-` +
  `${String(d.getDate()).padStart(2, "0")}`;

// Aggregates only confirmed purchases (isBuy: true).
// Each entry is one ticket number; `quantity` is the number of tickets in it.
const aggregateConfirmedEntries = (Model, fromDateKey) =>
  Promise.all([
    // Per day (purchase date) for the sales overview
    Model.aggregate([
      { $unwind: "$users" },
      {
        $match: {
          "users.isBuy": true,
          "users.entryDate": { $gte: fromDateKey },
        },
      },
      {
        $group: {
          _id: "$users.entryDate",
          tickets: { $sum: { $ifNull: ["$users.quantity", 10] } },
          revenue: { $sum: { $ifNull: ["$users.amount", 0] } },
        },
      },
    ]),
    // Per market (all time) for the distribution
    Model.aggregate([
      { $unwind: "$users" },
      { $match: { "users.isBuy": true } },
      {
        $group: {
          _id: "$marketName",
          tickets: { $sum: { $ifNull: ["$users.quantity", 10] } },
          revenue: { $sum: { $ifNull: ["$users.amount", 0] } },
        },
      },
    ]),
  ]);

const buildTicketCharts = async () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (SALES_DAYS - 1));
  const fromDateKey = toDateKey(start);

  const [[dailyByDay, dailyByMarket], [festByDay, festByMarket]] =
    await Promise.all([
      aggregateConfirmedEntries(LotteryConfig, fromDateKey),
      aggregateConfirmedEntries(Festival, fromDateKey),
    ]);

  // ---------- SALES OVERVIEW (continuous last 30 days) ----------
  const dailyMap = new Map(dailyByDay.map((d) => [d._id, d]));
  const festMap = new Map(festByDay.map((d) => [d._id, d]));

  const salesOverview = [];
  for (let i = 0; i < SALES_DAYS; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = toDateKey(d);
    const daily = dailyMap.get(key);
    const fest = festMap.get(key);

    const dailyTickets = daily?.tickets || 0;
    const festivalTickets = fest?.tickets || 0;

    salesOverview.push({
      dateKey: key,
      date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      dailyTickets,
      festivalTickets,
      tickets: dailyTickets + festivalTickets,
      revenue: (daily?.revenue || 0) + (fest?.revenue || 0),
    });
  }

  // ---------- DISTRIBUTION (by market, Daily + Festival) ----------
  const slices = [];
  const dailyTotal = dailyByMarket.reduce((s, m) => s + m.tickets, 0);
  const dailyRevenue = dailyByMarket.reduce((s, m) => s + m.revenue, 0);

  if (dailyTotal > 0) {
    slices.push({
      name: "Daily Lottery",
      type: "Daily",
      tickets: dailyTotal,
      revenue: dailyRevenue,
    });
  }

  festByMarket
    .filter((m) => m.tickets > 0)
    .forEach((m) =>
      slices.push({
        name: String(m._id || "Festival").trim(),
        type: "Festival",
        tickets: m.tickets,
        revenue: m.revenue,
      }),
    );

  slices.sort((a, b) => b.tickets - a.tickets);

  // Keep the chart readable: top N-1 slices + "Others"
  let finalSlices = slices;
  if (slices.length > MAX_DISTRIBUTION_SLICES) {
    const top = slices.slice(0, MAX_DISTRIBUTION_SLICES - 1);
    const rest = slices.slice(MAX_DISTRIBUTION_SLICES - 1);
    top.push({
      name: "Other Festivals",
      type: "Festival",
      tickets: rest.reduce((s, m) => s + m.tickets, 0),
      revenue: rest.reduce((s, m) => s + m.revenue, 0),
    });
    finalSlices = top;
  }

  const totalTickets = finalSlices.reduce((s, m) => s + m.tickets, 0);

  const distribution = finalSlices.map((m) => ({
    ...m,
    value: m.tickets,
    percent: totalTickets
      ? Number(((m.tickets / totalTickets) * 100).toFixed(1))
      : 0,
  }));

  const festivalTotal = festByMarket.reduce((s, m) => s + m.tickets, 0);

  return {
    salesOverview,
    distribution,
    ticketTotals: {
      daily: dailyTotal,
      festival: festivalTotal,
      total: dailyTotal + festivalTotal,
      revenue:
        dailyRevenue + festByMarket.reduce((s, m) => s + m.revenue, 0),
    },
  };
};

// =====================================================
// GET DASHBOARD STATS
// =====================================================

const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    // ===============================================
    // TOTAL USERS
    // ===============================================
    const totalUsers = await User.countDocuments({
      role: "user",
    });

    // ===============================================
    // TOTAL DEPOSIT AMOUNT (SUCCESS ONLY)
    // ===============================================
    const totalDepositAgg = await Deposit.aggregate([
      {
        $match: {
          status: 1,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const totalDeposit =
      totalDepositAgg.length > 0
        ? totalDepositAgg[0].total
        : 0;

    // ===============================================
    // TOTAL CONFIGS
    // ===============================================
    const totalConfigs =
      await LotteryConfig.countDocuments();

    // ===============================================
    // TOTAL ENTRIES (ACROSS ALL CONFIGS)
    // ===============================================
    const totalEntriesAgg =
      await LotteryConfig.aggregate([
        {
          $project: {
            count: { $size: "$users" },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$count" },
          },
        },
      ]);

    const totalEntries =
      totalEntriesAgg.length > 0
        ? totalEntriesAgg[0].total
        : 0;

    // ===============================================
    // TOTAL RESULTS
    // ===============================================
    const totalResults =
      await LotteryResult.countDocuments();

    // ===============================================
    // TODAY'S RESULTS
    // ===============================================
    const todayResults =
      await LotteryResult.countDocuments({
        date: {
          $gte: startOfDay,
          $lt: endOfDay,
        },
      });

    // ===============================================
    // TODAY'S DEPOSITS
    // ===============================================
    const todayDepositAgg = await Deposit.aggregate([
      {
        $match: {
          status: 1,
          createdAt: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const todayDeposit =
      todayDepositAgg.length > 0
        ? todayDepositAgg[0].total
        : 0;

    // ===============================================
    // ACTIVE USERS (LOGGED IN WITHIN LAST 3-4 DAYS)
    // ===============================================
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    const activeUsersQuery = {
      role: "user",
      $or: [
        { "lastLogin.time": { $gte: fourDaysAgo } },
        {
          $and: [
            { "lastLogin.time": null },
            { updatedAt: { $gte: fourDaysAgo } },
          ],
        },
      ],
    };

    const activeUsersCount = await User.countDocuments(activeUsersQuery);
    const activeUsersList = await User.find(activeUsersQuery)
      .sort({ "lastLogin.time": -1, updatedAt: -1 })
      .limit(30)
      .select("name mobile uuid lastLogin wallet createdAt isKycVerified")
      .lean();

    // ===============================================
    // KYC STATISTICS
    // ===============================================
    const kycStats = await getKycStats();

    // ===============================================
    // TICKET SALES OVERVIEW + DISTRIBUTION
    // ===============================================
    const { salesOverview, distribution, ticketTotals } =
      await buildTicketCharts();

    // ===============================================
    // RESPONSE
    // ===============================================
    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalDeposit,
        totalConfigs,
        totalEntries,
        totalResults,
        todayResults,
        todayDeposit,
        activeUsersCount,
        activeUsers: activeUsersList,
        salesOverview,
        distribution,
        ticketTotals,
        kycStats,
        pendingKyc: kycStats.pending,
      },
    });
  } catch (error) {
    console.error(
      "Dashboard stats error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
};