const LotteryNumber = require("../models/LotteryNumber");
const {
  checkNumbersAvailability,
  reserveNumbersAtomically,
} = require("../services/ticketAvailabilityService");

// =====================================================
// CONFIG
// =====================================================

const DAILY_NUMBER_COUNT = 43200; // 100 -> 43200
const INSERT_CHUNK_SIZE = 5000;   // MongoDB insertMany chunk size

// =====================================================
// GET INDIA DATE (YYYY-MM-DD)
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

// =====================================================
// DATE VALIDATION
// =====================================================

function isValidDateString(date) {
  if (typeof date !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

  const parsed = new Date(`${date}T00:00:00Z`);
  return (
    !isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date
  );
}

// =====================================================
// GENERATE RANDOM NUMBER
// FORMAT: 10A78965  (2 digits + letter + 5 digits)
// =====================================================

function generateRandomNumber() {
  const firstTwo = Math.floor(10 + Math.random() * 90);

  const letter = String.fromCharCode(
    65 + Math.floor(Math.random() * 26)
  );

  const lastFive = Math.floor(10000 + Math.random() * 90000);

  return `${firstTwo}${letter}${lastFive}`;
}

// =====================================================
// GENERATE BULK UNIQUE NUMBERS (IN-MEMORY)
// No DB round-trip per number. Uses Set for uniqueness.
// =====================================================

function generateUniqueNumbersBulk(count) {
  const set = new Set();
  let safety = 0;
  const maxAttempts = count * 10; // safety valve

  while (set.size < count) {
    set.add(generateRandomNumber());
    safety++;

    if (safety > maxAttempts) {
      throw new Error(
        "Failed to generate enough unique numbers. Increase format space."
      );
    }
  }

  return Array.from(set);
}

// =====================================================
// GENERATE UNIQUE NUMBER (single, max 50 attempts)
// Kept for backward compatibility.
// =====================================================

async function generateUniqueNumber() {
  for (let attempt = 0; attempt < 50; attempt++) {
    const number = generateRandomNumber();

    const exists = await LotteryNumber.exists({ number });

    if (!exists) return number;
  }

  throw new Error(
    "Failed to generate a unique number after 50 attempts."
  );
}

// =====================================================
// CORE: CREATE DAILY NUMBERS FOR A DATE
// Reused by HTTP controller AND cron job.
// Idempotent — creates only the remaining numbers.
// Bulk generated in memory + chunked insertMany.
// =====================================================

async function createDailyNumbersForDate(batchDate) {
  if (!isValidDateString(batchDate)) {
    throw new Error("Invalid date. Use YYYY-MM-DD format.");
  }

  const existingCount = await LotteryNumber.countDocuments({ batchDate });

  if (existingCount >= DAILY_NUMBER_COUNT) {
    return {
      batchDate,
      existing: existingCount,
      created: 0,
      message: `${DAILY_NUMBER_COUNT} numbers already exist for this date.`,
    };
  }

  const remaining = DAILY_NUMBER_COUNT - existingCount;

  // 1. Bulk generate unique candidates in memory
  const candidates = generateUniqueNumbersBulk(remaining);

  // 2. Fetch existing numbers for this date to avoid collisions
  const existingDocs = await LotteryNumber.find(
    { batchDate },
    { number: 1, _id: 0 }
  ).lean();

  const existingSet = new Set(existingDocs.map((d) => d.number));

  // 3. Filter out any that already exist for this date
  const freshNumbers = candidates.filter((n) => !existingSet.has(n));

  if (freshNumbers.length === 0) {
    return {
      batchDate,
      existing: existingCount,
      created: 0,
      message: "No new numbers to insert (all candidates already exist).",
    };
  }

  // 4. Prepare documents
  const docs = freshNumbers.map((number) => ({
    number,
    batchDate,
    status: "available",
    betCount: 0,
    soldAt: null,
  }));

  // 5. Chunked insertMany (ordered: false so duplicates don't kill the batch)
  let createdTotal = 0;
  const createdNumbers = [];

  for (let i = 0; i < docs.length; i += INSERT_CHUNK_SIZE) {
    const chunk = docs.slice(i, i + INSERT_CHUNK_SIZE);

    try {
      const inserted = await LotteryNumber.insertMany(chunk, {
        ordered: false,
      });
      createdTotal += inserted.length;
      createdNumbers.push(...inserted);
    } catch (err) {
      // insertMany with ordered:false may throw on partial dup key errors.
      // Inserted docs are still in err.insertedDocs (Mongoose) or err.result.
      if (err && err.insertedDocs && err.insertedDocs.length) {
        createdTotal += err.insertedDocs.length;
        createdNumbers.push(...err.insertedDocs);
      } else if (err && err.writeErrors) {
        const insertedCount = chunk.length - err.writeErrors.length;
        createdTotal += insertedCount;
      } else {
        // Unknown error — rethrow
        throw err;
      }
    }
  }

  return {
    batchDate,
    existing: existingCount,
    created: createdTotal,
    message: `${createdTotal} new numbers created successfully.`,
    numbers: createdNumbers,
  };
}

// =====================================================
// CONTROLLER: CREATE DAILY NUMBERS
// =====================================================

const createDailyNumbers = async (req, res) => {
  try {
    const batchDate = req.body?.date || getIndiaDate();

    if (!isValidDateString(batchDate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date. Use YYYY-MM-DD format.",
      });
    }

    const result = await createDailyNumbersForDate(batchDate);

    if (result.created === 0) {
      return res.status(400).json({
        success: false,
        message: `${DAILY_NUMBER_COUNT} numbers already exist for this date.`,
        batchDate: result.batchDate,
        count: result.existing,
      });
    }

    return res.status(201).json({
      success: true,
      message: result.message,
      batchDate: result.batchDate,
      count: result.created,
      // NOTE: 43200 numbers response me bhejna heavy hoga.
      // Isliye sirf count bhej rahe hain. Agar chahiye to uncomment karo.
      // numbers: result.numbers,
    });
  } catch (error) {
    console.error("CREATE DAILY NUMBERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create daily numbers.",
      error: error.message,
    });
  }
};

