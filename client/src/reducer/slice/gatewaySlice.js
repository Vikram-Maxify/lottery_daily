// src/redux/slice/gatewaySlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";

/* ==========================================================
   GET GATEWAYS (Admin) — all gateways, any status
   Route : GET /api/admin/gateway  (protected -> verifyAdminToken)
========================================================== */
export const getGatewaysAdmin = createAsyncThunk(
    "gateway/getGatewaysAdmin",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get("/admin/gateway");
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to fetch gateways"
            );
        }
    }
);

/* ==========================================================
   GET GATEWAYS (User) — only status: 1 (active) gateways
   Route : GET /api/gateway  (protected -> verifyToken)
========================================================== */
export const getGatewaysUser = createAsyncThunk(
    "gateway/getGatewaysUser",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get("/gateway");
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to fetch gateways"
            );
        }
    }
);

/* ==========================================================
   CREATE GATEWAY (Admin)
   Route : POST /api/admin/gateway  (protected -> verifyAdminToken)

   Body shape depends on `mode`:

   mode: "manual", type: "UPI"     -> upiId, qrCode?
   mode: "manual", type: "Crypto"  -> walletAddress, network?
   mode: "manual", type: "Bank"    -> bankName, accountNumber, ifscCode, accountHolderName
   mode: "automatic"               -> gatewayName, gatewayUrl?, merchantId?, apiKey?,
                                        secretKey?, privateKey?, publicKey?, webhookSecret?

   Common to every mode: name, mode, minLimit, maxLimit, status
========================================================== */
export const createGateway = createAsyncThunk(
    "gateway/createGateway",
    async (gatewayData, { rejectWithValue }) => {
        try {
            const { data } = await api.post("/admin/gateway", gatewayData);
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to create gateway"
            );
        }
    }
);

/* ==========================================================
   UPDATE GATEWAY (Admin)
   Route : PUT /api/admin/gateway/:id  (protected -> verifyAdminToken)
   Same body shape as create — only send the fields relevant to the
   selected mode/type, matching the controller's per-type handling.
========================================================== */
export const updateGateway = createAsyncThunk(
    "gateway/updateGateway",
    async ({ id, ...gatewayData }, { rejectWithValue }) => {
        try {
            const { data } = await api.put(`/admin/gateway/${id}`, gatewayData);
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to update gateway"
            );
        }
    }
);

/* ==========================================================
   TOGGLE GATEWAY STATUS (Admin)
   Route : PATCH /api/admin/gateway/:id/status  (protected -> verifyAdminToken)
   No body needed — controller flips status 0 <-> 1 server-side.
========================================================== */
export const toggleGatewayStatus = createAsyncThunk(
    "gateway/toggleGatewayStatus",
    async (id, { rejectWithValue }) => {
        try {
            const { data } = await api.patch(`/admin/gateway/${id}/status`);
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to toggle gateway status"
            );
        }
    }
);

/* ==========================================================
   DELETE GATEWAY (Admin)
   Route : DELETE /api/admin/gateway/:id  (protected -> verifyAdminToken)
========================================================== */
export const deleteGateway = createAsyncThunk(
    "gateway/deleteGateway",
    async (id, { rejectWithValue }) => {
        try {
            const { data } = await api.delete(`/admin/gateway/${id}`);
            return { ...data, id };
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to delete gateway"
            );
        }
    }
);

/* ==========================
   SLICE
========================== */
const initialState = {
    loading: false,
    success: false,
    error: null,
    message: "",

    gateways: [],
    currentGateway: null,
};

const gatewaySlice = createSlice({
    name: "gateway",
    initialState,

    reducers: {
        clearGatewayState: (state) => {
            state.loading = false;
            state.success = false;
            state.error = null;
            state.message = "";
        },
        clearCurrentGateway: (state) => {
            state.currentGateway = null;
        },
    },

    extraReducers: (builder) => {
        builder
            /* ================= Get Gateways (Admin) ================= */
            .addCase(getGatewaysAdmin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getGatewaysAdmin.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.gateways = action.payload.gateways;
            })
            .addCase(getGatewaysAdmin.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.gateways = [];
            })

            /* ================= Get Gateways (User) ================= */
            .addCase(getGatewaysUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getGatewaysUser.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.gateways = action.payload.gateways;
            })
            .addCase(getGatewaysUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.gateways = [];
            })

            /* ================= Create Gateway ================= */
            .addCase(createGateway.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(createGateway.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.message = action.payload.message;
                state.gateways = [action.payload.gateway, ...state.gateways];
            })
            .addCase(createGateway.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.success = false;
            })

            /* ================= Update Gateway ================= */
            .addCase(updateGateway.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(updateGateway.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.message = action.payload.message;

                const updated = action.payload.gateway;
                const index = state.gateways.findIndex((g) => g._id === updated?._id);
                if (index !== -1) {
                    state.gateways[index] = updated;
                }
            })
            .addCase(updateGateway.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.success = false;
            })

            /* ================= Toggle Gateway Status ================= */
            .addCase(toggleGatewayStatus.pending, (state) => {
                state.error = null;
            })
            .addCase(toggleGatewayStatus.fulfilled, (state, action) => {
                state.success = true;
                state.message = action.payload.message;

                const updated = action.payload.gateway;
                const index = state.gateways.findIndex((g) => g._id === updated?._id);
                if (index !== -1) {
                    state.gateways[index] = updated;
                }
            })
            .addCase(toggleGatewayStatus.rejected, (state, action) => {
                state.error = action.payload;
            })

            /* ================= Delete Gateway ================= */
            .addCase(deleteGateway.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(deleteGateway.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.message = action.payload.message;
                state.gateways = state.gateways.filter((g) => g._id !== action.payload.id);
            })
            .addCase(deleteGateway.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.success = false;
            });
    },
});

export const { clearGatewayState, clearCurrentGateway } = gatewaySlice.actions;

export default gatewaySlice.reducer;