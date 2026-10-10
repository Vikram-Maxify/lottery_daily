const LotteryNumber = require("../models/LotteryNumber");
const LotteryConfig = require("../models/LotteryConfig");
const Festival = require("../models/Festival");
const Deposit = require("../models/Deposit");

// =====================================================
// DATE HELPER (IST YYYY-MM-DD)
// =====================================================
function getIndiaDate() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

// 15 minutes reservation window for pending deposits
const PENDING_RESERVATION_TTL_MS = 15 * 60 * 1000;

/**
 * Check whether a list of lottery numbers are available for purchase.
 * Inspects:
 * 1. LotteryNumber collection: CRON-sold numbers (status: 'sold')
 * 2. LotteryConfig / Festival: previously purchased numbers in users array
 * 3. Deposit collection: numbers in completed deposits (status: 1) or active pending deposits (status: 0)
 *
 * @param {string[]} numbers - Array of 8-character ticket numbers
 * @param {object} options - { configId, userId }
 * @returns {Promise<{ available: boolean, unavailableNumbers: string[], reason: string }>}
 */
async function checkNumbersAvailability(numbers = [], options = {}) {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return { available: true, unavailableNumbers: [], reason: "" };
  }

  const normalized = Array.from(
    new Set(numbers.map((n) => String(n || "").trim().toUpperCase()))
  ).filter(Boolean);

  const unavailableSet = new Set();
  const reasons = [];

  // 1. CHECK LOTTERYNUMBER COLLECTION (CRON-sold tickets & previously sold numbers)
  const soldInLotteryNumber = await LotteryNumber.find({
    number: { $in: normalized },
    status: "sold",
  }).lean();

  if (soldInLotteryNumber.length > 0) {
    soldInLotteryNumber.forEach((doc) => {
      unavailableSet.add(doc.number);
    });
    const soldList = soldInLotteryNumber.map((d) => d.number);
    reasons.push(
      `Ticket number ${soldList.join(", ")} is already sold.`
    );
  }

  // 2. CHECK CONFIG / FESTIVAL USERS ARRAYS (Manual wallet or gateway entries)
  const remainingToCheck = normalized.filter((n) => !unavailableSet.has(n));

  if (remainingToCheck.length > 0) {
    const configQuery = options.configId
      ? { _id: options.configId, "users.number": { $in: remainingToCheck } }
      : { "users.number": { $in: remainingToCheck } };

    const [configsWithNumbers, festivalsWithNumbers] = await Promise.all([
      LotteryConfig.find(configQuery, { "users.number": 1 }).lean(),
      Festival.find(configQuery, { "users.number": 1 }).lean(),
    ]);

    const soldInConfigs = new Set();
    const collectFromUsers = (list) => {
      (list || []).forEach((doc) => {
        (doc.users || []).forEach((u) => {
          const num = String(u.number || "").trim().toUpperCase();
          if (remainingToCheck.includes(num)) {
            soldInConfigs.add(num);
            unavailableSet.add(num);
          }
        });
      });
    };

    collectFromUsers(configsWithNumbers);
    collectFromUsers(festivalsWithNumbers);

    if (soldInConfigs.size > 0) {
      reasons.push(
        `Ticket number ${Array.from(soldInConfigs).join(", ")} has already been purchased.`
      );
    }
  }

  // 3. CHECK DEPOSITS (Pending or Successful gateway payments)
  const stillAvailable = normalized.filter((n) => !unavailableSet.has(n));

  if (stillAvailable.length > 0) {
    const activeCutoff = new Date(Date.now() - PENDING_RESERVATION_TTL_MS);

    const depositQuery = {
      lotteryNumbers: { $in: stillAvailable },
      $or: [
        { status: 1 }, // Completed / Success
        {
          status: 0, // Pending payment
          createdAt: { $gte: activeCutoff },
          ...(options.userId ? { userId: { $ne: options.userId } } : {}),
        },
      ],
    };

    const conflictingDeposits = await Deposit.find(depositQuery, {
      lotteryNumbers: 1,
      status: 1,
    }).lean();

    const reservedInDeposits = new Set();
    conflictingDeposits.forEach((dep) => {
      (dep.lotteryNumbers || []).forEach((num) => {
        const clean = String(num || "").trim().toUpperCase();
        if (stillAvailable.includes(clean)) {
          reservedInDeposits.add(clean);
          unavailableSet.add(clean);
        }
      });
    });

    if (reservedInDeposits.size > 0) {
      reasons.push(
        `Ticket number ${Array.from(reservedInDeposits).join(", ")} is currently reserved or purchased.`
      );
    }
  }

  const unavailableNumbers = Array.from(unavailableSet);

  if (unavailableNumbers.length > 0) {
    return {
      available: false,
      unavailableNumbers,
      reason:
        reasons[0] ||
        `Ticket number ${unavailableNumbers.join(", ")} is not available. Please choose another number.`,
    };
  }

  return {
    available: true,
    unavailableNumbers: [],
    reason: "",
  };
}

