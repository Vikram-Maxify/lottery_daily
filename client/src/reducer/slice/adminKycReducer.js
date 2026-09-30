import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api";

// ==========================================================
// INITIAL STATE
// ==========================================================

const initialState = {
    documents: [],
    selectedDocument: null,

    loading: false,
    singleLoading: false,
    actionLoading: false,

    error: null,
    singleError: null,
    actionError: null,

    success: false,
    actionSuccess: false,

    message: "",
};

// ==========================================================
// GET ALL KYC
// GET /api/admin/kyc
//
// Optional:
// GET /api/admin/kyc?status=pending
// GET /api/admin/kyc?status=approved
// GET /api/admin/kyc?status=rejected
// ==========================================================

export const getAllKyc = createAsyncThunk(
    "adminKyc/getAllKyc",
    async (status = "", { rejectWithValue }) => {
        try {
            const validStatuses = [
                "pending",
                "approved",
                "rejected",
            ];

            let url = "/admin/kyc";

            if (validStatuses.includes(status)) {
                url += `?status=${status}`;
            }

            const response = await api.get(url);

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to fetch KYC documents"
            );
        }
    }
);

// ==========================================================
// GET SINGLE KYC
// GET /api/admin/kyc/:id
// ==========================================================

export const getSingleKyc = createAsyncThunk(
    "adminKyc/getSingleKyc",
    async (id, { rejectWithValue }) => {
        try {
            if (!id) {
                return rejectWithValue(
                    "KYC document ID is required"
                );
            }

            const response = await api.get(
                `/admin/kyc/${id}`
            );

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to fetch KYC document"
            );
        }
    }
);

// ==========================================================
// APPROVE KYC
// PATCH /api/admin/kyc/:id/approve
// ==========================================================

export const approveKyc = createAsyncThunk(
    "adminKyc/approveKyc",
    async (id, { rejectWithValue }) => {
        try {
            if (!id) {
                return rejectWithValue(
                    "KYC document ID is required"
                );
            }

            const response = await api.patch(
                `/admin/kyc/${id}/approve`
            );

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to approve KYC document"
            );
        }
    }
);

// ==========================================================
// REJECT KYC
// PATCH /api/admin/kyc/:id/reject
//
// Body:
// {
//   rejectionReason: "Reason"
// }
// ==========================================================

export const rejectKyc = createAsyncThunk(
    "adminKyc/rejectKyc",
    async (
        { id, rejectionReason },
        { rejectWithValue }
    ) => {
        try {
            if (!id) {
                return rejectWithValue(
                    "KYC document ID is required"
                );
            }

            if (!rejectionReason?.trim()) {
                return rejectWithValue(
                    "Rejection reason is required"
                );
            }

            const response = await api.patch(
                `/admin/kyc/${id}/reject`,
                {
                    rejectionReason:
                        rejectionReason.trim(),
                }
            );

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to reject KYC document"
            );
        }
    }
);

// ==========================================================
// SLICE
// ==========================================================

