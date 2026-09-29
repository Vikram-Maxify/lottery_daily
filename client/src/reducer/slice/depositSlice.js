import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";

/* ==========================================================
   STATUS MAP
========================================================== */

export const DEPOSIT_STATUS = {
  0: "PENDING",
  1: "SUCCESS",
  2: "FAILED",
  3: "CANCELLED",
};

/* ==========================================================
   CREATE DEPOSIT
========================================================== */

export const createDeposit = createAsyncThunk(
  "deposit/createDeposit",
  async (depositData, { rejectWithValue }) => {
    try {
      const formData = new FormData();

      if (depositData.gatewayId) {
        formData.append("gatewayId", depositData.gatewayId);
      }

      formData.append(
        "paymentMethod",
        depositData.paymentMethod || "INR"
      );

      formData.append(
        "channel",
        depositData.channel || "qwackpay"
      );

      formData.append("amount", depositData.amount);

      if (depositData.utr) {
        formData.append("utr", depositData.utr);
      }

      if (depositData.configId) {
        formData.append("configId", depositData.configId);
      }

      if (depositData.entryId) {
        formData.append("entryId", depositData.entryId);
      }

      if (depositData.number) {
        formData.append("number", depositData.number);
      }

      // =====================================================
      // LOTTERY NUMBERS (array for bulk ticket purchase)
      // =====================================================

      if (
        Array.isArray(depositData.lotteryNumbers) &&
        depositData.lotteryNumbers.length > 0
      ) {
        depositData.lotteryNumbers.forEach((num) => {
          formData.append("lotteryNumbers[]", String(num));
        });
      }

      if (
        typeof File !== "undefined" &&
        depositData.paymentProof instanceof File
      ) {
        formData.append("image", depositData.paymentProof);
      }

      const { data } = await api.post("/deposit", formData);

      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Deposit submission failed"
      );
    }
  }
);

/* ==========================================================
   CANCEL DEPOSIT
========================================================== */

export const cancelDeposit = createAsyncThunk(
  "deposit/cancelDeposit",
  async ({ depositId, reason }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(
        `/deposit/${depositId}/cancel`,
        {
          reason: reason || "User cancelled at gateway",
        }
      );

      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to cancel deposit"
      );
    }
  }
);

/* ==========================================================
   GET DEPOSIT STATUS
========================================================== */

export const fetchDepositStatus = createAsyncThunk(
  "deposit/fetchDepositStatus",
  async (identifier, { rejectWithValue }) => {
    try {
      const safeIdentifier = encodeURIComponent(
        String(identifier || "").trim()
      );

      if (!safeIdentifier || safeIdentifier === "undefined") {
        return rejectWithValue("Deposit order ID is required");
      }

      const { data } = await api.get(
        `/deposit/status/${safeIdentifier}`
      );

      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to fetch deposit status"
      );
    }
  }
);

/* ==========================================================
   GET MY DEPOSITS
========================================================== */

export const getMyDeposits = createAsyncThunk(
  "deposit/getMyDeposits",

  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();

      const append = (key, value) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          params.append(key, value);
        }
      };

      append("status", filters.status);
      append("paymentMethod", filters.paymentMethod);
      append("channel", filters.channel);
      append("phone", filters.phone);
      append("username", filters.username);
      append("orderId", filters.orderId);
      append("transactionId", filters.transactionId);
      append("utr", filters.utr);

      append("fromDate", filters.fromDate);
      append("toDate", filters.toDate);

      append("minAmount", filters.minAmount);
      append("maxAmount", filters.maxAmount);

      append("page", filters.page || 1);
      append("limit", filters.limit || 10);
      append("sort", filters.sort || "desc");

      const queryString = params.toString();

      const url = `/deposit${
        queryString ? `?${queryString}` : ""
      }`;

      const { data } = await api.get(url);

      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to fetch deposits"
      );
    }
  }
);

/* ==========================================================
   ADMIN - GET ALL DEPOSITS
========================================================== */

