import {
  BadgeCheck,
  BarChart3,
  Camera,
  Check,
  ChevronRight,
  Clock,
  Edit3,
  Gift,
  HandCoins,
  Headphones,
  History,
  Loader2,
  Lock,
  LogOut,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Ticket,
  Trophy,
  Upload,
  User,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  clearUpdateProfileState,
  logout,
  updateProfile,
} from "../reducer/slice/authSlice";

import {
  getMyLotteryEntries,
  selectMyLotteryEntriesLoading,
  selectMyLotteryTotalEntries,
} from "../reducer/slice/createLotteryConfigSlice";

import { getMyDeposits } from "../reducer/slice/depositSlice";
import { getMyKyc, selectKycDocuments } from "../reducer/slice/kycReducer";
import { fetchMyWithdrawals } from "../reducer/slice/withdrawalSlice";

// =====================================================
// IMPORT ASSET AVATARS (Suggested profile pictures)
// =====================================================
import avatar1 from "../assets/avatar1.png";
import avatar2 from "../assets/avatar2.png";
import five from "../assets/five.png";
import four from "../assets/four.png";
import one from "../assets/one.png";
import six from "../assets/six.png";
import three from "../assets/three.png";
import two from "../assets/two.png";

const PRESET_AVATARS = [
  { id: "avatar1", src: avatar1, label: "Golden Mask" },
  { id: "avatar2", src: avatar2, label: "Cyber Player" },
  { id: "one", src: one, label: "Ace Gamer" },
  { id: "two", src: two, label: "Lucky Knight" },
  { id: "three", src: three, label: "Fortune Fox" },
  { id: "four", src: four, label: "Royal Joker" },
  { id: "five", src: five, label: "Gold Striker" },
  { id: "six", src: six, label: "Shadow King" },
];

