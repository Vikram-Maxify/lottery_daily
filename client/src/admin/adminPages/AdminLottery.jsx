import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Calendar,
  Clock,
  Info,
  Hash,
  Trophy,
  ToggleRight,
  Plus,
  X,
  Crown,
  Users,
  ImagePlus,
  Upload,
  ArrowLeft,
  Pencil,
  Eye,
  Trash2,
} from "lucide-react";

import {
  createLotteryConfig,
  getAllLotteryConfigs,
  getLotteryConfigById,
  updateLotteryConfig,
  activateLotteryConfig,
  deactivateLotteryConfig,
  updateUserLotteryEntry,
  deleteUserLotteryEntry,
  deleteLotteryConfig,
  clearLotteryError,
  clearLotteryMessage,
} from "../../reducer/slice/adminLotteryReducer";

import { getAllUsers } from "../../reducer/slice/adminAuthReducer";

/* =========================================================
   THEME
========================================================= */

const GOLD_BTN =
  "bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] text-[#1A1204] font-extrabold shadow-[0_4px_10px_-3px_rgba(227,154,0,0.55),inset_0_1px_0_rgba(255,255,255,0.55)] hover:brightness-105";

const BROWN_BTN =
  "bg-gradient-to-b from-[#C98A1B] to-[#8A5300] text-white font-bold shadow-[0_4px_10px_-3px_rgba(138,83,0,0.6)] hover:brightness-110";

const OUTLINE_BTN =
  "border border-[#F2B705] bg-white font-bold text-[#9A5B00] hover:bg-[#FFEFA8]/60";

const INPUT_CLS =
  "w-full rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] py-2.5 text-sm text-[#1A1A1A] outline-none transition placeholder:text-[#8A8F98] focus:border-[#F2B705] focus:ring-2 focus:ring-[#FFEFA8] disabled:cursor-not-allowed disabled:opacity-80";

const LABEL_CLS = "mb-1.5 block text-xs font-semibold text-[#1A1A1A]";

const CARD_CLS =
  "rounded-2xl border border-[#F3E7C4] bg-white shadow-[0_6px_18px_-10px_rgba(247,181,0,0.35)]";

const TH_CLS =
  "whitespace-nowrap px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-[#9A5B00]";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const getMonthName = (month) => MONTHS[Number(month) - 1] || "-";

const formatDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getToday = () => {
  const now = new Date();
  return (
    `${now.getFullYear()}-` +
    `${String(now.getMonth() + 1).padStart(2, "0")}-` +
    `${String(now.getDate()).padStart(2, "0")}`
  );
};

const toInputDate = (date) => {
  if (!date) return "";
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    return date.slice(0, 10);
  }
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return (
    `${d.getFullYear()}-` +
    `${String(d.getMonth() + 1).padStart(2, "0")}-` +
    `${String(d.getDate()).padStart(2, "0")}`
  );
};

const validateImage = (file) => {
  if (!file) return "No file selected";
  if (!file.type.startsWith("image/")) return "Only image files are allowed";
  if (file.size > 2 * 1024 * 1024) return "Image must be smaller than 2MB";
  return "";
};

const validateLotteryForm = (d, checkPast) => {
  if (!d.marketName.trim()) return "Market name is required";
  if (!d.month) return "Month is required";
  if (!d.year) return "Year is required";
  if (!d.drawDate) return "Draw date is required";
  if (!d.drawTime) return "Draw time is required";

  const selectedDate = new Date(`${d.drawDate}T00:00:00`);
  if (Number.isNaN(selectedDate.getTime())) return "Invalid draw date";

  if (checkPast) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    if (selectedDate < today) return "Past draw date cannot be selected";
  }

  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(d.drawTime)) return "Invalid draw time";

  const bad = (v) => v === "" || v === null || Number(v) < 0;
  if (bad(d.prizes.first)) return "First prize amount is required";
  if (bad(d.prizes.second)) return "Second prize amount is required";
  if (bad(d.prizes.third)) return "Third prize amount is required";

  return "";
};

const buildPayload = (d) => ({
  marketName: d.marketName.trim(),
  month: Number(d.month),
  year: Number(d.year),
  drawDate: d.drawDate,
  drawTime: d.drawTime,
  prizes: {
    first: Number(d.prizes.first),
    second: Number(d.prizes.second),
    third: Number(d.prizes.third),
  },
});

/* ---------- small UI helpers ---------- */

const Panel = ({ id, icon: Icon, title, right, children, className = "" }) => (
  <div id={id} className={`${CARD_CLS} scroll-mt-24 p-5 ${className}`}>
    <div className="mb-4 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-b from-[#FFE46B] to-[#F2B705] shadow-sm">
          <Icon size={16} className="text-[#1A1204]" strokeWidth={2.4} />
        </span>
        <h3 className="text-[16px] font-black text-[#1F2A6B]">{title}</h3>
      </div>
      {right}
    </div>
    {children}
  </div>
);

const Switch = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={onChange}
    className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${
      checked ? "bg-[#12A36B]" : "bg-[#D1D5DB]"
    }`}
  >
    <span
      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
        checked ? "left-[22px]" : "left-0.5"
      }`}
    />
  </button>
);

const ReadField = ({ label, value }) => (
  <div>
    <label className={LABEL_CLS}>{label}</label>
    <input type="text" value={value ?? "-"} readOnly className={`${INPUT_CLS} px-3`} />
  </div>
);

