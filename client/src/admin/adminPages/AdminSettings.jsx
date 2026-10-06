import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Settings,
  Ticket,
  PartyPopper,
  Percent,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  IndianRupee,
  Clock,
  Save,
  Check,
  ShieldAlert,
  Sparkles,
  Share2,
  TrendingUp,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit3,
  Eye,
  Calendar,
  UploadCloud,
  Power,
  ExternalLink,
} from "lucide-react";

import {
  clearSettingsMessages,
  fetchAllSettings,
  selectDailyLotteryAmount,
  selectFestivalLotteryAmount,
  selectReferralPercentage,
  selectSettingsData,
  selectSettingsError,
  selectSettingsLoading,
  selectSettingsMessage,
  selectSettingsSuccess,
  selectSettingsUpdateLoading,
  updateAllSettings,
  updateDailyAmountSetting,
  updateFestivalAmountSetting,
  updateReferralPercentageSetting,
} from "../../reducer/slice/settingsSlice";

import {
  createResultImage,
  deleteResultImage,
  getAllResultImages,
  toggleResultImage,
  updateResultImage,
  clearResultImageMessages,
  clearResultImageErrors,
  selectAllResultImages,
  selectResultImagesLoading,
  selectResultImagesActionLoading,
  selectResultImagesSuccess,
  selectResultImagesError,
  selectResultImagesActionError,
  selectResultImagesMessage,
} from "../../reducer/slice/resultImageSlice";

/* =========================================================
   WINZOX THEME TOKENS
   bg: #FFFDF7, border: #F3E7C4, gold: #FFD83D -> #F7B500 -> #E39A00
   text: #1A1A1A, muted: #6B7280, brown: #9A5B00, danger: #D93025
========================================================= */

