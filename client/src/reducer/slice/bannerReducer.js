import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api";

// =====================================================
// INITIAL STATE
// =====================================================

const initialState = {
    // All banners - Admin
    banners: [],

    // Active banners - Homepage
    activeBanners: [],

    // Loading states
    loading: false,
    activeLoading: false,
    actionLoading: false,

    // Error / Success
    error: null,
    activeError: null,
    actionError: null,
    success: null,
};

// =====================================================
// GET ALL BANNERS
// GET /api/banners
// =====================================================

export const getBanners = createAsyncThunk(
    "banner/getBanners",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get("/banners");

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to fetch banners."
            );
        }
    }
);

// =====================================================
// GET ACTIVE BANNERS
// GET /api/banners/active
// Homepage ke liye
// =====================================================

export const getActiveBanners = createAsyncThunk(
    "banner/getActiveBanners",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get("/banners/active");

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to fetch active banners."
            );
        }
    }
);

// =====================================================
// ADD BANNER
// POST /api/banners
// =====================================================

export const addBanner = createAsyncThunk(
    "banner/addBanner",
    async ({ image, title = "" }, { rejectWithValue }) => {
        try {
            if (!image) {
                return rejectWithValue("Banner image is required.");
            }

            const formData = new FormData();

            // IMPORTANT:
            // Backend:
            // upload.single("banner")
            formData.append("banner", image);

            // Optional title
            formData.append("title", title);

            const response = await api.post(
                "/banners",
                formData,
                {
                    headers: {
                        // Axios/browser boundary automatically set karega.
                        "Content-Type": undefined,
                    },
                }
            );

            return response.data;
        } catch (error) {
            console.error(
                "ADD BANNER API ERROR:",
                error.response?.data || error
            );

            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to upload banner."
            );
        }
    }
);

// =====================================================
// DELETE BANNER
// DELETE /api/banners/:id
// =====================================================

export const deleteBanner = createAsyncThunk(
    "banner/deleteBanner",
    async (id, { rejectWithValue }) => {
        try {
            if (!id) {
                return rejectWithValue("Banner ID is required.");
            }

            const response = await api.delete(`/banners/${id}`);

            return {
                ...response.data,
                id,
            };
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to delete banner."
            );
        }
    }
);

// =====================================================
// TOGGLE BANNER
// PATCH /api/banners/:id/toggle
// =====================================================

export const toggleBanner = createAsyncThunk(
    "banner/toggleBanner",
    async (id, { rejectWithValue }) => {
        try {
            if (!id) {
                return rejectWithValue("Banner ID is required.");
            }

            const response = await api.patch(`/banners/${id}/toggle`);

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to update banner."
            );
        }
    }
);

// =====================================================
// SLICE
// =====================================================

