import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";

const API = "/withdrawal";

// ======================================================
// CREATE WITHDRAWAL
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

            return data.data;
        } catch (err) {
            return rejectWithValue(
                err?.response?.data?.message ||
                err?.message ||
                "Failed to create withdrawal"
            );
        }
    }
);

// ======================================================
// FETCH MY WITHDRAWALS
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
// ======================================================

export const fetchAllWithdrawals = createAsyncThunk(
    "withdrawal/fetchAll",
    async (
        { status, page = 1 } = {},
        { rejectWithValue }
    ) => {
        try {
            const { data } = await api.get(
                `${API}/admin/all`,
                {
                    params: {
                        status,
                        page,
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

                return data.data;
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
                state.success = false;
            })

            .addCase(
                createWithdrawal.fulfilled,
                (state, action) => {
                    state.loading = false;
                    state.success = true;
                    state.error = null;

                    if (action.payload) {
                        state.myWithdrawals.unshift(
                            action.payload
                        );
                    }
                }
            )

            .addCase(
                createWithdrawal.rejected,
                (state, action) => {
                    state.loading = false;
                    state.success = false;

                    state.error =
                        action.payload ||
                        "Failed to create withdrawal";
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

                    /*
                     Backend response:
          
                     {
                       success: true,
                       count: 10,
                       data: [...]
                     }
          
                     Isliye data ko safely handle kar rahe hain.
                    */

                    if (Array.isArray(action.payload)) {
                        state.myWithdrawals =
                            action.payload;
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

                    state.myWithdrawalsError =
                        action.payload ||
                        "Failed to fetch withdrawals";

                    state.error =
                        action.payload ||
                        "Failed to fetch withdrawals";

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
                        action.payload ||
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
                        action.payload;

                    if (!updatedWithdrawal?._id) {
                        return;
                    }

                    // --------------------------------------------
                    // Update admin list
                    // --------------------------------------------

                    const index =
                        state.allWithdrawals.findIndex(
                            (withdrawal) =>
                                withdrawal._id ===
                                updatedWithdrawal._id
                        );

                    if (index !== -1) {
                        state.allWithdrawals[index] =
                            updatedWithdrawal;
                    }

                    // --------------------------------------------
                    // Update user list also if same withdrawal
                    // --------------------------------------------

                    const myIndex =
                        state.myWithdrawals.findIndex(
                            (withdrawal) =>
                                withdrawal._id ===
                                updatedWithdrawal._id
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
                        action.payload ||
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

export const selectUpdateWithdrawalLoading = (
    state
) =>
    state.withdrawal?.updateStatusLoading || false;

export const selectWithdrawalError = (state) =>
    state.withdrawal?.error || null;

export const selectMyWithdrawalsError = (state) =>
    state.withdrawal?.myWithdrawalsError || null;

export const selectAllWithdrawalsError = (state) =>
    state.withdrawal?.allWithdrawalsError || null;

export const selectUpdateWithdrawalError = (
    state
) =>
    state.withdrawal?.updateStatusError || null;

export const selectWithdrawalSuccess = (state) =>
    state.withdrawal?.success || false;

// ======================================================
// BACKWARD COMPATIBLE SELECTORS
// ======================================================

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