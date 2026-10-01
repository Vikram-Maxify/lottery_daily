
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api";

// =====================================================
// INITIAL STATE
// =====================================================

const initialState = {
  // ===================================================
  // LOTTERY CONFIG
  // ===================================================

  configs: [],
  config: null,
  activeConfig: null,

  // ===================================================
  // USER ENTRIES
  // ===================================================

  myEntries: [],
  totalEntries: 0,

  // ===================================================
  // PURCHASE
  // ===================================================

  purchasedEntries: [],
  purchaseResult: null,
  transactionId: null,

  // ===================================================
  // WALLET
  // ===================================================

  walletBalance: null,

  // ===================================================
  // LOADING STATES
  // ===================================================

  loading: false,
  activeLoading: false,
  configLoading: false,
  createLoading: false,
  updateLoading: false,
  purchaseLoading: false,
  bulkPurchaseLoading: false,
  myEntriesLoading: false,

  // ===================================================
  // ACTION LOADING STATES
  // ===================================================

  activateLoading: false,
  deactivateLoading: false,
  updateEntryStatusLoading: false,
  deleteLoading: false,

  // ===================================================
  // GENERAL ERROR / SUCCESS
  // ===================================================

  error: null,
  success: null,

  // ===================================================
  // SPECIFIC ERRORS
  // ===================================================

  activeError: null,
  configError: null,
  createError: null,
  updateError: null,
  purchaseError: null,
  bulkPurchaseError: null,
  myEntriesError: null,

  activateError: null,
  deactivateError: null,
  updateEntryStatusError: null,
  deleteError: null,

  // ===================================================
  // ACTION SUCCESS
  // ===================================================

  createSuccess: null,
  updateSuccess: null,
  purchaseSuccess: null,
  bulkPurchaseSuccess: null,
  activateSuccess: null,
  deactivateSuccess: null,
  updateEntryStatusSuccess: null,
  deleteSuccess: null,
};

// =====================================================
// CREATE LOTTERY CONFIG
// ADMIN
//
// POST /api/festival
// =====================================================

export const createLotteryConfig = createAsyncThunk(
  "festivalLottery/createLotteryConfig",
  async (lotteryData, { rejectWithValue }) => {
    try {
      const response = await api.post("/festival", lotteryData);

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message: error.message || "Failed to create lottery",
        }
      );
    }
  }
);

// =====================================================
// UPDATE LOTTERY CONFIG
// ADMIN
//
// PATCH /api/festival/:id
//
// BODY:
// {
//   marketName,
//   month,
//   year,
//   drawDate,
//   drawTime,
//   prizes: {
//     first,
//     second,
//     third
//   },
//   isActive
// }
// =====================================================

export const updateLotteryConfig = createAsyncThunk(
  "festivalLottery/updateLotteryConfig",
  async ({ id, lotteryData }, { rejectWithValue }) => {
    try {
      if (!id) {
        return rejectWithValue({
          success: false,
          message: "Lottery configuration ID is required",
        });
      }

      if (!lotteryData) {
        return rejectWithValue({
          success: false,
          message: "Lottery data is required",
        });
      }

      const response = await api.patch(
        `/festival/${id}`,
        lotteryData
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message:
            error.message || "Failed to update lottery configuration",
        }
      );
    }
  }
);

// =====================================================
// GET ALL LOTTERY CONFIGS
// ADMIN
//
// GET /api/festival/all
// =====================================================

export const getAllLotteryConfigs = createAsyncThunk(
  "festivalLottery/getAllLotteryConfigs",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/festival/all");

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message: error.message || "Failed to fetch lottery configs",
        }
      );
    }
  }
);

// =====================================================
// GET ACTIVE LOTTERY
//
// GET /api/festival/active
// =====================================================

export const getActiveLotteryConfig = createAsyncThunk(
  "festivalLottery/getActiveLotteryConfig",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/festival/active");

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message: error.message || "Failed to fetch active lottery",
        }
      );
    }
  }
);

// =====================================================
// GET LOTTERY CONFIG BY ID
// ADMIN
//
// GET /api/festival/:id
// =====================================================

export const getLotteryConfigById = createAsyncThunk(
  "festivalLottery/getLotteryConfigById",
  async (id, { rejectWithValue }) => {
    try {
      if (!id) {
        return rejectWithValue({
          success: false,
          message: "Lottery configuration ID is required",
        });
      }

      const response = await api.get(`/festival/${id}`);

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message: error.message || "Failed to fetch lottery config",
        }
      );
    }
  }
);

