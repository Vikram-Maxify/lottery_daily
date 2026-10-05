const KycDocument = require("../models/KycDocument");
const uploadToImgBB = require("../utils/imgbbUpload");

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
    // Get uploaded files (memory storage => req.files)
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
      return res.status(400).json({
        success: false,
        message: "Please upload Aadhaar back image",
      });
    }

    // -------------------------------------------------
    // PAN should NOT have back
    // -------------------------------------------------

    if (documentType === "pan" && backFile) {
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
    // Already approved -> block re-upload
    // -------------------------------------------------

    if (existingDocument?.status === "approved") {
      return res.status(400).json({
        success: false,
        message: `${documentType.toUpperCase()} is already approved`,
      });
    }

    // -------------------------------------------------
    // Upload FRONT image to ImgBB
    // -------------------------------------------------

    let frontUpload;

    try {
      frontUpload = await uploadToImgBB(
        frontFile.buffer,
        frontFile.originalname
      );
    } catch (err) {
      console.error("ImgBB front upload error:", err.message);

      return res.status(500).json({
        success: false,
        message: "Failed to upload front document to ImgBB",
      });
    }

    // -------------------------------------------------
    // Upload BACK image to ImgBB (Aadhaar only)
    // -------------------------------------------------

    let backUpload = null;

    if (backFile) {
      try {
        backUpload = await uploadToImgBB(
          backFile.buffer,
          backFile.originalname
        );
      } catch (err) {
        console.error("ImgBB back upload error:", err.message);

        return res.status(500).json({
          success: false,
          message: "Failed to upload back document to ImgBB",
        });
      }
    }

    // -------------------------------------------------
    // Prepare URLs
    // -------------------------------------------------

    const documentUrl = frontUpload.url;
    const documentPublicId = frontUpload.id; // ImgBB image id (used as deletehash/id)

    const backDocumentUrl = backUpload ? backUpload.url : null;
    const backDocumentPublicId = backUpload ? backUpload.id : null;

    // -------------------------------------------------
    // Update existing document
    // -------------------------------------------------

    if (existingDocument) {
      existingDocument.documentUrl = documentUrl;
      existingDocument.documentPublicId = documentPublicId;

      existingDocument.backDocumentUrl = backDocumentUrl;
      existingDocument.backDocumentPublicId = backDocumentPublicId;

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
      documentPublicId,

      // Back - Aadhaar only
      backDocumentUrl,
      backDocumentPublicId,

      status: "pending",
    });

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