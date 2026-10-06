const KycDocument = require("../models/KycDocument");
const User = require("../models/userModel");

// =====================================================
// HELPER: CALCULATE OVERALL KYC STATUS
// =====================================================

const getOverallKycStatus = (document) => {
  if (!document) return "none";

  const hasAadhaar = Boolean(
    document.aadhaar?.front?.url && document.aadhaar?.back?.url,
  );
  const hasPan = Boolean(document.pan?.front?.url);
  const hasSelfie = Boolean(document.selfie?.url);

  const submittedStatuses = [];
  if (hasAadhaar) {
    submittedStatuses.push(document.aadhaar?.review?.status || "pending");
  }
  if (hasPan) {
    submittedStatuses.push(document.pan?.review?.status || "pending");
  }

  if (submittedStatuses.length === 0) {
    if (hasSelfie || document.dob) return "incomplete";
    return "none";
  }

  if (submittedStatuses.includes("rejected")) {
    return "rejected";
  }
  if (submittedStatuses.includes("pending")) {
    return "pending";
  }
  if (submittedStatuses.every((s) => s === "approved")) {
    return "approved";
  }

  return "pending";
};

// =====================================================
// HELPER: FORMAT KYC DOCUMENT FOR CLIENT
// =====================================================

const formatKycDocument = (document) => {
  const overallStatus = getOverallKycStatus(document);

  const raw = document.toObject ? document.toObject() : document;

  return {
    ...raw,
    status: overallStatus,
    rejectionReason:
      document.aadhaar?.review?.rejectionReason ||
      document.pan?.review?.rejectionReason ||
      null,
  };
};

// =====================================================
// GET ALL KYC DOCUMENTS
// GET /api/admin/kyc
// =====================================================

exports.getAllKyc = async (req, res) => {
  try {
    const { status } = req.query;

    const documents = await KycDocument.find({})
      .populate("userId", "name email phone mobile")
      .populate("aadhaar.review.reviewedBy", "name email")
      .populate("pan.review.reviewedBy", "name email")
      .sort({ createdAt: -1 });

    const formattedDocuments = documents
      .map((doc) => formatKycDocument(doc))
      .filter((doc) => {
        if (!status) return true;
        return doc.status === status;
      });

    return res.status(200).json({
      success: true,
      count: formattedDocuments.length,
      data: formattedDocuments,
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
      .populate("userId", "name email phone mobile")
      .populate("aadhaar.review.reviewedBy", "name email")
      .populate("pan.review.reviewedBy", "name email");

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "KYC document not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: formatKycDocument(document),
    });
  } catch (error) {
    console.error("Get Single KYC Error:", error);

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

    // Status transition guards:
    // Once approved, cannot be re-approved.
    // Once rejected, cannot be approved directly (user must re-upload first).
    const currentStatus = getOverallKycStatus(document);

    if (currentStatus === "approved") {
      return res.status(400).json({
        success: false,
        message: "KYC is already approved and verified",
      });
    }

    if (currentStatus === "rejected") {
      return res.status(400).json({
        success: false,
        message:
          "Cannot approve a rejected KYC. User must resubmit documents before verification.",
      });
    }

    const aadhaarExists = Boolean(
      document.aadhaar?.front?.url && document.aadhaar?.back?.url,
    );

    const panExists = Boolean(document.pan?.front?.url);

    if (!aadhaarExists && !panExists) {
      return res.status(400).json({
        success: false,
        message: "No Aadhaar or PAN document found to approve",
      });
    }

    // -----------------------------------------------
    // Approve submitted Aadhaar
    // -----------------------------------------------

    if (aadhaarExists) {
      document.aadhaar.review = {
        status: "approved",
        rejectionReason: null,
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      };
    }

    // -----------------------------------------------
    // Approve submitted PAN
    // -----------------------------------------------

    if (panExists) {
      document.pan.review = {
        status: "approved",
        rejectionReason: null,
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      };
    }

    await document.save();

    // -----------------------------------------------
    // Update User KYC verification flag
    // -----------------------------------------------

    await User.findByIdAndUpdate(document.userId, {
      isKycVerified: true,
    });

    // Populate for response
    const updatedDocument = await KycDocument.findById(document._id)
      .populate("userId", "name email phone mobile")
      .populate("aadhaar.review.reviewedBy", "name email")
      .populate("pan.review.reviewedBy", "name email");

    return res.status(200).json({
      success: true,
      message: "KYC approved successfully",
      data: formatKycDocument(updatedDocument),
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

    if (!rejectionReason || !rejectionReason.trim()) {
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

    // Status transition guards:
    // Once approved, cannot be rejected.
    // Once rejected, cannot be re-rejected.
    const currentStatus = getOverallKycStatus(document);

    if (currentStatus === "approved") {
      return res.status(400).json({
        success: false,
        message: "Cannot reject an already approved KYC document",
      });
    }

    if (currentStatus === "rejected") {
      return res.status(400).json({
        success: false,
        message: "KYC is already rejected",
      });
    }

    const reason = rejectionReason.trim();

    const aadhaarExists = Boolean(
      document.aadhaar?.front?.url && document.aadhaar?.back?.url,
    );

    const panExists = Boolean(document.pan?.front?.url);

    if (!aadhaarExists && !panExists) {
      return res.status(400).json({
        success: false,
        message: "No Aadhaar or PAN document found to reject",
      });
    }

    // -----------------------------------------------
    // Reject submitted Aadhaar
    // -----------------------------------------------

    if (aadhaarExists) {
      document.aadhaar.review = {
        status: "rejected",
        rejectionReason: reason,
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      };
    }

    // -----------------------------------------------
    // Reject submitted PAN
    // -----------------------------------------------

    if (panExists) {
      document.pan.review = {
        status: "rejected",
        rejectionReason: reason,
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      };
    }

    await document.save();

    // -----------------------------------------------
    // User KYC unverified
    // -----------------------------------------------

    await User.findByIdAndUpdate(document.userId, {
      isKycVerified: false,
    });

    // Populate for response
    const updatedDocument = await KycDocument.findById(document._id)
      .populate("userId", "name email phone mobile")
      .populate("aadhaar.review.reviewedBy", "name email")
      .populate("pan.review.reviewedBy", "name email");

    return res.status(200).json({
      success: true,
      message: "KYC rejected successfully",
      data: formatKycDocument(updatedDocument),
    });
  } catch (error) {
    console.error("Reject KYC Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