const ModalShell = ({ title, subtitle, onClose, children, wide, z = "z-50" }) => (
  <div
    className={`fixed inset-0 ${z} flex items-start justify-center overflow-y-auto bg-black/50 p-4`}
  >
    <div
      className={`my-6 w-full ${
        wide ? "max-w-7xl" : "max-w-3xl"
      } rounded-2xl border border-[#F3E7C4] bg-white shadow-xl`}
    >
      <div className="flex items-center justify-between border-b border-[#F3E7C4] px-5 py-4">
        <div>
          <h2 className="text-lg font-black text-[#1F2A6B]">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-[#6B7280]">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-[#8A8F98] hover:bg-[#FFF9E3] hover:text-[#1A1A1A]"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const StatusPill = ({ active }) =>
  active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F6EF] px-3 py-1 text-xs font-bold text-[#12A36B]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#12A36B]" />
      Active
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-[#6B7280]">
      Inactive
    </span>
  );

const IconTile = ({ src, name, size = "h-24 w-24", compact = false }) =>
  src ? (
    <img
      src={src}
      alt="Lottery icon"
      className={`${size} shrink-0 rounded-xl object-cover shadow ring-2 ring-white`}
    />
  ) : (
    <div
      className={`${size} flex shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-[#EF4444] to-[#991B1B] text-center shadow ring-2 ring-white`}
    >
      <Crown size={compact ? 16 : 22} className="text-[#FFD83D]" strokeWidth={2} />
      {!compact && (
        <span className="mt-1 line-clamp-2 px-1.5 text-[11px] font-black uppercase leading-tight text-white">
          {name || "Lottery"}
        </span>
      )}
    </div>
  );

const LotteryFields = ({ data, onChange, minDate }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <div className="sm:col-span-2">
      <label className={LABEL_CLS}>Market Name</label>
      <input
        type="text"
        name="marketName"
        value={data.marketName}
        onChange={onChange}
        placeholder="Enter market name"
        className={`${INPUT_CLS} px-3`}
      />
    </div>

    <div>
      <label className={LABEL_CLS}>Month</label>
      <select
        name="month"
        value={data.month}
        onChange={onChange}
        className={`${INPUT_CLS} px-3`}
      >
        {MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </select>
    </div>

    <div>
      <label className={LABEL_CLS}>Year</label>
      <input
        type="number"
        name="year"
        value={data.year}
        onChange={onChange}
        min="2000"
        className={`${INPUT_CLS} px-3`}
      />
    </div>

    <div>
      <label className={LABEL_CLS}>Draw Date</label>
      <input
        type="date"
        name="drawDate"
        value={data.drawDate}
        onChange={onChange}
        min={minDate}
        className={`${INPUT_CLS} px-3`}
      />
    </div>

    <div>
      <label className={LABEL_CLS}>Draw Time</label>
      <input
        type="time"
        name="drawTime"
        value={data.drawTime}
        onChange={onChange}
        className={`${INPUT_CLS} px-3`}
      />
    </div>

    {[
      ["firstPrize", "1st Prize Amount", data.prizes.first],
      ["secondPrize", "2nd Prize Amount", data.prizes.second],
      ["thirdPrize", "3rd Prize Amount", data.prizes.third],
    ].map(([name, label, value], i) => (
      <div key={name} className={i === 2 ? "sm:col-span-2" : ""}>
        <label className={LABEL_CLS}>{label}</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#9A5B00]">
            ₹
          </span>
          <input
            type="number"
            name={name}
            value={value}
            onChange={onChange}
            min="0"
            step="1"
            placeholder={label}
            className={`${INPUT_CLS} pl-8 pr-3`}
          />
        </div>
      </div>
    ))}
  </div>
);

/* =========================================================
   MAIN COMPONENT
========================================================= */

const AdminLottery = () => {
  const dispatch = useDispatch();

  const {
    lotteries,
    lottery,
    loading,
    createLoading,
    updateLoading,
    deleteLoading,
    actionLoading,
    error,
    message,
  } = useSelector((state) => state.adminLottery);

  const { users = [], usersLoading } = useSelector((state) => state.adminAuth);

  /* ---------- user lookup ---------- */

  const userMap = useMemo(() => {
    const map = {};
    (users || []).forEach((u) => {
      if (u?._id) map[String(u._id)] = u;
      if (u?.uuid) map[String(u.uuid)] = u;
    });
    return map;
  }, [users]);

  const getUserName = (userId) => {
    if (!userId) return "-";
    if (typeof userId === "object") {
      return (
        userId.name || userId.fullName || userId.username || userId.email ||
        String(userId._id || "-")
      );
    }
    const user = userMap[String(userId)];
    if (!user) return usersLoading ? "Loading..." : String(userId);
    return user.name || user.fullName || user.username || user.email || String(userId);
  };

  /* ---------- state ---------- */

  const getInitialFormData = () => ({
    marketName: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    drawDate: getToday(),
    drawTime: "18:30",
    prizes: { first: "", second: "", third: "" },
  });

  const [editingId, setEditingId] = useState(null);
  const [viewId, setViewId] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);

  const [formData, setFormData] = useState(getInitialFormData());
  const [updateData, setUpdateData] = useState(getInitialFormData());
  const [formError, setFormError] = useState("");

  // create popup image state
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState("");

  // update popup image state
  const [updateIconFile, setUpdateIconFile] = useState(null);
  const [updateIconPreview, setUpdateIconPreview] = useState("");

  // info-panel icon state (update page)
  const [infoIconFile, setInfoIconFile] = useState(null);
  const [infoIconPreview, setInfoIconPreview] = useState("");
  const [iconError, setIconError] = useState("");

  const [editingEntry, setEditingEntry] = useState(null);
  const [editData, setEditData] = useState({
    number: "",
    amount: "",
    status: "pending",
    entryDate: "",
  });

  const [activeTab, setActiveTab] = useState("sec-info");

  const [autoGenerate, setAutoGenerate] = useState(true);
  const [manualPrefix, setManualPrefix] = useState("");
  const [manualNext, setManualNext] = useState("");

  /* ---------- load ---------- */

  useEffect(() => {
    dispatch(getAllLotteryConfigs());
    dispatch(getAllUsers());
    return () => {
      dispatch(clearLotteryError());
      dispatch(clearLotteryMessage());
    };
  }, [dispatch]);

  /* ---------- derived ---------- */

  const current = lottery && lottery._id === editingId ? lottery : null;
  const viewLottery = lottery && lottery._id === viewId ? lottery : null;

  const listItem = current
    ? (lotteries || []).find((l) => l._id === current._id)
    : null;

  const isActive = listItem?.isActive ?? current?.isActive ?? false;

  const currentIcon = infoIconPreview || current?.imageUrl || "";

  const drawPrefix = useMemo(() => {
    const d = current?.drawDate ? new Date(current.drawDate) : null;
    if (!d || Number.isNaN(d.getTime())) return "DL-";
    return (
      `DL-${d.getFullYear()}` +
      `${String(d.getMonth() + 1).padStart(2, "0")}` +
      `${String(d.getDate()).padStart(2, "0")}-`
    );
  }, [current]);

  const autoNext = String((current?.users?.length || 0) + 1).padStart(3, "0");
  const prefixValue = autoGenerate ? drawPrefix : manualPrefix;
  const nextValue = autoGenerate ? autoNext : manualNext;

  /* ---------- table actions ---------- */

  const handleUpdateClick = (id) => {
    setEditingId(id);
    setActiveTab("sec-info");
    setAutoGenerate(true);
    setIconError("");
    setInfoIconFile(null);
    setInfoIconPreview("");
    dispatch(clearLotteryError());
    dispatch(clearLotteryMessage());
    dispatch(getLotteryConfigById(id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleViewClick = (id) => {
    dispatch(clearLotteryError());
    dispatch(clearLotteryMessage());
    setViewId(id);
    dispatch(getLotteryConfigById(id));
  };

  const handleDeleteMarket = async (id) => {
    if (!window.confirm("Are you sure you want to delete this lottery?")) return;
    const result = await dispatch(deleteLotteryConfig(id));
    if (deleteLotteryConfig.fulfilled.match(result)) {
      if (editingId === id) setEditingId(null);
      if (viewId === id) setViewId(null);
    }
  };

  const handleBack = () => {
    setEditingId(null);
    setViewId(null);
    setShowUpdate(false);
    setInfoIconFile(null);
    if (infoIconPreview) URL.revokeObjectURL(infoIconPreview);
    setInfoIconPreview("");
    dispatch(clearLotteryError());
    dispatch(getAllLotteryConfigs());
  };

  /* ---------- tabs ---------- */

  const TABS = [
    { id: "sec-info", label: "Lottery Information", icon: Info },
    { id: "sec-prize", label: "Prize Structure", icon: Trophy },
    { id: "sec-publish", label: "Publish Status", icon: ToggleRight },
    {
      id: "entries",
      label: `User Entries (${current?.users?.length || 0})`,
      icon: Users,
      modal: true,
    },
  ];

  const handleTab = (tab) => {
    if (tab.modal) {
      setViewId(editingId);
      return;
    }
    setActiveTab(tab.id);
    document
      .getElementById(tab.id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleAutoToggle = () => {
    if (autoGenerate) {
      setManualPrefix(drawPrefix);
      setManualNext(autoNext);
    }
    setAutoGenerate((v) => !v);
  };

  /* ---------- icon handlers ---------- */

  const handleInfoIconChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const err = validateImage(file);
    if (err) {
      setIconError(err);
      return;
    }

    setIconError("");
    if (infoIconPreview) URL.revokeObjectURL(infoIconPreview);
    setInfoIconFile(file);
    setInfoIconPreview(URL.createObjectURL(file));
  };

  const handleIconChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const err = validateImage(file);
    if (err) {
      setFormError(err);
      return;
    }

    if (iconPreview) URL.revokeObjectURL(iconPreview);
    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
    setFormError("");
  };

  const removeIcon = () => {
    if (iconPreview) URL.revokeObjectURL(iconPreview);
    setIconFile(null);
    setIconPreview("");
  };

  // update popup icon handler
  const handleUpdateIconChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const err = validateImage(file);
    if (err) {
      setFormError(err);
      return;
    }

    if (updateIconPreview) URL.revokeObjectURL(updateIconPreview);
    setUpdateIconFile(file);
    setUpdateIconPreview(URL.createObjectURL(file));
    setFormError("");
  };

  const removeUpdateIcon = () => {
    if (updateIconPreview) URL.revokeObjectURL(updateIconPreview);
    setUpdateIconFile(null);
    setUpdateIconPreview("");
  };

  /* ---------- form change handlers ---------- */

  const makeChangeHandler = (setter) => (e) => {
    const { name, value } = e.target;

    const prizeKey = {
      firstPrize: "first",
      secondPrize: "second",
      thirdPrize: "third",
    }[name];

    if (prizeKey) {
      setter((prev) => ({
        ...prev,
        prizes: { ...prev.prizes, [prizeKey]: value },
      }));
    } else {
      setter((prev) => ({ ...prev, [name]: value }));
    }

    setFormError("");
  };

  const handleCreateChange = makeChangeHandler(setFormData);
  const handleUpdateChange = makeChangeHandler(setUpdateData);

  /* ---------- CREATE ---------- */

  const openCreate = () => {
    dispatch(clearLotteryError());
    dispatch(clearLotteryMessage());
    setFormError("");
    setShowCreate(true);
  };

  const closeCreateModal = () => {
    setShowCreate(false);
    setFormError("");
    setFormData(getInitialFormData());
    removeIcon();
    dispatch(clearLotteryError());
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const err = validateLotteryForm(formData, true);
    if (err) return setFormError(err);

    if (!iconFile) {
      return setFormError("Market image is required");
    }

    const payload = buildPayload(formData);

    const result = await dispatch(
      createLotteryConfig({ payload, imageFile: iconFile })
    );

    if (createLotteryConfig.fulfilled.match(result)) {
      removeIcon();
      closeCreateModal();
      await dispatch(getAllLotteryConfigs());
    }
  };

  /* ---------- UPDATE ---------- */

  const openUpdatePopup = () => {
    if (!current) return;
    dispatch(clearLotteryError());
    dispatch(clearLotteryMessage());
    setFormError("");

    // reset update image state
    if (updateIconPreview) URL.revokeObjectURL(updateIconPreview);
    setUpdateIconFile(null);
    setUpdateIconPreview("");

    setUpdateData({
      marketName: current.marketName || "",
      month: current.month || new Date().getMonth() + 1,
      year: current.year || new Date().getFullYear(),
      drawDate: toInputDate(current.drawDate),
      drawTime: current.drawTime || "18:30",
      prizes: {
        first: current.prizes?.first ?? "",
        second: current.prizes?.second ?? "",
        third: current.prizes?.third ?? "",
      },
    });
    setShowUpdate(true);
  };

  const closeUpdatePopup = () => {
    setShowUpdate(false);
    setFormError("");
    removeUpdateIcon();
    dispatch(clearLotteryError());
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!current?._id) return;

    // update me past date allowed
    const err = validateLotteryForm(updateData, false);
    if (err) return setFormError(err);

    const payload = buildPayload(updateData);

    const result = await dispatch(
      updateLotteryConfig({
        id: current._id,
        lotteryData: payload,
        imageFile: updateIconFile || undefined,   // 👈 image optional
      })
    );

    if (updateLotteryConfig.fulfilled.match(result)) {
      removeUpdateIcon();
      setShowUpdate(false);
      await dispatch(getLotteryConfigById(current._id));
      dispatch(getAllLotteryConfigs());
    }
  };

  /* ---------- activate / deactivate ---------- */

  const handleActivate = async (id) => {
    if (!window.confirm("Are you sure you want to activate this lottery?")) return;
    const result = await dispatch(activateLotteryConfig(id));
    if (activateLotteryConfig.fulfilled.match(result)) {
      await dispatch(getLotteryConfigById(id));
      dispatch(getAllLotteryConfigs());
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate this lottery?")) return;
    const result = await dispatch(deactivateLotteryConfig(id));
    if (deactivateLotteryConfig.fulfilled.match(result)) {
      await dispatch(getLotteryConfigById(id));
      dispatch(getAllLotteryConfigs());
    }
  };

  /* ---------- entry edit / delete ---------- */

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setEditData({
      number: entry.number || "",
      amount: entry.amount !== undefined && entry.amount !== null ? entry.amount : "",
      status: entry.status || "pending",
      entryDate: entry.entryDate || "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const closeEditModal = () => {
    setEditingEntry(null);
    setEditData({ number: "", amount: "", status: "pending", entryDate: "" });
  };

  const handleUpdateEntry = async (e) => {
    e.preventDefault();
    if (!viewLottery?._id || !editingEntry?._id) return;
    if (!editData.number || String(editData.number).length !== 6) return;
    if (editData.amount === "" || Number(editData.amount) < 0) return;

    const result = await dispatch(
      updateUserLotteryEntry({
        id: viewLottery._id,
        userEntryId: editingEntry._id,
        data: {
          number: editData.number,
          amount: Number(editData.amount),
          status: editData.status,
          entryDate: editData.entryDate,
        },
      })
    );

    if (updateUserLotteryEntry.fulfilled.match(result)) {
      closeEditModal();
      await dispatch(getLotteryConfigById(viewLottery._id));
      dispatch(getAllLotteryConfigs());
    }
  };

  const handleDeleteEntry = async (configId, entryId) => {
    if (!window.confirm("Are you sure you want to delete this user entry?")) return;
    const result = await dispatch(
      deleteUserLotteryEntry({ id: configId, userEntryId: entryId })
    );
    if (deleteUserLotteryEntry.fulfilled.match(result)) {
      await dispatch(getLotteryConfigById(configId));
      dispatch(getAllLotteryConfigs());
    }
  };

  const anyPopupOpen = showCreate || showUpdate;

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[100rem] space-y-4">
        {message && (
          <div className="rounded-xl border border-[#12A36B]/30 bg-[#E6F6EF] px-4 py-3 text-sm font-medium text-[#0E7A52]">
            {message}
          </div>
        )}

        {error && !anyPopupOpen && (
          <div className="rounded-xl border border-[#D93025]/30 bg-[#FDE8E6] px-4 py-3 text-sm font-medium text-[#B3261E]">
            {error}
          </div>
        )}

        {/* =================================================
            TABLE VIEW
        ================================================= */}
        {!editingId && (
          <>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-[#1F2A6B]">
                  Daily Lottery
                </h1>
                <p className="mt-1 text-sm text-[#6B7280]">
                  Manage lotteries, schedule draws, set prizes and publish results.
                </p>
              </div>

              <button
                type="button"
                onClick={openCreate}
                className={`flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm ${BROWN_BTN}`}
              >
                <Plus size={16} strokeWidth={3} />
                Create Lottery
              </button>
            </div>

            <div className={CARD_CLS}>
              <div className="flex flex-col gap-3 border-b border-[#F3E7C4] px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-black text-[#1F2A6B]">All Lotteries</h2>
                  <p className="mt-1 text-sm text-[#6B7280]">
                    Total lotteries: {lotteries?.length || 0}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => dispatch(getAllLotteryConfigs())}
                  disabled={loading}
                  className={`rounded-xl px-4 py-2 text-xs disabled:opacity-60 ${OUTLINE_BTN}`}
                >
                  {loading ? "Loading..." : "Refresh"}
                </button>
              </div>

              {loading && (!lotteries || lotteries.length === 0) ? (
                <div className="flex min-h-[220px] items-center justify-center text-sm text-[#6B7280]">
                  Loading lotteries...
                </div>
              ) : !lotteries || lotteries.length === 0 ? (
                <div className="flex min-h-[260px] flex-col items-center justify-center gap-2 px-5 text-center">
                  <Crown size={34} className="text-[#F2B705]" />
                  <h3 className="text-base font-black text-[#1A1A1A]">No lotteries found</h3>
                  <p className="text-sm text-[#6B7280]">
                    Click “Create Lottery” to add your first one.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-[#FFF9E3]">
                      <tr>
                        <th className={TH_CLS}>#</th>
                        <th className={TH_CLS}>Lottery</th>
                        <th className={TH_CLS}>Month</th>
                        <th className={TH_CLS}>Year</th>
                        <th className={TH_CLS}>Draw Date</th>
                        <th className={TH_CLS}>Draw Time</th>
                        <th className={TH_CLS}>Prize Amounts</th>
                        <th className={TH_CLS}>Users</th>
                        <th className={TH_CLS}>Status</th>
                        <th className={TH_CLS}>Created</th>
                        <th className={TH_CLS}>Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#F3E7C4]">
                      {lotteries.map((item, index) => (
                        <tr key={item._id} className="transition hover:bg-[#FFFDF7]">
                          <td className="px-4 py-3 text-sm text-[#8A8F98]">{index + 1}</td>

                          <td className="whitespace-nowrap px-4 py-3">
                            <div className="flex items-center gap-3">
                              <IconTile
                                src={item.imageUrl}
                                name={item.marketName}
                                size="h-10 w-10"
                                compact
                              />
                              <div>
                                <div className="font-semibold text-[#1A1A1A]">
                                  {item.marketName}
                                </div>
                                <div className="mt-0.5 text-[11px] text-[#8A8F98]">
                                  ID: {item._id}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-sm">
                            {getMonthName(item.month)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm">{item.year}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm">
                            {formatDate(item.drawDate)}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3">
                            {item.drawTime ? (
                              <span className="rounded-lg bg-[#FFEFA8] px-3 py-1.5 text-xs font-bold text-[#9A5B00] ring-1 ring-[#F2B705]/60">
                                {item.drawTime}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {item.prizes ? (
                              <div className="flex min-w-[210px] flex-wrap gap-1.5">
                                {[
                                  ["1st", item.prizes.first],
                                  ["2nd", item.prizes.second],
                                  ["3rd", item.prizes.third],
                                ].map(([label, amt]) => (
                                  <span
                                    key={label}
                                    className="rounded-md bg-[#FFF9E3] px-2 py-1 text-xs font-semibold text-[#9A5B00] ring-1 ring-[#F3E7C4]"
                                  >
                                    {label} ₹{Number(amt || 0).toLocaleString("en-IN")}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-[#8A8F98]">Not configured</span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-sm">{item.users?.length || 0}</td>

                          <td className="whitespace-nowrap px-4 py-3">
                            <StatusPill active={item.isActive} />
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-sm text-[#6B7280]">
                            {formatDate(item.createdAt)}
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex min-w-[250px] items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleUpdateClick(item._id)}
                                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs ${GOLD_BTN}`}
                              >
                                <Pencil size={12} />
                                Update
                              </button>

                              <button
                                type="button"
                                onClick={() => handleViewClick(item._id)}
                                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs ${OUTLINE_BTN}`}
                              >
                                <Eye size={12} />
                                View
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteMarket(item._id)}
                                disabled={deleteLoading}
                                className="flex items-center gap-1.5 rounded-lg bg-[#D93025] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#B3261E] disabled:opacity-50"
                              >
                                <Trash2 size={12} />
                                {deleteLoading ? "..." : "Delete"}
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
          </>
        )}

        {/* =================================================
            UPDATE PAGE
        ================================================= */}
        {editingId && (
          <>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${OUTLINE_BTN}`}
                  title="Back to lotteries"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-[#1F2A6B]">
                    Daily Lottery
                  </h1>
                  <p className="mt-1 text-sm text-[#6B7280]">
                    Manage lotteries, schedule draws, set prizes and publish results.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={openCreate}
                className={`flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm ${BROWN_BTN}`}
              >
                <Plus size={16} strokeWidth={3} />
                Create Lottery
              </button>
            </div>

            {!current ? (
              <div className={`${CARD_CLS} flex min-h-[300px] items-center justify-center text-sm text-[#6B7280]`}>
                Loading lottery details...
              </div>
            ) : (
              <>
                <div className="relative overflow-hidden rounded-2xl border border-[#F3E7C4] bg-gradient-to-r from-white via-[#FFF9E3] to-[#FFE08A] p-4 shadow-[0_6px_18px_-10px_rgba(247,181,0,0.35)] sm:p-5">
                  <div className="pointer-events-none absolute -bottom-10 right-0 h-40 w-2/5 bg-[radial-gradient(ellipse_at_bottom_right,rgba(247,181,0,0.55),transparent_70%)]" />

                  <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <IconTile src={currentIcon} name={current.marketName} size="h-28 w-28" />

                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-2xl font-black text-[#1A1A1A]">
                        {current.marketName}
                      </h2>

                      <p className="mt-1 text-sm text-[#6B7280]">
                        {getMonthName(current.month)} {current.year} • Draw{" "}
                        {formatDate(current.drawDate)}
                        {current.drawTime ? ` at ${current.drawTime}` : ""}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#374151] ring-1 ring-[#F3E7C4]">
                          Status
                          <span
                            className={`inline-flex items-center gap-1 font-bold ${
                              isActive ? "text-[#12A36B]" : "text-[#6B7280]"
                            }`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${
                                isActive ? "bg-[#12A36B]" : "bg-[#9CA3AF]"
                              }`}
                            />
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </span>

                        <span className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#374151] ring-1 ring-[#F3E7C4]">
                          Total Draws
                          <Calendar size={13} className="text-[#9A5B00]" />
                          <b className="text-[#1A1A1A]">{lotteries?.length || 0}</b>
                        </span>

                        <span className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#374151] ring-1 ring-[#F3E7C4]">
                          Entries
                          <Users size={13} className="text-[#9A5B00]" />
                          <b className="text-[#1A1A1A]">{current.users?.length || 0}</b>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-1 overflow-x-auto rounded-2xl border border-[#F3E7C4] bg-white p-1.5 shadow-[0_6px_18px_-10px_rgba(247,181,0,0.3)]">
                  {TABS.map((t) => {
                    const Icon = t.icon;
                    const active = activeTab === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleTab(t)}
                        className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] transition ${
                          active
                            ? BROWN_BTN
                            : "font-semibold text-[#1F2A6B] hover:bg-[#FFF9E3]"
                        }`}
                      >
                        <Icon size={16} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.25fr_1fr]">
                  <Panel id="sec-info" icon={Info} title="Lottery Information">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_190px]">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <ReadField label="Lottery Name" value={current.marketName} />
                        </div>
                        <ReadField label="Month" value={getMonthName(current.month)} />
                        <ReadField label="Year" value={current.year} />
                        <ReadField label="Draw Date" value={formatDate(current.drawDate)} />
                        <ReadField label="Draw Time" value={current.drawTime || "-"} />
                        <ReadField label="Total Entries" value={current.users?.length || 0} />
                        <ReadField label="Created" value={formatDate(current.createdAt)} />

                        <div className="col-span-2 mt-1 flex justify-end">
                          <button
                            type="button"
                            onClick={openUpdatePopup}
                            className={`rounded-xl px-6 py-2.5 text-sm ${BROWN_BTN}`}
                          >
                            Update Information
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className={LABEL_CLS}>Icon / Banner</label>
                        <div className="flex min-h-[210px] flex-col items-center justify-center gap-3 rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-3 text-center">
                          <IconTile src={currentIcon} name={current.marketName} />

                          <label
                            className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs ${OUTLINE_BTN}`}
                          >
                            <Upload size={13} />
                            Change Icon
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleInfoIconChange}
                              className="hidden"
                            />
                          </label>

                          {iconError ? (
                            <p className="text-[10px] font-semibold text-[#D93025]">{iconError}</p>
                          ) : (
                            <p className="text-[10px] leading-snug text-[#8A8F98]">
                              PNG/JPG, max 2MB
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Panel>

                  <Panel id="sec-publish" icon={ToggleRight} title="Publish Status">
                    <div className="space-y-5">
                      <div className="flex items-center gap-3 rounded-xl bg-[#FFFDF7] px-4 py-3 ring-1 ring-[#F3E7C4]">
                        <span className="text-sm font-bold text-[#1A1A1A]">Current Status</span>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold ${
                            isActive ? "bg-[#DDF7E8] text-[#12A36B]" : "bg-gray-100 text-[#6B7280]"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isActive ? "bg-[#12A36B]" : "bg-[#9CA3AF]"
                            }`}
                          />
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div>
                        <p className="mb-3 text-sm font-bold text-[#1A1A1A]">
                          Activate / Deactivate
                        </p>

                        <div className="flex items-center gap-3">
                          <Switch
                            checked={isActive}
                            disabled={actionLoading}
                            onChange={() =>
                              isActive
                                ? handleDeactivate(current._id)
                                : handleActivate(current._id)
                            }
                          />
                          <span className="text-sm font-semibold text-[#374151]">
                            {actionLoading
                              ? "Updating..."
                              : `Lottery is currently ${isActive ? "Active" : "Inactive"}`}
                          </span>
                        </div>

                        <p className="mt-3 text-xs text-[#6B7280]">
                          When inactive, this lottery will not be visible to users.
                        </p>
                      </div>
                    </div>
                  </Panel>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* =====================================================
          VIEW POPUP — FULL DETAILS
      ===================================================== */}

      {viewId && (
        <ModalShell
          wide
          title={viewLottery ? `View — ${viewLottery.marketName}` : "View Lottery"}
          subtitle={
            viewLottery
              ? `${getMonthName(viewLottery.month)} ${viewLottery.year} • ${
                  viewLottery.users?.length || 0
                } Users`
              : "Loading..."
          }
          onClose={() => setViewId(null)}
        >
          {!viewLottery ? (
            <div className="py-16 text-center text-sm text-[#6B7280]">
              Loading lottery details...
            </div>
          ) : (
            <div className="p-5">
              {/* ============ TOP SUMMARY ============ */}
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <StatusPill
                  active={
                    (lotteries || []).find((l) => l._id === viewLottery._id)?.isActive ??
                    viewLottery.isActive
                  }
                />

                <button
                  type="button"
                  onClick={() => dispatch(getLotteryConfigById(viewLottery._id))}
                  disabled={loading}
                  className={`ml-auto rounded-xl px-4 py-2 text-xs disabled:opacity-60 ${OUTLINE_BTN}`}
                >
                  {loading ? "Loading..." : "Refresh Details"}
                </button>
              </div>

              {/* ============ DETAILS + IMAGE ============ */}
              <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
                {/* Image */}
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-[#F3E7C4] bg-[#FFFDF7] p-3">
                  <IconTile
                    src={viewLottery.imageUrl}
                    name={viewLottery.marketName}
                    size="h-40 w-40"
                  />
                  <p className="text-center text-[11px] font-semibold text-[#8A8F98]">
                    Market Banner
                  </p>
                </div>

                {/* Info fields */}
                <div className="rounded-2xl border border-[#F3E7C4] bg-white p-4">
                  <h3 className="mb-3 text-base font-black text-[#1F2A6B]">
                    {viewLottery.marketName}
                  </h3>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <ReadField label="Month" value={getMonthName(viewLottery.month)} />
                    <ReadField label="Year" value={viewLottery.year} />
                    <ReadField label="Draw Time" value={viewLottery.drawTime || "-"} />
                    <ReadField
                      label="Draw Date"
                      value={formatDate(viewLottery.drawDate)}
                    />
                    <ReadField label="Created" value={formatDate(viewLottery.createdAt)} />
                    <ReadField
                      label="Total Entries"
                      value={viewLottery.users?.length || 0}
                    />
                  </div>

                  {/* Prizes */}
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#9A5B00]">
                      Prize Structure
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        ["1st Prize", viewLottery.prizes?.first],
                        ["2nd Prize", viewLottery.prizes?.second],
                        ["3rd Prize", viewLottery.prizes?.third],
                      ].map(([label, amt]) => (
                        <div
                          key={label}
                          className="rounded-xl bg-gradient-to-b from-[#FFF9E3] to-[#FFEFA8] p-3 text-center ring-1 ring-[#F3E7C4]"
                        >
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#9A5B00]">
                            {label}
                          </p>
                          <p className="mt-1 text-lg font-black text-[#1A1204]">
                            ₹{Number(amt || 0).toLocaleString("en-IN")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lottery ID */}
                  <div className="mt-3 rounded-lg bg-[#FFFDF7] px-3 py-2 text-[11px] text-[#8A8F98] ring-1 ring-[#F3E7C4]">
                    <b className="text-[#374151]">ID:</b> {viewLottery._id}
                  </div>
                </div>
              </div>

              {/* ============ ENTRIES TABLE ============ */}
              <div>
                <p className="mb-2 text-sm font-black text-[#1F2A6B]">
                  User Entries ({viewLottery.users?.length || 0})
                </p>

                <div className="overflow-x-auto rounded-xl ring-1 ring-[#F3E7C4]">
                  {viewLottery.users?.length > 0 ? (
                    <table className="min-w-full">
                      <thead className="bg-[#FFF9E3]">
                        <tr>
                          <th className={TH_CLS}>#</th>
                          <th className={TH_CLS}>User</th>
                          <th className={TH_CLS}>Number</th>
                          <th className={TH_CLS}>Amount</th>
                          <th className={TH_CLS}>Prize</th>
                          <th className={TH_CLS}>Date</th>
                          <th className={TH_CLS}>Status</th>
                          <th className={TH_CLS}>Actions</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-[#F3E7C4]">
                        {viewLottery.users.map((entry, index) => (
                          <tr key={entry._id} className="hover:bg-[#FFFDF7]">
                            <td className="px-4 py-3 text-sm text-[#8A8F98]">
                              {index + 1}
                            </td>

                            <td className="px-4 py-3 text-sm">
                              <div className="font-semibold text-[#1A1A1A]">
                                {getUserName(entry.userId)}
                              </div>
                              <div className="mt-0.5 max-w-[180px] truncate text-xs text-[#8A8F98]">
                                {typeof entry.userId === "object"
                                  ? entry.userId?._id
                                  : entry.userId}
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <span className="inline-flex rounded-full bg-[#FFEFA8] px-3 py-1 text-sm font-black tracking-wider text-[#1A1204] ring-1 ring-[#F2B705]/60">
                                {entry.number}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-sm font-semibold text-[#1A1A1A]">
                              ₹{Number(entry.amount || 0).toLocaleString("en-IN")}
                            </td>

                            <td className="px-4 py-3 text-sm font-semibold text-[#1A1A1A]">
                              {entry.status === "win" ? (
                                <div>
                                  <span className="text-[#12A36B]">
                                    {entry.prizeType || "Winner"}
                                  </span>
                                  {entry.prize && (
                                    <div className="mt-1 text-xs text-[#6B7280]">
                                      ₹
                                      {Number(
                                        entry.prize.first ||
                                          entry.prize.second ||
                                          entry.prize.third ||
                                          0
                                      ).toLocaleString("en-IN")}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                "-"
                              )}
                            </td>

                            <td className="px-4 py-3 text-sm text-[#6B7280]">
                              {entry.entryDate}
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

                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditEntry(entry)}
                                  className={`rounded-lg px-3 py-1.5 text-xs ${GOLD_BTN}`}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteEntry(viewLottery._id, entry._id)
                                  }
                                  disabled={deleteLoading}
                                  className="rounded-lg bg-[#D93025] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#B3261E] disabled:opacity-50"
                                >
                                  {deleteLoading ? "..." : "Delete"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="py-10 text-center text-sm text-[#6B7280]">
                      No user entries found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </ModalShell>
      )}

      {/* =====================================================
          CREATE LOTTERY POPUP
      ===================================================== */}

      {showCreate && (
        <ModalShell
          title="Create Lottery"
          subtitle="Create a lottery market and set prize amounts."
          onClose={closeCreateModal}
          z="z-[70]"
        >
          <form onSubmit={handleCreateSubmit} className="p-5">
            {(formError || error) && (
              <div className="mb-4 rounded-xl border border-[#D93025]/30 bg-[#FDE8E6] px-4 py-3 text-sm font-medium text-[#B3261E]">
                {formError || error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_200px]">
              <LotteryFields
                data={formData}
                onChange={handleCreateChange}
                minDate={getToday()}
              />

              <div>
                <label className={LABEL_CLS}>Icon / Banner *</label>

                <div className="flex min-h-[210px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#F2B705] bg-[#FFFDF7] p-3 text-center">
                  {iconPreview ? (
                    <img
                      src={iconPreview}
                      alt="Lottery icon preview"
                      className="h-24 w-24 rounded-xl object-cover shadow ring-1 ring-[#F2B705]"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-[#FFEFA8]">
                      <ImagePlus size={30} className="text-[#9A5B00]" />
                    </div>
                  )}

                  <label
                    className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs ${OUTLINE_BTN}`}
                  >
                    <Upload size={13} />
                    {iconPreview ? "Change Icon" : "Upload Icon"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleIconChange}
                      className="hidden"
                    />
                  </label>

                  {iconFile && (
                    <button
                      type="button"
                      onClick={removeIcon}
                      className="text-[11px] font-semibold text-[#D93025] hover:underline"
                    >
                      Remove
                    </button>
                  )}

                  <p className="text-[10px] leading-snug text-[#8A8F98]">
                    PNG/JPG, max 2MB
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeCreateModal}
                className={`rounded-xl px-5 py-2.5 text-sm ${OUTLINE_BTN}`}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={createLoading}
                className={`rounded-xl px-6 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${BROWN_BTN}`}
              >
                {createLoading ? "Creating..." : "Create Lottery"}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* =====================================================
          UPDATE LOTTERY POPUP — WITH IMAGE UPLOAD
      ===================================================== */}

      {showUpdate && (
        <ModalShell
          title="Update Lottery"
          subtitle="Change lottery details, prize amounts and image."
          onClose={closeUpdatePopup}
          z="z-[70]"
        >
          <form onSubmit={handleUpdateSubmit} className="p-5">
            {(formError || error) && (
              <div className="mb-4 rounded-xl border border-[#D93025]/30 bg-[#FDE8E6] px-4 py-3 text-sm font-medium text-[#B3261E]">
                {formError || error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_200px]">
              <LotteryFields
                data={updateData}
                onChange={handleUpdateChange}
                minDate={undefined}
              />

              {/* Update Image */}
              <div>
                <label className={LABEL_CLS}>Icon / Banner (optional)</label>

                <div className="flex min-h-[210px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#F2B705] bg-[#FFFDF7] p-3 text-center">
                  {updateIconPreview ? (
                    <img
                      src={updateIconPreview}
                      alt="New icon preview"
                      className="h-24 w-24 rounded-xl object-cover shadow ring-1 ring-[#F2B705]"
                    />
                  ) : current?.imageUrl ? (
                    <img
                      src={current.imageUrl}
                      alt="Current icon"
                      className="h-24 w-24 rounded-xl object-cover shadow ring-1 ring-[#F3E7C4]"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-[#FFEFA8]">
                      <ImagePlus size={30} className="text-[#9A5B00]" />
                    </div>
                  )}

                  <label
                    className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs ${OUTLINE_BTN}`}
                  >
                    <Upload size={13} />
                    {updateIconPreview ? "Change Image" : "Upload New Image"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUpdateIconChange}
                      className="hidden"
                    />
                  </label>

                  {updateIconFile && (
                    <button
                      type="button"
                      onClick={removeUpdateIcon}
                      className="text-[11px] font-semibold text-[#D93025] hover:underline"
                    >
                      Cancel new image
                    </button>
                  )}

                  <p className="text-[10px] leading-snug text-[#8A8F98]">
                    {updateIconFile
                      ? "New image will replace current one"
                      : "Leave empty to keep current image"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeUpdatePopup}
                className={`rounded-xl px-5 py-2.5 text-sm ${OUTLINE_BTN}`}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={updateLoading}
                className={`rounded-xl px-6 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${BROWN_BTN}`}
              >
                {updateLoading ? "Updating..." : "Update Information"}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* =====================================================
          EDIT USER ENTRY POPUP
      ===================================================== */}

      {editingEntry && (
        <ModalShell
          z="z-[80]"
          title="Edit User Entry"
          subtitle="Update lottery entry details."
          onClose={closeEditModal}
        >
          <form onSubmit={handleUpdateEntry} className="p-5">
            <div className="mb-4">
              <label className={LABEL_CLS}>Lottery Number</label>
              <input
                type="text"
                name="number"
                value={editData.number}
                onChange={handleEditChange}
                maxLength={7}
                placeholder="1234567"
                className={`${INPUT_CLS} px-4`}
              />
            </div>

            <div className="mb-4">
              <label className={LABEL_CLS}>Entry Amount</label>
              <input
                type="number"
                name="amount"
                value={editData.amount}
                onChange={handleEditChange}
                min="0"
                placeholder="100"
                className={`${INPUT_CLS} px-4`}
              />
            </div>

            <div className="mb-4">
              <label className={LABEL_CLS}>Status</label>
              <select
                name="status"
                value={editData.status}
                onChange={handleEditChange}
                className={`${INPUT_CLS} px-4`}
              >
                <option value="pending">Pending</option>
                <option value="win">Win</option>
                <option value="lost">Lost</option>
              </select>
            </div>

            <div className="mb-5">
              <label className={LABEL_CLS}>Entry Date</label>
              <input
                type="date"
                name="entryDate"
                value={editData.entryDate}
                onChange={handleEditChange}
                className={`${INPUT_CLS} px-4`}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeEditModal}
                className={`rounded-xl px-5 py-2.5 text-sm ${OUTLINE_BTN}`}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={updateLoading}
                className={`rounded-xl px-5 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${GOLD_BTN}`}
              >
                {updateLoading ? "Updating..." : "Update Entry"}
              </button>
            </div>
          </form>
        </ModalShell>
      )}
    </div>
  );
};

export default AdminLottery;