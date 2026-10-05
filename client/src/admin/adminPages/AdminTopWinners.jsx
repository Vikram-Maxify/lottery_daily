import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Trophy,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  Upload,
  Trash2,
  Edit3,
  Calendar,
  Ticket,
  IndianRupee,
  Eye,
  RefreshCw,
  Power,
  Users,
  Sparkles,
  Check,
} from "lucide-react";

import {
  clearTopWinnerErrors,
  clearTopWinnerSuccess,
  createTopWinner,
  deleteTopWinner,
  getAllTopWinners,
  selectAllTopWinners,
  selectTopWinnerActionLoading,
  selectTopWinnerError,
  selectTopWinnerLoading,
  selectTopWinnerSuccessMessage,
  toggleTopWinnerStatus,
  updateTopWinner,
} from "../../reducer/slice/topWinnerSlice";

// =====================================================
// ASSET AVATARS FOR WINNERS
// =====================================================
import avatar1 from "../../assets/avatar1.png";
import avatar2 from "../../assets/avatar2.png";
import five from "../../assets/five.png";
import four from "../../assets/four.png";
import one from "../../assets/one.png";
import six from "../../assets/six.png";
import three from "../../assets/three.png";
import two from "../../assets/two.png";

const PRESET_AVATARS = [
  { id: "avatar1", src: avatar1, label: "Avatar 1" },
  { id: "avatar2", src: avatar2, label: "Avatar 2" },
  { id: "one", src: one, label: "Avatar 3" },
  { id: "two", src: two, label: "Avatar 4" },
  { id: "three", src: three, label: "Avatar 5" },
  { id: "four", src: four, label: "Avatar 6" },
  { id: "five", src: five, label: "Avatar 7" },
  { id: "six", src: six, label: "Avatar 8" },
];

/* =========================================================
   WINZOX THEME TOKENS
   bg: #FFFDF7, border: #F3E7C4, gold: #FFD83D -> #F7B500 -> #E39A00
   text: #1A1A1A, muted: #6B7280, brown: #9A5B00, danger: #D93025
========================================================= */

