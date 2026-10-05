const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        uuid: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        mobile: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
            select: false,
        },
        role: {
            type: String,
            enum: ['admin', 'user'],
            default: 'user',
        },
        wallet: {
            type: Number,
            default: 0,
            min: 0,
        },
        isKycVerified: {
            type: Boolean,
            default: false,
        },

        profileImage: {
            type: String,
            default: null,
        },

        // 🔥 Referral System
        referralCode: {
            type: String,
            unique: true,
            index: true,
            required: true,
            uppercase: true,
            trim: true,
        },

        referralBy: {
            type: String, // stores the referralCode of the user who referred this user
            default: null,
            index: true,
            uppercase: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);

module.exports = User;