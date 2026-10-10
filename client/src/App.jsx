import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import "./App.css";

// ================= CLIENT =================
import PrivateRoute from "./Components/PrivateRoute";
import PhoneLayout from "./Layout/PhoneLayout";

import BuyTicket from "./Pages/BuyTicket";
import HomePage from "./Pages/HomePage";
import Login from "./Pages/Login";
import PaymentSuccess from "./Pages/PaymentSuccess";
import ProfilePage from "./Pages/ProfilePage";
import Register from "./Pages/Register";
import ResultPage from "./Pages/ResultPage";
import WithdrawalRequest from "./Pages/WithdrawalRequest";

// ================= ADMIN =================
import AdminLayout from "./admin/adminComponents/AdminLayout";
import AdminPrivateRoute from "./admin/adminComponents/PrivateRoute";

import AdminLogin from "./admin/adminPages/AdminLogin";
import AdminLottery from "./admin/adminPages/AdminLottery";
import Amount from "./admin/adminPages/Amount";
import Dashboard from "./admin/adminPages/Dashboard";
import AdminResults from "./admin/adminPages/Results";
import Users from "./admin/adminPages/Users";
import WithdrawalManagement from "./admin/adminPages/WithdrawalManagement";
import Recharge from "./Pages/Rechagre";
// import Deposit from "./Pages/Deposit";
import AdminFestivalLottery from "./admin/adminPages/AdminFestivalLottery";
import AdminHomeBanner from "./admin/adminPages/AdminHomeBanner";
import AdminKycVerification from "./admin/adminPages/AdminKycVerification";
import AdminSettings from "./admin/adminPages/AdminSettings";
import AdminTopWinners from "./admin/adminPages/AdminTopWinners";
import FestivalResult from "./admin/adminPages/FestivalResult";
import LotteryPurchaseReports from "./admin/adminPages/LotteryPurchaseReports";
import FestivalLottery from "./Pages/FestivalLottery";
import KycVarificationPage from "./Pages/KycVarificationPage";
import LeaderboardPage from "./Pages/LeaderboardPage";
import LiveTickets from "./Pages/LiveTickets";
import ReferralPage from "./Pages/ReferralPage";
import VarifyTicket from "./Pages/VarifyTicket";
import WithdrawHistory from "./Pages/WithdrawHistory";

// ==========================================================
// HOME ROUTE
// ==========================================================
const HomeRoute = () => {
  const location = useLocation();

  return <HomePage key={location.key} />;
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
          <Route path="/" element={<HomeRoute />} />

          {/* Login */}
          <Route path="/login" element={<Login />} />

          {/* Register */}
          <Route path="/register" element={<Register />} />

          {/* Results */}
          <Route path="/results" element={<ResultPage />} />

          {/* ================= CLIENT PRIVATE ================= */}

          <Route element={<PrivateRoute />}>
            {/* Profile */}
            <Route path="/profile" element={<ProfilePage />} />

            {/* Buy Ticket */}
            <Route path="/buy-ticket" element={<BuyTicket />} />
            <Route path="/festival" element={<FestivalLottery />} />
            <Route path="/kyc" element={<KycVarificationPage />} />

            <Route path="/verify" element={<VarifyTicket />} />

            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/referral" element={<ReferralPage />} />

            {/* <Route
              path="/my-tickets"
              element={<MyTickets />}
            /> */}

            {/* Withdraw */}
            <Route path="/user/withdraw" element={<WithdrawalRequest />} />

            <Route path="/withdraw-history" element={<WithdrawHistory />} />
            <Route path="/recharge" element={<Recharge />} />

            <Route path="/live-tickets" element={<LiveTickets />} />

            {/* <Route
              path="/deposit"
              element={<Deposit />}
            /> */}

            {/* Payment Success */}
            <Route path="/payment-success" element={<PaymentSuccess />} />
          </Route>
        </Route>

        {/* =====================================================
            ADMIN PUBLIC ROUTES
        ===================================================== */}

        <Route path="/admin/login" element={<AdminLogin />} />

        {/* =====================================================
            ADMIN PRIVATE ROUTES
            Saare admin routes /admin/* prefix ke saath
        ===================================================== */}

        <Route element={<AdminPrivateRoute />}>
          <Route element={<AdminLayout />}>
            {/* Dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Users */}
            <Route path="/users" element={<Users />} />

            {/* Amount */}
            <Route path="/amount" element={<Amount />} />

            <Route path="/home_banner" element={<AdminHomeBanner />} />

            <Route path="/adminkyc" element={<AdminKycVerification />} />

            {/* ADMIN RESULTS */}
            <Route path="/admin/results" element={<AdminResults />} />
            <Route path="/admin/festival_result" element={<FestivalResult />} />
            {/* lottery config */}
            <Route
              path="admin/festival_lottery"
              element={<AdminFestivalLottery />}
            />

            {/* Admin Lottery */}
            <Route path="/admin/lottery" element={<AdminLottery />} />

            {/* Lottery Purchase Reports */}
            <Route
              path="/admin/lottery-reports"
              element={<LotteryPurchaseReports />}
            />
            <Route
              path="/lottery-reports"
              element={<LotteryPurchaseReports />}
            />

            {/* Admin Deposits */}
            {/* <Route
              path="/admin/deposits"
              element={<AdminDeposits />}
            /> */}

            {/* Admin Withdrawals */}
            <Route
              path="/admin/withdrawals"
              element={<WithdrawalManagement />}
            />

            {/* Admin Top Winners */}
            <Route path="/admin/top-winners" element={<AdminTopWinners />} />

            {/* Admin Settings (Daily amount, Festival amount, Referral %) */}
            <Route path="/settings" element={<AdminSettings />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>
        </Route>

        {/* =====================================================
            DEFAULT
        ===================================================== */}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* =====================================================
          WHATSAPP - USER SIDE ONLY (ADMIN SIDE HIDDEN)
      ===================================================== */}
    </>
  );
}

export default App;
