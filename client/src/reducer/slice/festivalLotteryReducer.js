import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api";

// =====================================================
// INITIAL STATE
// =====================================================

const initialState = {
    // Lottery configs
    configs: [],
    activeLottery: null,
    selectedLottery: null,

    // User entries
    myEntries: [],

    // Single entry response
    entryResponse: null,

    // Bulk entry response
    bulkEntryResponse: null,

    // Loading states
    loading: false,
    activeLoading: false,
    singleLoading: false,
    myEntriesLoading: false,

    entryLoading: false,
    bulkEntryLoading: false,

    actionLoading: false,

    // Errors
    error: null,
    activeError: null,
    singleError: null,
    myEntriesError: null,

    entryError: null,
    bulkEntryError: null,

    actionError: null,

    // Success states
    success: false,
    entrySuccess: false,
    bulkEntrySuccess: false,
    actionSuccess: false,

    // Last message
    message: "",
};

// =====================================================
// GET ACTIVE LOTTERY
// PUBLIC
//
// GET /api/lottery-config/active
// =====================================================

export const getActiveFestivalLottery = createAsyncThunk(
    "festivalLottery/getActiveFestivalLottery",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get(
                "/lottery-config/active"
            );

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to fetch active lottery"
            );
        }
    }
);

// =====================================================
// GET MY LOTTERY ENTRIES
// USER
//
// GET /api/lottery-config/my-entries
// =====================================================

export const getMyFestivalLotteryEntries = createAsyncThunk(
    "festivalLottery/getMyFestivalLotteryEntries",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get(
                "/lottery-config/my-entries"
            );

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to fetch your lottery entries"
            );
        }
    }
);

// =====================================================
// ADD SINGLE LOTTERY ENTRY
// USER
//
// POST /api/lottery-config/entry
//
// BODY:
// {
//   configId,
//   number,
//   amount
// }
// =====================================================

export const addFestivalLotteryEntry = createAsyncThunk(
    "festivalLottery/addFestivalLotteryEntry",
    async (
        { configId, number, amount },
        { rejectWithValue }
    ) => {
        try {
            if (!configId) {
                return rejectWithValue(
                    "Lottery configuration is required"
                );
            }

            if (!number) {
                return rejectWithValue(
                    "Lottery number is required"
                );
            }

            if (
                amount === undefined ||
                amount === null ||
                amount === ""
            ) {
                return rejectWithValue(
                    "Lottery amount is required"
                );
            }

            const response = await api.post(
                "/lottery-config/entry",
                {
                    configId,
                    number,
                    amount,
                }
            );

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to submit lottery entry"
            );
        }
    }
);

// =====================================================
// ADD BULK LOTTERY ENTRIES
// USER
//
// POST /api/lottery-config/entry/bulk
//
// BODY:
// {
//   configId,
//   entries: [
//     { number, amount },
//     { number, amount }
//   ]
// }
// =====================================================

export const addBulkFestivalLotteryEntries = createAsyncThunk(
    "festivalLottery/addBulkFestivalLotteryEntries",
    async (
        { configId, entries },
        { rejectWithValue }
    ) => {
        try {
            if (!configId) {
                return rejectWithValue(
                    "Lottery configuration is required"
                );
            }

            if (
                !Array.isArray(entries) ||
                entries.length === 0
            ) {
                return rejectWithValue(
                    "Please select at least one lottery ticket"
                );
            }

            const response = await api.post(
                "/lottery-config/entry/bulk",
                {
                    configId,
                    entries,
                }
            );

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to purchase lottery tickets"
            );
        }
    }
);

// =====================================================
// GET ALL LOTTERY CONFIGS
// ADMIN
//
// GET /api/lottery-config/all
// =====================================================

export const getAllFestivalLotteries = createAsyncThunk(
    "festivalLottery/getAllFestivalLotteries",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get(
                "/lottery-config/all"
            );

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to fetch lottery configurations"
            );
        }
    }
);

// =====================================================
// GET LOTTERY CONFIG BY ID
// ADMIN
//
// GET /api/lottery-config/:id
// =====================================================

export const getFestivalLotteryById = createAsyncThunk(
    "festivalLottery/getFestivalLotteryById",
    async (id, { rejectWithValue }) => {
        try {
            if (!id) {
                return rejectWithValue(
                    "Lottery configuration ID is required"
                );
            }

            const response = await api.get(
                `/lottery-config/${id}`
            );

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to fetch lottery configuration"
            );
        }
    }
);

