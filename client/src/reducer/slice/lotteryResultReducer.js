import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api";

// =====================================================
// HELPER — CLEAN ERROR MESSAGE
// =====================================================
const extractError = (error, fallback) => {
  const data = error?.response?.data;

  if (!data) return error?.message || fallback;

  if (data.message && data.error && data.message !== data.error) {
    return `${data.message} (${data.error})`;
  }

  return data.message || data.error || error?.message || fallback;
};

// =====================================================
// CREATE RESULT
// POST /lottery-result/create
// body: { lotteryConfigId, date, winningNumbers: {...} }
// =====================================================
export const createResult = createAsyncThunk(
  "lotteryResult/createResult",
  async (resultData, { rejectWithValue }) => {
    try {
      const response = await api.post("/lottery-result/create", resultData);

      if (response.data?.success === false) {
        return rejectWithValue({
          success: false,
          message: response.data?.message || "Failed to create result",
        });
      }
      return response.data;
    } catch (error) {
      return rejectWithValue({
        success: false,
        message: extractError(error, "Failed to create result"),
      });
    }
  }
);

// =====================================================
// GET ALL RESULTS
// =====================================================
export const getAllResults = createAsyncThunk(
  "lotteryResult/getAllResults",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/lottery-result/all");
      return response.data;
    } catch (error) {
      return rejectWithValue({
        success: false,
        message: extractError(error, "Failed to fetch results"),
      });
    }
  }
);

// =====================================================
// GET RESULT BY ID
// =====================================================
export const getResultById = createAsyncThunk(
  "lotteryResult/getResultById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/lottery-result/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue({
        success: false,
        message: extractError(error, "Failed to fetch result"),
      });
    }
  }
);

// =====================================================
// UPDATE RESULT
// PATCH /lottery-result/:id
// body: { winningNumbers: {...} }
// =====================================================
export const updateResult = createAsyncThunk(
  "lotteryResult/updateResult",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/lottery-result/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue({
        success: false,
        message: extractError(error, "Failed to update result"),
      });
    }
  }
);

// =====================================================
// PUBLISH
// =====================================================
export const publishResult = createAsyncThunk(
  "lotteryResult/publishResult",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/lottery-result/${id}/publish`);
      return response.data;
    } catch (error) {
      return rejectWithValue({
        success: false,
        message: extractError(error, "Failed to publish result"),
      });
    }
  }
);

// =====================================================
// UNPUBLISH
// =====================================================
export const unpublishResult = createAsyncThunk(
  "lotteryResult/unpublishResult",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/lottery-result/${id}/unpublish`);
      return response.data;
    } catch (error) {
      return rejectWithValue({
        success: false,
        message: extractError(error, "Failed to unpublish result"),
      });
    }
  }
);

// =====================================================
// DELETE
// =====================================================
export const deleteResult = createAsyncThunk(
  "lotteryResult/deleteResult",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/lottery-result/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue({
        success: false,
        message: extractError(error, "Failed to delete result"),
      });
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
      const response = await api.post("/lottery-result/check-number", numberData);
      return response.data;
    } catch (error) {
      return rejectWithValue({
        success: false,
        message: extractError(error, "Failed to check number"),
      });
    }
  }
);

// =====================================================
// GET UNBET NUMBERS
// GET /lottery-result/unbet-numbers?lotteryConfigId=...
// =====================================================
export const getUnbetNumbers = createAsyncThunk(
  "lotteryResult/getUnbetNumbers",
  async (lotteryConfigId, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/lottery-result/unbet-numbers?lotteryConfigId=${lotteryConfigId}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue({
        success: false,
        message: extractError(error, "Failed to fetch unbet numbers"),
      });
    }
  }
);

// =====================================================
// INITIAL STATE
// =====================================================
const initialState = {
  results: [],
  result: null,
  checkResult: null,
  summary: null,

  unbetNumbers: [],
  unbetLoading: false,

  loading: false,
  createLoading: false,
  updateLoading: false,
  publishLoading: false,
  deleteLoading: false,
  checkLoading: false,

  success: false,
  error: null,
  message: "",
};

// =====================================================
// HELPER — UPSERT RESULT INTO LIST
// =====================================================
const upsertResult = (state, newResult) => {
  if (!newResult?._id) return;
  const index = state.results.findIndex((item) => item._id === newResult._id);
  if (index !== -1) state.results[index] = newResult;
  else state.results.unshift(newResult);
  state.result = newResult;
};

