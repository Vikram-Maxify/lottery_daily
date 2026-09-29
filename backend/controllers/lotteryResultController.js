const mongoose = require("mongoose");

const LotteryResult = require("../models/LotteryResult");
const LotteryConfig = require("../models/LotteryConfig");
const User = require("../models/userModel");

// =====================================================
// VALIDATE 6 DIGIT NUMBER
// =====================================================

const validateSixDigitNumber = (number) => {
  if (number === undefined || number === null) {
    return false;
  }
  return /^\d{6}$/.test(String(number).trim());
};

// =====================================================
// NORMALIZE DATE (YYYY-MM-DD)
// =====================================================

const normalizeDate = (date) => {
  if (!date) return null;

  const value = String(date).substring(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  return value;
};

// =====================================================
// DATE STRING (YYYY-MM-DD)
// =====================================================

const getDateString = (date) => {
  if (!date) return null;

  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  const parsedDate = new Date(date);

  if (isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString().split("T")[0];
};

// =====================================================
// BUILD DATE STRING FROM CONFIG
// ✅ FIXED: `drawDate` use karo, `date` nahi
// =====================================================

const buildDateFromConfig = (config) => {
  if (!config) return null;

  // ✅ drawDate already ek Date object hai, seedha string me convert karo
  const dateStr = getDateString(config.drawDate);

  if (!dateStr) return null;

  return dateStr;
};

// =====================================================
// CHECK PRIZE
// =====================================================

const getPrize = (userNumber, winningNumber) => {
  const user = String(userNumber).trim();
  const winning = String(winningNumber).trim();

  // 1ST PRIZE — EXACT 6 DIGITS
  if (user === winning) {
    return { prize: "1st", matchedDigits: 6 };
  }

  // 2ND PRIZE — FIRST 5 OR LAST 5
  const firstFiveMatch = user.substring(0, 5) === winning.substring(0, 5);
  const lastFiveMatch = user.substring(1, 6) === winning.substring(1, 6);

  if (firstFiveMatch || lastFiveMatch) {
    return { prize: "2nd", matchedDigits: 5 };
  }

  // 3RD PRIZE — FIRST 4 OR MIDDLE 4 OR LAST 4
  const firstFourMatch = user.substring(0, 4) === winning.substring(0, 4);
  const middleFourMatch = user.substring(1, 5) === winning.substring(1, 5);
  const lastFourMatch = user.substring(2, 6) === winning.substring(2, 6);

  if (firstFourMatch || middleFourMatch || lastFourMatch) {
    return { prize: "3rd", matchedDigits: 4 };
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
  };
};

// =====================================================
// GET PRIZE AMOUNT BY TYPE
// =====================================================

const getAmountByPrizeType = (prizeType, prizeAmounts) => {
  if (prizeType === "1st") return Number(prizeAmounts.first) || 0;
  if (prizeType === "2nd") return Number(prizeAmounts.second) || 0;
  if (prizeType === "3rd") return Number(prizeAmounts.third) || 0;
  return 0;
};

// =====================================================
// BUILD USER PRIZE OBJECT
// =====================================================

const buildUserPrizeObject = (prizeType, prizeAmounts) => {
  return {
    first: prizeType === "1st" ? prizeAmounts.first : 0,
    second: prizeType === "2nd" ? prizeAmounts.second : 0,
    third: prizeType === "3rd" ? prizeAmounts.third : 0,
  };
};

// =====================================================
// FIND USER FOR WALLET
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

// =====================================================
// ADD PRIZE TO USER WALLET
// =====================================================

const addPrizeToWallet = async (userId, amount) => {
  const prizeAmount = Number(amount) || 0;

  if (!userId || prizeAmount <= 0) return null;

  const user = await findUserForWallet(userId);
  if (!user) {
    throw new Error(`User not found for wallet prize: ${userId}`);
  }

  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    { $inc: { wallet: prizeAmount } },
    { new: true }
  );

  return updatedUser;
};

// =====================================================
// REMOVE PRIZE FROM USER WALLET
// =====================================================

const removePrizeFromWallet = async (userId, amount) => {
  const prizeAmount = Number(amount) || 0;

  if (!userId || prizeAmount <= 0) return null;

  const user = await findUserForWallet(userId);
  if (!user) {
    throw new Error(`User not found for wallet adjustment: ${userId}`);
  }

  const currentWallet = Number(user.wallet) || 0;
  if (currentWallet < prizeAmount) {
    throw new Error(
      `Insufficient wallet balance while reversing prize for user: ${userId}`
    );
  }

  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    { $inc: { wallet: -prizeAmount } },
    { new: true }
  );

  return updatedUser;
};

