const mongoose = require("mongoose");

const LotteryResult = require("../models/LotteryResult");
const LotteryConfig = require("../models/LotteryConfig");
const User = require("../models/userModel");

// =====================================================
// CONSTANTS
// =====================================================
const PRIZE_COUNTS = {
  first: 1,
  second: 10,
  third: 10,
  fourth: 10, // adjust if different
  fifth: 100,
};

const PRIZE_DIGITS = {
  first: 8,  // exact match
  second: 5, // last 5 digits
  third: 4,  // last 4 digits
  fourth: 4, // last 4 digits
  fifth: 4,  // last 4 digits
};

// =====================================================
// VALIDATE 8-CHAR ALPHANUMERIC
// =====================================================
const validateLotteryNumber = (number) => {
  if (number === undefined || number === null) return false;
  return /^[a-zA-Z0-9]{8}$/.test(String(number).trim());
};

const validateSixDigitNumber = validateLotteryNumber;

// =====================================================
// NORMALIZE DATE (YYYY-MM-DD)
// =====================================================
const normalizeDate = (date) => {
  if (!date) return null;
  const value = String(date).substring(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return value;
};

const getDateString = (date) => {
  if (!date) return null;
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return null;
  return parsedDate.toISOString().split("T")[0];
};

const buildDateFromConfig = (config) => {
  if (!config) return null;
  return getDateString(config.drawDate);
};

// =====================================================
// GET LAST N DIGITS
// =====================================================
const getLastNDigits = (number, n) => {
  const str = String(number).trim().toUpperCase();
  return str.slice(-n);
};

// =====================================================
// CHECK PRIZE — MULTI WINNING NUMBERS
// 1st = 1 number (exact 8-digit)
// 2nd = 10 numbers (last 5 digits)
// 3rd = 10 numbers (last 4 digits)
// 4th = 10 numbers (last 4 digits)
// 5th = 100 numbers (last 4 digits)
// =====================================================
const getPrize = (userNumber, winningNumbers) => {
  const user = String(userNumber).trim().toUpperCase();

  // Normalize input — support legacy single string
  let wn = winningNumbers;
  if (typeof wn === "string") {
    wn = { first: wn, second: [], third: [], fourth: [], fifth: [] };
  }
  if (!wn || typeof wn !== "object") return null;

  // 1ST PRIZE — EXACT 8-DIGIT MATCH
  if (wn.first) {
    const firstNum = String(wn.first).trim().toUpperCase();
    if (user === firstNum) {
      return { prize: "1st", matchedDigits: 8, matchedNumber: firstNum };
    }
  }

  // 2ND PRIZE — LAST 5 DIGITS
  if (Array.isArray(wn.second)) {
    const userLast5 = getLastNDigits(user, 5);
    for (const num of wn.second) {
      if (!num) continue;
      if (getLastNDigits(num, 5) === userLast5) {
        return {
          prize: "2nd",
          matchedDigits: 5,
          matchedNumber: String(num).trim().toUpperCase(),
        };
      }
    }
  }

  // 3RD PRIZE — LAST 4 DIGITS
  if (Array.isArray(wn.third)) {
    const userLast4 = getLastNDigits(user, 4);
    for (const num of wn.third) {
      if (!num) continue;
      if (getLastNDigits(num, 4) === userLast4) {
        return {
          prize: "3rd",
          matchedDigits: 4,
          matchedNumber: String(num).trim().toUpperCase(),
        };
      }
    }
  }

  // 4TH PRIZE — LAST 4 DIGITS
  if (Array.isArray(wn.fourth)) {
    const userLast4 = getLastNDigits(user, 4);
    for (const num of wn.fourth) {
      if (!num) continue;
      if (getLastNDigits(num, 4) === userLast4) {
        return {
          prize: "4th",
          matchedDigits: 4,
          matchedNumber: String(num).trim().toUpperCase(),
        };
      }
    }
  }

  // 5TH PRIZE — LAST 4 DIGITS
  if (Array.isArray(wn.fifth)) {
    const userLast4 = getLastNDigits(user, 4);
    for (const num of wn.fifth) {
      if (!num) continue;
      if (getLastNDigits(num, 4) === userLast4) {
        return {
          prize: "5th",
          matchedDigits: 4,
          matchedNumber: String(num).trim().toUpperCase(),
        };
      }
    }
  }

  return null;
};

// =====================================================
// GET PRIZE AMOUNTS
// =====================================================
const getPrizeAmounts = (config) => {
  const prizeObject = config?.prizes || config?.prize || {};
  return {
    first: Number(prizeObject.first ?? prizeObject.firstPrize ?? 0) || 0,
    second: Number(prizeObject.second ?? prizeObject.secondPrize ?? 0) || 0,
    third: Number(prizeObject.third ?? prizeObject.thirdPrize ?? 0) || 0,
    fourth: Number(prizeObject.fourth ?? prizeObject.fourthPrize ?? 0) || 0,
    fifth: Number(prizeObject.fifth ?? prizeObject.fifthPrize ?? 0) || 0,
  };
};

const getAmountByPrizeType = (prizeType, prizeAmounts) => {
  if (prizeType === "1st") return Number(prizeAmounts.first) || 0;
  if (prizeType === "2nd") return Number(prizeAmounts.second) || 0;
  if (prizeType === "3rd") return Number(prizeAmounts.third) || 0;
  if (prizeType === "4th") return Number(prizeAmounts.fourth) || 0;
  if (prizeType === "5th") return Number(prizeAmounts.fifth) || 0;
  return 0;
};

const buildUserPrizeObject = (prizeType, prizeAmounts) => {
  return {
    first: prizeType === "1st" ? prizeAmounts.first : 0,
    second: prizeType === "2nd" ? prizeAmounts.second : 0,
    third: prizeType === "3rd" ? prizeAmounts.third : 0,
    fourth: prizeType === "4th" ? prizeAmounts.fourth : 0,
    fifth: prizeType === "5th" ? prizeAmounts.fifth : 0,
  };
};

// =====================================================
// VALIDATE WINNING NUMBERS OBJECT
// =====================================================
const validateWinningNumbers = (winningNumbers) => {
  const errors = [];

  if (!winningNumbers || typeof winningNumbers !== "object") {
    return ["winningNumbers object is required"];
  }

  // First: single 8-char
  if (winningNumbers.first !== undefined && winningNumbers.first !== null && winningNumbers.first !== "") {
    if (!validateLotteryNumber(winningNumbers.first)) {
      errors.push("1st prize winning number must be 8 alphanumeric characters");
    }
  }

  // Second: array of 10 (last 5 digit)
  if (winningNumbers.second !== undefined) {
    if (!Array.isArray(winningNumbers.second)) {
      errors.push("2nd prize winningNumbers.second must be an array");
    } else if (winningNumbers.second.length > PRIZE_COUNTS.second) {
      errors.push(`2nd prize allows max ${PRIZE_COUNTS.second} numbers`);
    } else {
      for (const n of winningNumbers.second) {
        if (n && !validateLotteryNumber(n)) {
          errors.push(`Invalid 2nd prize number: ${n}`);
        }
      }
    }
  }

  // Third: array of 10 (last 4 digit)
  if (winningNumbers.third !== undefined) {
    if (!Array.isArray(winningNumbers.third)) {
      errors.push("3rd prize winningNumbers.third must be an array");
    } else if (winningNumbers.third.length > PRIZE_COUNTS.third) {
      errors.push(`3rd prize allows max ${PRIZE_COUNTS.third} numbers`);
    } else {
      for (const n of winningNumbers.third) {
        if (n && !validateLotteryNumber(n)) {
          errors.push(`Invalid 3rd prize number: ${n}`);
        }
      }
    }
  }

  // Fourth: array of 10 (last 4 digit)
  if (winningNumbers.fourth !== undefined) {
    if (!Array.isArray(winningNumbers.fourth)) {
      errors.push("4th prize winningNumbers.fourth must be an array");
    } else if (winningNumbers.fourth.length > PRIZE_COUNTS.fourth) {
      errors.push(`4th prize allows max ${PRIZE_COUNTS.fourth} numbers`);
    } else {
      for (const n of winningNumbers.fourth) {
        if (n && !validateLotteryNumber(n)) {
          errors.push(`Invalid 4th prize number: ${n}`);
        }
      }
    }
  }

  // Fifth: array of 100 (last 4 digit)
  if (winningNumbers.fifth !== undefined) {
    if (!Array.isArray(winningNumbers.fifth)) {
      errors.push("5th prize winningNumbers.fifth must be an array");
    } else if (winningNumbers.fifth.length > PRIZE_COUNTS.fifth) {
      errors.push(`5th prize allows max ${PRIZE_COUNTS.fifth} numbers`);
    } else {
      for (const n of winningNumbers.fifth) {
        if (n && !validateLotteryNumber(n)) {
          errors.push(`Invalid 5th prize number: ${n}`);
        }
      }
    }
  }

  return errors;
};

// =====================================================
// NORMALIZE WINNING NUMBERS
// =====================================================
const normalizeWinningNumbers = (winningNumbers) => {
  const src = typeof winningNumbers === "object" && winningNumbers !== null ? winningNumbers : {};

  return {
    first: src.first ? String(src.first).trim().toUpperCase() : null,
    second: Array.isArray(src.second)
      ? src.second.filter(Boolean).map((n) => String(n).trim().toUpperCase())
      : [],
    third: Array.isArray(src.third)
      ? src.third.filter(Boolean).map((n) => String(n).trim().toUpperCase())
      : [],
    fourth: Array.isArray(src.fourth)
      ? src.fourth.filter(Boolean).map((n) => String(n).trim().toUpperCase())
      : [],
    fifth: Array.isArray(src.fifth)
      ? src.fifth.filter(Boolean).map((n) => String(n).trim().toUpperCase())
      : [],
  };
};

// =====================================================
// WALLET HELPERS
// =====================================================
const findUserForWallet = async (userId) => {
  if (!userId) return null;
  const stringUserId = String(userId);
  let user = await User.findOne({ uuid: stringUserId });
  if (user) return user;
  if (mongoose.Types.ObjectId.isValid(stringUserId)) {
    user = await User.findById(stringUserId);
  }
  return user;
};

const addPrizeToWallet = async (userId, amount) => {
  const prizeAmount = Number(amount) || 0;
  if (!userId || prizeAmount <= 0) return null;
  const user = await findUserForWallet(userId);
  if (!user) throw new Error(`User not found for wallet prize: ${userId}`);
  return await User.findByIdAndUpdate(
    user._id,
    { $inc: { wallet: prizeAmount } },
    { new: true }
  );
};

const removePrizeFromWallet = async (userId, amount) => {
  const prizeAmount = Number(amount) || 0;
  if (!userId || prizeAmount <= 0) return null;
  const user = await findUserForWallet(userId);
  if (!user) throw new Error(`User not found for wallet adjustment: ${userId}`);
  const currentWallet = Number(user.wallet) || 0;
  if (currentWallet < prizeAmount) {
    throw new Error(
      `Insufficient wallet balance while reversing prize for user: ${userId}`
    );
  }
  return await User.findByIdAndUpdate(
    user._id,
    { $inc: { wallet: -prizeAmount } },
    { new: true }
  );
};

// =====================================================
// PROCESS USERS FOR DATE
// =====================================================
const processUsersForDate = ({
  config,
  selectedDate,
  winningNumbers,
  prizeAmounts,
}) => {
  const winners = [];
  let firstPrizeCount = 0;
  let secondPrizeCount = 0;
  let thirdPrizeCount = 0;
  let fourthPrizeCount = 0;
  let fifthPrizeCount = 0;
  let lostCount = 0;

  const emptyResult = {
    winners,
    totalUsers: 0,
    firstPrizeCount: 0,
    secondPrizeCount: 0,
    thirdPrizeCount: 0,
    fourthPrizeCount: 0,
    fifthPrizeCount: 0,
    lostCount: 0,
  };

  if (!Array.isArray(config.users)) return emptyResult;

  const dateUsers = config.users.filter(
    (user) => getDateString(user.entryDate) === selectedDate
  );

  for (const user of dateUsers) {
    const userNumber = String(user.number || "").trim().toUpperCase();

    if (!validateLotteryNumber(userNumber)) {
      user.status = "lost";
      user.prizeType = null;
      user.prize = { first: 0, second: 0, third: 0, fourth: 0, fifth: 0 };
      lostCount++;
      continue;
    }

    const match = getPrize(userNumber, winningNumbers);

    if (!match) {
      user.status = "lost";
      user.prizeType = null;
      user.prize = { first: 0, second: 0, third: 0, fourth: 0, fifth: 0 };
      lostCount++;
      continue;
    }

    user.status = "win";
    user.prizeType = match.prize;
    user.prize = buildUserPrizeObject(match.prize, prizeAmounts);

    if (match.prize === "1st") firstPrizeCount++;
    if (match.prize === "2nd") secondPrizeCount++;
    if (match.prize === "3rd") thirdPrizeCount++;
    if (match.prize === "4th") fourthPrizeCount++;
    if (match.prize === "5th") fifthPrizeCount++;

    const prizeAmount = getAmountByPrizeType(match.prize, prizeAmounts);

    winners.push({
      userId: user.userId,
      userNumber: userNumber,
      matchedNumber: match.matchedNumber,
      amount: Number(user.amount) || 0,
      prizeType: match.prize,
      matchedDigits: match.matchedDigits,
      prize: buildUserPrizeObject(match.prize, prizeAmounts),
      prizeAmount: prizeAmount,
    });
  }

  return {
    winners,
    totalUsers: dateUsers.length,
    firstPrizeCount,
    secondPrizeCount,
    thirdPrizeCount,
    fourthPrizeCount,
    fifthPrizeCount,
    lostCount,
  };
};

// =====================================================
// ROLLBACK HELPERS
// =====================================================
const rollbackCredits = async (credits) => {
  for (const c of credits) {
    try {
      await removePrizeFromWallet(c.userId, c.amount);
    } catch (e) {
      console.error("Wallet Rollback Error:", e);
    }
  }
};

const restoreReversals = async (reversals) => {
  for (const r of reversals) {
    try {
      await addPrizeToWallet(r.userId, r.amount);
    } catch (e) {
      console.error("Wallet Restore Error:", e);
    }
  }
};

// =====================================================
// CREATE RESULT
// POST /
// =====================================================
const createResult = async (req, res) => {
  try {
    const { lotteryConfigId, date, winningNumbers } = req.body;
    const adminId = req.user?.uuid || req.user?.id || req.user?._id;

    if (!adminId) {
      return res
        .status(401)
        .json({ success: false, message: "Admin ID not found in token" });
    }

    if (!lotteryConfigId || !mongoose.Types.ObjectId.isValid(lotteryConfigId)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid lotteryConfigId is required" });
    }

    const selectedDate = normalizeDate(date);
    if (!selectedDate) {
      return res.status(400).json({
        success: false,
        message: "Valid date is required. Format: YYYY-MM-DD",
      });
    }

    if (!winningNumbers || typeof winningNumbers !== "object") {
      return res.status(400).json({
        success: false,
        message:
          "winningNumbers object is required (first, second[], third[], fourth[], fifth[])",
      });
    }

    const validationErrors = validateWinningNumbers(winningNumbers);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid winning numbers",
        errors: validationErrors,
      });
    }

    const finalWinningNumbers = normalizeWinningNumbers(winningNumbers);

    const config = await LotteryConfig.findById(lotteryConfigId);
    if (!config) {
      return res
        .status(404)
        .json({ success: false, message: "Lottery config not found" });
    }

    const configDateStr = buildDateFromConfig(config);
    if (configDateStr && configDateStr !== selectedDate) {
      return res.status(400).json({
        success: false,
        message: `Date mismatch. Config drawDate is ${configDateStr}, but you sent ${selectedDate}`,
      });
    }

    const dateUsers = Array.isArray(config.users)
      ? config.users.filter(
          (user) => getDateString(user.entryDate) === selectedDate
        )
      : [];

    if (dateUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No user entries found for date ${selectedDate}`,
      });
    }

    const existingResult = await LotteryResult.findOne({
      lotteryConfigId,
      date: selectedDate,
    });

    if (existingResult) {
      return res.status(409).json({
        success: false,
        message: "Result already exists for this date. Use update API.",
        resultId: existingResult._id,
      });
    }

    const prizeAmounts = getPrizeAmounts(config);
    const processed = processUsersForDate({
      config,
      selectedDate,
      winningNumbers: finalWinningNumbers,
      prizeAmounts,
    });

    // WALLET CREDITS
    const walletCredits = [];
    try {
      for (const winner of processed.winners) {
        const prizeAmount = getAmountByPrizeType(winner.prizeType, prizeAmounts);
        if (winner.userId && prizeAmount > 0) {
          const updatedUser = await addPrizeToWallet(winner.userId, prizeAmount);
          walletCredits.push({
            userId: winner.userId,
            prize: winner.prizeType,
            amount: prizeAmount,
            wallet: Number(updatedUser?.wallet) || 0,
          });
        }
      }
    } catch (walletError) {
      console.error("Wallet Credit Error:", walletError);
      await rollbackCredits(walletCredits);
      return res.status(500).json({
        success: false,
        message: "Result was not created because wallet prize credit failed",
        error: walletError.message,
      });
    }

    let result;
    try {
      result = await LotteryResult.create({
        lotteryConfigId,
        date: selectedDate,
        winningNumbers: finalWinningNumbers,
        winningNumber: finalWinningNumbers.first || null, // legacy
        winners: processed.winners,
        isPublished: false,
        createdBy: adminId,
      });
    } catch (resultError) {
      console.error("LotteryResult Create Error:", resultError);
      await rollbackCredits(walletCredits);
      return res.status(500).json({
        success: false,
        message: "Result creation failed and wallet credits were rolled back",
        error: resultError.message,
      });
    }

    config.markModified("users");
    await config.save();

    return res.status(201).json({
      success: true,
      message:
        "Lottery result created and winning prizes added to wallets successfully",
      result,
      walletCredits,
      summary: {
        date: selectedDate,
        winningNumbers: finalWinningNumbers,
        totalUsers: processed.totalUsers,
        firstPrize: processed.firstPrizeCount,
        secondPrize: processed.secondPrizeCount,
        thirdPrize: processed.thirdPrizeCount,
        fourthPrize: processed.fourthPrizeCount,
        fifthPrize: processed.fifthPrizeCount,
        lost: processed.lostCount,
        totalPrizePaid: walletCredits.reduce(
          (t, i) => t + Number(i.amount || 0),
          0
        ),
      },
    });
  } catch (error) {
    console.error("Create Result Error:", error);
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Result already exists for this date" });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL RESULTS
// =====================================================
const getAllResults = async (req, res) => {
  try {
    const results = await LotteryResult.find()
      .populate(
        "lotteryConfigId",
        "marketName drawDate drawTime month year isActive"
      )
      .sort({ date: -1, createdAt: -1 });

    return res
      .status(200)
      .json({ success: true, count: results.length, results });
  } catch (error) {
    console.error("Get All Results Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// GET UNBET NUMBERS
// =====================================================
const getUnbetLotteryNumbers = async (req, res) => {
  const startTime = Date.now();
  try {
    const { lotteryConfigId } = req.query;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Database not connected. Please try again in a moment.",
      });
    }

    const lotteryid = String(lotteryConfigId || "").trim();
    if (!lotteryid) {
      return res
        .status(400)
        .json({ success: false, message: "lotteryConfigId is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(lotteryid)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid lotteryConfigId" });
    }

    const lotteryConfig = await LotteryConfig.findOne({ _id: lotteryid })
      .maxTimeMS(8000)
      .lean();

    if (!lotteryConfig) {
      return res
        .status(404)
        .json({ success: false, message: "Lottery configuration not found" });
    }

    const allNumbers = Array.isArray(lotteryConfig.numbers)
      ? lotteryConfig.numbers
          .map((item) => {
            if (typeof item === "string") return item.trim();
            if (item && typeof item === "object")
              return String(item.number ?? "").trim();
            if (typeof item === "number") return String(item).trim();
            return "";
          })
          .filter(Boolean)
      : [];

    const uniqueNumbers = [...new Set(allNumbers)];

    const entries = await LotteryConfig.find({
      lotteryConfigId: lotteryConfig._id,
    })
      .select("number -_id")
      .maxTimeMS(8000)
      .lean();

    const bettedNumbers = new Set();
    for (const entry of entries) {
      if (entry && entry.number !== undefined && entry.number !== null) {
        const n = String(entry.number).trim();
        if (n) bettedNumbers.add(n);
      }
    }

    const unbetNumbers = uniqueNumbers.filter(
      (number) => !bettedNumbers.has(number)
    );

    return res.status(200).json({
      success: true,
      message: "Unbet lottery numbers fetched successfully",
      lotteryConfigId: lotteryConfig._id,
      lotteryName: lotteryConfig.marketName || null,
      drawDate: lotteryConfig.drawDate || null,
      drawTime: lotteryConfig.drawTime || null,
      totalNumbers: uniqueNumbers.length,
      totalBettedNumbers: bettedNumbers.size,
      totalUnbetNumbers: unbetNumbers.length,
      numbers: unbetNumbers,
      elapsedMs: Date.now() - startTime,
    });
  } catch (error) {
    console.error("getUnbetLotteryNumbers ERROR:", error);
    if (
      error.name === "MongooseError" ||
      error.message?.includes("maxTimeMS")
    ) {
      return res.status(504).json({
        success: false,
        message: "Database query timed out. Please try again.",
      });
    }
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to fetch unbet lottery numbers",
      error: error.message,
    });
  }
};

// =====================================================
// GET RESULT BY ID
// =====================================================
const getResultById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid result ID" });
    }
    const result = await LotteryResult.findById(id).populate(
      "lotteryConfigId",
      "marketName drawDate drawTime month year isActive"
    );
    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Result not found" });
    }
    return res.status(200).json({ success: true, result });
  } catch (error) {
    console.error("Get Result Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// PUBLISH / UNPUBLISH
// =====================================================
const publishResult = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid result ID" });
    }
    const result = await LotteryResult.findByIdAndUpdate(
      id,
      { $set: { isPublished: true } },
      { new: true, runValidators: true }
    );
    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Result not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Result published successfully",
      result,
    });
  } catch (error) {
    console.error("Publish Result Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error", error: error.message });
  }
};

const unpublishResult = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid result ID" });
    }
    const result = await LotteryResult.findByIdAndUpdate(
      id,
      { $set: { isPublished: false } },
      { new: true, runValidators: true }
    );
    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Result not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Result unpublished successfully",
      result,
    });
  } catch (error) {
    console.error("Unpublish Result Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error", error: error.message });
  }
};

// =====================================================
// UPDATE RESULT
// PATCH /:id
// =====================================================
const updateResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { winningNumbers } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid result ID" });
    }

    if (!winningNumbers || typeof winningNumbers !== "object") {
      return res.status(400).json({
        success: false,
        message: "winningNumbers object is required",
      });
    }

    const validationErrors = validateWinningNumbers(winningNumbers);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid winning numbers",
        errors: validationErrors,
      });
    }

    const finalWinningNumbers = normalizeWinningNumbers(winningNumbers);

    const result = await LotteryResult.findById(id);
    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Result not found" });
    }

    if (result.isPublished) {
      return res.status(400).json({
        success: false,
        message: "Published result cannot be edited. Unpublish it first.",
      });
    }

    const config = await LotteryConfig.findById(result.lotteryConfigId);
    if (!config) {
      return res
        .status(404)
        .json({ success: false, message: "Lottery config not found" });
    }

    const selectedDate = getDateString(result.date);
    if (!selectedDate) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid result date" });
    }

    const dateUsers = Array.isArray(config.users)
      ? config.users.filter(
          (user) => getDateString(user.entryDate) === selectedDate
        )
      : [];

    if (dateUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No user entries found for date ${selectedDate}`,
      });
    }

    const prizeAmounts = getPrizeAmounts(config);

    // REMOVE OLD PRIZES
    const walletReversals = [];
    try {
      if (Array.isArray(result.winners)) {
        for (const oldWinner of result.winners) {
          const oldPrizeType =
            oldWinner.prizeType ||
            (typeof oldWinner.prize === "string" ? oldWinner.prize : null);

          const oldPrizeAmount =
            oldWinner.prizeAmount !== undefined
              ? Number(oldWinner.prizeAmount) || 0
              : getAmountByPrizeType(oldPrizeType, prizeAmounts);

          if (oldWinner.userId && oldPrizeAmount > 0) {
            await removePrizeFromWallet(oldWinner.userId, oldPrizeAmount);
            walletReversals.push({
              userId: oldWinner.userId,
              amount: oldPrizeAmount,
            });
          }
        }
      }
    } catch (walletError) {
      console.error("Old Wallet Reversal Error:", walletError);
      await restoreReversals(walletReversals);
      return res.status(500).json({
        success: false,
        message:
          "Result update stopped because old wallet prizes could not be reversed",
        error: walletError.message,
      });
    }

    // RECALCULATE
    const processed = processUsersForDate({
      config,
      selectedDate,
      winningNumbers: finalWinningNumbers,
      prizeAmounts,
    });

    // ADD NEW PRIZES
    const walletCredits = [];
    try {
      for (const winner of processed.winners) {
        const newPrizeAmount = getAmountByPrizeType(
          winner.prizeType,
          prizeAmounts
        );
        if (winner.userId && newPrizeAmount > 0) {
          await addPrizeToWallet(winner.userId, newPrizeAmount);
          walletCredits.push({
            userId: winner.userId,
            amount: newPrizeAmount,
          });
        }
      }
    } catch (walletError) {
      console.error("New Wallet Credit Error:", walletError);
      await rollbackCredits(walletCredits);
      await restoreReversals(walletReversals);
      return res.status(500).json({
        success: false,
        message: "Result update failed and wallet changes were rolled back",
        error: walletError.message,
      });
    }

    // UPDATE RESULT
    result.winningNumbers = finalWinningNumbers;
    result.winningNumber = finalWinningNumbers.first || null; // legacy
    result.winners = processed.winners;
    await result.save();

    config.markModified("users");
    await config.save();

    return res.status(200).json({
      success: true,
      message: "Result updated and wallet prizes recalculated successfully",
      result,
      walletReversals,
      walletCredits,
      summary: {
        date: selectedDate,
        winningNumbers: finalWinningNumbers,
        totalUsers: processed.totalUsers,
        firstPrize: processed.firstPrizeCount,
        secondPrize: processed.secondPrizeCount,
        thirdPrize: processed.thirdPrizeCount,
        fourthPrize: processed.fourthPrizeCount,
        fifthPrize: processed.fifthPrizeCount,
        lost: processed.lostCount,
        totalPrizePaid: walletCredits.reduce(
          (t, i) => t + Number(i.amount || 0),
          0
        ),
      },
    });
  } catch (error) {
    console.error("Update Result Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error", error: error.message });
  }
};

