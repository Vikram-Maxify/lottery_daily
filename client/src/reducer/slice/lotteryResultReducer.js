import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import api from "../api";

// =====================================================
// CREATE RESULT
// POST /lottery-result/create
// =====================================================

export const createResult = createAsyncThunk(
  "lotteryResult/createResult",
  async (resultData, { rejectWithValue }) => {
    try {
      const response = await api.post("/lottery-result/create", resultData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message: "Failed to create result",
        }
      );
    }
  }
);

// =====================================================
// GET ALL RESULTS
// GET /lottery-result/all
// =====================================================

export const getAllResults = createAsyncThunk(
  "lotteryResult/getAllResults",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/lottery-result/all");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message: "Failed to fetch results",
        }
      );
    }
  }
);

// =====================================================
// GET RESULT BY ID
// GET /lottery-result/:id
// =====================================================

export const getResultById = createAsyncThunk(
  "lotteryResult/getResultById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/lottery-result/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message: "Failed to fetch result",
        }
      );
    }
  }
);

// =====================================================
// UPDATE RESULT
// PATCH /lottery-result/:id
// =====================================================

export const updateResult = createAsyncThunk(
  "lotteryResult/updateResult",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/lottery-result/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message: "Failed to update result",
        }
      );
    }
  }
);

// =====================================================
// PUBLISH RESULT
// PATCH /lottery-result/:id/publish
// =====================================================

export const publishResult = createAsyncThunk(
  "lotteryResult/publishResult",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/lottery-result/${id}/publish`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message: "Failed to publish result",
        }
      );
    }
  }
);

// =====================================================
// UNPUBLISH RESULT
// PATCH /lottery-result/:id/unpublish
// =====================================================

export const unpublishResult = createAsyncThunk(
  "lotteryResult/unpublishResult",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/lottery-result/${id}/unpublish`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message: "Failed to unpublish result",
        }
      );
    }
  }
);

// =====================================================
// DELETE RESULT
// DELETE /lottery-result/:id
// =====================================================

