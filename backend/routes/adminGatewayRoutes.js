const express = require("express");

const {
  createGateway,
  getGatewaysAdmin,
  getGatewaysUser,
  updateGateway,
  toggleGatewayStatus,
  deleteGateway,
} = require("../controller/adminGatewayController.js");

const adminMiddleware = require("../middleware/adminMiddleware.js");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// USER / CLIENT ROUTES
// =====================================================

// Get active gateways for logged-in user
router.get(
  "/gateway",
  authMiddleware,
  getGatewaysUser
);

// =====================================================
// ADMIN GATEWAY ROUTES
// =====================================================

// Create gateway
router.post(
  "/admin/gateway",
  authMiddleware,
  adminMiddleware,
  createGateway
);

// Get all gateways
router.get(
  "/admin/gateway",
  authMiddleware,
  adminMiddleware,
  getGatewaysAdmin
);

// Update gateway
router.put(
  "/admin/gateway/:id",
  authMiddleware,
  adminMiddleware,
  updateGateway
);

// Toggle gateway status
router.patch(
  "/admin/gateway/:id/status",
  authMiddleware,
  adminMiddleware,
  toggleGatewayStatus
);

// Delete gateway
router.delete(
  "/admin/gateway/:id",
  authMiddleware,
  adminMiddleware,
  deleteGateway
);

module.exports = router;