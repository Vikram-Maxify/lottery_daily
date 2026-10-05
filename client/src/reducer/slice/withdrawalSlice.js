import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";

const API = "/withdrawal";

// ======================================================
// CREATE WITHDRAWAL
// Controller: exports.createWithdrawal
// Expects: { amount, paymentMethod ('bank' | 'upi'), accountHolderName, accountNumber, ifscCode, bankName, branchName, upiId }
// Returns: { success: true, message: "...", data: withdrawal, walletBalance: Number }
// ======================================================

export const createWithdrawal = createAsyncThunk(
    "withdrawal/create",
    async (payload, { rejectWithValue }) => {
        try {
            const { data } = await api.post(
                API,
                payload,
                {
                    withCredentials: true,
                }
            );

            // Backend returns { success: true, message, data: withdrawal, walletBalance }
            return data;
        } catch (err) {
            const resData = err?.response?.data;
            const message =
                resData?.message ||
                err?.message ||
                "Failed to create withdrawal";

            return rejectWithValue({
                message,
                kycVerified: resData?.kycVerified,
                balance: resData?.balance,
                requestedAmount: resData?.requestedAmount,
                status: err?.response?.status,
            });
        }
    }
);

// ======================================================
// FETCH MY WITHDRAWALS
// Controller: exports.getMyWithdrawals
// Returns: { success: true, count: Number, data: Array }
// ======================================================

export const fetchMyWithdrawals = createAsyncThunk(
    "withdrawal/fetchMine",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get(
                `${API}/me`,
                {
                    withCredentials: true,
                }
            );

            return data;
        } catch (err) {
            return rejectWithValue(
                err?.response?.data?.message ||
                err?.message ||
                "Failed to fetch withdrawals"
            );
        }
    }
);

// ======================================================
// FETCH ALL WITHDRAWALS - ADMIN
// Controller: exports.getAllWithdrawals
// Returns: { success: true, data: Array, pagination: Object }
// ======================================================

export const fetchAllWithdrawals = createAsyncThunk(
    "withdrawal/fetchAll",
    async (
        { status, page = 1, limit = 20 } = {},
        { rejectWithValue }
    ) => {
        try {
            const { data } = await api.get(
                `${API}/admin/all`,
                {
                    params: {
                        status,
                        page,
                        limit,
                    },
                    withCredentials: true,
                }
            );

            return data;
        } catch (err) {
            return rejectWithValue(
                err?.response?.data?.message ||
                err?.message ||
                "Failed to fetch withdrawals"
            );
        }
    }
);

// ======================================================
// UPDATE WITHDRAWAL STATUS - ADMIN
// Controller: exports.updateWithdrawalStatus
// Returns: { success: true, message: "...", data: withdrawal }
// ======================================================

export const updateWithdrawalStatus =
    createAsyncThunk(
        "withdrawal/updateStatus",
        async (
            {
                id,
                status,
                adminRemark,
                transactionId,
            },
            { rejectWithValue }
        ) => {
            try {
                const { data } = await api.patch(
                    `${API}/admin/${id}`,
                    {
                        status,
                        adminRemark,
                        transactionId,
                    },
                    {
                        withCredentials: true,
                    }
                );

                return data;
            } catch (err) {
                return rejectWithValue(
                    err?.response?.data?.message ||
                    err?.message ||
                    "Failed to update withdrawal"
                );
            }
        }
    );

// ======================================================
// INITIAL STATE
// ======================================================

const initialState = {
    myWithdrawals: [],
    allWithdrawals: [],

    pagination: null,

    loading: false,
    myWithdrawalsLoading: false,
    allWithdrawalsLoading: false,
    updateStatusLoading: false,

    error: null,
    errorDetails: null,
    kycRequired: false,
    successMessage: null,
    walletBalance: null,

    myWithdrawalsError: null,
    allWithdrawalsError: null,
    updateStatusError: null,

    success: false,
};

// ======================================================
// SLICE
// ======================================================

