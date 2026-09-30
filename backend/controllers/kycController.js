const KycDocument = require("../models/KycDocument");
const fs = require("fs");
const path = require("path");

// =====================================================
// UPLOAD KYC DOCUMENT
// POST /api/kyc/upload
// =====================================================

exports.uploadKycDocument = async (req, res) => {
  try {
    const userId = req.user._id;

    const { documentType } = req.body;

    if (!documentType) {
      return res.status(400).json({
        success: false,
        message: "Document type is required",
      });
    }

    if (!["aadhaar", "pan"].includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document type",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload document",
      });
    }

    // Check existing document
    const existingDocument = await KycDocument.findOne({
      userId,
      documentType,
    });

    // If already approved, don't allow replacement
    if (existingDocument?.status === "approved") {
      // Remove newly uploaded file
      fs.unlinkSync(req.file.path);

      return res.status(400).json({
        success: false,
        message: `${documentType.toUpperCase()} is already approved`,
      });
    }

    // Delete old local file if replacing rejected/pending document
    if (
      existingDocument &&
      existingDocument.documentUrl
    ) {
      const oldPath = path.join(
        __dirname,
        "..",
        existingDocument.documentUrl
      );

      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const documentUrl = `/uploads/kyc/${req.file.filename}`;

    let document;

    if (existingDocument) {
      existingDocument.documentUrl = documentUrl;
      existingDocument.documentPublicId = null;
      existingDocument.status = "pending";
      existingDocument.rejectionReason = null;
      existingDocument.reviewedBy = null;
      existingDocument.reviewedAt = null;

      document = await existingDocument.save();
    } else {
      document = await KycDocument.create({
        userId,
        documentType,
        documentUrl,
        status: "pending",
      });
    }

    return res.status(201).json({
      success: true,
      message: `${documentType.toUpperCase()} uploaded successfully`,
      data: document,
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
// GET MY KYC
// GET /api/kyc/my
// =====================================================

exports.getMyKyc = async (req, res) => {
  try {
    const documents = await KycDocument.find({
      userId: req.user._id,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error("Get My KYC Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};