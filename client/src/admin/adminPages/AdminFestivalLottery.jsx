import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CalendarDays,
  Clock3,
  Ticket,
  Trash2,
  RefreshCw,
  Pencil,
  Power,
  X,
  Trophy,
  CheckCircle2,
  XCircle,
  Settings2,
  Eye,
} from "lucide-react";

import {
  createLotteryConfig,
  updateLotteryConfig,
  getAllLotteryConfigs,
  getLotteryConfigById,
  activateLotteryConfig,
  deactivateLotteryConfig,
  deleteLotteryConfig,
  clearCreateLotteryError,
  clearCreateLotterySuccess,
  clearUpdateLotteryError,
  clearUpdateLotterySuccess,
  clearActivateLotteryError,
  clearDeactivateLotteryError,
  clearDeleteLotteryError,
} from "../../reducer/slice/festivalLotteryReducer";

/* =========================================================
   WINZOX THEME TOKENS  (Bright Gold + White)
   bg          #FFFDF7
   border      #F3E7C4
   gold        #FFD83D -> #F7B500 -> #E39A00
   gold-soft   #FFEFA8
   gold-line   #F2B705
   on-gold     #1A1204  (text on gold is DARK)
   text        #1A1A1A
   muted       #6B7280
   brown       #9A5B00
   success     #12A36B
   danger      #D93025
========================================================= */

const GOLD_BTN =
  "bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] text-[#1A1204] font-extrabold shadow-[0_4px_10px_-3px_rgba(227,154,0,0.55),inset_0_1px_0_rgba(255,255,255,0.55)] hover:brightness-105";

const OUTLINE_BTN =
  "border border-[#F2B705] bg-white font-bold text-[#9A5B00] hover:bg-[#FFEFA8]/60";

const INPUT_CLS =
  "w-full rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] py-2.5 text-[#1A1A1A] outline-none transition placeholder:text-[#8A8F98] focus:border-[#F2B705] focus:ring-2 focus:ring-[#FFEFA8] disabled:bg-[#F5F1E4] disabled:text-[#8A8F98]";

const LABEL_CLS = "mb-2 block text-sm font-semibold text-[#1A1A1A]";

const CARD_CLS =
  "rounded-2xl border border-[#F3E7C4] bg-white shadow-[0_6px_18px_-10px_rgba(247,181,0,0.35)]";

const TH_CLS =
  "whitespace-nowrap px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#9A5B00]";

// =====================================================
// HELPERS
// =====================================================

const getToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const formatDate = (date) => {
  if (!date) return "-";
  const value = String(date).slice(0, 10);
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getMonthName = (month) => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return months[Number(month) - 1] || "-";
};

const getDefaultForm = () => ({
  marketName: "",
  drawDate: getToday(),
  drawTime: "18:30",
  firstPrize: "",
  secondPrize: "",
  thirdPrize: "",
});

const getErrorMessage = (error, fallback) => {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  return (
    error?.message ||
    error?.error ||
    error?.data?.message ||
    error?.data?.error ||
    fallback
  );
};

const getConfigFromResponse = (result) => {
  return result?.data || result?.config || result?.lottery || result;
};

// =====================================================
// COMPONENT
// =====================================================

