import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";

// =====================================================
// ============ ASYNC THUNKS ===========================
// =====================================================

// ---------- DASHBOARD ----------
export const fetchDashboardStats = createAsyncThunk(
  "admin/fetchDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/dashboard/stats");
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch stats"
      );
    }
  }
);

// ---------- USERS ----------
export const fetchUsers = createAsyncThunk(
  "admin/fetchUsers",
  async (
    { page = 1, limit = 20, search = "" } = {},
    { rejectWithValue }
  ) => {
    try {
      const { data } = await axiosInstance.get("/users", {
        params: { page, limit, search },
      });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch users"
      );
    }
  }
);

export const updateUserWallet = createAsyncThunk(
  "admin/updateUserWallet",
  async ({ id, amount, action }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(`/users/${id}/wallet`, {
        amount,
        action,
      });
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update wallet"
      );
    }
  }
);

// ---------- DEPOSITS ----------
export const fetchDeposits = createAsyncThunk(
  "admin/fetchDeposits",
  async (
    { page = 1, limit = 20, search = "", status = "" } = {},
    { rejectWithValue }
  ) => {
    try {
      const { data } = await axiosInstance.get("/deposits", {
        params: { page, limit, search, status },
      });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch deposits"
      );
    }
  }
);

export const updateDepositStatus = createAsyncThunk(
  "admin/updateDepositStatus",
  async ({ id, status, adminRemark = "" }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(
        `/deposits/${id}/status`,
        { status, adminRemark }
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update deposit"
      );
    }
  }
);

export const fetchDepositStats = createAsyncThunk(
  "admin/fetchDepositStats",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/deposits/stats");
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch stats"
      );
    }
  }
);

// ---------- CONFIGS ----------
export const fetchConfigs = createAsyncThunk(
  "admin/fetchConfigs",
  async (
    { page = 1, limit = 20, search = "", isActive = "" } = {},
    { rejectWithValue }
  ) => {
    try {
      const { data } = await axiosInstance.get("/configs", {
        params: { page, limit, search, isActive },
      });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch configs"
      );
    }
  }
);

