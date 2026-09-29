import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import "./App.css";

// ================= CLIENT =================
import PrivateRoute from "./Components/PrivateRoute";
import PhoneLayout from "./Layout/PhoneLayout";

import BuyTicket from "./Pages/BuyTicket";
import HomePage from "./Pages/HomePage";
import Login from "./Pages/Login";
import MyTickets from "./Pages/MyTickets";
import ProfilePage from "./Pages/ProfilePage";
import Register from "./Pages/Register";
import ResultPage from "./Pages/ResultPage";
import PaymentSuccess from "./Pages/PaymentSuccess";
import WithdrawalRequest from "./Pages/WithdrawalRequest";

// ================= ADMIN =================
import AdminLayout from "./admin/adminComponents/AdminLayout";
import AdminPrivateRoute from "./admin/adminComponents/PrivateRoute";

import AdminLogin from "./admin/adminPages/AdminLogin";
import Amount from "./admin/adminPages/Amount";
import Dashboard from "./admin/adminPages/Dashboard";
import AdminResults from "./admin/adminPages/Results";
import Users from "./admin/adminPages/Users";
import LotteryConfig from "./admin/adminPages/LotteryConfig";
import AdminLottery from "./admin/adminPages/AdminLottery";
import AdminDeposits from "./admin/adminPages/AdminDeposits";
import WithdrawalManagement from "./admin/adminPages/WithdrawalManagement";
import Recharge from "./Pages/Rechagre";
import Deposit from "./Pages/Deposit";
import WithdrawHistory from "./Pages/WithdrawHistory";
import FestivalLottery from "./Pages/FestivalLottery";
import KycVarificationPage from "./Pages/KycVarificationPage";

// ==========================================================
// WHATSAPP SUPPORT NUMBER
// ==========================================================
const WHATSAPP_NUMBER = "+917234806209";

// ==========================================================
// ADMIN ROUTES LIST (WhatsApp hide karne ke liye)
// Saare admin routes /admin se start hote hain
// ==========================================================
const ADMIN_ROUTES = ["/admin"];

// ==========================================================
// HOME ROUTE
// Home par aane par HomePage fresh mount hoga
// ==========================================================
const HomeRoute = () => {
  const location = useLocation();

  return (
    <HomePage
      key={location.key}
    />
  );
};

// ==========================================================
// APP
// ==========================================================
function App() {
  return (
    <>
      <Routes>

        {/* =====================================================
            CLIENT ROUTES
        ===================================================== */}

        <Route element={<PhoneLayout />}>

          {/* ================= CLIENT PUBLIC ================= */}

          {/* Home */}
          <Route
            path="/"
            element={<HomeRoute />}
          />

          {/* Login */}
          <Route
            path="/login"
            element={<Login />}
          />

          {/* Register */}
          <Route
            path="/register"
            element={<Register />}
          />

          {/* Results */}
          <Route
            path="/results"
            element={<ResultPage />}
          />


          {/* ================= CLIENT PRIVATE ================= */}

          <Route element={<PrivateRoute />}>

            {/* Profile */}
            <Route
              path="/profile"
              element={<ProfilePage />}
            />

            {/* Buy Ticket */}
            <Route
              path="/buy-ticket"
              element={<BuyTicket />}
            />
             <Route
              path="/festival"
              element={<FestivalLottery />}
            />
              <Route
              path="/kyc"
              element={<KycVarificationPage />}
            />

            {/* My Tickets */}
            {/* <Route
              path="/my-tickets"
              element={<MyTickets />}
            /> */}

            {/* Withdraw */}
            <Route
              path="/user/withdraw"
              element={<WithdrawalRequest />}
            />

            <Route
              path="/withdraw-history"
              element={<WithdrawHistory />}
            />
            <Route path="/recharge" element={<Recharge />} />
            <Route
              path="/deposit"
              element={<Deposit />}
            />

            {/* Payment Success */}
            <Route
              path="/payment-success"
              element={<PaymentSuccess />}
            />


          </Route>

        </Route>


        {/* =====================================================
            ADMIN PUBLIC ROUTES
        ===================================================== */}

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />


        {/* =====================================================
            ADMIN PRIVATE ROUTES
            Saare admin routes /admin/* prefix ke saath
        ===================================================== */}

        <Route element={<AdminPrivateRoute />}>

          <Route element={<AdminLayout />}>

            {/* Dashboard */}
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            {/* Users */}
            <Route
              path="/users"
              element={<Users />}
            />

            {/* Amount */}
            <Route
              path="/amount"
              element={<Amount />}
            />

            {/* ADMIN RESULTS */}
            <Route
              path="/admin/results"
              element={<AdminResults />}
            />

            {/* Lottery Config */}
            <Route
              path="/lottery-config"
              element={<LotteryConfig />}
            />

            {/* Admin Lottery */}
            <Route
              path="/admin/lottery"
              element={<AdminLottery />}
            />

            {/* Admin Deposits */}
            <Route
              path="/admin/deposits"
              element={<AdminDeposits />}
            />

            {/* Admin Withdrawals */}
            <Route
              path="/admin/withdrawals"
              element={<WithdrawalManagement />}
            />

          </Route>

        </Route>


        {/* =====================================================
            DEFAULT
        ===================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>


      {/* =====================================================
          WHATSAPP - USER SIDE ONLY (ADMIN SIDE HIDDEN)
      ===================================================== */}

    </>
  );
}

export default App;