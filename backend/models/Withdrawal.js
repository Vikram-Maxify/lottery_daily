const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        amount: {
            type: Number,
            required: true,
            min: 1,
        },

        // ✅ Kis method se withdraw kar raha hai
        paymentMethod: {
            type: String,
            enum: ["bank", "upi"],
            required: true,
        },

        // ✅ Embedded payment details
        bankDetail: {
            accountHolderName: {
                type: String,
                trim: true,
                required: function () {
                    return this.paymentMethod === "bank";
                },
            },
            accountNumber: {
                type: String,
                trim: true,
                required: function () {
                    return this.paymentMethod === "bank";
                },
            },
            ifscCode: {
                type: String,
                trim: true,
                uppercase: true,
                required: function () {
                    return this.paymentMethod === "bank";
                },
            },
            bankName: {
                type: String,
                trim: true,
                required: function () {
                    return this.paymentMethod === "bank";
                },
            },
            branchName: { type: String, trim: true },

            // ✅ UPI sirf tab required jab paymentMethod === "upi"
            upiId: {
                type: String,
                trim: true,
                required: function () {
                    return this.paymentMethod === "upi";
                },
            },
        },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
            index: true,
        },

        adminRemark:   { type: String, default: "" },
        transactionId: { type: String, default: "" },
        processedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        processedAt:   { type: Date },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Withdrawal", withdrawalSchema);