export const getAllDepositsForAdmin = createAsyncThunk(
  "deposit/getAllDepositsForAdmin",

  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();

      const append = (key, value) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          params.append(key, value);
        }
      };

      append("status", filters.status);
      append("paymentMethod", filters.paymentMethod);
      append("channel", filters.channel);
      append("phone", filters.phone);
      append("username", filters.username);
      append("uid", filters.uid);
      append("orderId", filters.orderId);
      append("transactionId", filters.transactionId);
      append("utr", filters.utr);

      append("fromDate", filters.fromDate);
      append("toDate", filters.toDate);

      append("minAmount", filters.minAmount);
      append("maxAmount", filters.maxAmount);

      append("page", filters.page || 1);
      append("limit", filters.limit || 20);
      append("sort", filters.sort || "desc");

      const { data } = await api.get(
        `/deposits?${params.toString()}`
      );

      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to fetch all deposits"
      );
    }
  }
);

/* ==========================================================
   GET SINGLE DEPOSIT
========================================================== */

export const getSingleDeposit = createAsyncThunk(
  "deposit/getSingleDeposit",

  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/deposit/${id}`);

      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to fetch deposit details"
      );
    }
  }
);

/* ==========================================================
   INITIAL STATE
========================================================== */

const defaultFilters = {
  status: "",
  paymentMethod: "",
  channel: "",
  phone: "",
  username: "",
  orderId: "",
  transactionId: "",
  utr: "",
  fromDate: "",
  toDate: "",
  minAmount: "",
  maxAmount: "",
  sort: "desc",
};

const defaultAdminFilters = {
  status: "",
  paymentMethod: "",
  channel: "",
  phone: "",
  username: "",
  uid: "",
  orderId: "",
  transactionId: "",
  utr: "",
  fromDate: "",
  toDate: "",
  minAmount: "",
  maxAmount: "",
  sort: "desc",
};

const initialState = {
  loading: false,
  cancelLoading: false,
  statusLoading: false,

  success: false,

  error: null,
  message: "",

  deposits: [],
  adminDeposits: [],

  currentDeposit: null,

  paymentUrl: null,
  orderId: "",
  depositId: "",
  amount: 0,

  currentStatus: null,
  cancelledAt: null,
  cancelReason: "",

  // Lottery info from last status check
  lotteryNumbers: [],
  lotteryProcessed: false,
  lotteryEntries: [],

  pagination: {
    total: 0,
    currentPage: 1,
    totalPages: 0,
    limit: 10,
  },

  adminPagination: {
    total: 0,
    currentPage: 1,
    totalPages: 0,
    perPage: 20,
  },

  filters: {
    ...defaultFilters,
  },

  adminFilters: {
    ...defaultAdminFilters,
  },
};

/* ==========================================================
   SLICE
========================================================== */

const depositSlice = createSlice({
  name: "deposit",

  initialState,

  reducers: {
    clearDepositState: (state) => {
      state.loading = false;
      state.cancelLoading = false;
      state.statusLoading = false;

      state.success = false;
      state.error = null;
      state.message = "";

      state.paymentUrl = null;
      state.orderId = "";
      state.depositId = "";
      state.amount = 0;
    },

    clearDeposits: (state) => {
      state.deposits = [];

      state.pagination = {
        total: 0,
        currentPage: 1,
        totalPages: 0,
        limit: 10,
      };
    },

    clearAdminDeposits: (state) => {
      state.adminDeposits = [];

      state.adminPagination = {
        total: 0,
        currentPage: 1,
        totalPages: 0,
        perPage: 20,
      };
    },

    clearCurrentDeposit: (state) => {
      state.currentDeposit = null;
      state.paymentUrl = null;
      state.orderId = "";
      state.depositId = "";
      state.amount = 0;

      state.currentStatus = null;
      state.cancelledAt = null;
      state.cancelReason = "";

      state.lotteryNumbers = [];
      state.lotteryProcessed = false;
      state.lotteryEntries = [];
    },

    setDepositFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },

    setAdminDepositFilters: (state, action) => {
      state.adminFilters = {
        ...state.adminFilters,
        ...action.payload,
      };
    },

    resetDepositFilters: (state) => {
      state.filters = {
        ...defaultFilters,
      };
    },

    resetAdminDepositFilters: (state) => {
      state.adminFilters = {
        ...defaultAdminFilters,
      };
    },
  },

  extraReducers: (builder) => {
    builder

      /* ======================================================
         CREATE
      ====================================================== */

      .addCase(createDeposit.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
        state.message = "";
        state.paymentUrl = null;
        state.orderId = "";
        state.depositId = "";
        state.amount = 0;
      })

      .addCase(createDeposit.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        state.message =
          action.payload?.message ||
          "Payment order created successfully.";

        state.paymentUrl =
          action.payload?.paymentUrl || null;

        state.orderId = String(
          action.payload?.orderId ||
            action.payload?.deposit?.orderId ||
            ""
        );

        state.depositId = String(
          action.payload?.depositId ||
            action.payload?.deposit?._id ||
            ""
        );

        state.amount = Number(
          action.payload?.amount ||
            action.payload?.deposit?.amount ||
            0
        );

        state.currentStatus =
          action.payload?.status === "pending" ? 0 : null;

        // Store lottery numbers if returned
        if (Array.isArray(action.payload?.lotteryNumbers)) {
          state.lotteryNumbers = action.payload.lotteryNumbers;
        }

        if (action.payload?.deposit) {
          state.currentDeposit = action.payload.deposit;

          state.deposits = [
            action.payload.deposit,
            ...state.deposits,
          ];
        }
      })

      .addCase(createDeposit.rejected, (state, action) => {
        state.loading = false;
        state.success = false;

        state.error =
          action.payload || "Deposit submission failed";

        state.paymentUrl = null;
        state.orderId = "";
        state.depositId = "";
        state.amount = 0;
      })

      /* ======================================================
         CANCEL
      ====================================================== */

      .addCase(cancelDeposit.pending, (state) => {
        state.cancelLoading = true;
        state.error = null;
      })

      .addCase(cancelDeposit.fulfilled, (state, action) => {
        state.cancelLoading = false;

        state.currentStatus = 3;

        state.cancelledAt =
          action.payload?.cancelledAt ||
          new Date().toISOString();

        state.cancelReason =
          action.payload?.cancelReason || "User cancelled";

        state.message =
          action.payload?.message || "Deposit cancelled";

        const depositId = action.payload?.depositId;
        const orderId = action.payload?.orderId;

        if (depositId || orderId) {
          state.deposits = state.deposits.map((deposit) => {
            const idMatch =
              depositId &&
              String(deposit._id) === String(depositId);

            const orderMatch =
              orderId &&
              String(deposit.orderId) === String(orderId);

            if (idMatch || orderMatch) {
              return {
                ...deposit,
                status: 3,
                cancelledAt: state.cancelledAt,
              };
            }

            return deposit;
          });
        }
      })

      .addCase(cancelDeposit.rejected, (state, action) => {
        state.cancelLoading = false;

        state.error =
          action.payload || "Failed to cancel deposit";
      })

      /* ======================================================
         STATUS
      ====================================================== */

      .addCase(fetchDepositStatus.pending, (state) => {
        state.statusLoading = true;
        state.error = null;
      })

      .addCase(fetchDepositStatus.fulfilled, (state, action) => {
        state.statusLoading = false;

        const deposit = action.payload?.deposit;

        if (deposit) {
          state.currentStatus = deposit.status;

          state.orderId = String(
            deposit.orderId || state.orderId || ""
          );

          state.depositId = String(
            deposit._id || state.depositId || ""
          );

          state.amount = Number(
            deposit.amount || state.amount || 0
          );

          state.cancelledAt = deposit.cancelledAt || null;

          state.cancelReason = deposit.cancelReason || "";

          // Lottery info
          state.lotteryNumbers = deposit.lotteryNumbers || [];
          state.lotteryProcessed = deposit.lotteryProcessed || false;
          state.lotteryEntries = deposit.lotteryEntries || [];

          if (deposit._id) {
            state.currentDeposit = {
              ...(state.currentDeposit || {}),
              ...deposit,
            };
          }
        }
      })

      .addCase(fetchDepositStatus.rejected, (state, action) => {
        state.statusLoading = false;

        state.error =
          action.payload || "Failed to fetch deposit status";
      })

      /* ======================================================
         GET MY DEPOSITS
      ====================================================== */

      .addCase(getMyDeposits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getMyDeposits.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        state.deposits = action.payload?.deposits || [];

        state.pagination = {
          total: Number(action.payload?.total) || 0,
          currentPage: Number(action.payload?.currentPage) || 1,
          totalPages: Number(action.payload?.totalPages) || 0,
          limit: Number(action.payload?.limit) || 10,
        };
      })

      .addCase(getMyDeposits.rejected, (state, action) => {
        state.loading = false;

        state.error =
          action.payload || "Failed to fetch deposits";

        state.deposits = [];
      })

      /* ======================================================
         ADMIN
      ====================================================== */

      .addCase(getAllDepositsForAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getAllDepositsForAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        state.adminDeposits = action.payload?.deposits || [];

        state.adminPagination = {
          total: Number(action.payload?.total) || 0,
          currentPage: Number(action.payload?.currentPage) || 1,
          totalPages: Number(action.payload?.totalPages) || 0,
          perPage:
            Number(
              action.payload?.perPage || action.payload?.limit
            ) || 20,
        };

        state.message =
          action.payload?.message ||
          "All deposits fetched successfully";
      })

      .addCase(getAllDepositsForAdmin.rejected, (state, action) => {
        state.loading = false;

        state.error =
          action.payload || "Failed to fetch all deposits";

        state.adminDeposits = [];
      })

      /* ======================================================
         SINGLE
      ====================================================== */

      .addCase(getSingleDeposit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getSingleDeposit.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        state.currentDeposit = action.payload?.deposit || null;
      })

      .addCase(getSingleDeposit.rejected, (state, action) => {
        state.loading = false;

        state.error =
          action.payload || "Failed to fetch deposit details";

        state.currentDeposit = null;
      });
  },
});

/* ==========================================================
   ACTIONS
========================================================== */

export const {
  clearDepositState,
  clearDeposits,
  clearAdminDeposits,
  clearCurrentDeposit,
  setDepositFilters,
  setAdminDepositFilters,
  resetDepositFilters,
  resetAdminDepositFilters,
} = depositSlice.actions;

/* ==========================================================
   SELECTORS
========================================================== */

export const selectDeposits = (state) => state.deposit.deposits;

export const selectDepositPagination = (state) =>
  state.deposit.pagination;

export const selectAdminDeposits = (state) =>
  state.deposit.adminDeposits;

export const selectAdminDepositPagination = (state) =>
  state.deposit.adminPagination;

export const selectCurrentDeposit = (state) =>
  state.deposit.currentDeposit;

export const selectDepositPaymentUrl = (state) =>
  state.deposit.paymentUrl;

export const selectDepositOrderId = (state) =>
  state.deposit.orderId;

export const selectDepositId = (state) =>
  state.deposit.depositId;

export const selectDepositAmount = (state) =>
  state.deposit.amount;

export const selectDepositLoading = (state) =>
  state.deposit.loading;

export const selectDepositError = (state) =>
  state.deposit.error;

export const selectDepositLotteryNumbers = (state) =>
  state.deposit.lotteryNumbers;

export const selectDepositLotteryProcessed = (state) =>
  state.deposit.lotteryProcessed;

export const selectDepositLotteryEntries = (state) =>
  state.deposit.lotteryEntries;

export default depositSlice.reducer;