// =====================================================
// GET MY LOTTERY ENTRIES
// USER
//
// GET /api/festival/my-entries
// =====================================================

export const getMyLotteryEntries = createAsyncThunk(
  "festivalLottery/getMyLotteryEntries",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/festival/my-entries");

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message:
            error.message || "Failed to fetch lottery entries",
        }
      );
    }
  }
);

// =====================================================
// ADD SINGLE LOTTERY ENTRY
// USER
//
// POST /api/festival/entry
//
// BODY:
// {
//   configId,
//   number,
//   amount
// }
// =====================================================

export const addUserLotteryEntry = createAsyncThunk(
  "festivalLottery/addUserLotteryEntry",
  async (entryData, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/festival/entry",
        entryData
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message:
            error.message || "Failed to purchase lottery ticket",
        }
      );
    }
  }
);

// =====================================================
// ADD BULK LOTTERY ENTRIES
// USER
//
// POST /api/festival/entry/bulk
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

export const addBulkUserLotteryEntries = createAsyncThunk(
  "festivalLottery/addBulkUserLotteryEntries",
  async (bulkData, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/festival/entry/bulk",
        bulkData
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message:
            error.message || "Failed to purchase lottery tickets",
        }
      );
    }
  }
);

// =====================================================
// ACTIVATE LOTTERY CONFIG
// ADMIN
//
// PATCH /api/festival/:id/activate
// =====================================================

export const activateLotteryConfig = createAsyncThunk(
  "festivalLottery/activateLotteryConfig",
  async (id, { rejectWithValue }) => {
    try {
      if (!id) {
        return rejectWithValue({
          success: false,
          message: "Lottery configuration ID is required",
        });
      }

      const response = await api.patch(
        `/festival/${id}/activate`
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message:
            error.message || "Failed to activate lottery",
        }
      );
    }
  }
);

// =====================================================
// DEACTIVATE LOTTERY CONFIG
// ADMIN
//
// PATCH /api/festival/:id/deactivate
// =====================================================

export const deactivateLotteryConfig = createAsyncThunk(
  "festivalLottery/deactivateLotteryConfig",
  async (id, { rejectWithValue }) => {
    try {
      if (!id) {
        return rejectWithValue({
          success: false,
          message: "Lottery configuration ID is required",
        });
      }

      const response = await api.patch(
        `/festival/${id}/deactivate`
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message:
            error.message || "Failed to deactivate lottery",
        }
      );
    }
  }
);

// =====================================================
// UPDATE ENTRY STATUS
// ADMIN
//
// PATCH /api/festival/:configId/entry/:entryId/status
//
// BODY:
// {
//   status: "pending" | "win" | "lost",
//   prizeType: "1st" | "2nd" | "3rd",
//   prize: {
//     first,
//     second,
//     third
//   }
// }
// =====================================================

export const updateEntryStatus = createAsyncThunk(
  "festivalLottery/updateEntryStatus",
  async (
    {
      configId,
      entryId,
      status,
      prizeType,
      prize,
    },
    { rejectWithValue }
  ) => {
    try {
      if (!configId) {
        return rejectWithValue({
          success: false,
          message: "configId is required",
        });
      }

      if (!entryId) {
        return rejectWithValue({
          success: false,
          message: "entryId is required",
        });
      }

      const response = await api.patch(
        `/festival/${configId}/entry/${entryId}/status`,
        {
          status,
          prizeType,
          prize,
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message:
            error.message || "Failed to update entry status",
        }
      );
    }
  }
);

// =====================================================
// DELETE LOTTERY CONFIG
// ADMIN
//
// DELETE /api/festival/:id
// =====================================================

