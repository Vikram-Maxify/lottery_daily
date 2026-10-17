import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import api from "../api";

// ==========================================================
// OTP THUNKS
// ==========================================================

export const sendRegisterOtp = createAsyncThunk(
  "auth/sendRegisterOtp",
  async ({ mobile }, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/send-otp", { mobile });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to send OTP"
      );
    }
  }
);

export const verifyRegisterOtp = createAsyncThunk(
  "auth/verifyRegisterOtp",
  async ({ mobile, otp }, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/verify-otp", { mobile, otp });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "OTP verification failed"
      );
    }
  }
);

export const sendForgotPasswordOtp = createAsyncThunk(
  "auth/sendForgotPasswordOtp",
  async ({ mobile }, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/forgot-password/send-otp", {
        mobile,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to send OTP"
      );
    }
  }
);

export const resetPasswordWithOtp = createAsyncThunk(
  "auth/resetPasswordWithOtp",
  async ({ mobile, otp, newPassword }, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/forgot-password/reset", {
        mobile,
        otp,
        newPassword,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Password reset failed"
      );
    }
  }
);

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
        error.response?.data?.message || "Failed to fetch profile"
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
      const config = {};
      if (userData instanceof FormData) {
        config.headers = { "Content-Type": "multipart/form-data" };
      }

      const response = await api.put("/auth/profile", userData, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Profile update failed"
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
        error.response?.data?.message || "Logout failed"
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

  // REGISTER OTP
  sendRegisterOtpLoading: false,
  sendRegisterOtpError: null,
  sendRegisterOtpSuccess: null,

  verifyRegisterOtpLoading: false,
  verifyRegisterOtpError: null,
  verifyRegisterOtpSuccess: null,
  registerOtpVerified: false,

  // FORGOT PASSWORD OTP
  sendForgotOtpLoading: false,
  sendForgotOtpError: null,
  sendForgotOtpSuccess: null,

  resetPasswordLoading: false,
  resetPasswordError: null,
  resetPasswordSuccess: null,

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
    // CLEAR AUTH ERRORS
    clearAuthErrors: (state) => {
      state.registerError = null;
      state.loginError = null;
      state.profileError = null;
      state.updateProfileError = null;
      state.logoutError = null;
      state.sendRegisterOtpError = null;
      state.verifyRegisterOtpError = null;
      state.sendForgotOtpError = null;
      state.resetPasswordError = null;
    },

    // CLEAR USER
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },

    // CLEAR UPDATE PROFILE STATE
    clearUpdateProfileState: (state) => {
      state.updateProfileError = null;
      state.updateProfileSuccess = null;
      state.updateProfileLoading = false;
    },

    // 🔥 RESET REGISTER OTP STATE (called when leaving register screen)
    resetRegisterOtpState: (state) => {
      state.sendRegisterOtpLoading = false;
      state.sendRegisterOtpError = null;
      state.sendRegisterOtpSuccess = null;

      state.verifyRegisterOtpLoading = false;
      state.verifyRegisterOtpError = null;
      state.verifyRegisterOtpSuccess = null;

      state.registerOtpVerified = false;
    },

    // 🔥 RESET FORGOT PASSWORD STATE
    resetForgotPasswordState: (state) => {
      state.sendForgotOtpLoading = false;
      state.sendForgotOtpError = null;
      state.sendForgotOtpSuccess = null;

      state.resetPasswordLoading = false;
      state.resetPasswordError = null;
      state.resetPasswordSuccess = null;
    },
  },

  extraReducers: (builder) => {
    // ================= SEND REGISTER OTP =================
    builder
      .addCase(sendRegisterOtp.pending, (state) => {
        state.sendRegisterOtpLoading = true;
        state.sendRegisterOtpError = null;
        state.sendRegisterOtpSuccess = null;
      })
      .addCase(sendRegisterOtp.fulfilled, (state, action) => {
        state.sendRegisterOtpLoading = false;
        state.sendRegisterOtpSuccess =
          action.payload?.message || "OTP sent successfully";

        // new OTP → previous verification no longer valid
        state.registerOtpVerified = false;
        state.verifyRegisterOtpSuccess = null;
      })
      .addCase(sendRegisterOtp.rejected, (state, action) => {
        state.sendRegisterOtpLoading = false;
        state.sendRegisterOtpError =
          action.payload || "Failed to send OTP";
      });

    // ================= VERIFY REGISTER OTP =================
    builder
      .addCase(verifyRegisterOtp.pending, (state) => {
        state.verifyRegisterOtpLoading = true;
        state.verifyRegisterOtpError = null;
        state.verifyRegisterOtpSuccess = null;
      })
      .addCase(verifyRegisterOtp.fulfilled, (state, action) => {
        state.verifyRegisterOtpLoading = false;
        state.verifyRegisterOtpSuccess =
          action.payload?.message || "OTP verified successfully";
        state.registerOtpVerified = true;
      })
      .addCase(verifyRegisterOtp.rejected, (state, action) => {
        state.verifyRegisterOtpLoading = false;
        state.verifyRegisterOtpError =
          action.payload || "OTP verification failed";
        state.registerOtpVerified = false;
      });

    // ================= SEND FORGOT OTP =================
    builder
      .addCase(sendForgotPasswordOtp.pending, (state) => {
        state.sendForgotOtpLoading = true;
        state.sendForgotOtpError = null;
        state.sendForgotOtpSuccess = null;
      })
      .addCase(sendForgotPasswordOtp.fulfilled, (state, action) => {
        state.sendForgotOtpLoading = false;
        state.sendForgotOtpSuccess =
          action.payload?.message || "OTP sent successfully";
      })
      .addCase(sendForgotPasswordOtp.rejected, (state, action) => {
        state.sendForgotOtpLoading = false;
        state.sendForgotOtpError =
          action.payload || "Failed to send OTP";
      });

    // ================= RESET PASSWORD =================
    builder
      .addCase(resetPasswordWithOtp.pending, (state) => {
        state.resetPasswordLoading = true;
        state.resetPasswordError = null;
        state.resetPasswordSuccess = null;
      })
      .addCase(resetPasswordWithOtp.fulfilled, (state, action) => {
        state.resetPasswordLoading = false;
        state.resetPasswordSuccess =
          action.payload?.message || "Password reset successfully";
      })
      .addCase(resetPasswordWithOtp.rejected, (state, action) => {
        state.resetPasswordLoading = false;
        state.resetPasswordError =
          action.payload || "Password reset failed";
      });

    // ================= REGISTER =================
    builder
      .addCase(register.pending, (state) => {
        state.registerLoading = true;
        state.registerError = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.registerLoading = false;
        state.registerError = null;

        state.user = action.payload?.data || null;
        state.isAuthenticated = true;

        // cleanup OTP state after successful registration
        state.registerOtpVerified = false;
        state.sendRegisterOtpSuccess = null;
        state.verifyRegisterOtpSuccess = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.registerLoading = false;
        state.registerError =
          action.payload || "Registration failed";
      });

    // ================= LOGIN =================
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
          action.payload || "Invalid mobile or password";

        state.user = null;
        state.isAuthenticated = false;
        state.profileLoading = false;
      });

    // ================= PROFILE =================
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
          action.payload || "Failed to fetch profile";

        state.user = null;
        state.isAuthenticated = false;
      });

    // ================= UPDATE PROFILE =================
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
          action.payload?.message || "Profile updated successfully";

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
          action.payload || "Profile update failed";
        state.updateProfileSuccess = null;
      });

    // ================= LOGOUT =================
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

        // also reset OTP states on logout (safety)
        state.registerOtpVerified = false;
        state.sendRegisterOtpSuccess = null;
        state.verifyRegisterOtpSuccess = null;
        state.sendForgotOtpSuccess = null;
        state.resetPasswordSuccess = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.logoutLoading = false;
        state.logoutError = action.payload || "Logout failed";
      })

      // WITHDRAWAL SUCCESS -> UPDATE WALLET BALANCE
      .addCase("withdrawal/create/fulfilled", (state, action) => {
        if (state.user && action.payload?.walletBalance !== undefined) {
          state.user.wallet = action.payload.walletBalance;
        }
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
  resetRegisterOtpState,
  resetForgotPasswordState,
} = authSlice.actions;

// ==========================================================
// REDUCER
// ==========================================================

export default authSlice.reducer;