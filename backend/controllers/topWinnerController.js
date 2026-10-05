const TopWinner = require("../models/TopWinner");
const uploadToImgBB = require("../utils/imgbbUpload");

// =====================================================
// CREATE TOP WINNER
// =====================================================

exports.createTopWinner = async (req, res) => {
  try {
    const {
      name,
      ticketNumber,
      winningAmount,
      wonAt,
      isActive,
    } = req.body;

    // -----------------------------------------------
    // VALIDATION
    // -----------------------------------------------

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Winner name is required",
      });
    }

    if (!ticketNumber || !ticketNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: "Ticket number is required",
      });
    }

    if (
      winningAmount === undefined ||
      winningAmount === null ||
      winningAmount === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Winning amount is required",
      });
    }

    if (!wonAt) {
      return res.status(400).json({
        success: false,
        message: "Winning date and time is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Winner image is required",
      });
    }

    // -----------------------------------------------
    // VALIDATE AMOUNT
    // -----------------------------------------------

    const amount = Number(winningAmount);

    if (Number.isNaN(amount) || amount < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid winning amount",
      });
    }

    // -----------------------------------------------
    // VALIDATE DATE
    // -----------------------------------------------

    const winningDate = new Date(wonAt);

    if (Number.isNaN(winningDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid winning date/time",
      });
    }

    // -----------------------------------------------
    // UPLOAD IMAGE TO IMGBB
    // -----------------------------------------------

    let uploadedImage;

    try {
      uploadedImage = await uploadToImgBB(
        req.file.buffer,
        req.file.originalname
      );
    } catch (uploadError) {
      console.error("Top Winner ImgBB Error:", uploadError);

      return res.status(500).json({
        success: false,
        message: "Winner image upload failed",
        error: uploadError.message,
      });
    }

    // -----------------------------------------------
    // CREATE WINNER
    // -----------------------------------------------

    const winner = await TopWinner.create({
      name: name.trim(),

      image:
        uploadedImage.displayUrl ||
        uploadedImage.imageUrl,

      ticketNumber: ticketNumber.trim(),

      winningAmount: amount,

      wonAt: winningDate,

      isActive:
        isActive === undefined
          ? true
          : String(isActive) === "true",
    });

    return res.status(201).json({
      success: true,
      message: "Top winner created successfully",
      data: winner,
    });
  } catch (error) {
    console.error("Create Top Winner Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create top winner",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL TOP WINNERS - ADMIN
// =====================================================

exports.getAllTopWinners = async (req, res) => {
  try {
    const winners = await TopWinner.find()
      .sort({ wonAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: winners.length,
      data: winners,
    });
  } catch (error) {
    console.error("Get Top Winners Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch top winners",
      error: error.message,
    });
  }
};

// =====================================================
// GET ACTIVE TOP WINNERS - PUBLIC
// =====================================================

exports.getActiveTopWinners = async (req, res) => {
  try {
    const winners = await TopWinner.find({
      isActive: true,
    })
      .sort({ wonAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: winners.length,
      data: winners,
    });
  } catch (error) {
    console.error("Get Active Top Winners Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch top winners",
      error: error.message,
    });
  }
};

// =====================================================
// GET SINGLE TOP WINNER
// =====================================================

exports.getTopWinnerById = async (req, res) => {
  try {
    const { id } = req.params;

    const winner = await TopWinner.findById(id);

    if (!winner) {
      return res.status(404).json({
        success: false,
        message: "Top winner not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: winner,
    });
  } catch (error) {
    console.error("Get Top Winner Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch top winner",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE TOP WINNER
// =====================================================

exports.updateTopWinner = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      ticketNumber,
      winningAmount,
      wonAt,
      isActive,
    } = req.body;

    const winner = await TopWinner.findById(id);

    if (!winner) {
      return res.status(404).json({
        success: false,
        message: "Top winner not found",
      });
    }

    // -----------------------------------------------
    // UPDATE NAME
    // -----------------------------------------------

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Winner name cannot be empty",
        });
      }

      winner.name = name.trim();
    }

    // -----------------------------------------------
    // UPDATE TICKET
    // -----------------------------------------------

    if (ticketNumber !== undefined) {
      if (!ticketNumber.trim()) {
        return res.status(400).json({
          success: false,
          message: "Ticket number cannot be empty",
        });
      }

      winner.ticketNumber = ticketNumber.trim();
    }

    // -----------------------------------------------
    // UPDATE AMOUNT
    // -----------------------------------------------

    if (
      winningAmount !== undefined &&
      winningAmount !== ""
    ) {
      const amount = Number(winningAmount);

      if (Number.isNaN(amount) || amount < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid winning amount",
        });
      }

      winner.winningAmount = amount;
    }

    // -----------------------------------------------
    // UPDATE DATE/TIME
    // -----------------------------------------------

    if (wonAt !== undefined && wonAt !== "") {
      const winningDate = new Date(wonAt);

      if (Number.isNaN(winningDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid winning date/time",
        });
      }

      winner.wonAt = winningDate;
    }

    // -----------------------------------------------
    // UPDATE ACTIVE STATUS
    // -----------------------------------------------

    if (isActive !== undefined) {
      winner.isActive = String(isActive) === "true";
    }

    // -----------------------------------------------
    // UPDATE IMAGE
    // -----------------------------------------------

    if (req.file) {
      try {
        const uploadedImage = await uploadToImgBB(
          req.file.buffer,
          req.file.originalname
        );

        winner.image =
          uploadedImage.displayUrl ||
          uploadedImage.imageUrl;
      } catch (uploadError) {
        console.error(
          "Update Winner ImgBB Error:",
          uploadError
        );

        return res.status(500).json({
          success: false,
          message: "Winner image upload failed",
          error: uploadError.message,
        });
      }
    }

    await winner.save();

    return res.status(200).json({
      success: true,
      message: "Top winner updated successfully",
      data: winner,
    });
  } catch (error) {
    console.error("Update Top Winner Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update top winner",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE TOP WINNER
// =====================================================

exports.deleteTopWinner = async (req, res) => {
  try {
    const { id } = req.params;

    const winner = await TopWinner.findById(id);

    if (!winner) {
      return res.status(404).json({
        success: false,
        message: "Top winner not found",
      });
    }

    await TopWinner.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Top winner deleted successfully",
    });
  } catch (error) {
    console.error("Delete Top Winner Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete top winner",
      error: error.message,
    });
  }
};

// =====================================================
// TOGGLE ACTIVE STATUS
// =====================================================

exports.toggleTopWinnerStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const winner = await TopWinner.findById(id);

    if (!winner) {
      return res.status(404).json({
        success: false,
        message: "Top winner not found",
      });
    }

    winner.isActive = !winner.isActive;

    await winner.save();

    return res.status(200).json({
      success: true,
      message: `Winner ${
        winner.isActive ? "activated" : "deactivated"
      } successfully`,
      data: winner,
    });
  } catch (error) {
    console.error("Toggle Winner Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to change winner status",
      error: error.message,
    });
  }
};