// =====================================================
// SLICE
// =====================================================
const lotteryResultSlice = createSlice({
  name: "lotteryResult",
  initialState,

  reducers: {
    clearResultMessage: (state) => {
      state.success = false;
      state.error = null;
      state.message = "";
    },
    clearCheckResult: (state) => {
      state.checkResult = null;
    },
    clearCurrentResult: (state) => {
      state.result = null;
      state.summary = null;
    },
    clearResults: (state) => {
      state.results = [];
    },
    clearResultError: (state) => {
      state.error = null;
    },
    clearResultSummary: (state) => {
      state.summary = null;
    },
    clearUnbetNumbers: (state) => {
      state.unbetNumbers = [];
    },
  },

  extraReducers: (builder) => {
    // GET ALL
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
        state.error = action.payload?.message || "Failed to fetch results";
      });

    // GET BY ID
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
        state.error = action.payload?.message || "Failed to fetch result";
      });

    // CREATE
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
        state.message = action.payload?.message || "Result created successfully";
        state.error = null;

        const newResult = action.payload?.result;
        if (newResult) {
          const exists = state.results.some((item) => item._id === newResult._id);
          if (!exists) state.results.unshift(newResult);
          state.result = newResult;
        }
        state.summary = action.payload?.summary || null;
      })
      .addCase(createResult.rejected, (state, action) => {
        state.createLoading = false;
        state.success = false;
        state.error = action.payload?.message || "Failed to create result";
      });

    // UPDATE
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
        state.message = action.payload?.message || "Result updated successfully";
        state.error = null;

        const updated = action.payload?.result;
        state.summary = action.payload?.summary || null;
        if (updated?._id) upsertResult(state, updated);
      })
      .addCase(updateResult.rejected, (state, action) => {
        state.updateLoading = false;
        state.success = false;
        state.error = action.payload?.message || "Failed to update result";
      });

    // PUBLISH
    builder
      .addCase(publishResult.pending, (state) => {
        state.publishLoading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(publishResult.fulfilled, (state, action) => {
        state.publishLoading = false;
        state.success = true;
        state.message = action.payload?.message || "Result published successfully";
        state.error = null;
        const published = action.payload?.result;
        if (published?._id) upsertResult(state, published);
      })
      .addCase(publishResult.rejected, (state, action) => {
        state.publishLoading = false;
        state.success = false;
        state.error = action.payload?.message || "Failed to publish result";
      });

    // UNPUBLISH
    builder
      .addCase(unpublishResult.pending, (state) => {
        state.publishLoading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(unpublishResult.fulfilled, (state, action) => {
        state.publishLoading = false;
        state.success = true;
        state.message = action.payload?.message || "Result unpublished successfully";
        state.error = null;
        const unpublished = action.payload?.result;
        if (unpublished?._id) upsertResult(state, unpublished);
      })
      .addCase(unpublishResult.rejected, (state, action) => {
        state.publishLoading = false;
        state.success = false;
        state.error = action.payload?.message || "Failed to unpublish result";
      });

    // DELETE
    builder
      .addCase(deleteResult.pending, (state) => {
        state.deleteLoading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(deleteResult.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.success = true;
        state.message = action.payload?.message || "Result deleted successfully";
        state.error = null;
        const deletedId = action.payload?.id;
        state.results = state.results.filter((item) => item._id !== deletedId);
        if (state.result?._id === deletedId) state.result = null;
      })
      .addCase(deleteResult.rejected, (state, action) => {
        state.deleteLoading = false;
        state.success = false;
        state.error = action.payload?.message || "Failed to delete result";
      });

    // CHECK NUMBER
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
        state.error = action.payload?.message || "Failed to check number";
      });

    // UNBET NUMBERS
    builder
      .addCase(getUnbetNumbers.pending, (state) => {
        state.unbetLoading = true;
        state.error = null;
        state.unbetNumbers = [];
      })
      .addCase(getUnbetNumbers.fulfilled, (state, action) => {
        state.unbetLoading = false;
        state.unbetNumbers = action.payload?.numbers || [];
      })
      .addCase(getUnbetNumbers.rejected, (state, action) => {
        state.unbetLoading = false;
        state.unbetNumbers = [];
        state.error = action.payload?.message || "Failed to fetch unbet numbers";
      });
  },
});

export const {
  clearResultMessage,
  clearCheckResult,
  clearCurrentResult,
  clearResults,
  clearResultError,
  clearResultSummary,
  clearUnbetNumbers,
} = lotteryResultSlice.actions;

// =====================================================
// SELECTORS
// =====================================================
export const selectLotteryResults = (state) => state.lotteryResult?.results || [];
export const selectLotteryResult = (state) => state.lotteryResult?.result || null;
export const selectLotterySummary = (state) => state.lotteryResult?.summary || null;
export const selectLotteryCheckResult = (state) => state.lotteryResult?.checkResult || null;
export const selectLotteryLoading = (state) => state.lotteryResult?.loading || false;
export const selectLotteryCreateLoading = (state) => state.lotteryResult?.createLoading || false;
export const selectLotteryUpdateLoading = (state) => state.lotteryResult?.updateLoading || false;
export const selectLotteryPublishLoading = (state) => state.lotteryResult?.publishLoading || false;
export const selectLotteryDeleteLoading = (state) => state.lotteryResult?.deleteLoading || false;
export const selectLotteryCheckLoading = (state) => state.lotteryResult?.checkLoading || false;
export const selectLotterySuccess = (state) => state.lotteryResult?.success || false;
export const selectLotteryError = (state) => state.lotteryResult?.error || null;
export const selectLotteryMessage = (state) => state.lotteryResult?.message || "";
export const selectUnbetNumbers = (state) => state.lotteryResult?.unbetNumbers || [];
export const selectUnbetLoading = (state) => state.lotteryResult?.unbetLoading || false;

export default lotteryResultSlice.reducer;