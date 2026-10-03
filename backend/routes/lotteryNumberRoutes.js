const express = require("express");

const router = express.Router();

const {
  createDailyNumbers,
  getAvailableNumbers,
  getTodayNumbers,
  getAllNumbers,
  getNumberByValue,
  checkNumberForBet,
  sellNumber,
  sellTodayNumbers,
} = require("../controllers/lotteryNumberController");

// =====================================================
// CREATE 100 NUMBERS
// POST /api/lottery-numbers/create
// =====================================================

router.post(
  "/create",
  createDailyNumbers
);

// =====================================================
// TODAY AVAILABLE NUMBERS
// GET /api/lottery-numbers/available
// =====================================================

router.get(
  "/available",
  getAvailableNumbers
);

// =====================================================
// TODAY ALL NUMBERS
// GET /api/lottery-numbers/today
// =====================================================

router.get(
  "/today",
  getTodayNumbers
);

// =====================================================
// CHECK NUMBER BEFORE BET
// GET /api/lottery-numbers/check/10A78965
// =====================================================

router.get(
  "/check/:number",
  checkNumberForBet
);

// =====================================================
// GET ALL NUMBERS
// GET /api/lottery-numbers
// =====================================================

router.get(
  "/",
  getAllNumbers
);

// =====================================================
// SELL SINGLE NUMBER
// POST /api/lottery-numbers/sell
// =====================================================

router.post(
  "/sell",
  sellNumber
);

// =====================================================
// SELL TODAY ALL NUMBERS
// POST /api/lottery-numbers/sell-today
// =====================================================

router.post(
  "/sell-today",
  sellTodayNumbers
);

// =====================================================
// GET SINGLE NUMBER
// IMPORTANT: This route LAST me rakhi hai
// =====================================================

router.get(
  "/:number",
  getNumberByValue
);

module.exports = router;