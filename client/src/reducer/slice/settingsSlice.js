import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api";

const SETTINGS_API = "/admin/settings";

// =====================================================
// FETCH ALL SETTINGS
// GET /api/admin/settings
// =====================================================
export const fetchAllSettings = createAsyncThunk(
  "settings/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(SETTINGS_API);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch settings"
      );
    }
  }
);

// =====================================================
// UPDATE ALL SETTINGS
// PUT /api/admin/settings
// body: { dailyLotteryAmount, festivalLotteryAmount, referralPercentage }
// =====================================================
export const updateAllSettings = createAsyncThunk(
  "settings/updateAll",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.put(SETTINGS_API, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to update settings"
      );
    }
  }
);

// =====================================================
// UPDATE DAILY AMOUNT
// PUT /api/admin/settings
// =====================================================
export const updateDailyAmountSetting = createAsyncThunk(
  "settings/updateDailyAmount",
  async (amount, { rejectWithValue }) => {
    try {
      const response = await api.put(SETTINGS_API, {
        dailyLotteryAmount: Number(amount),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to update daily lottery amount"
      );
    }
  }
);

// =====================================================
// UPDATE FESTIVAL AMOUNT
// PUT /api/admin/settings
// =====================================================
export const updateFestivalAmountSetting = createAsyncThunk(
  "settings/updateFestivalAmount",
  async (amount, { rejectWithValue }) => {
    try {
      const response = await api.put(SETTINGS_API, {
        festivalLotteryAmount: Number(amount),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to update festival lottery amount"
      );
    }
  }
);

// =====================================================
// UPDATE REFERRAL PERCENTAGE
// PUT /api/admin/settings/referral-percentage
// =====================================================
export const updateReferralPercentageSetting = createAsyncThunk(
  "settings/updateReferralPercentage",
  async (percentage, { rejectWithValue }) => {
    try {
      const response = await api.put(`${SETTINGS_API}/referral-percentage`, {
        referralPercentage: Number(percentage),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to update referral percentage"
      );
    }
  }
);

// =====================================================
// INITIAL STATE
// =====================================================
const initialState = {
  dailyLotteryAmount: 0,
  dailyUpdatedAt: null,

  festivalLotteryAmount: 0,
  festivalUpdatedAt: null,

  referralPercentage: 5,
  referralUpdatedAt: null,

  loading: false,
  updateLoading: false,

  success: false,
  error: null,
  message: "",
};

// =====================================================
// SLICE
// =====================================================
const settingsSlice = createSlice({
  name: "settings",
  initialState,

  reducers: {
    clearSettingsMessages: (state) => {
      state.success = false;
      state.error = null;
      state.message = "";
    },
    resetSettingsState: () => initialState,
  },

  extraReducers: (builder) => {
    // -------------------------------------------------
    // FETCH ALL SETTINGS
    // -------------------------------------------------
    builder
      .addCase(fetchAllSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllSettings.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload?.data;
        if (data) {
          state.dailyLotteryAmount = data.dailyLotteryAmount ?? 0;
          state.dailyUpdatedAt = data.dailyUpdatedAt ?? null;
          state.festivalLotteryAmount = data.festivalLotteryAmount ?? 0;
          state.festivalUpdatedAt = data.festivalUpdatedAt ?? null;
          state.referralPercentage = data.referralPercentage ?? 5;
          state.referralUpdatedAt = data.referralUpdatedAt ?? null;
        }
      })
      .addCase(fetchAllSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch settings";
      });

    // -------------------------------------------------
    // UPDATE ALL SETTINGS
    // -------------------------------------------------
    builder
      .addCase(updateAllSettings.pending, (state) => {
        state.updateLoading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(updateAllSettings.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.success = true;
        state.message =
          action.payload?.message || "Settings updated successfully";
        const data = action.payload?.data;
        if (data) {
          state.dailyLotteryAmount = data.dailyLotteryAmount ?? state.dailyLotteryAmount;
          state.dailyUpdatedAt = data.dailyUpdatedAt ?? state.dailyUpdatedAt;
          state.festivalLotteryAmount =
            data.festivalLotteryAmount ?? state.festivalLotteryAmount;
          state.festivalUpdatedAt =
            data.festivalUpdatedAt ?? state.festivalUpdatedAt;
          state.referralPercentage =
            data.referralPercentage ?? state.referralPercentage;
          state.referralUpdatedAt =
            data.referralUpdatedAt ?? state.referralUpdatedAt;
        }
      })
      .addCase(updateAllSettings.rejected, (state, action) => {
        state.updateLoading = false;
        state.success = false;
        state.error = action.payload || "Failed to update settings";
      });

    // -------------------------------------------------
    // UPDATE DAILY AMOUNT
    // -------------------------------------------------
    builder
      .addCase(updateDailyAmountSetting.pending, (state) => {
        state.updateLoading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(updateDailyAmountSetting.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.success = true;
        state.message = "Daily lottery amount updated successfully";
        const data = action.payload?.data;
        if (data) {
          state.dailyLotteryAmount = data.dailyLotteryAmount ?? state.dailyLotteryAmount;
          state.dailyUpdatedAt = data.dailyUpdatedAt ?? new Date().toISOString();
        }
      })
      .addCase(updateDailyAmountSetting.rejected, (state, action) => {
        state.updateLoading = false;
        state.success = false;
        state.error = action.payload || "Failed to update daily amount";
      });

    // -------------------------------------------------
    // UPDATE FESTIVAL AMOUNT
    // -------------------------------------------------
    builder
      .addCase(updateFestivalAmountSetting.pending, (state) => {
        state.updateLoading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(updateFestivalAmountSetting.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.success = true;
        state.message = "Festival lottery amount updated successfully";
        const data = action.payload?.data;
        if (data) {
          state.festivalLotteryAmount =
            data.festivalLotteryAmount ?? state.festivalLotteryAmount;
          state.festivalUpdatedAt =
            data.festivalUpdatedAt ?? new Date().toISOString();
        }
      })
      .addCase(updateFestivalAmountSetting.rejected, (state, action) => {
        state.updateLoading = false;
        state.success = false;
        state.error = action.payload || "Failed to update festival amount";
      });

    // -------------------------------------------------
    // UPDATE REFERRAL PERCENTAGE
    // -------------------------------------------------
    builder
      .addCase(updateReferralPercentageSetting.pending, (state) => {
        state.updateLoading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(updateReferralPercentageSetting.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.success = true;
        state.message = "Referral percentage updated successfully";
        const data = action.payload?.data;
        if (data) {
          state.referralPercentage =
            data.referralPercentage ?? state.referralPercentage;
          state.referralUpdatedAt =
            data.updatedAt ?? new Date().toISOString();
        }
      })
      .addCase(updateReferralPercentageSetting.rejected, (state, action) => {
        state.updateLoading = false;
        state.success = false;
        state.error = action.payload || "Failed to update referral percentage";
      });
  },
});

export const { clearSettingsMessages, resetSettingsState } =
  settingsSlice.actions;

// Selectors
export const selectSettingsData = (state) => state.settings;
export const selectDailyLotteryAmount = (state) =>
  state.settings?.dailyLotteryAmount ?? 0;
export const selectFestivalLotteryAmount = (state) =>
  state.settings?.festivalLotteryAmount ?? 0;
export const selectReferralPercentage = (state) =>
  state.settings?.referralPercentage ?? 5;
export const selectSettingsLoading = (state) =>
  state.settings?.loading ?? false;
export const selectSettingsUpdateLoading = (state) =>
  state.settings?.updateLoading ?? false;
export const selectSettingsSuccess = (state) =>
  state.settings?.success ?? false;
export const selectSettingsError = (state) => state.settings?.error ?? null;
export const selectSettingsMessage = (state) => state.settings?.message ?? "";

export default settingsSlice.reducer;
