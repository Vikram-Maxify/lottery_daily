const mongoose = require("mongoose");

const LotteryResult = require("../models/festivelresult");
const LotteryConfig = require("../models/Festival");
const LotteryNumber = require("../models/LotteryNumber");
const User = require("../models/userModel");

// =====================================================
// VALIDATE 8-CHAR ALPHANUMERIC NUMBER
// Format: 2 digits + 1 letter + 5 digits → "12A12345"
// =====================================================

const validateSixDigitNumber = (number) => {
  if (number === undefined || number === null) {
    return false;
  }
  return /^[0-9]{2}[A-Z][0-9]{5}$/.test(
    String(number).trim().toUpperCase()
  );
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
// =====================================================

const buildDateFromConfig = (config) => {
  if (!config) return null;

  const dateStr = getDateString(config.drawDate);

  if (!dateStr) return null;

  return dateStr;
};

// =====================================================
// CHECK PRIZE
// Format: 8 chars — 1st=8, 2nd=7, 3rd=5
// =====================================================

const getPrize = (userNumber, winningNumber) => {
  const user = String(userNumber).trim().toUpperCase();
  const winning = String(winningNumber).trim().toUpperCase();

  // 1ST PRIZE — EXACT 8 CHARS MATCH
  if (user === winning) {
    return { prize: "1st", matchedDigits: 8 };
  }

  // 2ND PRIZE — FIRST 7 OR LAST 7
  const firstSevenMatch = user.substring(0, 7) === winning.substring(0, 7);
  const lastSevenMatch = user.substring(1, 8) === winning.substring(1, 8);

  if (firstSevenMatch || lastSevenMatch) {
    return { prize: "2nd", matchedDigits: 7 };
  }

  // 3RD PRIZE — FIRST 5 OR MIDDLE 5 OR LAST 5
  const firstFiveMatch = user.substring(0, 5) === winning.substring(0, 5);
  const middleFiveMatch = user.substring(1, 6) === winning.substring(1, 6);
  const lastFiveMatch = user.substring(3, 8) === winning.substring(3, 8);

  if (firstFiveMatch || middleFiveMatch || lastFiveMatch) {
    return { prize: "3rd", matchedDigits: 5 };
  }

  return null;
};

// =====================================================
// GET PRIZE AMOUNTS (1st – 5th)
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

// =====================================================
// GET PRIZE AMOUNT BY TYPE (1st – 5th)
// =====================================================

const getAmountByPrizeType = (prizeType, prizeAmounts) => {
  if (prizeType === "1st") return Number(prizeAmounts.first) || 0;
  if (prizeType === "2nd") return Number(prizeAmounts.second) || 0;
  if (prizeType === "3rd") return Number(prizeAmounts.third) || 0;
  if (prizeType === "4th") return Number(prizeAmounts.fourth) || 0;
  if (prizeType === "5th") return Number(prizeAmounts.fifth) || 0;
  return 0;
};

// =====================================================
// BUILD USER PRIZE OBJECT (1st – 5th)
// =====================================================

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
    const userNumber = String(user.number || "").trim().toUpperCase();

    if (!validateSixDigitNumber(userNumber)) {
      user.status = "lost";
      user.prizeType = null;
      user.prize = { first: 0, second: 0, third: 0, fourth: 0, fifth: 0 };
      lostCount++;
      continue;
    }

    const match = getPrize(userNumber, winningNumber);

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

    const prizeAmount = getAmountByPrizeType(match.prize, prizeAmounts);

    winners.push({
      userId: user.userId,
      userNumber: userNumber,
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
    lostCount,
  };
};

// =====================================================
// CREATE RESULT
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
        message:
          "Winning number must be 8 characters: 2 digits + 1 letter + 5 digits (e.g. 12A12345)",
      });
    }

    const finalWinningNumber = String(winningNumber).trim().toUpperCase();

    const config = await LotteryConfig.findById(lotteryConfigId);
    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Lottery config not found",
      });
    }

    // ✅ NEW: Reject inactive lotteries
    if (!config.isActive) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot create result for an inactive lottery. Activate it first.",
      });
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
      winningNumber: finalWinningNumber,
      prizeAmounts,
    });

    const walletCredits = [];
    const failedCredits = [];

    // ✅ Wallet credit with detailed logging
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
      console.error("❌ Wallet Credit Error:", walletError);

      // Rollback all previous credits
      for (const credited of walletCredits) {
        try {
          await removePrizeFromWallet(credited.userId, credited.amount);
        } catch (rollbackError) {
          console.error(
            "🚨 CRITICAL Wallet Rollback Failed — manual reconciliation needed:",
            {
              userId: credited.userId,
              amount: credited.amount,
              reason: rollbackError.message,
            }
          );
          failedCredits.push({
            userId: credited.userId,
            amount: credited.amount,
            error: rollbackError.message,
          });
        }
      }

      return res.status(500).json({
        success: false,
        message:
          "Result was not created because wallet prize credit failed",
        error: walletError.message,
        rollbackFailures: failedCredits,
      });
    }

    config.markModified("users");
    await config.save();

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
      console.error("❌ LotteryResult Create Error:", resultError);

      for (const credited of walletCredits) {
        try {
          await removePrizeFromWallet(credited.userId, credited.amount);
        } catch (rollbackError) {
          console.error(
            "🚨 CRITICAL Wallet Rollback Failed — manual reconciliation needed:",
            {
              userId: credited.userId,
              amount: credited.amount,
              reason: rollbackError.message,
            }
          );
          failedCredits.push({
            userId: credited.userId,
            amount: credited.amount,
            error: rollbackError.message,
          });
        }
      }

      return res.status(500).json({
        success: false,
        message:
          "Result creation failed and wallet credits were rolled back",
        error: resultError.message,
        rollbackFailures: failedCredits,
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
        message:
          "Winning number must be 8 characters: 2 digits + 1 letter + 5 digits (e.g. 12A12345)",
      });
    }

    const finalWinningNumber = String(winningNumber).trim().toUpperCase();

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

    const walletReversals = [];
    const walletCredits = [];
    const failedOps = [];

    // Reverse old wallet credits
    try {
      if (Array.isArray(result.winners)) {
        for (const oldWinner of result.winners) {
          const oldPrizeType =
            oldWinner.prizeType ||
            (typeof oldWinner.prize === "string"
              ? oldWinner.prize
              : null);

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
      console.error("❌ Old Wallet Reversal Error:", walletError);

      for (const reversal of walletReversals) {
        try {
          await addPrizeToWallet(reversal.userId, reversal.amount);
        } catch (restoreError) {
          console.error(
            "🚨 CRITICAL Old Prize Restore Failed — manual reconciliation needed:",
            {
              userId: reversal.userId,
              amount: reversal.amount,
              reason: restoreError.message,
            }
          );
          failedOps.push({
            op: "restore",
            userId: reversal.userId,
            amount: reversal.amount,
            error: restoreError.message,
          });
        }
      }

      return res.status(500).json({
        success: false,
        message:
          "Result update stopped because old wallet prizes could not be reversed",
        error: walletError.message,
        rollbackFailures: failedOps,
      });
    }

    const processed = processUsersForDate({
      config,
      selectedDate,
      winningNumber: finalWinningNumber,
      prizeAmounts,
    });

    // Apply new wallet credits
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
      console.error("❌ New Wallet Credit Error:", walletError);

      for (const credit of walletCredits) {
        try {
          await removePrizeFromWallet(credit.userId, credit.amount);
        } catch (rollbackError) {
          console.error(
            "🚨 CRITICAL New Credit Rollback Failed — manual reconciliation needed:",
            {
              userId: credit.userId,
              amount: credit.amount,
              reason: rollbackError.message,
            }
          );
          failedOps.push({
            op: "remove-new",
            userId: credit.userId,
            amount: credit.amount,
            error: rollbackError.message,
          });
        }
      }

      for (const reversal of walletReversals) {
        try {
          await addPrizeToWallet(reversal.userId, reversal.amount);
        } catch (restoreError) {
          console.error(
            "🚨 CRITICAL Old Prize Restore Failed — manual reconciliation needed:",
            {
              userId: reversal.userId,
              amount: reversal.amount,
              reason: restoreError.message,
            }
          );
          failedOps.push({
            op: "restore",
            userId: reversal.userId,
            amount: reversal.amount,
            error: restoreError.message,
          });
        }
      }

      return res.status(500).json({
        success: false,
        message: "Result update failed and wallet changes were rolled back",
        error: walletError.message,
        rollbackFailures: failedOps,
      });
    }

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
        message:
          "Both numbers must be 8 characters: 2 digits + 1 letter + 5 digits (e.g. 12A12345)",
      });
    }

    const result = getPrize(
      String(userNumber).trim().toUpperCase(),
      String(winningNumber).trim().toUpperCase()
    );

    return res.status(200).json({
      success: true,
      userNumber: String(userNumber).trim().toUpperCase(),
      winningNumber: String(winningNumber).trim().toUpperCase(),
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
// GET UNBET LOTTERY NUMBERS
// =====================================================

const getUnbetLotteryNumbers = async (req, res) => {
  const startTime = Date.now();

  try {
    const { lotteryConfigId } = req.query;

    console.log("====================================");
    console.log("UNBET NUMBERS API");
    console.log("req.query:", req.query);
    console.log("lotteryConfigId:", lotteryConfigId);
    console.log("mongoose readyState:", mongoose.connection.readyState);
    console.log("====================================");

    // -------------------------------------------------
    // 0. DB CONNECTION GUARD
    // -------------------------------------------------
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message:
          "Database not connected. Please try again in a moment.",
      });
    }

    // -------------------------------------------------
    // 1. VALIDATE INPUT
    // -------------------------------------------------
    const lotteryid = String(lotteryConfigId || "").trim();

    if (!lotteryid) {
      return res.status(400).json({
        success: false,
        message: "lotteryConfigId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(lotteryid)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lotteryConfigId",
      });
    }

    // -------------------------------------------------
    // 2. GET LOTTERY CONFIG
    // -------------------------------------------------
    console.log("→ Querying LotteryConfig...");

    const lotteryConfig = await LotteryConfig.findOne({
      _id: lotteryid,
    })
      .maxTimeMS(8000)
      .lean();

    console.log(
      "← LotteryConfig result:",
      lotteryConfig ? lotteryConfig._id : null
    );

    if (!lotteryConfig) {
      return res.status(404).json({
        success: false,
        message: "Lottery configuration not found",
      });
    }

    // -------------------------------------------------
    // 3. GET ALL AVAILABLE NUMBERS FROM LotteryNumber
    //    (fixed: query the correct collection)
    // -------------------------------------------------
    console.log("→ Querying LotteryNumber...");

    const allNumbersRaw = await LotteryNumber.find({
      status: "available",
    })
      .select("number -_id")
      .maxTimeMS(8000)
      .lean();

    console.log("← Total available numbers:", allNumbersRaw.length);

    const uniqueNumbers = [
      ...new Set(
        allNumbersRaw
          .map((item) => String(item.number || "").trim().toUpperCase())
          .filter(Boolean)
      ),
    ];

    // -------------------------------------------------
    // 4. GET BETTED NUMBERS FROM config.users
    //    (fixed: read from config.users, not a separate query)
    // -------------------------------------------------
    const bettedNumbers = new Set(
      (lotteryConfig.users || [])
        .filter((u) => u.isBuy === true)
        .map((u) => String(u.number || "").trim().toUpperCase())
        .filter(Boolean)
    );

    console.log("Betted numbers count:", bettedNumbers.size);

    // -------------------------------------------------
    // 5. FIND UNBET NUMBERS
    // -------------------------------------------------
    const unbetNumbers = uniqueNumbers.filter(
      (number) => !bettedNumbers.has(number)
    );

    // -------------------------------------------------
    // 6. RESPONSE
    // -------------------------------------------------
    console.log(
      `✅ Unbet numbers computed in ${Date.now() - startTime}ms`
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
    });
  } catch (error) {
    console.error("❌ getUnbetLotteryNumbers ERROR:", error);

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
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch unbet lottery numbers",
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
  getUnbetLotteryNumbers,
};