const WHATSAPP_NUMBER = "919876543210";
const BOTTOM_NAV_HEIGHT = 68;
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1605196560547-b2f7281b7355?auto=format&fit=crop&w=1400&q=80";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

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
    (state) => state.withdrawal || {},
  );

  const kycDocuments = useSelector(selectKycDocuments);

  // Edit Profile Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    password: "",
  });

  // Selected avatar state (file object or preset src)
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState(null);

  // Initial Fetches
  useEffect(() => {
    if (!user) return;
    dispatch(getMyLotteryEntries());
    dispatch(getMyDeposits({ page: 1, limit: 10, sort: "desc" }));
    dispatch(fetchMyWithdrawals());
    dispatch(getMyKyc());
  }, [dispatch, user]);

  // Derive KYC status
  const isKycApproved = useMemo(() => {
    if (user?.isKycVerified === true) return true;
    if (Array.isArray(kycDocuments) && kycDocuments.length > 0) {
      return kycDocuments.some(
        (doc) => String(doc?.status || "").toLowerCase() === "approved",
      );
    }
    return false;
  }, [user, kycDocuments]);

  // Resolve current active avatar
  const currentAvatarSrc = useMemo(() => {
    if (!user?.profileImage) return null;
    const found = PRESET_AVATARS.find(
      (p) => p.id === user.profileImage || p.src === user.profileImage,
    );
    if (found) return found.src;
    return user.profileImage;
  }, [user]);

  // Open Edit Profile Modal
  const handleOpenEditProfile = () => {
    dispatch(clearUpdateProfileState());
    setFormData({
      name: user?.name || "",
      mobile: user?.mobile || "",
      password: "",
    });
    setSelectedFile(null);
    setSelectedPresetId(null);
    setPreviewAvatar(currentAvatarSrc);
    setShowEditModal(true);
  };

  const handleCloseEditProfile = () => {
    if (updateProfileLoading) return;
    setShowEditModal(false);
    setSelectedFile(null);
    setSelectedPresetId(null);
    setPreviewAvatar(null);
    dispatch(clearUpdateProfileState());
  };

  // Custom file upload from device
  const handleCustomFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    setSelectedPresetId(null);
    setPreviewAvatar(URL.createObjectURL(file));
  };

  // Preset avatar selection
  const handleSelectPreset = async (preset) => {
    setSelectedPresetId(preset.id);
    setPreviewAvatar(preset.src);

    try {
      const res = await fetch(preset.src);
      const blob = await res.blob();
      const file = new File([blob], `${preset.id}.png`, { type: "image/png" });
      setSelectedFile(file);
    } catch (err) {
      console.warn(
        "Could not convert preset to blob, will send preset id directly",
        err,
      );
      setSelectedFile(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    const name = formData.name.trim();
    const mobile = formData.mobile.trim();
    const password = formData.password;

    if (!name || !mobile) return;

    const data = new FormData();
    data.append("name", name);
    data.append("mobile", mobile);

    if (password && password.trim()) {
      data.append("password", password.trim());
    }

    if (selectedFile) {
      data.append("profileImage", selectedFile);
    } else if (selectedPresetId) {
      data.append("profileImage", selectedPresetId);
    }

    const result = await dispatch(updateProfile(data));

    if (updateProfile.fulfilled.match(result)) {
      setShowEditModal(false);
      setSelectedFile(null);
      setSelectedPresetId(null);
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
    const message = encodeURIComponent(
      "Hello, I need assistance with my lottery account.",
    );
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const walletBalance = Number(user?.wallet || 0);
  const formattedWalletBalance = walletBalance.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return (
    <div className="min-h-screen w-full bg-[#EEF3FA] text-[#131E3D] selection:bg-[#FFD84A] selection:text-black">
      <div
        className="relative mx-auto w-full max-w-[500px] min-h-screen flex flex-col justify-between"
        style={{ paddingBottom: BOTTOM_NAV_HEIGHT + 24 }}
      >
        {/* =====================================================
            TOP HERO BANNER (ELEGANT CURVED HEADER WITH HERO IMAGE)
        ===================================================== */}
        <div
          className="relative pt-6 px-4 pb-12 overflow-hidden rounded-b-[36px] bg-cover bg-center shadow-[0_14px_35px_rgba(20,8,24,0.35)] text-white"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        >
          {/* Tint Overlay for contrast and readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#25050e]/90 via-[#3b0816]/75 to-[#150409]/90 pointer-events-none" />

          {/* Ambient Lighting */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#ED1D43]/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 top-16 h-56 w-56 rounded-full bg-[#FFD84A]/15 blur-3xl" />

          {/* Top Bar Actions */}
          <div className="relative flex items-center justify-between mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-black uppercase tracking-widest text-[#FFD84A]">
              <Sparkles size={12} className="text-[#FFD84A]" />
              <span>VIP Player</span>
            </span>

            <button
              type="button"
              onClick={handleOpenEditProfile}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-xs font-bold text-white transition active:scale-95"
            >
              <Edit3 size={13} className="text-[#FFD84A]" />
              <span>Edit Profile</span>
            </button>
          </div>

          {/* User Info Bar */}
          <div className="relative flex items-center gap-4">
            {/* Avatar with Golden Ring */}
            <div className="relative group shrink-0">
              <div className="relative h-[84px] w-[84px] rounded-full p-[2.5px] bg-gradient-to-tr from-[#FFD84A] via-[#ED1D43] to-[#FF8A00] shadow-[0_0_25px_rgba(255,216,74,0.35)]">
                <div className="h-full w-full rounded-full bg-[#1A0A19] overflow-hidden flex items-center justify-center">
                  {currentAvatarSrc ? (
                    <img
                      src={currentAvatarSrc}
                      alt={user?.name || "Profile"}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <UserRound
                      size={42}
                      className="text-[#FFD84A]"
                      strokeWidth={1.5}
                    />
                  )}
                </div>
              </div>

              {/* Camera icon button */}
              <button
                type="button"
                onClick={handleOpenEditProfile}
                title="Change Photo"
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-[#ED1D43] text-white flex items-center justify-center border-2 border-[#1A0A19] shadow-md transition hover:scale-110 active:scale-95"
              >
                <Camera size={13} />
              </button>
            </div>

            {/* User Details */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h1 className="truncate text-2xl font-black tracking-tight text-white">
                  {user?.name || "Player"}
                </h1>
                {isKycApproved && (
                  <BadgeCheck
                    size={18}
                    className="text-[#10B981] fill-[#10B981]/20 shrink-0"
                  />
                )}
              </div>

              <p className="text-xs text-white/75 font-mono mt-0.5">
                +91 {user?.mobile || "----------"}
              </p>

              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                    isKycApproved
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  }`}
                >
                  {isKycApproved ? (
                    <>
                      <ShieldCheck size={11} /> Verified
                    </>
                  ) : (
                    <>
                      <Clock size={11} /> KYC Pending
                    </>
                  )}
                </span>

                <span className="text-[10px] text-white/50 font-mono">
                  ID: {user?.uuid?.slice(0, 8) || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            FLOATING WALLET CARD (HIGH-CONTRAST LUXURY CARD)
        ===================================================== */}
        <div className="relative -mt-7 px-3.5 z-10">
          <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-r from-[#0E1A45] via-[#1B2B65] to-[#142050] p-4 sm:p-5 text-white shadow-[0_14px_35px_rgba(15,28,77,0.22)] border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#FFD84A]/25 to-white/5 border border-[#FFD84A]/30 flex items-center justify-center shrink-0 shadow-inner">
                  <Wallet size={22} className="text-[#FFD84A]" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                    Wallet Balance
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-[#FFD84A] tracking-tight">
                    ₹{formattedWalletBalance}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/user/withdraw")}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#ED1D43] to-[#C70F31] hover:brightness-110 text-xs font-black text-white shadow-[0_6px_20px_rgba(237,29,67,0.4)] transition active:scale-95 flex items-center gap-1"
                >
                  <HandCoins size={14} />
                  <span>Withdraw</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            QUICK STATS (SMOOTH WHITE CARDS, NOT BOXY)
        ===================================================== */}
        <div className="grid grid-cols-2 gap-2.5 px-3.5 mt-3">
          {/* Total Tickets */}
          <div
            onClick={() => navigate("/results")}
            className="cursor-pointer group rounded-[22px] bg-white p-4 border border-[#E2E8F0] shadow-sm transition duration-200 hover:shadow-md hover:border-[#CBD5E1] active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-xl bg-red-50 text-[#ED1D43] flex items-center justify-center">
                <Ticket size={18} />
              </div>
              <span className="text-[11px] font-bold text-[#8A97AB] group-hover:text-[#ED1D43] transition">
                View →
              </span>
            </div>
            <div className="mt-2.5">
              <p className="text-[11px] font-semibold text-[#5A6788]">
                Tickets Participated
              </p>
              <p className="text-xl font-black text-[#131E3D] mt-0.5">
                {myEntriesLoading ? (
                  <Loader2 size={18} className="animate-spin text-[#ED1D43]" />
                ) : (
                  totalTickets
                )}
              </p>
            </div>
          </div>

          {/* KYC Status Card */}
          <div
            onClick={() => navigate("/kyc")}
            className="cursor-pointer group rounded-[22px] bg-white p-4 border border-[#E2E8F0] shadow-sm transition duration-200 hover:shadow-md hover:border-[#CBD5E1] active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div
                className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                  isKycApproved
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                {isKycApproved ? (
                  <ShieldCheck size={18} />
                ) : (
                  <ShieldAlert size={18} />
                )}
              </div>
              <span className="text-[11px] font-bold text-[#8A97AB] group-hover:text-[#131E3D] transition">
                Manage →
              </span>
            </div>
            <div className="mt-2.5">
              <p className="text-[11px] font-semibold text-[#5A6788]">
                Identity KYC
              </p>
              <p
                className={`text-xl font-black mt-0.5 ${
                  isKycApproved ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {isKycApproved ? "Verified" : "Verify Now"}
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            MODERN GROUPED MENU IN CLEAN WHITE THEME
        ===================================================== */}
        <div className="mt-4 px-3.5 space-y-3.5">
          {/* REFER & EARN PROMO CARD */}
          <div
            onClick={() => navigate("/referral")}
            className="cursor-pointer relative overflow-hidden rounded-[24px] border border-[#FFD84A]/30 bg-gradient-to-r from-[#2A0815] via-[#3B0E1E] to-[#1F050F] p-4 text-white shadow-md transition hover:shadow-lg active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#FFD84A]/30 bg-[#FFD84A]/10 text-[#FFD84A]">
                  <Gift size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-black text-white">
                      Refer & Earn Program
                    </p>
                    <span className="rounded-full bg-[#ED1D43] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                      Cashback
                    </span>
                  </div>
                  <p className="text-[11px] text-white/70">
                    Invite friends & earn instant commission rewards
                  </p>
                </div>
              </div>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                <ChevronRight size={16} />
              </span>
            </div>
          </div>

          {/* SECTION 1: TRANSACTIONS & RECORDS */}
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#8A97AB] px-1 mb-2">
              Transactions & History
            </p>

            <div className="rounded-[24px] bg-white border border-[#E2E8F0] shadow-sm overflow-hidden divide-y divide-[#F1F5F9]">
              <MenuRowLight
                icon={<Gift size={19} className="text-[#ED1D43]" />}
                iconBg="bg-rose-50"
                title="Refer & Earn"
                subtitle="Your invite code, referrals & commission stats"
                onClick={() => navigate("/referral")}
                badge="Earn Cash"
              />

              <MenuRowLight
                icon={<HandCoins size={19} className="text-[#FF8A00]" />}
                iconBg="bg-amber-50"
                title="Withdrawal History"
                subtitle="Track payout requests and status"
                onClick={() => navigate("/withdraw-history")}
                badge={
                  myWithdrawals?.length
                    ? `${myWithdrawals.length} Requests`
                    : null
                }
              />

              <MenuRowLight
                icon={<History size={19} className="text-[#0284C7]" />}
                iconBg="bg-sky-50"
                title="Deposit History"
                subtitle="All deposit slips and bank transfers"
                onClick={() => navigate("/deposit")}
              />

              <MenuRowLight
                icon={<ShieldCheck size={19} className="text-[#9333EA]" />}
                iconBg="bg-purple-50"
                title="Verify Ticket Number"
                subtitle="Check winning confirmation on-chain"
                onClick={() => navigate("/verify")}
              />
            </div>
          </div>

          {/* SECTION 2: GAMING & ASSISTANCE */}
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#8A97AB] px-1 mb-2">
              Activity & Support
            </p>

            <div className="rounded-[24px] bg-white border border-[#E2E8F0] shadow-sm overflow-hidden divide-y divide-[#F1F5F9]">
              <MenuRowLight
                icon={<Trophy size={19} className="text-[#D97706]" />}
                iconBg="bg-amber-50"
                title="Draw Results"
                subtitle="Explore winners & jackpot draws"
                onClick={() => navigate("/results")}
              />

              <MenuRowLight
                icon={<BarChart3 size={19} className="text-[#EA580C]" />}
                iconBg="bg-orange-50"
                title="Leaderboard"
                subtitle="Top players and daily lucky winners"
                onClick={() => navigate("/leaderboard")}
              />

              <MenuRowLight
                icon={<Headphones size={19} className="text-[#10B981]" />}
                iconBg="bg-emerald-50"
                title="WhatsApp Support"
                subtitle="24/7 dedicated support representative"
                onClick={handleWhatsAppSupport}
                rightElement={
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                }
              />
            </div>
          </div>

          {/* LOGOUT BUTTON */}
          <div className="pt-1">
            <button
              type="button"
              disabled={logoutLoading}
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 rounded-[22px] bg-white hover:bg-red-50/50 border border-red-200 transition active:scale-[0.99] shadow-sm disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-100 text-[#ED1D43] flex items-center justify-center shrink-0">
                  {logoutLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <LogOut size={20} />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-extrabold text-[#ED1D43]">
                    {logoutLoading ? "Logging out..." : "Logout Account"}
                  </p>
                  <p className="text-[11px] text-[#8A97AB]">
                    Sign out of your active session
                  </p>
                </div>
              </div>

              <ChevronRight size={18} className="text-[#ED1D43]" />
            </button>
          </div>
        </div>

        {/* Trust Footer */}
        <div className="mt-8 mb-4 text-center">
          <p className="text-[11px] text-[#8A97AB] flex items-center justify-center gap-1.5 font-semibold">
            <ShieldCheck size={14} className="text-[#10B981]" />
            <span>Official Maxify Lottery Portal • Safe & Verified</span>
          </p>
        </div>
      </div>

      {/* =====================================================
          MODAL: EDIT PROFILE & AVATAR PICKER (CLEAN LIGHT THEME)
      ===================================================== */}
      {showEditModal && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-[32px] sm:rounded-[32px] bg-white text-[#131E3D] p-5 sm:p-6 shadow-2xl border border-[#E2E8F0] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] mb-4">
              <div>
                <h3 className="text-xl font-black tracking-tight text-[#131E3D]">
                  Edit Profile
                </h3>
                <p className="text-xs text-[#5A6788] mt-0.5">
                  Update photo, name or contact credentials
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseEditProfile}
                disabled={updateProfileLoading}
                className="h-8 w-8 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#5A6788] flex items-center justify-center transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {/* ==========================================
                  AVATAR SELECTION & UPLOAD SECTION
              ========================================== */}
              <div className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#ED1D43] mb-3 flex items-center gap-1.5">
                  <Sparkles size={14} /> Profile Picture
                </p>

                {/* Selected Preview & Custom Upload Trigger */}
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 rounded-full p-[2px] bg-gradient-to-tr from-[#FFD84A] via-[#ED1D43] to-[#FF8A00] shrink-0 shadow-md">
                    <div className="h-full w-full rounded-full bg-white overflow-hidden flex items-center justify-center">
                      {previewAvatar ? (
                        <img
                          src={previewAvatar}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserRound size={36} className="text-[#8A97AB]" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCustomFileChange}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-xs font-extrabold text-[#131E3D] transition flex items-center justify-center gap-2 active:scale-95 shadow-xs"
                    >
                      <Upload size={14} className="text-[#ED1D43]" />
                      <span>Upload Custom Photo</span>
                    </button>

                    <p className="text-[10px] text-[#8A97AB] text-center">
                      JPG, PNG, WEBP (Max 5MB)
                    </p>
                  </div>
                </div>

                {/* PRESET AVATARS SUGGESTION GRID */}
                <div className="mt-4 pt-3.5 border-t border-[#E2E8F0]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-bold text-[#5A6788]">
                      Or Choose a Suggested Avatar:
                    </p>
                    <span className="text-[10px] text-[#ED1D43] font-bold">
                      {PRESET_AVATARS.length} Available
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2.5">
                    {PRESET_AVATARS.map((preset) => {
                      const isSelected =
                        selectedPresetId === preset.id ||
                        previewAvatar === preset.src;

                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`relative group h-16 rounded-2xl p-1 border transition-all duration-200 overflow-hidden ${
                            isSelected
                              ? "border-[#ED1D43] ring-2 ring-[#ED1D43]/30 bg-red-50/50 scale-105"
                              : "border-[#E2E8F0] hover:border-[#CBD5E1] bg-white"
                          }`}
                        >
                          <img
                            src={preset.src}
                            alt={preset.label}
                            className="h-full w-full object-cover rounded-xl"
                          />
                          {isSelected && (
                            <div className="absolute top-1 right-1 h-4 w-4 rounded-full bg-[#ED1D43] text-white flex items-center justify-center shadow-md">
                              <Check size={10} strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ==========================================
                  INPUT FIELDS: NAME, MOBILE, PASSWORD
              ========================================== */}
              <div>
                <label className="block text-xs font-bold text-[#26354B] mb-1">
                  Full Name <span className="text-[#ED1D43]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A97AB]">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                    disabled={updateProfileLoading}
                    className="w-full h-11 pl-10 pr-3 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-sm text-[#131E3D] placeholder:text-[#8A97AB] outline-none transition focus:border-[#ED1D43] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#26354B] mb-1">
                  Mobile Number <span className="text-[#ED1D43]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A97AB]">
                    <Phone size={16} />
                  </div>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setFormData((p) => ({ ...p, mobile: value }));
                    }}
                    placeholder="10-digit mobile number"
                    disabled={updateProfileLoading}
                    className="w-full h-11 pl-10 pr-3 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-sm text-[#131E3D] placeholder:text-[#8A97AB] outline-none transition focus:border-[#ED1D43] focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#26354B] mb-1">
                  Change Password{" "}
                  <span className="text-[#8A97AB] font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A97AB]">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Leave blank to keep existing password"
                    disabled={updateProfileLoading}
                    className="w-full h-11 pl-10 pr-3 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-sm text-[#131E3D] placeholder:text-[#8A97AB] outline-none transition focus:border-[#ED1D43] focus:bg-white"
                  />
                </div>
              </div>

              {/* Error Message */}
              {updateProfileError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <ShieldAlert size={15} className="text-red-500 shrink-0" />
                  <span>{updateProfileError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseEditProfile}
                  disabled={updateProfileLoading}
                  className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs font-bold text-[#5A6788] hover:bg-[#F1F5F9] transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updateProfileLoading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ED1D43] to-[#C70F31] hover:brightness-110 text-xs font-black text-white shadow-md transition active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                  {updateProfileLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
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

// =====================================================
// LIGHT THEME MENU ROW (CLEAN, SMOOTH & ELEVATED)
// =====================================================
const MenuRowLight = ({
  icon,
  iconBg = "bg-slate-100",
  title,
  subtitle,
  onClick,
  badge,
  rightElement,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center justify-between p-3.5 hover:bg-[#F8FAFC] transition active:scale-[0.99] text-left"
  >
    <div className="flex items-center gap-3.5 min-w-0">
      <div
        className={`h-10 w-10 rounded-2xl ${iconBg} flex items-center justify-center shrink-0 shadow-xs border border-black/5`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-extrabold text-[#131E3D] truncate">
          {title}
        </p>
        <p className="text-[11px] text-[#5A6788] truncate mt-0.5">{subtitle}</p>
      </div>
    </div>

    <div className="flex items-center gap-2 shrink-0">
      {badge && (
        <span className="text-[10px] font-bold text-[#ED1D43] bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      {rightElement}
      <ChevronRight size={17} className="text-[#8A97AB]" />
    </div>
  </button>
);

export default ProfilePage;
