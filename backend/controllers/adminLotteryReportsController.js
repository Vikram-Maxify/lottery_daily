const mongoose = require("mongoose");
const Deposit = require("../models/Deposit");
const LotteryConfig = require("../models/LotteryConfig");
const Festival = require("../models/Festival");
const User = require("../models/userModel");

// =====================================================
// HELPER: IST DATE UTILITIES
// =====================================================

/**
 * Returns current date in IST formatted as YYYY-MM-DD
 */
const getTodayISTString = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
};

/**
 * Converts a YYYY-MM-DD string into UTC Date objects
 * matching 00:00:00.000 to 23:59:59.999 in IST (UTC+05:30).
 */
const getISTDateRange = (dateStr) => {
  const parts = String(dateStr || "").split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    // Fallback to today
    return getISTDateRange(getTodayISTString());
  }
  const [year, month, day] = parts;

  // IST is UTC + 5h 30m
  // Start: YYYY-MM-DD 00:00:00.000 IST -> UTC is (hour - 5, min - 30)
  const startUtc = new Date(Date.UTC(year, month - 1, day, 0 - 5, 0 - 30, 0, 0));
  // End: YYYY-MM-DD 23:59:59.999 IST
  const endUtc = new Date(Date.UTC(year, month - 1, day, 23 - 5, 59 - 30, 59, 999));

  return { startUtc, endUtc };
};

// =====================================================
// GET LOTTERY PURCHASE REPORTS (ADMIN)
// =====================================================

