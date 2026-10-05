const LotteryNumber = require("../models/LotteryNumber");

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
// GENERATE UNIQUE NUMBER (max 50 attempts)
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
// CORE: CREATE DAILY 100 NUMBERS FOR A DATE
// Reused by HTTP controller AND cron job.
// Idempotent — creates only the remaining numbers.
// =====================================================

async function createDailyNumbersForDate(batchDate) {
  if (!isValidDateString(batchDate)) {
    throw new Error("Invalid date. Use YYYY-MM-DD format.");
  }

  const existingCount = await LotteryNumber.countDocuments({
    batchDate,
  });

  if (existingCount >= 100) {
    return {
      batchDate,
      existing: existingCount,
      created: 0,
      message: "100 numbers already exist for this date.",
    };
  }

  const remaining = 100 - existingCount;
  const numbers = [];

  for (let i = 0; i < remaining; i++) {
    const number = await generateUniqueNumber();

    numbers.push({
      number,
      batchDate,
      status: "available",
      betCount: 0,
      soldAt: null,
    });
  }

  const createdNumbers = await LotteryNumber.insertMany(numbers, {
    ordered: true,
  });

  return {
    batchDate,
    existing: existingCount,
    created: createdNumbers.length,
    message: `${createdNumbers.length} new numbers created successfully.`,
    numbers: createdNumbers,
  };
}

// =====================================================
// CONTROLLER: CREATE DAILY 100 NUMBERS
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
        message: "100 numbers already exist for this date.",
        batchDate: result.batchDate,
        count: result.existing,
      });
    }

    return res.status(201).json({
      success: true,
      message: result.message,
      batchDate: result.batchDate,
      count: result.created,
      numbers: result.numbers,
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

    const numbers = await LotteryNumber.find({
      batchDate,
      status: "available",
    })
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      batchDate,
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
// GET TODAY'S ALL NUMBERS
// =====================================================

const getTodayNumbers = async (req, res) => {
  try {
    const batchDate = getIndiaDate();

    const numbers = await LotteryNumber.find({ batchDate })
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      batchDate,
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
// GET ALL NUMBERS (filters: date, status)
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

    const numbers = await LotteryNumber.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
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

    const lotteryNumber = await LotteryNumber.findOne({
      number,
    }).lean();

    if (!lotteryNumber) {
      return res.status(404).json({
        success: false,
        canBet: false,
        message: "This number does not exist.",
      });
    }

    if (lotteryNumber.status !== "available") {
      return res.status(400).json({
        success: false,
        canBet: false,
        message: "This number is already sold.",
      });
    }

    return res.status(200).json({
      success: true,
      canBet: true,
      message: "Number is available for betting.",
      number: lotteryNumber,
    });
  } catch (error) {
    console.error("CHECK NUMBER ERROR:", error);

    return res.status(500).json({
      success: false,
      canBet: false,
      message: "Failed to check number.",
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

  const updated = await LotteryNumber.findOneAndUpdate(
    {
      number: normalizedNumber,
      status: "available",
    },
    {
      $set: {
        status: "sold",
        soldAt: new Date(),
      },
      $inc: { betCount: 1 },
    },
    { new: true }
  );

  return updated || null;
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
  getIndiaDate,
  isValidDateString,
};