const adminKycSlice = createSlice({
    name: "adminKyc",

    initialState,

    reducers: {
        // --------------------------------------------------
        // CLEAR GENERAL ERROR
        // --------------------------------------------------

        clearAdminKycError: (state) => {
            state.error = null;
            state.singleError = null;
            state.actionError = null;
        },

        // --------------------------------------------------
        // CLEAR ACTION ERROR
        // --------------------------------------------------

        clearAdminKycActionError: (state) => {
            state.actionError = null;
        },

        // --------------------------------------------------
        // CLEAR SUCCESS
        // --------------------------------------------------

        clearAdminKycSuccess: (state) => {
            state.success = false;
            state.actionSuccess = false;
            state.message = "";
        },

        // --------------------------------------------------
        // CLEAR SELECTED DOCUMENT
        // --------------------------------------------------

        clearSelectedKyc: (state) => {
            state.selectedDocument = null;
            state.singleError = null;
        },

        // --------------------------------------------------
        // RESET STATE
        // --------------------------------------------------

        resetAdminKycState: () => initialState,
    },

    extraReducers: (builder) => {
        // ==================================================
        // GET ALL KYC
        // ==================================================

        builder
            .addCase(getAllKyc.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })

            .addCase(getAllKyc.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.error = null;

                state.documents =
                    action.payload?.data || [];
            })

            .addCase(getAllKyc.rejected, (state, action) => {
                state.loading = false;
                state.success = false;

                state.error =
                    action.payload ||
                    "Failed to fetch KYC documents";
            });

        // ==================================================
        // GET SINGLE KYC
        // ==================================================

        builder
            .addCase(getSingleKyc.pending, (state) => {
                state.singleLoading = true;
                state.singleError = null;
            })

            .addCase(getSingleKyc.fulfilled, (state, action) => {
                state.singleLoading = false;
                state.singleError = null;

                state.selectedDocument =
                    action.payload?.data || null;
            })

            .addCase(getSingleKyc.rejected, (state, action) => {
                state.singleLoading = false;

                state.singleError =
                    action.payload ||
                    "Failed to fetch KYC document";

                state.selectedDocument = null;
            });

        // ==================================================
        // APPROVE KYC
        // ==================================================

        builder
            .addCase(approveKyc.pending, (state) => {
                state.actionLoading = true;
                state.actionError = null;
                state.actionSuccess = false;
                state.message = "";
            })

            .addCase(approveKyc.fulfilled, (state, action) => {
                state.actionLoading = false;
                state.actionError = null;
                state.actionSuccess = true;

                state.message =
                    action.payload?.message ||
                    "KYC document approved successfully";

                const updatedDocument =
                    action.payload?.data;

                if (updatedDocument) {
                    // --------------------------------------
                    // Update document in list
                    // --------------------------------------

                    const index =
                        state.documents.findIndex(
                            (item) =>
                                item._id ===
                                updatedDocument._id
                        );

                    if (index !== -1) {
                        state.documents[index] =
                            updatedDocument;
                    }

                    // --------------------------------------
                    // Update selected document
                    // --------------------------------------

                    if (
                        state.selectedDocument?._id ===
                        updatedDocument._id
                    ) {
                        state.selectedDocument =
                            updatedDocument;
                    }
                }
            })

            .addCase(approveKyc.rejected, (state, action) => {
                state.actionLoading = false;
                state.actionSuccess = false;

                state.actionError =
                    action.payload ||
                    "Failed to approve KYC document";
            });

        // ==================================================
        // REJECT KYC
        // ==================================================

        builder
            .addCase(rejectKyc.pending, (state) => {
                state.actionLoading = true;
                state.actionError = null;
                state.actionSuccess = false;
                state.message = "";
            })

            .addCase(rejectKyc.fulfilled, (state, action) => {
                state.actionLoading = false;
                state.actionError = null;
                state.actionSuccess = true;

                state.message =
                    action.payload?.message ||
                    "KYC document rejected";

                const updatedDocument =
                    action.payload?.data;

                if (updatedDocument) {
                    // --------------------------------------
                    // Update document in list
                    // --------------------------------------

                    const index =
                        state.documents.findIndex(
                            (item) =>
                                item._id ===
                                updatedDocument._id
                        );

                    if (index !== -1) {
                        state.documents[index] =
                            updatedDocument;
                    }

                    // --------------------------------------
                    // Update selected document
                    // --------------------------------------

                    if (
                        state.selectedDocument?._id ===
                        updatedDocument._id
                    ) {
                        state.selectedDocument =
                            updatedDocument;
                    }
                }
            })

            .addCase(rejectKyc.rejected, (state, action) => {
                state.actionLoading = false;
                state.actionSuccess = false;

                state.actionError =
                    action.payload ||
                    "Failed to reject KYC document";
            });
    },
});

// ==========================================================
// ACTIONS
// ==========================================================

export const {
    clearAdminKycError,
    clearAdminKycActionError,
    clearAdminKycSuccess,
    clearSelectedKyc,
    resetAdminKycState,
} = adminKycSlice.actions;

// ==========================================================
// SELECTORS
// ==========================================================

export const selectAdminKyc = (state) =>
    state.adminKyc;

export const selectAdminKycDocuments = (state) =>
    state.adminKyc?.documents || [];

export const selectSelectedKyc = (state) =>
    state.adminKyc?.selectedDocument || null;

export const selectAdminKycLoading = (state) =>
    state.adminKyc?.loading || false;

export const selectAdminKycSingleLoading = (state) =>
    state.adminKyc?.singleLoading || false;

export const selectAdminKycActionLoading = (state) =>
    state.adminKyc?.actionLoading || false;

export const selectAdminKycError = (state) =>
    state.adminKyc?.error || null;

export const selectAdminKycSingleError = (state) =>
    state.adminKyc?.singleError || null;

export const selectAdminKycActionError = (state) =>
    state.adminKyc?.actionError || null;

export const selectAdminKycSuccess = (state) =>
    state.adminKyc?.success || false;

export const selectAdminKycActionSuccess = (state) =>
    state.adminKyc?.actionSuccess || false;

export const selectAdminKycMessage = (state) =>
    state.adminKyc?.message || "";

// ==========================================================
// DEFAULT EXPORT
// ==========================================================

export default adminKycSlice.reducer;