// =====================================================
// CREATE LOTTERY CONFIG
// ADMIN
//
// POST /api/lottery-config
// =====================================================

export const createFestivalLottery = createAsyncThunk(
    "festivalLottery/createFestivalLottery",
    async (lotteryData, { rejectWithValue }) => {
        try {
            if (!lotteryData) {
                return rejectWithValue(
                    "Lottery data is required"
                );
            }

            const response = await api.post(
                "/lottery-config",
                lotteryData
            );

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to create lottery"
            );
        }
    }
);

// =====================================================
// ACTIVATE LOTTERY
// ADMIN
//
// PATCH /api/lottery-config/:id/activate
// =====================================================

export const activateFestivalLottery = createAsyncThunk(
    "festivalLottery/activateFestivalLottery",
    async (id, { rejectWithValue }) => {
        try {
            if (!id) {
                return rejectWithValue(
                    "Lottery configuration ID is required"
                );
            }

            const response = await api.patch(
                `/lottery-config/${id}/activate`
            );

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to activate lottery"
            );
        }
    }
);

// =====================================================
// DEACTIVATE LOTTERY
// ADMIN
//
// NOTE:
// Current routes/controller do NOT expose a deactivate route.
// This thunk is intentionally NOT created.
//
// If backend route is added later:
// PATCH /api/lottery-config/:id/deactivate
// =====================================================

// =====================================================
// UPDATE USER ENTRY STATUS
// ADMIN
//
// PATCH
// /api/lottery-config/:configId/entry/:entryId/status
//
// BODY:
// {
//   status,
//   prizeType,
//   prize
// }
// =====================================================

export const updateFestivalLotteryEntryStatus =
    createAsyncThunk(
        "festivalLottery/updateFestivalLotteryEntryStatus",
        async (
            {
                configId,
                entryId,
                status,
                prizeType = null,
                prize = null,
            },
            { rejectWithValue }
        ) => {
            try {
                if (!configId) {
                    return rejectWithValue(
                        "Lottery configuration ID is required"
                    );
                }

                if (!entryId) {
                    return rejectWithValue(
                        "Lottery entry ID is required"
                    );
                }

                if (!status) {
                    return rejectWithValue(
                        "Entry status is required"
                    );
                }

                const response = await api.patch(
                    `/lottery-config/${configId}/entry/${entryId}/status`,
                    {
                        status,
                        prizeType,
                        prize,
                    }
                );

                return response.data;
            } catch (error) {
                return rejectWithValue(
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to update lottery entry status"
                );
            }
        }
    );

// =====================================================
// DELETE LOTTERY CONFIG
// ADMIN
//
// DELETE /api/lottery-config/:id
// =====================================================

export const deleteFestivalLottery = createAsyncThunk(
    "festivalLottery/deleteFestivalLottery",
    async (id, { rejectWithValue }) => {
        try {
            if (!id) {
                return rejectWithValue(
                    "Lottery configuration ID is required"
                );
            }

            const response = await api.delete(
                `/lottery-config/${id}`
            );

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to delete lottery"
            );
        }
    }
);

// =====================================================
// SLICE
// =====================================================