const AdminFestivalLottery = () => {
  const dispatch = useDispatch();

  // ---------- REDUX STATE ----------
  const {
    configs = [],
    config = null,
    loading = false,
    configLoading = false,
    createLoading = false,
    updateLoading = false,
    activateLoading = false,
    deactivateLoading = false,
    deleteLoading = false,
    error = null,
    configError = null,
    createError = null,
    updateError = null,
    activateError = null,
    deactivateError = null,
    deleteError = null,
    createSuccess = null,
    updateSuccess = null,
    activateSuccess = null,
    deactivateSuccess = null,
    deleteSuccess = null,
  } = useSelector((state) => state.festivalLottery || {});

  const lotteries = Array.isArray(configs) ? configs : [];

  // ---------- LOCAL UI STATE ----------
  const [formData, setFormData] = useState(getDefaultForm());
  const [validationError, setValidationError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [viewingId, setViewingId] = useState(null);

  const busy =
    loading ||
    configLoading ||
    createLoading ||
    updateLoading ||
    activateLoading ||
    deactivateLoading ||
    deleteLoading;

  const apiError =
    createError ||
    updateError ||
    activateError ||
    deactivateError ||
    deleteError ||
    configError ||
    error;

  const apiSuccess =
    createSuccess || updateSuccess || activateSuccess || deactivateSuccess || deleteSuccess;

  // ---------- INITIAL FETCH ----------
  useEffect(() => {
    dispatch(getAllLotteryConfigs());
  }, [dispatch]);

  // ---------- SURFACE API ERROR ----------
  useEffect(() => {
    if (!apiError) return;
    setValidationError(getErrorMessage(apiError, "Something went wrong."));
  }, [apiError]);

  // ---------- SURFACE API SUCCESS ----------
  useEffect(() => {
    if (!apiSuccess) return;
    setSuccessMessage(
      typeof apiSuccess === "string" ? apiSuccess : "Operation successful."
    );
  }, [apiSuccess]);

  // =====================================================
  // FORM HANDLERS
  // =====================================================
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setValidationError("");
    setSuccessMessage("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.marketName.trim()) return "Market name is required.";
    if (!formData.drawDate) return "Draw date is required.";
    if (!formData.drawTime) return "Draw time is required.";

    const selectedDate = new Date(`${formData.drawDate}T00:00:00`);
    if (Number.isNaN(selectedDate.getTime())) return "Invalid draw date.";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    if (selectedDate < today) return "Past draw date cannot be selected.";

    const prizes = [
      ["First", formData.firstPrize],
      ["Second", formData.secondPrize],
      ["Third", formData.thirdPrize],
    ];
    for (const [label, value] of prizes) {
      if (value === "" || value === null || value === undefined) {
        return `${label} prize is required.`;
      }
      const amount = Number(value);
      if (!Number.isFinite(amount) || amount < 0) {
        return `Invalid ${label.toLowerCase()} prize.`;
      }
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");
    setSuccessMessage("");

    const validation = validateForm();
    if (validation) {
      setValidationError(validation);
      return;
    }

    const selectedDate = new Date(`${formData.drawDate}T00:00:00`);
    const payload = {
      marketName: formData.marketName.trim(),
      month: selectedDate.getMonth() + 1,
      year: selectedDate.getFullYear(),
      drawDate: formData.drawDate,
      drawTime: formData.drawTime,
      prizes: {
        first: Number(formData.firstPrize),
        second: Number(formData.secondPrize),
        third: Number(formData.thirdPrize),
      },
    };

    try {
      if (editingId) {
        await dispatch(
          updateLotteryConfig({ id: editingId, lotteryData: payload })
        ).unwrap();
        await dispatch(getAllLotteryConfigs()).unwrap();
        setSuccessMessage("Festival lottery updated successfully.");
      } else {
        await dispatch(createLotteryConfig(payload)).unwrap();
        await dispatch(getAllLotteryConfigs()).unwrap();
        setSuccessMessage(
          "Festival lottery created successfully. It is inactive until you activate it."
        );
      }
      setFormData(getDefaultForm());
      setEditingId(null);
    } catch (err) {
      setValidationError(
        getErrorMessage(
          err,
          editingId
            ? "Failed to update festival lottery."
            : "Failed to create festival lottery."
        )
      );
    }
  };

  const handleEdit = async (lottery) => {
    const id = lottery?._id || lottery?.id;
    if (!id) {
      setValidationError("Invalid lottery configuration.");
      return;
    }

    setValidationError("");
    setSuccessMessage("");

    try {
      const result = await dispatch(getLotteryConfigById(id)).unwrap();
      const fetched = getConfigFromResponse(result);
      const drawDate = fetched?.drawDate
        ? String(fetched.drawDate).slice(0, 10)
        : getToday();

      setEditingId(fetched?._id || id);
      setFormData({
        marketName: fetched?.marketName || "",
        drawDate,
        drawTime: fetched?.drawTime || "18:30",
        firstPrize: String(fetched?.prizes?.first ?? ""),
        secondPrize: String(fetched?.prizes?.second ?? ""),
        thirdPrize: String(fetched?.prizes?.third ?? ""),
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setValidationError(
        getErrorMessage(err, "Failed to load lottery configuration.")
      );
    }
  };

  const handleView = async (lottery) => {
    const id = lottery?._id || lottery?.id;
    if (!id) {
      setValidationError("Invalid lottery configuration.");
      return;
    }
    setValidationError("");
    setSuccessMessage("");

    try {
      await dispatch(getLotteryConfigById(id)).unwrap();
      setViewingId(id);
    } catch (err) {
      setValidationError(
        getErrorMessage(err, "Failed to load lottery details.")
      );
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(getDefaultForm());
    setValidationError("");
    setSuccessMessage("");
    dispatch(clearCreateLotteryError());
    dispatch(clearCreateLotterySuccess());
    dispatch(clearUpdateLotteryError());
    dispatch(clearUpdateLotterySuccess());
  };

  // =====================================================
  // ACTIVATE / DEACTIVATE
  // =====================================================
  const handleToggleStatus = async (lottery) => {
    const id = lottery?._id || lottery?.id;
    if (!id) {
      setValidationError("Invalid lottery configuration.");
      return;
    }

    setValidationError("");
    setSuccessMessage("");

    try {
      if (lottery.isActive) {
        await dispatch(deactivateLotteryConfig(id)).unwrap();
        setSuccessMessage("Festival lottery deactivated successfully.");
      } else {
        await dispatch(activateLotteryConfig(id)).unwrap();
        setSuccessMessage("Festival lottery activated successfully.");
      }
      await dispatch(getAllLotteryConfigs()).unwrap();
    } catch (err) {
      setValidationError(
        getErrorMessage(err, "Failed to update lottery status.")
      );
    }
  };

  // =====================================================
  // REFRESH
  // =====================================================
  const handleRefresh = async () => {
    setValidationError("");
    setSuccessMessage("");
    try {
      await dispatch(getAllLotteryConfigs()).unwrap();
      setSuccessMessage("Festival lottery list refreshed successfully.");
    } catch (err) {
      setValidationError(
        getErrorMessage(err, "Failed to refresh festival lotteries.")
      );
    }
  };

  // =====================================================
  // DELETE
  // =====================================================
  const handleOpenDelete = (id) => {
    setDeleteId(id);
    setDeleteModal(true);
  };

  const handleCloseDelete = () => {
    setDeleteId(null);
    setDeleteModal(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setValidationError("");
    setSuccessMessage("");

    try {
      await dispatch(deleteLotteryConfig(deleteId)).unwrap();
      await dispatch(getAllLotteryConfigs()).unwrap();

      if (editingId === deleteId) handleCancelEdit();
      if (viewingId === deleteId) setViewingId(null);

      setSuccessMessage("Festival lottery deleted successfully.");
      handleCloseDelete();
    } catch (err) {
      setValidationError(
        getErrorMessage(err, "Failed to delete festival lottery.")
      );
    }
  };

  const handleReset = () => {
    setFormData(getDefaultForm());
    setEditingId(null);
    setValidationError("");
    setSuccessMessage("");
  };

  // =====================================================
  // SELECTED / VIEWED CONFIG
  // =====================================================
  const viewedConfig = useMemo(() => {
    if (!config) return null;
    const id = config?._id || config?.id;
    if (!viewingId || id !== viewingId) return null;
    return config;
  }, [config, viewingId]);

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl">
        {/* ================= HEADER ================= */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFEFA8] text-[#1A1204] ring-2 ring-[#F2B705]">
              <Ticket size={22} strokeWidth={2.3} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#1A1A1A]">
                Festival Lottery
              </h1>
              <p className="mt-1 text-sm text-[#6B7280]">
                Create and manage festival lottery draws and prize settings.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={busy}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${OUTLINE_BTN}`}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* ================= SUCCESS / ERROR BANNERS ================= */}
        {successMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#12A36B]/30 bg-[#E6F6EF] px-4 py-3 text-sm font-medium text-[#0E7A52]">
            <CheckCircle2 size={17} />
            {successMessage}
          </div>
        )}

        {validationError && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-[#D93025]/30 bg-[#FDE8E6] px-4 py-3 text-sm font-medium text-[#B3261E]">
            <div className="flex items-center gap-2">
              <XCircle size={17} />
              {validationError}
            </div>
            <button
              type="button"
              onClick={() => setValidationError("")}
              className="text-lg font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* ================= CREATE / EDIT FORM ================= */}
        <div className={`mb-6 p-5 ${CARD_CLS}`}>
          <div className="mb-6 flex flex-col gap-3 border-b border-[#F3E7C4] pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Settings2 size={19} className="text-[#F7B500]" />
                <h2 className="text-lg font-black text-[#1A1A1A]">
                  {editingId
                    ? "Edit Festival Lottery"
                    : "Create Festival Lottery"}
                </h2>
              </div>
              <p className="mt-1 text-sm text-[#6B7280]">
                Configure draw date, time and prize amounts.
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm transition ${OUTLINE_BTN}`}
              >
                <X size={16} />
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            {/* ---------- DRAW INFO ---------- */}
            <div className="mb-7">
              <div className="mb-4 flex items-center gap-2">
                <CalendarDays size={18} className="text-[#F7B500]" />
                <h3 className="text-sm font-bold text-[#1A1A1A]">
                  Draw Information
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="lg:col-span-2">
                  <label className={LABEL_CLS}>Market Name</label>
                  <input
                    type="text"
                    name="marketName"
                    value={formData.marketName}
                    onChange={handleFormChange}
                    placeholder="Enter market name"
                    maxLength={100}
                    disabled={busy}
                    className={`${INPUT_CLS} px-3`}
                  />
                </div>

                <div>
                  <label className={LABEL_CLS}>Draw Date</label>
                  <input
                    type="date"
                    name="drawDate"
                    value={formData.drawDate}
                    min={getToday()}
                    onChange={handleFormChange}
                    disabled={busy}
                    className={`${INPUT_CLS} px-3`}
                  />
                  <p className="mt-1 text-xs text-[#6B7280]">
                    Past dates are not allowed.
                  </p>
                </div>

                <div>
                  <label className={LABEL_CLS}>Draw Time</label>
                  <div className="relative">
                    <Clock3
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A5B00]"
                    />
                    <input
                      type="time"
                      name="drawTime"
                      value={formData.drawTime}
                      onChange={handleFormChange}
                      disabled={busy}
                      className={`${INPUT_CLS} pl-9 pr-3`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ---------- PRIZES ---------- */}
            <div className="mb-7 border-t border-[#F3E7C4] pt-6">
              <div className="mb-4 flex items-center gap-2">
                <Trophy size={18} className="text-[#F7B500]" />
                <h3 className="text-sm font-bold text-[#1A1A1A]">
                  Prize Configuration
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  { name: "firstPrize", label: "1st Prize", badge: "Winner 1" },
                  { name: "secondPrize", label: "2nd Prize", badge: "Winner 2" },
                  { name: "thirdPrize", label: "3rd Prize", badge: "Winner 3" },
                ].map((prize) => (
                  <div
                    key={prize.name}
                    className="rounded-xl border border-[#F3E7C4] bg-[#FFF9E3] p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-bold text-[#1A1A1A]">
                        {prize.label}
                      </span>
                      <span className="rounded-full bg-[#FFEFA8] px-2.5 py-1 text-xs font-bold text-[#9A5B00] ring-1 ring-[#F2B705]/60">
                        {prize.badge}
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-[#9A5B00]">
                        ₹
                      </span>
                      <input
                        type="number"
                        name={prize.name}
                        value={formData[prize.name]}
                        min="0"
                        step="1"
                        placeholder={`Enter ${prize.label.toLowerCase()}`}
                        onChange={handleFormChange}
                        disabled={busy}
                        className={`${INPUT_CLS} bg-white pl-8 pr-3`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ---------- ACTIONS ---------- */}
            <div className="flex flex-col-reverse gap-3 border-t border-[#F3E7C4] pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleReset}
                disabled={busy}
                className={`rounded-xl px-5 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${OUTLINE_BTN}`}
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={busy}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${GOLD_BTN}`}
              >
                <Ticket size={17} />
                {editingId
                  ? updateLoading
                    ? "Updating..."
                    : "Update Festival Lottery"
                  : createLoading
                    ? "Creating..."
                    : "Create Festival Lottery"}
              </button>
            </div>
          </form>
        </div>

        {/* ================= VIEWED CONFIG ENTRIES ================= */}
        {viewedConfig && (
          <div className="mb-8 rounded-2xl border border-[#F2B705]/60 bg-[#FFF9E3] shadow-[0_6px_18px_-10px_rgba(247,181,0,0.35)]">
            <div className="flex flex-col gap-3 border-b border-[#F3E7C4] px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#9A5B00]">
                  Viewing Entries
                </p>
                <h2 className="mt-1 text-lg font-black text-[#1A1A1A]">
                  {viewedConfig.marketName}
                </h2>
                <p className="mt-1 text-sm text-[#6B7280]">
                  {getMonthName(viewedConfig.month)} {viewedConfig.year} •{" "}
                  {viewedConfig.users?.length || 0} Users
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {viewedConfig.drawDate && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1A1A] ring-1 ring-[#F3E7C4]">
                      <CalendarDays size={13} className="text-[#9A5B00]" />
                      {formatDate(viewedConfig.drawDate)}
                    </span>
                  )}
                  {viewedConfig.drawTime && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1A1A] ring-1 ring-[#F3E7C4]">
                      <Clock3 size={13} className="text-[#9A5B00]" />
                      {viewedConfig.drawTime}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingId(null)}
                className={`rounded-xl px-4 py-2 text-sm transition ${OUTLINE_BTN}`}
              >
                Close
              </button>
            </div>

            <div className="overflow-x-auto">
              {viewedConfig.users?.length > 0 ? (
                <table className="min-w-full">
                  <thead className="bg-white">
                    <tr>
                      <th className={TH_CLS}>#</th>
                      <th className={TH_CLS}>Number</th>
                      <th className={TH_CLS}>Amount</th>
                      <th className={TH_CLS}>Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3E7C4]">
                    {viewedConfig.users.map((entry, index) => (
                      <tr
                        key={entry._id || index}
                        className="bg-white hover:bg-[#FFFDF7]"
                      >
                        <td className="px-5 py-4 text-sm text-[#8A8F98]">
                          {index + 1}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-[#FFEFA8] px-3 py-1 text-sm font-black tracking-wider text-[#1A1204] ring-1 ring-[#F2B705]/60">
                            {entry.number}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-[#1A1A1A]">
                          ₹{Number(entry.amount || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-5 py-4">
                          {entry.status === "win" ? (
                            <span className="rounded-full bg-[#E6F6EF] px-3 py-1 text-xs font-bold text-[#12A36B]">
                              Win
                            </span>
                          ) : entry.status === "lost" ? (
                            <span className="rounded-full bg-[#FDE8E6] px-3 py-1 text-xs font-bold text-[#D93025]">
                              Lost
                            </span>
                          ) : (
                            <span className="rounded-full bg-[#FFEFA8] px-3 py-1 text-xs font-bold text-[#9A5B00]">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="bg-white p-8 text-center text-sm text-[#6B7280]">
                  No user entries found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= ALL MARKETS ================= */}
        <div className={CARD_CLS}>
          <div className="flex flex-col gap-3 border-b border-[#F3E7C4] p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-black text-[#1A1A1A]">
                All Festival Lotteries
              </h2>
              <p className="mt-1 text-sm text-[#6B7280]">
                Total: {lotteries.length}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#E6F6EF] px-3 py-1 text-xs font-bold text-[#12A36B]">
                {lotteries.filter((l) => l.isActive).length} Active
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-[#6B7280]">
                {lotteries.filter((l) => !l.isActive).length} Inactive
              </span>
            </div>
          </div>

          {loading && lotteries.length === 0 ? (
            <div className="flex min-h-[200px] items-center justify-center text-sm text-[#6B7280]">
              Loading festival lotteries...
            </div>
          ) : lotteries.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFEFA8] text-[#1A1204] ring-2 ring-[#F2B705]">
                <Ticket size={25} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#1A1A1A]">
                No festival lotteries found
              </h3>
              <p className="mt-1 text-sm text-[#6B7280]">
                Create your first festival lottery using the form above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px]">
                <thead>
                  <tr className="border-b border-[#F3E7C4] bg-[#FFF9E3]">
                    <th className={TH_CLS}>#</th>
                    <th className={TH_CLS}>Market</th>
                    <th className={TH_CLS}>Draw Date</th>
                    <th className={TH_CLS}>Time</th>
                    <th className={TH_CLS}>Month / Year</th>
                    <th className={TH_CLS}>Prizes</th>
                    <th className={TH_CLS}>Entries</th>
                    <th className={TH_CLS}>Status</th>
                    <th
                      className={`${TH_CLS} !text-right`}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lotteries.map((lotteryItem, index) => {
                    const id = lotteryItem?._id || lotteryItem?.id;
                    const drawDate = lotteryItem?.drawDate
                      ? String(lotteryItem.drawDate).slice(0, 10)
                      : "";
                    const derivedDate = drawDate
                      ? new Date(`${drawDate}T00:00:00`)
                      : null;
                    const month =
                      lotteryItem?.month ||
                      (derivedDate ? derivedDate.getMonth() + 1 : "-");
                    const year =
                      lotteryItem?.year ||
                      (derivedDate ? derivedDate.getFullYear() : "-");

                    return (
                      <tr
                        key={id || index}
                        className="border-b border-[#F3E7C4] last:border-0 hover:bg-[#FFFDF7]"
                      >
                        <td className="px-5 py-4 text-sm text-[#8A8F98]">
                          {index + 1}
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-semibold text-[#1A1A1A]">
                            {lotteryItem.marketName || "-"}
                          </div>
                          <div className="mt-1 max-w-[220px] truncate text-xs text-[#8A8F98]">
                            ID: {id || "-"}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-[#1A1A1A]">
                          {formatDate(drawDate)}
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFEFA8] px-3 py-1.5 text-sm font-bold text-[#9A5B00] ring-1 ring-[#F2B705]/60">
                            <Clock3 size={14} />
                            {lotteryItem.drawTime || "-"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-[#1A1A1A]">
                          <div className="font-semibold">
                            {getMonthName(month)}
                          </div>
                          <div className="text-xs text-[#8A8F98]">{year}</div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="space-y-1 text-xs text-[#1A1A1A]">
                            <div>
                              <span className="font-bold text-[#9A5B00]">
                                1st:
                              </span>{" "}
                              ₹
                              {Number(
                                lotteryItem.prizes?.first || 0
                              ).toLocaleString("en-IN")}
                            </div>
                            <div>
                              <span className="font-bold text-[#9A5B00]">
                                2nd:
                              </span>{" "}
                              ₹
                              {Number(
                                lotteryItem.prizes?.second || 0
                              ).toLocaleString("en-IN")}
                            </div>
                            <div>
                              <span className="font-bold text-[#9A5B00]">
                                3rd:
                              </span>{" "}
                              ₹
                              {Number(
                                lotteryItem.prizes?.third || 0
                              ).toLocaleString("en-IN")}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-[#1A1A1A]">
                          {Array.isArray(lotteryItem.users)
                            ? lotteryItem.users.length
                            : 0}
                        </td>

                        <td className="px-5 py-4">
                          {lotteryItem.isActive ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F6EF] px-3 py-1 text-xs font-bold text-[#12A36B]">
                              <CheckCircle2 size={13} />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-[#6B7280]">
                              <XCircle size={13} />
                              Inactive
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {/* VIEW */}
                            <button
                              type="button"
                              onClick={() => handleView(lotteryItem)}
                              disabled={busy}
                              className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs transition disabled:cursor-not-allowed disabled:opacity-50 ${GOLD_BTN}`}
                              title="View entries"
                            >
                              <Eye size={15} />
                              View
                            </button>

                            {/* EDIT */}
                            <button
                              type="button"
                              onClick={() => handleEdit(lotteryItem)}
                              disabled={busy}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#F2B705] bg-white text-[#9A5B00] transition hover:bg-[#FFEFA8]/60 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Edit"
                            >
                              <Pencil size={15} />
                            </button>

                            {/* ACTIVATE / DEACTIVATE */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(lotteryItem)}
                              disabled={activateLoading || deactivateLoading}
                              className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                lotteryItem.isActive
                                  ? "border-[#F2B705] bg-[#FFEFA8] text-[#9A5B00] hover:bg-[#FFE680]"
                                  : "border-[#12A36B]/40 bg-[#E6F6EF] text-[#12A36B] hover:bg-[#D3EFE2]"
                              }`}
                              title={
                                lotteryItem.isActive ? "Deactivate" : "Activate"
                              }
                            >
                              <Power size={14} />
                              {lotteryItem.isActive ? "Deactivate" : "Activate"}
                            </button>

                            {/* DELETE */}
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(id)}
                              disabled={deleteLoading}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#D93025]/30 bg-[#FDE8E6] text-[#D93025] transition hover:bg-[#FAD2CE] disabled:cursor-not-allowed disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ================= DELETE MODAL ================= */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#F3E7C4] bg-white p-6 shadow-xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FDE8E6] text-[#D93025]">
              <Trash2 size={20} />
            </div>

            <h2 className="mt-4 text-lg font-black text-[#1A1A1A]">
              Delete Festival Lottery
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#6B7280]">
              Are you sure you want to delete this festival lottery? This action
              cannot be undone and its stored entries will also be removed with
              the configuration.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseDelete}
                disabled={deleteLoading}
                className={`rounded-xl px-4 py-2.5 text-sm transition disabled:opacity-50 ${OUTLINE_BTN}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="rounded-xl bg-[#D93025] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#B3261E] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFestivalLottery;