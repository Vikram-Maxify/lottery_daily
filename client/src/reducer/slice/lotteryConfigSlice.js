import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api";

// =====================================================
// INITIAL STATE
// =====================================================

const initialState = {
  configs: [],
  activeConfig: null,
  selectedConfig: null,

  loading: false,
  createLoading: false,
  getByIdLoading: false,
  activeLoading: false,
  activateLoading: false,
  deactivateLoading: false,
  updateDateLoading: false,
  deleteLoading: false,

  error: null,
  successMessage: null,
};

// =====================================================
// CREATE LOTTERY CONFIG
// POST /api/lottery/create
// =====================================================

export const createLotteryConfig = createAsyncThunk(
  "lotteryConfig/createLotteryConfig",
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post("/lottery/create", data);

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to create lottery configuration",
      );
    }
  },
);

// =====================================================
// GET ALL LOTTERY CONFIGS
// GET /api/lottery/all
// =====================================================

export const getAllLotteryConfigs = createAsyncThunk(
  "lotteryConfig/getAllLotteryConfigs",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/lottery/all");

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to fetch lottery configurations",
      );
    }
  },
);

// =====================================================
// GET ACTIVE LOTTERY CONFIG
// GET /api/lottery/active
// =====================================================

export const getActiveLotteryConfig = createAsyncThunk(
  "lotteryConfig/getActiveLotteryConfig",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/lottery/active");

      return response.data;
    } catch (error) {
      return rejectWithValue({
        status: error.response?.status,
        message:
          error.response?.data?.message ||
          "Failed to fetch active lottery configuration",
      });
    }
  },
);

// =====================================================
// GET LOTTERY CONFIG BY ID
// GET /api/lottery/:id
// =====================================================

export const getLotteryConfigById = createAsyncThunk(
  "lotteryConfig/getLotteryConfigById",
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
          "Failed to fetch lottery configuration",
      );
    }
  },
);

// =====================================================
// ACTIVATE LOTTERY CONFIG
// PATCH /api/lottery/:id/activate
// =====================================================

export const activateLotteryConfig = createAsyncThunk(
  "lotteryConfig/activateLotteryConfig",
  async (id, { rejectWithValue }) => {
    try {
      if (!id) {
        return rejectWithValue("Lottery configuration ID is required");
      }

      const response = await api.patch(`/lottery/${id}/activate`);

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to activate lottery configuration",
      );
    }
  },
);

// =====================================================
// DEACTIVATE LOTTERY CONFIG
// PATCH /api/lottery/:id/deactivate
// =====================================================

export const deactivateLotteryConfig = createAsyncThunk(
  "lotteryConfig/deactivateLotteryConfig",
  async (id, { rejectWithValue }) => {
    try {
      if (!id) {
        return rejectWithValue("Lottery configuration ID is required");
      }

      const response = await api.patch(`/lottery/${id}/deactivate`);

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to deactivate lottery configuration",
      );
    }
  },
);

// =====================================================
// UPDATE LOTTERY DATE
// PATCH /api/lottery/:id/date/:dateId
// =====================================================

export const updateLotteryDate = createAsyncThunk(
  "lotteryConfig/updateLotteryDate",
  async ({ id, dateId, numbers, amount, status }, { rejectWithValue }) => {
    try {
      if (!id) {
        return rejectWithValue("Lottery configuration ID is required");
      }

      if (!dateId) {
        return rejectWithValue("Lottery date ID is required");
      }

      const data = {};

      if (numbers !== undefined) {
        data.numbers = numbers;
      }

      if (amount !== undefined) {
        data.amount = amount;
      }

      if (status !== undefined) {
        data.status = status;
      }

      const response = await api.patch(`/lottery/${id}/date/${dateId}`, data);

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update lottery date",
      );
    }
  },
);

// =====================================================
// DELETE LOTTERY CONFIG
// DELETE /api/lottery/:id
// =====================================================