const festivalLotterySlice = createSlice({
    name: "festivalLottery",

    initialState,

    reducers: {
        // -------------------------------------------------
        // CLEAR GENERAL ERROR
        // -------------------------------------------------

        clearFestivalLotteryError: (state) => {
            state.error = null;
            state.activeError = null;
            state.singleError = null;
            state.myEntriesError = null;
            state.entryError = null;
            state.bulkEntryError = null;
            state.actionError = null;
        },

        // -------------------------------------------------
        // CLEAR ENTRY ERROR
        // -------------------------------------------------

        clearFestivalLotteryEntryError: (state) => {
            state.entryError = null;
            state.bulkEntryError = null;
        },

        // -------------------------------------------------
        // CLEAR ACTION ERROR
        // -------------------------------------------------

        clearFestivalLotteryActionError: (state) => {
            state.actionError = null;
        },

        // -------------------------------------------------
        // CLEAR SUCCESS STATES
        // -------------------------------------------------

        clearFestivalLotterySuccess: (state) => {
            state.success = false;
            state.entrySuccess = false;
            state.bulkEntrySuccess = false;
            state.actionSuccess = false;
            state.message = "";
        },

        // -------------------------------------------------
        // CLEAR ENTRY RESPONSE
        // -------------------------------------------------

        clearFestivalLotteryEntryResponse: (state) => {
            state.entryResponse = null;
            state.entrySuccess = false;
            state.entryError = null;
        },

        // -------------------------------------------------
        // CLEAR BULK RESPONSE
        // -------------------------------------------------

        clearFestivalLotteryBulkResponse: (state) => {
            state.bulkEntryResponse = null;
            state.bulkEntrySuccess = false;
            state.bulkEntryError = null;
        },

        // -------------------------------------------------
        // CLEAR SELECTED LOTTERY
        // -------------------------------------------------

        clearSelectedFestivalLottery: (state) => {
            state.selectedLottery = null;
            state.singleError = null;
        },

        // -------------------------------------------------
        // RESET STATE
        // -------------------------------------------------

        resetFestivalLotteryState: () => initialState,
    },

    // =====================================================
    // EXTRA REDUCERS
    // =====================================================

    extraReducers: (builder) => {
        // =================================================
        // GET ACTIVE LOTTERY
        // =================================================

        builder
            .addCase(
                getActiveFestivalLottery.pending,
                (state) => {
                    state.activeLoading = true;
                    state.activeError = null;
                }
            )

            .addCase(
                getActiveFestivalLottery.fulfilled,
                (state, action) => {
                    state.activeLoading = false;
                    state.activeError = null;
                    state.activeLottery =
                        action.payload?.data || null;
                }
            )

            .addCase(
                getActiveFestivalLottery.rejected,
                (state, action) => {
                    state.activeLoading = false;
                    state.activeLottery = null;
                    state.activeError =
                        action.payload ||
                        "Failed to fetch active lottery";
                }
            );

        // =================================================
        // GET MY ENTRIES
        // =================================================

        builder
            .addCase(
                getMyFestivalLotteryEntries.pending,
                (state) => {
                    state.myEntriesLoading = true;
                    state.myEntriesError = null;
                }
            )

            .addCase(
                getMyFestivalLotteryEntries.fulfilled,
                (state, action) => {
                    state.myEntriesLoading = false;
                    state.myEntriesError = null;
                    state.myEntries =
                        action.payload?.data || [];
                }
            )

            .addCase(
                getMyFestivalLotteryEntries.rejected,
                (state, action) => {
                    state.myEntriesLoading = false;
                    state.myEntriesError =
                        action.payload ||
                        "Failed to fetch lottery entries";
                }
            );

        // =================================================
        // SINGLE ENTRY
        // =================================================

        builder
            .addCase(
                addFestivalLotteryEntry.pending,
                (state) => {
                    state.entryLoading = true;
                    state.entryError = null;
                    state.entrySuccess = false;
                    state.message = "";
                }
            )

            .addCase(
                addFestivalLotteryEntry.fulfilled,
                (state, action) => {
                    state.entryLoading = false;
                    state.entryError = null;
                    state.entrySuccess = true;

                    state.entryResponse =
                        action.payload?.data || null;

                    state.message =
                        action.payload?.message ||
                        "Lottery entry submitted successfully";

                    // Add returned entry to my entries
                    const returnedEntry =
                        action.payload?.data?.entry;

                    if (returnedEntry) {
                        const exists =
                            state.myEntries.some(
                                (item) =>
                                    String(item.entryId) ===
                                    String(returnedEntry._id)
                            );

                        if (!exists) {
                            state.myEntries.unshift({
                                ...returnedEntry,
                                configId:
                                    action.payload?.data
                                        ?.configId,
                                marketName:
                                    action.payload?.data
                                        ?.marketName,
                                drawDate:
                                    action.payload?.data
                                        ?.drawDate,
                                drawTime:
                                    action.payload?.data
                                        ?.drawTime,
                            });
                        }
                    }

                    // Update active lottery users if available
                    if (
                        state.activeLottery &&
                        action.payload?.data?.configId &&
                        String(
                            state.activeLottery._id
                        ) ===
                            String(
                                action.payload.data
                                    .configId
                            )
                    ) {
                        state.activeLottery.users =
                            action.payload?.data
                                ?.allEntries ||
                            state.activeLottery.users;
                    }
                }
            )

            .addCase(
                addFestivalLotteryEntry.rejected,
                (state, action) => {
                    state.entryLoading = false;
                    state.entrySuccess = false;
                    state.entryError =
                        action.payload ||
                        "Failed to submit lottery entry";
                }
            );

        // =================================================
        // BULK ENTRY
        // =================================================

        builder
            .addCase(
                addBulkFestivalLotteryEntries.pending,
                (state) => {
                    state.bulkEntryLoading = true;
                    state.bulkEntryError = null;
                    state.bulkEntrySuccess = false;
                    state.message = "";
                }
            )

            .addCase(
                addBulkFestivalLotteryEntries.fulfilled,
                (state, action) => {
                    state.bulkEntryLoading = false;
                    state.bulkEntryError = null;
                    state.bulkEntrySuccess = true;

                    state.bulkEntryResponse =
                        action.payload?.data || null;

                    state.message =
                        action.payload?.message ||
                        "Lottery tickets purchased successfully";

                    // Add newly created entries
                    const newEntries =
                        action.payload?.data?.entries || [];

                    if (newEntries.length > 0) {
                        const formattedEntries =
                            newEntries.map((entry) => ({
                                ...entry,
                                configId:
                                    action.payload?.data
                                        ?.configId,
                                marketName:
                                    action.payload?.data
                                        ?.marketName,
                                month:
                                    action.payload?.data
                                        ?.month,
                                year:
                                    action.payload?.data
                                        ?.year,
                                drawDate:
                                    action.payload?.data
                                        ?.drawDate,
                                drawTime:
                                    action.payload?.data
                                        ?.drawTime,
                                prizes:
                                    state.activeLottery
                                        ?.prizes || null,
                            }));

                        state.myEntries = [
                            ...formattedEntries,
                            ...state.myEntries,
                        ];
                    }

                    // Update active lottery
                    if (
                        state.activeLottery &&
                        action.payload?.data?.configId &&
                        String(
                            state.activeLottery._id
                        ) ===
                            String(
                                action.payload.data
                                    .configId
                            )
                    ) {
                        state.activeLottery.users =
                            action.payload?.data
                                ?.allEntries ||
                            state.activeLottery.users;
                    }
                }
            )

            .addCase(
                addBulkFestivalLotteryEntries.rejected,
                (state, action) => {
                    state.bulkEntryLoading = false;
                    state.bulkEntrySuccess = false;
                    state.bulkEntryError =
                        action.payload ||
                        "Failed to purchase lottery tickets";
                }
            );

        // =================================================
        // GET ALL CONFIGS
        // =================================================

        builder
            .addCase(
                getAllFestivalLotteries.pending,
                (state) => {
                    state.loading = true;
                    state.error = null;
                    state.success = false;
                }
            )

            .addCase(
                getAllFestivalLotteries.fulfilled,
                (state, action) => {
                    state.loading = false;
                    state.error = null;
                    state.success = true;

                    state.configs =
                        action.payload?.data || [];
                }
            )

            .addCase(
                getAllFestivalLotteries.rejected,
                (state, action) => {
                    state.loading = false;
                    state.success = false;
                    state.error =
                        action.payload ||
                        "Failed to fetch lottery configurations";
                }
            );

        // =================================================
        // GET CONFIG BY ID
        // =================================================

        builder
            .addCase(
                getFestivalLotteryById.pending,
                (state) => {
                    state.singleLoading = true;
                    state.singleError = null;
                }
            )

            .addCase(
                getFestivalLotteryById.fulfilled,
                (state, action) => {
                    state.singleLoading = false;
                    state.singleError = null;

                    state.selectedLottery =
                        action.payload?.data || null;
                }
            )

            .addCase(
                getFestivalLotteryById.rejected,
                (state, action) => {
                    state.singleLoading = false;
                    state.selectedLottery = null;
                    state.singleError =
                        action.payload ||
                        "Failed to fetch lottery configuration";
                }
            );

        // =================================================
        // CREATE CONFIG
        // =================================================

        builder
            .addCase(
                createFestivalLottery.pending,
                (state) => {
                    state.actionLoading = true;
                    state.actionError = null;
                    state.actionSuccess = false;
                    state.message = "";
                }
            )

            .addCase(
                createFestivalLottery.fulfilled,
                (state, action) => {
                    state.actionLoading = false;
                    state.actionError = null;
                    state.actionSuccess = true;

                    state.message =
                        action.payload?.message ||
                        "Lottery configuration created successfully";

                    const createdLottery =
                        action.payload?.data;

                    if (createdLottery) {
                        state.configs.unshift(
                            createdLottery
                        );
                    }
                }
            )

            .addCase(
                createFestivalLottery.rejected,
                (state, action) => {
                    state.actionLoading = false;
                    state.actionSuccess = false;
                    state.actionError =
                        action.payload ||
                        "Failed to create lottery configuration";
                }
            );

        // =================================================
        // ACTIVATE CONFIG
        // =================================================

        builder
            .addCase(
                activateFestivalLottery.pending,
                (state) => {
                    state.actionLoading = true;
                    state.actionError = null;
                    state.actionSuccess = false;
                    state.message = "";
                }
            )

            .addCase(
                activateFestivalLottery.fulfilled,
                (state, action) => {
                    state.actionLoading = false;
                    state.actionError = null;
                    state.actionSuccess = true;

                    state.message =
                        action.payload?.message ||
                        "Lottery activated successfully";

                    const activatedLottery =
                        action.payload?.data;

                    if (activatedLottery) {
                        // Only one active lottery is allowed
                        state.configs =
                            state.configs.map(
                                (config) => ({
                                    ...config,
                                    isActive:
                                        String(
                                            config._id
                                        ) ===
                                        String(
                                            activatedLottery._id
                                        ),
                                })
                            );

                        state.activeLottery =
                            activatedLottery;

                        state.selectedLottery =
                            activatedLottery;
                    }
                }
            )

            .addCase(
                activateFestivalLottery.rejected,
                (state, action) => {
                    state.actionLoading = false;
                    state.actionSuccess = false;
                    state.actionError =
                        action.payload ||
                        "Failed to activate lottery";
                }
            );

        // =================================================
        // UPDATE ENTRY STATUS
        // =================================================

        builder
            .addCase(
                updateFestivalLotteryEntryStatus.pending,
                (state) => {
                    state.actionLoading = true;
                    state.actionError = null;
                    state.actionSuccess = false;
                    state.message = "";
                }
            )

            .addCase(
                updateFestivalLotteryEntryStatus.fulfilled,
                (state, action) => {
                    state.actionLoading = false;
                    state.actionError = null;
                    state.actionSuccess = true;

                    state.message =
                        action.payload?.message ||
                        "Entry status updated successfully";

                    const updatedEntry =
                        action.payload?.data;

                    if (!updatedEntry) {
                        return;
                    }

                    // Update selected lottery
                    if (
                        state.selectedLottery?.users
                    ) {
                        state.selectedLottery.users =
                            state.selectedLottery.users.map(
                                (entry) =>
                                    String(entry._id) ===
                                    String(
                                        updatedEntry._id
                                    )
                                        ? updatedEntry
                                        : entry
                            );
                    }

                    // Update configs
                    state.configs =
                        state.configs.map((config) => ({
                            ...config,
                            users: Array.isArray(
                                config.users
                            )
                                ? config.users.map(
                                      (entry) =>
                                          String(
                                              entry._id
                                          ) ===
                                          String(
                                              updatedEntry._id
                                          )
                                              ? updatedEntry
                                              : entry
                                  )
                                : config.users,
                        }));

                    // Update my entries
                    state.myEntries =
                        state.myEntries.map(
                            (entry) =>
                                String(entry.entryId) ===
                                String(
                                    updatedEntry._id
                                )
                                    ? {
                                          ...entry,
                                          ...updatedEntry,
                                          entryId:
                                              updatedEntry._id,
                                      }
                                    : entry
                        );
                }
            )

            .addCase(
                updateFestivalLotteryEntryStatus.rejected,
                (state, action) => {
                    state.actionLoading = false;
                    state.actionSuccess = false;
                    state.actionError =
                        action.payload ||
                        "Failed to update entry status";
                }
            );

        // =================================================
        // DELETE CONFIG
        // =================================================

        builder
            .addCase(
                deleteFestivalLottery.pending,
                (state) => {
                    state.actionLoading = true;
                    state.actionError = null;
                    state.actionSuccess = false;
                    state.message = "";
                }
            )

            .addCase(
                deleteFestivalLottery.fulfilled,
                (state, action) => {
                    state.actionLoading = false;
                    state.actionError = null;
                    state.actionSuccess = true;

                    state.message =
                        action.payload?.message ||
                        "Lottery deleted successfully";

                    const deletedId =
                        action.payload?.data?.id;

                    if (deletedId) {
                        state.configs =
                            state.configs.filter(
                                (config) =>
                                    String(
                                        config._id
                                    ) !==
                                    String(deletedId)
                            );

                        if (
                            String(
                                state.selectedLottery?._id
                            ) === String(deletedId)
                        ) {
                            state.selectedLottery = null;
                        }

                        if (
                            String(
                                state.activeLottery?._id
                            ) === String(deletedId)
                        ) {
                            state.activeLottery = null;
                        }
                    }
                }
            )

            .addCase(
                deleteFestivalLottery.rejected,
                (state, action) => {
                    state.actionLoading = false;
                    state.actionSuccess = false;
                    state.actionError =
                        action.payload ||
                        "Failed to delete lottery";
                }
            );
    },
});