export const deleteLotteryConfig = createAsyncThunk(
  "festivalLottery/deleteLotteryConfig",
  async (id, { rejectWithValue }) => {
    try {
      if (!id) {
        return rejectWithValue({
          success: false,
          message: "Lottery configuration ID is required",
        });
      }

      const response = await api.delete(
        `/festival/${id}`
      );

      return {
        ...response.data,
        deletedId: id,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message:
            error.message || "Failed to delete lottery",
        }
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
    // =================================================
    // CLEAR GENERAL ERROR
    // =================================================

    clearFestivalLotteryError: (state) => {
      state.error = null;
    },

    // =================================================
    // CLEAR GENERAL SUCCESS
    // =================================================

    clearFestivalLotterySuccess: (state) => {
      state.success = null;
    },

    // =================================================
    // CLEAR CREATE ERROR
    // =================================================

    clearCreateLotteryError: (state) => {
      state.createError = null;
    },

    // =================================================
    // CLEAR CREATE SUCCESS
    // =================================================

    clearCreateLotterySuccess: (state) => {
      state.createSuccess = null;
    },

    // =================================================
    // CLEAR UPDATE ERROR
    // =================================================

    clearUpdateLotteryError: (state) => {
      state.updateError = null;
    },

    // =================================================
    // CLEAR UPDATE SUCCESS
    // =================================================

    clearUpdateLotterySuccess: (state) => {
      state.updateSuccess = null;
    },

    // =================================================
    // CLEAR PURCHASE ERROR
    // =================================================

    clearPurchaseError: (state) => {
      state.purchaseError = null;
    },

    // =================================================
    // CLEAR PURCHASE SUCCESS
    // =================================================

    clearPurchaseSuccess: (state) => {
      state.purchaseSuccess = null;
    },

    // =================================================
    // CLEAR BULK PURCHASE ERROR
    // =================================================

    clearBulkPurchaseError: (state) => {
      state.bulkPurchaseError = null;
    },

    // =================================================
    // CLEAR BULK PURCHASE SUCCESS
    // =================================================

    clearBulkPurchaseSuccess: (state) => {
      state.bulkPurchaseSuccess = null;
    },

    // =================================================
    // CLEAR ACTIVE ERROR
    // =================================================

    clearActiveLotteryError: (state) => {
      state.activeError = null;
    },

    // =================================================
    // CLEAR MY ENTRIES ERROR
    // =================================================

    clearMyLotteryEntriesError: (state) => {
      state.myEntriesError = null;
    },

    // =================================================
    // CLEAR ACTION ERRORS
    // =================================================

    clearActivateLotteryError: (state) => {
      state.activateError = null;
    },

    clearDeactivateLotteryError: (state) => {
      state.deactivateError = null;
    },

    clearUpdateEntryStatusError: (state) => {
      state.updateEntryStatusError = null;
    },

    clearDeleteLotteryError: (state) => {
      state.deleteError = null;
    },

    // =================================================
    // CLEAR PURCHASE RESULT
    // =================================================

    clearPurchaseResult: (state) => {
      state.purchaseResult = null;
      state.purchasedEntries = [];
      state.transactionId = null;
    },

    // =================================================
    // RESET SLICE
    // =================================================

    resetFestivalLottery: () => initialState,
  },

  // ===================================================
  // EXTRA REDUCERS
  // ===================================================

  extraReducers: (builder) => {
    builder

      // =================================================
      // CREATE LOTTERY CONFIG
      // =================================================

      .addCase(
        createLotteryConfig.pending,
        (state) => {
          state.createLoading = true;
          state.createError = null;
          state.createSuccess = null;
        }
      )

      .addCase(
        createLotteryConfig.fulfilled,
        (state, action) => {
          state.createLoading = false;

          state.createSuccess =
            action.payload?.message ||
            "Lottery created successfully";

          state.success = state.createSuccess;

          const createdConfig =
            action.payload?.data;

          if (createdConfig) {
            state.config = createdConfig;

            state.configs = [
              createdConfig,
              ...state.configs,
            ];
          }
        }
      )

      .addCase(
        createLotteryConfig.rejected,
        (state, action) => {
          state.createLoading = false;

          state.createError =
            action.payload?.message ||
            "Failed to create lottery";

          state.error = state.createError;
        }
      )

      // =================================================
      // UPDATE LOTTERY CONFIG
      // =================================================

      .addCase(
        updateLotteryConfig.pending,
        (state) => {
          state.updateLoading = true;
          state.updateError = null;
          state.updateSuccess = null;
        }
      )

      .addCase(
        updateLotteryConfig.fulfilled,
        (state, action) => {
          state.updateLoading = false;

          state.updateSuccess =
            action.payload?.message ||
            "Lottery updated successfully";

          state.success = state.updateSuccess;

          const updatedConfig =
            action.payload?.data ||
            action.payload?.config ||
            action.payload?.lottery ||
            null;

          if (!updatedConfig?._id) {
            return;
          }

          // =============================================
          // UPDATE CONFIGS LIST
          // =============================================

          state.configs = state.configs.map(
            (config) =>
              String(config._id) ===
              String(updatedConfig._id)
                ? updatedConfig
                : config
          );

          // =============================================
          // UPDATE SELECTED CONFIG
          // =============================================

          if (
            state.config &&
            String(state.config._id) ===
              String(updatedConfig._id)
          ) {
            state.config = updatedConfig;
          }

          // =============================================
          // UPDATE ACTIVE CONFIG
          // =============================================

          if (
            state.activeConfig &&
            String(state.activeConfig._id) ===
              String(updatedConfig._id)
          ) {
            state.activeConfig = updatedConfig;
          }

          // =============================================
          // IF UPDATED CONFIG IS ACTIVE
          // ENSURE OTHER CONFIGS ARE NOT ACTIVE
          // =============================================

          if (updatedConfig.isActive) {
            state.configs = state.configs.map(
              (config) => ({
                ...config,
                isActive:
                  String(config._id) ===
                  String(updatedConfig._id),
              })
            );

            state.activeConfig = updatedConfig;
          }
        }
      )

      .addCase(
        updateLotteryConfig.rejected,
        (state, action) => {
          state.updateLoading = false;

          state.updateError =
            action.payload?.message ||
            "Failed to update lottery";

          state.error = state.updateError;
        }
      )

      // =================================================
      // GET ALL LOTTERY CONFIGS
      // =================================================

      .addCase(
        getAllLotteryConfigs.pending,
        (state) => {
          state.loading = true;
          state.configError = null;
          state.error = null;
        }
      )

      .addCase(
        getAllLotteryConfigs.fulfilled,
        (state, action) => {
          state.loading = false;

          state.configs =
            action.payload?.data || [];

          state.configError = null;
        }
      )

      .addCase(
        getAllLotteryConfigs.rejected,
        (state, action) => {
          state.loading = false;

          state.configError =
            action.payload?.message ||
            "Failed to fetch lottery configs";

          state.error = state.configError;
        }
      )

      // =================================================
      // GET ACTIVE LOTTERY
      // =================================================

      .addCase(
        getActiveLotteryConfig.pending,
        (state) => {
          state.activeLoading = true;
          state.activeError = null;
        }
      )

      .addCase(
        getActiveLotteryConfig.fulfilled,
        (state, action) => {
          state.activeLoading = false;

          state.activeConfig =
            action.payload?.data || null;

          state.activeError = null;
        }
      )

      .addCase(
        getActiveLotteryConfig.rejected,
        (state, action) => {
          state.activeLoading = false;
          state.activeConfig = null;

          state.activeError =
            action.payload?.message ||
            "No active lottery configuration found";
        }
      )

      // =================================================
      // GET CONFIG BY ID
      // =================================================

      .addCase(
        getLotteryConfigById.pending,
        (state) => {
          state.configLoading = true;
          state.configError = null;
        }
      )

      .addCase(
        getLotteryConfigById.fulfilled,
        (state, action) => {
          state.configLoading = false;

          state.config =
            action.payload?.data || null;

          state.configError = null;
        }
      )

      .addCase(
        getLotteryConfigById.rejected,
        (state, action) => {
          state.configLoading = false;

          state.configError =
            action.payload?.message ||
            "Failed to fetch lottery configuration";

          state.config = null;
        }
      )

      // =================================================
      // GET MY LOTTERY ENTRIES
      // =================================================

      .addCase(
        getMyLotteryEntries.pending,
        (state) => {
          state.myEntriesLoading = true;
          state.myEntriesError = null;
        }
      )

      .addCase(
        getMyLotteryEntries.fulfilled,
        (state, action) => {
          state.myEntriesLoading = false;

          state.myEntries =
            action.payload?.data || [];

          state.totalEntries =
            action.payload?.totalEntries ??
            state.myEntries.length;

          state.myEntriesError = null;
        }
      )

      .addCase(
        getMyLotteryEntries.rejected,
        (state, action) => {
          state.myEntriesLoading = false;

          state.myEntriesError =
            action.payload?.message ||
            "Failed to fetch lottery entries";

          state.myEntries = [];
          state.totalEntries = 0;
        }
      )

      // =================================================
      // SINGLE PURCHASE
      // =================================================

      .addCase(
        addUserLotteryEntry.pending,
        (state) => {
          state.purchaseLoading = true;
          state.purchaseError = null;
          state.purchaseSuccess = null;
          state.purchaseResult = null;
        }
      )

      .addCase(
        addUserLotteryEntry.fulfilled,
        (state, action) => {
          state.purchaseLoading = false;

          const responseData =
            action.payload?.data || null;

          state.purchaseResult = responseData;

          state.purchaseSuccess =
            action.payload?.message ||
            "Lottery entry submitted successfully";

          state.success =
            state.purchaseSuccess;

          if (
            responseData?.walletBalance !==
            undefined
          ) {
            state.walletBalance =
              responseData.walletBalance;
          }

          if (responseData?.entry) {
            state.purchasedEntries = [
              responseData.entry,
            ];
          }

          state.transactionId =
            responseData?.transactionId ||
            null;

          if (
            Array.isArray(
              responseData?.allEntries
            )
          ) {
            const configId =
              responseData?.configId;

            const drawDate =
              responseData?.drawDate;

            const otherEntries =
              state.myEntries.filter(
                (entry) =>
                  String(entry.configId) !==
                    String(configId) ||
                  String(entry.entryDate) !==
                    String(drawDate)
              );

            const newEntries =
              responseData.allEntries.map(
                (entry) => ({
                  configId:
                    responseData.configId,
                  marketName:
                    responseData.marketName,
                  month:
                    responseData.month,
                  year:
                    responseData.year,
                  drawDate:
                    responseData.drawDate,
                  drawTime:
                    responseData.drawTime,
                  prizes:
                    responseData.prizes ||
                    state.config?.prizes,
                  isActive:
                    responseData.isActive,
                  entryId:
                    entry._id,
                  userId:
                    entry.userId,
                  entryDate:
                    entry.entryDate,
                  number:
                    entry.number,
                  amount:
                    entry.amount,
                  isBuy:
                    entry.isBuy,
                  prize:
                    entry.prize,
                  prizeType:
                    entry.prizeType,
                  status:
                    entry.status,
                  createdAt:
                    entry.createdAt,
                  updatedAt:
                    entry.updatedAt,
                })
              );

            state.myEntries = [
              ...otherEntries,
              ...newEntries,
            ];

            state.totalEntries =
              state.myEntries.length;
          }
        }
      )

      .addCase(
        addUserLotteryEntry.rejected,
        (state, action) => {
          state.purchaseLoading = false;

          state.purchaseError =
            action.payload?.message ||
            "Failed to purchase lottery ticket";

          state.error =
            state.purchaseError;
        }
      )

      // =================================================
      // BULK PURCHASE
      // =================================================

      .addCase(
        addBulkUserLotteryEntries.pending,
        (state) => {
          state.bulkPurchaseLoading = true;
          state.bulkPurchaseError = null;
          state.bulkPurchaseSuccess = null;
          state.purchaseResult = null;
        }
      )

      .addCase(
        addBulkUserLotteryEntries.fulfilled,
        (state, action) => {
          state.bulkPurchaseLoading = false;

          const responseData =
            action.payload?.data || null;

          state.purchaseResult =
            responseData;

          state.bulkPurchaseSuccess =
            action.payload?.message ||
            "Lottery entries submitted successfully";

          state.success =
            state.bulkPurchaseSuccess;

          if (
            responseData?.walletBalance !==
            undefined
          ) {
            state.walletBalance =
              responseData.walletBalance;
          }

          state.purchasedEntries =
            Array.isArray(
              responseData?.entries
            )
              ? responseData.entries
              : [];

          state.transactionId =
            responseData?.transactionId ||
            null;

          if (
            Array.isArray(
              responseData?.allEntries
            )
          ) {
            const configId =
              responseData?.configId;

            const drawDate =
              responseData?.drawDate;

            const otherEntries =
              state.myEntries.filter(
                (entry) =>
                  String(entry.configId) !==
                    String(configId) ||
                  String(entry.entryDate) !==
                    String(drawDate)
              );

            const newEntries =
              responseData.allEntries.map(
                (entry) => ({
                  configId:
                    responseData.configId,
                  marketName:
                    responseData.marketName,
                  month:
                    responseData.month,
                  year:
                    responseData.year,
                  drawDate:
                    responseData.drawDate,
                  drawTime:
                    responseData.drawTime,
                  prizes:
                    responseData.prizes ||
                    state.config?.prizes,
                  isActive:
                    responseData.isActive,
                  entryId:
                    entry._id,
                  userId:
                    entry.userId,
                  entryDate:
                    entry.entryDate,
                  number:
                    entry.number,
                  amount:
                    entry.amount,
                  isBuy:
                    entry.isBuy,
                  prize:
                    entry.prize,
                  prizeType:
                    entry.prizeType,
                  status:
                    entry.status,
                  createdAt:
                    entry.createdAt,
                  updatedAt:
                    entry.updatedAt,
                })
              );

            state.myEntries = [
              ...otherEntries,
              ...newEntries,
            ];

            state.totalEntries =
              state.myEntries.length;
          }
        }
      )

      .addCase(
        addBulkUserLotteryEntries.rejected,
        (state, action) => {
          state.bulkPurchaseLoading = false;

          state.bulkPurchaseError =
            action.payload?.message ||
            "Failed to purchase lottery tickets";

          state.error =
            state.bulkPurchaseError;
        }
      )

      // =================================================
      // ACTIVATE LOTTERY
      // =================================================

      .addCase(
        activateLotteryConfig.pending,
        (state) => {
          state.activateLoading = true;
          state.activateError = null;
          state.activateSuccess = null;
        }
      )

      .addCase(
        activateLotteryConfig.fulfilled,
        (state, action) => {
          state.activateLoading = false;

          state.activateSuccess =
            action.payload?.message ||
            "Lottery activated successfully";

          state.success =
            state.activateSuccess;

          const activatedConfig =
            action.payload?.data;

          if (!activatedConfig) {
            return;
          }

          state.configs =
            state.configs.map(
              (config) => ({
                ...config,
                isActive:
                  String(config._id) ===
                  String(
                    activatedConfig._id
                  ),
              })
            );

          state.config =
            activatedConfig;

          state.activeConfig =
            activatedConfig;
        }
      )

      .addCase(
        activateLotteryConfig.rejected,
        (state, action) => {
          state.activateLoading = false;

          state.activateError =
            action.payload?.message ||
            "Failed to activate lottery";

          state.error =
            state.activateError;
        }
      )

      // =================================================
      // DEACTIVATE LOTTERY
      // =================================================

      .addCase(
        deactivateLotteryConfig.pending,
        (state) => {
          state.deactivateLoading = true;
          state.deactivateError = null;
          state.deactivateSuccess = null;
        }
      )

      .addCase(
        deactivateLotteryConfig.fulfilled,
        (state, action) => {
          state.deactivateLoading = false;

          state.deactivateSuccess =
            action.payload?.message ||
            "Lottery deactivated successfully";

          state.success =
            state.deactivateSuccess;

          const deactivatedConfig =
            action.payload?.data;

          if (!deactivatedConfig) {
            return;
          }

          state.configs =
            state.configs.map(
              (config) =>
                String(config._id) ===
                String(
                  deactivatedConfig._id
                )
                  ? {
                      ...config,
                      isActive: false,
                    }
                  : config
            );

          if (
            state.config &&
            String(state.config._id) ===
              String(deactivatedConfig._id)
          ) {
            state.config = {
              ...state.config,
              isActive: false,
            };
          }

          if (
            state.activeConfig &&
            String(
              state.activeConfig._id
            ) ===
              String(
                deactivatedConfig._id
              )
          ) {
            state.activeConfig = null;
          }
        }
      )

      .addCase(
        deactivateLotteryConfig.rejected,
        (state, action) => {
          state.deactivateLoading = false;

          state.deactivateError =
            action.payload?.message ||
            "Failed to deactivate lottery";

          state.error =
            state.deactivateError;
        }
      )

      // =================================================
      // UPDATE ENTRY STATUS
      // =================================================

      .addCase(
        updateEntryStatus.pending,
        (state) => {
          state.updateEntryStatusLoading = true;
          state.updateEntryStatusError = null;
          state.updateEntryStatusSuccess = null;
        }
      )

      .addCase(
        updateEntryStatus.fulfilled,
        (state, action) => {
          state.updateEntryStatusLoading = false;

          state.updateEntryStatusSuccess =
            action.payload?.message ||
            "Entry status updated successfully";

          state.success =
            state.updateEntryStatusSuccess;

          const updatedEntry =
            action.payload?.data;

          if (!updatedEntry) {
            return;
          }

          // =============================================
          // UPDATE CURRENT CONFIG USERS
          // =============================================

          if (
            state.config &&
            Array.isArray(
              state.config.users
            )
          ) {
            state.config.users =
              state.config.users.map(
                (entry) =>
                  String(entry._id) ===
                  String(updatedEntry._id)
                    ? updatedEntry
                    : entry
              );
          }

          // =============================================
          // UPDATE CONFIG LIST USERS
          // =============================================

          state.configs =
            state.configs.map(
              (config) => {
                if (
                  !Array.isArray(
                    config.users
                  )
                ) {
                  return config;
                }

                return {
                  ...config,
                  users:
                    config.users.map(
                      (entry) =>
                        String(
                          entry._id
                        ) ===
                        String(
                          updatedEntry._id
                        )
                          ? updatedEntry
                          : entry
                    ),
                };
              }
            );

          // =============================================
          // UPDATE ACTIVE CONFIG USERS
          // =============================================

          if (
            state.activeConfig &&
            Array.isArray(
              state.activeConfig.users
            )
          ) {
            state.activeConfig.users =
              state.activeConfig.users.map(
                (entry) =>
                  String(entry._id) ===
                  String(updatedEntry._id)
                    ? updatedEntry
                    : entry
              );
          }

          // =============================================
          // UPDATE MY ENTRIES
          // =============================================

          state.myEntries =
            state.myEntries.map(
              (entry) =>
                String(entry.entryId) ===
                String(updatedEntry._id)
                  ? {
                      ...entry,
                      status:
                        updatedEntry.status,
                      prize:
                        updatedEntry.prize,
                      prizeType:
                        updatedEntry.prizeType,
                      updatedAt:
                        updatedEntry.updatedAt,
                    }
                  : entry
            );
        }
      )

      .addCase(
        updateEntryStatus.rejected,
        (state, action) => {
          state.updateEntryStatusLoading = false;

          state.updateEntryStatusError =
            action.payload?.message ||
            "Failed to update entry status";

          state.error =
            state.updateEntryStatusError;
        }
      )

      // =================================================
      // DELETE LOTTERY
      // =================================================

      .addCase(
        deleteLotteryConfig.pending,
        (state) => {
          state.deleteLoading = true;
          state.deleteError = null;
          state.deleteSuccess = null;
        }
      )

      .addCase(
        deleteLotteryConfig.fulfilled,
        (state, action) => {
          state.deleteLoading = false;

          state.deleteSuccess =
            action.payload?.message ||
            "Lottery deleted successfully";

          state.success =
            state.deleteSuccess;

          const deletedId =
            action.payload?.deletedId;

          if (!deletedId) {
            return;
          }

          state.configs =
            state.configs.filter(
              (config) =>
                String(config._id) !==
                String(deletedId)
            );

          if (
            state.config &&
            String(state.config._id) ===
              String(deletedId)
          ) {
            state.config = null;
          }

          if (
            state.activeConfig &&
            String(
              state.activeConfig._id
            ) === String(deletedId)
          ) {
            state.activeConfig = null;
          }
        }
      )

      .addCase(
        deleteLotteryConfig.rejected,
        (state, action) => {
          state.deleteLoading = false;

          state.deleteError =
            action.payload?.message ||
            "Failed to delete lottery";

          state.error =
            state.deleteError;
        }
      );
  },
});

