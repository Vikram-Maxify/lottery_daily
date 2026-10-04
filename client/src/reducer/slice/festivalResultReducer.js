import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import api from "../api";

// =====================================================
// BASE PATH
// server.js: app.use("/api/festival-result", ...)
// api.js: baseURL = "http://localhost:6099/api"
// Final URL: http://localhost:6099/api/festival-result/...
// =====================================================
const BASE = "/festival-result";

// =====================================================
// HELPER — CLEAN ERROR MESSAGE
// =====================================================
const extractError = (error, fallback) => {
  const data = error?.response?.data;

  if (!data) {
    return error?.message || fallback;
  }

  if (data.message && data.error && data.message !== data.error) {
    return `${data.message} (${data.error})`;
  }

  return data.message || data.error || error?.message || fallback;
};

// =====================================================
// THUNK FACTORY
// =====================================================
const makeThunk = (type, fallback, call) =>
  createAsyncThunk(
    `festivalResult/${type}`,
    async (arg, { rejectWithValue }) => {
      try {
        return await call(arg);
      } catch (error) {
        return rejectWithValue({
          success: false,
          message: extractError(error, fallback),
        });
      }
    }
  );

// =====================================================
// CREATE FESTIVAL RESULT
// POST /festival-result/create
// =====================================================
export const createFestivalResult = makeThunk(
  "create",
  "Failed to create result",
  async (data) => (await api.post(`${BASE}/create`, data)).data
);

// =====================================================
// GET ALL FESTIVAL RESULTS
// GET /festival-result/all
// =====================================================
export const getAllFestivalResults = makeThunk(
  "getAll",
  "Failed to fetch results",
  async () => (await api.get(`${BASE}/all`)).data
);

// =====================================================
// GET FESTIVAL RESULT BY ID
// GET /festival-result/:id
// =====================================================
export const getFestivalResultById = makeThunk(
  "getById",
  "Failed to fetch result",
  async (id) => (await api.get(`${BASE}/${id}`)).data
);

// =====================================================
// UPDATE FESTIVAL RESULT
// PATCH /festival-result/:id
// =====================================================
export const updateFestivalResult = makeThunk(
  "update",
  "Failed to update result",
  async ({ id, data }) => (await api.patch(`${BASE}/${id}`, data)).data
);

// =====================================================
// PUBLISH FESTIVAL RESULT
// PATCH /festival-result/:id/publish
// =====================================================
export const publishFestivalResult = makeThunk(
  "publish",
  "Failed to publish result",
  async (id) => (await api.patch(`${BASE}/${id}/publish`)).data
);

// =====================================================
// UNPUBLISH FESTIVAL RESULT
// PATCH /festival-result/:id/unpublish
// =====================================================
export const unpublishFestivalResult = makeThunk(
  "unpublish",
  "Failed to unpublish result",
  async (id) => (await api.patch(`${BASE}/${id}/unpublish`)).data
);

// =====================================================
// DELETE FESTIVAL RESULT
// DELETE /festival-result/:id
// =====================================================
export const deleteFestivalResult = makeThunk(
  "delete",
  "Failed to delete result",
  async (id) => ({ id, ...(await api.delete(`${BASE}/${id}`)).data })
);

// =====================================================
// CHECK NUMBER
// POST /festival-result/check-number
// =====================================================
export const checkFestivalNumber = makeThunk(
  "checkNumber",
  "Failed to check number",
  async (data) => (await api.post(`${BASE}/check-number`, data)).data
);

// =====================================================
// INITIAL STATE
// =====================================================
const initialState = {
  results: [],
  result: null,
  checkResult: null,
  summary: null,

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

  if (index === -1) {
    state.results.unshift(newResult);
    state.result = newResult;
    return;
  }

  const old = state.results[index];
  const merged = {
    ...newResult,
    lotteryConfigId:
      newResult.lotteryConfigId && typeof newResult.lotteryConfigId === "object"
        ? newResult.lotteryConfigId
        : old.lotteryConfigId,
  };

  state.results[index] = merged;
  state.result = merged;
};

