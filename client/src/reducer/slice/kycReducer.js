import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api";

// ==========================================================
// INITIAL STATE
// ==========================================================

const initialState = {
    documents: [],
    loading: false,
    uploadLoading: false,
    error: null,
    uploadError: null,
    success: false,
    uploadSuccess: false,
    message: "",
};

// ==========================================================
// GET MY KYC
// GET /api/kyc/my
// ==========================================================

export const getMyKyc = createAsyncThunk(
    "kyc/getMyKyc",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get("/kyc/my");

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to fetch KYC details"
            );
        }
    }
);

// ==========================================================
// UPLOAD KYC DOCUMENT
// POST /api/kyc/upload
// ==========================================================

export const uploadKycDocument = createAsyncThunk(
    "kyc/uploadKycDocument",
    async ({ documentType, document }, { rejectWithValue }) => {
        try {
            const formData = new FormData();

            formData.append("documentType", documentType);
            formData.append("document", document);

            const response = await api.post("/kyc/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to upload KYC document"
            );
        }
    }
);

// ==========================================================
// SLICE
// ==========================================================

const kycSlice = createSlice({
    name: "kyc",

    initialState,

    reducers: {
        clearKycError: (state) => {
            state.error = null;
            state.uploadError = null;
        },

        clearKycSuccess: (state) => {
            state.success = false;
            state.uploadSuccess = false;
            state.message = "";
        },

        clearUploadState: (state) => {
            state.uploadLoading = false;
            state.uploadError = null;
            state.uploadSuccess = false;
            state.message = "";
        },

        resetKycState: () => initialState,
    },

    extraReducers: (builder) => {
        // ======================================================
        // GET MY KYC
        // ======================================================

        builder
            .addCase(getMyKyc.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })

            .addCase(getMyKyc.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.error = null;

                state.documents = action.payload?.data || [];
            })

            .addCase(getMyKyc.rejected, (state, action) => {
                state.loading = false;
                state.success = false;

                state.error =
                    action.payload || "Failed to fetch KYC details";
            });

        // ======================================================
        // UPLOAD KYC DOCUMENT
        // ======================================================

        builder
            .addCase(uploadKycDocument.pending, (state) => {
                state.uploadLoading = true;
                state.uploadError = null;
                state.uploadSuccess = false;
                state.message = "";
            })

            .addCase(uploadKycDocument.fulfilled, (state, action) => {
                state.uploadLoading = false;
                state.uploadError = null;
                state.uploadSuccess = true;

                state.message =
                    action.payload?.message ||
                    "Document uploaded successfully";

                const uploadedDocument = action.payload?.data;

                if (uploadedDocument) {
                    const existingIndex = state.documents.findIndex(
                        (item) => item._id === uploadedDocument._id
                    );

                    if (existingIndex !== -1) {
                        state.documents[existingIndex] = uploadedDocument;
                    } else {
                        state.documents.unshift(uploadedDocument);
                    }
                }
            })

            .addCase(uploadKycDocument.rejected, (state, action) => {
                state.uploadLoading = false;
                state.uploadSuccess = false;

                state.uploadError =
                    action.payload || "Failed to upload KYC document";
            });
    },
});

// ==========================================================
// ACTIONS
// ==========================================================

export const {
    clearKycError,
    clearKycSuccess,
    clearUploadState,
    resetKycState,
} = kycSlice.actions;

// ==========================================================
// SELECTORS
// ==========================================================

export const selectKyc = (state) => state.kyc;

export const selectKycDocuments = (state) =>
    state.kyc?.documents || [];

export const selectKycLoading = (state) =>
    state.kyc?.loading || false;

export const selectKycUploadLoading = (state) =>
    state.kyc?.uploadLoading || false;

export const selectKycError = (state) =>
    state.kyc?.error || null;

export const selectKycUploadError = (state) =>
    state.kyc?.uploadError || null;

export const selectKycUploadSuccess = (state) =>
    state.kyc?.uploadSuccess || false;

// ==========================================================
// REDUCER
// ==========================================================

export default kycSlice.reducer;