// =====================================================
// ACTIONS
// =====================================================

export const {
  clearFestivalLotteryError,
  clearFestivalLotterySuccess,

  clearCreateLotteryError,
  clearCreateLotterySuccess,

  clearUpdateLotteryError,
  clearUpdateLotterySuccess,

  clearPurchaseError,
  clearPurchaseSuccess,

  clearBulkPurchaseError,
  clearBulkPurchaseSuccess,

  clearActiveLotteryError,
  clearMyLotteryEntriesError,

  clearActivateLotteryError,
  clearDeactivateLotteryError,
  clearUpdateEntryStatusError,
  clearDeleteLotteryError,

  clearPurchaseResult,

  resetFestivalLottery,
} = festivalLotterySlice.actions;

// =====================================================
// BASIC SELECTORS
// =====================================================

export const selectFestivalLottery = (state) =>
  state.festivalLottery;

export const selectLotteryConfigs = (state) =>
  state.festivalLottery?.configs || [];

export const selectLotteryConfig = (state) =>
  state.festivalLottery?.config || null;

export const selectActiveLottery = (state) =>
  state.festivalLottery?.activeConfig || null;

export const selectMyLotteryEntries = (state) =>
  state.festivalLottery?.myEntries || [];

export const selectTotalLotteryEntries = (state) =>
  state.festivalLottery?.totalEntries || 0;

