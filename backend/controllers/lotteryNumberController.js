const LotteryNumber = require("../models/LotteryNumber");

// =====================================================
// GET INDIA DATE
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
// GENERATE RANDOM NUMBER
//
// FORMAT:
// 10A78965
//
// 2 digits + 1 uppercase letter + 5 digits
// Total = 8 characters
// =====================================================

function generateRandomNumber() {
  const firstTwo = Math.floor(
    10 + Math.random() * 90
  );

  const letter = String.fromCharCode(
    65 + Math.floor(Math.random() * 26)
  );

  const lastFive = Math.floor(
    10000 + Math.random() * 90000
  );

  return `${firstTwo}${letter}${lastFive}`;
}

// =====================================================
// GENERATE ONE UNIQUE NUMBER
//
// Existing database ke against check karta hai.
// =====================================================

async function generateUniqueNumber() {
  while (true) {
    const number = generateRandomNumber();

    const exists = await LotteryNumber.exists({
      number,
    });

    if (!exists) {
      return number;
    }
  }
}

// =====================================================
// CREATE DAILY 100 NUMBERS
//
// Har din exactly 100 numbers.
// Agar kisi reason se already kuch create ho chuke hain,
// to remaining numbers create karega.
// =====================================================

const createDailyNumbers = async (req, res) => {
  try {
    const batchDate =
      req.body?.date || getIndiaDate();

    // Date format validation
    if (!/^\d{4}-\d{2}-\d{2}$/.test(batchDate)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid date. Use YYYY-MM-DD format.",
      });
    }

    const existingCount =
      await LotteryNumber.countDocuments({
        batchDate,
      });

    // Already 100
    if (existingCount >= 100) {
      return res.status(400).json({
        success: false,
        message:
          "100 numbers already exist for this date.",
        batchDate,
        count: existingCount,
      });
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

    const createdNumbers =
      await LotteryNumber.insertMany(
        numbers,
        {
          ordered: true,
        }
      );

    return res.status(201).json({
      success: true,
      message: `${createdNumbers.length} new numbers created successfully.`,
      batchDate,
      count: createdNumbers.length,
      numbers: createdNumbers,
    });
  } catch (error) {
    console.error(
      "CREATE DAILY NUMBERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create daily numbers.",
      error: error.message,
    });
  }
};

// =====================================================
// GET TODAY AVAILABLE NUMBERS
// =====================================================

const getAvailableNumbers = async (req, res) => {
  try {
    const batchDate =
      req.query?.date || getIndiaDate();

    const numbers =
      await LotteryNumber.find({
        batchDate,
        status: "available",
      })
        .sort({
          createdAt: 1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      batchDate,
      count: numbers.length,
      numbers,
    });
  } catch (error) {
    console.error(
      "GET AVAILABLE NUMBERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get available numbers.",
      error: error.message,
    });
  }
};

// =====================================================
// GET TODAY ALL NUMBERS
// =====================================================

const getTodayNumbers = async (req, res) => {
  try {
    const batchDate = getIndiaDate();

    const numbers =
      await LotteryNumber.find({
        batchDate,
      })
        .sort({
          createdAt: 1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      batchDate,
      count: numbers.length,
      numbers,
    });
  } catch (error) {
    console.error(
      "GET TODAY NUMBERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get today's numbers.",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL NUMBERS
// =====================================================

const getAllNumbers = async (req, res) => {
  try {
    const filter = {};

    if (req.query?.date) {
      filter.batchDate = req.query.date;
    }

    if (req.query?.status) {
      filter.status = req.query.status;
    }

    const numbers =
      await LotteryNumber.find(filter)
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      count: numbers.length,
      numbers,
    });
  } catch (error) {
    console.error(
      "GET ALL NUMBERS ERROR:",
      error
    );

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
    const number =
      req.params.number.toUpperCase();

    const lotteryNumber =
      await LotteryNumber.findOne({
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
    console.error(
      "GET NUMBER ERROR:",
      error
    );

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

const checkNumberForBet = async (
  req,
  res
) => {
  try {
    const number =
      req.params.number.toUpperCase();

    const lotteryNumber =
      await LotteryNumber.findOne({
        number,
      }).lean();

    if (!lotteryNumber) {
      return res.status(404).json({
        success: false,
        canBet: false,
        message:
          "This number does not exist.",
      });
    }

    if (
      lotteryNumber.status !==
      "available"
    ) {
      return res.status(400).json({
        success: false,
        canBet: false,
        message:
          "This number is already sold.",
      });
    }

    return res.status(200).json({
      success: true,
      canBet: true,
      message:
        "Number is available for betting.",
      number: lotteryNumber,
    });
  } catch (error) {
    console.error(
      "CHECK NUMBER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      canBet: false,
      message:
        "Failed to check number.",
    });
  }
};

// =====================================================
// SELL ONE NUMBER
//
// Atomic operation.
// Agar already sold hai to update nahi hoga.
// =====================================================

const sellNumber = async (req, res) => {
  try {
    const number =
      req.body.number?.toUpperCase();

    if (!number) {
      return res.status(400).json({
        success: false,
        message: "Number is required.",
      });
    }

    const updated =
      await LotteryNumber.findOneAndUpdate(
        {
          number,
          status: "available",
        },
        {
          $set: {
            status: "sold",
            soldAt: new Date(),
          },
        },
        {
          new: true,
        }
      );

    if (!updated) {
      return res.status(400).json({
        success: false,
        message:
          "Number not found or already sold.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Number sold successfully.",
      number: updated,
    });
  } catch (error) {
    console.error(
      "SELL NUMBER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to sell number.",
    });
  }
};

// =====================================================
// SELL ALL TODAY NUMBERS
// =====================================================

const sellTodayNumbers = async (
  req,
  res
) => {
  try {
    const batchDate = getIndiaDate();

    const result =
      await LotteryNumber.updateMany(
        {
          batchDate,
          status: "available",
        },
        {
          $set: {
            status: "sold",
            soldAt: new Date(),
          },
        }
      );

    return res.status(200).json({
      success: true,
      message:
        "Today's available numbers marked as sold.",
      batchDate,
      soldCount: result.modifiedCount,
    });
  } catch (error) {
    console.error(
      "SELL TODAY NUMBERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to sell today's numbers.",
    });
  }
};

// =====================================================
// RESERVE NUMBER FOR BET
//
// IMPORTANT:
// Bet controller me isi function ko use karo.
//
// Atomic query:
// status available hona mandatory hai.
//
// Isse 2 users same number ko simultaneously
// reserve nahi kar sakte.
// =====================================================

const reserveNumberForBet = async (
  number
) => {
  if (!number) {
    throw new Error(
      "Lottery number is required."
    );
  }

  const normalizedNumber =
    number.toUpperCase().trim();

  const updated =
    await LotteryNumber.findOneAndUpdate(
      {
        number: normalizedNumber,
        status: "available",
      },
      {
        $set: {
          status: "sold",
          soldAt: new Date(),
        },
        $inc: {
          betCount: 1,
        },
      },
      {
        new: true,
      }
    );

  if (!updated) {
    return null;
  }

  return updated;
};

module.exports = {
  createDailyNumbers,
  getAvailableNumbers,
  getTodayNumbers,
  getAllNumbers,
  getNumberByValue,
  checkNumberForBet,
  sellNumber,
  sellTodayNumbers,
  reserveNumberForBet,
};