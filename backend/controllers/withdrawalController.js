const mongoose = require("mongoose");
const Withdrawal = require("../models/Withdrawal");
const User = require("../models/userModel");

// ======================================================
// HELPER: GET USER ID FROM AUTH MIDDLEWARE
// ======================================================
const getUserId = (req) => {
    return (
        req.user?.id ||
        req.user?._id ||
        req.user?.userId ||
        req.user?.uuid ||
        null
    );
};

// ======================================================
// HELPER: VALIDATE OBJECT ID
// ======================================================
const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// ======================================================
// USER
// CREATE WITHDRAWAL
// ======================================================
exports.createWithdrawal = async (req, res) => {
    const userId = getUserId(req);

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "User authentication required",
        });
    }

    if (!isValidObjectId(userId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid user ID",
        });
    }

    const {
        amount,
        accountHolderName,
        accountNumber,
        ifscCode,
        bankName,
        branchName,
        upiId,
    } = req.body;

    try {
        // ==================================================
        // VALIDATION
        // ==================================================

        const amt = Number(amount);

        if (!Number.isFinite(amt) || amt <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid withdrawal amount",
            });
        }

        if (!accountHolderName?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Account holder name is required",
            });
        }

        if (!accountNumber?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Account number is required",
            });
        }

        if (!ifscCode?.trim()) {
            return res.status(400).json({
                success: false,
                message: "IFSC code is required",
            });
        }

        if (!bankName?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Bank name is required",
            });
        }

        // ==================================================
        // ATOMIC WALLET DEDUCTION
        //
        // wallet >= amount condition ensures:
        // 1. User exists
        // 2. Balance is sufficient
        // 3. Concurrent withdrawals cannot overspend
        // ==================================================

        const user = await User.findOneAndUpdate(
            {
                _id: userId,
                wallet: { $gte: amt },
            },
            {
                $inc: {
                    wallet: -amt,
                },
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!user) {
            // Check whether user exists
            const existingUser = await User.findById(userId)
                .select("_id wallet")
                .lean();

            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            return res.status(400).json({
                success: false,
                message: "Insufficient wallet balance",
                balance: Number(existingUser.wallet || 0),
                requestedAmount: amt,
            });
        }

        // ==================================================
        // CREATE WITHDRAWAL
        // ==================================================

        let withdrawal;

        try {
            withdrawal = await Withdrawal.create({
                user: user._id,
                amount: amt,

                bankDetail: {
                    accountHolderName: accountHolderName.trim(),
                    accountNumber: accountNumber.trim(),
                    ifscCode: ifscCode.trim().toUpperCase(),
                    bankName: bankName.trim(),
                    branchName: branchName?.trim() || "",
                    upiId: upiId?.trim() || "",
                },

                status: "pending",
            });
        } catch (createError) {
            // ==================================================
            // IMPORTANT:
            // If withdrawal creation fails after wallet deduction,
            // refund the amount.
            // ==================================================

            await User.findByIdAndUpdate(user._id, {
                $inc: {
                    wallet: amt,
                },
            });

            throw createError;
        }

        // ==================================================
        // SUCCESS
        // ==================================================

        return res.status(201).json({
            success: true,
            message: "Withdrawal request submitted successfully",
            data: withdrawal,
            walletBalance: Number(user.wallet || 0),
        });
    } catch (error) {
        console.error("CREATE WITHDRAWAL ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create withdrawal",
        });
    }
};

// ======================================================
// USER
// GET MY WITHDRAWALS
// ======================================================
exports.getMyWithdrawals = async (req, res) => {
    try {
        const userId = getUserId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User authentication required",
            });
        }

        if (!isValidObjectId(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID",
            });
        }

        const withdrawals = await Withdrawal.find({
            user: userId,
        })
            .sort({
                createdAt: -1,
            })
            .lean();

        return res.status(200).json({
            success: true,
            count: withdrawals.length,
            data: withdrawals,
        });
    } catch (error) {
        console.error("GET MY WITHDRAWALS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch withdrawals",
        });
    }
};

// ======================================================
// USER
// GET SINGLE WITHDRAWAL
// ======================================================
exports.getMyWithdrawalById = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User authentication required",
            });
        }

        if (!isValidObjectId(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID",
            });
        }

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid withdrawal ID",
            });
        }

        const withdrawal = await Withdrawal.findOne({
            _id: id,
            user: userId,
        }).lean();

        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: "Withdrawal not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: withdrawal,
        });
    } catch (error) {
        console.error("GET WITHDRAWAL ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch withdrawal",
        });
    }
};