// =====================================================
// DELETE RESULT
// =====================================================
const deleteResult = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid result ID" });
    }
    const result = await LotteryResult.findById(id);
    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Result not found" });
    }
    if (result.isPublished) {
      return res.status(400).json({
        success: false,
        message: "Published result cannot be deleted",
      });
    }
    await LotteryResult.findByIdAndDelete(id);
    return res
      .status(200)
      .json({ success: true, message: "Result deleted successfully" });
  } catch (error) {
    console.error("Delete Result Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// =====================================================
// CHECK NUMBER
// POST /check-number
// =====================================================
const checkNumber = async (req, res) => {
  try {
    const rawNumber = req.body.userNumber || req.body.ticketNumber;
    const { winningNumbers, winningNumber, date, lotteryConfigId, type } =
      req.body;

    if (!rawNumber) {
      return res
        .status(400)
        .json({ success: false, message: "Ticket number is required" });
    }

    const cleanUserNumber = String(rawNumber).trim().toUpperCase();

    if (!validateLotteryNumber(cleanUserNumber)) {
      return res.status(400).json({
        success: false,
        message:
          "Ticket number must be 8 alphanumeric characters (e.g. 10F68057)",
      });
    }

    // CASE 1: Direct compare — winningNumbers provided
    if (winningNumbers && typeof winningNumbers === "object") {
      const validationErrors = validateWinningNumbers(winningNumbers);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid winning numbers",
          errors: validationErrors,
        });
      }
      const finalWinningNumbers = normalizeWinningNumbers(winningNumbers);
      const match = getPrize(cleanUserNumber, finalWinningNumbers);

      return res.status(200).json({
        success: true,
        userNumber: cleanUserNumber,
        ticketNumber: cleanUserNumber,
        winningNumbers: finalWinningNumbers,
        winner: match !== null,
        status: match !== null ? "win" : "loss",
        result: match,
        prizeType: match?.prize || null,
        prizeLabel: match ? `${match.prize} Prize` : null,
      });
    }

    // CASE 1b: Legacy single winningNumber
    if (winningNumber) {
      const cleanWinningNumber = String(winningNumber).trim().toUpperCase();
      if (!validateLotteryNumber(cleanWinningNumber)) {
        return res.status(400).json({
          success: false,
          message: "Winning number must be 8 alphanumeric characters",
        });
      }
      const match = getPrize(cleanUserNumber, {
        first: cleanWinningNumber,
        second: [],
        third: [],
        fourth: [],
        fifth: [],
      });
      return res.status(200).json({
        success: true,
        userNumber: cleanUserNumber,
        ticketNumber: cleanUserNumber,
        winningNumber: cleanWinningNumber,
        winner: match !== null,
        status: match !== null ? "win" : "loss",
        result: match,
        prizeType: match?.prize || null,
        prizeLabel: match ? `${match.prize} Prize` : null,
      });
    }

    // CASE 2: Lookup published results
    const isFestival = String(type || "").toLowerCase() === "festival";

    const filter = { isPublished: true };
    if (date) {
      const parsedDate = normalizeDate(date);
      if (parsedDate) filter.date = parsedDate;
    }
    if (lotteryConfigId && mongoose.Types.ObjectId.isValid(lotteryConfigId)) {
      filter.lotteryConfigId = lotteryConfigId;
    }

    let results = [];
    if (isFestival) {
      const FestivalResult =
        mongoose.models.festivalresult || require("../models/festivelresult");
      results = await FestivalResult.find(filter)
        .populate("lotteryConfigId")
        .sort({ date: -1, createdAt: -1 });
    } else {
      results = await LotteryResult.find(filter)
        .populate("lotteryConfigId")
        .sort({ date: -1, createdAt: -1 });

      if (results.length === 0 && !type) {
        try {
          const FestivalResult =
            mongoose.models.festivalresult ||
            require("../models/festivelresult");
          results = await FestivalResult.find(filter)
            .populate("lotteryConfigId")
            .sort({ date: -1, createdAt: -1 });
        } catch (e) {
          /* ignore */
        }
      }
    }

    for (const resDoc of results) {
      // Support both new (object) and legacy (string) winningNumber
      let wNumbers = resDoc.winningNumbers;
      if (!wNumbers || typeof wNumbers !== "object") {
        wNumbers = {
          first: resDoc.winningNumber || null,
          second: [],
          third: [],
          fourth: [],
          fifth: [],
        };
      }

      const match = getPrize(cleanUserNumber, wNumbers);
      if (!match) continue;

      const config = resDoc.lotteryConfigId || {};
      const prizeAmounts = getPrizeAmounts(config);
      const prizeAmount = getAmountByPrizeType(match.prize, prizeAmounts);

      const winnerRecord = Array.isArray(resDoc.winners)
        ? resDoc.winners.find(
            (w) => String(w.userNumber).toUpperCase() === cleanUserNumber
          )
        : null;

      const finalAmount = winnerRecord?.prizeAmount || prizeAmount;

      const drawDateStr = resDoc.date
        ? new Date(resDoc.date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—";

      const drawDayStr = resDoc.date
        ? `(${new Date(resDoc.date).toLocaleDateString("en-IN", {
            weekday: "long",
          })})`
        : "";

      return res.status(200).json({
        success: true,
        winner: true,
        status: "win",
        userNumber: cleanUserNumber,
        ticketNumber: cleanUserNumber,
        winningNumber: match.matchedNumber,
        prizeType: match.prize,
        prizeLabel: `${match.prize} Prize`,
        prizeAmount: finalAmount
          ? `₹${Number(finalAmount).toLocaleString("en-IN")}`
          : "₹0",
        matchedDigits: match.matchedDigits,
        matchedNumber: match.matchedNumber,
        drawDate: drawDateStr,
        drawDay: drawDayStr,
        drawTime: config.drawTime || "8:00 PM",
        lotteryName:
          config.marketName ||
          (isFestival ? "Dear Festival Lottery" : "Dear Daily Lottery"),
        result: match,
      });
    }

    // No match
    const latest = results[0] || null;
    const latestConfig = latest?.lotteryConfigId || {};
    const latestDateStr = latest?.date
      ? new Date(latest.date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";
    const latestDayStr = latest?.date
      ? `(${new Date(latest.date).toLocaleDateString("en-IN", {
          weekday: "long",
        })})`
      : "";

    return res.status(200).json({
      success: true,
      winner: false,
      status: "loss",
      userNumber: cleanUserNumber,
      ticketNumber: cleanUserNumber,
      winningNumber: latest?.winningNumber || null,
      winningNumbers: latest?.winningNumbers || null,
      drawDate: latestDateStr,
      drawDay: latestDayStr,
      drawTime: latestConfig?.drawTime || "8:00 PM",
      lotteryName:
        latestConfig?.marketName ||
        (isFestival ? "Dear Festival Lottery" : "Dear Daily Lottery"),
      message:
        "Better luck next time! This ticket number is not among the winning numbers for published draws.",
    });
  } catch (error) {
    console.error("Check Number Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error", error: error.message });
  }
};