// =====================================================
// GET AVAILABLE NUMBERS (today or by query date)
// Added pagination for 43200 scale.
// =====================================================

const getAvailableNumbers = async (req, res) => {
  try {
    const batchDate = req.query?.date || getIndiaDate();

    if (!isValidDateString(batchDate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date. Use YYYY-MM-DD format.",
      });
    }

    const page = Math.max(1, parseInt(req.query?.page, 10) || 1);
    const limit = Math.min(
      1000,
      Math.max(1, parseInt(req.query?.limit, 10) || 100)
    );
    const skip = (page - 1) * limit;

    const filter = { batchDate, status: "available" };

    if (req.query?.sample) {
      const sampleSize = Math.min(
        100,
        Math.max(1, parseInt(req.query?.sample, 10) || 18)
      );

      let sampleNumbers = await LotteryNumber.aggregate([
        { $match: filter },
        { $sample: { size: sampleSize } },
      ]);

      if (sampleNumbers.length === 0) {
        sampleNumbers = await LotteryNumber.aggregate([
          { $match: { status: "available" } },
          { $sample: { size: sampleSize } },
        ]);
      }

      return res.status(200).json({
        success: true,
        batchDate,
        total: sampleNumbers.length,
        count: sampleNumbers.length,
        numbers: sampleNumbers,
      });
    }

    const [numbers, total] = await Promise.all([
      LotteryNumber.find(filter)
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LotteryNumber.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      batchDate,
      page,
      limit,
      total,
      count: numbers.length,
      numbers,
    });
  } catch (error) {
    console.error("GET AVAILABLE NUMBERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get available numbers.",
      error: error.message,
    });
  }
};

// =====================================================
// GET TODAY'S ALL NUMBERS (paginated)
// =====================================================

