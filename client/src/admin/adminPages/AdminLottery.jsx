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
  CheckCircle2,
  XCircle,
  Eye,
  Upload,
  Image as ImageIcon,
  Search,
  Plus,
  Filter,
  Trophy,
  Crown,
} from "lucide-react";

import {
  createLotteryConfig,
  updateLotteryConfig,
  getAllLotteryConfigs,
  getLotteryConfigById,
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
  "w-full rounded-lg border border-[#F3E7C4] bg-[#FFFDF7] px-3 py-2.5 text-sm text-[#1A1A1A] outline-none transition placeholder:text-[#8A8F98] focus:border-[#F2B705] focus:ring-2 focus:ring-[#FFEFA8] disabled:bg-[#F5F1E4]";

const LABEL_CLS =
  "mb-1.5 block text-xs font-semibold text-[#1A1A1A]";

const CARD_CLS =
  "rounded-2xl border border-[#F3E7C4] bg-white shadow-[0_6px_18px_-10px_rgba(247,181,0,0.35)]";

const TH_CLS =
  "whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#9A5B00]";

const ICON_BTN =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:opacity-50";

/* =========================================================
   HELPERS
========================================================= */

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const getMonthName = (month) =>
  MONTHS[Number(month) - 1] || "-";

const getToday = () => {
  const now = new Date();

  return (
    `${now.getFullYear()}-` +
    `${String(now.getMonth() + 1).padStart(2, "0")}-` +
    `${String(now.getDate()).padStart(2, "0")}`
  );
};

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

const toInputDate = (date) => {
  if (!date) return "";

  if (
    typeof date === "string" &&
    /^\d{4}-\d{2}-\d{2}/.test(date)
  ) {
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

  if (!file.type.startsWith("image/")) {
    return "Only image files are allowed";
  }

  if (file.size > 2 * 1024 * 1024) {
    return "Image must be smaller than 2MB";
  }

  return "";
};

const validateLotteryForm = (data, checkPast = true) => {
  if (!data.marketName.trim()) {
    return "Market name is required";
  }

  if (!data.month) {
    return "Month is required";
  }

  if (!data.year) {
    return "Year is required";
  }

  if (!data.drawDate) {
    return "Draw date is required";
  }

  if (!data.drawTime) {
    return "Draw time is required";
  }

  const selectedDate = new Date(`${data.drawDate}T00:00:00`);

  if (Number.isNaN(selectedDate.getTime())) {
    return "Invalid draw date";
  }

  if (checkPast) {
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return "Past draw date cannot be selected";
    }
  }

  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(data.drawTime)) {
    return "Invalid draw time";
  }

  const badPrize = (value) =>
    value === "" ||
    value === null ||
    value === undefined ||
    Number(value) < 0;

  if (badPrize(data.prizes.first)) {
    return "First prize amount is required";
  }

  if (badPrize(data.prizes.second)) {
    return "Second prize amount is required";
  }

  if (badPrize(data.prizes.third)) {
    return "Third prize amount is required";
  }

  return "";
};

const buildPayload = (data) => ({
  marketName: data.marketName.trim(),
  month: Number(data.month),
  year: Number(data.year),
  drawDate: data.drawDate,
  drawTime: data.drawTime,
  prizes: {
    first: Number(data.prizes.first),
    second: Number(data.prizes.second),
    third: Number(data.prizes.third),
  },
});

/* =========================================================
   SMALL UI COMPONENTS
========================================================= */

const ModalShell = ({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
  z = "z-50",
}) => (
  <div
    className={`fixed inset-0 ${z} flex items-start justify-center overflow-y-auto bg-black/50 p-4`}
  >
    <div
      className={`my-6 w-full ${
        wide ? "max-w-7xl" : "max-w-2xl"
      } rounded-2xl border border-[#F3E7C4] bg-white shadow-xl`}
    >
      <div className="flex items-center justify-between border-b border-[#F3E7C4] px-5 py-4">
        <div>
          <h2 className="text-lg font-black text-[#1F2A6B]">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-1 text-xs text-[#6B7280]">
              {subtitle}
            </p>
          )}
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

const IconTile = ({
  src,
  name,
  size = "h-24 w-24",
  compact = false,
}) =>
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
      <Crown
        size={compact ? 16 : 22}
        className="text-[#FFD83D]"
      />

      {!compact && (
        <span className="mt-1 line-clamp-2 px-1.5 text-[11px] font-black uppercase leading-tight text-white">
          {name || "Lottery"}
        </span>
      )}
    </div>
  );

const ReadField = ({ label, value }) => (
  <div>
    <label className={LABEL_CLS}>{label}</label>

    <input
      type="text"
      value={value ?? "-"}
      readOnly
      className={`${INPUT_CLS}`}
    />
  </div>
);

/* =========================================================
   LOTTERY FORM
========================================================= */