export const deleteResult = createAsyncThunk(
  "lotteryResult/deleteResult",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/lottery-result/${id}`);
      return {
        id,
        ...response.data,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message: "Failed to delete result",
        }
      );
    }
  }
);

// =====================================================
// CHECK NUMBER
// POST /lottery-result/check-number
// =====================================================

export const checkNumber = createAsyncThunk(
  "lotteryResult/checkNumber",
  async (numberData, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/lottery-result/check-number",
        numberData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message: "Failed to check number",
        }
      );
    }
  }
);

// =====================================================
// INITIAL STATE
// =====================================================

const initialState = {
  // ==========================================
  // RESULT LIST
  // ==========================================

  results: [],

  // ==========================================
  // SINGLE RESULT
  // ==========================================

  result: null,

  // ==========================================
  // NUMBER CHECK RESULT
  // ==========================================

  checkResult: null,

  // ==========================================
  // CREATE / UPDATE SUMMARY
  // ==========================================

  summary: null,

  // ==========================================
  // LOADING
  // ==========================================

  loading: false,
  createLoading: false,
  updateLoading: false,
  publishLoading: false,
  deleteLoading: false,
  checkLoading: false,

  // ==========================================
  // STATUS
  // ==========================================

  success: false,
  error: null,
  message: "",
};

// =====================================================
// HELPER — UPSERT RESULT INTO LIST
// Avoids duplicating the same findIndex / unshift logic.
// =====================================================

const upsertResult = (state, newResult) => {
  if (!newResult?._id) return;

  const index = state.results.findIndex(
    (item) => item._id === newResult._id
  );

  if (index !== -1) {
    state.results[index] = newResult;
  } else {
    state.results.unshift(newResult);
  }

  state.result = newResult;
};

// =====================================================
// SLICE
// =====================================================

const lotteryResultSlice = createSlice({
  name: "lotteryResult",

  initialState,

  reducers: {
    // ==========================================
    // CLEAR MESSAGE
    // ==========================================

    clearResultMessage: (state) => {
      state.success = false;
      state.error = null;
      state.message = "";
    },

    // ==========================================
    // CLEAR CHECK RESULT
    // ==========================================

    clearCheckResult: (state) => {
      state.checkResult = null;
    },

    // ==========================================
    // CLEAR CURRENT RESULT
    // ==========================================

    clearCurrentResult: (state) => {
      state.result = null;
      state.summary = null;
    },

    // ==========================================
    // CLEAR RESULTS
    // ==========================================

    clearResults: (state) => {
      state.results = [];
    },

    // ==========================================
    // CLEAR ERROR
    // ==========================================

    clearResultError: (state) => {
      state.error = null;
    },

    // ==========================================
    // CLEAR SUMMARY
    // ==========================================

    clearResultSummary: (state) => {
      state.summary = null;
    },
  },

  extraReducers: (builder) => {
    // =====================================================
    // GET ALL RESULTS
    // =====================================================

    builder
      .addCase(getAllResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllResults.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload?.results || [];
        state.error = null;
      })
      .addCase(getAllResults.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch results";
      });

    // =====================================================
    // GET RESULT BY ID
    // =====================================================

    builder
      .addCase(getResultById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getResultById.fulfilled, (state, action) => {
        state.loading = false;
        state.result = action.payload?.result || null;
        state.error = null;
      })
      .addCase(getResultById.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch result";
      });

    // =====================================================
    // CREATE RESULT
    // =====================================================

    builder
      .addCase(createResult.pending, (state) => {
        state.createLoading = true;
        state.success = false;
        state.error = null;
        state.message = "";
        state.summary = null;
      })
      .addCase(createResult.fulfilled, (state, action) => {
        state.createLoading = false;
        state.success = true;
        state.message =
          action.payload?.message || "Result created successfully";
        state.error = null;

        const newResult = action.payload?.result;
        const newSummary = action.payload?.summary;

        if (newResult) {
          // Prevent duplicates
          const alreadyExists = state.results.some(
            (item) => item._id === newResult._id
          );

          if (!alreadyExists) {
            state.results.unshift(newResult);
          }

          state.result = newResult;
        }

        state.summary = newSummary || null;
      })
      .addCase(createResult.rejected, (state, action) => {
        state.createLoading = false;
        state.success = false;
        state.error =
          action.payload?.message || "Failed to create result";
      });

    // =====================================================
    // UPDATE RESULT
    // =====================================================

    builder
      .addCase(updateResult.pending, (state) => {
        state.updateLoading = true;
        state.success = false;
        state.error = null;
        state.message = "";
        state.summary = null;
      })
      .addCase(updateResult.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.success = true;
        state.message =
          action.payload?.message || "Result updated successfully";
        state.error = null;

        const updatedResult = action.payload?.result;
        const updatedSummary = action.payload?.summary;

        state.summary = updatedSummary || null;

        if (updatedResult?._id) {
          upsertResult(state, updatedResult);
        }
      })
      .addCase(updateResult.rejected, (state, action) => {
        state.updateLoading = false;
        state.success = false;
        state.error =
          action.payload?.message || "Failed to update result";
      });

    // =====================================================
    // PUBLISH RESULT
    // =====================================================

    builder
      .addCase(publishResult.pending, (state) => {
        state.publishLoading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(publishResult.fulfilled, (state, action) => {
        state.publishLoading = false;
        state.success = true;
        state.message =
          action.payload?.message || "Result published successfully";
        state.error = null;

        const publishedResult = action.payload?.result;
        if (publishedResult?._id) {
          upsertResult(state, publishedResult);
        }
      })
      .addCase(publishResult.rejected, (state, action) => {
        state.publishLoading = false;
        state.success = false;
        state.error =
          action.payload?.message || "Failed to publish result";
      });

    // =====================================================
    // UNPUBLISH RESULT
    // =====================================================

    builder
      .addCase(unpublishResult.pending, (state) => {
        state.publishLoading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(unpublishResult.fulfilled, (state, action) => {
        state.publishLoading = false;
        state.success = true;
        state.message =
          action.payload?.message ||
          "Result unpublished successfully";
        state.error = null;

        const unpublishedResult = action.payload?.result;
        if (unpublishedResult?._id) {
          upsertResult(state, unpublishedResult);
        }
      })
      .addCase(unpublishResult.rejected, (state, action) => {
        state.publishLoading = false;
        state.success = false;
        state.error =
          action.payload?.message || "Failed to unpublish result";
      });

    // =====================================================
    // DELETE RESULT
    // =====================================================

    builder
      .addCase(deleteResult.pending, (state) => {
        state.deleteLoading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(deleteResult.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.success = true;
        state.message =
          action.payload?.message || "Result deleted successfully";
        state.error = null;

        const deletedId = action.payload?.id;

        // Remove from list
        state.results = state.results.filter(
          (item) => item._id !== deletedId
        );

        // Clear current result if it was the one deleted
        if (state.result?._id === deletedId) {
          state.result = null;
        }
      })
      .addCase(deleteResult.rejected, (state, action) => {
        state.deleteLoading = false;
        state.success = false;
        state.error =
          action.payload?.message || "Failed to delete result";
      });

    // =====================================================
    // CHECK NUMBER
    // =====================================================

    builder
      .addCase(checkNumber.pending, (state) => {
        state.checkLoading = true;
        state.checkResult = null;
        state.error = null;
      })
      .addCase(checkNumber.fulfilled, (state, action) => {
        state.checkLoading = false;
        state.checkResult = action.payload || null;
        state.message = action.payload?.message || "";
        state.error = null;
      })
      .addCase(checkNumber.rejected, (state, action) => {
        state.checkLoading = false;
        state.error =
          action.payload?.message || "Failed to check number";
      });
  },
});

// =====================================================
// ACTIONS
// =====================================================

export const {
  clearResultMessage,
  clearCheckResult,
  clearCurrentResult,
  clearResults,
  clearResultError,
  clearResultSummary,
} = lotteryResultSlice.actions;

// =====================================================
// SELECTORS
// =====================================================

export const selectLotteryResults = (state) =>
  state.lotteryResult?.results || [];

export const selectLotteryResult = (state) =>
  state.lotteryResult?.result || null;

export const selectLotterySummary = (state) =>
  state.lotteryResult?.summary || null;

export const selectLotteryCheckResult = (state) =>
  state.lotteryResult?.checkResult || null;

export const selectLotteryLoading = (state) =>
  state.lotteryResult?.loading || false;

export const selectLotteryCreateLoading = (state) =>
  state.lotteryResult?.createLoading || false;

export const selectLotteryUpdateLoading = (state) =>
  state.lotteryResult?.updateLoading || false;

export const selectLotteryPublishLoading = (state) =>
  state.lotteryResult?.publishLoading || false;

export const selectLotteryDeleteLoading = (state) =>
  state.lotteryResult?.deleteLoading || false;

export const selectLotteryCheckLoading = (state) =>
  state.lotteryResult?.checkLoading || false;

export const selectLotterySuccess = (state) =>
  state.lotteryResult?.success || false;

export const selectLotteryError = (state) =>
  state.lotteryResult?.error || null;

export const selectLotteryMessage = (state) =>
  state.lotteryResult?.message || "";

// =====================================================
// EXPORT REDUCER
// =====================================================

export default lotteryResultSlice.reducer;