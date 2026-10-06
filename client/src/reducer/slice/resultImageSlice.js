import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api";

// =====================================================
// INITIAL STATE
// =====================================================

const initialState = {
  // Admin lists & data
  images: [],
  totalCount: 0,

  // Public lists
  dailyImages: [],
  festivalImages: [],

  // Single item details
  selectedImage: null,

  // Loading states
  loading: false,
  dailyLoading: false,
  festivalLoading: false,
  singleLoading: false,
  actionLoading: false,

  // Errors & success indicators
  error: null,
  dailyError: null,
  festivalError: null,
  actionError: null,
  success: false,
  actionSuccess: false,
  message: "",
};

// =====================================================
// ASYNC THUNKS
// =====================================================

// 1. CREATE RESULT IMAGE (ADMIN)
// POST /api/result-images
export const createResultImage = createAsyncThunk(
  "resultImages/createResultImage",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post("/result-images", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to create result image."
      );
    }
  }
);

// 2. GET ALL RESULT IMAGES (ADMIN)
// GET /api/result-images?type=...&isActive=...
export const getAllResultImages = createAsyncThunk(
  "resultImages/getAllResultImages",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append("type", filters.type);
      if (filters.isActive !== undefined && filters.isActive !== "") {
        params.append("isActive", filters.isActive);
      }

      const queryString = params.toString();
      const url = queryString ? `/result-images?${queryString}` : "/result-images";

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch result images."
      );
    }
  }
);

// 3. GET DAILY RESULT IMAGES (PUBLIC / USER)
// GET /api/result-images/public/daily?date=...
export const getDailyResultImages = createAsyncThunk(
  "resultImages/getDailyResultImages",
  async (params = {}, { rejectWithValue }) => {
    try {
      let url = "/result-images/public/daily";
      if (params.date) {
        url += `?date=${encodeURIComponent(params.date)}`;
      }

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch daily result images."
      );
    }
  }
);

// 4. GET FESTIVAL RESULT IMAGES (PUBLIC / USER)
// GET /api/result-images/public/festival
export const getFestivalResultImages = createAsyncThunk(
  "resultImages/getFestivalResultImages",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/result-images/public/festival");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch festival result images."
      );
    }
  }
);

// 5. GET SINGLE RESULT IMAGE BY ID (ADMIN)
// GET /api/result-images/:id
export const getResultImageById = createAsyncThunk(
  "resultImages/getResultImageById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/result-images/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch result image details."
      );
    }
  }
);

// 6. UPDATE RESULT IMAGE (ADMIN)
// PUT /api/result-images/:id
export const updateResultImage = createAsyncThunk(
  "resultImages/updateResultImage",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const isFormData = formData instanceof FormData;
      const headers = isFormData
        ? { "Content-Type": "multipart/form-data" }
        : { "Content-Type": "application/json" };

      const response = await api.put(`/result-images/${id}`, formData, {
        headers,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to update result image."
      );
    }
  }
);

// 7. DELETE RESULT IMAGE (ADMIN)
// DELETE /api/result-images/:id
export const deleteResultImage = createAsyncThunk(
  "resultImages/deleteResultImage",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/result-images/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete result image."
      );
    }
  }
);

