import {
  BadgeCheck,
  BarChart3,
  ChevronRight,
  Edit3,
  HandCoins,
  Headphones,
  Loader2,
  LogOut,
  ShieldCheck,
  Ticket,
  Trophy,
  UserRound,
  Wallet,
  X,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  logout,
  updateProfile,
  clearUpdateProfileState,
} from "../reducer/slice/authSlice";

import {
  getMyLotteryEntries,
  selectMyLotteryEntriesLoading,
  selectMyLotteryTotalEntries,
} from "../reducer/slice/createLotteryConfigSlice";

import { getMyDeposits } from "../reducer/slice/depositSlice";
import { fetchMyWithdrawals } from "../reducer/slice/withdrawalSlice";

const WHATSAPP_NUMBER = "";

const modalInput =
  "w-full rounded-xl border border-[#d6dfec] bg-[#f6f9fe] px-4 py-3.5 text-[14px] font-medium text-[#1b2a5c] outline-none transition placeholder:text-[#8a97ab] focus:border-[#ed1d43] focus:bg-white focus:shadow-[0_0_0_3px_rgba(237,29,67,0.12)] disabled:opacity-60";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, logoutLoading, updateProfileLoading, updateProfileError } =
    useSelector((state) => state.auth);

  const totalTickets = useSelector(selectMyLotteryTotalEntries);
  const myEntriesLoading = useSelector(selectMyLotteryEntriesLoading);

  const {
    deposits = [],
    pagination = {},
    loading: depositLoading = false,
  } = useSelector((state) => state.deposit || {});

  const { myWithdrawals = [], myWithdrawalsLoading = false } = useSelector(
    (state) => state.withdrawal || {}
  );

  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    password: "",
  });

  useEffect(() => {
    if (!user) return;

    dispatch(getMyLotteryEntries());
    dispatch(getMyDeposits({ page: 1, limit: 10, sort: "desc" }));
    dispatch(fetchMyWithdrawals());
  }, [dispatch, user]);

  const handleOpenEditProfile = () => {
    dispatch(clearUpdateProfileState());
    setFormData({
      name: user?.name || "",
      mobile: user?.mobile || "",
      password: "",
    });
    setShowEditModal(true);
  };

  const handleCloseEditProfile = () => {
    if (updateProfileLoading) return;

    setShowEditModal(false);
    setFormData({ name: "", mobile: "", password: "" });
    dispatch(clearUpdateProfileState());
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    const name = formData.name.trim();
    const mobile = formData.mobile.trim();
    const password = formData.password;

    if (!name || !mobile) return;

    const updateData = { name, mobile };
    if (password.trim()) updateData.password = password;

    const result = await dispatch(updateProfile(updateData));

    if (updateProfile.fulfilled.match(result)) {
      setShowEditModal(false);
      setFormData({ name: "", mobile: "", password: "" });
      dispatch(clearUpdateProfileState());
    }
  };

  const handleLogout = async () => {
    const result = await dispatch(logout());
    if (logout.fulfilled.match(result)) {
      navigate("/login", { replace: true });
    }
  };

  const handleWhatsAppSupport = () => {
    const message = encodeURIComponent("Hello, I need support.");
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const handleOpenDeposits = () => navigate("/deposit");

  const walletBalance = Number(user?.wallet || 0);
  const formattedWalletBalance = walletBalance.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const totalDeposits = Number(pagination?.total || deposits?.length || 0);
  const totalWithdrawals = Number(myWithdrawals?.length || 0);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#EBF0F7] pb-[90px] text-[#1b2a5c]">
      <div className="mx-auto w-full max-w-[600px]">
        {/* ================= HERO / PROFILE ================= */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0f1c4d] via-[#1b2a5c] to-[#3b0d1c] px-3 pb-16 pt-6 sm:px-6">
          <div className="pointer-events-none absolute -left-16 top-6 h-48 w-48 rounded-full bg-[#ed1d43]/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 top-0 h-56 w-56 rounded-full bg-[#ffd84a]/10 blur-3xl" />

          <div className="relative flex items-center gap-3 sm:gap-4">
            <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full border-[3px] border-[#ffd84a] bg-white/10 shadow-[0_0_25px_rgba(255,216,74,0.25)] sm:h-[96px] sm:w-[96px]">
              <UserRound
                className="h-[38px] w-[38px] text-[#ffd84a] sm:h-[50px] sm:w-[50px]"
                strokeWidth={1.5}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[12px] text-white/70 sm:text-[14px]">Hello,</p>

              <h1 className="truncate text-[21px] font-extrabold leading-tight text-white sm:text-[27px]">
                {user?.name || "User"}
              </h1>

              <p className="mt-0.5 text-[12px] text-white/80 sm:text-[14px]">
                +91 {user?.mobile || "----------"}
              </p>

              <button
                type="button"
                onClick={handleOpenEditProfile}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/40 px-3 py-1.5 text-[11px] font-semibold text-white transition active:scale-95 sm:text-[13px]"
              >
                <Edit3 size={13} />
                Edit Profile
              </button>
            </div>
          </div>
        </section>

        {/* ================= STATS + WALLET ================= */}
        <section className="relative z-10 -mt-10 space-y-3 px-3 sm:px-6">
          <div className="grid grid-cols-2 overflow-hidden rounded-[18px] border border-white bg-white shadow-[0_12px_30px_rgba(15,28,77,0.10)]">
            <StatBox
              icon={<Ticket size={22} />}
              label="Total Tickets"
              tone="red"
              value={
                myEntriesLoading ? (
                  <Loader2 size={22} className="animate-spin text-[#ed1d43]" />
                ) : (
                  totalTickets
                )
              }
            />

            <StatBox
              icon={<Trophy size={22} />}
              label="Total Wins"
              tone="navy"
              value={0}
              bordered
            />
          </div>

          {/* WALLET CARD */}
          <div className="flex items-center justify-between gap-3 rounded-[18px] bg-gradient-to-br from-[#0f1c4d] via-[#1b2a5c] to-[#2c3a72] p-3.5 shadow-[0_12px_30px_rgba(15,28,77,0.25)] sm:p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 sm:h-14 sm:w-14">
                <Wallet className="h-6 w-6 text-[#ffd84a] sm:h-7 sm:w-7" />
              </div>

              <div className="min-w-0">
                <p className="text-[12px] text-white/70 sm:text-[14px]">
                  Wallet Balance
                </p>

                <p className="truncate text-[22px] font-black leading-tight text-[#ffd84a] sm:text-[27px]">
                  ₹{formattedWalletBalance}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/user/withdraw")}
              className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-b from-red-500 to-red-700 px-3.5 text-[13px] font-extrabold text-white shadow-[0_6px_18px_rgba(239,68,68,0.45)] transition active:scale-95 sm:h-12 sm:px-5 sm:text-[15px]"
            >
              <HandCoins size={19} strokeWidth={2.4} />
              Withdraw
            </button>
          </div>
        </section>

        {/* ================= MENU ================= */}
        <section className="mt-3 flex flex-col gap-2.5 px-3 sm:px-6">
          <ProfileMenu
            icon={<BadgeCheck />}
            tone="red"
            title="KYC Verification"
            description="Verify your identity to withdraw winnings"
            onClick={() => navigate("/kyc")}
          />

          {/* ✅ NEW — Verify Ticket */}
          <ProfileMenu
            icon={<ShieldCheck />}
            tone="navy"
            title="Verify Ticket"
            description="Check if your ticket number is a winner"
            onClick={() => navigate("/verify")}
          />

          {/* ✅ NEW — Leaderboard */}
          <ProfileMenu
            icon={<BarChart3 />}
            tone="orange"
            title="Leaderboard"
            description="Top winners & latest draw results"
            onClick={() => navigate("/leaderboard")}
          />

          <ProfileMenu
            icon={<Wallet />}
            tone="navy"
            title="My Deposits"
            description={
              depositLoading
                ? "Loading deposits..."
                : `View all ${totalDeposits} deposits`
            }
            onClick={handleOpenDeposits}
          />

          <ProfileMenu
            icon={<HandCoins />}
            tone="orange"
            title="Withdrawal History"
            description={
              myWithdrawalsLoading
                ? "Loading withdrawal history..."
                : `View all ${totalWithdrawals} withdrawals`
            }
            onClick={() => navigate("/withdraw-history")}
          />

          <ProfileMenu
            icon={<Trophy />}
            tone="green"
            title="Results"
            description="See results of all draws"
            onClick={() => navigate("/results")}
          />

          <ProfileMenu
            icon={<Headphones />}
            tone="purple"
            title="Support"
            description="Contact us for any issue"
            onClick={handleWhatsAppSupport}
          />

          {/* LOGOUT */}
          <button
            type="button"
            disabled={logoutLoading}
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-[16px] border border-red-200 bg-white px-3.5 py-3 text-left shadow-md transition active:scale-[0.99] disabled:opacity-60 sm:gap-4 sm:px-5 sm:py-3.5"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-red-500 to-red-700 text-white sm:h-14 sm:w-14">
              {logoutLoading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <LogOut size={24} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-extrabold text-[#ed1d43] sm:text-[19px]">
                {logoutLoading ? "Logging out..." : "Logout"}
              </p>

              <p className="mt-0.5 truncate text-[12px] text-[#6b2737] sm:text-[13px]">
                Sign out of your account
              </p>
            </div>

            {!logoutLoading && (
              <ChevronRight size={24} className="shrink-0 text-[#ed1d43]" />
            )}
          </button>
        </section>

        {/* ================= FOOTER ================= */}
        <div className="mt-6 flex flex-col items-center px-6">
          <div className="flex w-full items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#1b2a5c]/30" />
            <ShieldCheck size={22} className="text-[#1b2a5c]" />
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#1b2a5c]/30" />
          </div>

          <p className="mt-2 text-[14px] font-medium text-[#1b2a5c]">
            Play with trust
          </p>
        </div>
      </div>

      {/* ================= EDIT PROFILE MODAL ================= */}
      {showEditModal && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 px-3 backdrop-blur-sm sm:items-center sm:px-4">
          <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[24px] bg-white p-5 shadow-[0_-10px_50px_rgba(15,28,77,0.25)] sm:rounded-[24px]">
            <button
              type="button"
              onClick={handleCloseEditProfile}
              disabled={updateProfileLoading}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-[#d6dfec] bg-white text-[#1b2a5c] transition active:scale-90 disabled:opacity-40"
            >
              <X size={19} />
            </button>

            <div className="mb-5 pr-12">
              <p className="text-[13px] text-[#6b7280]">Profile</p>

              <h2 className="mt-0.5 text-[22px] font-extrabold text-[#1b2a5c]">
                Edit <span className="text-[#ed1d43]">Profile</span>
              </h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#26354b]">
                  Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                  disabled={updateProfileLoading}
                  className={modalInput}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#26354b]">
                  Mobile Number
                </label>

                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setFormData((prev) => ({ ...prev, mobile: value }));
                  }}
                  placeholder="Mobile number"
                  disabled={updateProfileLoading}
                  inputMode="numeric"
                  className={modalInput}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#26354b]">
                  New Password
                  <span className="ml-2 font-normal text-[#8a97ab]">
                    (optional)
                  </span>
                </label>

                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="New password"
                  disabled={updateProfileLoading}
                  className={modalInput}
                />

                <p className="mt-1.5 text-[11px] text-[#8a97ab]">
                  Leave blank if you don't want to change your password.
                </p>
              </div>

              {updateProfileError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
                  <p className="text-[13px] font-medium text-red-600">
                    {updateProfileError}
                  </p>
                </div>
              )}

              <div className="mt-1 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseEditProfile}
                  disabled={updateProfileLoading}
                  className="h-[50px] flex-1 rounded-xl border border-[#d6dfec] bg-[#f6f9fe] font-bold text-[#1b2a5c] transition active:scale-[0.98] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updateProfileLoading}
                  className="flex h-[50px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-red-500 to-red-700 font-extrabold text-white shadow-[0_6px_18px_rgba(239,68,68,0.45)] transition active:scale-[0.98] disabled:opacity-60"
                >
                  {updateProfileLoading ? (
                    <>
                      <Loader2 size={19} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ==========================================================
   TONES
========================================================== */

const TONES = {
  red: "bg-[#ed1d43]",
  navy: "bg-[#1b2a5c]",
  orange: "bg-[#f08a25]",
  green: "bg-[#20a66a]",
  purple: "bg-[#8c4bd6]",
};

/* ==========================================================
   STAT BOX
========================================================== */

const StatBox = ({ icon, label, value, tone = "red", bordered = false }) => (
  <div
    className={`flex items-center gap-3 px-3.5 py-3.5 sm:px-5 ${
      bordered ? "border-l border-[#e2e5f0]" : ""
    }`}
  >
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white sm:h-12 sm:w-12 ${TONES[tone]}`}
    >
      {icon}
    </div>

    <div className="min-w-0">
      <p className="text-[12px] text-[#5a6082] sm:text-[14px]">{label}</p>

      <div className="mt-0.5 flex min-h-[28px] items-center text-[24px] font-black leading-none text-[#1b2a5c] sm:text-[28px]">
        {value}
      </div>
    </div>
  </div>
);

/* ==========================================================
   PROFILE MENU
========================================================== */

const ProfileMenu = ({ icon, title, description, onClick, tone = "red" }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center gap-3 rounded-[16px] border border-white bg-white px-3.5 py-3 text-left shadow-[0_4px_14px_rgba(15,28,77,0.06)] transition active:scale-[0.99] sm:gap-4 sm:px-5 sm:py-3.5"
  >
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white sm:h-14 sm:w-14 ${TONES[tone]}`}
    >
      <span className="inline-flex [&>svg]:h-6 [&>svg]:w-6">{icon}</span>
    </div>

    <div className="min-w-0 flex-1">
      <p className="text-[16px] font-extrabold text-[#1b2a5c] sm:text-[19px]">
        {title}
      </p>

      <p className="mt-0.5 truncate text-[12px] text-[#5a6082] sm:text-[13px]">
        {description}
      </p>
    </div>

    <ChevronRight size={24} className="shrink-0 text-[#1b2a5c]" />
  </button>
);

export default ProfilePage;