const withdrawalSlice = createSlice({
    name: "withdrawal",

    initialState,

    reducers: {
        // --------------------------------------------------
        // RESET GENERAL STATE
        // --------------------------------------------------

        resetWithdrawalState: (state) => {
            state.success = false;
            state.error = null;
            state.errorDetails = null;
            state.kycRequired = false;
            state.successMessage = null;
        },

        // --------------------------------------------------
        // CLEAR MY WITHDRAWALS
        // --------------------------------------------------

        clearMyWithdrawals: (state) => {
            state.myWithdrawals = [];
            state.myWithdrawalsError = null;
        },

        // --------------------------------------------------
        // CLEAR ALL WITHDRAWALS
        // --------------------------------------------------

        clearAllWithdrawals: (state) => {
            state.allWithdrawals = [];
            state.pagination = null;
            state.allWithdrawalsError = null;
        },

        // --------------------------------------------------
        // CLEAR ERRORS
        // --------------------------------------------------

        clearWithdrawalErrors: (state) => {
            state.error = null;
            state.errorDetails = null;
            state.kycRequired = false;
            state.myWithdrawalsError = null;
            state.allWithdrawalsError = null;
            state.updateStatusError = null;
        },

        // --------------------------------------------------
        // FULL RESET
        // --------------------------------------------------

        resetWithdrawals: () => initialState,
    },

    extraReducers: (builder) => {
        // ==================================================
        // CREATE WITHDRAWAL
        // ==================================================

        builder
            .addCase(createWithdrawal.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.errorDetails = null;
                state.kycRequired = false;
                state.success = false;
                state.successMessage = null;
            })

            .addCase(
                createWithdrawal.fulfilled,
                (state, action) => {
                    state.loading = false;
                    state.success = true;
                    state.error = null;
                    state.errorDetails = null;
                    state.kycRequired = false;
                    state.successMessage =
                        action.payload?.message ||
                        "Withdrawal request submitted successfully";
                    state.walletBalance =
                        action.payload?.walletBalance;

                    const newWithdrawal =
                        action.payload?.data || action.payload;

                    if (newWithdrawal && newWithdrawal._id) {
                        state.myWithdrawals.unshift(newWithdrawal);
                    }
                }
            )

            .addCase(
                createWithdrawal.rejected,
                (state, action) => {
                    state.loading = false;
                    state.success = false;

                    const payload = action.payload;
                    if (typeof payload === "string") {
                        state.error = payload;
                        state.errorDetails = { message: payload };
                        state.kycRequired = false;
                    } else if (payload && typeof payload === "object") {
                        state.error =
                            payload.message ||
                            "Failed to create withdrawal";
                        state.errorDetails = payload;
                        state.kycRequired =
                            payload.kycVerified === false;
                    } else {
                        state.error =
                            "Failed to create withdrawal";
                        state.errorDetails = null;
                        state.kycRequired = false;
                    }
                }
            );

        // ==================================================
        // FETCH MY WITHDRAWALS
        // ==================================================

        builder
            .addCase(
                fetchMyWithdrawals.pending,
                (state) => {
                    state.myWithdrawalsLoading = true;
                    state.myWithdrawalsError = null;
                    state.error = null;
                }
            )

            .addCase(
                fetchMyWithdrawals.fulfilled,
                (state, action) => {
                    state.myWithdrawalsLoading = false;
                    state.myWithdrawalsError = null;

                    if (Array.isArray(action.payload)) {
                        state.myWithdrawals = action.payload;
                    } else {
                        state.myWithdrawals =
                            action.payload?.data || [];
                    }
                }
            )

            .addCase(
                fetchMyWithdrawals.rejected,
                (state, action) => {
                    state.myWithdrawalsLoading = false;

                    const errorMsg =
                        typeof action.payload === "string"
                            ? action.payload
                            : action.payload?.message ||
                              "Failed to fetch withdrawals";

                    state.myWithdrawalsError = errorMsg;
                    state.error = errorMsg;
                    state.myWithdrawals = [];
                }
            );

        // ==================================================
        // FETCH ALL WITHDRAWALS - ADMIN
        // ==================================================

        builder
            .addCase(
                fetchAllWithdrawals.pending,
                (state) => {
                    state.allWithdrawalsLoading = true;
                    state.allWithdrawalsError = null;
                }
            )

            .addCase(
                fetchAllWithdrawals.fulfilled,
                (state, action) => {
                    state.allWithdrawalsLoading = false;
                    state.allWithdrawalsError = null;

                    state.allWithdrawals =
                        action.payload?.data || [];

                    state.pagination =
                        action.payload?.pagination || null;
                }
            )

            .addCase(
                fetchAllWithdrawals.rejected,
                (state, action) => {
                    state.allWithdrawalsLoading = false;

                    state.allWithdrawalsError =
                        typeof action.payload === "string"
                            ? action.payload
                            : action.payload?.message ||
                              "Failed to fetch withdrawals";

                    state.allWithdrawals = [];
                    state.pagination = null;
                }
            );

        // ==================================================
        // UPDATE WITHDRAWAL STATUS - ADMIN
        // ==================================================

        builder
            .addCase(
                updateWithdrawalStatus.pending,
                (state) => {
                    state.updateStatusLoading = true;
                    state.updateStatusError = null;
                }
            )

            .addCase(
                updateWithdrawalStatus.fulfilled,
                (state, action) => {
                    state.updateStatusLoading = false;
                    state.updateStatusError = null;

                    const updatedWithdrawal =
                        action.payload?.data || action.payload;

                    if (!updatedWithdrawal?._id) {
                        return;
                    }

                    // Update admin list
                    const index =
                        state.allWithdrawals.findIndex(
                            (w) => w._id === updatedWithdrawal._id
                        );

                    if (index !== -1) {
                        state.allWithdrawals[index] =
                            updatedWithdrawal;
                    }

                    // Update user list if matching
                    const myIndex =
                        state.myWithdrawals.findIndex(
                            (w) => w._id === updatedWithdrawal._id
                        );

                    if (myIndex !== -1) {
                        state.myWithdrawals[myIndex] =
                            updatedWithdrawal;
                    }
                }
            )

            .addCase(
                updateWithdrawalStatus.rejected,
                (state, action) => {
                    state.updateStatusLoading = false;

                    state.updateStatusError =
                        typeof action.payload === "string"
                            ? action.payload
                            : action.payload?.message ||
                              "Failed to update withdrawal";
                }
            );
    },
});