// =====================================================
// PROCESS USERS FOR DATE
// =====================================================

const processUsersForDate = ({
  config,
  selectedDate,
  winningNumber,
  prizeAmounts,
}) => {
  const winners = [];

  let firstPrizeCount = 0;
  let secondPrizeCount = 0;
  let thirdPrizeCount = 0;
  let lostCount = 0;

  if (!Array.isArray(config.users)) {
    return {
      winners,
      totalUsers: 0,
      firstPrizeCount: 0,
      secondPrizeCount: 0,
      thirdPrizeCount: 0,
      lostCount: 0,
    };
  }

  const dateUsers = config.users.filter((user) => {
    return getDateString(user.entryDate) === selectedDate;
  });

  for (const user of dateUsers) {
    const userNumber = String(user.number || "").trim();

    if (!validateSixDigitNumber(userNumber)) {
      user.status = "lost";
      user.prizeType = null;
      user.prize = { first: 0, second: 0, third: 0 };
      lostCount++;
      continue;
    }

    const match = getPrize(userNumber, winningNumber);

    if (!match) {
      user.status = "lost";
      user.prizeType = null;
      user.prize = { first: 0, second: 0, third: 0 };
      lostCount++;
      continue;
    }

    user.status = "win";
    user.prizeType = match.prize;
    user.prize = buildUserPrizeObject(match.prize, prizeAmounts);

    if (match.prize === "1st") firstPrizeCount++;
    if (match.prize === "2nd") secondPrizeCount++;
    if (match.prize === "3rd") thirdPrizeCount++;

    const prizeAmount = getAmountByPrizeType(match.prize, prizeAmounts);

    winners.push({
      userId: user.userId,
      userNumber: userNumber,
      amount: Number(user.amount) || 0,
      prizeType: match.prize,
      matchedDigits: match.matchedDigits,
      prize: match.prize,
      prizeAmount: prizeAmount,
    });
  }

  return {
    winners,
    totalUsers: dateUsers.length,
    firstPrizeCount,
    secondPrizeCount,
    thirdPrizeCount,
    lostCount,
  };
};

// =====================================================
// CREATE RESULT
// POST /
// =====================================================