// 8. TOGGLE RESULT IMAGE ACTIVE / INACTIVE (ADMIN)
// PATCH /api/result-images/:id/toggle
export const toggleResultImage = createAsyncThunk(
  "resultImages/toggleResultImage",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/result-images/${id}/toggle`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to toggle result image status."
      );
    }
  }
);

// =====================================================
// SLICE
// =====================================================

const resultImageSlice = createSlice({
  name: "resultImages",
  initialState,
  reducers: {
    clearResultImageMessages: (state) => {
      state.success = false;
      state.actionSuccess = false;
      state.message = "";
    },
    clearResultImageErrors: (state) => {
      state.error = null;
      state.dailyError = null;
      state.festivalError = null;
      state.actionError = null;
    },
    clearSelectedResultImage: (state) => {
      state.selectedImage = null;
    },
    resetResultImageState: () => initialState,
  },
  extraReducers: (builder) => {
    // -------------------------------------------------
    // CREATE
    // -------------------------------------------------
    builder
      .addCase(createResultImage.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
        state.actionSuccess = false;
      })
      .addCase(createResultImage.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.actionSuccess = true;
        state.actionError = null;
        state.message = action.payload?.message || "Result image created successfully";

        const newItem = action.payload?.data;
        if (newItem) {
          state.images.unshift(newItem);
          state.totalCount += 1;

          if (newItem.isActive) {
            if (newItem.type === "DAILY") {
              state.dailyImages.unshift(newItem);
            } else if (newItem.type === "FESTIVAL") {
              state.festivalImages.unshift(newItem);
            }
          }
        }
      })
      .addCase(createResultImage.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
        state.actionSuccess = false;
      });

    // -------------------------------------------------
    // GET ALL (ADMIN)
    // -------------------------------------------------
    builder
      .addCase(getAllResultImages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllResultImages.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const list = Array.isArray(action.payload?.data)
          ? action.payload.data
          : Array.isArray(action.payload)
          ? action.payload
          : [];
        state.images = list;
        state.totalCount = action.payload?.count || list.length;
      })
      .addCase(getAllResultImages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // -------------------------------------------------
    // GET DAILY (PUBLIC)
    // -------------------------------------------------
    builder
      .addCase(getDailyResultImages.pending, (state) => {
        state.dailyLoading = true;
        state.dailyError = null;
      })
      .addCase(getDailyResultImages.fulfilled, (state, action) => {
        state.dailyLoading = false;
        state.dailyError = null;
        const list = Array.isArray(action.payload?.data)
          ? action.payload.data
          : Array.isArray(action.payload)
          ? action.payload
          : [];
        state.dailyImages = list;
      })
      .addCase(getDailyResultImages.rejected, (state, action) => {
        state.dailyLoading = false;
        state.dailyError = action.payload;
      });

    // -------------------------------------------------
    // GET FESTIVAL (PUBLIC)
    // -------------------------------------------------
    builder
      .addCase(getFestivalResultImages.pending, (state) => {
        state.festivalLoading = true;
        state.festivalError = null;
      })
      .addCase(getFestivalResultImages.fulfilled, (state, action) => {
        state.festivalLoading = false;
        state.festivalError = null;
        const list = Array.isArray(action.payload?.data)
          ? action.payload.data
          : Array.isArray(action.payload)
          ? action.payload
          : [];
        state.festivalImages = list;
      })
      .addCase(getFestivalResultImages.rejected, (state, action) => {
        state.festivalLoading = false;
        state.festivalError = action.payload;
      });

    // -------------------------------------------------
    // GET BY ID
    // -------------------------------------------------
    builder
      .addCase(getResultImageById.pending, (state) => {
        state.singleLoading = true;
        state.error = null;
      })
      .addCase(getResultImageById.fulfilled, (state, action) => {
        state.singleLoading = false;
        state.selectedImage = action.payload?.data || action.payload || null;
      })
      .addCase(getResultImageById.rejected, (state, action) => {
        state.singleLoading = false;
        state.error = action.payload;
      });

    // -------------------------------------------------
    // UPDATE
    // -------------------------------------------------
    builder
      .addCase(updateResultImage.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
        state.actionSuccess = false;
      })
      .addCase(updateResultImage.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.actionSuccess = true;
        state.actionError = null;
        state.message = action.payload?.message || "Result image updated successfully";

        const updated = action.payload?.data;
        if (updated) {
          const idx = state.images.findIndex((img) => img._id === updated._id);
          if (idx !== -1) {
            state.images[idx] = updated;
          }

          // Update daily / festival lists
          const dIdx = state.dailyImages.findIndex((img) => img._id === updated._id);
          if (dIdx !== -1) {
            if (updated.type === "DAILY" && updated.isActive) {
              state.dailyImages[dIdx] = updated;
            } else {
              state.dailyImages.splice(dIdx, 1);
            }
          } else if (updated.type === "DAILY" && updated.isActive) {
            state.dailyImages.unshift(updated);
          }

          const fIdx = state.festivalImages.findIndex((img) => img._id === updated._id);
          if (fIdx !== -1) {
            if (updated.type === "FESTIVAL" && updated.isActive) {
              state.festivalImages[fIdx] = updated;
            } else {
              state.festivalImages.splice(fIdx, 1);
            }
          } else if (updated.type === "FESTIVAL" && updated.isActive) {
            state.festivalImages.unshift(updated);
          }
        }
      })
      .addCase(updateResultImage.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
        state.actionSuccess = false;
      });

    // -------------------------------------------------
    // DELETE
    // -------------------------------------------------
    builder
      .addCase(deleteResultImage.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
        state.actionSuccess = false;
      })
      .addCase(deleteResultImage.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.actionSuccess = true;
        state.actionError = null;
        state.message = action.payload?.message || "Result image deleted successfully";

        const deletedId = action.payload?.id;
        if (deletedId) {
          state.images = state.images.filter((img) => img._id !== deletedId);
          state.dailyImages = state.dailyImages.filter((img) => img._id !== deletedId);
          state.festivalImages = state.festivalImages.filter((img) => img._id !== deletedId);
          state.totalCount = Math.max(0, state.totalCount - 1);
        }
      })
      .addCase(deleteResultImage.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
        state.actionSuccess = false;
      });

    // -------------------------------------------------
    // TOGGLE ACTIVE
    // -------------------------------------------------
    builder
      .addCase(toggleResultImage.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
        state.actionSuccess = false;
      })
      .addCase(toggleResultImage.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.actionSuccess = true;
        state.actionError = null;
        state.message = action.payload?.message || "Status toggled successfully";

        const toggled = action.payload?.data;
        if (toggled) {
          const idx = state.images.findIndex((img) => img._id === toggled._id);
          if (idx !== -1) {
            state.images[idx] = toggled;
          }

          if (toggled.type === "DAILY") {
            const dIdx = state.dailyImages.findIndex((img) => img._id === toggled._id);
            if (toggled.isActive) {
              if (dIdx === -1) state.dailyImages.unshift(toggled);
              else state.dailyImages[dIdx] = toggled;
            } else if (dIdx !== -1) {
              state.dailyImages.splice(dIdx, 1);
            }
          }

          if (toggled.type === "FESTIVAL") {
            const fIdx = state.festivalImages.findIndex((img) => img._id === toggled._id);
            if (toggled.isActive) {
              if (fIdx === -1) state.festivalImages.unshift(toggled);
              else state.festivalImages[fIdx] = toggled;
            } else if (fIdx !== -1) {
              state.festivalImages.splice(fIdx, 1);
            }
          }
        }
      })
      .addCase(toggleResultImage.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
        state.actionSuccess = false;
      });
  },
});

// =====================================================
// EXPORTS & SELECTORS
// =====================================================

export const {
  clearResultImageMessages,
  clearResultImageErrors,
  clearSelectedResultImage,
  resetResultImageState,
} = resultImageSlice.actions;

export const selectAllResultImages = (state) => state.resultImages?.images || [];
export const selectDailyResultImages = (state) => state.resultImages?.dailyImages || [];
export const selectFestivalResultImages = (state) =>
  state.resultImages?.festivalImages || [];
export const selectResultImagesLoading = (state) => state.resultImages?.loading || false;
export const selectDailyResultImagesLoading = (state) =>
  state.resultImages?.dailyLoading || false;
export const selectFestivalResultImagesLoading = (state) =>
  state.resultImages?.festivalLoading || false;
export const selectResultImagesActionLoading = (state) =>
  state.resultImages?.actionLoading || false;
export const selectResultImagesError = (state) => state.resultImages?.error || null;
export const selectResultImagesActionError = (state) =>
  state.resultImages?.actionError || null;
export const selectResultImagesSuccess = (state) =>
  state.resultImages?.actionSuccess || false;
export const selectResultImagesMessage = (state) => state.resultImages?.message || "";

export default resultImageSlice.reducer;