// =====================================================
// GET PUBLISHED RESULTS
// =====================================================
const getPublishedResults = async (req, res) => {
  try {
    const results = await LotteryResult.find({ isPublished: true })
      .populate(
        "lotteryConfigId",
        "marketName drawDate drawTime month year isActive"
      )
      .sort({ date: -1, createdAt: -1 });
    return res
      .status(200)
      .json({ success: true, count: results.length, results });
  } catch (error) {
    console.error("Get Published Results Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error", error: error.message });
  }
};

// =====================================================
// GET PUBLISHED RESULT BY DATE
// =====================================================
const getPublishedResultByDate = async (req, res) => {
  try {
    const selectedDate = normalizeDate(req.params.date);
    if (!selectedDate) {
      return res.status(400).json({
        success: false,
        message: "Valid date is required. Format: YYYY-MM-DD",
      });
    }
    const result = await LotteryResult.findOne({
      date: selectedDate,
      isPublished: true,
    }).populate(
      "lotteryConfigId",
      "marketName drawDate drawTime month year isActive"
    );
    if (!result) {
      return res.status(404).json({
        success: false,
        message: `Published result not found for ${selectedDate}`,
      });
    }
    return res.status(200).json({ success: true, result });
  } catch (error) {
    console.error("Get Published Result By Date Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error", error: error.message });
  }
};

// =====================================================
// EXPORTS
// =====================================================
module.exports = {
  createResult,
  getAllResults,
  getResultById,
  publishResult,
  unpublishResult,
  updateResult,
  deleteResult,
  checkNumber,
  getPublishedResults,
  getPublishedResultByDate,
  getPrize,
  getUnbetLotteryNumbers,
  validateLotteryNumber,
  validateSixDigitNumber,
  PRIZE_COUNTS,
  PRIZE_DIGITS,
};