export const selectWalletBalance = (state) =>
  state.festivalLottery?.walletBalance;

export const selectPurchaseResult = (state) =>
  state.festivalLottery?.purchaseResult || null;

export const selectPurchasedEntries = (state) =>
  state.festivalLottery?.purchasedEntries || [];

export const selectTransactionId = (state) =>
  state.festivalLottery?.transactionId || null;

// =====================================================
// LOADING SELECTORS
// =====================================================

export const selectLotteryLoading = (state) =>
  state.festivalLottery?.loading || false;

export const selectActiveLotteryLoading = (state) =>
  state.festivalLottery?.activeLoading || false;

export const selectConfigLoading = (state) =>
  state.festivalLottery?.configLoading || false;

export const selectCreateLotteryLoading = (state) =>
  state.festivalLottery?.createLoading || false;

export const selectUpdateLotteryLoading = (state) =>
  state.festivalLottery?.updateLoading || false;

export const selectPurchaseLoading = (state) =>
  state.festivalLottery?.purchaseLoading || false;

export const selectBulkPurchaseLoading = (state) =>
  state.festivalLottery?.bulkPurchaseLoading || false;

export const selectMyEntriesLoading = (state) =>
  state.festivalLottery?.myEntriesLoading || false;

export const selectActivateLotteryLoading = (state) =>
  state.festivalLottery?.activateLoading || false;