export const fetchSingleConfig = createAsyncThunk(
  "admin/fetchSingleConfig",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/configs/${id}`);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch config"
      );
    }
  }
);

export const createConfig = createAsyncThunk(
  "admin/createConfig",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/configs", payload);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create config"
      );
    }
  }
);

export const updateConfig = createAsyncThunk(
  "admin/updateConfig",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(`/configs/${id}`, payload);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update config"
      );
    }
  }
);

export const toggleConfigActive = createAsyncThunk(
  "admin/toggleConfigActive",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(`/configs/${id}/toggle`);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to toggle config"
      );
    }
  }
);

export const deleteConfig = createAsyncThunk(
  "admin/deleteConfig",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/configs/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete config"
      );
    }
  }
);

// ---------- ENTRIES ----------
export const fetchAllEntries = createAsyncThunk(
  "admin/fetchAllEntries",
  async (
    { page = 1, limit = 20, search = "", status = "" } = {},
    { rejectWithValue }
  ) => {
    try {
      const { data } = await axiosInstance.get("/entries", {
        params: { page, limit, search, status },
      });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch entries"
      );
    }
  }
);

export const fetchEntriesByConfig = createAsyncThunk(
  "admin/fetchEntriesByConfig",
  async ({ configId, page = 1, limit = 50 }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        `/entries/config/${configId}`,
        { params: { page, limit } }
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch entries"
      );
    }
  }
);

export const fetchEntryStats = createAsyncThunk(
  "admin/fetchEntryStats",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/entries/stats");
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch stats"
      );
    }
  }
);

// ---------- RESULTS ----------
export const fetchResults = createAsyncThunk(
  "admin/fetchResults",
  async (
    { page = 1, limit = 20, search = "", isPublished = "" } = {},
    { rejectWithValue }
  ) => {
    try {
      const { data } = await axiosInstance.get("/results", {
        params: { page, limit, search, isPublished },
      });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch results"
      );
    }
  }
);

export const createResult = createAsyncThunk(
  "admin/createResult",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/results", payload);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create result"
      );
    }
  }
);

export const updateResult = createAsyncThunk(
  "admin/updateResult",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(`/results/${id}`, payload);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update result"
      );
    }
  }
);

export const toggleResultPublish = createAsyncThunk(
  "admin/toggleResultPublish",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(`/results/${id}/toggle`);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to toggle result"
      );
    }
  }
);

export const deleteResult = createAsyncThunk(
  "admin/deleteResult",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/results/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete result"
      );
    }
  }
);

// =====================================================
// ============ SLICE ==================================
// =====================================================

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    // Dashboard
    dashboardStats: {
      totalUsers: 0,
      totalDeposit: 0,
      totalConfigs: 0,
      totalEntries: 0,
      totalResults: 0,
      todayResults: 0,
      todayDeposit: 0,
    },
    dashboardLoading: false,

    // Users
    users: [],
    usersPagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    usersLoading: false,

    // Deposits
    deposits: [],
    depositsPagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    depositsLoading: false,
    depositStats: {
      pending: { count: 0, totalAmount: 0 },
      success: { count: 0, totalAmount: 0 },
      failed: { count: 0, totalAmount: 0 },
      total: { count: 0, totalAmount: 0 },
    },

    // Configs
    configs: [],
    configsPagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    configsLoading: false,
    singleConfig: null,
    singleConfigLoading: false,

    // Entries
    entries: [],
    entriesPagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    entriesLoading: false,
    configEntries: [],
    configInfo: null,
    configEntriesLoading: false,
    entryStats: {
      pending: { count: 0, totalAmount: 0 },
      win: { count: 0, totalAmount: 0 },
      lost: { count: 0, totalAmount: 0 },
      total: { totalCount: 0, totalAmount: 0 },
    },

    // Results
    results: [],
    resultsPagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    resultsLoading: false,

    // Common
    actionLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSingleConfig: (state) => {
      state.singleConfig = null;
    },
    clearConfigEntries: (state) => {
      state.configEntries = [];
      state.configInfo = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ============================================
      // DASHBOARD
      // ============================================
      .addCase(fetchDashboardStats.pending, (state) => {
        state.dashboardLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardStats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.dashboardLoading = false;
        state.error = action.payload;
      })

      // ============================================
      // USERS
      // ============================================
      .addCase(fetchUsers.pending, (state) => {
        state.usersLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.users = action.payload.data;
        state.usersPagination = action.payload.pagination;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.usersLoading = false;
        state.error = action.payload;
      })
      .addCase(updateUserWallet.fulfilled, (state, action) => {
        const updated = action.payload;
        state.users = state.users.map((u) =>
          u._id === updated._id ? updated : u
        );
      })

      // ============================================
      // DEPOSITS
      // ============================================
      .addCase(fetchDeposits.pending, (state) => {
        state.depositsLoading = true;
        state.error = null;
      })
      .addCase(fetchDeposits.fulfilled, (state, action) => {
        state.depositsLoading = false;
        state.deposits = action.payload.data;
        state.depositsPagination = action.payload.pagination;
      })
      .addCase(fetchDeposits.rejected, (state, action) => {
        state.depositsLoading = false;
        state.error = action.payload;
      })
      .addCase(updateDepositStatus.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateDepositStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updated = action.payload;
        state.deposits = state.deposits.map((d) =>
          d._id === updated._id ? { ...d, ...updated } : d
        );
      })
      .addCase(updateDepositStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchDepositStats.fulfilled, (state, action) => {
        state.depositStats = action.payload;
      })

      // ============================================
      // CONFIGS
      // ============================================
      .addCase(fetchConfigs.pending, (state) => {
        state.configsLoading = true;
        state.error = null;
      })
      .addCase(fetchConfigs.fulfilled, (state, action) => {
        state.configsLoading = false;
        state.configs = action.payload.data;
        state.configsPagination = action.payload.pagination;
      })
      .addCase(fetchConfigs.rejected, (state, action) => {
        state.configsLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchSingleConfig.pending, (state) => {
        state.singleConfigLoading = true;
      })
      .addCase(fetchSingleConfig.fulfilled, (state, action) => {
        state.singleConfigLoading = false;
        state.singleConfig = action.payload;
      })
      .addCase(fetchSingleConfig.rejected, (state, action) => {
        state.singleConfigLoading = false;
        state.error = action.payload;
      })
      .addCase(createConfig.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createConfig.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.configs = [action.payload, ...state.configs];
      })
      .addCase(createConfig.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(updateConfig.fulfilled, (state, action) => {
        state.configs = state.configs.map((c) =>
          c._id === action.payload._id ? action.payload : c
        );
        if (state.singleConfig?._id === action.payload._id) {
          state.singleConfig = action.payload;
        }
      })
      .addCase(toggleConfigActive.fulfilled, (state, action) => {
        state.configs = state.configs.map((c) =>
          c._id === action.payload._id ? action.payload : c
        );
      })
      .addCase(deleteConfig.fulfilled, (state, action) => {
        state.configs = state.configs.filter((c) => c._id !== action.payload);
      })

      // ============================================
      // ENTRIES
      // ============================================
      .addCase(fetchAllEntries.pending, (state) => {
        state.entriesLoading = true;
        state.error = null;
      })
      .addCase(fetchAllEntries.fulfilled, (state, action) => {
        state.entriesLoading = false;
        state.entries = action.payload.data;
        state.entriesPagination = action.payload.pagination;
      })
      .addCase(fetchAllEntries.rejected, (state, action) => {
        state.entriesLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchEntriesByConfig.pending, (state) => {
        state.configEntriesLoading = true;
      })
      .addCase(fetchEntriesByConfig.fulfilled, (state, action) => {
        state.configEntriesLoading = false;
        state.configEntries = action.payload.data.entries;
        state.configInfo = action.payload.data.config;
        state.entriesPagination = action.payload.pagination;
      })
      .addCase(fetchEntriesByConfig.rejected, (state, action) => {
        state.configEntriesLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchEntryStats.fulfilled, (state, action) => {
        state.entryStats = action.payload;
      })

      // ============================================
      // RESULTS
      // ============================================
      .addCase(fetchResults.pending, (state) => {
        state.resultsLoading = true;
        state.error = null;
      })
      .addCase(fetchResults.fulfilled, (state, action) => {
        state.resultsLoading = false;
        state.results = action.payload.data;
        state.resultsPagination = action.payload.pagination;
      })
      .addCase(fetchResults.rejected, (state, action) => {
        state.resultsLoading = false;
        state.error = action.payload;
      })
      .addCase(createResult.fulfilled, (state, action) => {
        state.results = [action.payload, ...state.results];
      })
      .addCase(updateResult.fulfilled, (state, action) => {
        state.results = state.results.map((r) =>
          r._id === action.payload._id ? action.payload : r
        );
      })
      .addCase(toggleResultPublish.fulfilled, (state, action) => {
        state.results = state.results.map((r) =>
          r._id === action.payload._id ? action.payload : r
        );
      })
      .addCase(deleteResult.fulfilled, (state, action) => {
        state.results = state.results.filter((r) => r._id !== action.payload);
      });
  },
});

export const {
  clearError,
  clearSingleConfig,
  clearConfigEntries,
} = adminSlice.actions;

export default adminSlice.reducer;