const bannerSlice = createSlice({
    name: "banner",

    initialState,

    reducers: {
        // ---------------------------------------------------
        // CLEAR ERROR
        // ---------------------------------------------------

        clearBannerError: (state) => {
            state.error = null;
            state.activeError = null;
            state.actionError = null;
        },

        // ---------------------------------------------------
        // CLEAR SUCCESS
        // ---------------------------------------------------

        clearBannerSuccess: (state) => {
            state.success = null;
        },

        // ---------------------------------------------------
        // CLEAR ACTION STATE
        // ---------------------------------------------------

        clearBannerActionState: (state) => {
            state.actionError = null;
            state.success = null;
        },

        // ---------------------------------------------------
        // RESET BANNER STATE
        // ---------------------------------------------------

        resetBannerState: () => {
            return initialState;
        },
    },

    extraReducers: (builder) => {
        // ===================================================
        // GET ALL BANNERS
        // ===================================================

        builder
            .addCase(getBanners.pending, (state) => {
                state.loading = true;
                state.error = null;
            })

            .addCase(getBanners.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;

                state.banners = action.payload?.data || [];
            })

            .addCase(getBanners.rejected, (state, action) => {
                state.loading = false;

                state.error =
                    action.payload || "Failed to fetch banners.";

                state.banners = [];
            });

        // ===================================================
        // GET ACTIVE BANNERS
        // ===================================================

        builder
            .addCase(getActiveBanners.pending, (state) => {
                state.activeLoading = true;
                state.activeError = null;
            })

            .addCase(getActiveBanners.fulfilled, (state, action) => {
                state.activeLoading = false;
                state.activeError = null;

                state.activeBanners = action.payload?.data || [];
            })

            .addCase(getActiveBanners.rejected, (state, action) => {
                state.activeLoading = false;

                state.activeError =
                    action.payload ||
                    "Failed to fetch active banners.";

                state.activeBanners = [];
            });

        // ===================================================
        // ADD BANNER
        // ===================================================

        builder
            .addCase(addBanner.pending, (state) => {
                state.actionLoading = true;
                state.actionError = null;
                state.success = null;
            })

            .addCase(addBanner.fulfilled, (state, action) => {
                state.actionLoading = false;
                state.actionError = null;

                const newBanner = action.payload?.data;

                if (newBanner) {
                    // Add to admin list
                    state.banners.unshift(newBanner);

                    // If backend created it active, also add
                    // to active list.
                    if (newBanner.isActive) {
                        state.activeBanners.unshift(newBanner);
                    }
                }

                state.success =
                    action.payload?.message ||
                    "Banner uploaded successfully.";
            })

            .addCase(addBanner.rejected, (state, action) => {
                state.actionLoading = false;

                state.actionError =
                    action.payload ||
                    "Failed to upload banner.";

                state.success = null;
            });

        // ===================================================
        // DELETE BANNER
        // ===================================================

        builder
            .addCase(deleteBanner.pending, (state) => {
                state.actionLoading = true;
                state.actionError = null;
                state.success = null;
            })

            .addCase(deleteBanner.fulfilled, (state, action) => {
                state.actionLoading = false;
                state.actionError = null;

                const deletedId = action.payload?.id;

                state.banners = state.banners.filter(
                    (banner) => banner._id !== deletedId
                );

                state.activeBanners = state.activeBanners.filter(
                    (banner) => banner._id !== deletedId
                );

                state.success =
                    action.payload?.message ||
                    "Banner deleted successfully.";
            })

            .addCase(deleteBanner.rejected, (state, action) => {
                state.actionLoading = false;

                state.actionError =
                    action.payload ||
                    "Failed to delete banner.";

                state.success = null;
            });

        // ===================================================
        // TOGGLE BANNER
        // ===================================================

        builder
            .addCase(toggleBanner.pending, (state) => {
                state.actionLoading = true;
                state.actionError = null;
                state.success = null;
            })

            .addCase(toggleBanner.fulfilled, (state, action) => {
                state.actionLoading = false;
                state.actionError = null;

                const updatedBanner = action.payload?.data;

                if (updatedBanner?._id) {
                    // Update admin banner list
                    state.banners = state.banners.map((banner) =>
                        banner._id === updatedBanner._id
                            ? updatedBanner
                            : banner
                    );

                    // Update active banners
                    if (updatedBanner.isActive) {
                        const exists = state.activeBanners.some(
                            (banner) =>
                                banner._id === updatedBanner._id
                        );

                        if (exists) {
                            state.activeBanners =
                                state.activeBanners.map((banner) =>
                                    banner._id === updatedBanner._id
                                        ? updatedBanner
                                        : banner
                                );
                        } else {
                            state.activeBanners.unshift(updatedBanner);
                        }
                    } else {
                        state.activeBanners =
                            state.activeBanners.filter(
                                (banner) =>
                                    banner._id !== updatedBanner._id
                            );
                    }
                }

                state.success =
                    action.payload?.message ||
                    "Banner status updated successfully.";
            })

            .addCase(toggleBanner.rejected, (state, action) => {
                state.actionLoading = false;

                state.actionError =
                    action.payload ||
                    "Failed to update banner.";

                state.success = null;
            });
    },
});

// =====================================================
// ACTIONS
// =====================================================

export const {
    clearBannerError,
    clearBannerSuccess,
    clearBannerActionState,
    resetBannerState,
} = bannerSlice.actions;

// =====================================================
// SELECTORS
// =====================================================

export const selectBanners = (state) =>
    state.banner?.banners || [];

export const selectActiveBanners = (state) =>
    state.banner?.activeBanners || [];

export const selectBannerLoading = (state) =>
    state.banner?.loading || false;

export const selectActiveBannerLoading = (state) =>
    state.banner?.activeLoading || false;

export const selectBannerActionLoading = (state) =>
    state.banner?.actionLoading || false;

export const selectBannerError = (state) =>
    state.banner?.error || null;

export const selectActiveBannerError = (state) =>
    state.banner?.activeError || null;

export const selectBannerActionError = (state) =>
    state.banner?.actionError || null;

export const selectBannerSuccess = (state) =>
    state.banner?.success || null;

// =====================================================
// EXPORT REDUCER
// =====================================================

export default bannerSlice.reducer;