// =====================================================
// ACTIONS
// =====================================================

export const {
    clearFestivalLotteryError,
    clearFestivalLotteryEntryError,
    clearFestivalLotteryActionError,
    clearFestivalLotterySuccess,
    clearFestivalLotteryEntryResponse,
    clearFestivalLotteryBulkResponse,
    clearSelectedFestivalLottery,
    resetFestivalLotteryState,
} = festivalLotterySlice.actions;

// =====================================================
// SELECTORS
// =====================================================

export const selectFestivalLottery = (state) =>
    state.festivalLottery;

export const selectFestivalLotteryConfigs = (state) =>
    state.festivalLottery?.configs || [];

export const selectActiveFestivalLottery = (state) =>
    state.festivalLottery?.activeLottery || null;

export const selectSelectedFestivalLottery = (state) =>
    state.festivalLottery?.selectedLottery || null;

export const selectMyFestivalLotteryEntries = (state) =>
    state.festivalLottery?.myEntries || [];

export const selectFestivalLotteryEntryResponse = (state) =>
    state.festivalLottery?.entryResponse || null;

export const selectFestivalLotteryBulkEntryResponse = (
    state
) =>
    state.festivalLottery?.bulkEntryResponse || null;

// Loading selectors

export const selectFestivalLotteryLoading = (state) =>
    state.festivalLottery?.loading || false;

