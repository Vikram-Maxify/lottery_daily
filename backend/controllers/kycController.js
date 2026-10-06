const KycDocument = require("../models/KycDocument");
const User = require("../models/userModel");
const uploadToImgBB = require("../utils/imgbbUpload");

// =====================================================
// UPLOAD KYC
// POST /api/kyc/upload
//
// multipart/form-data:
//
// dob
// aadhaarFront
// aadhaarBack
// panFront
// selfie
//
// All files are optional individually, but at least
// one KYC document should be uploaded.
// =====================================================

exports.uploadKycDocument = async (req, res) => {
  try {
    const userId = req.user.id;

    const { dob } = req.body;

    // =================================================
    // GET FILES
    // =================================================

    const aadhaarFront =
      req.files?.aadhaarFront?.[0] || req.files?.front?.[0] || null;
    const aadhaarBack =
      req.files?.aadhaarBack?.[0] || req.files?.back?.[0] || null;
    const panFront =
      req.files?.panFront?.[0] || req.files?.pan?.[0] || null;
    const selfie = req.files?.selfie?.[0] || null;

    // =================================================
    // VALIDATION
    // =================================================

    if (!aadhaarFront && !panFront && !selfie && !dob) {
      return res.status(400).json({
        success: false,
        message: "Please provide KYC details",
      });
    }

    // Aadhaar front and back must come together
    if (aadhaarFront && !aadhaarBack) {
      return res.status(400).json({
        success: false,
        message: "Aadhaar back image is required",
      });
    }

    if (aadhaarBack && !aadhaarFront) {
      return res.status(400).json({
        success: false,
        message: "Aadhaar front image is required",
      });
    }

    // =================================================
    // DOB VALIDATION
    // =================================================

    let parsedDob = null;

    if (dob) {
      parsedDob = new Date(dob);

      if (isNaN(parsedDob.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date of birth",
        });
      }

      // Future DOB not allowed
      if (parsedDob > new Date()) {
        return res.status(400).json({
          success: false,
          message: "Date of birth cannot be in the future",
        });
      }
    }

    // =================================================
    // FIND USER KYC
    // =================================================

    let kyc = await KycDocument.findOne({
      userId,
    });

    // =================================================
    // CHECK APPROVED DOCUMENTS
    // =================================================

    if (kyc) {
      const hasAadhaar = Boolean(
        kyc.aadhaar?.front?.url && kyc.aadhaar?.back?.url,
      );
      const hasPan = Boolean(kyc.pan?.front?.url);

      const isAadhaarApproved =
        hasAadhaar && kyc.aadhaar?.review?.status === "approved";
      const isPanApproved = hasPan && kyc.pan?.review?.status === "approved";

      // If already fully verified/approved, reject re-upload
      if (
        (isAadhaarApproved && isPanApproved) ||
        (isAadhaarApproved && !hasPan) ||
        (isPanApproved && !hasAadhaar)
      ) {
        return res.status(400).json({
          success: false,
          message: "Your KYC is already approved and verified",
        });
      }
    }

    // =================================================
    // UPLOAD AADHAAR FRONT
    // =================================================

    let aadhaarFrontUpload = null;

    if (aadhaarFront) {
      try {
        aadhaarFrontUpload = await uploadToImgBB(aadhaarFront);
      } catch (error) {
        console.error("Aadhaar front ImgBB error:", error.message);

        return res.status(500).json({
          success: false,
          message: "Failed to upload Aadhaar front image",
        });
      }
    }

    // =================================================
    // UPLOAD AADHAAR BACK
    // =================================================

    let aadhaarBackUpload = null;

    if (aadhaarBack) {
      try {
        aadhaarBackUpload = await uploadToImgBB(aadhaarBack);
      } catch (error) {
        console.error("Aadhaar back ImgBB error:", error.message);

        return res.status(500).json({
          success: false,
          message: "Failed to upload Aadhaar back image",
        });
      }
    }

    // =================================================
    // UPLOAD PAN
    // =================================================

    let panUpload = null;

    if (panFront) {
      try {
        panUpload = await uploadToImgBB(panFront);
      } catch (error) {
        console.error("PAN ImgBB error:", error.message);

        return res.status(500).json({
          success: false,
          message: "Failed to upload PAN image",
        });
      }
    }

    // =================================================
    // UPLOAD SELFIE
    // =================================================

    let selfieUpload = null;

    if (selfie) {
      try {
        selfieUpload = await uploadToImgBB(selfie);
      } catch (error) {
        console.error("Selfie ImgBB error:", error.message);

        return res.status(500).json({
          success: false,
          message: "Failed to upload selfie",
        });
      }
    }

    // =================================================
    // CREATE KYC OBJECT IF NOT EXISTS
    // =================================================

    if (!kyc) {
      kyc = new KycDocument({
        userId,
      });
    }

    // =================================================
    // DOB
    // =================================================

    if (parsedDob) {
      kyc.dob = parsedDob;
    }

    // =================================================
    // SELFIE
    // =================================================

    if (selfieUpload) {
      kyc.selfie = {
        url: selfieUpload.imageUrl,
        publicId: selfieUpload.deleteUrl,
      };
    }

    // =================================================
    // AADHAAR
    // =================================================

    if (aadhaarFrontUpload) {
      kyc.aadhaar.front = {
        url: aadhaarFrontUpload.imageUrl,
        publicId: aadhaarFrontUpload.deleteUrl,
      };
    }

    if (aadhaarBackUpload) {
      kyc.aadhaar.back = {
        url: aadhaarBackUpload.imageUrl,
        publicId: aadhaarBackUpload.deleteUrl,
      };
    }

    // If Aadhaar is uploaded/re-uploaded,
    // reset its review status
    if (aadhaarFrontUpload || aadhaarBackUpload) {
      kyc.aadhaar.review = {
        status: "pending",
        rejectionReason: null,
        reviewedBy: null,
        reviewedAt: null,
      };
    }

    // =================================================
    // PAN
    // =================================================

    if (panUpload) {
      kyc.pan.front = {
        url: panUpload.imageUrl,
        publicId: panUpload.deleteUrl,
      };

      // Reset PAN review
      kyc.pan.review = {
        status: "pending",
        rejectionReason: null,
        reviewedBy: null,
        reviewedAt: null,
      };
    }

    // =================================================
    // SAVE
    // =================================================

    await kyc.save();

    // Reset user KYC verification status until reviewed
    await User.findByIdAndUpdate(userId, {
      isKycVerified: false,
    });

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,
      message: "KYC details uploaded successfully",
      data: kyc,
    });
  } catch (error) {
    console.error("Upload KYC Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// HELPER: CALCULATE USER OVERALL KYC STATUS
// =====================================================

const getDocOverallStatus = (kyc) => {
  if (!kyc) return "none";

  const hasAadhaar = Boolean(
    kyc.aadhaar?.front?.url && kyc.aadhaar?.back?.url,
  );
  const hasPan = Boolean(kyc.pan?.front?.url);
  const hasSelfie = Boolean(kyc.selfie?.url);

  const submittedStatuses = [];
  if (hasAadhaar) {
    submittedStatuses.push(kyc.aadhaar?.review?.status || "pending");
  }
  if (hasPan) {
    submittedStatuses.push(kyc.pan?.review?.status || "pending");
  }

  if (submittedStatuses.length === 0) {
    if (hasSelfie || kyc.dob) return "incomplete";
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
// GET MY KYC
// GET /api/kyc/my
// =====================================================

exports.getMyKyc = async (req, res) => {
  try {
    const userId = req.user.id;

    const kyc = await KycDocument.findOne({
      userId,
    })
      .populate("userId", "name email mobile isKycVerified")
      .populate("aadhaar.review.reviewedBy", "name email")
      .populate("pan.review.reviewedBy", "name email");

    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: "KYC not found",
      });
    }

    const overallStatus = getDocOverallStatus(kyc);
    const rejectionReasons = [
      kyc.aadhaar?.review?.rejectionReason,
      kyc.pan?.review?.rejectionReason,
    ].filter(Boolean);

    return res.status(200).json({
      success: true,
      data: {
        ...kyc.toObject(),
        status: overallStatus,
        rejectionReason:
          [...new Set(rejectionReasons)].join(" • ") || null,
      },
    });
  } catch (error) {
    console.error("Get My KYC Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// GET KYC STATUS
// GET /api/kyc/status
// =====================================================

exports.getKycStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const kyc = await KycDocument.findOne({
      userId,
    }).select("dob selfie aadhaar pan createdAt updatedAt");

    if (!kyc) {
      return res.status(200).json({
        success: true,
        data: {
          exists: false,
          status: "none",
          dob: null,
          selfie: null,
          aadhaar: null,
          pan: null,
        },
      });
    }

    const overallStatus = getDocOverallStatus(kyc);
    const rejectionReasons = [
      kyc.aadhaar?.review?.rejectionReason,
      kyc.pan?.review?.rejectionReason,
    ].filter(Boolean);

    return res.status(200).json({
      success: true,
      data: {
        exists: true,
        status: overallStatus,
        rejectionReason:
          [...new Set(rejectionReasons)].join(" • ") || null,

        dob: kyc.dob,

        selfie: kyc.selfie
          ? {
              url: kyc.selfie.url,
            }
          : null,

        aadhaar: kyc.aadhaar
          ? {
              front: kyc.aadhaar.front
                ? {
                    url: kyc.aadhaar.front.url,
                  }
                : null,

              back: kyc.aadhaar.back
                ? {
                    url: kyc.aadhaar.back.url,
                  }
                : null,

              status: kyc.aadhaar.review?.status || "pending",

              rejectionReason: kyc.aadhaar.review?.rejectionReason || null,
            }
          : null,

        pan: kyc.pan
          ? {
              front: kyc.pan.front
                ? {
                    url: kyc.pan.front.url,
                  }
                : null,

              status: kyc.pan.review?.status || "pending",

              rejectionReason: kyc.pan.review?.rejectionReason || null,
            }
          : null,

        createdAt: kyc.createdAt,
        updatedAt: kyc.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get KYC Status Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
