import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api";

// =====================================================
// BASE PATH — matches server.js: app.use("/api/lottery", lotteryConfigRoutes)
// api.js baseURL = "http://localhost:6099/api"
// So final URL = /api/lottery/...
// =====================================================
const LOTTERY_BASE = "/lottery";

// =====================================================
// CREATE LOTTERY CONFIG
// POST /api/lottery
// multipart/form-data (with image)
// =====================================================
export const createLotteryConfig = createAsyncThunk(
  "adminLottery/createLotteryConfig",
  async ({ payload, imageFile }, { rejectWithValue }) => {
    try {
      if (!imageFile) {
        return rejectWithValue("Market image is required");
      }

      const fd = new FormData();
      fd.append("marketName", payload.marketName);
      fd.append("month", String(payload.month));
      fd.append("year", String(payload.year));
      fd.append("drawDate", payload.drawDate);
      fd.append("drawTime", payload.drawTime);
      fd.append("prizes", JSON.stringify(payload.prizes));
      fd.append("image", imageFile);

      const response = await api.post(`${LOTTERY_BASE}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

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
// GET /api/lottery/all
// =====================================================
export const getAllLotteryConfigs = createAsyncThunk(
  "adminLottery/getAllLotteryConfigs",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`${LOTTERY_BASE}/all`);
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
// =====================================================
export const getActiveLotteryConfig = createAsyncThunk(
  "adminLottery/getActiveLotteryConfig",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`${LOTTERY_BASE}/active`);
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

      const response = await api.get(`${LOTTERY_BASE}/${id}`);
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
// UPDATE LOTTERY CONFIG
// Backend route: PUT /api/lottery/update/:id
// multipart/form-data
// =====================================================
export const updateLotteryConfig = createAsyncThunk(
  "adminLottery/updateLotteryConfig",
  async ({ id, lotteryData, imageFile }, { rejectWithValue }) => {
    try {
      if (!id) {
        return rejectWithValue("Lottery configuration ID is required");
      }

      if (!lotteryData) {
        return rejectWithValue(
          "Lottery configuration data is required"
        );
      }

      const fd = new FormData();
      fd.append("marketName", lotteryData.marketName);
      fd.append("month", String(lotteryData.month));
      fd.append("year", String(lotteryData.year));
      fd.append("drawDate", lotteryData.drawDate);
      fd.append("drawTime", lotteryData.drawTime);
      fd.append("prizes", JSON.stringify(lotteryData.prizes));

      if (imageFile) {
        fd.append("image", imageFile);
      }

      const response = await api.put(
        `${LOTTERY_BASE}/update/${id}`,
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to update lottery configuration"
      );
    }
  }
);

// =====================================================
// ACTIVATE LOTTERY CONFIG
// PATCH /api/lottery/:id/activate
// =====================================================
export const activateLotteryConfig = createAsyncThunk(
  "adminLottery/activateLotteryConfig",
  async (id, { rejectWithValue }) => {
    try {
      if (!id) {
        return rejectWithValue("Lottery configuration ID is required");
      }

      const response = await api.patch(
        `${LOTTERY_BASE}/${id}/activate`
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to activate lottery"
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
        `${LOTTERY_BASE}/${id}/deactivate`
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to deactivate lottery"
      );
    }
  }
);

// =====================================================
// UPDATE USER LOTTERY ENTRY STATUS
// PATCH /api/lottery/:configId/entry/:entryId/status
// =====================================================
export const updateUserLotteryEntry = createAsyncThunk(
  "adminLottery/updateUserLotteryEntry",
  async ({ id, userEntryId, data }, { rejectWithValue }) => {
    try {
      if (!id) {
        return rejectWithValue("Lottery configuration ID is required");
      }
      if (!userEntryId) {
        return rejectWithValue("User lottery entry ID is required");
      }

      const body = { status: data?.status || "pending" };

      if (body.status === "win") {
        if (data?.prizeType) body.prizeType = data.prizeType;
        if (data?.prize) body.prize = data.prize;
      }

      const response = await api.patch(
        `${LOTTERY_BASE}/${id}/entry/${userEntryId}/status`,
        body
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
// Backend me entry-level delete route nahi hai.
// Ye placeholder hai — 404 dega jab tak backend route add na ho.
// =====================================================
export const deleteUserLotteryEntry = createAsyncThunk(
  "adminLottery/deleteUserLotteryEntry",
  async ({ id, userEntryId }, { rejectWithValue }) => {
    try {
      if (!id) {
        return rejectWithValue("Lottery configuration ID is required");
      }
      if (!userEntryId) {
        return rejectWithValue("User lottery entry ID is required");
      }

      const response = await api.delete(
        `${LOTTERY_BASE}/${id}/entry/${userEntryId}`
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
        return rejectWithValue("Lottery configuration ID is required");
      }

      const response = await api.delete(`${LOTTERY_BASE}/${id}`);
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
  lotteries: [],
  lottery: null,
  activeLottery: null,

  loading: false,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  actionLoading: false,

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
    clearLotteryError: (state) => {
      state.error = null;
    },
    clearLotteryMessage: (state) => {
      state.message = "";
      state.success = false;
    },
    clearLottery: (state) => {
      state.lottery = null;
    },
    clearActiveLottery: (state) => {
      state.activeLottery = null;
    },
    resetLotteryState: () => initialState,
  },
  extraReducers: (builder) => {
    // CREATE
    builder
      .addCase(createLotteryConfig.pending, (state) => {
        state.createLoading = true;
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createLotteryConfig.fulfilled, (state, action) => {
        state.createLoading = false;
        state.loading = false;
        state.success = true;
        state.message =
          action.payload?.message ||
          "Lottery configuration created successfully";

        const newLottery = action.payload?.data;
        if (newLottery) {
          state.lotteries = [newLottery, ...state.lotteries];
        }
      })
      .addCase(createLotteryConfig.rejected, (state, action) => {
        state.createLoading = false;
        state.loading = false;
        state.error =
          action.payload || "Failed to create lottery configuration";
      });

    // GET ALL
    builder
      .addCase(getAllLotteryConfigs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllLotteryConfigs.fulfilled, (state, action) => {
        state.loading = false;
        state.lotteries = Array.isArray(action.payload?.data)
          ? action.payload.data
          : [];
        state.error = null;
      })
      .addCase(getAllLotteryConfigs.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Failed to fetch lottery configurations";
      });

    // GET ACTIVE
    builder
      .addCase(getActiveLotteryConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getActiveLotteryConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.activeLottery = action.payload?.data || null;
        state.error = null;
      })
      .addCase(getActiveLotteryConfig.rejected, (state, action) => {
        state.loading = false;
        state.activeLottery = null;
        state.error =
          action.payload || "Failed to fetch active lottery";
      });

    // GET BY ID
    builder
      .addCase(getLotteryConfigById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getLotteryConfigById.fulfilled, (state, action) => {
        state.loading = false;
        state.lottery = action.payload?.data || null;
        state.error = null;
      })
      .addCase(getLotteryConfigById.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Failed to fetch lottery configuration";
      });

    // UPDATE
    builder
      .addCase(updateLotteryConfig.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateLotteryConfig.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.success = true;
        state.message =
          action.payload?.message ||
          "Lottery configuration updated successfully";

        const updatedLottery = action.payload?.data;
        if (!updatedLottery) return;

        state.lottery = updatedLottery;
        state.lotteries = state.lotteries.map((item) =>
          String(item._id) === String(updatedLottery._id)
            ? updatedLottery
            : item
        );
      })
      .addCase(updateLotteryConfig.rejected, (state, action) => {
        state.updateLoading = false;
        state.error =
          action.payload || "Failed to update lottery configuration";
      });

    // ACTIVATE
    builder
      .addCase(activateLotteryConfig.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(activateLotteryConfig.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.success = true;
        state.message =
          action.payload?.message || "Lottery activated successfully";

        const updatedLottery = action.payload?.data;
        if (!updatedLottery) return;

        state.lottery = updatedLottery;
        state.lotteries = state.lotteries.map((item) => {
          if (String(item._id) === String(updatedLottery._id)) {
            return updatedLottery;
          }
          return { ...item, isActive: false };
        });
        state.activeLottery = updatedLottery;
      })
      .addCase(activateLotteryConfig.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to activate lottery";
      });

    // DEACTIVATE
    builder
      .addCase(deactivateLotteryConfig.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deactivateLotteryConfig.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.success = true;
        state.message =
          action.payload?.message ||
          "Lottery deactivated successfully";

        const updatedLottery = action.payload?.data;
        if (!updatedLottery) return;

        state.lottery = updatedLottery;
        state.lotteries = state.lotteries.map((item) =>
          String(item._id) === String(updatedLottery._id)
            ? updatedLottery
            : item
        );

        if (
          state.activeLottery &&
          String(state.activeLottery._id) ===
            String(updatedLottery._id)
        ) {
          state.activeLottery = null;
        }
      })
      .addCase(deactivateLotteryConfig.rejected, (state, action) => {
        state.actionLoading = false;
        state.error =
          action.payload || "Failed to deactivate lottery";
      });

    // UPDATE USER ENTRY
    builder
      .addCase(updateUserLotteryEntry.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateUserLotteryEntry.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.success = true;
        state.message =
          action.payload?.message ||
          "User lottery entry updated successfully";
      })
      .addCase(updateUserLotteryEntry.rejected, (state, action) => {
        state.updateLoading = false;
        state.error =
          action.payload || "Failed to update user lottery entry";
      });

    // DELETE USER ENTRY
    builder
      .addCase(deleteUserLotteryEntry.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteUserLotteryEntry.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.success = true;
        state.message =
          action.payload?.message ||
          "User lottery entry deleted successfully";
      })
      .addCase(deleteUserLotteryEntry.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error =
          action.payload || "Failed to delete user lottery entry";
      });

    // DELETE LOTTERY
    builder
      .addCase(deleteLotteryConfig.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteLotteryConfig.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.success = true;
        state.message =
          action.payload?.message ||
          "Lottery configuration deleted successfully";

        const deletedId = action.meta.arg;
        state.lotteries = state.lotteries.filter(
          (item) => String(item._id) !== String(deletedId)
        );

        if (
          state.lottery &&
          String(state.lottery._id) === String(deletedId)
        ) {
          state.lottery = null;
        }

        if (
          state.activeLottery &&
          String(state.activeLottery._id) === String(deletedId)
        ) {
          state.activeLottery = null;
        }
      })
      .addCase(deleteLotteryConfig.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error =
          action.payload || "Failed to delete lottery configuration";
      });
  },
});

export const {
  clearLotteryError,
  clearLotteryMessage,
  clearLottery,
  clearActiveLottery,
  resetLotteryState,
} = adminLotterySlice.actions;

export default adminLotterySlice.reducer;