export const selectDeactivateLotteryLoading = (state) =>
  state.festivalLottery?.deactivateLoading || false;

export const selectUpdateEntryStatusLoading = (state) =>
  state.festivalLottery
    ?.updateEntryStatusLoading || false;

export const selectDeleteLotteryLoading = (state) =>
  state.festivalLottery?.deleteLoading || false;

// =====================================================
// ERROR SELECTORS
// =====================================================

export const selectFestivalLotteryError = (state) =>
  state.festivalLottery?.error || null;

export const selectCreateLotteryError = (state) =>
  state.festivalLottery?.createError || null;

export const selectUpdateLotteryError = (state) =>
  state.festivalLottery?.updateError || null;

export const selectPurchaseError = (state) =>
  state.festivalLottery?.purchaseError || null;

export const selectBulkPurchaseError = (state) =>
  state.festivalLottery?.bulkPurchaseError || null;

export const selectActiveLotteryError = (state) =>
  state.festivalLottery?.activeError || null;

export const selectMyEntriesError = (state) =>
  state.festivalLottery?.myEntriesError || null;

export const selectActivateLotteryError = (state) =>
  state.festivalLottery?.activateError || null;

export const selectDeactivateLotteryError = (state) =>
  state.festivalLottery?.deactivateError || null;