export const selectActiveFestivalLotteryLoading = (
    state
) =>
    state.festivalLottery?.activeLoading || false;

export const selectFestivalLotterySingleLoading = (
    state
) =>
    state.festivalLottery?.singleLoading || false;

export const selectMyFestivalLotteryEntriesLoading = (
    state
) =>
    state.festivalLottery?.myEntriesLoading || false;

export const selectFestivalLotteryEntryLoading = (
    state
) =>
    state.festivalLottery?.entryLoading || false;

export const selectFestivalLotteryBulkEntryLoading = (
    state
) =>
    state.festivalLottery?.bulkEntryLoading || false;

export const selectFestivalLotteryActionLoading = (
    state
) =>
    state.festivalLottery?.actionLoading || false;

// Error selectors

export const selectFestivalLotteryError = (state) =>
    state.festivalLottery?.error || null;

export const selectActiveFestivalLotteryError = (
    state
) =>
    state.festivalLottery?.activeError || null;

export const selectFestivalLotterySingleError = (
    state
) =>
    state.festivalLottery?.singleError || null;

export const selectMyFestivalLotteryEntriesError = (
    state
) =>
    state.festivalLottery?.myEntriesError || null;

export const selectFestivalLotteryEntryError = (state) =>
    state.festivalLottery?.entryError || null;

export const selectFestivalLotteryBulkEntryError = (
    state
) =>
    state.festivalLottery?.bulkEntryError || null;

export const selectFestivalLotteryActionError = (
    state
) =>
    state.festivalLottery?.actionError || null;

// Success selectors

export const selectFestivalLotterySuccess = (state) =>
    state.festivalLottery?.success || false;

export const selectFestivalLotteryEntrySuccess = (
    state
) =>
    state.festivalLottery?.entrySuccess || false;

export const selectFestivalLotteryBulkEntrySuccess = (
    state
) =>
    state.festivalLottery?.bulkEntrySuccess || false;

export const selectFestivalLotteryActionSuccess = (
    state
) =>
    state.festivalLottery?.actionSuccess || false;

// Message selector

export const selectFestivalLotteryMessage = (state) =>
    state.festivalLottery?.message || "";

// =====================================================
// DEFAULT EXPORT
// =====================================================

export default festivalLotterySlice.reducer;