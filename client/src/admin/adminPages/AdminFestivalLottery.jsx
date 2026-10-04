import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CalendarDays, Clock3, Ticket, Trash2, RefreshCw, Pencil, Power, X,
  CheckCircle2, XCircle, Eye, Upload, Image as ImageIcon, BarChart3,
  Search, Plus, Filter, Gift, Trophy,
} from "lucide-react";

import {
  createLotteryConfig, updateLotteryConfig, getAllLotteryConfigs,
  getLotteryConfigById, activateLotteryConfig, deactivateLotteryConfig,
  deleteLotteryConfig, clearCreateLotteryError, clearCreateLotterySuccess,
  clearUpdateLotteryError, clearUpdateLotterySuccess,
} from "../../reducer/slice/festivalLotteryReducer";

/* ---------------- THEME ---------------- */
const GOLD_BTN =
  "bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] text-[#1A1204] font-extrabold shadow-[0_4px_10px_-3px_rgba(227,154,0,0.55),inset_0_1px_0_rgba(255,255,255,0.55)] hover:brightness-105";
const OUTLINE_BTN =
  "border border-[#F2B705] bg-white font-bold text-[#9A5B00] hover:bg-[#FFEFA8]/60";
const INPUT_CLS =
  "w-full rounded-lg border border-[#F3E7C4] bg-[#FFFDF7] px-3 py-2.5 text-sm text-[#1A1A1A] outline-none transition placeholder:text-[#8A8F98] focus:border-[#F2B705] focus:ring-2 focus:ring-[#FFEFA8] disabled:bg-[#F5F1E4]";
const LABEL_CLS = "mb-1.5 block text-xs font-semibold text-[#1A1A1A]";
const CARD_CLS =
  "rounded-2xl border border-[#F3E7C4] bg-white shadow-[0_6px_18px_-10px_rgba(247,181,0,0.35)]";
const TH_CLS =
  "whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#9A5B00]";
const ICON_BTN =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:opacity-50";

/* ---------------- HELPERS ---------------- */
const getToday = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
};