const getTodayNumbers = async (req, res) => {
  try {
    const batchDate = getIndiaDate();

    const page = Math.max(1, parseInt(req.query?.page, 10) || 1);
    const limit = Math.min(
      1000,
      Math.max(1, parseInt(req.query?.limit, 10) || 100)
    );
    const skip = (page - 1) * limit;

    const filter = { batchDate };

    const [numbers, total] = await Promise.all([
      LotteryNumber.find(filter)
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LotteryNumber.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      batchDate,
      page,
      limit,
      total,
      count: numbers.length,
      numbers,
    });
  } catch (error) {
    console.error("GET TODAY NUMBERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get today's numbers.",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL NUMBERS (filters: date, status) — paginated
// =====================================================

const getAllNumbers = async (req, res) => {
  try {
    const filter = {};

    if (req.query?.date) {
      if (!isValidDateString(req.query.date)) {
        return res.status(400).json({
          success: false,
          message: "Invalid date. Use YYYY-MM-DD format.",
        });
      }
      filter.batchDate = req.query.date;
    }

    if (req.query?.status) {
      filter.status = req.query.status;
    }

    const page = Math.max(1, parseInt(req.query?.page, 10) || 1);
    const limit = Math.min(
      1000,
      Math.max(1, parseInt(req.query?.limit, 10) || 100)
    );
    const skip = (page - 1) * limit;

    const [numbers, total] = await Promise.all([
      LotteryNumber.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LotteryNumber.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      count: numbers.length,
      numbers,
    });
  } catch (error) {
    console.error("GET ALL NUMBERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get numbers.",
      error: error.message,
    });
  }
};

// =====================================================
// GET SINGLE NUMBER
// =====================================================

const getNumberByValue = async (req, res) => {
  try {
    const number = String(req.params.number || "")
      .trim()
      .toUpperCase();

    const lotteryNumber = await LotteryNumber.findOne({
      number,
    }).lean();

    if (!lotteryNumber) {
      return res.status(404).json({
        success: false,
        message: "Number not found.",
      });
    }

    return res.status(200).json({
      success: true,
      number: lotteryNumber,
    });
  } catch (error) {
    console.error("GET NUMBER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get number.",
      error: error.message,
    });
  }
};

// =====================================================
// CHECK NUMBER BEFORE BET
// =====================================================

const checkNumberForBet = async (req, res) => {
  try {
    const number = String(req.params.number || "")
      .trim()
      .toUpperCase();

    if (!number) {
      return res.status(400).json({
        success: false,
        canBet: false,
        message: "Ticket number is required.",
      });
    }

    if (!/^[a-zA-Z0-9]{8}$/.test(number)) {
      return res.status(400).json({
        success: false,
        canBet: false,
        message: "Ticket number must be exactly 8 characters.",
      });
    }

    // Check availability against CRON-sold numbers, configs, and deposits
    const check = await checkNumbersAvailability([number]);

    if (!check.available) {
      return res.status(400).json({
        success: false,
        canBet: false,
        isSold: true,
        message: check.reason || "This number has already been sold.",
        number,
      });
    }

    const lotteryNumber = await LotteryNumber.findOne({ number }).lean();

    return res.status(200).json({
      success: true,
      canBet: true,
      isSold: false,
      message: "Number is available for betting.",
      number: lotteryNumber || { number, status: "available" },
    });
  } catch (error) {
    console.error("CHECK NUMBER ERROR:", error);

    return res.status(500).json({
      success: false,
      canBet: false,
      message: "Failed to check number.",
      error: error.message,
    });
  }
};

// =====================================================
// SELL ONE NUMBER (atomic)
// =====================================================

const sellNumber = async (req, res) => {
  try {
    const number = String(req.body?.number || "")
      .trim()
      .toUpperCase();

    if (!number) {
      return res.status(400).json({
        success: false,
        message: "Number is required.",
      });
    }

    const updated = await LotteryNumber.findOneAndUpdate(
      { number, status: "available" },
      {
        $set: {
          status: "sold",
          soldAt: new Date(),
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: "Number not found or already sold.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Number sold successfully.",
      number: updated,
    });
  } catch (error) {
    console.error("SELL NUMBER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to sell number.",
    });
  }
};

// =====================================================
// SELL ALL TODAY'S NUMBERS
// =====================================================

const sellTodayNumbers = async (req, res) => {
  try {
    const batchDate = getIndiaDate();

    const result = await LotteryNumber.updateMany(
      { batchDate, status: "available" },
      {
        $set: {
          status: "sold",
          soldAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Today's available numbers marked as sold.",
      batchDate,
      soldCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("SELL TODAY NUMBERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to sell today's numbers.",
    });
  }
};

// =====================================================
// RESERVE NUMBER FOR BET (atomic)
// Bet controller me isi function ko use karo.
// =====================================================

const reserveNumberForBet = async (number) => {
  if (!number) {
    throw new Error("Lottery number is required.");
  }

  const normalizedNumber = String(number).trim().toUpperCase();

  const result = await reserveNumbersAtomically([normalizedNumber]);
  if (!result.success) {
    return null;
  }

  return await LotteryNumber.findOne({ number: normalizedNumber });
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  // HTTP controllers
  createDailyNumbers,
  getAvailableNumbers,
  getTodayNumbers,
  getAllNumbers,
  getNumberByValue,
  checkNumberForBet,
  sellNumber,
  sellTodayNumbers,

  // Shared services (used by bet controller + cron)
  reserveNumberForBet,
  createDailyNumbersForDate,
  generateUniqueNumber,
  generateUniqueNumbersBulk,
  getIndiaDate,
  isValidDateString,

  // Constants (agar bahar use karna ho)
  DAILY_NUMBER_COUNT,
};