const AdminTopWinners = () => {
  const dispatch = useDispatch();

  // Redux state
  const winners = useSelector(selectAllTopWinners);
  const loading = useSelector(selectTopWinnerLoading);
  const actionLoading = useSelector(selectTopWinnerActionLoading);
  const error = useSelector(selectTopWinnerError);
  const successMessage = useSelector(selectTopWinnerSuccessMessage);

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'inactive'

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWinner, setEditingWinner] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    ticketNumber: "",
    winningAmount: "",
    wonAt: "",
    isActive: true,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [formError, setFormError] = useState("");

  // Fetch all winners on mount
  useEffect(() => {
    dispatch(getAllTopWinners());
  }, [dispatch]);

  // Auto clear success message after 4 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        dispatch(clearTopWinnerSuccess());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingWinner(null);
    const now = new Date();
    // format as YYYY-MM-DDTHH:mm for datetime-local
    const pad = (n) => String(n).padStart(2, "0");
    const localDateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

    setFormData({
      name: "",
      ticketNumber: "",
      winningAmount: "",
      wonAt: localDateTime,
      isActive: true,
    });
    setSelectedFile(null);
    setSelectedPresetId(null);
    setImagePreview("");
    setFormError("");
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (winner) => {
    setEditingWinner(winner);
    const d = new Date(winner.wonAt);
    const pad = (n) => String(n).padStart(2, "0");
    const localDateTime = !isNaN(d.getTime())
      ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
          d.getDate()
        )}T${pad(d.getHours())}:${pad(d.getMinutes())}`
      : "";

    setFormData({
      name: winner.name || "",
      ticketNumber: winner.ticketNumber || "",
      winningAmount: winner.winningAmount || "",
      wonAt: localDateTime,
      isActive: winner.isActive ?? true,
    });
    setSelectedFile(null);
    setSelectedPresetId(null);
    setImagePreview(winner.image || "");
    setFormError("");
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    if (actionLoading) return;
    setIsModalOpen(false);
    setEditingWinner(null);
    setSelectedFile(null);
    setSelectedPresetId(null);
    setImagePreview("");
    setFormError("");
  };

  // Handle image file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setFormError("Please select a valid image file (JPG, PNG, WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError("Image size must be less than 5 MB");
      return;
    }

    setFormError("");
    setSelectedPresetId(null);
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Handle Preset Avatar selection
  const handleSelectPreset = async (preset) => {
    setSelectedPresetId(preset.id);
    setImagePreview(preset.src);
    setFormError("");

    try {
      const res = await fetch(preset.src);
      const blob = await res.blob();
      const file = new File([blob], `${preset.id}.png`, { type: "image/png" });
      setSelectedFile(file);
    } catch (err) {
      console.warn("Could not convert preset to file:", err);
      setFormError("Failed to select preset avatar. Please try uploading an image.");
    }
  };

  // Handle Form Submission (Create or Update)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Please enter winner name");
      return;
    }

    if (!formData.ticketNumber.trim()) {
      setFormError("Please enter winning ticket number");
      return;
    }

    if (
      formData.winningAmount === "" ||
      isNaN(formData.winningAmount) ||
      Number(formData.winningAmount) < 0
    ) {
      setFormError("Please enter a valid winning amount");
      return;
    }

    if (!formData.wonAt) {
      setFormError("Please select winning date and time");
      return;
    }

    if (!editingWinner && !selectedFile) {
      setFormError("Please select a winner image");
      return;
    }

    const payload = new FormData();
    payload.append("name", formData.name.trim());
    payload.append("ticketNumber", formData.ticketNumber.trim());
    payload.append("winningAmount", Number(formData.winningAmount));
    payload.append("wonAt", new Date(formData.wonAt).toISOString());
    payload.append("isActive", formData.isActive);

    if (selectedFile) {
      payload.append("image", selectedFile);
    }

    if (editingWinner) {
      const result = await dispatch(
        updateTopWinner({ id: editingWinner._id, formData: payload })
      );
      if (updateTopWinner.fulfilled.match(result)) {
        setIsModalOpen(false);
      } else {
        setFormError(result.payload || "Failed to update top winner");
      }
    } else {
      const result = await dispatch(createTopWinner(payload));
      if (createTopWinner.fulfilled.match(result)) {
        setIsModalOpen(false);
      } else {
        setFormError(result.payload || "Failed to create top winner");
      }
    }
  };

  // Toggle active status
  const handleToggleStatus = (id) => {
    dispatch(toggleTopWinnerStatus(id));
  };

  // Delete winner
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteTopWinner(deleteTarget._id));
    if (deleteTopWinner.fulfilled.match(result)) {
      setDeleteTarget(null);
    }
  };

  // Filtered and searched winners
  const filteredWinners = useMemo(() => {
    return winners.filter((winner) => {
      const matchesSearch =
        winner.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        winner.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && winner.isActive) ||
        (statusFilter === "inactive" && !winner.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [winners, searchQuery, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = winners.length;
    const active = winners.filter((w) => w.isActive).length;
    const inactive = total - active;
    const totalAmount = winners.reduce(
      (sum, w) => sum + (Number(w.winningAmount) || 0),
      0
    );
    return { total, active, inactive, totalAmount };
  }, [winners]);

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER SECTION
      ====================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFD83D] to-[#E39A00] text-[#1A1204] shadow-[0_4px_12px_rgba(247,181,0,0.4)]">
              <Trophy size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#1A1A1A]">
                Top Winners Management
              </h1>
              <p className="text-xs font-medium text-[#6B7280]">
                Manage real winners shown in the homepage marquee ribbon
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch(getAllTopWinners())}
            disabled={loading}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#F3E7C4] bg-white text-[#9A5B00] shadow-sm transition hover:bg-[#FFEFA8]/50 disabled:opacity-50"
            title="Refresh Winners"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : "transition active:rotate-180"}
            />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] px-4 py-2.5 text-xs font-black text-[#1A1204] shadow-[0_8px_18px_-4px_rgba(227,154,0,0.7)] transition active:scale-[0.98] hover:brightness-105"
          >
            <Plus size={16} className="stroke-[3]" />
            Add New Winner
          </button>
        </div>
      </div>

      {/* =====================================================
          NOTIFICATIONS / ALERTS
      ====================================================== */}
      {successMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => dispatch(clearTopWinnerSuccess())}
            className="rounded p-1 text-emerald-700 hover:bg-emerald-100"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-red-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => dispatch(clearTopWinnerErrors())}
            className="rounded p-1 text-red-700 hover:bg-red-100"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* =====================================================
          STATS COUNTERS
      ====================================================== */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Total Winners */}
        <div className="rounded-2xl border border-[#F3E7C4] bg-white p-4 shadow-[0_4px_16px_-6px_rgba(247,181,0,0.2)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280]">Total Winners</span>
            <Users size={16} className="text-[#9A5B00]" />
          </div>
          <p className="mt-2 text-2xl font-black text-[#1A1A1A]">{stats.total}</p>
        </div>

        {/* Active Winners */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-[0_4px_16px_-6px_rgba(16,185,129,0.15)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">Active (Live)</span>
            <Sparkles size={16} className="text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-700">{stats.active}</p>
        </div>

        {/* Inactive Winners */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-[0_4px_16px_-6px_rgba(245,158,11,0.15)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">Inactive</span>
            <Power size={16} className="text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-700">{stats.inactive}</p>
        </div>

        {/* Total Distributed */}
        <div className="rounded-2xl border border-[#F3E7C4] bg-gradient-to-br from-[#FFFDF7] to-[#FFEFA8]/40 p-4 shadow-[0_4px_16px_-6px_rgba(247,181,0,0.2)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#9A5B00]">Total Won</span>
            <IndianRupee size={16} className="text-[#9A5B00]" />
          </div>
          <p className="mt-2 text-2xl font-black text-[#1A1A1A]">
            ₹{stats.totalAmount.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* =====================================================
          CONTROLS (SEARCH & FILTER)
      ====================================================== */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#F3E7C4] bg-white p-3.5 shadow-[0_4px_16px_-6px_rgba(247,181,0,0.15)] sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A5B00]"
          />
          <input
            type="text"
            placeholder="Search winner by name or ticket number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] py-2 pl-9 pr-3 text-xs font-medium text-[#1A1A1A] outline-none transition focus:border-[#F2B705] focus:ring-2 focus:ring-[#FFEFA8]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <Filter size={14} className="text-[#9A5B00]" />
          {["all", "active", "inactive"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition ${
                statusFilter === status
                  ? "bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] text-[#1A1204] shadow-sm"
                  : "bg-[#FFFDF7] text-[#6B7280] border border-[#F3E7C4] hover:bg-[#FFEFA8]/50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* =====================================================
          WINNERS TABLE / LIST
      ====================================================== */}
      <div className="overflow-hidden rounded-2xl border border-[#F3E7C4] bg-white shadow-[0_6px_20px_-8px_rgba(247,181,0,0.25)]">
        {loading && winners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <RefreshCw size={32} className="animate-spin text-[#F7B500]" />
            <p className="mt-3 text-sm font-bold text-[#1A1A1A]">
              Loading Top Winners...
            </p>
          </div>
        ) : filteredWinners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFEFA8]/50 text-[#9A5B00]">
              <Trophy size={28} />
            </div>
            <p className="mt-3 text-base font-bold text-[#1A1A1A]">
              No Top Winners Found
            </p>
            <p className="mt-1 text-xs text-[#6B7280]">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search query or filter"
                : "Click 'Add New Winner' to create your first top winner entry"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#F3E7C4] bg-[#FFFDF7] text-[11px] font-black uppercase tracking-wider text-[#9A5B00]">
                <tr>
                  <th className="px-5 py-3.5">Winner</th>
                  <th className="px-5 py-3.5">Ticket #</th>
                  <th className="px-5 py-3.5">Winning Amount</th>
                  <th className="px-5 py-3.5">Date & Time</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3E7C4]/60">
                {filteredWinners.map((winner) => (
                  <tr
                    key={winner._id}
                    className="transition hover:bg-[#FFFDF7]/80"
                  >
                    {/* Winner Info */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={winner.image}
                          alt={winner.name}
                          className="h-10 w-10 shrink-0 rounded-full border-2 border-[#F7B500] object-cover shadow-sm"
                          onError={(e) => {
                            e.target.src =
                              "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80";
                          }}
                        />
                        <div className="min-w-0">
                          <p className="truncate font-bold text-[#1A1A1A]">
                            {winner.name}
                          </p>
                          <span className="text-[10px] text-[#6B7280]">
                            ID: {winner._id.slice(-6)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Ticket */}
                    <td className="px-5 py-3.5 font-mono">
                      <span className="inline-flex items-center gap-1 rounded-lg border border-[#F3E7C4] bg-[#FFFDF7] px-2.5 py-1 font-bold tracking-wider text-[#1A1A1A]">
                        <Ticket size={12} className="text-[#9A5B00]" />
                        {winner.ticketNumber}
                      </span>
                    </td>

                    {/* Winning Amount */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-black text-[#D93025]">
                        ₹{Number(winner.winningAmount).toLocaleString("en-IN")}
                      </span>
                    </td>

                    {/* Won At */}
                    <td className="px-5 py-3.5 text-[#6B7280]">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar size={13} className="text-[#9A5B00]" />
                        <span>
                          {new Date(winner.wonAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(winner.wonAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Status Toggle */}
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => handleToggleStatus(winner._id)}
                        disabled={actionLoading}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition ${
                          winner.isActive
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                        title="Click to toggle active status"
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            winner.isActive ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                          }`}
                        />
                        {winner.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(winner)}
                          disabled={actionLoading}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#F3E7C4] bg-[#FFFDF7] text-[#9A5B00] transition hover:bg-[#FFEFA8] hover:text-[#1A1A1A]"
                          title="Edit Winner"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(winner)}
                          disabled={actionLoading}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                          title="Delete Winner"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =====================================================
          ADD / EDIT MODAL
      ====================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-[#F3E7C4] bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-[#F3E7C4] bg-gradient-to-r from-[#FFFDF7] to-[#FFEFA8]/50 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFD83D] to-[#E39A00] text-[#1A1204] shadow-sm">
                  <Trophy size={18} className="stroke-[2.5]" />
                </div>
                <h2 className="text-base font-black text-[#1A1A1A]">
                  {editingWinner ? "Edit Top Winner" : "Add New Top Winner"}
                </h2>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={actionLoading}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitForm} className="space-y-4 overflow-y-auto p-6">
              {formError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Photo Upload & Preset Selection */}
              <div>
                <label className="block text-xs font-bold text-[#1A1A1A]">
                  Winner Photo {editingWinner ? "(Optional to change)" : "*"}
                </label>

                {/* Preset Avatars Suggestions */}
                <div className="mt-2 rounded-2xl border border-[#F3E7C4] bg-[#FFFDF7] p-3 shadow-inner">
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#9A5B00]">
                      Choose from Asset Avatars:
                    </span>
                    <span className="text-[10px] text-[#6B7280]">
                      Click any avatar to select
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                    {PRESET_AVATARS.map((preset) => {
                      const isSelected = selectedPresetId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`group relative flex flex-col items-center justify-center rounded-xl p-1 transition-all ${
                            isSelected
                              ? "bg-gradient-to-b from-[#FFD83D]/40 to-[#F7B500]/40 ring-2 ring-[#F7B500]"
                              : "border border-transparent hover:border-[#F3E7C4] hover:bg-white/80"
                          }`}
                          title={preset.label}
                        >
                          <div className="relative h-11 w-11 overflow-hidden rounded-full border-2 border-white shadow-sm">
                            <img
                              src={preset.src}
                              alt={preset.label}
                              className="h-full w-full object-cover transition-transform group-hover:scale-110"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[0.5px]">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F7B500] text-[#1A1204] shadow-sm">
                                  <Check size={12} className="stroke-[3]" />
                                </div>
                              </div>
                            )}
                          </div>
                          <span className="mt-1 max-w-[50px] truncate text-[9px] font-semibold text-[#6B7280]">
                            {preset.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom File Upload Option */}
                <div className="mt-3 flex items-center gap-4">
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[#F2B705] bg-[#FFFDF7]">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Trophy size={24} className="text-[#F7B500]/50" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#F2B705] bg-[#FFFDF7] px-3.5 py-2 text-xs font-bold text-[#9A5B00] shadow-sm transition hover:bg-[#FFEFA8]">
                        <Upload size={14} />
                        Choose Custom Photo
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      {imagePreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview("");
                            setSelectedFile(null);
                            setSelectedPresetId(null);
                          }}
                          className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-gray-500 hover:bg-gray-50"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-[#6B7280]">
                      Or upload custom image from device (PNG, JPG, WEBP up to 5 MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-[#1A1A1A]">
                  Winner Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rakesh S. or Amit Kumar"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="mt-1.5 w-full rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] px-3.5 py-2.5 text-xs font-medium text-[#1A1A1A] outline-none transition focus:border-[#F2B705] focus:ring-2 focus:ring-[#FFEFA8]"
                />
              </div>

              {/* Ticket Number & Winning Amount */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A]">
                    Ticket Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10F6**** or 78A9412"
                    value={formData.ticketNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, ticketNumber: e.target.value })
                    }
                    required
                    className="mt-1.5 w-full rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] px-3.5 py-2.5 font-mono text-xs font-medium text-[#1A1A1A] outline-none transition focus:border-[#F2B705] focus:ring-2 focus:ring-[#FFEFA8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A]">
                    Winning Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 10000000"
                    value={formData.winningAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        winningAmount: e.target.value,
                      })
                    }
                    required
                    className="mt-1.5 w-full rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] px-3.5 py-2.5 text-xs font-bold text-[#1A1A1A] outline-none transition focus:border-[#F2B705] focus:ring-2 focus:ring-[#FFEFA8]"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div>
                <label className="block text-xs font-bold text-[#1A1A1A]">
                  Won Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.wonAt}
                  onChange={(e) =>
                    setFormData({ ...formData, wonAt: e.target.value })
                  }
                  required
                  className="mt-1.5 w-full rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] px-3.5 py-2.5 text-xs font-medium text-[#1A1A1A] outline-none transition focus:border-[#F2B705] focus:ring-2 focus:ring-[#FFEFA8]"
                />
              </div>

              {/* Active Toggle Switch */}
              <div className="flex items-center justify-between rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-3">
                <div>
                  <p className="text-xs font-bold text-[#1A1A1A]">
                    Show on Homepage Marquee
                  </p>
                  <p className="text-[11px] text-[#6B7280]">
                    Winner will be visible publicly to users
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#F7B500] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={actionLoading}
                  className="rounded-xl border border-[#F3E7C4] bg-white px-4 py-2.5 text-xs font-bold text-[#6B7280] transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] px-5 py-2.5 text-xs font-black text-[#1A1204] shadow-[0_8px_18px_-4px_rgba(227,154,0,0.7)] transition active:scale-[0.98] hover:brightness-105 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : editingWinner ? (
                    "Save Changes"
                  ) : (
                    "Create Winner"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          DELETE CONFIRMATION MODAL
      ====================================================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-red-200 bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <Trash2 size={24} />
            </div>

            <h3 className="mt-4 text-base font-black text-[#1A1A1A]">
              Delete Top Winner?
            </h3>
            <p className="mt-1 text-xs text-[#6B7280]">
              Are you sure you want to delete{" "}
              <span className="font-bold text-[#1A1A1A]">
                {deleteTarget.name}
              </span>{" "}
              (Ticket: {deleteTarget.ticketNumber})? This action cannot be undone.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={actionLoading}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-[#6B7280] hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Winner"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTopWinners;
