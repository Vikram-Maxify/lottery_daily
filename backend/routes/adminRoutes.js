const express = require("express");

const router = express.Router();

// =====================================================
// CONTROLLERS
// =====================================================

const {
  getDashboardStats,
} = require("../controllers/adminDashboardController");

const {
  getAllUsers,
  getSingleUser,
  updateUserWallet,
} = require("../controllers/adminUserController");

const {
  getAllDeposits,
  getSingleDeposit,
  updateDepositStatus,
  getDepositStats,
} = require("../controllers/adminDepositController.js");

const {
  getAllConfigs,
  getSingleConfig,
  createConfig,
  updateConfig,
  toggleConfigActive,
  deleteConfig,
} = require("../controllers/adminConfigController");

const {
  getAllEntries,
  getEntriesByConfig,
  getEntryStats,
} = require("../controllers/adminEntryController");

const {
  getAllResults,
  getSingleResult,
  createResult,
  updateResult,
  toggleResultPublish,
  deleteResult,
} = require("../controllers/adminResultController");

// =====================================================
// MIDDLEWARE
// =====================================================

const authMiddleware = require("../middleware/authMiddleware.js");
const adminMiddleware = require("../middleware/adminMiddleware.js");

// =====================================================
// DASHBOARD
// =====================================================

router.get(
  "/dashboard/stats",
  authMiddleware,
  adminMiddleware,
  getDashboardStats
);

// =====================================================
// USERS
// =====================================================

router.get(
  "/users",
  authMiddleware,
  adminMiddleware,
  getAllUsers
);

router.get(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  getSingleUser
);

router.put(
  "/users/:id/wallet",
  authMiddleware,
  adminMiddleware,
  updateUserWallet
);

// =====================================================
// DEPOSITS
// =====================================================

router.get(
  "/deposits",
  authMiddleware,
  adminMiddleware,
  getAllDeposits
);

router.get(
  "/deposits/stats",
  authMiddleware,
  adminMiddleware,
  getDepositStats
);

router.get(
  "/deposits/:id",
  authMiddleware,
  adminMiddleware,
  getSingleDeposit
);

router.put(
  "/deposits/:id/status",
  authMiddleware,
  adminMiddleware,
  updateDepositStatus
);

// =====================================================
// LOTTERY CONFIGS
// =====================================================

router.get(
  "/configs",
  authMiddleware,
  adminMiddleware,
  getAllConfigs
);

router.get(
  "/configs/:id",
  authMiddleware,
  adminMiddleware,
  getSingleConfig
);

router.post(
  "/configs",
  authMiddleware,
  adminMiddleware,
  createConfig
);

router.put(
  "/configs/:id",
  authMiddleware,
  adminMiddleware,
  updateConfig
);

router.patch(
  "/configs/:id/toggle",
  authMiddleware,
  adminMiddleware,
  toggleConfigActive
);

router.delete(
  "/configs/:id",
  authMiddleware,
  adminMiddleware,
  deleteConfig
);

// =====================================================
// ENTRIES
// =====================================================

router.get(
  "/entries",
  authMiddleware,
  adminMiddleware,
  getAllEntries
);

router.get(
  "/entries/stats",
  authMiddleware,
  adminMiddleware,
  getEntryStats
);

router.get(
  "/entries/config/:configId",
  authMiddleware,
  adminMiddleware,
  getEntriesByConfig
);

// =====================================================
// RESULTS
// =====================================================

router.get(
  "/results",
  authMiddleware,
  adminMiddleware,
  getAllResults
);

router.get(
  "/results/:id",
  authMiddleware,
  adminMiddleware,
  getSingleResult
);

router.post(
  "/results",
  authMiddleware,
  adminMiddleware,
  createResult
);

router.put(
  "/results/:id",
  authMiddleware,
  adminMiddleware,
  updateResult
);

router.patch(
  "/results/:id/toggle",
  authMiddleware,
  adminMiddleware,
  toggleResultPublish
);

router.delete(
  "/results/:id",
  authMiddleware,
  adminMiddleware,
  deleteResult
);

module.exports = router;