const getLotteryPurchaseReports = async (req, res) => {
  try {
    const type = String(req.query.type || "daily").toLowerCase() === "festival" ? "festival" : "daily";
    const reportDate = req.query.date ? String(req.query.date).trim() : getTodayISTString();
    const search = req.query.search ? String(req.query.search).trim() : "";
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { startUtc, endUtc } = getISTDateRange(reportDate);

    // 1. Fetch configs to identify Daily vs Festival
    const [festivals, dailyConfigs] = await Promise.all([
      Festival.find({}, { _id: 1, marketName: 1, drawDate: 1, drawTime: 1, users: 1 }).lean(),
      LotteryConfig.find({}, { _id: 1, marketName: 1, drawDate: 1, drawTime: 1, users: 1 }).lean(),
    ]);

    const festivalMap = new Map(festivals.map((f) => [String(f._id), f]));
    const dailyMap = new Map(dailyConfigs.map((d) => [String(d._id), d]));

    const festivalIds = festivals.map((f) => f._id);
    const dailyIds = dailyConfigs.map((d) => d._id);

    // 2. Build Base Query for lottery purchase deposits on this IST date
    const baseMatch = {
      createdAt: { $gte: startUtc, $lte: endUtc },
      $or: [
        { lotteryNumbers: { $exists: true, $ne: [] } },
        { number: { $exists: true, $ne: null } },
      ],
    };

    if (type === "festival") {
      baseMatch.configId = { $in: festivalIds };
    } else {
      // Daily lottery
      baseMatch.$and = [
        {
          $or: [
            { configId: { $in: dailyIds } },
            { configId: { $nin: festivalIds, $ne: null } },
          ],
        },
      ];
    }

    // 3. Add search filter if provided
    let filterQuery = { ...baseMatch };
    if (search) {
      const searchRegex = new RegExp(search, "i");

      // Also search user model for matching names/mobiles
      const matchedUsers = await User.find(
        {
          $or: [
            { name: searchRegex },
            { mobile: searchRegex },
            { uuid: searchRegex },
            { username: searchRegex },
          ],
        },
        { _id: 1 }
      ).lean();
      const matchedUserIds = matchedUsers.map((u) => u._id);

      const searchConditions = [
        { orderId: searchRegex },
        { username: searchRegex },
        { phone: searchRegex },
        { uid: searchRegex },
        { lotteryNumbers: searchRegex },
        { number: searchRegex },
      ];

      if (matchedUserIds.length > 0) {
        searchConditions.push({ userId: { $in: matchedUserIds } });
      }

      if (filterQuery.$and) {
        filterQuery.$and.push({ $or: searchConditions });
      } else {
        filterQuery = {
          $and: [baseMatch, { $or: searchConditions }],
        };
      }
    }

    // 4. Calculate summary statistics (across all records matching date & type, before pagination)
    const statsPipeline = [
      { $match: filterQuery },
      {
        $project: {
          status: 1,
          amount: 1,
          ticketCount: {
            $cond: {
              if: { $isArray: "$lotteryNumbers" },
              then: {
                $cond: {
                  if: { $gt: [{ $size: "$lotteryNumbers" }, 0] },
                  then: { $size: "$lotteryNumbers" },
                  else: { $cond: [{ $ifNull: ["$number", false] }, 1, 0] },
                },
              },
              else: { $cond: [{ $ifNull: ["$number", false] }, 1, 0] },
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalTickets: { $sum: "$ticketCount" },
          totalAmount: { $sum: "$amount" },
          successfulPurchases: {
            $sum: { $cond: [{ $eq: ["$status", 1] }, 1, 0] },
          },
          successfulAmount: {
            $sum: { $cond: [{ $eq: ["$status", 1] }, "$amount", 0] },
          },
          successfulTickets: {
            $sum: { $cond: [{ $eq: ["$status", 1] }, "$ticketCount", 0] },
          },
          pendingPurchases: {
            $sum: { $cond: [{ $eq: ["$status", 0] }, 1, 0] },
          },
          failedPurchases: {
            $sum: { $cond: [{ $in: ["$status", [2, 3]] }, 1, 0] },
          },
        },
      },
    ];

    const [statsResult, totalCount, rawDeposits] = await Promise.all([
      Deposit.aggregate(statsPipeline),
      Deposit.countDocuments(filterQuery),
      Deposit.find(filterQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name username mobile uuid email")
        .lean(),
    ]);

    const stats = statsResult[0] || {
      totalOrders: 0,
      totalTickets: 0,
      totalAmount: 0,
      successfulPurchases: 0,
      successfulAmount: 0,
      successfulTickets: 0,
      pendingPurchases: 0,
      failedPurchases: 0,
    };

    // 5. Transform records for detailed response
    const records = rawDeposits.map((dep) => {
      const isFestival = type === "festival";
      const config = isFestival
        ? festivalMap.get(String(dep.configId))
        : dailyMap.get(String(dep.configId));

      const ticketNumbers =
        Array.isArray(dep.lotteryNumbers) && dep.lotteryNumbers.length > 0
          ? dep.lotteryNumbers
          : dep.number
            ? [dep.number]
            : [];

      // Determine ticket status (Pending / Won / Lost / Cancelled)
      let ticketStatus = "Pending";
      if (dep.status === 0) {
        ticketStatus = "Payment Pending";
      } else if (dep.status === 2 || dep.status === 3) {
        ticketStatus = "Cancelled";
      } else if (config && Array.isArray(config.users)) {
        const depUserId = String(dep.userId?._id || dep.userId);
        const entries = config.users.filter(
          (u) =>
            String(u.userId) === depUserId && ticketNumbers.includes(u.number)
        );
        if (entries.some((e) => e.status === "win" || e.status === "won")) {
          ticketStatus = "Won";
        } else if (entries.length > 0 && entries.every((e) => e.status === "lost")) {
          ticketStatus = "Lost";
        } else {
          ticketStatus = "Pending";
        }
      }

      const paymentStatusMap = {
        0: "Pending",
        1: "Success",
        2: "Failed",
        3: "Cancelled",
      };

      return {
        _id: dep._id,
        orderId: dep.orderId,
        userId: dep.userId?._id || dep.userId,
        userName: dep.userId?.name || dep.username || "Anonymous",
        uid: dep.userId?.uuid || dep.uid || "-",
        mobile: dep.userId?.mobile || dep.phone || "-",
        lotteryType: isFestival ? "Festival Lottery" : "Daily Lottery",
        marketName:
          config?.marketName ||
          (isFestival ? "Festival Lottery" : "Daily Lottery"),
        drawDate: config?.drawDate || null,
        drawTime: config?.drawTime || null,
        ticketNumbers,
        ticketCount: ticketNumbers.length,
        amount: Number(dep.amount) || 0,
        createdAt: dep.createdAt,
        paymentStatus: paymentStatusMap[dep.status] || "Unknown",
        paymentStatusCode: dep.status,
        ticketStatus,
        paymentMethod: dep.paymentMethod || "INR",
        channel: dep.channel || "qwackpay",
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        type,
        date: reportDate,
        dateRange: { startUtc, endUtc },
        stats: {
          totalOrders: stats.totalOrders || 0,
          totalTickets: stats.totalTickets || 0,
          totalTicketsSold: stats.successfulTickets || 0,
          totalAmount: Math.round((stats.totalAmount || 0) * 100) / 100,
          successfulPurchases: stats.successfulPurchases || 0,
          successfulRevenue: Math.round((stats.successfulAmount || 0) * 100) / 100,
          pendingPurchases: stats.pendingPurchases || 0,
          failedPurchases: stats.failedPurchases || 0,
        },
        records,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit) || 1,
        },
      },
    });
  } catch (error) {
    console.error("GET LOTTERY PURCHASE REPORTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate lottery purchase reports",
      error: error.message,
    });
  }
};

module.exports = {
  getLotteryPurchaseReports,
};
