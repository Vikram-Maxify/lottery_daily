const KYC = require("../models/KycModel");

const KYC_REQUIRED_MESSAGE =
  "Your KYC is not verified. Please complete KYC verification before making investments, deposits, or withdrawals.";

// =====================================================
// CHECK IF REQUEST IS DEPOSIT REQUEST
// =====================================================

const isDepositRequest = (req) => {
  const routePath = `${req.baseUrl || ""}${req.path || ""}`;
  const originalUrl = req.originalUrl || "";

  return (
    routePath.includes("/deposit") ||
    originalUrl.includes("/deposit")
  );
};

// =====================================================
// REQUIRE VERIFIED KYC
// =====================================================

const requireVerifiedKYC = async (req, res, next) => {
  try {
    // Deposit requests bypass KYC check
    if (isDepositRequest(req)) {
      return next();
    }

    console.log("KYC validation executing.");

    const kyc = await KYC.findOne({
      userId: req.user.id,
    }).select("status");

    if (!kyc || kyc.status !== 2) {
      return res.status(403).json({
        success: false,
        message: KYC_REQUIRED_MESSAGE,
      });
    }

    return next();
  } catch (error) {
    console.error(
      "KYC VERIFICATION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to verify KYC status",
    });
  }
};

module.exports = {
  requireVerifiedKYC,
};