// ======================================================
// ADMIN
// GET ALL WITHDRAWALS
// ======================================================
exports.getAllWithdrawals = async (req, res) => {
    try {
        const {
            status,
            page = 1,
            limit = 20,
        } = req.query;

        // ==================================================
        // PAGINATION
        // ==================================================

        const pageNum = Math.max(
            1,
            parseInt(page, 10) || 1
        );

        const limitNum = Math.min(
            100,
            Math.max(
                1,
                parseInt(limit, 10) || 20
            )
        );

        // ==================================================
        // FILTER
        // ==================================================

        const filter = {};

        if (status) {
            const allowedStatuses = [
                "pending",
                "approved",
                "rejected",
            ];

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid withdrawal status",
                });
            }

            filter.status = status;
        }

        const skip = (pageNum - 1) * limitNum;

        // ==================================================
        // FETCH
        // ==================================================

        const [withdrawals, total] = await Promise.all([
            Withdrawal.find(filter)
                .populate(
                    "user",
                    "name mobile uuid wallet"
                )
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limitNum)
                .lean(),

            Withdrawal.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            data: withdrawals,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error("GET ALL WITHDRAWALS ERROR:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to fetch withdrawals",
        });
    }
};

// ======================================================
// ADMIN
// GET SINGLE WITHDRAWAL
// ======================================================
exports.getWithdrawalById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid withdrawal ID",
            });
        }

        const withdrawal = await Withdrawal.findById(id)
            .populate(
                "user",
                "name mobile uuid wallet"
            )
            .populate(
                "processedBy",
                "name mobile uuid"
            )
            .lean();

        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: "Withdrawal not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: withdrawal,
        });
    } catch (error) {
        console.error("GET WITHDRAWAL BY ID ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch withdrawal",
        });
    }
};

// ======================================================
// ADMIN
// APPROVE / REJECT WITHDRAWAL
// ======================================================
exports.updateWithdrawalStatus = async (req, res) => {
    const adminId = getUserId(req);

    if (!adminId) {
        return res.status(401).json({
            success: false,
            message: "Admin authentication required",
        });
    }

    const { id } = req.params;

    const {
        status,
        adminRemark,
        transactionId,
    } = req.body;

    // ==================================================
    // VALIDATE
    // ==================================================

    if (!isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid withdrawal ID",
        });
    }

    if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({
            success: false,
            message:
                "Status must be either approved or rejected",
        });
    }

    // ==================================================
    // TRANSACTION
    // ==================================================

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        // ==================================================
        // FIND PENDING WITHDRAWAL
        // ==================================================

        const withdrawal = await Withdrawal.findOne({
            _id: id,
            status: "pending",
        }).session(session);

        if (!withdrawal) {
            throw new Error(
                "Withdrawal not found or already processed"
            );
        }

        // ==================================================
        // APPROVED
        // ==================================================

        if (status === "approved") {
            withdrawal.status = "approved";
        }

        // ==================================================
        // REJECTED
        // REFUND MONEY TO USER
        // ==================================================

        if (status === "rejected") {
            const refundedUser =
                await User.findByIdAndUpdate(
                    withdrawal.user,
                    {
                        $inc: {
                            wallet: withdrawal.amount,
                        },
                    },
                    {
                        new: true,
                        session,
                        runValidators: true,
                    }
                );

            if (!refundedUser) {
                throw new Error(
                    "User not found. Refund failed."
                );
            }

            withdrawal.status = "rejected";
        }

        // ==================================================
        // ADMIN DETAILS
        // ==================================================

        withdrawal.adminRemark =
            typeof adminRemark === "string"
                ? adminRemark.trim()
                : "";

        withdrawal.transactionId =
            typeof transactionId === "string"
                ? transactionId.trim()
                : "";

        withdrawal.processedBy = adminId;
        withdrawal.processedAt = new Date();

        await withdrawal.save({
            session,
        });

        // ==================================================
        // COMMIT
        // ==================================================

        await session.commitTransaction();

        return res.status(200).json({
            success: true,
            message:
                status === "approved"
                    ? "Withdrawal approved successfully"
                    : "Withdrawal rejected and amount refunded successfully",
            data: withdrawal,
        });
    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        console.error(
            "UPDATE WITHDRAWAL STATUS ERROR:",
            error
        );

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                "Failed to update withdrawal",
        });
    } finally {
        await session.endSession();
    }
};