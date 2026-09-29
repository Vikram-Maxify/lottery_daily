const express = require("express");

const {
  createDeposit,
  cancelDeposit,
  getMyDeposits,
  onlinePayCallback,
  getMyTurnoverHistory,
  getAllDepositsForAdmin,
  getDepositStatusByIdentifier,
  generateTestQwackPaySign,
} = require("../controllers/depositecontroller");

const uploadDeposit = require("../middleware/depositUpload.js");

const authMiddleware = require("../middleware/authMiddleware");

const {
  requireVerifiedKYC,
} = require("../middleware/kycVerificationMiddleware");

const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// =====================================================
// CREATE DEPOSIT (RECHARGE)
// USER
// =====================================================

router.post(
  "/deposit",
  authMiddleware,
  requireVerifiedKYC,
  uploadDeposit.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  createDeposit
);

// =====================================================
// CANCEL DEPOSIT
// USER
// =====================================================

router.post(
  "/deposit/:depositId/cancel",
  authMiddleware,
  cancelDeposit
);

// =====================================================
// TURNOVER HISTORY
// USER
// =====================================================

router.get(
  "/deposit/turnover",
  authMiddleware,
  getMyTurnoverHistory
);

// =====================================================
// DEPOSIT STATUS BY IDENTIFIER
// PUBLIC
//
// _id OR orderId
// Used by payment-success page
// =====================================================

router.get(
  "/deposit/status/:identifier",
  authMiddleware,
  getDepositStatusByIdentifier
);

// =====================================================
// MY DEPOSIT HISTORY
// USER
// =====================================================

router.get(
  "/deposit",
  authMiddleware,
  getMyDeposits
);

// =====================================================
// ADMIN: GET ALL DEPOSITS
// ADMIN ONLY
// =====================================================

router.get(
  "/deposits",
  authMiddleware,
  adminMiddleware,
  getAllDepositsForAdmin
);

router.post(
  "/deposit/test-sign",
  generateTestQwackPaySign
);

// =====================================================
// AUTOMATIC PAYMENT CALLBACK
// PUBLIC / PAYMENT GATEWAY
//
// QWACKPAY WEBHOOK
// =====================================================

router.all(
  "/deposit/callback",
  onlinePayCallback
);

module.exports = router;