const LotteryFields = ({
  data,
  onChange,
  minDate,
}) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <div className="sm:col-span-2">
      <label className={LABEL_CLS}>
        Market Name
      </label>

      <input
        type="text"
        name="marketName"
        value={data.marketName}
        onChange={onChange}
        placeholder="Enter market name"
        className={`${INPUT_CLS}`}
      />
    </div>

    <div>
      <label className={LABEL_CLS}>Month</label>

      <select
        name="month"
        value={data.month}
        onChange={onChange}
        className={INPUT_CLS}
      >
        {MONTHS.map((month, index) => (
          <option
            key={month}
            value={index + 1}
          >
            {month}
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
        className={INPUT_CLS}
      />
    </div>

    <div>
      <label className={LABEL_CLS}>
        Draw Date
      </label>

      <input
        type="date"
        name="drawDate"
        value={data.drawDate}
        onChange={onChange}
        min={minDate}
        className={INPUT_CLS}
      />
    </div>

    <div>
      <label className={LABEL_CLS}>
        Draw Time
      </label>

      <input
        type="time"
        name="drawTime"
        value={data.drawTime}
        onChange={onChange}
        className={INPUT_CLS}
      />
    </div>

    {[
      ["firstPrize", "1st Prize Amount", data.prizes.first],
      ["secondPrize", "2nd Prize Amount", data.prizes.second],
      ["thirdPrize", "3rd Prize Amount", data.prizes.third],
    ].map(([name, label, value]) => (
      <div key={name}>
        <label className={LABEL_CLS}>
          {label}
        </label>

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
            className={`${INPUT_CLS} pl-8`}
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

  const { users = [], usersLoading } = useSelector(
    (state) => state.adminAuth
  );

  /* =======================================================
     USERS
  ======================================================= */

  const userMap = useMemo(() => {
    const map = {};

    (users || []).forEach((user) => {
      if (user?._id) {
        map[String(user._id)] = user;
      }

      if (user?.uuid) {
        map[String(user.uuid)] = user;
      }
    });

    return map;
  }, [users]);

  const getUserName = (userId) => {
    if (!userId) return "-";

    if (typeof userId === "object") {
      return (
        userId.name ||
        userId.fullName ||
        userId.username ||
        userId.email ||
        String(userId._id || "-")
      );
    }

    const user = userMap[String(userId)];

    if (!user) {
      return usersLoading
        ? "Loading..."
        : String(userId);
    }

    return (
      user.name ||
      user.fullName ||
      user.username ||
      user.email ||
      String(userId)
    );
  };

  /* =======================================================
     FORM
  ======================================================= */

  const getInitialFormData = () => ({
    marketName: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    drawDate: getToday(),
    drawTime: "18:30",
    prizes: {
      first: "",
      second: "",
      third: "",
    },
  });

  const [formData, setFormData] = useState(
    getInitialFormData()
  );

  const [editingId, setEditingId] = useState(null);
  const [viewId, setViewId] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);

  const [updateData, setUpdateData] = useState(
    getInitialFormData()
  );

  const [formError, setFormError] = useState("");

  /* image */
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState("");

  const [updateIconFile, setUpdateIconFile] =
    useState(null);

  const [updateIconPreview, setUpdateIconPreview] =
    useState("");

  /* filters */
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  /* delete modal */
  const [deleteId, setDeleteId] = useState(null);

  /* entry edit */
  const [editingEntry, setEditingEntry] =
    useState(null);

  const [editData, setEditData] = useState({
    number: "",
    amount: "",
    status: "pending",
    entryDate: "",
  });

  /* =======================================================
     LOAD
  ======================================================= */

  useEffect(() => {
    dispatch(getAllLotteryConfigs());
    dispatch(getAllUsers());

    return () => {
      dispatch(clearLotteryError());
      dispatch(clearLotteryMessage());
    };
  }, [dispatch]);

  /* =======================================================
     DERIVED
  ======================================================= */

  const currentLottery =
    lottery && lottery._id === editingId
      ? lottery
      : null;

  const viewLottery =
    lottery && lottery._id === viewId
      ? lottery
      : null;

  const filteredLotteries = useMemo(() => {
    const list = Array.isArray(lotteries)
      ? lotteries
      : [];

    return list.filter((item) => {
      const search = searchTerm
        .trim()
        .toLowerCase();

      const matchesSearch =
        !search ||
        item.marketName
          ?.toLowerCase()
          .includes(search);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          item.isActive) ||
        (statusFilter === "inactive" &&
          !item.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [
    lotteries,
    searchTerm,
    statusFilter,
  ]);

  const viewedIsActive = viewLottery
    ? (lotteries || []).find(
        (item) => item._id === viewLottery._id
      )?.isActive ?? viewLottery.isActive
    : false;

  /* =======================================================
     FORM CHANGE
  ======================================================= */

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
        prizes: {
          ...prev.prizes,
          [prizeKey]: value,
        },
      }));
    } else {
      setter((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    setFormError("");
  };

  const handleCreateChange =
    makeChangeHandler(setFormData);

  const handleUpdateChange =
    makeChangeHandler(setUpdateData);

  /* =======================================================
     CREATE
  ======================================================= */

  const openCreate = () => {
    dispatch(clearLotteryError());
    dispatch(clearLotteryMessage());

    setFormData(getInitialFormData());
    setFormError("");

    if (iconPreview) {
      URL.revokeObjectURL(iconPreview);
    }

    setIconFile(null);
    setIconPreview("");

    setShowCreate(true);
  };

  const closeCreate = () => {
    setShowCreate(false);
    setFormError("");

    setFormData(getInitialFormData());

    if (iconPreview) {
      URL.revokeObjectURL(iconPreview);
    }

    setIconFile(null);
    setIconPreview("");

    dispatch(clearLotteryError());
  };

  const handleIconChange = (e) => {
    const file = e.target.files?.[0];

    e.target.value = "";

    if (!file) return;

    const validationError = validateImage(file);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    if (iconPreview) {
      URL.revokeObjectURL(iconPreview);
    }

    setIconFile(file);
    setIconPreview(
      URL.createObjectURL(file)
    );

    setFormError("");
  };

  const removeIcon = () => {
    if (iconPreview) {
      URL.revokeObjectURL(iconPreview);
    }

    setIconFile(null);
    setIconPreview("");
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    setFormError("");

    const validationError =
      validateLotteryForm(formData, true);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    if (!iconFile) {
      setFormError(
        "Market image is required"
      );
      return;
    }

    const payload = buildPayload(formData);

    const result = await dispatch(
      createLotteryConfig({
        payload,
        imageFile: iconFile,
      })
    );

    if (
      createLotteryConfig.fulfilled.match(
        result
      )
    ) {
      closeCreate();

      await dispatch(
        getAllLotteryConfigs()
      );
    }
  };

  /* =======================================================
     UPDATE
  ======================================================= */

  const openUpdate = async (id) => {
    dispatch(clearLotteryError());
    dispatch(clearLotteryMessage());

    setFormError("");

    setEditingId(id);

    if (updateIconPreview) {
      URL.revokeObjectURL(updateIconPreview);
    }

    setUpdateIconFile(null);
    setUpdateIconPreview("");

    const result = await dispatch(
      getLotteryConfigById(id)
    );

    const data =
      result?.payload?.lottery ||
      result?.payload?.data ||
      result?.payload;

    if (data) {
      setUpdateData({
        marketName: data.marketName || "",
        month:
          data.month ||
          new Date().getMonth() + 1,
        year:
          data.year ||
          new Date().getFullYear(),
        drawDate: toInputDate(
          data.drawDate
        ),
        drawTime:
          data.drawTime || "18:30",
        prizes: {
          first:
            data.prizes?.first ?? "",
          second:
            data.prizes?.second ?? "",
          third:
            data.prizes?.third ?? "",
        },
      });
    } else if (
      lotteries?.length
    ) {
      const item = lotteries.find(
        (lotteryItem) =>
          lotteryItem._id === id
      );

      if (item) {
        setUpdateData({
          marketName:
            item.marketName || "",
          month:
            item.month ||
            new Date().getMonth() + 1,
          year:
            item.year ||
            new Date().getFullYear(),
          drawDate: toInputDate(
            item.drawDate
          ),
          drawTime:
            item.drawTime || "18:30",
          prizes: {
            first:
              item.prizes?.first ?? "",
            second:
              item.prizes?.second ?? "",
            third:
              item.prizes?.third ?? "",
          },
        });
      }
    }

    setShowUpdate(true);
  };

  const closeUpdate = () => {
    setShowUpdate(false);
    setEditingId(null);
    setFormError("");

    if (updateIconPreview) {
      URL.revokeObjectURL(
        updateIconPreview
      );
    }

    setUpdateIconFile(null);
    setUpdateIconPreview("");

    dispatch(clearLotteryError());
  };

  const handleUpdateIconChange = (e) => {
    const file = e.target.files?.[0];

    e.target.value = "";

    if (!file) return;

    const validationError =
      validateImage(file);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    if (updateIconPreview) {
      URL.revokeObjectURL(
        updateIconPreview
      );
    }

    setUpdateIconFile(file);
    setUpdateIconPreview(
      URL.createObjectURL(file)
    );

    setFormError("");
  };

  const removeUpdateIcon = () => {
    if (updateIconPreview) {
      URL.revokeObjectURL(
        updateIconPreview
      );
    }

    setUpdateIconFile(null);
    setUpdateIconPreview("");
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();

    setFormError("");

    if (!editingId) return;

    const validationError =
      validateLotteryForm(
        updateData,
        false
      );

    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload =
      buildPayload(updateData);

    const result = await dispatch(
      updateLotteryConfig({
        id: editingId,
        lotteryData: payload,
        imageFile:
          updateIconFile || undefined,
      })
    );

    if (
      updateLotteryConfig.fulfilled.match(
        result
      )
    ) {
      const id = editingId;

      closeUpdate();

      await dispatch(
        getAllLotteryConfigs()
      );

      await dispatch(
        getLotteryConfigById(id)
      );
    }
  };

  /* =======================================================
     VIEW
  ======================================================= */

  const handleView = async (id) => {
    dispatch(clearLotteryError());
    dispatch(clearLotteryMessage());

    setViewId(id);

    await dispatch(
      getLotteryConfigById(id)
    );
  };

  /* =======================================================
     ACTIVATE / DEACTIVATE
  ======================================================= */

  const handleToggleStatus = async (item) => {
    const id = item._id;

    if (item.isActive) {
      if (
        !window.confirm(
          "Are you sure you want to deactivate this lottery?"
        )
      ) {
        return;
      }

      const result = await dispatch(
        deactivateLotteryConfig(id)
      );

      if (
        deactivateLotteryConfig.fulfilled.match(
          result
        )
      ) {
        await dispatch(
          getAllLotteryConfigs()
        );

        if (viewId === id) {
          await dispatch(
            getLotteryConfigById(id)
          );
        }
      }
    } else {
      if (
        !window.confirm(
          "Are you sure you want to activate this lottery?"
        )
      ) {
        return;
      }

      const result = await dispatch(
        activateLotteryConfig(id)
      );

      if (
        activateLotteryConfig.fulfilled.match(
          result
        )
      ) {
        await dispatch(
          getAllLotteryConfigs()
        );

        if (viewId === id) {
          await dispatch(
            getLotteryConfigById(id)
          );
        }
      }
    }
  };

  /* =======================================================
     DELETE LOTTERY
  ======================================================= */

  const handleDelete = async () => {
    if (!deleteId) return;

    const result = await dispatch(
      deleteLotteryConfig(deleteId)
    );

    if (
      deleteLotteryConfig.fulfilled.match(
        result
      )
    ) {
      if (viewId === deleteId) {
        setViewId(null);
      }

      setDeleteId(null);

      await dispatch(
        getAllLotteryConfigs()
      );
    }
  };

  /* =======================================================
     ENTRY EDIT
  ======================================================= */

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);

    setEditData({
      number: entry.number || "",
      amount:
        entry.amount !== undefined &&
        entry.amount !== null
          ? entry.amount
          : "",
      status:
        entry.status || "pending",
      entryDate:
        entry.entryDate || "",
    });
  };

  const closeEditEntry = () => {
    setEditingEntry(null);

    setEditData({
      number: "",
      amount: "",
      status: "pending",
      entryDate: "",
    });
  };

  const handleEditEntryChange = (e) => {
    const { name, value } = e.target;

    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateEntry = async (e) => {
    e.preventDefault();

    if (
      !viewLottery?._id ||
      !editingEntry?._id
    ) {
      return;
    }

    if (
      !editData.number ||
      String(editData.number).length !== 6
    ) {
      return;
    }

    if (
      editData.amount === "" ||
      Number(editData.amount) < 0
    ) {
      return;
    }

    const result = await dispatch(
      updateUserLotteryEntry({
        id: viewLottery._id,
        userEntryId: editingEntry._id,
        data: {
          number: editData.number,
          amount: Number(
            editData.amount
          ),
          status: editData.status,
          entryDate:
            editData.entryDate,
        },
      })
    );

    if (
      updateUserLotteryEntry.fulfilled.match(
        result
      )
    ) {
      closeEditEntry();

      await dispatch(
        getLotteryConfigById(
          viewLottery._id
        )
      );

      dispatch(
        getAllLotteryConfigs()
      );
    }
  };

  const handleDeleteEntry = async (
    configId,
    entryId
  ) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user entry?"
      )
    ) {
      return;
    }

    const result = await dispatch(
      deleteUserLotteryEntry({
        id: configId,
        userEntryId: entryId,
      })
    );

    if (
      deleteUserLotteryEntry.fulfilled.match(
        result
      )
    ) {
      await dispatch(
        getLotteryConfigById(configId)
      );

      dispatch(
        getAllLotteryConfigs()
      );
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#FFFDF7] p-4 md:p-6">
      <div className="mx-auto max-w-[1400px] space-y-5">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#1F2A6B]">
              Daily Lottery
            </h1>

            <p className="mt-1 text-sm text-[#6B7280]">
              Manage daily lotteries, schedule draws,
              set prizes and publish results.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm ${BROWN_BTN}`}
          >
            <Plus
              size={17}
              strokeWidth={3}
            />
            Create Lottery
          </button>
        </div>

        {/* =================================================
            HERO
        ================================================= */}

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#5B0B0B] via-[#8A170F] to-[#C98A1B] p-5 shadow-[0_8px_25px_-10px_rgba(138,83,0,0.5)]">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#FFD83D]/20 blur-2xl" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#FFD83D]">
                Bharat Lottery
              </p>

              <h2 className="mt-1 text-2xl font-black text-white">
                Daily Lottery
              </h2>

              <p className="mt-1 text-sm font-medium text-white/80">
                DAILY DRAWS • BIGGER PRIZES • INSTANT MANAGEMENT
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                <Trophy
                  size={28}
                  className="text-[#FFD83D]"
                />
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                <Ticket
                  size={27}
                  className="text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            SUCCESS / ERROR
        ================================================= */}

        {message && (
          <div className="flex items-center gap-2 rounded-xl border border-[#12A36B]/30 bg-[#E6F6EF] px-4 py-3 text-sm font-medium text-[#0E7A52]">
            <CheckCircle2 size={17} />
            {message}
          </div>
        )}

        {error &&
          !showCreate &&
          !showUpdate && (
            <div className="flex items-center gap-2 rounded-xl border border-[#D93025]/30 bg-[#FDE8E6] px-4 py-3 text-sm font-medium text-[#B3261E]">
              <XCircle size={17} />
              {error}
            </div>
          )}

        {/* =================================================
            LOTTERY LIST
        ================================================= */}

        <div className={CARD_CLS}>
          <div className="flex flex-col gap-4 border-b border-[#F3E7C4] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-black text-[#1F2A6B]">
                Daily Draw List
              </h2>

              <p className="mt-1 text-sm text-[#6B7280]">
                Total lotteries:{" "}
                {lotteries?.length || 0}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {/* status */}
              <div className="relative">
                <Filter
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A5B00]"
                />

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value
                    )
                  }
                  className="h-10 rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] pl-9 pr-8 text-xs font-semibold text-[#374151] outline-none focus:border-[#F2B705]"
                >
                  <option value="all">
                    All Status
                  </option>
                  <option value="active">
                    Active
                  </option>
                  <option value="inactive">
                    Inactive
                  </option>
                </select>
              </div>

              {/* search */}
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A5B00]"
                />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(
                      e.target.value
                    )
                  }
                  placeholder="Search lottery..."
                  className="h-10 w-full rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] pl-9 pr-3 text-xs outline-none focus:border-[#F2B705] sm:w-[210px]"
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  dispatch(
                    getAllLotteryConfigs()
                  )
                }
                disabled={loading}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs disabled:opacity-50 ${OUTLINE_BTN}`}
              >
                <RefreshCw
                  size={14}
                  className={
                    loading
                      ? "animate-spin"
                      : ""
                  }
                />
                Refresh
              </button>
            </div>
          </div>

          {/* loading */}
          {loading &&
          (!lotteries ||
            lotteries.length === 0) ? (
            <div className="flex min-h-[260px] items-center justify-center text-sm text-[#6B7280]">
              Loading lotteries...
            </div>
          ) : filteredLotteries.length ===
            0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 px-5 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF9E3]">
                <Trophy
                  size={28}
                  className="text-[#F2B705]"
                />
              </div>

              <h3 className="text-base font-black text-[#1A1A1A]">
                No lotteries found
              </h3>

              <p className="max-w-md text-sm text-[#6B7280]">
                {searchTerm ||
                statusFilter !== "all"
                  ? "Try changing your search or filter."
                  : "Create your first daily lottery to get started."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-[#FFF9E3]">
                  <tr>
                    <th className={TH_CLS}>
                      #
                    </th>

                    <th className={TH_CLS}>
                      Lottery
                    </th>

                    <th className={TH_CLS}>
                      Draw Date & Time
                    </th>

                    <th className={TH_CLS}>
                      Total Prize
                    </th>

                    <th className={TH_CLS}>
                      Users
                    </th>

                    <th className={TH_CLS}>
                      Status
                    </th>

                    <th className={TH_CLS}>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#F3E7C4]">
                  {filteredLotteries.map(
                    (item, index) => {
                      const totalPrize =
                        Number(
                          item.prizes?.first || 0
                        ) +
                        Number(
                          item.prizes?.second ||
                            0
                        ) +
                        Number(
                          item.prizes?.third ||
                            0
                        );

                      return (
                        <tr
                          key={item._id}
                          className="transition hover:bg-[#FFFDF7]"
                        >
                          <td className="px-4 py-3 text-sm text-[#8A8F98]">
                            {index + 1}
                          </td>

                          {/* lottery */}
                          <td className="whitespace-nowrap px-4 py-3">
                            <div className="flex items-center gap-3">
                              <IconTile
                                src={
                                  item.imageUrl
                                }
                                name={
                                  item.marketName
                                }
                                size="h-11 w-11"
                                compact
                              />

                              <div>
                                <div className="font-semibold text-[#1A1A1A]">
                                  {
                                    item.marketName
                                  }
                                </div>

                                <div className="mt-0.5 text-[11px] text-[#8A8F98]">
                                  ID:{" "}
                                  {item._id}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* date */}
                          <td className="whitespace-nowrap px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="flex items-center gap-1.5 text-sm font-semibold text-[#1A1A1A]">
                                  <CalendarDays
                                    size={14}
                                    className="text-[#9A5B00]"
                                  />

                                  {formatDate(
                                    item.drawDate
                                  )}
                                </div>

                                <div className="mt-1 flex items-center gap-1.5 text-xs text-[#6B7280]">
                                  <Clock3
                                    size={13}
                                    className="text-[#9A5B00]"
                                  />

                                  {item.drawTime ||
                                    "-"}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* total prize */}
                          <td className="px-4 py-3">
                            <div className="min-w-[210px]">
                              <div className="text-sm font-black text-[#1A1204]">
                                ₹
                                {totalPrize.toLocaleString(
                                  "en-IN"
                                )}
                              </div>

                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {[
                                  [
                                    "1st",
                                    item.prizes
                                      ?.first,
                                  ],
                                  [
                                    "2nd",
                                    item.prizes
                                      ?.second,
                                  ],
                                  [
                                    "3rd",
                                    item.prizes
                                      ?.third,
                                  ],
                                ].map(
                                  ([
                                    label,
                                    amount,
                                  ]) => (
                                    <span
                                      key={
                                        label
                                      }
                                      className="rounded-md bg-[#FFF9E3] px-2 py-1 text-[10px] font-semibold text-[#9A5B00] ring-1 ring-[#F3E7C4]"
                                    >
                                      {label} ₹
                                      {Number(
                                        amount ||
                                          0
                                      ).toLocaleString(
                                        "en-IN"
                                      )}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          </td>

                          {/* users */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-[#374151]">
                              <UsersIcon />
                              {item.users
                                ?.length ||
                                0}
                            </div>
                          </td>

                          {/* status */}
                          <td className="whitespace-nowrap px-4 py-3">
                            <StatusPill
                              active={
                                item.isActive
                              }
                            />
                          </td>

                          {/* actions */}
                          <td className="px-4 py-3">
                            <div className="flex min-w-[280px] items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleView(
                                    item._id
                                  )
                                }
                                className={`${ICON_BTN} border-[#F2B705] bg-white text-[#9A5B00] hover:bg-[#FFF9E3]`}
                                title="View"
                              >
                                <Eye
                                  size={15}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openUpdate(
                                    item._id
                                  )
                                }
                                disabled={
                                  updateLoading
                                }
                                className={`${ICON_BTN} border-[#F2B705] bg-[#FFF9E3] text-[#9A5B00] hover:bg-[#FFEFA8]`}
                                title="Edit"
                              >
                                <Pencil
                                  size={15}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleStatus(
                                    item
                                  )
                                }
                                disabled={
                                  actionLoading
                                }
                                className={`${ICON_BTN} ${
                                  item.isActive
                                    ? "border-[#D93025]/30 bg-[#FDE8E6] text-[#D93025]"
                                    : "border-[#12A36B]/30 bg-[#E6F6EF] text-[#12A36B]"
                                }`}
                                title={
                                  item.isActive
                                    ? "Deactivate"
                                    : "Activate"
                                }
                              >
                                <Power
                                  size={15}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteId(
                                    item._id
                                  )
                                }
                                disabled={
                                  deleteLoading
                                }
                                className={`${ICON_BTN} border-[#D93025]/30 bg-[#FDE8E6] text-[#D93025] hover:bg-[#FAD5D1]`}
                                title="Delete"
                              >
                                <Trash2
                                  size={15}
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          CREATE POPUP
      ===================================================== */}

      {showCreate && (
        <ModalShell
          title="Create Lottery"
          subtitle="Create a daily lottery market and set prize amounts."
          onClose={closeCreate}
          z="z-[70]"
        >
          <form
            onSubmit={handleCreateSubmit}
            className="p-5"
          >
            {(formError || error) && (
              <div className="mb-4 rounded-xl border border-[#D93025]/30 bg-[#FDE8E6] px-4 py-3 text-sm font-medium text-[#B3261E]">
                {formError || error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_200px]">
              <LotteryFields
                data={formData}
                onChange={
                  handleCreateChange
                }
                minDate={getToday()}
              />

              {/* IMAGE */}
              <div>
                <label className={LABEL_CLS}>
                  Market Banner *
                </label>

                <div className="flex min-h-[235px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#F2B705] bg-[#FFFDF7] p-3 text-center">
                  {iconPreview ? (
                    <img
                      src={iconPreview}
                      alt="Lottery preview"
                      className="h-28 w-28 rounded-xl object-cover shadow ring-1 ring-[#F2B705]"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-[#FFEFA8]">
                      <ImageIcon
                        size={32}
                        className="text-[#9A5B00]"
                      />
                    </div>
                  )}

                  <label
                    className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs ${OUTLINE_BTN}`}
                  >
                    <Upload size={13} />

                    {iconPreview
                      ? "Change Image"
                      : "Upload Image"}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={
                        handleIconChange
                      }
                      className="hidden"
                    />
                  </label>

                  {iconFile && (
                    <button
                      type="button"
                      onClick={
                        removeIcon
                      }
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
                onClick={closeCreate}
                className={`rounded-xl px-5 py-2.5 text-sm ${OUTLINE_BTN}`}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={createLoading}
                className={`rounded-xl px-6 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60 ${BROWN_BTN}`}
              >
                {createLoading
                  ? "Creating..."
                  : "Create Lottery"}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* =====================================================
          UPDATE POPUP
      ===================================================== */}

      {showUpdate && (
        <ModalShell
          title="Update Lottery"
          subtitle="Change lottery details, prize amounts and image."
          onClose={closeUpdate}
          z="z-[70]"
        >
          <form
            onSubmit={handleUpdateSubmit}
            className="p-5"
          >
            {(formError || error) && (
              <div className="mb-4 rounded-xl border border-[#D93025]/30 bg-[#FDE8E6] px-4 py-3 text-sm font-medium text-[#B3261E]">
                {formError || error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_200px]">
              <LotteryFields
                data={updateData}
                onChange={
                  handleUpdateChange
                }
              />

              <div>
                <label className={LABEL_CLS}>
                  Market Banner
                  <span className="ml-1 text-[#8A8F98]">
                    (optional)
                  </span>
                </label>

                <div className="flex min-h-[235px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#F2B705] bg-[#FFFDF7] p-3 text-center">
                  {updateIconPreview ? (
                    <img
                      src={
                        updateIconPreview
                      }
                      alt="New lottery preview"
                      className="h-28 w-28 rounded-xl object-cover shadow ring-1 ring-[#F2B705]"
                    />
                  ) : currentLottery?.imageUrl ? (
                    <img
                      src={
                        currentLottery.imageUrl
                      }
                      alt="Current lottery"
                      className="h-28 w-28 rounded-xl object-cover shadow ring-1 ring-[#F3E7C4]"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-[#FFEFA8]">
                      <ImageIcon
                        size={32}
                        className="text-[#9A5B00]"
                      />
                    </div>
                  )}

                  <label
                    className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs ${OUTLINE_BTN}`}
                  >
                    <Upload size={13} />

                    {updateIconPreview
                      ? "Change Image"
                      : "Upload New Image"}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={
                        handleUpdateIconChange
                      }
                      className="hidden"
                    />
                  </label>

                  {updateIconFile && (
                    <button
                      type="button"
                      onClick={
                        removeUpdateIcon
                      }
                      className="text-[11px] font-semibold text-[#D93025] hover:underline"
                    >
                      Cancel new image
                    </button>
                  )}

                  <p className="text-[10px] leading-snug text-[#8A8F98]">
                    {updateIconFile
                      ? "New image will replace current image"
                      : "Leave empty to keep current image"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeUpdate}
                className={`rounded-xl px-5 py-2.5 text-sm ${OUTLINE_BTN}`}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={updateLoading}
                className={`rounded-xl px-6 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60 ${BROWN_BTN}`}
              >
                {updateLoading
                  ? "Updating..."
                  : "Update Lottery"}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* =====================================================
          VIEW POPUP
      ===================================================== */}

      {viewId && (
        <ModalShell
          wide
          title={
            viewLottery
              ? `View — ${viewLottery.marketName}`
              : "View Lottery"
          }
          subtitle={
            viewLottery
              ? `${getMonthName(
                  viewLottery.month
                )} ${
                  viewLottery.year
                } • ${
                  viewLottery.users
                    ?.length || 0
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

              {/* SUMMARY */}
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <StatusPill
                  active={viewedIsActive}
                />

                <button
                  type="button"
                  onClick={() =>
                    dispatch(
                      getLotteryConfigById(
                        viewLottery._id
                      )
                    )
                  }
                  disabled={loading}
                  className={`ml-auto inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs disabled:opacity-50 ${OUTLINE_BTN}`}
                >
                  <RefreshCw
                    size={13}
                    className={
                      loading
                        ? "animate-spin"
                        : ""
                    }
                  />
                  Refresh Details
                </button>
              </div>

              {/* DETAILS */}
              <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">

                {/* IMAGE */}
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-[#F3E7C4] bg-[#FFFDF7] p-3">
                  <IconTile
                    src={
                      viewLottery.imageUrl
                    }
                    name={
                      viewLottery.marketName
                    }
                    size="h-40 w-40"
                  />

                  <p className="text-center text-[11px] font-semibold text-[#8A8F98]">
                    Market Banner
                  </p>
                </div>

                {/* INFO */}
                <div className="rounded-2xl border border-[#F3E7C4] bg-white p-4">
                  <h3 className="mb-3 text-base font-black text-[#1F2A6B]">
                    {
                      viewLottery.marketName
                    }
                  </h3>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <ReadField
                      label="Month"
                      value={getMonthName(
                        viewLottery.month
                      )}
                    />

                    <ReadField
                      label="Year"
                      value={
                        viewLottery.year
                      }
                    />

                    <ReadField
                      label="Draw Time"
                      value={
                        viewLottery.drawTime ||
                        "-"
                      }
                    />

                    <ReadField
                      label="Draw Date"
                      value={formatDate(
                        viewLottery.drawDate
                      )}
                    />

                    <ReadField
                      label="Created"
                      value={formatDate(
                        viewLottery.createdAt
                      )}
                    />

                    <ReadField
                      label="Total Entries"
                      value={
                        viewLottery.users
                          ?.length || 0
                      }
                    />
                  </div>

                  {/* PRIZES */}
                  <div className="mt-5">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#9A5B00]">
                      Prize Structure
                    </p>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {[
                        [
                          "1st Prize",
                          viewLottery.prizes
                            ?.first,
                        ],
                        [
                          "2nd Prize",
                          viewLottery.prizes
                            ?.second,
                        ],
                        [
                          "3rd Prize",
                          viewLottery.prizes
                            ?.third,
                        ],
                      ].map(
                        ([label, amount]) => (
                          <div
                            key={label}
                            className="rounded-xl bg-gradient-to-b from-[#FFF9E3] to-[#FFEFA8] p-3 text-center ring-1 ring-[#F3E7C4]"
                          >
                            <p className="text-[10px] font-bold uppercase tracking-wide text-[#9A5B00]">
                              {label}
                            </p>

                            <p className="mt-1 text-lg font-black text-[#1A1204]">
                              ₹
                              {Number(
                                amount || 0
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* ID */}
                  <div className="mt-3 rounded-lg bg-[#FFFDF7] px-3 py-2 text-[11px] text-[#8A8F98] ring-1 ring-[#F3E7C4]">
                    <b className="text-[#374151]">
                      ID:
                    </b>{" "}
                    {viewLottery._id}
                  </div>
                </div>
              </div>

              {/* ENTRIES */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-black text-[#1F2A6B]">
                    User Entries (
                    {viewLottery.users
                      ?.length || 0}
                    )
                  </p>
                </div>

                <div className="overflow-x-auto rounded-xl ring-1 ring-[#F3E7C4]">
                  {viewLottery.users?.length >
                  0 ? (
                    <table className="min-w-full">
                      <thead className="bg-[#FFF9E3]">
                        <tr>
                          <th
                            className={
                              TH_CLS
                            }
                          >
                            #
                          </th>

                          <th
                            className={
                              TH_CLS
                            }
                          >
                            User
                          </th>

                          <th
                            className={
                              TH_CLS
                            }
                          >
                            Number
                          </th>

                          <th
                            className={
                              TH_CLS
                            }
                          >
                            Amount
                          </th>

                          <th
                            className={
                              TH_CLS
                            }
                          >
                            Prize
                          </th>

                          <th
                            className={
                              TH_CLS
                            }
                          >
                            Date
                          </th>

                          <th
                            className={
                              TH_CLS
                            }
                          >
                            Status
                          </th>

                          <th
                            className={
                              TH_CLS
                            }
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-[#F3E7C4]">
                        {viewLottery.users.map(
                          (
                            entry,
                            index
                          ) => (
                            <tr
                              key={
                                entry._id
                              }
                              className="hover:bg-[#FFFDF7]"
                            >
                              <td className="px-4 py-3 text-sm text-[#8A8F98]">
                                {index + 1}
                              </td>

                              <td className="px-4 py-3 text-sm">
                                <div className="font-semibold text-[#1A1A1A]">
                                  {getUserName(
                                    entry.userId
                                  )}
                                </div>

                                <div className="mt-0.5 max-w-[180px] truncate text-xs text-[#8A8F98]">
                                  {typeof entry.userId ===
                                  "object"
                                    ? entry
                                        .userId
                                        ?._id
                                    : entry.userId}
                                </div>
                              </td>

                              <td className="px-4 py-3">
                                <span className="inline-flex rounded-full bg-[#FFEFA8] px-3 py-1 text-sm font-black tracking-wider text-[#1A1204] ring-1 ring-[#F2B705]/60">
                                  {
                                    entry.number
                                  }
                                </span>
                              </td>

                              <td className="px-4 py-3 text-sm font-semibold text-[#1A1A1A]">
                                ₹
                                {Number(
                                  entry.amount ||
                                    0
                                ).toLocaleString(
                                  "en-IN"
                                )}
                              </td>

                              <td className="px-4 py-3 text-sm font-semibold">
                                {entry.status ===
                                "win" ? (
                                  <div>
                                    <span className="text-[#12A36B]">
                                      {entry.prizeType ||
                                        "Winner"}
                                    </span>

                                    {entry.prize && (
                                      <div className="mt-1 text-xs text-[#6B7280]">
                                        ₹
                                        {Number(
                                          entry
                                            .prize
                                            .first ||
                                            entry
                                              .prize
                                              .second ||
                                            entry
                                              .prize
                                              .third ||
                                            0
                                        ).toLocaleString(
                                          "en-IN"
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  "-"
                                )}
                              </td>

                              <td className="px-4 py-3 text-sm text-[#6B7280]">
                                {entry.entryDate ||
                                  "-"}
                              </td>

                              <td className="px-4 py-3">
                                {entry.status ===
                                "win" ? (
                                  <span className="inline-flex rounded-full bg-[#E6F6EF] px-3 py-1 text-xs font-bold text-[#12A36B]">
                                    Win
                                  </span>
                                ) : entry.status ===
                                  "lost" ? (
                                  <span className="inline-flex rounded-full bg-[#FDE8E6] px-3 py-1 text-xs font-bold text-[#D93025]">
                                    Lost
                                  </span>
                                ) : (
                                  <span className="inline-flex rounded-full bg-[#FFEFA8] px-3 py-1 text-xs font-bold text-[#9A5B00]">
                                    Pending
                                  </span>
                                )}
                              </td>

                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleEditEntry(
                                        entry
                                      )
                                    }
                                    className={`rounded-lg px-3 py-1.5 text-xs ${GOLD_BTN}`}
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteEntry(
                                        viewLottery._id,
                                        entry._id
                                      )
                                    }
                                    disabled={
                                      deleteLoading
                                    }
                                    className="rounded-lg bg-[#D93025] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#B3261E] disabled:opacity-50"
                                  >
                                    {deleteLoading
                                      ? "..."
                                      : "Delete"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        )}
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
          DELETE LOTTERY MODAL
      ===================================================== */}

      {deleteId && (
        <ModalShell
          title="Delete Lottery"
          subtitle="This action cannot be undone."
          onClose={() =>
            setDeleteId(null)
          }
          z="z-[75]"
        >
          <div className="p-5">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FDE8E6]">
                <Trash2
                  size={25}
                  className="text-[#D93025]"
                />
              </div>

              <h3 className="mt-4 text-base font-black text-[#1A1A1A]">
                Are you sure?
              </h3>

              <p className="mt-2 max-w-md text-sm text-[#6B7280]">
                This lottery and its associated
                entries will be permanently deleted.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setDeleteId(null)
                }
                className={`rounded-xl px-5 py-2.5 text-sm ${OUTLINE_BTN}`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="rounded-xl bg-[#D93025] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#B3261E] disabled:opacity-50"
              >
                {deleteLoading
                  ? "Deleting..."
                  : "Delete Lottery"}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* =====================================================
          EDIT USER ENTRY MODAL
      ===================================================== */}

      {editingEntry && (
        <ModalShell
          title="Edit User Entry"
          subtitle="Update lottery entry details."
          onClose={closeEditEntry}
          z="z-[80]"
        >
          <form
            onSubmit={handleUpdateEntry}
            className="p-5"
          >
            <div className="mb-4">
              <label className={LABEL_CLS}>
                Lottery Number
              </label>

              <input
                type="text"
                name="number"
                value={editData.number}
                onChange={
                  handleEditEntryChange
                }
                maxLength={7}
                placeholder="1234567"
                className={INPUT_CLS}
              />
            </div>

            <div className="mb-4">
              <label className={LABEL_CLS}>
                Entry Amount
              </label>

              <input
                type="number"
                name="amount"
                value={editData.amount}
                onChange={
                  handleEditEntryChange
                }
                min="0"
                placeholder="100"
                className={INPUT_CLS}
              />
            </div>

            <div className="mb-4">
              <label className={LABEL_CLS}>
                Status
              </label>

              <select
                name="status"
                value={editData.status}
                onChange={
                  handleEditEntryChange
                }
                className={INPUT_CLS}
              >
                <option value="pending">
                  Pending
                </option>

                <option value="win">
                  Win
                </option>

                <option value="lost">
                  Lost
                </option>
              </select>
            </div>

            <div className="mb-5">
              <label className={LABEL_CLS}>
                Entry Date
              </label>

              <input
                type="date"
                name="entryDate"
                value={editData.entryDate}
                onChange={
                  handleEditEntryChange
                }
                className={INPUT_CLS}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={
                  closeEditEntry
                }
                className={`rounded-xl px-5 py-2.5 text-sm ${OUTLINE_BTN}`}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={updateLoading}
                className={`rounded-xl px-5 py-2.5 text-sm disabled:opacity-60 ${GOLD_BTN}`}
              >
                {updateLoading
                  ? "Updating..."
                  : "Update Entry"}
              </button>
            </div>
          </form>
        </ModalShell>
      )}
    </div>
  );
};

/* =========================================================
   SMALL ICON
========================================================= */

const UsersIcon = () => (
  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF9E3] text-[#9A5B00]">
    <Ticket size={14} />
  </span>
);

export default AdminLottery;