import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api";

const BASE_URL = "/lottery-numbers";

// =====================================================
// FETCH AVAILABLE DAILY NUMBERS
// =====================================================
export const fetchAvailableNumbers = createAsyncThunk(
  "dailyNumbers/fetchAvailable",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(`${BASE_URL}/available`, { params });
      return response.data;
    } catch (err) {
      // Fallback to /lottery-numbers/available
      try {
        const fallback = await api.get(`/lottery-numbers/available`, { params });
        return fallback.data;
      } catch (fallbackErr) {
        return rejectWithValue(
          err.response?.data?.message ||
            fallbackErr.response?.data?.message ||
            "Failed to load available daily numbers."
        );
      }
    }
  }
);

// =====================================================
// FETCH SAMPLE LUCKY NUMBERS (Random Sample)
// =====================================================
export const fetchSampleLuckyNumbers = createAsyncThunk(
  "dailyNumbers/fetchSample",
  async (count = 18, { rejectWithValue }) => {
    try {
      const response = await api.get(`${BASE_URL}/available`, {
        params: { sample: count },
      });
      return response.data;
    } catch (err) {
      try {
        const fallback = await api.get(`/lottery-numbers/available`, {
          params: { sample: count },
        });
        return fallback.data;
      } catch (fallbackErr) {
        return rejectWithValue(
          err.response?.data?.message ||
            fallbackErr.response?.data?.message ||
            "Failed to load sample numbers."
        );
      }
    }
  }
);

// =====================================================
// CHECK SPECIFIC NUMBER AVAILABILITY
// =====================================================
export const checkNumberAvailability = createAsyncThunk(
  "dailyNumbers/checkAvailability",
  async (number, { rejectWithValue }) => {
    try {
      const clean = String(number || "").trim().toUpperCase();
      const response = await api.get(`${BASE_URL}/check/${clean}`);
      return response.data;
    } catch (err) {
      try {
        const clean = String(number || "").trim().toUpperCase();
        const fallback = await api.get(`/lottery-numbers/check/${clean}`);
        return fallback.data;
      } catch (fallbackErr) {
        return rejectWithValue(
          err.response?.data?.message ||
            fallbackErr.response?.data?.message ||
            "Failed to check number."
        );
      }
    }
  }
);

// =====================================================
// VERIFY NUMBER AVAILABILITY FOR BET (reusable API helper)
// Reuses existing checkNumberForBet controller: GET /api/lottery-numbers/check/:number
// =====================================================
export const verifyNumberForBet = async (number) => {
  try {
    const clean = String(number || "").trim().toUpperCase();
    const response = await api.get(`/lottery-numbers/check/${encodeURIComponent(clean)}`);
    return {
      canBet: Boolean(response.data?.canBet),
      isSold: false,
      message: response.data?.message || "Number is available",
      data: response.data,
    };
  } catch (err) {
    const resData = err.response?.data;
    const isSold =
      err.response?.status === 400 ||
      resData?.message?.toLowerCase().includes("sold");

    return {
      canBet: false,
      isSold,
      message:
        resData?.message ||
        "This number has already been sold. Please choose another number.",
    };
  }
};

// =====================================================
// SLICE
// =====================================================
const dailyNumberSlice = createSlice({
  name: "dailyNumbers",
  initialState: {
    availableNumbers: [],
    sampleNumbers: [],
    totalAvailable: 0,
    batchDate: null,
    selectedNumber: null,
    checkResult: null,
    loading: false,
    sampleLoading: false,
    checkLoading: false,
    error: null,
    success: false,
  },
  reducers: {
    setSelectedDailyNumber: (state, action) => {
      state.selectedNumber = action.payload;
    },
    clearDailyNumberCheck: (state) => {
      state.checkResult = null;
    },
    clearDailyNumberState: (state) => {
      state.selectedNumber = null;
      state.checkResult = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Available Numbers
      .addCase(fetchAvailableNumbers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailableNumbers.fulfilled, (state, action) => {
        state.loading = false;
        state.availableNumbers = action.payload?.numbers || [];
        state.totalAvailable = action.payload?.total || 0;
        state.batchDate = action.payload?.batchDate || null;
      })
      .addCase(fetchAvailableNumbers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load numbers";
      })

      // Sample Numbers
      .addCase(fetchSampleLuckyNumbers.pending, (state) => {
        state.sampleLoading = true;
      })
      .addCase(fetchSampleLuckyNumbers.fulfilled, (state, action) => {
        state.sampleLoading = false;
        state.sampleNumbers = action.payload?.numbers || [];
      })
      .addCase(fetchSampleLuckyNumbers.rejected, (state) => {
        state.sampleLoading = false;
      })

      // Check Number
      .addCase(checkNumberAvailability.pending, (state) => {
        state.checkLoading = true;
        state.checkResult = null;
      })
      .addCase(checkNumberAvailability.fulfilled, (state, action) => {
        state.checkLoading = false;
        state.checkResult = action.payload;
      })
      .addCase(checkNumberAvailability.rejected, (state, action) => {
        state.checkLoading = false;
        state.checkResult = {
          success: false,
          canBet: false,
          message: action.payload || "Check failed",
        };
      });
  },
});

export const {
  setSelectedDailyNumber,
  clearDailyNumberCheck,
  clearDailyNumberState,
} = dailyNumberSlice.actions;

// Selectors
export const selectAvailableDailyNumbers = (state) =>
  state.dailyNumbers?.availableNumbers || [];
export const selectSampleLuckyNumbers = (state) =>
  state.dailyNumbers?.sampleNumbers || [];
export const selectDailyNumbersLoading = (state) =>
  state.dailyNumbers?.loading || false;
export const selectDailyNumbersSampleLoading = (state) =>
  state.dailyNumbers?.sampleLoading || false;
export const selectSelectedDailyNumber = (state) =>
  state.dailyNumbers?.selectedNumber || null;
export const selectDailyNumberCheckResult = (state) =>
  state.dailyNumbers?.checkResult || null;
export const selectDailyNumberCheckLoading = (state) =>
  state.dailyNumbers?.checkLoading || false;
export const selectDailyNumbersTotal = (state) =>
  state.dailyNumbers?.totalAvailable || 0;

export default dailyNumberSlice.reducer;
