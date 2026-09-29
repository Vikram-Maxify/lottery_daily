import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import api from "../api";

// ==========================================================
// REGISTER
// ==========================================================

export const register = createAsyncThunk(
  "auth/register",

  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/register", userData);

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Registration failed"
      );
    }
  }
);

// ==========================================================
// LOGIN
// ==========================================================

export const login = createAsyncThunk(
  "auth/login",

  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/login", userData);

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Login failed"
      );
    }
  }
);

// ==========================================================
// PROFILE
// ==========================================================

export const fetchProfile = createAsyncThunk(
  "auth/fetchProfile",

  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/auth/profile");

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to fetch profile"
      );
    }
  }
);

// ==========================================================
// UPDATE PROFILE
// ==========================================================

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",

  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.put(
        "/auth/profile",
        userData
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Profile update failed"
      );
    }
  }
);

// ==========================================================
// LOGOUT
// ==========================================================

export const logout = createAsyncThunk(
  "auth/logout",

  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/logout");

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Logout failed"
      );
    }
  }
);

// ==========================================================
// INITIAL STATE
// ==========================================================

const initialState = {
  user: null,
  isAuthenticated: false,

  // REGISTER
  registerLoading: false,
  registerError: null,

  // LOGIN
  loginLoading: false,
  loginError: null,

  // PROFILE
  profileLoading: false,
  profileError: null,

  // UPDATE PROFILE
  updateProfileLoading: false,
  updateProfileError: null,
  updateProfileSuccess: null,

  // LOGOUT
  logoutLoading: false,
  logoutError: null,
};

// ==========================================================
// AUTH SLICE
// ==========================================================

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    // ======================================================
    // CLEAR AUTH ERRORS
    // ======================================================

    clearAuthErrors: (state) => {
      state.registerError = null;
      state.loginError = null;
      state.profileError = null;
      state.updateProfileError = null;
      state.logoutError = null;
    },

    // ======================================================
    // CLEAR USER
    // ======================================================

    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },

    // ======================================================
    // CLEAR UPDATE PROFILE STATE
    // ======================================================

    clearUpdateProfileState: (state) => {
      state.updateProfileError = null;
      state.updateProfileSuccess = null;
      state.updateProfileLoading = false;
    },
  },

  // ========================================================
  // EXTRA REDUCERS
  // ========================================================

  extraReducers: (builder) => {
    // ======================================================
    // REGISTER
    // ======================================================

    builder
      .addCase(register.pending, (state) => {
        state.registerLoading = true;
        state.registerError = null;
      })

      .addCase(register.fulfilled, (state, action) => {
        state.registerLoading = false;
        state.registerError = null;

        state.user = action.payload?.data || null;
      })

      .addCase(register.rejected, (state, action) => {
        state.registerLoading = false;

        state.registerError =
          action.payload || "Registration failed";
      });

    // ======================================================
    // LOGIN
    // ======================================================

    builder
      .addCase(login.pending, (state) => {
        state.loginLoading = true;
        state.loginError = null;
      })

      .addCase(login.fulfilled, (state, action) => {
        state.loginLoading = false;
        state.loginError = null;

        state.user = action.payload?.data || null;
        state.isAuthenticated = true;

        state.profileLoading = false;
        state.profileError = null;
      })

      .addCase(login.rejected, (state, action) => {
        state.loginLoading = false;

        state.loginError =
          action.payload ||
          "Invalid mobile or password";

        state.user = null;
        state.isAuthenticated = false;
        state.profileLoading = false;
      });

    // ======================================================
    // PROFILE
    // ======================================================

    builder
      .addCase(fetchProfile.pending, (state) => {
        state.profileLoading = true;
        state.profileError = null;
      })

      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.profileError = null;

        state.user = action.payload?.data || null;
        state.isAuthenticated = true;
      })

      .addCase(fetchProfile.rejected, (state, action) => {
        state.profileLoading = false;

        state.profileError =
          action.payload ||
          "Failed to fetch profile";

        state.user = null;
        state.isAuthenticated = false;
      });

    // ======================================================
    // UPDATE PROFILE
    // ======================================================

    builder
      .addCase(updateProfile.pending, (state) => {
        state.updateProfileLoading = true;
        state.updateProfileError = null;
        state.updateProfileSuccess = null;
      })

      .addCase(updateProfile.fulfilled, (state, action) => {
        state.updateProfileLoading = false;
        state.updateProfileError = null;

        state.updateProfileSuccess =
          action.payload?.message ||
          "Profile updated successfully";

        // ==================================================
        // UPDATE REDUX USER IMMEDIATELY
        // ==================================================

        if (action.payload?.data) {
          state.user = {
            ...state.user,
            ...action.payload.data,
          };
        }

        state.isAuthenticated = true;
      })

      .addCase(updateProfile.rejected, (state, action) => {
        state.updateProfileLoading = false;

        state.updateProfileError =
          action.payload ||
          "Profile update failed";

        state.updateProfileSuccess = null;
      });

    // ======================================================
    // LOGOUT
    // ======================================================

    builder
      .addCase(logout.pending, (state) => {
        state.logoutLoading = true;
        state.logoutError = null;
      })

      .addCase(logout.fulfilled, (state) => {
        state.logoutLoading = false;
        state.logoutError = null;

        state.user = null;
        state.isAuthenticated = false;

        state.profileLoading = false;

        state.updateProfileLoading = false;
        state.updateProfileError = null;
        state.updateProfileSuccess = null;
      })

      .addCase(logout.rejected, (state, action) => {
        state.logoutLoading = false;

        state.logoutError =
          action.payload || "Logout failed";
      });
  },
});

// ==========================================================
// ACTIONS
// ==========================================================

export const {
  clearAuthErrors,
  clearUser,
  clearUpdateProfileState,
} = authSlice.actions;

// ==========================================================
// REDUCER
// ==========================================================

export default authSlice.reducer;