// =====================================================
// SLICE
// =====================================================
const festivalResultSlice = createSlice({
  name: "festivalResult",

  initialState,

  reducers: {
    clearFestivalResultMessage: (state) => {
      state.success = false;
      state.error = null;
      state.message = "";
    },
    clearFestivalCheckResult: (state) => {
      state.checkResult = null;
    },
    clearFestivalCurrentResult: (state) => {
      state.result = null;
      state.summary = null;
    },
    clearFestivalResults: (state) => {
      state.results = [];
    },
    clearFestivalResultError: (state) => {
      state.error = null;
    },
    clearFestivalResultSummary: (state) => {
      state.summary = null;
    },
  },

  extraReducers: (builder) => {
    // =================================================
    // GET ALL
    // =================================================
    builder
      .addCase(getAllFestivalResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllFestivalResults.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload?.results || [];
        state.error = null;
      })
      .addCase(getAllFestivalResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch results";
      });

    // =================================================
    // GET BY ID
    // =================================================
    builder
      .addCase(getFestivalResultById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFestivalResultById.fulfilled, (state, action) => {
        state.loading = false;
        state.result = action.payload?.result || null;
        state.error = null;
      })
      .addCase(getFestivalResultById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch result";
      });

    // =================================================
    // CREATE
    // =================================================
    builder
      .addCase(createFestivalResult.pending, (state) => {
        state.createLoading = true;
        state.success = false;
        state.error = null;
        state.message = "";
        state.summary = null;
      })
      .addCase(createFestivalResult.fulfilled, (state, action) => {
        state.createLoading = false;
        state.success = true;
        state.message =
          action.payload?.message || "Result created successfully";
        state.summary = action.payload?.summary || null;
        upsertResult(state, action.payload?.result);
      })
      .addCase(createFestivalResult.rejected, (state, action) => {
        state.createLoading = false;
        state.success = false;
        state.error = action.payload?.message || "Failed to create result";
      });

    // =================================================
    // UPDATE
    // =================================================
    builder
      .addCase(updateFestivalResult.pending, (state) => {
        state.updateLoading = true;
        state.success = false;
        state.error = null;
        state.message = "";
        state.summary = null;
      })
      .addCase(updateFestivalResult.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.success = true;
        state.message =
          action.payload?.message || "Result updated successfully";
        state.summary = action.payload?.summary || null;
        upsertResult(state, action.payload?.result);
      })
      .addCase(updateFestivalResult.rejected, (state, action) => {
        state.updateLoading = false;
        state.success = false;
        state.error = action.payload?.message || "Failed to update result";
      });

    // =================================================
    // PUBLISH
    // =================================================
    builder
      .addCase(publishFestivalResult.pending, (state) => {
        state.publishLoading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(publishFestivalResult.fulfilled, (state, action) => {
        state.publishLoading = false;
        state.success = true;
        state.message =
          action.payload?.message || "Result published successfully";
        upsertResult(state, action.payload?.result);
      })
      .addCase(publishFestivalResult.rejected, (state, action) => {
        state.publishLoading = false;
        state.success = false;
        state.error = action.payload?.message || "Failed to publish result";
      });

    // =================================================
    // UNPUBLISH
    // =================================================
    builder
      .addCase(unpublishFestivalResult.pending, (state) => {
        state.publishLoading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(unpublishFestivalResult.fulfilled, (state, action) => {
        state.publishLoading = false;
        state.success = true;
        state.message =
          action.payload?.message || "Result unpublished successfully";
        upsertResult(state, action.payload?.result);
      })
      .addCase(unpublishFestivalResult.rejected, (state, action) => {
        state.publishLoading = false;
        state.success = false;
        state.error = action.payload?.message || "Failed to unpublish result";
      });

    // =================================================
    // DELETE
    // =================================================
    builder
      .addCase(deleteFestivalResult.pending, (state) => {
        state.deleteLoading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(deleteFestivalResult.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.success = true;
        state.message =
          action.payload?.message || "Result deleted successfully";

        const deletedId = action.payload?.id;
        state.results = state.results.filter((item) => item._id !== deletedId);

        if (state.result?._id === deletedId) state.result = null;
      })
      .addCase(deleteFestivalResult.rejected, (state, action) => {
        state.deleteLoading = false;
        state.success = false;
        state.error = action.payload?.message || "Failed to delete result";
      });

    // =================================================
    // CHECK NUMBER
    // =================================================
    builder
      .addCase(checkFestivalNumber.pending, (state) => {
        state.checkLoading = true;
        state.checkResult = null;
        state.error = null;
      })
      .addCase(checkFestivalNumber.fulfilled, (state, action) => {
        state.checkLoading = false;
        state.checkResult = action.payload || null;
        state.error = null;
      })
      .addCase(checkFestivalNumber.rejected, (state, action) => {
        state.checkLoading = false;
        state.error = action.payload?.message || "Failed to check number";
      });
  },
});

// =====================================================
// ACTIONS
// =====================================================
export const {
  clearFestivalResultMessage,
  clearFestivalCheckResult,
  clearFestivalCurrentResult,
  clearFestivalResults,
  clearFestivalResultError,
  clearFestivalResultSummary,
} = festivalResultSlice.actions;

// =====================================================
// SELECTORS
// =====================================================
export const selectFestivalResults = (state) =>
  state.festivalResult?.results || [];
export const selectFestivalResult = (state) =>
  state.festivalResult?.result || null;
export const selectFestivalCheckResult = (state) =>
  state.festivalResult?.checkResult || null;
export const selectFestivalSummary = (state) =>
  state.festivalResult?.summary || null;
export const selectFestivalLoading = (state) =>
  state.festivalResult?.loading || false;
export const selectFestivalCreateLoading = (state) =>
  state.festivalResult?.createLoading || false;
export const selectFestivalUpdateLoading = (state) =>
  state.festivalResult?.updateLoading || false;
export const selectFestivalPublishLoading = (state) =>
  state.festivalResult?.publishLoading || false;
export const selectFestivalDeleteLoading = (state) =>
  state.festivalResult?.deleteLoading || false;
export const selectFestivalCheckLoading = (state) =>
  state.festivalResult?.checkLoading || false;
export const selectFestivalSuccess = (state) =>
  state.festivalResult?.success || false;
export const selectFestivalError = (state) =>
  state.festivalResult?.error || null;
export const selectFestivalMessage = (state) =>
  state.festivalResult?.message || "";

export default festivalResultSlice.reducer;