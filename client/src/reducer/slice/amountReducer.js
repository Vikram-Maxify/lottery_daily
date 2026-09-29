import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";
import api from "../api";


// =======================
// ADMIN: UPDATE AMOUNT
// =======================
export const updateAmount = createAsyncThunk(
  "amount/updateAmount",
  async (amount, { rejectWithValue }) => {
    try {
      const response = await api.put("/amount", {
        amount,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message: "Failed to update amount",
        }
      );
    }
  }
);

// =======================
// GET AMOUNT
// =======================
export const getAmount = createAsyncThunk(
  "amount/getAmount",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/amount");

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message: "Failed to fetch amount",
        }
      );
    }
  }
);

const initialState = {
  amount: 0,
  updatedAt: null,

  loading: false,
  updateLoading: false,

  success: false,
  error: null,
  message: "",
};

const amountSlice = createSlice({
  name: "amount",
  initialState,

  reducers: {
    clearAmountMessage: (state) => {
      state.success = false;
      state.error = null;
      state.message = "";
    },
  },

  extraReducers: (builder) => {
    // =======================
    // GET AMOUNT
    // =======================
    builder
      .addCase(getAmount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getAmount.fulfilled, (state, action) => {
        state.loading = false;

        state.amount =
          action.payload?.data?.amount ?? 0;

        state.updatedAt =
          action.payload?.data?.updatedAt ?? null;

        state.message =
          action.payload?.message || "";

        state.error = null;
      })

      .addCase(getAmount.rejected, (state, action) => {
        state.loading = false;

        state.error =
          action.payload?.message ||
          "Failed to fetch amount";
      });

    // =======================
    // UPDATE AMOUNT
    // =======================
    builder
      .addCase(updateAmount.pending, (state) => {
        state.updateLoading = true;
        state.success = false;
        state.error = null;
      })

      .addCase(updateAmount.fulfilled, (state, action) => {
        state.updateLoading = false;

        state.success = true;
        state.error = null;

        state.message =
          action.payload?.message ||
          "Amount updated successfully";

        state.amount =
          action.payload?.data?.amount ?? 0;

        state.updatedAt =
          action.payload?.data?.updatedAt ?? null;
      })

      .addCase(updateAmount.rejected, (state, action) => {
        state.updateLoading = false;

        state.success = false;

        state.error =
          action.payload?.message ||
          "Failed to update amount";
      });
  },
});

export const {
  clearAmountMessage,
} = amountSlice.actions;

export default amountSlice.reducer;