/**
 * Atomically reserve numbers in LotteryNumber collection.
 * - If number exists in LotteryNumber with status "available", atomically updates to "sold".
 * - If number exists in LotteryNumber with status "sold" (e.g. CRON sold it), fails with conflict.
 * - If number does NOT exist in LotteryNumber, atomically creates it with status "sold".
 * - If conflict occurs at any point, safely rolls back all numbers claimed in this specific batch.
 *
 * @param {string[]} numbers - Array of normalized 8-char ticket numbers
 * @param {string} [batchDate]
 * @returns {Promise<{ success: boolean, reservedNumbers?: string[], conflictNumber?: string, message?: string }>}
 */
async function reserveNumbersAtomically(numbers = [], batchDate = getIndiaDate()) {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return { success: true, reservedNumbers: [] };
  }

  const normalized = Array.from(
    new Set(numbers.map((n) => String(n || "").trim().toUpperCase()))
  ).filter(Boolean);

  const successfullyReserved = [];
  const newlyCreated = [];

  for (const num of normalized) {
    try {
      const existing = await LotteryNumber.findOne({ number: num });

      if (existing) {
        if (existing.status !== "available") {
          // Already sold by CRON or previous user!
          await rollbackBatchReservations(successfullyReserved, newlyCreated);
          return {
            success: false,
            conflictNumber: num,
            message: `Ticket number "${num}" is already sold. Please choose another number.`,
          };
        }

        // Atomically transition from available -> sold
        const updated = await LotteryNumber.findOneAndUpdate(
          { number: num, status: "available" },
          {
            $set: {
              status: "sold",
              soldAt: new Date(),
            },
            $inc: { betCount: 1 },
          },
          { new: true }
        );

        if (!updated) {
          // Simultaneous race condition: CRON or another user grabbed it at this exact millisecond
          await rollbackBatchReservations(successfullyReserved, newlyCreated);
          return {
            success: false,
            conflictNumber: num,
            message: `Ticket number "${num}" is already sold. Please choose another number.`,
          };
        }

        successfullyReserved.push(num);
      } else {
        // Number not in LotteryNumber yet — insert with status: 'sold'
        try {
          await LotteryNumber.create({
            number: num,
            batchDate,
            status: "sold",
            soldAt: new Date(),
            betCount: 1,
          });
          successfullyReserved.push(num);
          newlyCreated.push(num);
        } catch (createErr) {
          // Duplicate key error (E11000) — another thread just inserted it
          await rollbackBatchReservations(successfullyReserved, newlyCreated);
          return {
            success: false,
            conflictNumber: num,
            message: `Ticket number "${num}" is already sold. Please choose another number.`,
          };
        }
      }
    } catch (err) {
      await rollbackBatchReservations(successfullyReserved, newlyCreated);
      return {
        success: false,
        conflictNumber: num,
        message: `Failed to reserve ticket "${num}": ${err.message}`,
      };
    }
  }

  return {
    success: true,
    reservedNumbers: successfullyReserved,
  };
}

/**
 * Rollback batch reservation if any ticket in the batch fails.
 */
async function rollbackBatchReservations(reservedNumbers = [], newlyCreated = []) {
  const newlyCreatedSet = new Set(newlyCreated);
  const preexistingToRevert = reservedNumbers.filter((n) => !newlyCreatedSet.has(n));

  if (preexistingToRevert.length > 0) {
    try {
      await LotteryNumber.updateMany(
        { number: { $in: preexistingToRevert } },
        {
          $set: { status: "available", soldAt: null },
          $inc: { betCount: -1 },
        }
      );
    } catch (e) {
      console.error("Rollback preexisting reservations error:", e);
    }
  }

  if (newlyCreated.length > 0) {
    try {
      await LotteryNumber.deleteMany({ number: { $in: newlyCreated } });
    } catch (e) {
      console.error("Rollback newly created tickets error:", e);
    }
  }
}

/**
 * Ensure numbers are permanently marked as sold in LotteryNumber upon final payment confirmation.
 * @param {string[]} numbers
 * @param {string} [batchDate]
 */
async function markNumbersAsSold(numbers = [], batchDate = getIndiaDate()) {
  if (!Array.isArray(numbers) || numbers.length === 0) return;

  const normalized = Array.from(
    new Set(numbers.map((n) => String(n || "").trim().toUpperCase()))
  ).filter(Boolean);

  for (const num of normalized) {
    try {
      await LotteryNumber.findOneAndUpdate(
        { number: num },
        {
          $set: { status: "sold", soldAt: new Date() },
          $inc: { betCount: 1 },
          $setOnInsert: { batchDate },
        },
        { upsert: true, new: true }
      );
    } catch (e) {
      console.error(`markNumbersAsSold error for ${num}:`, e.message);
    }
  }
}

module.exports = {
  checkNumbersAvailability,
  reserveNumbersAtomically,
  rollbackBatchReservations,
  markNumbersAsSold,
  getIndiaDate,
};