export const selectUpdateEntryStatusError = (state) =>
  state.festivalLottery
    ?.updateEntryStatusError || null;

export const selectDeleteLotteryError = (state) =>
  state.festivalLottery?.deleteError || null;

// =====================================================
// SUCCESS SELECTORS
// =====================================================

export const selectFestivalLotterySuccess = (state) =>
  state.festivalLottery?.success || null;

export const selectCreateLotterySuccess = (state) =>
  state.festivalLottery?.createSuccess || null;

export const selectUpdateLotterySuccess = (state) =>
  state.festivalLottery?.updateSuccess || null;

export const selectPurchaseSuccess = (state) =>
  state.festivalLottery?.purchaseSuccess || null;

export const selectBulkPurchaseSuccess = (state) =>
  state.festivalLottery
    ?.bulkPurchaseSuccess || null;

export const selectActivateLotterySuccess = (state) =>
  state.festivalLottery
    ?.activateSuccess || null;

export const selectDeactivateLotterySuccess = (state) =>
  state.festivalLottery
    ?.deactivateSuccess || null;

export const selectUpdateEntryStatusSuccess = (state) =>
  state.festivalLottery
    ?.updateEntryStatusSuccess || null;

export const selectDeleteLotterySuccess = (state) =>
  state.festivalLottery?.deleteSuccess || null;

// =====================================================
// DEFAULT EXPORT
// =====================================================

export default festivalLotterySlice.reducer;
