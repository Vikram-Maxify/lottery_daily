import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api";

// =====================================================
// CREATE LOTTERY CONFIG
// POST /api/lottery
// =====================================================

export const createLotteryConfig = createAsyncThunk(
  "adminLottery/createLotteryConfig",
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post("/lottery", data);

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to create lottery configuration"
      );
    }
  }
);

// =====================================================
// GET ALL LOTTERY CONFIGS
// GET /api/lottery
// =====================================================

export const getAllLotteryConfigs = createAsyncThunk(
  "adminLottery/getAllLotteryConfigs",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/lottery/all");

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to fetch lottery configurations"
      );
    }
  }
);

// =====================================================
// GET ACTIVE LOTTERY CONFIG
// GET /api/lottery/active
// IMPORTANT: Keep this BEFORE /:id in backend routes
// =====================================================

export const getActiveLotteryConfig = createAsyncThunk(
  "adminLottery/getActiveLotteryConfig",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/lottery/active");

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to fetch active lottery"
      );
    }
  }
);

// =====================================================
// GET LOTTERY CONFIG BY ID
// GET /api/lottery/:id
// =====================================================

export const getLotteryConfigById = createAsyncThunk(
  "adminLottery/getLotteryConfigById",
  async (id, { rejectWithValue }) => {
    try {
      if (!id) {
        return rejectWithValue("Lottery configuration ID is required");
      }

      const response = await api.get(`/lottery/${id}`);

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to fetch lottery configuration"
      );
    }
  }
);

// =====================================================
// ACTIVATE LOTTERY CONFIG
// PUT /api/lottery/:id/activate
// =====================================================

export const activateLotteryConfig = createAsyncThunk(
  "adminLottery/activateLotteryConfig",
  async (id, { rejectWithValue }) => {
    try {
      if (!id) {
        return rejectWithValue("Lottery configuration ID is required");
      }

      const response = await api.patch(
        `/lottery/${id}/activate`
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to activate lottery"
      );
    }
  }
);

// =====================================================
// DEACTIVATE LOTTERY CONFIG
// PUT /api/lottery/:id/deactivate
// =====================================================

export const deactivateLotteryConfig = createAsyncThunk(
  "adminLottery/deactivateLotteryConfig",
  async (id, { rejectWithValue }) => {
    try {
      if (!id) {
        return rejectWithValue("Lottery configuration ID is required");
      }

      const response = await api.put(
        `/lottery/${id}/deactivate`
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to deactivate lottery"
      );
    }
  }
);

// =====================================================
// UPDATE USER LOTTERY ENTRY
// PUT /api/lottery/:id/user/:userEntryId
// =====================================================

export const updateUserLotteryEntry = createAsyncThunk(
  "adminLottery/updateUserLotteryEntry",
  async (
    {
      id,
      userEntryId,
      data,
    },
    { rejectWithValue }
  ) => {
    try {
      if (!id) {
        return rejectWithValue(
          "Lottery configuration ID is required"
        );
      }

      if (!userEntryId) {
        return rejectWithValue(
          "User lottery entry ID is required"
        );
      }

      const response = await api.put(
        `/lottery/${id}/user/${userEntryId}`,
        data
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to update user lottery entry"
      );
    }
  }
);

// =====================================================
// DELETE USER LOTTERY ENTRY
// DELETE /api/lottery/:id/user/:userEntryId
// =====================================================

export const deleteUserLotteryEntry = createAsyncThunk(
  "adminLottery/deleteUserLotteryEntry",
  async (
    {
      id,
      userEntryId,
    },
    { rejectWithValue }
  ) => {
    try {
      if (!id) {
        return rejectWithValue(
          "Lottery configuration ID is required"
        );
      }

      if (!userEntryId) {
        return rejectWithValue(
          "User lottery entry ID is required"
        );
      }

      const response = await api.delete(
        `/lottery/${id}/user/${userEntryId}`
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to delete user lottery entry"
      );
    }
  }
);

// =====================================================
// DELETE LOTTERY CONFIG
// DELETE /api/lottery/:id
// =====================================================

export const deleteLotteryConfig = createAsyncThunk(
  "adminLottery/deleteLotteryConfig",
  async (id, { rejectWithValue }) => {
    try {
      if (!id) {
        return rejectWithValue(
          "Lottery configuration ID is required"
        );
      }

      const response = await api.delete(
        `/lottery/${id}`
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to delete lottery configuration"
      );
    }
  }
);

// =====================================================
// INITIAL STATE
// =====================================================

const initialState = {
  // All markets
  lotteries: [],

  // Selected market
  lottery: null,

  // Active market
  activeLottery: null,

  // Loading states
  loading: false,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  actionLoading: false,

  // Request status
  error: null,
  success: false,
  message: "",
};

// =====================================================
// SLICE
// =====================================================