// ======================================================
// ACTIONS
// ======================================================

export const {
    resetWithdrawalState,
    clearMyWithdrawals,
    clearAllWithdrawals,
    clearWithdrawalErrors,
    resetWithdrawals,
} = withdrawalSlice.actions;

// ======================================================
// SELECTORS
// ======================================================

export const selectMyWithdrawals = (state) =>
    state.withdrawal?.myWithdrawals || [];

export const selectAllWithdrawals = (state) =>
    state.withdrawal?.allWithdrawals || [];

export const selectWithdrawalPagination = (state) =>
    state.withdrawal?.pagination || null;

export const selectWithdrawalLoading = (state) =>
    state.withdrawal?.loading || false;

export const selectMyWithdrawalsLoading = (state) =>
    state.withdrawal?.myWithdrawalsLoading || false;

export const selectAllWithdrawalsLoading = (state) =>
    state.withdrawal?.allWithdrawalsLoading || false;

export const selectUpdateWithdrawalLoading = (state) =>
    state.withdrawal?.updateStatusLoading || false;

export const selectWithdrawalError = (state) =>
    state.withdrawal?.error || null;

export const selectWithdrawalErrorDetails = (state) =>
    state.withdrawal?.errorDetails || null;

export const selectKycRequired = (state) =>
    state.withdrawal?.kycRequired || false;

export const selectWithdrawalSuccess = (state) =>
    state.withdrawal?.success || false;

export const selectWithdrawalSuccessMessage = (state) =>
    state.withdrawal?.successMessage || null;

export const selectMyWithdrawalsError = (state) =>
    state.withdrawal?.myWithdrawalsError || null;

export const selectAllWithdrawalsError = (state) =>
    state.withdrawal?.allWithdrawalsError || null;

export const selectUpdateWithdrawalError = (state) =>
    state.withdrawal?.updateStatusError || null;

// Backward-compatible selectors
export const selectWithdrawals = (state) =>
    state.withdrawal?.myWithdrawals || [];

export const selectWithdrawalsCount = (state) =>
    state.withdrawal?.myWithdrawals?.length || 0;

export const selectWithdrawalsLoading = (state) =>
    state.withdrawal?.myWithdrawalsLoading || false;

export const selectWithdrawalsError = (state) =>
    state.withdrawal?.myWithdrawalsError || null;

// ======================================================
// EXPORT REDUCER
// ======================================================

export default withdrawalSlice.reducer;