const formatDate = (date) => {
  if (!date) return "-";
  const d = new Date(`${String(date).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const getDefaultForm = () => ({
  marketName: "", description: "", drawDate: getToday(), drawTime: "18:30",
  firstPrize: "", secondPrize: "", thirdPrize: "",
});

const getErrorMessage = (error, fallback) => {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  return error?.message || error?.error || error?.data?.message || error?.data?.error || fallback;
};

const getConfigFromResponse = (r) => r?.data || r?.config || r?.lottery || r;

const getStatusBadge = (active) =>
  active
    ? { label: "Active", cls: "bg-[#E6F6EF] text-[#12A36B] ring-[#12A36B]/30" }
    : { label: "Inactive", cls: "bg-[#FFEFA8] text-[#9A5B00] ring-[#F2B705]/60" };

/* ---------------- COMPONENT ---------------- */
const AdminFestivalLottery = () => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const {
    configs = [], config = null, loading = false, configLoading = false,
    createLoading = false, updateLoading = false, activateLoading = false,
    deactivateLoading = false, deleteLoading = false,
    error = null, configError = null, createError = null, updateError = null,
    activateError = null, deactivateError = null, deleteError = null,
    createSuccess = null, updateSuccess = null, activateSuccess = null,
    deactivateSuccess = null, deleteSuccess = null,
  } = useSelector((state) => state.festivalLottery || {});

  const lotteries = Array.isArray(configs) ? configs : [];

  const [formData, setFormData] = useState(getDefaultForm());
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [formModal, setFormModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const busy = loading || configLoading || createLoading || updateLoading ||
    activateLoading || deactivateLoading || deleteLoading;

  const apiError = createError || updateError || activateError || deactivateError ||
    deleteError || configError || error;
  const apiSuccess = createSuccess || updateSuccess || activateSuccess ||
    deactivateSuccess || deleteSuccess;

  useEffect(() => {
    dispatch(getAllLotteryConfigs());
  }, [dispatch]);

  useEffect(() => {
    if (apiError) setValidationError(getErrorMessage(apiError, "Something went wrong."));
  }, [apiError]);

  useEffect(() => {
    if (apiSuccess)
      setSuccessMessage(typeof apiSuccess === "string" ? apiSuccess : "Operation successful.");
  }, [apiSuccess]);

  const filteredLotteries = useMemo(
    () =>
      lotteries.filter((item) => {
        const matchesSearch = searchTerm
          ? String(item.marketName || "").toLowerCase().includes(searchTerm.toLowerCase())
          : true;
        const status = item.isActive ? "active" : "inactive";
        return matchesSearch && (statusFilter === "all" || statusFilter === status);
      }),
    [lotteries, searchTerm, statusFilter]
  );

  /* ---------- FORM ---------- */
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetForm = () => {
    setFormData(getDefaultForm());
    setEditingId(null);
    handleRemoveImage();
  };

  const openCreateModal = () => {
    resetForm();
    setValidationError("");
    setSuccessMessage("");
    // ✅ clear any stale update error/success from previous edit attempt
    dispatch(clearCreateLotteryError());
    dispatch(clearCreateLotterySuccess());
    dispatch(clearUpdateLotteryError());
    dispatch(clearUpdateLotterySuccess());
    setFormModal(true);
  };

  const closeFormModal = () => {
    setFormModal(false);
    setValidationError("");
    resetForm();
    dispatch(clearCreateLotteryError());
    dispatch(clearCreateLotterySuccess());
    dispatch(clearUpdateLotteryError());
    dispatch(clearUpdateLotterySuccess());
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setValidationError("");
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setValidationError("");
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    if (!formData.marketName.trim()) return "Festival name is required.";
    if (!formData.drawDate) return "Draw date is required.";
    if (!formData.drawTime) return "Draw time is required.";

    const selected = new Date(`${formData.drawDate}T00:00:00`);
    if (Number.isNaN(selected.getTime())) return "Invalid draw date.";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selected < today) return "Past draw date cannot be selected.";

    for (const [label, value] of [
      ["First", formData.firstPrize],
      ["Second", formData.secondPrize],
      ["Third", formData.thirdPrize],
    ]) {
      if (value === "" || value === null || value === undefined) return `${label} prize is required.`;
      const amount = Number(value);
      if (!Number.isFinite(amount) || amount < 0) return `Invalid ${label.toLowerCase()} prize.`;
    }

    if (!editingId && !imageFile) return "Banner / Poster image is required.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    const validation = validateForm();
    if (validation) return setValidationError(validation);

    const selected = new Date(`${formData.drawDate}T00:00:00`);

    // ✅ FIXED: image is null when editing without picking a new file.
    // Reducer will skip appending it, backend keeps existing image.
    const payload = {
      marketName: formData.marketName.trim(),
      month: selected.getMonth() + 1,
      year: selected.getFullYear(),
      drawDate: formData.drawDate,
      drawTime: formData.drawTime,
      prizes: {
        first: Number(formData.firstPrize),
        second: Number(formData.secondPrize),
        third: Number(formData.thirdPrize),
      },
      image: imageFile || null,
    };

    try {
      if (editingId) {
        await dispatch(
          updateLotteryConfig({ id: editingId, lotteryData: payload })
        ).unwrap();
        setSuccessMessage("Festival lottery updated successfully.");
      } else {
        await dispatch(createLotteryConfig(payload)).unwrap();
        setSuccessMessage(
          "Festival lottery created successfully. It is inactive until you activate it."
        );
      }

      closeFormModal();

      // ✅ FIXED: refresh should not overwrite success/error state.
      // If refresh fails, we still keep the create/update success visible.
      try {
        await dispatch(getAllLotteryConfigs()).unwrap();
      } catch (refreshErr) {
        // Silent — the create/update already succeeded.
        console.warn("Festival lottery refresh failed:", refreshErr);
      }
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
    if (!id) return setValidationError("Invalid lottery configuration.");

    setValidationError("");
    setSuccessMessage("");

    try {
      const result = await dispatch(getLotteryConfigById(id)).unwrap();
      const f = getConfigFromResponse(result);
      setEditingId(f?._id || id);
      setFormData({
        marketName: f?.marketName || "",
        description: f?.description || "",
        drawDate: f?.drawDate ? String(f.drawDate).slice(0, 10) : getToday(),
        drawTime: f?.drawTime || "18:30",
        firstPrize: String(f?.prizes?.first ?? ""),
        secondPrize: String(f?.prizes?.second ?? ""),
        thirdPrize: String(f?.prizes?.third ?? ""),
      });
      setImagePreview(f?.imageUrl || null);
      setImageFile(null);
      // ✅ reset stale update error before opening edit modal
      dispatch(clearUpdateLotteryError());
      dispatch(clearUpdateLotterySuccess());
      setFormModal(true);
    } catch (err) {
      setValidationError(
        getErrorMessage(err, "Failed to load lottery configuration.")
      );
    }
  };

  const handleView = async (lottery) => {
    const id = lottery?._id || lottery?.id;
    if (!id) return setValidationError("Invalid lottery configuration.");
    setValidationError("");
    setSuccessMessage("");
    try {
      await dispatch(getLotteryConfigById(id)).unwrap();
      setViewModal(true);
    } catch (err) {
      setValidationError(getErrorMessage(err, "Failed to load lottery details."));
    }
  };

  const handleToggleStatus = async (lottery) => {
    const id = lottery?._id || lottery?.id;
    if (!id) return setValidationError("Invalid lottery configuration.");
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

      try {
        await dispatch(getAllLotteryConfigs()).unwrap();
      } catch (refreshErr) {
        console.warn("Festival lottery refresh failed:", refreshErr);
      }
    } catch (err) {
      setValidationError(getErrorMessage(err, "Failed to update lottery status."));
    }
  };

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

      try {
        await dispatch(getAllLotteryConfigs()).unwrap();
      } catch (refreshErr) {
        console.warn("Festival lottery refresh failed:", refreshErr);
      }

      if (editingId === deleteId) closeFormModal();
      setSuccessMessage("Festival lottery deleted successfully.");
      handleCloseDelete();
    } catch (err) {
      setValidationError(getErrorMessage(err, "Failed to delete festival lottery."));
    }
  };

  const viewedConfig = config || null;

  /* ---------------- RENDER ---------------- */
  return (
    <div className="min-h-screen bg-[#FFFDF7] p-4 md:p-6">
      <div className="mx-auto max-w-[1400px]">
        {/* HEADER */}
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#1A1A1A]">
              Festival Lottery
            </h1>
            <p className="mt-1 text-sm text-[#6B7280]">
              Manage festival draws, prizes, banners and publish results.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm ${GOLD_BTN}`}
          >
            <Plus size={16} /> Add Festival Lottery
          </button>
        </div>

        {/* HERO BANNER */}
        <div className="relative mb-6 overflow-hidden rounded-2xl border border-[#F3E7C4] shadow-[0_10px_30px_-15px_rgba(247,181,0,0.5)]">
          <div className="relative h-[170px] w-full bg-gradient-to-r from-[#3A0D0D] via-[#7A1F0A] to-[#3A0D0D] md:h-[210px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(255,216,61,0.4),transparent_50%),radial-gradient(circle_at_85%_50%,rgba(255,216,61,0.3),transparent_50%)]" />
            <Gift size={90} className="absolute bottom-3 left-6 hidden text-[#FFD83D]/70 md:block" />
            <Trophy size={90} className="absolute bottom-3 right-6 hidden text-[#FFD83D]/70 md:block" />
            <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
              <p className="text-[11px] font-bold tracking-[0.3em] text-[#FFD83D]">
                BHARAT LOTTERY
              </p>
              <h2 className="mt-2 bg-gradient-to-b from-[#FFF3B0] via-[#FFD83D] to-[#E39A00] bg-clip-text text-4xl font-black tracking-tight text-transparent md:text-6xl">
                FESTIVAL LOTTERY
              </h2>
              <p className="mt-3 text-[10px] font-semibold tracking-[0.2em] text-[#FFEFA8] md:text-sm">
                SPECIAL DRAWS • BIGGER PRIZES • FESTIVE BONANZA
              </p>
            </div>
          </div>
        </div>

        {/* MESSAGES */}
        {successMessage && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-[#12A36B]/30 bg-[#E6F6EF] px-4 py-3 text-sm font-medium text-[#0E7A52]">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={17} />
              {successMessage}
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              className="text-lg font-bold"
            >
              ×
            </button>
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

        {/* DRAW LIST */}
        <div className={CARD_CLS}>
          <div className="flex items-center justify-between border-b border-[#F3E7C4] p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFEFA8] text-[#9A5B00]">
                <Ticket size={16} />
              </div>
              <h2 className="text-base font-black text-[#1A1A1A]">
                Festival Draw List
              </h2>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#F2B705] bg-white px-3 py-1.5 text-xs font-bold text-[#9A5B00] hover:bg-[#FFEFA8]/60 disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>

          {/* FILTERS */}
          <div className="flex flex-col gap-2 border-b border-[#F3E7C4] p-4 md:flex-row md:items-center">
            <div className="relative md:w-44">
              <Filter
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9A5B00]"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none rounded-lg border border-[#F3E7C4] bg-[#FFFDF7] py-2 pl-8 pr-7 text-xs font-semibold outline-none focus:border-[#F2B705]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="relative flex-1">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9A5B00]"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search festival lottery..."
                className="w-full rounded-lg border border-[#F3E7C4] bg-[#FFFDF7] py-2 pl-8 pr-3 text-xs outline-none placeholder:text-[#8A8F98] focus:border-[#F2B705]"
              />
            </div>
          </div>

          {/* TABLE */}
          {loading && lotteries.length === 0 ? (
            <div className="flex min-h-[220px] items-center justify-center text-sm text-[#6B7280]">
              Loading festival lotteries...
            </div>
          ) : filteredLotteries.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFEFA8] ring-2 ring-[#F2B705]">
                <Ticket size={25} />
              </div>
              <h3 className="mt-4 text-base font-bold">
                No festival lotteries found
              </h3>
              <p className="mt-1 text-sm text-[#6B7280]">
                Click "Add Festival Lottery" to create one.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-[#F3E7C4] bg-[#FFF9E3]">
                    <th className={TH_CLS}>#</th>
                    <th className={TH_CLS}>Festival Name</th>
                    <th className={TH_CLS}>Banner</th>
                    <th className={TH_CLS}>Draw Date &amp; Time</th>
                    <th className={TH_CLS}>Total Prize</th>
                    <th className={TH_CLS}>Status</th>
                    <th className={`${TH_CLS} !text-right`}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLotteries.map((item, index) => {
                    const id = item?._id || item?.id;
                    const total =
                      Number(item.prizes?.first || 0) +
                      Number(item.prizes?.second || 0) +
                      Number(item.prizes?.third || 0);
                    const badge = getStatusBadge(item.isActive);

                    return (
                      <tr
                        key={id || index}
                        className="border-b border-[#F3E7C4] last:border-0 hover:bg-[#FFFDF7]"
                      >
                        <td className="px-4 py-3 text-sm text-[#8A8F98]">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#1A1A1A]">
                          {item.marketName || "-"}
                        </td>
                        <td className="px-4 py-3">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.marketName}
                              className="h-10 w-20 rounded-lg border border-[#F3E7C4] object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-20 items-center justify-center rounded-lg border border-dashed border-[#F3E7C4] bg-[#FFF9E3] text-[#9A5B00]">
                              <ImageIcon size={16} />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays size={13} className="text-[#9A5B00]" />
                            {formatDate(item.drawDate)}
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-[#9A5B00]">
                            <Clock3 size={13} />
                            {item.drawTime || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-black text-[#D93025]">
                          ₹{total.toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              title="View"
                              onClick={() => handleView(item)}
                              disabled={busy}
                              className={`${ICON_BTN} border-[#F2B705] bg-white text-[#9A5B00] hover:bg-[#FFEFA8]/60`}
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              title="Edit"
                              onClick={() => handleEdit(item)}
                              disabled={busy}
                              className={`${ICON_BTN} border-[#F2B705] bg-white text-[#9A5B00] hover:bg-[#FFEFA8]/60`}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              title={item.isActive ? "Deactivate" : "Activate"}
                              onClick={() => handleToggleStatus(item)}
                              disabled={activateLoading || deactivateLoading}
                              className={`${ICON_BTN} ${
                                item.isActive
                                  ? "border-[#F2B705] bg-[#FFEFA8] text-[#9A5B00] hover:bg-[#FFE680]"
                                  : "border-[#12A36B]/40 bg-[#E6F6EF] text-[#12A36B] hover:bg-[#D3EFE2]"
                              }`}
                            >
                              <Power size={14} />
                            </button>
                            <button
                              type="button"
                              title="Delete"
                              onClick={() => handleOpenDelete(id)}
                              disabled={deleteLoading}
                              className={`${ICON_BTN} border-[#D93025]/30 bg-[#FDE8E6] text-[#D93025] hover:bg-[#FAD2CE]`}
                            >
                              <Trash2 size={14} />
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

      {/* ================= CREATE / EDIT POPUP ================= */}
      {formModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 md:p-6">
          <div className="my-4 w-full max-w-2xl rounded-2xl border border-[#F3E7C4] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#F3E7C4] p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFEFA8] text-[#9A5B00]">
                  <Gift size={16} />
                </div>
                <div>
                  <h2 className="text-base font-black">
                    {editingId
                      ? "Edit Festival Lottery"
                      : "Create Festival Lottery"}
                  </h2>
                  <p className="text-[11px] text-[#8A8F98]">
                    Fill the details and save.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeFormModal}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#F3E7C4] text-[#9A5B00] hover:bg-[#FFEFA8]/60"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-4">
              {validationError && (
                <div className="rounded-lg bg-[#FDE8E6] px-3 py-2 text-xs font-semibold text-[#B3261E]">
                  {validationError}
                </div>
              )}

              <div>
                <label className={LABEL_CLS}>Festival Name</label>
                <input
                  type="text"
                  name="marketName"
                  value={formData.marketName}
                  onChange={handleFormChange}
                  maxLength={100}
                  disabled={busy}
                  placeholder="e.g. Diwali Bumper Lottery"
                  className={INPUT_CLS}
                />
              </div>

              <div>
                <label className={LABEL_CLS}>Short Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows={2}
                  disabled={busy}
                  placeholder="Enter short description..."
                  className={`${INPUT_CLS} resize-none`}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className={LABEL_CLS}>Draw Date</label>
                  <input
                    type="date"
                    name="drawDate"
                    value={formData.drawDate}
                    min={getToday()}
                    onChange={handleFormChange}
                    disabled={busy}
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>Draw Time</label>
                  <input
                    type="time"
                    name="drawTime"
                    value={formData.drawTime}
                    onChange={handleFormChange}
                    disabled={busy}
                    className={INPUT_CLS}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-[#F3E7C4] bg-[#FFF9E3] p-3">
                <p className="mb-2 text-xs font-bold">Prizes</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {[
                    { name: "firstPrize", label: "1st Prize" },
                    { name: "secondPrize", label: "2nd Prize" },
                    { name: "thirdPrize", label: "3rd Prize" },
                  ].map((p) => (
                    <div key={p.name}>
                      <label className={LABEL_CLS}>{p.label}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#9A5B00]">
                          ₹
                        </span>
                        <input
                          type="number"
                          name={p.name}
                          value={formData[p.name]}
                          min="0"
                          step="1"
                          onChange={handleFormChange}
                          disabled={busy}
                          placeholder="0"
                          className={`${INPUT_CLS} !pl-7 bg-white`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className={LABEL_CLS}>Banner / Poster</label>
                <div className="rounded-xl border border-dashed border-[#F2B705] bg-[#FFF9E3] p-4">
                  {imagePreview ? (
                    <div className="space-y-3">
                      <img
                        src={imagePreview}
                        alt="Banner preview"
                        className="mx-auto max-h-40 rounded-lg border border-[#F3E7C4] object-contain"
                      />
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={busy}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs ${GOLD_BTN}`}
                        >
                          <Upload size={13} /> Change
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#D93025]/30 bg-white px-3 py-1.5 text-xs font-bold text-[#D93025] hover:bg-[#FDE8E6]"
                        >
                          <X size={13} /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <ImageIcon size={26} className="text-[#9A5B00]" />
                        <div>
                          <p className="text-xs font-bold">
                            Upload Banner Image
                          </p>
                          <p className="text-[10px] text-[#8A8F98]">
                            Recommended size: 1200 x 400 px
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={busy}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs ${GOLD_BTN}`}
                      >
                        <Upload size={13} /> Upload
                      </button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageChange}
                    disabled={busy}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="flex gap-2 border-t border-[#F3E7C4] pt-4">
                <button
                  type="button"
                  onClick={closeFormModal}
                  disabled={busy}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm disabled:opacity-60 ${OUTLINE_BTN}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className={`flex-[1.5] rounded-xl px-4 py-2.5 text-sm disabled:opacity-60 ${GOLD_BTN}`}
                >
                  {editingId
                    ? updateLoading
                      ? "Updating..."
                      : "Update Festival Lottery"
                    : createLoading
                    ? "Saving..."
                    : "Save Festival Lottery"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= VIEW POPUP ================= */}
      {viewModal && viewedConfig && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 md:p-6">
          <div className="my-4 w-full max-w-3xl rounded-2xl border border-[#F3E7C4] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#F3E7C4] p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFEFA8] text-[#9A5B00]">
                  <Eye size={16} />
                </div>
                <div>
                  <h2 className="text-base font-black">
                    {viewedConfig.marketName || "Festival Lottery"}
                  </h2>
                  <p className="text-[11px] text-[#8A8F98]">
                    Festival lottery details and user entries.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewModal(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#F3E7C4] text-[#9A5B00] hover:bg-[#FFEFA8]/60"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
              {[
                { l: "Draw Date", v: formatDate(viewedConfig.drawDate) },
                { l: "Draw Time", v: viewedConfig.drawTime || "-" },
                { l: "Status", v: getStatusBadge(viewedConfig.isActive).label },
              ].map((c) => (
                <div
                  key={c.l}
                  className="rounded-xl border border-[#F3E7C4] bg-[#FFF9E3] p-3"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#9A5B00]">
                    {c.l}
                  </p>
                  <p className="mt-1 text-sm font-bold">{c.v}</p>
                </div>
              ))}
            </div>

            {viewedConfig.imageUrl && (
              <div className="px-4">
                <img
                  src={viewedConfig.imageUrl}
                  alt={viewedConfig.marketName}
                  className="max-h-52 w-full rounded-xl border border-[#F3E7C4] object-cover"
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
              {[
                { label: "1st Prize", val: viewedConfig.prizes?.first },
                { label: "2nd Prize", val: viewedConfig.prizes?.second },
                { label: "3rd Prize", val: viewedConfig.prizes?.third },
              ].map((p) => (
                <div
                  key={p.label}
                  className="rounded-xl border border-[#F2B705]/50 bg-[#FFEFA8]/60 p-3 text-center"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#9A5B00]">
                    {p.label}
                  </p>
                  <p className="mt-1 text-lg font-black text-[#1A1204]">
                    ₹{Number(p.val || 0).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-[#F3E7C4] p-4">
              <div className="mb-3 flex items-center gap-2">
                <BarChart3 size={15} className="text-[#9A5B00]" />
                <h3 className="text-sm font-black">
                  User Entries ({viewedConfig.users?.length || 0})
                </h3>
              </div>
              <div className="overflow-x-auto rounded-xl border border-[#F3E7C4]">
                {viewedConfig.users?.length > 0 ? (
                  <table className="w-full min-w-[500px]">
                    <thead className="bg-[#FFF9E3]">
                      <tr>
                        <th className={TH_CLS}>#</th>
                        <th className={TH_CLS}>Number</th>
                        <th className={TH_CLS}>Amount</th>
                        <th className={TH_CLS}>Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3E7C4]">
                      {viewedConfig.users.map((entry, i) => (
                        <tr
                          key={entry._id || i}
                          className="bg-white hover:bg-[#FFFDF7]"
                        >
                          <td className="px-4 py-3 text-sm text-[#8A8F98]">
                            {i + 1}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full bg-[#FFEFA8] px-3 py-1 text-xs font-black tracking-wider ring-1 ring-[#F2B705]/60">
                              {entry.number}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold">
                            ₹{Number(entry.amount || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3">
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
                  <div className="bg-white p-6 text-center text-sm text-[#6B7280]">
                    No user entries found.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end border-t border-[#F3E7C4] p-4">
              <button
                type="button"
                onClick={() => setViewModal(false)}
                className={`rounded-xl px-4 py-2 text-sm ${OUTLINE_BTN}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE POPUP ================= */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#F3E7C4] bg-white p-6 shadow-xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FDE8E6] text-[#D93025]">
              <Trash2 size={20} />
            </div>
            <h2 className="mt-4 text-lg font-black">
              Delete Festival Lottery
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#6B7280]">
              Are you sure you want to delete this festival lottery? This
              action cannot be undone and its stored entries will also be
              removed.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseDelete}
                disabled={deleteLoading}
                className={`rounded-xl px-4 py-2.5 text-sm disabled:opacity-50 ${OUTLINE_BTN}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="rounded-xl bg-[#D93025] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#B3261E] disabled:opacity-60"
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