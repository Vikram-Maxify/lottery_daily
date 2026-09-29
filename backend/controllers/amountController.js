const Amount = require("../models/amountModel");

// =======================
// ADMIN: UPDATE AMOUNT
// =======================
const updateAmount = async (req, res) => {
  try {
    const { amount } = req.body;

    if (amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: "Amount is required",
      });
    }

    if (isNaN(amount) || Number(amount) < 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a valid positive number",
      });
    }

    // req.user.uuid JWT middleware se aa sakta hai
    const updatedBy = req.user?.uuid || null;

    let amountData = await Amount.findOne();

    if (!amountData) {
      amountData = await Amount.create({
        amount: Number(amount),
        updatedBy,
      });
    } else {
      amountData.amount = Number(amount);
      amountData.updatedBy = updatedBy;

      await amountData.save();
    }

    return res.status(200).json({
      success: true,
      message: "Amount updated successfully",
      data: {
        amount: amountData.amount,
        updatedAt: amountData.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update Amount Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// =======================
// USER: GET AMOUNT
// =======================
const getAmount = async (req, res) => {
  try {
    const amountData = await Amount.findOne().select(
      "amount updatedAt"
    );

    if (!amountData) {
      return res.status(200).json({
        success: true,
        message: "Amount fetched successfully",
        data: {
          amount: 0,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Amount fetched successfully",
      data: {
        amount: amountData.amount,
        updatedAt: amountData.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get Amount Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  updateAmount,
  getAmount,
};