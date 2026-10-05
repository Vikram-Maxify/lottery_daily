const express = require("express");

const router = express.Router();

const {
  getAmount,
  updateAmount,
} = require("../controllers/festivsl_amountController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// =====================================================
// GET FESTIVAL AMOUNT (matches / and /amount)
// =====================================================
router.get("/", authMiddleware, getAmount);
router.get("/amount", authMiddleware, getAmount);

// =====================================================
// UPDATE FESTIVAL AMOUNT (matches / and /amount)
// =====================================================
router.put("/", authMiddleware, adminMiddleware, updateAmount);
router.put("/amount", authMiddleware, adminMiddleware, updateAmount);

module.exports = router;