const adminLotterySlice = createSlice({
  name: "adminLottery",

  initialState,

  reducers: {
    // =================================================
    // CLEAR ERROR
    // =================================================

    clearLotteryError: (state) => {
      state.error = null;
    },

    // =================================================
    // CLEAR MESSAGE
    // =================================================

    clearLotteryMessage: (state) => {
      state.message = "";
      state.success = false;
    },

    // =================================================
    // CLEAR SELECTED LOTTERY
    // =================================================

    clearLottery: (state) => {
      state.lottery = null;
    },

    // =================================================
    // CLEAR ACTIVE LOTTERY
    // =================================================

    clearActiveLottery: (state) => {
      state.activeLottery = null;
    },

    // =================================================
    // RESET COMPLETE STATE
    // =================================================

    resetLotteryState: () => initialState,
  },

  // ===================================================
  // EXTRA REDUCERS
  // ===================================================

  extraReducers: (builder) => {
    // =================================================
    // CREATE LOTTERY
    // =================================================

    builder

      .addCase(
        createLotteryConfig.pending,
        (state) => {
          state.createLoading = true;
          state.loading = true;
          state.error = null;
          state.success = false;
        }
      )

      .addCase(
        createLotteryConfig.fulfilled,
        (state, action) => {
          state.createLoading = false;
          state.loading = false;
          state.success = true;

          state.message =
            action.payload?.message ||
            "Lottery configuration created successfully";

          const newLottery =
            action.payload?.data;

          if (newLottery) {
            state.lotteries.unshift(
              newLottery
            );
          }
        }
      )

      .addCase(
        createLotteryConfig.rejected,
        (state, action) => {
          state.createLoading = false;
          state.loading = false;

          state.error =
            action.payload ||
            "Failed to create lottery configuration";
        }
      );

    // =================================================
    // GET ALL LOTTERIES
    // =================================================

    builder

      .addCase(
        getAllLotteryConfigs.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        getAllLotteryConfigs.fulfilled,
        (state, action) => {
          state.loading = false;

          state.lotteries =
            action.payload?.data || [];

          state.error = null;
        }
      )

      .addCase(
        getAllLotteryConfigs.rejected,
        (state, action) => {
          state.loading = false;

          state.error =
            action.payload ||
            "Failed to fetch lottery configurations";
        }
      );

    // =================================================
    // GET ACTIVE LOTTERY
    // =================================================

    builder

      .addCase(
        getActiveLotteryConfig.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        getActiveLotteryConfig.fulfilled,
        (state, action) => {
          state.loading = false;

          state.activeLottery =
            action.payload?.data || null;

          state.error = null;
        }
      )

      .addCase(
        getActiveLotteryConfig.rejected,
        (state, action) => {
          state.loading = false;

          state.activeLottery = null;

          state.error =
            action.payload ||
            "Failed to fetch active lottery";
        }
      );

    // =================================================
    // GET LOTTERY BY ID
    // =================================================

    builder

      .addCase(
        getLotteryConfigById.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        getLotteryConfigById.fulfilled,
        (state, action) => {
          state.loading = false;

          state.lottery =
            action.payload?.data || null;

          state.error = null;
        }
      )

      .addCase(
        getLotteryConfigById.rejected,
        (state, action) => {
          state.loading = false;

          state.error =
            action.payload ||
            "Failed to fetch lottery configuration";
        }
      );

    // =================================================
    // ACTIVATE LOTTERY
    // =================================================

    builder

      .addCase(
        activateLotteryConfig.pending,
        (state) => {
          state.actionLoading = true;
          state.error = null;
          state.success = false;
        }
      )

      .addCase(
        activateLotteryConfig.fulfilled,
        (state, action) => {
          state.actionLoading = false;
          state.success = true;

          state.message =
            action.payload?.message ||
            "Lottery activated successfully";

          const updatedLottery =
            action.payload?.data;

          if (!updatedLottery) {
            return;
          }

          // Selected lottery
          state.lottery =
            updatedLottery;

          // Update all lotteries
          state.lotteries =
            state.lotteries.map(
              (item) => {
                if (
                  String(item._id) ===
                  String(updatedLottery._id)
                ) {
                  return updatedLottery;
                }

                return {
                  ...item,
                  isActive: false,
                };
              }
            );

          // Active lottery
          state.activeLottery =
            updatedLottery;
        }
      )

      .addCase(
        activateLotteryConfig.rejected,
        (state, action) => {
          state.actionLoading = false;

          state.error =
            action.payload ||
            "Failed to activate lottery";
        }
      );

    // =================================================
    // DEACTIVATE LOTTERY
    // =================================================

    builder

      .addCase(
        deactivateLotteryConfig.pending,
        (state) => {
          state.actionLoading = true;
          state.error = null;
          state.success = false;
        }
      )

      .addCase(
        deactivateLotteryConfig.fulfilled,
        (state, action) => {
          state.actionLoading = false;
          state.success = true;

          state.message =
            action.payload?.message ||
            "Lottery deactivated successfully";

          const updatedLottery =
            action.payload?.data;

          if (!updatedLottery) {
            return;
          }

          // Update selected lottery
          state.lottery =
            updatedLottery;

          // Update list
          state.lotteries =
            state.lotteries.map(
              (item) =>
                String(item._id) ===
                String(updatedLottery._id)
                  ? updatedLottery
                  : item
            );

          // Remove active lottery
          if (
            state.activeLottery &&
            String(
              state.activeLottery._id
            ) ===
              String(updatedLottery._id)
          ) {
            state.activeLottery = null;
          }
        }
      )

      .addCase(
        deactivateLotteryConfig.rejected,
        (state, action) => {
          state.actionLoading = false;

          state.error =
            action.payload ||
            "Failed to deactivate lottery";
        }
      );

    // =================================================
    // UPDATE USER ENTRY
    // =================================================

    builder

      .addCase(
        updateUserLotteryEntry.pending,
        (state) => {
          state.updateLoading = true;
          state.error = null;
          state.success = false;
        }
      )

      .addCase(
        updateUserLotteryEntry.fulfilled,
        (state, action) => {
          state.updateLoading = false;
          state.success = true;

          state.message =
            action.payload?.message ||
            "User lottery entry updated successfully";

          const updatedConfig =
            action.payload?.data;

          if (!updatedConfig) {
            return;
          }

          // Selected lottery
          state.lottery =
            updatedConfig;

          // Update list
          state.lotteries =
            state.lotteries.map(
              (item) =>
                String(item._id) ===
                String(updatedConfig._id)
                  ? updatedConfig
                  : item
            );

          // Update active lottery
          if (
            state.activeLottery &&
            String(
              state.activeLottery._id
            ) ===
              String(updatedConfig._id)
          ) {
            state.activeLottery =
              updatedConfig;
          }
        }
      )

      .addCase(
        updateUserLotteryEntry.rejected,
        (state, action) => {
          state.updateLoading = false;

          state.error =
            action.payload ||
            "Failed to update user lottery entry";
        }
      );

    // =================================================
    // DELETE USER ENTRY
    // =================================================

    builder

      .addCase(
        deleteUserLotteryEntry.pending,
        (state) => {
          state.deleteLoading = true;
          state.error = null;
          state.success = false;
        }
      )

      .addCase(
        deleteUserLotteryEntry.fulfilled,
        (state, action) => {
          state.deleteLoading = false;
          state.success = true;

          state.message =
            action.payload?.message ||
            "User lottery entry deleted successfully";

          const updatedConfig =
            action.payload?.data;

          if (!updatedConfig) {
            return;
          }

          // Selected lottery
          state.lottery =
            updatedConfig;

          // Update list
          state.lotteries =
            state.lotteries.map(
              (item) =>
                String(item._id) ===
                String(updatedConfig._id)
                  ? updatedConfig
                  : item
            );

          // Update active lottery
          if (
            state.activeLottery &&
            String(
              state.activeLottery._id
            ) ===
              String(updatedConfig._id)
          ) {
            state.activeLottery =
              updatedConfig;
          }
        }
      )

      .addCase(
        deleteUserLotteryEntry.rejected,
        (state, action) => {
          state.deleteLoading = false;

          state.error =
            action.payload ||
            "Failed to delete user lottery entry";
        }
      );

    // =================================================
    // DELETE LOTTERY CONFIG
    // =================================================

    builder

      .addCase(
        deleteLotteryConfig.pending,
        (state) => {
          state.deleteLoading = true;
          state.error = null;
          state.success = false;
        }
      )

      .addCase(
        deleteLotteryConfig.fulfilled,
        (state, action) => {
          state.deleteLoading = false;
          state.success = true;

          state.message =
            action.payload?.message ||
            "Lottery configuration deleted successfully";

          // ID from thunk argument
          const deletedId =
            action.meta.arg;

          // Remove from list
          state.lotteries =
            state.lotteries.filter(
              (item) =>
                String(item._id) !==
                String(deletedId)
            );

          // Clear selected lottery
          if (
            state.lottery &&
            String(state.lottery._id) ===
              String(deletedId)
          ) {
            state.lottery = null;
          }

          // Clear active lottery
          if (
            state.activeLottery &&
            String(
              state.activeLottery._id
            ) ===
              String(deletedId)
          ) {
            state.activeLottery = null;
          }
        }
      )

      .addCase(
        deleteLotteryConfig.rejected,
        (state, action) => {
          state.deleteLoading = false;

          state.error =
            action.payload ||
            "Failed to delete lottery configuration";
        }
      );
  },
});

// =====================================================
// ACTIONS
// =====================================================

export const {
  clearLotteryError,
  clearLotteryMessage,
  clearLottery,
  clearActiveLottery,
  resetLotteryState,
} = adminLotterySlice.actions;

// =====================================================
// REDUCER
// =====================================================

export default adminLotterySlice.reducer;
