const AdminGateway = require("../models/AdminGateway.js");

// ================= Create Gateway (Admin Only) =================
const createGateway = async (req, res) => {
  try {
    const {
      name,
      mode,
      type,
      minLimit,
      maxLimit,
      status,

      // Manual details
      upiId,
      qrCode,
      walletAddress,
      network,
      bankName,
      accountNumber,
      ifscCode,
      accountHolderName,

      // Automatic details
      gatewayName,
      gatewayUrl,
      merchantId,
      apiKey,
      secretKey,
      privateKey,
      publicKey,
      webhookSecret,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Gateway name is required.",
      });
    }

    const resolvedMode = mode || "manual";
    if (!["manual", "automatic"].includes(resolvedMode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gateway mode. Must be 'manual' or 'automatic'.",
      });
    }

    const payload = {
      name: name.trim(),
      mode: resolvedMode,
      minLimit: minLimit !== undefined ? Number(minLimit) : 100,
      maxLimit: maxLimit !== undefined ? Number(maxLimit) : 10000,
      status: status !== undefined ? Number(status) : 1,
      createdBy: req.user.id,
    };

    if (resolvedMode === "manual") {
      if (!type) {
        return res.status(400).json({
          success: false,
          message: "Type is required for manual gateways (UPI, Crypto, or Bank).",
        });
      }
      if (!["UPI", "Crypto", "Bank"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid manual gateway type. Must be UPI, Crypto, or Bank.",
        });
      }

      // Type-specific validations
      if (type === "UPI" && !upiId) {
        return res.status(400).json({
          success: false,
          message: "UPI ID is required for UPI manual gateways.",
        });
      }
      if (type === "Crypto" && !walletAddress) {
        return res.status(400).json({
          success: false,
          message: "Wallet address is required for Crypto manual gateways.",
        });
      }
      if (type === "Bank" && (!bankName || !accountNumber || !ifscCode || !accountHolderName)) {
        return res.status(400).json({
          success: false,
          message: "All bank details (bankName, accountNumber, ifscCode, accountHolderName) are required for Bank manual gateways.",
        });
      }

      payload.type = type;
      payload.upiId = type === "UPI" ? upiId.trim() : "";
      payload.qrCode = type === "UPI" ? (qrCode || "") : "";
      payload.walletAddress = type === "Crypto" ? walletAddress.trim() : "";
      payload.network = type === "Crypto" ? (network || "TRC20").trim() : "TRC20";
      payload.bankName = type === "Bank" ? bankName.trim() : "";
      payload.accountNumber = type === "Bank" ? accountNumber.trim() : "";
      payload.ifscCode = type === "Bank" ? ifscCode.trim().toUpperCase() : "";
      payload.accountHolderName = type === "Bank" ? accountHolderName.trim() : "";

      // Clear automatic fields
      payload.gatewayName = "";
      payload.gatewayUrl = "";
      payload.merchantId = "";
      payload.apiKey = "";
      payload.secretKey = "";
      payload.privateKey = "";
      payload.publicKey = "";
      payload.webhookSecret = "";
    } else {
      // Automatic gateway validations
      if (!gatewayName) {
        return res.status(400).json({
          success: false,
          message: "gatewayName (integration provider name) is required for automatic gateways.",
        });
      }

      payload.gatewayName = gatewayName.trim();
      payload.gatewayUrl = gatewayUrl ? gatewayUrl.trim() : "https://mch.voterx.xyz";
      payload.merchantId = merchantId ? merchantId.trim() : "";
      payload.apiKey = apiKey ? apiKey.trim() : "";
      payload.secretKey = secretKey ? secretKey.trim() : "";
      payload.privateKey = privateKey ? privateKey.trim() : "";
      payload.publicKey = publicKey ? publicKey.trim() : "";
      payload.webhookSecret = webhookSecret ? webhookSecret.trim() : "";

      // Clear manual fields
      payload.type = undefined;
      payload.upiId = "";
      payload.qrCode = "";
      payload.walletAddress = "";
      payload.network = "TRC20";
      payload.bankName = "";
      payload.accountNumber = "";
      payload.ifscCode = "";
      payload.accountHolderName = "";
    }

    const gateway = await AdminGateway.create(payload);

    return res.status(201).json({
      success: true,
      message: "Gateway created successfully",
      gateway,
    });
  } catch (error) {
    console.error("CREATE GATEWAY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ================= Get All Gateways (Admin View) =================
const getGatewaysAdmin = async (req, res) => {
  try {
    const gateways = await AdminGateway.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      gateways,
    });
  } catch (error) {
    console.error("GET GATEWAYS ADMIN ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ================= Get Active Gateways (User/Client View) =================
const getGatewaysUser = async (req, res) => {
  try {
    const gateways = await AdminGateway.find({ status: 1 }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      gateways,
    });
  } catch (error) {
    console.error("GET GATEWAYS USER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ================= Update Gateway (Admin Only) =================
const updateGateway = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      mode,
      type,
      minLimit,
      maxLimit,
      status,

      // Manual details
      upiId,
      qrCode,
      walletAddress,
      network,
      bankName,
      accountNumber,
      ifscCode,
      accountHolderName,

      // Automatic details
      gatewayName,
      gatewayUrl,
      merchantId,
      apiKey,
      secretKey,
      privateKey,
      publicKey,
      webhookSecret,
    } = req.body;

    const gateway = await AdminGateway.findById(id);

    if (!gateway) {
      return res.status(404).json({
        success: false,
        message: "Gateway not found",
      });
    }

    if (name) gateway.name = name.trim();
    if (mode) {
      if (!["manual", "automatic"].includes(mode)) {
        return res.status(400).json({
          success: false,
          message: "Invalid gateway mode.",
        });
      }
      gateway.mode = mode;
    }

    if (minLimit !== undefined) gateway.minLimit = Number(minLimit);
    if (maxLimit !== undefined) gateway.maxLimit = Number(maxLimit);
    if (status !== undefined) gateway.status = Number(status);

    const resolvedMode = mode || gateway.mode;

    if (resolvedMode === "manual") {
      const resolvedType = type || gateway.type;
      if (type) {
        if (!["UPI", "Crypto", "Bank"].includes(type)) {
          return res.status(400).json({
            success: false,
            message: "Invalid manual gateway type.",
          });
        }
        gateway.type = type;
      }

      if (resolvedType === "UPI") {
        if (upiId !== undefined) gateway.upiId = upiId.trim();
        if (qrCode !== undefined) gateway.qrCode = qrCode;
        gateway.walletAddress = "";
        gateway.network = "TRC20";
        gateway.bankName = "";
        gateway.accountNumber = "";
        gateway.ifscCode = "";
        gateway.accountHolderName = "";
      } else if (resolvedType === "Crypto") {
        if (walletAddress !== undefined) gateway.walletAddress = walletAddress.trim();
        if (network !== undefined) gateway.network = network.trim();
        gateway.upiId = "";
        gateway.qrCode = "";
        gateway.bankName = "";
        gateway.accountNumber = "";
        gateway.ifscCode = "";
        gateway.accountHolderName = "";
      } else if (resolvedType === "Bank") {
        if (bankName !== undefined) gateway.bankName = bankName.trim();
        if (accountNumber !== undefined) gateway.accountNumber = accountNumber.trim();
        if (ifscCode !== undefined) gateway.ifscCode = ifscCode.trim().toUpperCase();
        if (accountHolderName !== undefined) gateway.accountHolderName = accountHolderName.trim();
        gateway.upiId = "";
        gateway.qrCode = "";
        gateway.walletAddress = "";
        gateway.network = "TRC20";
      }

      // Clear automatic fields
      gateway.gatewayName = "";
      gateway.gatewayUrl = "";
      gateway.merchantId = "";
      gateway.apiKey = "";
      gateway.secretKey = "";
      gateway.privateKey = "";
      gateway.publicKey = "";
      gateway.webhookSecret = "";
    } else {
      // Automatic Mode
      if (gatewayName !== undefined) gateway.gatewayName = gatewayName.trim();
      if (gatewayUrl !== undefined) gateway.gatewayUrl = gatewayUrl.trim();
      if (merchantId !== undefined) gateway.merchantId = merchantId.trim();
      if (apiKey !== undefined) gateway.apiKey = apiKey.trim();
      if (secretKey !== undefined) gateway.secretKey = secretKey.trim();
      if (privateKey !== undefined) gateway.privateKey = privateKey.trim();
      if (publicKey !== undefined) gateway.publicKey = publicKey.trim();
      if (webhookSecret !== undefined) gateway.webhookSecret = webhookSecret.trim();

      // Clear manual fields
      gateway.type = undefined;
      gateway.upiId = "";
      gateway.qrCode = "";
      gateway.walletAddress = "";
      gateway.network = "TRC20";
      gateway.bankName = "";
      gateway.accountNumber = "";
      gateway.ifscCode = "";
      gateway.accountHolderName = "";
    }

    await gateway.save();

    return res.status(200).json({
      success: true,
      message: "Gateway updated successfully",
      gateway,
    });
  } catch (error) {
    console.error("UPDATE GATEWAY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ================= Toggle Gateway Status (Admin Only) =================
const toggleGatewayStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const gateway = await AdminGateway.findById(id);

    if (!gateway) {
      return res.status(404).json({
        success: false,
        message: "Gateway not found",
      });
    }

    // Toggle status
    gateway.status = gateway.status === 1 ? 0 : 1;
    await gateway.save();

    return res.status(200).json({
      success: true,
      message: `Gateway ${gateway.status === 1 ? 'enabled' : 'disabled'} successfully`,
      gateway,
    });
  } catch (error) {
    console.error("TOGGLE GATEWAY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ================= Delete Gateway (Admin Only) =================
const deleteGateway = async (req, res) => {
  try {
    const { id } = req.params;
    const gateway = await AdminGateway.findById(id);

    if (!gateway) {
      return res.status(404).json({
        success: false,
        message: "Gateway not found",
      });
    }

    await gateway.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Gateway deleted successfully",
    });
  } catch (error) {
    console.error("DELETE GATEWAY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  createGateway,
  getGatewaysAdmin,
  getGatewaysUser,
  updateGateway,
  toggleGatewayStatus,
  deleteGateway,
};