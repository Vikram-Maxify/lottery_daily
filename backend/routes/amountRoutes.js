const express = require("express");

const router = express.Router();

const {
  getAmount,
  updateAmount,
} = require("../controllers/amountController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// =====================================================
// ADMIN: GET AMOUNT
// =====================================================

router.get(
  "/amount",
  authMiddleware,
  getAmount
);

// =====================================================
// ADMIN: UPDATE AMOUNT
// =====================================================

router.put(
  "/amount",
  authMiddleware,
  adminMiddleware,
  updateAmount
);

module.exports = router;