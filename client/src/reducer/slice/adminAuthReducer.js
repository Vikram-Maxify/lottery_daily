import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api";

// =====================================
// INITIAL STATE
// =====================================

const initialState = {
  admin: null,
  isAuthenticated: false,

  // Users
  users: [],
  usersLoading: false,
  usersError: null,

  // Update user
  updateLoading: false,

  loading: false,
  error: null,
  message: null,
};

// =====================================
// ADMIN LOGIN
// =====================================

export const adminLogin = createAsyncThunk(
  "adminAuth/login",

  async ({ mobile, password }, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/login", {
        mobile,
        password,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Admin login failed"
      );
    }
  }
);

// =====================================
// GET ADMIN PROFILE
// =====================================

export const getAdminProfile = createAsyncThunk(
  "adminAuth/profile",

  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/auth/profile");

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to fetch admin profile"
      );
    }
  }
);

// =====================================
// ADMIN LOGOUT
// =====================================

export const adminLogout = createAsyncThunk(
  "adminAuth/logout",

  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/logout");

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Admin logout failed"
      );
    }
  }
);

// =====================================
// GET ALL USERS
// =====================================

export const getAllUsers = createAsyncThunk(
  "adminAuth/getAllUsers",

  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/auth/all");

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to fetch users"
      );
    }
  }
);

// =====================================
// UPDATE USER PROFILE
// =====================================

export const updateUserProfile = createAsyncThunk(
  "adminAuth/updateUserProfile",

  async ({ uuid, name, mobile, password }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/auth/${uuid}`, {
        name,
        mobile,
        password,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to update user profile"
      );
    }
  }
);

// =====================================
// SLICE
// =====================================

const adminAuthSlice = createSlice({
  name: "adminAuth",

  initialState,

  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    },

    clearAdminMessage: (state) => {
      state.message = null;
    },

    clearUsersError: (state) => {
      state.usersError = null;
    },

    resetAdminAuth: () => initialState,
  },

  extraReducers: (builder) => {
    // =================================
    // ADMIN LOGIN
    // =================================

    builder
      .addCase(adminLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })

      .addCase(adminLogin.fulfilled, (state, action) => {
        state.loading = false;

        state.isAuthenticated = true;

        state.admin = action.payload?.data || null;

        state.message =
          action.payload?.message ||
          "Admin login successful";

        state.error = null;
      })

      .addCase(adminLogin.rejected, (state, action) => {
        state.loading = false;

        state.isAuthenticated = false;

        state.admin = null;

        state.error = action.payload;
      });

    // =================================
    // ADMIN PROFILE
    // =================================

    builder
      .addCase(getAdminProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getAdminProfile.fulfilled, (state, action) => {
        state.loading = false;

        state.isAuthenticated = true;

        state.admin = action.payload?.data || null;

        state.error = null;
      })

      .addCase(getAdminProfile.rejected, (state, action) => {
        state.loading = false;

        state.isAuthenticated = false;

        state.admin = null;

        state.error = action.payload;
      });

    // =================================
    // ADMIN LOGOUT
    // =================================

    builder
      .addCase(adminLogout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(adminLogout.fulfilled, (state, action) => {
        state.loading = false;

        state.admin = null;

        state.isAuthenticated = false;

        state.error = null;

        state.message =
          action.payload?.message ||
          "Admin logout successful";
      })

      .addCase(adminLogout.rejected, (state, action) => {
        state.loading = false;

        state.error = action.payload;
      });

    // =================================
    // GET ALL USERS
    // =================================

    builder
      .addCase(getAllUsers.pending, (state) => {
        state.usersLoading = true;
        state.usersError = null;
      })

      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.usersLoading = false;

        state.users = action.payload?.data || [];

        state.usersError = null;
      })

      .addCase(getAllUsers.rejected, (state, action) => {
        state.usersLoading = false;

        state.usersError = action.payload;

        state.users = [];
      });

    // =================================
    // UPDATE USER PROFILE
    // =================================

    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.updateLoading = true;

        state.error = null;
        state.message = null;
      })

      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.updateLoading = false;

        state.message =
          action.payload?.message ||
          "User profile updated successfully";

        const updatedUser = action.payload?.data;

        if (updatedUser?.uuid) {
          const index = state.users.findIndex(
            (user) => user.uuid === updatedUser.uuid
          );

          if (index !== -1) {
            state.users[index] = {
              ...state.users[index],
              ...updatedUser,
            };
          }
        }

        state.error = null;
      })

      .addCase(updateUserProfile.rejected, (state, action) => {
        state.updateLoading = false;

        state.error = action.payload;
      });
  },
});

// =====================================
// ACTIONS
// =====================================

export const {
  clearAdminError,
  clearAdminMessage,
  clearUsersError,
  resetAdminAuth,
} = adminAuthSlice.actions;

// =====================================
// REDUCER
// =====================================

export default adminAuthSlice.reducer;
