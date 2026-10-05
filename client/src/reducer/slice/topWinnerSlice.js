import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api";

const API = "/top-winners";

// =====================================================
// GET ALL TOP WINNERS (ADMIN)
// GET /api/top-winners
// =====================================================
export const getAllTopWinners = createAsyncThunk(
  "topWinner/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch top winners"
      );
    }
  }
);

// =====================================================
// GET ACTIVE TOP WINNERS (PUBLIC HOMEPAGE)
// GET /api/top-winners/public/active
// =====================================================
export const getActiveTopWinners = createAsyncThunk(
  "topWinner/getActive",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`${API}/public/active`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch active winners"
      );
    }
  }
);

// =====================================================
// GET SINGLE TOP WINNER
// GET /api/top-winners/:id
// =====================================================
export const getTopWinnerById = createAsyncThunk(
  "topWinner/getById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`${API}/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch top winner details"
      );
    }
  }
);

// =====================================================
// CREATE TOP WINNER (ADMIN)
// POST /api/top-winners (FormData)
// =====================================================
export const createTopWinner = createAsyncThunk(
  "topWinner/create",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post(API, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to create top winner"
      );
    }
  }
);

// =====================================================
// UPDATE TOP WINNER (ADMIN)
// PUT /api/top-winners/:id (FormData)
// =====================================================
export const updateTopWinner = createAsyncThunk(
  "topWinner/update",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`${API}/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to update top winner"
      );
    }
  }
);

// =====================================================
// DELETE TOP WINNER (ADMIN)
// DELETE /api/top-winners/:id
// =====================================================
export const deleteTopWinner = createAsyncThunk(
  "topWinner/delete",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`${API}/${id}`);
      return { id, data: response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete top winner"
      );
    }
  }
);

// =====================================================
// TOGGLE ACTIVE STATUS (ADMIN)
// PATCH /api/top-winners/:id/toggle
// =====================================================
export const toggleTopWinnerStatus = createAsyncThunk(
  "topWinner/toggleStatus",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`${API}/${id}/toggle`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to toggle winner status"
      );
    }
  }
);

// =====================================================
// INITIAL STATE
// =====================================================
const initialState = {
  winners: [],
  activeWinners: [],
  currentWinner: null,

  loading: false,
  activeLoading: false,
  actionLoading: false,

  error: null,
  activeError: null,
  actionError: null,

  successMessage: null,
};

// =====================================================
// SLICE
// =====================================================
const topWinnerSlice = createSlice({
  name: "topWinner",
  initialState,

  reducers: {
    clearTopWinnerErrors: (state) => {
      state.error = null;
      state.activeError = null;
      state.actionError = null;
    },
    clearTopWinnerSuccess: (state) => {
      state.successMessage = null;
    },
    resetTopWinnerState: () => initialState,
  },

  extraReducers: (builder) => {
    // -------------------------------------------------
    // GET ALL TOP WINNERS
    // -------------------------------------------------
    builder
      .addCase(getAllTopWinners.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllTopWinners.fulfilled, (state, action) => {
        state.loading = false;
        state.winners = action.payload?.data || [];
      })
      .addCase(getAllTopWinners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch top winners";
      });

    // -------------------------------------------------
    // GET ACTIVE TOP WINNERS
    // -------------------------------------------------
    builder
      .addCase(getActiveTopWinners.pending, (state) => {
        state.activeLoading = true;
        state.activeError = null;
      })
      .addCase(getActiveTopWinners.fulfilled, (state, action) => {
        state.activeLoading = false;
        state.activeWinners = action.payload?.data || [];
      })
      .addCase(getActiveTopWinners.rejected, (state, action) => {
        state.activeLoading = false;
        state.activeError = action.payload || "Failed to fetch active winners";
      });

    // -------------------------------------------------
    // GET BY ID
    // -------------------------------------------------
    builder
      .addCase(getTopWinnerById.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(getTopWinnerById.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.currentWinner = action.payload?.data || null;
      })
      .addCase(getTopWinnerById.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload || "Failed to fetch top winner";
      });

    // -------------------------------------------------
    // CREATE TOP WINNER
    // -------------------------------------------------
    builder
      .addCase(createTopWinner.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
        state.successMessage = null;
      })
      .addCase(createTopWinner.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.successMessage =
          action.payload?.message || "Top winner created successfully";
        if (action.payload?.data) {
          state.winners.unshift(action.payload.data);
          if (action.payload.data.isActive) {
            state.activeWinners.unshift(action.payload.data);
          }
        }
      })
      .addCase(createTopWinner.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload || "Failed to create top winner";
      });

    // -------------------------------------------------
    // UPDATE TOP WINNER
    // -------------------------------------------------
    builder
      .addCase(updateTopWinner.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
        state.successMessage = null;
      })
      .addCase(updateTopWinner.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.successMessage =
          action.payload?.message || "Top winner updated successfully";

        const updated = action.payload?.data;
        if (updated?._id) {
          // Update in all winners list
          const idx = state.winners.findIndex((w) => w._id === updated._id);
          if (idx !== -1) {
            state.winners[idx] = updated;
          }

          // Update in active winners list
          const activeIdx = state.activeWinners.findIndex(
            (w) => w._id === updated._id
          );
          if (updated.isActive) {
            if (activeIdx !== -1) {
              state.activeWinners[activeIdx] = updated;
            } else {
              state.activeWinners.unshift(updated);
            }
          } else if (activeIdx !== -1) {
            state.activeWinners.splice(activeIdx, 1);
          }
        }
      })
      .addCase(updateTopWinner.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload || "Failed to update top winner";
      });

    // -------------------------------------------------
    // DELETE TOP WINNER
    // -------------------------------------------------
    builder
      .addCase(deleteTopWinner.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
        state.successMessage = null;
      })
      .addCase(deleteTopWinner.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.successMessage =
          action.payload?.data?.message || "Top winner deleted successfully";
        const id = action.payload?.id;
        state.winners = state.winners.filter((w) => w._id !== id);
        state.activeWinners = state.activeWinners.filter((w) => w._id !== id);
      })
      .addCase(deleteTopWinner.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload || "Failed to delete top winner";
      });

    // -------------------------------------------------
    // TOGGLE STATUS
    // -------------------------------------------------
    builder
      .addCase(toggleTopWinnerStatus.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(toggleTopWinnerStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.successMessage = action.payload?.message;

        const updated = action.payload?.data;
        if (updated?._id) {
          const idx = state.winners.findIndex((w) => w._id === updated._id);
          if (idx !== -1) {
            state.winners[idx] = updated;
          }

          const activeIdx = state.activeWinners.findIndex(
            (w) => w._id === updated._id
          );
          if (updated.isActive) {
            if (activeIdx === -1) {
              state.activeWinners.unshift(updated);
            } else {
              state.activeWinners[activeIdx] = updated;
            }
          } else if (activeIdx !== -1) {
            state.activeWinners.splice(activeIdx, 1);
          }
        }
      })
      .addCase(toggleTopWinnerStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload || "Failed to toggle winner status";
      });
  },
});

export const {
  clearTopWinnerErrors,
  clearTopWinnerSuccess,
  resetTopWinnerState,
} = topWinnerSlice.actions;

// Selectors
export const selectAllTopWinners = (state) => state.topWinner?.winners || [];
export const selectActiveTopWinners = (state) =>
  state.topWinner?.activeWinners || [];
export const selectTopWinnerLoading = (state) =>
  state.topWinner?.loading || false;
export const selectActiveTopWinnerLoading = (state) =>
  state.topWinner?.activeLoading || false;
export const selectTopWinnerActionLoading = (state) =>
  state.topWinner?.actionLoading || false;
export const selectTopWinnerError = (state) => state.topWinner?.error || null;
export const selectTopWinnerSuccessMessage = (state) =>
  state.topWinner?.successMessage || null;

export default topWinnerSlice.reducer;
