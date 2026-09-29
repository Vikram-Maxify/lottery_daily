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

        // ✅ Embedded bank details (har request ke saath)
        bankDetail: {
            accountHolderName: { type: String, required: true, trim: true },
            accountNumber:     { type: String, required: true, trim: true },
            ifscCode:          { type: String, required: true, trim: true, uppercase: true },
            bankName:          { type: String, required: true, trim: true },
            branchName:        { type: String, trim: true },
            upiId:             { type: String, trim: true },
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