const createResult = async (req, res) => {
  try {
    const { lotteryConfigId, date, winningNumber } = req.body;

    const adminId = req.user?.uuid || req.user?.id || req.user?._id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Admin ID not found in token",
      });
    }

    if (
      !lotteryConfigId ||
      !mongoose.Types.ObjectId.isValid(lotteryConfigId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid lotteryConfigId is required",
      });
    }

    const selectedDate = normalizeDate(date);
    if (!selectedDate) {
      return res.status(400).json({
        success: false,
        message: "Valid date is required. Format: YYYY-MM-DD",
      });
    }

    if (!validateSixDigitNumber(winningNumber)) {
      return res.status(400).json({
        success: false,
        message: "Winning number must contain exactly 6 digits",
      });
    }

    const finalWinningNumber = String(winningNumber).trim();

    const config = await LotteryConfig.findById(lotteryConfigId);
    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Lottery config not found",
      });
    }

    // ==========================================
    // SAFETY: Config drawDate aur selectedDate match karo
    // ==========================================
    const configDateStr = buildDateFromConfig(config);

    if (configDateStr && configDateStr !== selectedDate) {
      return res.status(400).json({
        success: false,
        message: `Date mismatch. Config drawDate is ${configDateStr}, but you sent ${selectedDate}`,
      });
    }

    // ==========================================
    // DATE USERS FILTER
    // ==========================================
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

    // ==========================================
    // EXISTING RESULT CHECK
    // ==========================================
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
      winningNumber: finalWinningNumber,
      prizeAmounts,
    });

    // ==========================================
    // WALLET CREDITS
    // ==========================================
    const walletCredits = [];

    try {
      for (const winner of processed.winners) {
        const prizeAmount = getAmountByPrizeType(
          winner.prizeType,
          prizeAmounts
        );

        if (winner.userId && prizeAmount > 0) {
          const updatedUser = await addPrizeToWallet(
            winner.userId,
            prizeAmount
          );

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

      for (const credited of walletCredits) {
        try {
          await removePrizeFromWallet(credited.userId, credited.amount);
        } catch (rollbackError) {
          console.error("Wallet Rollback Error:", rollbackError);
        }
      }

      return res.status(500).json({
        success: false,
        message:
          "Result was not created because wallet prize credit failed",
        error: walletError.message,
      });
    }

    config.markModified("users");
    await config.save();

    // ==========================================
    // CREATE RESULT
    // ==========================================
    let result;

    try {
      result = await LotteryResult.create({
        lotteryConfigId,
        date: selectedDate,
        winningNumber: finalWinningNumber,
        winners: processed.winners,
        isPublished: false,
        createdBy: adminId,
      });
    } catch (resultError) {
      console.error("LotteryResult Create Error:", resultError);

      for (const credited of walletCredits) {
        try {
          await removePrizeFromWallet(credited.userId, credited.amount);
        } catch (rollbackError) {
          console.error("Wallet Rollback Error:", rollbackError);
        }
      }

      return res.status(500).json({
        success: false,
        message:
          "Result creation failed and wallet credits were rolled back",
        error: resultError.message,
      });
    }

    return res.status(201).json({
      success: true,
      message:
        "Lottery result created and winning prizes added to wallets successfully",
      result,
      walletCredits,
      summary: {
        date: selectedDate,
        winningNumber: finalWinningNumber,
        totalUsers: processed.totalUsers,
        firstPrize: processed.firstPrizeCount,
        secondPrize: processed.secondPrizeCount,
        thirdPrize: processed.thirdPrizeCount,
        lost: processed.lostCount,
        totalPrizePaid: walletCredits.reduce(
          (total, item) => total + Number(item.amount || 0),
          0
        ),
      },
    });
  } catch (error) {
    console.error("Create Result Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Result already exists for this date",
      });
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
// GET /
// ✅ FIXED: populate `drawDate` not `date`
// =====================================================

const getAllResults = async (req, res) => {
  try {
    const results = await LotteryResult.find()
      .populate(
        "lotteryConfigId",
        "marketName drawDate drawTime month year isActive"
      )
      .sort({ date: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: results.length,
      results,
    });
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
// GET RESULT BY ID
// GET /:id
// ✅ FIXED: populate `drawDate` not `date`
// =====================================================

const getResultById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid result ID",
      });
    }

    const result = await LotteryResult.findById(id).populate(
      "lotteryConfigId",
      "marketName drawDate drawTime month year isActive"
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    return res.status(200).json({
      success: true,
      result,
    });
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
// PUBLISH RESULT
// PATCH /:id/publish
// =====================================================

const publishResult = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid result ID",
      });
    }

    const result = await LotteryResult.findByIdAndUpdate(
      id,
      { $set: { isPublished: true } },
      { new: true, runValidators: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Result published successfully",
      result,
    });
  } catch (error) {
    console.error("Publish Result Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// UNPUBLISH RESULT
// PATCH /:id/unpublish
// =====================================================

const unpublishResult = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid result ID",
      });
    }

    const result = await LotteryResult.findByIdAndUpdate(
      id,
      { $set: { isPublished: false } },
      { new: true, runValidators: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Result unpublished successfully",
      result,
    });
  } catch (error) {
    console.error("Unpublish Result Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE RESULT
// PUT /:id
// =====================================================

const updateResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { winningNumber } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid result ID",
      });
    }

    if (winningNumber === undefined || winningNumber === null) {
      return res.status(400).json({
        success: false,
        message: "winningNumber is required",
      });
    }

    if (!validateSixDigitNumber(winningNumber)) {
      return res.status(400).json({
        success: false,
        message: "Winning number must contain exactly 6 digits",
      });
    }

    const finalWinningNumber = String(winningNumber).trim();

    const result = await LotteryResult.findById(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    if (result.isPublished) {
      return res.status(400).json({
        success: false,
        message: "Published result cannot be edited. Unpublish it first.",
      });
    }

    const config = await LotteryConfig.findById(result.lotteryConfigId);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Lottery config not found",
      });
    }

    const selectedDate = getDateString(result.date);

    if (!selectedDate) {
      return res.status(400).json({
        success: false,
        message: "Invalid result date",
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

    const prizeAmounts = getPrizeAmounts(config);

    // ==========================================
    // REMOVE OLD PRIZES
    // ==========================================
    const walletReversals = [];

    try {
      if (Array.isArray(result.winners)) {
        for (const oldWinner of result.winners) {
          const oldPrizeType = oldWinner.prizeType || oldWinner.prize;

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

      for (const reversal of walletReversals) {
        try {
          await addPrizeToWallet(reversal.userId, reversal.amount);
        } catch (restoreError) {
          console.error("Old Prize Restore Error:", restoreError);
        }
      }

      return res.status(500).json({
        success: false,
        message:
          "Result update stopped because old wallet prizes could not be reversed",
        error: walletError.message,
      });
    }

    // ==========================================
    // RECALCULATE
    // ==========================================
    const processed = processUsersForDate({
      config,
      selectedDate,
      winningNumber: finalWinningNumber,
      prizeAmounts,
    });

    // ==========================================
    // ADD NEW PRIZES
    // ==========================================
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

      for (const credit of walletCredits) {
        try {
          await removePrizeFromWallet(credit.userId, credit.amount);
        } catch (rollbackError) {
          console.error("New Credit Rollback Error:", rollbackError);
        }
      }

      for (const reversal of walletReversals) {
        try {
          await addPrizeToWallet(reversal.userId, reversal.amount);
        } catch (restoreError) {
          console.error("Old Prize Restore Error:", restoreError);
        }
      }

      return res.status(500).json({
        success: false,
        message: "Result update failed and wallet changes were rolled back",
        error: walletError.message,
      });
    }

    // ==========================================
    // UPDATE RESULT
    // ==========================================
    result.winningNumber = finalWinningNumber;
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
        winningNumber: finalWinningNumber,
        totalUsers: processed.totalUsers,
        firstPrize: processed.firstPrizeCount,
        secondPrize: processed.secondPrizeCount,
        thirdPrize: processed.thirdPrizeCount,
        lost: processed.lostCount,
        totalPrizePaid: walletCredits.reduce(
          (total, item) => total + Number(item.amount || 0),
          0
        ),
      },
    });
  } catch (error) {
    console.error("Update Result Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE RESULT
// DELETE /:id
// =====================================================

const deleteResult = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid result ID",
      });
    }

    const result = await LotteryResult.findById(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    if (result.isPublished) {
      return res.status(400).json({
        success: false,
        message: "Published result cannot be deleted",
      });
    }

    await LotteryResult.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Result deleted successfully",
    });
  } catch (error) {
    console.error("Delete Result Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// =====================================================
// CHECK NUMBER
// POST /check-number
// =====================================================

const checkNumber = async (req, res) => {
  try {
    const { userNumber, winningNumber } = req.body;

    if (
      !validateSixDigitNumber(userNumber) ||
      !validateSixDigitNumber(winningNumber)
    ) {
      return res.status(400).json({
        success: false,
        message: "Both numbers must contain exactly 6 digits",
      });
    }

    const result = getPrize(
      String(userNumber).trim(),
      String(winningNumber).trim()
    );

    return res.status(200).json({
      success: true,
      userNumber: String(userNumber).trim(),
      winningNumber: String(winningNumber).trim(),
      winner: result !== null,
      result,
    });
  } catch (error) {
    console.error("Check Number Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// GET PUBLISHED RESULTS
// GET /published
// ✅ FIXED: populate `drawDate` not `date`
// =====================================================

const getPublishedResults = async (req, res) => {
  try {
    const results = await LotteryResult.find({ isPublished: true })
      .populate(
        "lotteryConfigId",
        "marketName drawDate drawTime month year isActive"
      )
      .sort({ date: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("Get Published Results Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// GET PUBLISHED RESULT BY DATE
// GET /published/:date
// ✅ FIXED: populate `drawDate` not `date`
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

    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Get Published Result By Date Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
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
};