export const deleteLotteryConfig = createAsyncThunk(
  "lotteryConfig/deleteLotteryConfig",
  async (id, { rejectWithValue }) => {
    try {
      if (!id) {
        return rejectWithValue("Lottery configuration ID is required");
      }

      const response = await api.delete(`/lottery/${id}`);

      return {
        id,
        ...response.data,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to delete lottery configuration",
      );
    }
  },
);

// =====================================================
// SLICE
// =====================================================

const lotteryConfigSlice = createSlice({
  name: "lotteryConfig",

  initialState,

  reducers: {
    clearLotteryConfigError: (state) => {
      state.error = null;
    },

    clearLotteryConfigSuccess: (state) => {
      state.successMessage = null;
    },

    clearSelectedLotteryConfig: (state) => {
      state.selectedConfig = null;
    },

    clearActiveLotteryConfig: (state) => {
      state.activeConfig = null;
    },

    resetLotteryConfig: () => {
      return initialState;
    },
  },

  extraReducers: (builder) => {
    // ===================================================
    // CREATE
    // ===================================================

    builder
      .addCase(createLotteryConfig.pending, (state) => {
        state.createLoading = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(createLotteryConfig.fulfilled, (state, action) => {
        state.createLoading = false;

        const config = action.payload?.data;

        if (config) {
          const exists = state.configs.some((item) => item._id === config._id);

          if (!exists) {
            state.configs.unshift(config);
          }
        }

        state.successMessage =
          action.payload?.message ||
          "Lottery configuration created successfully";
      })

      .addCase(createLotteryConfig.rejected, (state, action) => {
        state.createLoading = false;
        state.error =
          action.payload || "Failed to create lottery configuration";
      });

    // ===================================================
    // GET ALL
    // ===================================================

    builder
      .addCase(getAllLotteryConfigs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getAllLotteryConfigs.fulfilled, (state, action) => {
        state.loading = false;

        state.configs = Array.isArray(action.payload?.data)
          ? action.payload.data
          : [];
      })

      .addCase(getAllLotteryConfigs.rejected, (state, action) => {
        state.loading = false;

        state.error =
          action.payload || "Failed to fetch lottery configurations";
      });

    // ===================================================
    // GET ACTIVE
    // ===================================================

    builder
      .addCase(getActiveLotteryConfig.pending, (state) => {
        state.activeLoading = true;
        state.error = null;
      })

      .addCase(getActiveLotteryConfig.fulfilled, (state, action) => {
        state.activeLoading = false;

        state.activeConfig = action.payload?.data || null;
      })

      .addCase(getActiveLotteryConfig.rejected, (state, action) => {
        state.activeLoading = false;

        if (action.payload?.status === 404) {
          state.activeConfig = null;
          state.error = null;
        } else {
          state.error =
            action.payload?.message ||
            action.payload ||
            "Failed to fetch active lottery configuration";
        }
      });

    // ===================================================
    // GET BY ID
    // ===================================================

    builder
      .addCase(getLotteryConfigById.pending, (state) => {
        state.getByIdLoading = true;
        state.error = null;
      })

      .addCase(getLotteryConfigById.fulfilled, (state, action) => {
        state.getByIdLoading = false;

        state.selectedConfig = action.payload?.data || null;
      })

      .addCase(getLotteryConfigById.rejected, (state, action) => {
        state.getByIdLoading = false;

        state.error = action.payload || "Failed to fetch lottery configuration";
      });

    // ===================================================
    // ACTIVATE
    // ===================================================

    builder
      .addCase(activateLotteryConfig.pending, (state) => {
        state.activateLoading = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(activateLotteryConfig.fulfilled, (state, action) => {
        state.activateLoading = false;

        const config = action.payload?.data;

        if (config) {
          state.activeConfig = config;
          state.selectedConfig = config;

          state.configs = state.configs.map((item) => {
            if (item._id === config._id) {
              return config;
            }

            return {
              ...item,
              isActive: false,
            };
          });
        }

        state.successMessage =
          action.payload?.message || "Lottery configuration activated";
      })

      .addCase(activateLotteryConfig.rejected, (state, action) => {
        state.activateLoading = false;

        state.error =
          action.payload || "Failed to activate lottery configuration";
      });

    // ===================================================
    // DEACTIVATE
    // ===================================================

    builder
      .addCase(deactivateLotteryConfig.pending, (state) => {
        state.deactivateLoading = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(deactivateLotteryConfig.fulfilled, (state, action) => {
        state.deactivateLoading = false;

        const config = action.payload?.data;

        if (config) {
          state.selectedConfig = config;

          state.configs = state.configs.map((item) =>
            item._id === config._id ? config : item,
          );

          if (state.activeConfig?._id === config._id) {
            state.activeConfig = null;
          }
        }

        state.successMessage =
          action.payload?.message || "Lottery configuration deactivated";
      })

      .addCase(deactivateLotteryConfig.rejected, (state, action) => {
        state.deactivateLoading = false;

        state.error =
          action.payload || "Failed to deactivate lottery configuration";
      });

    // ===================================================
    // UPDATE DATE
    // ===================================================

    builder
      .addCase(updateLotteryDate.pending, (state) => {
        state.updateDateLoading = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(updateLotteryDate.fulfilled, (state, action) => {
        state.updateDateLoading = false;

        const config = action.payload?.data;

        if (config) {
          state.selectedConfig = config;

          state.configs = state.configs.map((item) =>
            item._id === config._id ? config : item,
          );

          if (state.activeConfig?._id === config._id) {
            state.activeConfig = config;
          }
        }

        state.successMessage =
          action.payload?.message || "Lottery date updated successfully";
      })

      .addCase(updateLotteryDate.rejected, (state, action) => {
        state.updateDateLoading = false;

        state.error = action.payload || "Failed to update lottery date";
      });

    // ===================================================
    // DELETE
    // ===================================================

    builder
      .addCase(deleteLotteryConfig.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(deleteLotteryConfig.fulfilled, (state, action) => {
        state.deleteLoading = false;

        const deletedId = action.payload?.id;

        state.configs = state.configs.filter((item) => item._id !== deletedId);

        if (state.selectedConfig?._id === deletedId) {
          state.selectedConfig = null;
        }

        if (state.activeConfig?._id === deletedId) {
          state.activeConfig = null;
        }

        state.successMessage =
          action.payload?.message ||
          "Lottery configuration deleted successfully";
      })

      .addCase(deleteLotteryConfig.rejected, (state, action) => {
        state.deleteLoading = false;

        state.error =
          action.payload || "Failed to delete lottery configuration";
      });
  },
});

// =====================================================
// ACTIONS
// =====================================================

export const {
  clearLotteryConfigError,
  clearLotteryConfigSuccess,
  clearSelectedLotteryConfig,
  clearActiveLotteryConfig,
  resetLotteryConfig,
} = lotteryConfigSlice.actions;

// =====================================================
// SELECTORS
// =====================================================

export const selectLotteryConfigs = (state) => state.lotteryConfig.configs;

export const selectActiveLotteryConfig = (state) =>
  state.lotteryConfig.activeConfig;

export const selectSelectedLotteryConfig = (state) =>
  state.lotteryConfig.selectedConfig;

export const selectLotteryLoading = (state) => state.lotteryConfig.loading;

export const selectLotteryCreateLoading = (state) =>
  state.lotteryConfig.createLoading;

export const selectLotteryGetByIdLoading = (state) =>
  state.lotteryConfig.getByIdLoading;

export const selectLotteryActiveLoading = (state) =>
  state.lotteryConfig.activeLoading;

export const selectLotteryActivateLoading = (state) =>
  state.lotteryConfig.activateLoading;

export const selectLotteryDeactivateLoading = (state) =>
  state.lotteryConfig.deactivateLoading;

export const selectLotteryUpdateDateLoading = (state) =>
  state.lotteryConfig.updateDateLoading;

export const selectLotteryDeleteLoading = (state) =>
  state.lotteryConfig.deleteLoading;

export const selectLotteryError = (state) => state.lotteryConfig.error;

export const selectLotterySuccessMessage = (state) =>
  state.lotteryConfig.successMessage;

// =====================================================
// DEFAULT EXPORT
// =====================================================

export default lotteryConfigSlice.reducer;
