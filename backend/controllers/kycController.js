const KycDocument = require("../models/KycDocument");
const fs = require("fs");
const path = require("path");

// =====================================================
// DELETE LOCAL FILE SAFELY
// =====================================================

const deleteFile = (filePath) => {
  try {
    if (!filePath) return;

    const fullPath = path.join(__dirname, "..", filePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (error) {
    console.error("File delete error:", error.message);
  }
};

// =====================================================
// UPLOAD KYC DOCUMENT
// POST /api/kyc/upload
//
// Aadhaar:
//   front = Aadhaar front
//   back  = Aadhaar back
//
// PAN:
//   front = PAN card
// =====================================================

exports.uploadKycDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const { documentType } = req.body;

    // -------------------------------------------------
    // Validate document type
    // -------------------------------------------------

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

    // -------------------------------------------------
    // Get uploaded files
    // -------------------------------------------------

    const frontFile = req.files?.front?.[0];
    const backFile = req.files?.back?.[0];

    // -------------------------------------------------
    // Front document required for both
    // -------------------------------------------------

    if (!frontFile) {
      return res.status(400).json({
        success: false,
        message:
          documentType === "aadhaar"
            ? "Please upload Aadhaar front image"
            : "Please upload PAN card image",
      });
    }

    // -------------------------------------------------
    // Aadhaar back is also required
    // -------------------------------------------------

    if (documentType === "aadhaar" && !backFile) {
      // Delete front because request is incomplete
      deleteFile(`/uploads/kyc/${frontFile.filename}`);

      return res.status(400).json({
        success: false,
        message: "Please upload Aadhaar back image",
      });
    }

    // -------------------------------------------------
    // PAN should NOT have back
    // -------------------------------------------------

    if (documentType === "pan" && backFile) {
      deleteFile(`/uploads/kyc/${frontFile.filename}`);
      deleteFile(`/uploads/kyc/${backFile.filename}`);

      return res.status(400).json({
        success: false,
        message: "PAN does not require back document",
      });
    }

    // -------------------------------------------------
    // Check existing document
    // -------------------------------------------------

    const existingDocument = await KycDocument.findOne({
      userId,
      documentType,
    });

    // -------------------------------------------------
    // Already approved
    // -------------------------------------------------

    if (existingDocument?.status === "approved") {
      deleteFile(`/uploads/kyc/${frontFile.filename}`);

      if (backFile) {
        deleteFile(`/uploads/kyc/${backFile.filename}`);
      }

      return res.status(400).json({
        success: false,
        message: `${documentType.toUpperCase()} is already approved`,
      });
    }

    // -------------------------------------------------
    // New file URLs
    // -------------------------------------------------

    const documentUrl = `/uploads/kyc/${frontFile.filename}`;

    const backDocumentUrl = backFile
      ? `/uploads/kyc/${backFile.filename}`
      : null;

    // -------------------------------------------------
    // Delete old files if replacing document
    // -------------------------------------------------

    if (existingDocument) {
      if (existingDocument.documentUrl) {
        deleteFile(existingDocument.documentUrl);
      }

      if (existingDocument.backDocumentUrl) {
        deleteFile(existingDocument.backDocumentUrl);
      }

      // -------------------------------------------------
      // Update existing document
      // -------------------------------------------------

      existingDocument.documentUrl = documentUrl;
      existingDocument.documentPublicId = null;

      existingDocument.backDocumentUrl = backDocumentUrl;
      existingDocument.backDocumentPublicId = null;

      existingDocument.status = "pending";
      existingDocument.rejectionReason = null;
      existingDocument.reviewedBy = null;
      existingDocument.reviewedAt = null;

      const document = await existingDocument.save();

      return res.status(200).json({
        success: true,
        message: `${documentType.toUpperCase()} uploaded successfully`,
        data: document,
      });
    }

    // -------------------------------------------------
    // Create new document
    // -------------------------------------------------

    const document = await KycDocument.create({
      userId,
      documentType,

      // Front
      documentUrl,
      documentPublicId: null,

      // Back - Aadhaar only
      backDocumentUrl,
      backDocumentPublicId: null,

      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: `${documentType.toUpperCase()} uploaded successfully`,
      data: document,
    });
  } catch (error) {
    console.error("Upload KYC Error:", error);

    // Cleanup uploaded files if DB operation fails
    if (req.files?.front?.[0]) {
      deleteFile(`/uploads/kyc/${req.files.front[0].filename}`);
    }

    if (req.files?.back?.[0]) {
      deleteFile(`/uploads/kyc/${req.files.back[0].filename}`);
    }

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
    const userId = req.user.id;

    const documents = await KycDocument.find({
      userId,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: documents.length,
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