const AdminSettings = () => {
  const dispatch = useDispatch();

  // Active top tab: "general" | "results"
  const [activeTab, setActiveTab] = useState("general");

  // ---------------------------------------------------------
  // GENERAL SETTINGS STATE & SELECTORS
  // ---------------------------------------------------------
  const settingsState = useSelector(selectSettingsData);
  const dailyAmount = useSelector(selectDailyLotteryAmount);
  const festivalAmount = useSelector(selectFestivalLotteryAmount);
  const referralPercent = useSelector(selectReferralPercentage);

  const loading = useSelector(selectSettingsLoading);
  const updateLoading = useSelector(selectSettingsUpdateLoading);
  const success = useSelector(selectSettingsSuccess);
  const error = useSelector(selectSettingsError);
  const message = useSelector(selectSettingsMessage);

  // Form input states
  const [dailyInput, setDailyInput] = useState("");
  const [festivalInput, setFestivalInput] = useState("");
  const [referralInput, setReferralInput] = useState("");
  const [updatingField, setUpdatingField] = useState(null);

  // ---------------------------------------------------------
  // RESULT IMAGES STATE & SELECTORS
  // ---------------------------------------------------------
  const resultImagesList = useSelector(selectAllResultImages);
  const resultLoading = useSelector(selectResultImagesLoading);
  const resultActionLoading = useSelector(selectResultImagesActionLoading);
  const resultSuccess = useSelector(selectResultImagesSuccess);
  const resultError = useSelector(selectResultImagesError);
  const resultActionError = useSelector(selectResultImagesActionError);
  const resultMessage = useSelector(selectResultImagesMessage);

  // Filter & Search states for Result Images
  const [filterType, setFilterType] = useState("ALL"); // "ALL" | "DAILY" | "FESTIVAL"
  const [filterStatus, setFilterStatus] = useState("ALL"); // "ALL" | "ACTIVE" | "INACTIVE"
  const [searchQuery, setSearchQuery] = useState("");

  // Modal & Form states for Result Images
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null for create, object for edit
  const [formType, setFormType] = useState("DAILY"); // "DAILY" | "FESTIVAL"
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formFestival, setFormFestival] = useState("");
  const [formSortOrder, setFormSortOrder] = useState("0");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formFile, setFormFile] = useState(null);
  const [formFilePreview, setFormFilePreview] = useState(null);
  const [formValidationError, setFormValidationError] = useState("");

  // Full-image zoom preview modal
  const [zoomPreview, setZoomPreview] = useState(null);

  // Fetch settings on mount
  useEffect(() => {
    dispatch(fetchAllSettings());
  }, [dispatch]);

  // Fetch result images when results tab is active
  useEffect(() => {
    if (activeTab === "results") {
      dispatch(getAllResultImages());
    }
  }, [activeTab, dispatch]);

  // Sync general settings inputs
  useEffect(() => {
    if (dailyAmount !== undefined && dailyAmount !== null) {
      setDailyInput(String(dailyAmount));
    }
  }, [dailyAmount]);

  useEffect(() => {
    if (festivalAmount !== undefined && festivalAmount !== null) {
      setFestivalInput(String(festivalAmount));
    }
  }, [festivalAmount]);

  useEffect(() => {
    if (referralPercent !== undefined && referralPercent !== null) {
      setReferralInput(String(referralPercent));
    }
  }, [referralPercent]);

  // Auto-dismiss general settings messages
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        dispatch(clearSettingsMessages());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [success, error, dispatch]);

  // Auto-dismiss result image messages
  useEffect(() => {
    if (resultSuccess || resultError || resultActionError) {
      const timer = setTimeout(() => {
        dispatch(clearResultImageMessages());
        dispatch(clearResultImageErrors());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [resultSuccess, resultError, resultActionError, dispatch]);

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "Never";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Recently";
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateOnly = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Submit Daily Amount only
  const handleUpdateDaily = async (e) => {
    e?.preventDefault();
    const num = Number(dailyInput);
    if (isNaN(num) || num < 0) return;

    setUpdatingField("daily");
    await dispatch(updateDailyAmountSetting(num));
    setUpdatingField(null);
  };

  // Submit Festival Amount only
  const handleUpdateFestival = async (e) => {
    e?.preventDefault();
    const num = Number(festivalInput);
    if (isNaN(num) || num < 0) return;

    setUpdatingField("festival");
    await dispatch(updateFestivalAmountSetting(num));
    setUpdatingField(null);
  };

  // Submit Referral % only
  const handleUpdateReferral = async (e) => {
    e?.preventDefault();
    const num = Number(referralInput);
    if (isNaN(num) || num < 0 || num > 100) return;

    setUpdatingField("referral");
    await dispatch(updateReferralPercentageSetting(num));
    setUpdatingField(null);
  };

  // Submit All Settings together
  const handleUpdateAll = async () => {
    const dailyNum = Number(dailyInput);
    const festivalNum = Number(festivalInput);
    const referralNum = Number(referralInput);

    if (isNaN(dailyNum) || dailyNum < 0) return;
    if (isNaN(festivalNum) || festivalNum < 0) return;
    if (isNaN(referralNum) || referralNum < 0 || referralNum > 100) return;

    setUpdatingField("all");
    await dispatch(
      updateAllSettings({
        dailyLotteryAmount: dailyNum,
        festivalLotteryAmount: festivalNum,
        referralPercentage: referralNum,
      })
    );
    setUpdatingField(null);
  };

  const hasChanges =
    Number(dailyInput) !== Number(dailyAmount) ||
    Number(festivalInput) !== Number(festivalAmount) ||
    Number(referralInput) !== Number(referralPercent);

  // ---------------------------------------------------------
  // RESULT IMAGES HANDLERS
  // ---------------------------------------------------------

  const openCreateModal = () => {
    setEditingItem(null);
    setFormType("DAILY");
    setFormTitle("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormFestival("");
    setFormSortOrder("0");
    setFormIsActive(true);
    setFormFile(null);
    setFormFilePreview(null);
    setFormValidationError("");
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormType(item.type || "DAILY");
    setFormTitle(item.title || "");
    setFormDate(item.resultDate ? item.resultDate.split("T")[0] : new Date().toISOString().split("T")[0]);
    setFormFestival(item.festivalName || "");
    setFormSortOrder(String(item.sortOrder || 0));
    setFormIsActive(item.isActive !== false);
    setFormFile(null);
    setFormFilePreview(item.imageUrl || item.displayUrl || null);
    setFormValidationError("");
    setModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormFile(file);
      setFormFilePreview(URL.createObjectURL(file));
      setFormValidationError("");
    }
  };

  const handleSubmitResultImage = async (e) => {
    e.preventDefault();
    setFormValidationError("");

    if (!editingItem && !formFile) {
      setFormValidationError("Please select a result image file to upload.");
      return;
    }

    if (formType === "DAILY" && !formDate) {
      setFormValidationError("Please choose a result date for Daily result.");
      return;
    }

    if (formType === "FESTIVAL" && !formFestival.trim()) {
      setFormValidationError("Please enter the festival name.");
      return;
    }

    const formData = new FormData();
    formData.append("type", formType);
    formData.append("title", formTitle.trim());
    formData.append("sortOrder", Number(formSortOrder) || 0);
    formData.append("isActive", formIsActive);

    if (formType === "DAILY") {
      formData.append("resultDate", formDate);
    } else {
      formData.append("festivalName", formFestival.trim());
    }

    if (formFile) {
      formData.append("image", formFile);
    }

    try {
      if (editingItem) {
        await dispatch(updateResultImage({ id: editingItem._id, formData })).unwrap();
      } else {
        await dispatch(createResultImage(formData)).unwrap();
      }
      setModalOpen(false);
      dispatch(getAllResultImages());
    } catch (err) {
      // error handled in redux slice
    }
  };

  const handleDeleteResultImage = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this result image?")) {
      try {
        await dispatch(deleteResultImage(id)).unwrap();
        dispatch(getAllResultImages());
      } catch (err) {
        console.error("Delete error:", err);
      }
    }
  };

  const handleToggleResultImage = async (id) => {
    try {
      await dispatch(toggleResultImage(id)).unwrap();
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  // Filtered result images list
  const filteredResultImages = useMemo(() => {
    return resultImagesList.filter((item) => {
      if (filterType !== "ALL" && item.type !== filterType) return false;
      if (filterStatus === "ACTIVE" && !item.isActive) return false;
      if (filterStatus === "INACTIVE" && item.isActive) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const titleMatch = (item.title || "").toLowerCase().includes(query);
        const festivalMatch = (item.festivalName || "").toLowerCase().includes(query);
        const dateMatch = (item.resultDate || "").includes(query);
        if (!titleMatch && !festivalMatch && !dateMatch) return false;
      }
      return true;
    });
  }, [resultImagesList, filterType, filterStatus, searchQuery]);

  // Statistics for result images
  const resultStats = useMemo(() => {
    const total = resultImagesList.length;
    const daily = resultImagesList.filter((i) => i.type === "DAILY").length;
    const festival = resultImagesList.filter((i) => i.type === "FESTIVAL").length;
    const active = resultImagesList.filter((i) => i.isActive).length;
    return { total, daily, festival, active };
  }, [resultImagesList]);

  return (
    <div className="space-y-6">
      {/* =====================================================
          PAGE HEADER & TABS
      ====================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFD83D] to-[#E39A00] text-[#1A1204] shadow-[0_4px_12px_rgba(247,181,0,0.4)]">
            <Settings size={24} className="stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#1A1A1A]">
              System Settings
            </h1>
            <p className="text-xs font-medium text-[#6B7280]">
              Configure lottery ticket prices, referral commission rates, and manage official result charts
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          {activeTab === "general" && (
            <button
              onClick={() => dispatch(fetchAllSettings())}
              disabled={loading || updateLoading}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#F3E7C4] bg-white text-[#9A5B00] shadow-sm transition hover:bg-[#FFEFA8]/50 disabled:opacity-50"
              title="Refresh Settings"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : "transition active:rotate-180"}
              />
            </button>
          )}

          {activeTab === "results" && (
            <button
              onClick={() => dispatch(getAllResultImages())}
              disabled={resultLoading || resultActionLoading}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#F3E7C4] bg-white text-[#9A5B00] shadow-sm transition hover:bg-[#FFEFA8]/50 disabled:opacity-50"
              title="Refresh Result Images"
            >
              <RefreshCw
                size={17}
                className={resultLoading ? "animate-spin" : "transition active:rotate-180"}
              />
            </button>
          )}
        </div>
      </div>

      {/* =====================================================
          TAB NAVIGATION
      ====================================================== */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#F3E7C4] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition ${
            activeTab === "general"
              ? "bg-gradient-to-r from-[#FFD83D] to-[#F7B500] text-[#1A1204] shadow-md shadow-[#F7B500]/20"
              : "border border-[#F3E7C4] bg-white text-[#6B7280] hover:bg-[#FFEFA8]/40"
          }`}
        >
          <Settings size={16} />
          <span>Ticket Prices & Referral</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("results")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition ${
            activeTab === "results"
              ? "bg-gradient-to-r from-[#FFD83D] to-[#F7B500] text-[#1A1204] shadow-md shadow-[#F7B500]/20"
              : "border border-[#F3E7C4] bg-white text-[#6B7280] hover:bg-[#FFEFA8]/40"
          }`}
        >
          <ImageIcon size={16} />
          <span>Result Images (Daily & Festival)</span>
          {resultStats.total > 0 && (
            <span className="rounded-full bg-[#1A1204] px-2 py-0.5 text-[10px] text-white font-bold">
              {resultStats.total}
            </span>
          )}
        </button>
      </div>

      {/* =====================================================
          TAB 1: GENERAL SETTINGS CONTENT
      ====================================================== */}
      {activeTab === "general" && (
        <div className="space-y-6">
          {/* Notifications */}
          {success && (
            <div className="flex items-center justify-between rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-800 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{message || "Settings updated successfully!"}</span>
              </div>
              <button
                onClick={() => dispatch(clearSettingsMessages())}
                className="text-emerald-600 hover:text-emerald-800"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-between rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-rose-800 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold">
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => dispatch(clearSettingsMessages())}
                className="text-rose-600 hover:text-rose-800"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Settings Cards Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* 1. DAILY LOTTERY CARD */}
            <div className="flex flex-col justify-between rounded-2xl border border-[#F3E7C4] bg-white p-5 shadow-[0_4px_16px_-6px_rgba(247,181,0,0.15)] transition hover:shadow-md">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ffd43b] to-[#f59f00] text-[#1A1204] shadow-sm">
                    <Ticket size={20} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-[#1A1A1A]">
                      Daily Ticket Price
                    </h2>
                    <p className="text-xs text-[#6B7280]">Per single number entry</p>
                  </div>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-[#6B7280]">
                  This price applies as the base ticket amount for all daily routine lottery draws.
                </p>

                <form onSubmit={handleUpdateDaily} className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1A1A1A]">
                      Ticket Price (INR)
                    </label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-[#9A5B00]">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="e.g. 50"
                        value={dailyInput}
                        onChange={(e) => setDailyInput(e.target.value)}
                        required
                        className="w-full rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] py-2.5 pl-8 pr-3.5 text-sm font-black text-[#1A1A1A] outline-none transition focus:border-[#F2B705] focus:ring-2 focus:ring-[#FFEFA8]"
                      />
                    </div>
                  </div>

                  {/* Presets */}
                  <div>
                    <span className="text-[11px] font-bold text-[#9A5B00]">Quick Presets:</span>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {[10, 20, 30, 50, 100].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setDailyInput(String(preset))}
                          className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                            Number(dailyInput) === preset
                              ? "border-[#F2B705] bg-[#FFEFA8] text-[#9A5B00]"
                              : "border-[#F3E7C4] bg-[#FFFDF7] text-[#6B7280] hover:bg-[#FFEFA8]/50"
                          }`}
                        >
                          ₹{preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      updateLoading ||
                      dailyInput === "" ||
                      Number(dailyInput) === Number(dailyAmount)
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ffd43b] via-[#fcc419] to-[#fab005] py-2.5 text-xs font-black text-[#1A1204] shadow-[0_4px_12px_rgba(250,176,5,0.4)] transition active:scale-[0.98] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updatingField === "daily" ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Updating Daily...
                      </>
                    ) : (
                      <>
                        <Check size={14} className="stroke-[3]" />
                        Update Daily Price
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="mt-5 border-t border-[#F3E7C4] pt-3 text-[11px] text-[#6B7280]">
                Last updated: <strong>{formatDate(settingsState?.updatedAt)}</strong>
              </div>
            </div>

            {/* 2. FESTIVAL LOTTERY CARD */}
            <div className="flex flex-col justify-between rounded-2xl border border-[#F3E7C4] bg-white p-5 shadow-[0_4px_16px_-6px_rgba(247,181,0,0.15)] transition hover:shadow-md">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#f06595] to-[#cc5de8] text-white shadow-sm">
                    <PartyPopper size={20} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-[#1A1A1A]">
                      Festival Bumper Price
                    </h2>
                    <p className="text-xs text-[#6B7280]">Per festival bumper ticket</p>
                  </div>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-[#6B7280]">
                  Default ticket price for special festival bumper draws with elevated jackpot prize pools.
                </p>

                <form onSubmit={handleUpdateFestival} className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1A1A1A]">
                      Ticket Price (INR)
                    </label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-[#cc5de8]">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="e.g. 100"
                        value={festivalInput}
                        onChange={(e) => setFestivalInput(e.target.value)}
                        required
                        className="w-full rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] py-2.5 pl-8 pr-3.5 text-sm font-black text-[#1A1A1A] outline-none transition focus:border-[#F2B705] focus:ring-2 focus:ring-[#FFEFA8]"
                      />
                    </div>
                  </div>

                  {/* Presets */}
                  <div>
                    <span className="text-[11px] font-bold text-[#cc5de8]">Quick Presets:</span>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {[50, 100, 200, 500, 1000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setFestivalInput(String(preset))}
                          className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                            Number(festivalInput) === preset
                              ? "border-[#cc5de8] bg-[#f8f0fc] text-[#9c36b5]"
                              : "border-[#F3E7C4] bg-[#FFFDF7] text-[#6B7280] hover:bg-gray-50"
                          }`}
                        >
                          ₹{preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      updateLoading ||
                      festivalInput === "" ||
                      Number(festivalInput) === Number(festivalAmount)
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e64980] via-[#d6336c] to-[#c2255c] py-2.5 text-xs font-black text-white shadow-[0_4px_12px_rgba(230,73,128,0.4)] transition active:scale-[0.98] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updatingField === "festival" ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Updating Festival...
                      </>
                    ) : (
                      <>
                        <Check size={14} className="stroke-[3]" />
                        Update Festival Price
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="mt-5 border-t border-[#F3E7C4] pt-3 text-[11px] text-[#6B7280]">
                Last updated: <strong>{formatDate(settingsState?.updatedAt)}</strong>
              </div>
            </div>

            {/* 3. REFERRAL COMMISSION CARD */}
            <div className="flex flex-col justify-between rounded-2xl border border-[#F3E7C4] bg-white p-5 shadow-[0_4px_16px_-6px_rgba(247,181,0,0.15)] transition hover:shadow-md">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#20c997] to-[#099268] text-white shadow-sm">
                    <Percent size={20} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-[#1A1A1A]">
                      Referral Commission Rate
                    </h2>
                    <p className="text-xs text-[#6B7280]">Percentage credited to referrers</p>
                  </div>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-[#6B7280]">
                  Users earn this percentage when a friend registers using their referral link and makes deposits.
                </p>

                <form onSubmit={handleUpdateReferral} className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1A1A1A]">
                      Commission Percentage (%)
                    </label>
                    <div className="relative mt-1.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        placeholder="e.g. 5"
                        value={referralInput}
                        onChange={(e) => setReferralInput(e.target.value)}
                        required
                        className="w-full rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] py-2.5 pl-3.5 pr-8 text-sm font-black text-[#1A1A1A] outline-none transition focus:border-[#F2B705] focus:ring-2 focus:ring-[#FFEFA8]"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-emerald-600">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Presets */}
                  <div>
                    <span className="text-[11px] font-bold text-emerald-700">Quick Presets:</span>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {[2, 5, 7.5, 10, 15].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setReferralInput(String(preset))}
                          className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                            Number(referralInput) === preset
                              ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                              : "border-[#F3E7C4] bg-[#FFFDF7] text-[#6B7280] hover:bg-gray-50"
                          }`}
                        >
                          {preset}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      updateLoading ||
                      referralInput === "" ||
                      Number(referralInput) === Number(referralPercent)
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#12b886] to-[#0ca678] py-2.5 text-xs font-black text-white shadow-[0_4px_12px_rgba(18,184,134,0.4)] transition active:scale-[0.98] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updatingField === "referral" ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Updating Referral %...
                      </>
                    ) : (
                      <>
                        <Check size={14} className="stroke-[3]" />
                        Update Referral Rate
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="mt-5 border-t border-[#F3E7C4] pt-3 text-[11px] text-[#6B7280]">
                Last updated: <strong>{formatDate(settingsState?.updatedAt)}</strong>
              </div>
            </div>
          </div>

          {/* Unified Bulk Save Footer */}
          <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-[#F3E7C4] bg-gradient-to-r from-[#FFFDF7] via-white to-[#FFEFA8]/30 p-5 shadow-[0_4px_16px_-6px_rgba(247,181,0,0.2)] sm:flex-row">
            <div>
              <h3 className="text-sm font-black text-[#1A1A1A]">
                Unified Bulk Save
              </h3>
              <p className="text-xs text-[#6B7280]">
                You can change any values above and click "Save All Settings" to sync everything simultaneously.
              </p>
            </div>

            <button
              onClick={handleUpdateAll}
              disabled={updateLoading || !hasChanges}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] px-6 py-3 text-xs font-black text-[#1A1204] shadow-[0_8px_18px_-4px_rgba(227,154,0,0.7)] transition active:scale-[0.98] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {updatingField === "all" ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  Saving Settings...
                </>
              ) : (
                <>
                  <Save size={15} className="stroke-[2.5]" />
                  Save All Settings
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          TAB 2: RESULT IMAGES CONTENT
      ====================================================== */}
      {activeTab === "results" && (
        <div className="space-y-6">
          {/* Notifications */}
          {resultSuccess && (
            <div className="flex items-center justify-between rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-800 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{resultMessage || "Operation completed successfully!"}</span>
              </div>
              <button
                onClick={() => dispatch(clearResultImageMessages())}
                className="text-emerald-600 hover:text-emerald-800"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {(resultError || resultActionError) && (
            <div className="flex items-center justify-between rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-rose-800 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold">
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
                <span>{resultError || resultActionError}</span>
              </div>
              <button
                onClick={() => {
                  dispatch(clearResultImageErrors());
                  dispatch(clearResultImageMessages());
                }}
                className="text-rose-600 hover:text-rose-800"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-[#F3E7C4] bg-white p-4 shadow-sm">
              <p className="text-[11px] font-bold text-[#6B7280]">Total Charts</p>
              <p className="mt-1 text-2xl font-black text-[#1A1A1A]">
                {resultStats.total}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
              <p className="text-[11px] font-bold text-amber-800">Daily Results</p>
              <p className="mt-1 text-2xl font-black text-amber-900">
                {resultStats.daily}
              </p>
            </div>
            <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 shadow-sm">
              <p className="text-[11px] font-bold text-purple-800">Festival Results</p>
              <p className="mt-1 text-2xl font-black text-purple-900">
                {resultStats.festival}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
              <p className="text-[11px] font-bold text-emerald-800">Active Published</p>
              <p className="mt-1 text-2xl font-black text-emerald-900">
                {resultStats.active}
              </p>
            </div>
          </div>

          {/* Controls Bar: Search, Filters, Add Button */}
          <div className="flex flex-col gap-3 rounded-2xl border border-[#F3E7C4] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {/* Type Filter Buttons */}
              <div className="flex rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-1">
                {[
                  { id: "ALL", label: "All" },
                  { id: "DAILY", label: "Daily" },
                  { id: "FESTIVAL", label: "Festival" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFilterType(t.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-black transition ${
                      filterType === t.id
                        ? "bg-gradient-to-r from-[#FFD83D] to-[#F7B500] text-[#1A1204] shadow-sm"
                        : "text-[#6B7280] hover:text-[#1A1A1A]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] px-3 py-1.5 text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#F2B705]"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>

              {/* Search input */}
              <input
                type="text"
                placeholder="Search title, festival, date..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] px-3 py-1.5 text-xs text-[#1A1A1A] outline-none placeholder:text-[#8A8F98] focus:border-[#F2B705]"
              />
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] px-4 py-2 text-xs font-black text-[#1A1204] shadow-[0_4px_12px_rgba(247,181,0,0.4)] transition active:scale-[0.98] hover:brightness-105"
            >
              <Plus size={16} className="stroke-[3]" />
              <span>Upload Result Image</span>
            </button>
          </div>

          {/* Result Images Grid */}
          {resultLoading ? (
            <div className="flex h-60 flex-col items-center justify-center rounded-2xl border border-[#F3E7C4] bg-white">
              <RefreshCw size={24} className="animate-spin text-[#F7B500]" />
              <p className="mt-3 text-xs font-bold text-[#6B7280]">
                Loading Result Images...
              </p>
            </div>
          ) : filteredResultImages.length === 0 ? (
            <div className="flex h-60 flex-col items-center justify-center rounded-2xl border border-dashed border-[#F3E7C4] bg-white p-6 text-center">
              <ImageIcon size={36} className="text-[#8A8F98] mb-2" />
              <p className="text-sm font-black text-[#1A1A1A]">No Result Images Found</p>
              <p className="mt-1 text-xs text-[#6B7280]">
                {searchQuery || filterType !== "ALL" || filterStatus !== "ALL"
                  ? "Try resetting your search or filters."
                  : "Upload official Daily or Festival result charts to show them on the public results page."}
              </p>
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] px-4 py-2 text-xs font-black text-[#9A5B00] hover:bg-[#FFEFA8]/50"
              >
                <Plus size={14} />
                <span>Upload First Result Image</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredResultImages.map((item) => (
                <div
                  key={item._id}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[#F3E7C4] bg-white shadow-sm transition hover:shadow-md"
                >
                  {/* Image thumbnail header */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                    <img
                      src={item.thumbUrl || item.imageUrl || item.displayUrl}
                      alt={item.title || "Result Image"}
                      className="h-full w-full object-cover transition hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = item.imageUrl || item.displayUrl;
                      }}
                    />

                    {/* Status badge overlay */}
                    <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
                      <span
                        className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white shadow-sm ${
                          item.type === "FESTIVAL"
                            ? "bg-gradient-to-r from-purple-600 to-pink-600"
                            : "bg-gradient-to-r from-[#E39A00] to-[#b37400]"
                        }`}
                      >
                        {item.type}
                      </span>

                      <span
                        className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase text-white shadow-sm ${
                          item.isActive ? "bg-emerald-600" : "bg-gray-600"
                        }`}
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* Zoom icon button */}
                    <button
                      type="button"
                      onClick={() => setZoomPreview(item)}
                      className="absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 text-white backdrop-blur-sm transition hover:bg-black/80"
                      title="Zoom Image"
                    >
                      <Eye size={15} />
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="flex-1 p-3.5 space-y-2">
                    <h3 className="truncate text-sm font-black text-[#1A1A1A]">
                      {item.title || (item.type === "DAILY" ? "Daily Result" : item.festivalName || "Festival Result")}
                    </h3>

                    {item.type === "DAILY" && (
                      <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                        <Calendar size={13} className="text-[#9A5B00]" />
                        <span>Draw Date: <strong>{formatDateOnly(item.resultDate)}</strong></span>
                      </div>
                    )}

                    {item.type === "FESTIVAL" && (
                      <div className="flex items-center gap-1.5 text-xs text-purple-700 font-bold">
                        <Sparkles size={13} />
                        <span>Festival: <strong>{item.festivalName}</strong></span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-[#8A8F98] pt-1 border-t border-[#F3E7C4]/50">
                      <span>Sort Order: <strong>{item.sortOrder || 0}</strong></span>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="flex items-center justify-between border-t border-[#F3E7C4] bg-[#FFFDF7] px-3.5 py-2.5">
                    {/* Toggle Active Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleResultImage(item._id)}
                      disabled={resultActionLoading}
                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition ${
                        item.isActive
                          ? "text-emerald-700 hover:bg-emerald-50"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                      title={item.isActive ? "Deactivate" : "Activate"}
                    >
                      <Power size={13} />
                      <span>{item.isActive ? "Active" : "Inactive"}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#F3E7C4] bg-white text-[#6B7280] transition hover:bg-[#FFEFA8]/50 hover:text-[#9A5B00]"
                        title="Edit"
                      >
                        <Edit3 size={13} />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteResultImage(item._id)}
                        disabled={resultActionLoading}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 transition hover:bg-rose-50 hover:text-rose-700"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          UPLOAD / EDIT RESULT IMAGE MODAL
      ====================================================== */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-[#F3E7C4] bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#F3E7C4] bg-[#FFFDF7] px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFD83D] to-[#E39A00] text-[#1A1204]">
                  <UploadCloud size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1A1A1A]">
                    {editingItem ? "Edit Result Image" : "Upload Result Image"}
                  </h3>
                  <p className="text-[11px] text-[#6B7280]">
                    Official draw chart for users to view & check winning numbers
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl p-1.5 text-[#8A8F98] hover:bg-[#FFEFA8]/50 hover:text-[#1A1A1A]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitResultImage} className="flex-1 overflow-y-auto p-5 space-y-4">
              {formValidationError && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{formValidationError}</span>
                </div>
              )}

              {/* Type Selector (DAILY vs FESTIVAL) */}
              <div>
                <label className="block text-xs font-black text-[#1A1A1A] mb-1.5">
                  Result Category <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType("DAILY")}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black transition border ${
                      formType === "DAILY"
                        ? "border-[#F2B705] bg-[#FFEFA8] text-[#9A5B00] shadow-sm"
                        : "border-[#F3E7C4] bg-[#FFFDF7] text-[#6B7280] hover:bg-gray-50"
                    }`}
                  >
                    <Ticket size={15} />
                    <span>DAILY RESULT</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType("FESTIVAL")}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black transition border ${
                      formType === "FESTIVAL"
                        ? "border-purple-400 bg-purple-100 text-purple-900 shadow-sm"
                        : "border-[#F3E7C4] bg-[#FFFDF7] text-[#6B7280] hover:bg-gray-50"
                    }`}
                  >
                    <PartyPopper size={15} />
                    <span>FESTIVAL BUMPER</span>
                  </button>
                </div>
              </div>

              {/* Conditional Fields: Date for DAILY, Festival Name for FESTIVAL */}
              {formType === "DAILY" ? (
                <div>
                  <label className="block text-xs font-black text-[#1A1A1A] mb-1">
                    Draw Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] px-3.5 py-2.5 text-sm font-bold text-[#1A1A1A] outline-none focus:border-[#F2B705]"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-black text-[#1A1A1A] mb-1">
                    Festival Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Diwali Bumper 2026, Holi Special"
                    value={formFestival}
                    onChange={(e) => setFormFestival(e.target.value)}
                    required
                    className="w-full rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] px-3.5 py-2.5 text-sm text-[#1A1A1A] outline-none focus:border-[#F2B705]"
                  />
                </div>
              )}

              {/* Title Field (Optional) */}
              <div>
                <label className="block text-xs font-black text-[#1A1A1A] mb-1">
                  Title / Slot Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1:00 PM Draw Result, 8:00 PM Dear Evening"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] px-3.5 py-2.5 text-sm text-[#1A1A1A] outline-none focus:border-[#F2B705]"
                />
              </div>

              {/* Image Upload Field */}
              <div>
                <label className="block text-xs font-black text-[#1A1A1A] mb-1">
                  Result Image / Chart {!editingItem && <span className="text-red-500">*</span>}
                </label>

                <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#F3E7C4] bg-[#FFFDF7] p-4 text-center hover:bg-[#FFEFA8]/20 transition">
                  {formFilePreview ? (
                    <div className="relative w-full">
                      <img
                        src={formFilePreview}
                        alt="Preview"
                        className="max-h-48 w-full rounded-xl object-contain"
                      />
                      <label
                        htmlFor="result-image-file"
                        className="mt-2 block cursor-pointer text-xs font-black text-[#9A5B00] hover:underline"
                      >
                        Change Image
                      </label>
                    </div>
                  ) : (
                    <label
                      htmlFor="result-image-file"
                      className="flex cursor-pointer flex-col items-center justify-center py-4"
                    >
                      <UploadCloud size={32} className="text-[#9A5B00] mb-2" />
                      <span className="text-xs font-black text-[#1A1A1A]">
                        Click to select Result Image
                      </span>
                      <span className="text-[10px] text-[#6B7280] mt-0.5">
                        JPG, PNG, WEBP up to 5MB
                      </span>
                    </label>
                  )}

                  <input
                    id="result-image-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Sort Order & Active Status */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-black text-[#1A1A1A] mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(e.target.value)}
                    className="w-full rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] px-3.5 py-2 text-sm text-[#1A1A1A] outline-none focus:border-[#F2B705]"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="h-4 w-4 accent-[#F7B500]"
                    />
                    <span className="text-xs font-black text-[#1A1A1A]">
                      Active / Published
                    </span>
                  </label>
                </div>
              </div>

              {/* Modal Submit Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F3E7C4]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={resultActionLoading}
                  className="rounded-xl border border-[#F3E7C4] bg-white px-4 py-2.5 text-xs font-bold text-[#6B7280] hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={resultActionLoading}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] px-5 py-2.5 text-xs font-black text-[#1A1204] shadow-md hover:brightness-105 disabled:opacity-50"
                >
                  {resultActionLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} className="stroke-[3]" />
                      <span>{editingItem ? "Update Result Image" : "Upload Image"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          ZOOM PREVIEW MODAL
      ====================================================== */}
      {zoomPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setZoomPreview(null)}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 bg-[#FFFDF7] px-5 py-3">
              <div>
                <h3 className="text-sm font-black text-[#1A1A1A]">
                  {zoomPreview.title || "Result Chart"}
                </h3>
                <p className="text-[11px] text-[#6B7280]">
                  {zoomPreview.type === "DAILY"
                    ? `Daily Draw — ${formatDateOnly(zoomPreview.resultDate)}`
                    : `Festival — ${zoomPreview.festivalName}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={zoomPreview.imageUrl || zoomPreview.displayUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#F3E7C4] text-[#6B7280] hover:bg-[#FFEFA8]/50 hover:text-[#1A1A1A]"
                  title="Open original in new tab"
                >
                  <ExternalLink size={15} />
                </a>

                <button
                  type="button"
                  onClick={() => setZoomPreview(null)}
                  className="rounded-lg p-1.5 text-[#8A8F98] hover:bg-gray-100"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex max-h-[80vh] items-center justify-center overflow-auto bg-gray-900 p-2">
              <img
                src={zoomPreview.imageUrl || zoomPreview.displayUrl}
                alt={zoomPreview.title || "Full Result Chart"}
                className="max-h-[76vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
