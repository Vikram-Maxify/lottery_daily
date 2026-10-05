const KycDocument = require("../models/KycDocument");
const User = require("../models/User"); // ✅ ADD

// =====================================================
// GET ALL KYC DOCUMENTS
// GET /api/admin/kyc
// =====================================================

exports.getAllKyc = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      filter.status = status;
    }

    const documents = await KycDocument.find(filter)
      .populate("userId", "name email phone")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    console.error("Get All KYC Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// GET SINGLE KYC
// GET /api/admin/kyc/:id
// =====================================================

exports.getSingleKyc = async (req, res) => {
  try {
    const document = await KycDocument.findById(req.params.id)
      .populate("userId", "name email phone")
      .populate("reviewedBy", "name email");

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "KYC document not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// APPROVE KYC
// PATCH /api/admin/kyc/:id/approve
// =====================================================

exports.approveKyc = async (req, res) => {
  try {
    const document = await KycDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "KYC document not found",
      });
    }

    if (document.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Document is already approved",
      });
    }

    document.status = "approved";
    document.rejectionReason = null;
    document.reviewedBy = req.user._id;
    document.reviewedAt = new Date();

    await document.save();

    // -------------------------------------------------
    // ✅ User ko KYC verified mark karo
    // -------------------------------------------------
    await User.findByIdAndUpdate(document.userId, {
      isKycVerified: true,
    });

    return res.status(200).json({
      success: true,
      message: "KYC document approved successfully",
      data: document,
    });
  } catch (error) {
    console.error("Approve KYC Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// REJECT KYC
// PATCH /api/admin/kyc/:id/reject
// =====================================================

exports.rejectKyc = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const document = await KycDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "KYC document not found",
      });
    }

    document.status = "rejected";
    document.rejectionReason = rejectionReason;
    document.reviewedBy = req.user._id;
    document.reviewedAt = new Date();

    await document.save();

    // -------------------------------------------------
    // ✅ Agar user ke paas koi bhi approved doc nahi bacha
    //    to isKycVerified = false kar do
    // -------------------------------------------------
    const approvedCount = await KycDocument.countDocuments({
      userId: document.userId,
      status: "approved",
    });

    if (approvedCount === 0) {
      await User.findByIdAndUpdate(document.userId, {
        isKycVerified: false,
      });
    }

    return res.status(200).json({
      success: true,
      message: "KYC document rejected",
      data: document,
    });
  } catch (error) {
    console.error("Reject KYC Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};