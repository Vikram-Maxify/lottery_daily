import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api";

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
          "Failed to fetch KYC details",
      );
    }
  },
);

// Backend expects ONE multipart request containing all four images.
// Field names match uploadKycDocument controller exactly:
// dob, aadhaarFront, aadhaarBack, panFront, selfie.
export const uploadKycDocument = createAsyncThunk(
  "kyc/uploadKycDocument",
  async (
    { aadhaarFront, aadhaarBack, panFront, selfie, dob = "" },
    { rejectWithValue },
  ) => {
    try {
      if (!aadhaarFront) {
        return rejectWithValue("Please upload Aadhaar front image");
      }
      if (!aadhaarBack) {
        return rejectWithValue("Please upload Aadhaar back image");
      }
      if (!panFront) {
        return rejectWithValue("Please upload PAN card image");
      }
      if (!selfie) {
        return rejectWithValue("Please upload selfie");
      }
      if (!dob) {
        return rejectWithValue("Please select your date of birth");
      }

      const formData = new FormData();
      formData.append("dob", dob);
      formData.append("aadhaarFront", aadhaarFront);
      formData.append("aadhaarBack", aadhaarBack);
      formData.append("panFront", panFront);
      formData.append("selfie", selfie);

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
          "Failed to upload KYC details",
      );
    }
  },
);

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

        // The new schema stores ONE KycDocument per user.
        state.documents = action.payload?.data ? [action.payload.data] : [];
      })
      .addCase(getMyKyc.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload || "Failed to fetch KYC details";
      })
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
          action.payload?.message || "KYC details uploaded successfully";

        const uploadedDocument = action.payload?.data;
        if (uploadedDocument) {
          state.documents = [uploadedDocument];
        }
      })
      .addCase(uploadKycDocument.rejected, (state, action) => {
        state.uploadLoading = false;
        state.uploadSuccess = false;
        state.uploadError = action.payload || "Failed to upload KYC details";
      });
  },
});

export const {
  clearKycError,
  clearKycSuccess,
  clearUploadState,
  resetKycState,
} = kycSlice.actions;

export const selectKyc = (state) => state.kyc;
export const selectKycDocuments = (state) => state.kyc?.documents || [];
export const selectKycLoading = (state) => state.kyc?.loading || false;
export const selectKycUploadLoading = (state) =>
  state.kyc?.uploadLoading || false;
export const selectKycError = (state) => state.kyc?.error || null;
export const selectKycUploadError = (state) => state.kyc?.uploadError || null;
export const selectKycUploadSuccess = (state) =>
  state.kyc?.uploadSuccess || false;

export default kycSlice.reducer;
