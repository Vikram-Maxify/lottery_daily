import {
  AlertTriangle,
  Ban,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Eye,
  EyeOff,
  Gift,
  Globe,
  History,
  Key,
  Laptop,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Smartphone,
  Ticket,
  Trash2,
  UserCheck,
  UserRound,
  Users as UsersIcon,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  clearAdminError,
  clearAdminMessage,
  deleteUser,
  getAllUsers,
  updateUserProfile,
} from "../../reducer/slice/adminAuthReducer";

import { getAllLotteryConfigs } from "../../reducer/slice/lotteryConfigSlice";

import {
  approveKyc,
  clearAdminKycError,
  clearAdminKycSuccess,
  getAllKyc,
  rejectKyc,
  selectAdminKycActionError,
  selectAdminKycActionLoading,
  selectAdminKycDocuments,
  selectAdminKycMessage,
} from "../../reducer/slice/adminKycReducer";

/* =========================================================
   THEME (Bright Gold + White)
========================================================= */

const GOLD_BTN =
  "bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] text-[#1A1204] font-extrabold shadow-[0_4px_10px_-3px_rgba(227,154,0,0.55),inset_0_1px_0_rgba(255,255,255,0.55)] hover:brightness-105";

const OUTLINE_BTN =
  "border border-[#F2B705] bg-white font-bold text-[#9A5B00] hover:bg-[#FFEFA8]/60";

const INPUT_CLS =
  "w-full rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] px-4 py-3 text-sm text-[#1A1A1A] outline-none transition placeholder:text-[#8A8F98] focus:border-[#F2B705] focus:ring-2 focus:ring-[#FFEFA8] disabled:bg-[#F5F1E4] disabled:text-[#8A8F98]";

const CARD_CLS =
  "rounded-2xl border border-[#F3E7C4] bg-white shadow-[0_6px_18px_-10px_rgba(247,181,0,0.35)]";

const TH_CLS =
  "px-3 py-3 text-left text-[11px] font-bold tracking-wide text-[#6B7280]";

const PAGE_SIZES = [10, 25, 50, 100];

const TONES = {
  green: "bg-[#E6F6EF] text-[#12A36B] ring-[#12A36B]/20",
  amber: "bg-[#FFF1CC] text-[#B26A00] ring-[#F2B705]/30",
  red: "bg-[#FDE8E6] text-[#D93025] ring-[#D93025]/20",
  blue: "bg-[#E8F1FD] text-[#2E7DD7] ring-[#2E7DD7]/20",
  gray: "bg-[#F1F2F4] text-[#6B7280] ring-[#D5D8DD]",
};

const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;

/* =========================================================
   DYNAMIC ACTIVITY & STATUS HELPERS
========================================================= */

/**
 * Dynamic calculation of activity status from lastLogin.time:
 * - Active: login within the last 4 days (including current time).
 * - Inactive: > 4 days elapsed, or never logged in, or null/invalid.
 */
const calculateUserActivity = (user) => {
  const loginTime = user?.lastLogin?.time;
  if (!loginTime) {
    return {
      isActive: false,
      label: "Inactive",
      tone: "gray",
      detail: "Never logged in",
    };
  }

  const d = new Date(loginTime);
  const timeMs = d.getTime();
  if (Number.isNaN(timeMs)) {
    return {
      isActive: false,
      label: "Inactive",
      tone: "gray",
      detail: "Never logged in",
    };
  }

  const now = Date.now();
  const diffMs = now - timeMs;

  // Active: within 4 days (with 1-min clock-skew allowance)
  if (diffMs <= FOUR_DAYS_MS && diffMs >= -60000) {
    const hours = Math.floor(Math.max(0, diffMs) / (60 * 60 * 1000));
    const days = Math.floor(Math.max(0, diffMs) / (24 * 60 * 60 * 1000));

    let timeAgo = "Just now";
    if (hours < 1) timeAgo = "Just now";
    else if (hours < 24) timeAgo = `${hours}h ago`;
    else timeAgo = `${days}d ago`;

    return {
      isActive: true,
      label: "Active",
      tone: "green",
      detail: `Logged in ${timeAgo}`,
    };
  }

  const daysAgo = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  return {
    isActive: false,
    label: "Inactive",
    tone: "gray",
    detail: daysAgo > 0 ? `Last seen ${daysAgo}d ago` : "Last login > 4d",
  };
};

/**
 * KYC Status based on isKycVerified and documents
 */
const calculateUserKyc = (user) => {
  if (user?.isKycVerified) {
    return { label: "Verified", tone: "green", isVerified: true };
  }
  if (user?._kycDocStatus === "pending") {
    return { label: "Pending", tone: "amber", isVerified: false };
  }
  if (user?._kycDocStatus === "rejected") {
    return { label: "Rejected", tone: "red", isVerified: false };
  }
  return { label: "Pending", tone: "amber", isVerified: false };
};

const idOf = (v) =>
  String(v && typeof v === "object" ? (v._id ?? "") : (v ?? ""));

const docUserId = (doc) => idOf(doc?.user ?? doc?.userId ?? doc?.userID);

const deriveKycDocsStatus = (docs) => {
  if (!Array.isArray(docs) || docs.length === 0) return "not_submitted";
  const s = docs.map((d) => String(d?.status || "").toLowerCase());
  if (s.includes("approved") || s.includes("verified")) return "approved";
  if (s.includes("pending")) return "pending";
  if (s.includes("rejected")) return "rejected";
  return "not_submitted";
};

const isMobileVerified = (u) =>
  Boolean(
    u?.isMobileVerified ??
      u?.mobileVerified ??
      u?.phoneVerified ??
      u?.isVerified ??
      false
  );

// "Rahul Sharma" -> "RS", "Rahul" -> "RA"
const getInitials = (name) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
};

const toYMD = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const fmtDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const fmtDateTime = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const pageList = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, 2, current - 1, current, current + 1, total]);
  const sorted = [...set]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);
  const out = [];
  sorted.forEach((n, i) => {
    if (i && n - sorted[i - 1] > 1) out.push("...");
    out.push(n);
  });
  return out;
};

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

const EMPTY_FILTERS = {
  search: "",
  mobile: "all",
  account: "all", // all | active | inactive
  kyc: "all",
  date: "",
};

/* =========================================================
   COMPONENTS
========================================================= */

const Pill = ({ tone = "gray", children, className = "" }) => (
  <span
    className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-bold ring-1 ${TONES[tone] || TONES.gray} ${className}`}
  >
    {children}
  </span>
);

const Avatar = ({ user, size = "h-9 w-9", text = "text-sm" }) => {
  const img = user?.profileImage || user?.avatar || user?.photo;
  return img ? (
    <img
      src={img}
      alt=""
      className={`${size} shrink-0 rounded-full object-cover ring-1 ring-[#F2B705]`}
    />
  ) : (
    <div
      className={`flex ${size} ${text} shrink-0 items-center justify-center rounded-full bg-[#FFEFA8] font-black tracking-wide text-[#1A1204] ring-1 ring-[#F2B705]`}
    >
      {getInitials(user?.name)}
    </div>
  );
};

const StatCard = ({ icon, label, value, bg }) => (
  <div className={`flex items-center gap-3 p-3 ${CARD_CLS}`}>
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bg}`}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p className="truncate text-[11px] font-semibold text-[#6B7280]">
        {label}
      </p>
      <p className="text-xl font-black leading-tight text-[#1A1A1A]">
        {Number(value).toLocaleString("en-IN")}
      </p>
    </div>
  </div>
);

const Field = ({ label, children }) => (
  <div className="min-w-0">
    <label className="mb-1 block text-[11px] font-semibold text-[#6B7280]">
      {label}
    </label>
    {children}
  </div>
);

/* =========================================================
   MAIN USERS PAGE
========================================================= */

const Users = () => {
  const dispatch = useDispatch();

  // ---------- REDUX ----------
  const {
    users = [],
    usersLoading,
    usersError,
    updateLoading,
    deleteLoading,
    error,
    message,
  } = useSelector((state) => state.adminAuth);

  const { configs = [], loading: lotteryLoading } = useSelector(
    (state) => state.lotteryConfig || {}
  );

  const kycDocs = useSelector(selectAdminKycDocuments);
  const kycActionLoading = useSelector(selectAdminKycActionLoading);
  const kycActionError = useSelector(selectAdminKycActionError);
  const kycMessage = useSelector(selectAdminKycMessage);

  // ---------- LOCAL STATE ----------
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [checked, setChecked] = useState(new Set());

  // Action Modals State
  const [viewUser, setViewUser] = useState(null);
  const [showPlainPassword, setShowPlainPassword] = useState(false);
  const [viewTab, setViewTab] = useState("overview"); // overview | history | kyc

  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    password: "",
    wallet: 0,
    isKycVerified: false,
  });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [copiedKey, setCopiedKey] = useState("");

  const [rejectDocId, setRejectDocId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // ---------- FETCH ----------
  useEffect(() => {
    dispatch(getAllUsers());
    dispatch(getAllLotteryConfigs());
    dispatch(getAllKyc());
  }, [dispatch]);

  // ---------- ENRICHED ROWS ----------
  const rows = useMemo(() => {
    const kycByUser = {};
    (Array.isArray(kycDocs) ? kycDocs : []).forEach((doc) => {
      const uid = docUserId(doc);
      if (!uid) return;
      (kycByUser[uid] ||= []).push(doc);
    });

    const ticketsByUser = {};
    (Array.isArray(configs) ? configs : []).forEach((config) => {
      (Array.isArray(config?.users) ? config.users : []).forEach((t) => {
        const uid = idOf(t?.userId);
        if (!uid) return;
        (ticketsByUser[uid] ||= []).push({
          ...t,
          marketName: config.marketName || config.name || "Lottery",
        });
      });
    });

    return users.map((u) => {
      const uid = String(u._id);
      const docs = kycByUser[uid] || [];
      const docStatus = deriveKycDocsStatus(docs);
      const activity = calculateUserActivity(u);
      const kyc = calculateUserKyc({ ...u, _kycDocStatus: docStatus });

      return {
        ...u,
        _kycDocs: docs,
        _kycDocStatus: docStatus,
        _kyc: kyc,
        _activity: activity,
        _mobileVerified: isMobileVerified(u),
        _tickets: ticketsByUser[uid] || [],
      };
    });
  }, [users, kycDocs, configs]);

  // Keep viewUser synchronized when users array updates
  useEffect(() => {
    if (viewUser) {
      const updated = rows.find(
        (r) => r.uuid === viewUser.uuid || String(r._id) === String(viewUser._id)
      );
      if (updated) setViewUser(updated);
    }
  }, [rows]);

  // ---------- STATS ----------
  const stats = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((r) => r._activity.isActive).length,
      inactive: rows.filter((r) => !r._activity.isActive).length,
      kycVerified: rows.filter((r) => r._kyc.isVerified).length,
      pendingKyc: rows.filter((r) => !r._kyc.isVerified).length,
      mobileVerified: rows.filter((r) => r._mobileVerified).length,
    }),
    [rows]
  );

  // ---------- FILTERING ----------
  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return rows.filter((r) => {
      if (term) {
        const hay = [r.name, r.mobile, r.uuid, r._id, r.referralCode]
          .map((v) => String(v || "").toLowerCase())
          .join(" ");
        if (!hay.includes(term)) return false;
      }

      if (filters.mobile === "verified" && !r._mobileVerified) return false;
      if (filters.mobile === "unverified" && r._mobileVerified) return false;

      // Dynamic activity filter
      if (filters.account === "active" && !r._activity.isActive) return false;
      if (filters.account === "inactive" && r._activity.isActive) return false;

      // KYC filter
      if (filters.kyc === "approved" && !r._kyc.isVerified) return false;
      if (filters.kyc === "pending" && r._kyc.label !== "Pending") return false;
      if (filters.kyc === "rejected" && r._kyc.label !== "Rejected") return false;
      if (filters.kyc === "not_submitted" && r._kycDocs.length > 0) return false;

      if (filters.date && toYMD(r.createdAt) !== filters.date) return false;

      return true;
    });
  }, [rows, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * perPage;
  const pageRows = filtered.slice(start, start + perPage);

  // ---------- HANDLERS ----------
  const applyFilters = () => {
    setFilters(draft);
    setPage(1);
  };

  const resetFilters = () => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const refresh = () => {
    dispatch(clearAdminError());
    dispatch(getAllUsers());
    dispatch(getAllLotteryConfigs());
    dispatch(getAllKyc());
  };

  const toggleOne = (id) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allOnPageChecked =
    pageRows.length > 0 && pageRows.every((r) => checked.has(String(r._id)));

  const toggleAllOnPage = () =>
    setChecked((prev) => {
      const next = new Set(prev);
      pageRows.forEach((r) =>
        allOnPageChecked
          ? next.delete(String(r._id))
          : next.add(String(r._id))
      );
      return next;
    });

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(""), 2000);
  };

  // 1. VIEW ACTION
  const openView = (u) => {
    setViewUser(u);
    setShowPlainPassword(false);
    setViewTab("overview");
  };

  const closeView = () => {
    setViewUser(null);
    setShowPlainPassword(false);
  };

  // 2. EDIT ACTION
  const openEdit = (u) => {
    setEditUser(u);
    setForm({
      name: u.name || "",
      mobile: u.mobile || "",
      password: "",
      wallet: Number(u.wallet || 0),
      isKycVerified: Boolean(u.isKycVerified),
    });
    dispatch(clearAdminError());
    dispatch(clearAdminMessage());
  };

  const closeEdit = () => {
    setEditUser(null);
    setForm({ name: "", mobile: "", password: "", wallet: 0, isKycVerified: false });
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editUser) return;

    const payload = {
      uuid: editUser.uuid,
      name: form.name.trim(),
      mobile: form.mobile.trim(),
      wallet: Number(form.wallet) || 0,
      isKycVerified: Boolean(form.isKycVerified),
    };

    if (form.password.trim()) {
      payload.password = form.password.trim();
    }

    const res = await dispatch(updateUserProfile(payload));
    if (updateUserProfile.fulfilled.match(res)) {
      closeEdit();
    }
  };

  // 3. DELETE ACTION
  const openDelete = (u) => {
    setDeleteTarget(u);
    dispatch(clearAdminError());
    dispatch(clearAdminMessage());
  };

  const closeDelete = () => {
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    const res = await dispatch(deleteUser(deleteTarget.uuid || deleteTarget._id));
    if (deleteUser.fulfilled.match(res)) {
      if (viewUser && (viewUser.uuid === deleteTarget.uuid || viewUser._id === deleteTarget._id)) {
        closeView();
      }
      closeDelete();
    }
  };

  // KYC Actions inside View Modal
  const handleApproveKyc = async (id) => {
    dispatch(clearAdminKycError());
    dispatch(clearAdminKycSuccess());
    await dispatch(approveKyc(id));
    dispatch(getAllUsers());
  };

  const handleRejectKyc = async (id) => {
    dispatch(clearAdminKycError());
    dispatch(clearAdminKycSuccess());
    const res = await dispatch(
      rejectKyc({ id, rejectionReason: rejectReason })
    );
    if (rejectKyc.fulfilled.match(res)) {
      setRejectDocId(null);
      setRejectReason("");
      dispatch(getAllUsers());
    }
  };

  // EXPORT CSV
  const exportCsv = () => {
    const list = checked.size
      ? filtered.filter((r) => checked.has(String(r._id)))
      : filtered;

    const head = [
      "User ID",
      "UUID",
      "Name",
      "Mobile",
      "Dynamic Activity Status",
      "Activity Detail",
      "KYC Status",
      "Wallet Balance",
      "Referral Code",
      "Referred By",
      "Last Login Time",
      "Last Login IP",
      "Last Login Device",
      "Join Date",
    ];

    const body = list.map((r) => [
      r._id,
      r.uuid,
      r.name,
      r.mobile,
      r._activity.label,
      r._activity.detail,
      r._kyc.label,
      r.wallet || 0,
      r.referralCode || "-",
      r.referralBy || "-",
      r.lastLogin?.time ? fmtDateTime(r.lastLogin.time) : "Never",
      r.lastLogin?.ip || "-",
      r.lastLogin?.device || "-",
      fmtDate(r.createdAt),
    ]);

    const csv = [head, ...body]
      .map((row) => row.map(csvCell).join(","))
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${toYMD(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const banner = message || kycMessage;
  const bannerError = usersError || error || kycActionError;

  return (
    <div className="min-h-screen space-y-4 bg-[#FFFDF7] p-4 md:p-6">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#1A1A1A]">
            User Management
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Manage users, view complete account details, edit profiles, and perform actions.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={usersLoading || lotteryLoading}
          className={`inline-flex items-center gap-2 self-start rounded-xl px-4 py-2.5 text-sm transition disabled:opacity-50 sm:self-auto ${OUTLINE_BTN}`}
        >
          <RefreshCw
            size={15}
            className={usersLoading || lotteryLoading ? "animate-spin" : ""}
          />
          {usersLoading || lotteryLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          bg="bg-[#FFEFA8]"
          label="Total Users"
          value={stats.total}
          icon={<UserRound size={24} className="text-[#9A5B00]" />}
        />
        <StatCard
          bg="bg-[#E6F6EF]"
          label="Active (≤ 4 Days)"
          value={stats.active}
          icon={<UsersIcon size={24} className="text-[#12A36B]" />}
        />
        <StatCard
          bg="bg-[#F1F2F4]"
          label="Inactive Users"
          value={stats.inactive}
          icon={<Clock size={22} className="text-[#6B7280]" />}
        />
        <StatCard
          bg="bg-[#E6F6EF]"
          label="KYC Verified"
          value={stats.kycVerified}
          icon={<ShieldCheck size={24} className="text-[#12A36B]" />}
        />
        <StatCard
          bg="bg-[#FFF1CC]"
          label="Pending KYC"
          value={stats.pendingKyc}
          icon={<Shield size={22} className="text-[#B26A00]" />}
        />
        <StatCard
          bg="bg-[#E8F1FD]"
          label="Verified Mobile"
          value={stats.mobileVerified}
          icon={<Phone size={22} className="text-[#2E7DD7]" />}
        />
      </div>

      {/* NOTIFICATIONS */}
      {banner && (
        <div className="flex items-center justify-between rounded-xl border border-[#12A36B]/30 bg-[#E6F6EF] px-4 py-3 text-sm font-medium text-[#0E7A52]">
          <span className="flex items-center gap-2">
            <Check size={18} className="text-[#12A36B]" />
            {banner}
          </span>
          <button
            type="button"
            onClick={() => {
              dispatch(clearAdminMessage());
              dispatch(clearAdminKycSuccess());
            }}
            className="ml-4 text-lg font-bold"
          >
            ×
          </button>
        </div>
      )}

      {bannerError && (
        <div className="flex items-center justify-between rounded-xl border border-[#D93025]/30 bg-[#FDE8E6] px-4 py-3 text-sm font-medium text-[#B3261E]">
          <span className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-[#D93025]" />
            {String(bannerError)}
          </span>
          <button
            type="button"
            onClick={() => {
              dispatch(clearAdminError());
              dispatch(clearAdminKycError());
            }}
            className="ml-4 text-lg font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* FILTERS */}
      <div className={`p-4 ${CARD_CLS}`}>
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_auto_auto]">
          <Field label="Search User">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8F98]"
              />
              <input
                type="text"
                value={draft.search}
                onChange={(e) => setDraft({ ...draft, search: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                placeholder="Name, Mobile, UUID or User ID..."
                className={`${INPUT_CLS} py-2.5 pl-9`}
              />
            </div>
          </Field>

          <Field label="Dynamic Activity Status">
            <select
              value={draft.account}
              onChange={(e) => setDraft({ ...draft, account: e.target.value })}
              className={`${INPUT_CLS} py-2.5`}
            >
              <option value="all">All Status</option>
              <option value="active">Active (≤ 4 Days)</option>
              <option value="inactive">Inactive (&gt; 4 Days / Never)</option>
            </select>
          </Field>

          <Field label="KYC Status">
            <select
              value={draft.kyc}
              onChange={(e) => setDraft({ ...draft, kyc: e.target.value })}
              className={`${INPUT_CLS} py-2.5`}
            >
              <option value="all">All Status</option>
              <option value="approved">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="not_submitted">Not Submitted</option>
            </select>
          </Field>

          <Field label="Mobile Verification">
            <select
              value={draft.mobile}
              onChange={(e) => setDraft({ ...draft, mobile: e.target.value })}
              className={`${INPUT_CLS} py-2.5`}
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="unverified">Not Verified</option>
            </select>
          </Field>

          <Field label="Join Date">
            <input
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              className={`${INPUT_CLS} py-2.5`}
            />
          </Field>

          <button
            type="button"
            onClick={applyFilters}
            className={`rounded-xl px-6 py-2.5 text-sm ${GOLD_BTN}`}
          >
            Search
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className={`rounded-xl px-6 py-2.5 text-sm ${OUTLINE_BTN}`}
          >
            Reset
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className={`min-w-0 overflow-hidden ${CARD_CLS}`}>
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2">
            <UsersIcon size={20} className="text-[#9A5B00]" />
            <h2 className="font-black text-[#1A1A1A]">
              User List ({filtered.length.toLocaleString("en-IN")})
            </h2>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs ${OUTLINE_BTN}`}
          >
            <Download size={14} />
            Export{checked.size ? ` (${checked.size})` : ""}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-[#FFF9E3]">
              <tr>
                <th className={`${TH_CLS} w-10`}>#</th>
                <th className={`${TH_CLS} w-8`}>
                  <input
                    type="checkbox"
                    checked={allOnPageChecked}
                    onChange={toggleAllOnPage}
                    className="h-4 w-4 accent-[#F7B500]"
                  />
                </th>
                <th className={TH_CLS}>User</th>
                <th className={TH_CLS}>Mobile Number</th>
                <th className={TH_CLS}>Activity Status</th>
                <th className={TH_CLS}>KYC Status</th>
                <th className={TH_CLS}>Last Login</th>
                <th className={TH_CLS}>Join Date</th>
                <th className={`${TH_CLS} text-center`}>Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#F3E7C4]">
              {usersLoading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-16 text-center">
                    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-[#FFEFA8] border-t-[#F7B500]" />
                    <p className="text-sm text-[#6B7280]">Loading users...</p>
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-16 text-center">
                    <p className="font-bold text-[#1A1A1A]">No users found</p>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      Try changing or resetting your search filters.
                    </p>
                  </td>
                </tr>
              ) : (
                pageRows.map((u, i) => {
                  const id = String(u._id);
                  const isChecked = checked.has(id);

                  return (
                    <tr
                      key={id}
                      className="transition hover:bg-[#FFFDF7]"
                    >
                      <td className="px-3 py-3 text-sm text-[#6B7280]">
                        {start + i + 1}
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleOne(id)}
                          className="h-4 w-4 accent-[#F7B500]"
                        />
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar user={u} />
                          <div className="min-w-0">
                            <span className="block max-w-[150px] truncate text-sm font-bold text-[#1A1A1A]">
                              {u.name || "-"}
                            </span>
                            <span className="block font-mono text-[11px] text-[#8A8F98]">
                              ID: {u._id ? String(u._id).slice(-6) : "-"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 text-sm font-semibold text-[#1A1A1A]">
                        {u.mobile || "-"}
                      </td>

                      {/* Dynamic Account Activity Status */}
                      <td className="px-3 py-3">
                        <Pill tone={u._activity.tone}>
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              u._activity.isActive ? "bg-[#12A36B]" : "bg-[#9CA3AF]"
                            }`}
                          />
                          {u._activity.label}
                        </Pill>
                        <span className="mt-0.5 block text-[10px] text-[#8A8F98]">
                          {u._activity.detail}
                        </span>
                      </td>

                      {/* KYC Status from isKycVerified */}
                      <td className="px-3 py-3">
                        <Pill tone={u._kyc.tone}>{u._kyc.label}</Pill>
                      </td>

                      {/* Last Login date & time */}
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-[#6B7280]">
                        {u.lastLogin?.time ? (
                          <div>
                            <span className="font-semibold text-[#1A1A1A]">
                              {fmtDateTime(u.lastLogin.time)}
                            </span>
                            {u.lastLogin.device && (
                              <span className="block text-[10px] text-[#8A8F98]">
                                {u.lastLogin.device}{" "}
                                {u.lastLogin.os ? `• ${u.lastLogin.os}` : ""}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="font-medium text-[#9CA3AF]">
                            Never logged in
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 text-sm text-[#6B7280]">
                        {fmtDate(u.createdAt)}
                      </td>

                      {/* EXACTLY THREE DISTINCT ACTIONS: VIEW, EDIT, DELETE */}
                      <td className="whitespace-nowrap px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1. VIEW BUTTON */}
                          <button
                            type="button"
                            onClick={() => openView(u)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#2E7DD7]/30 bg-[#E8F1FD] px-2.5 py-1.5 text-xs font-bold text-[#2E7DD7] transition hover:bg-[#2E7DD7] hover:text-white"
                            title="View Complete Details"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>

                          {/* 2. EDIT BUTTON */}
                          <button
                            type="button"
                            onClick={() => openEdit(u)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#F2B705]/40 bg-[#FFF9E3] px-2.5 py-1.5 text-xs font-bold text-[#9A5B00] transition hover:bg-[#F7B500] hover:text-[#1A1204]"
                            title="Edit User Profile"
                          >
                            <Pencil size={13} />
                            <span>Edit</span>
                          </button>

                          {/* 3. DELETE BUTTON */}
                          <button
                            type="button"
                            onClick={() => openDelete(u)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#D93025]/30 bg-[#FDE8E6] px-2.5 py-1.5 text-xs font-bold text-[#D93025] transition hover:bg-[#D93025] hover:text-white"
                            title="Delete User"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-[#F3E7C4] px-4 py-3 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            Show
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-[#F3E7C4] bg-white px-2 py-1.5 text-sm text-[#1A1A1A]"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            per page
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#F3E7C4] disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            {pageList(currentPage, totalPages).map((p, i) =>
              p === "..." ? (
                <span key={`d${i}`} className="px-1 text-[#8A8F98]">
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`h-8 min-w-8 rounded-lg px-2 text-sm font-bold ${
                    p === currentPage
                      ? GOLD_BTN
                      : "border border-[#F3E7C4] bg-white text-[#1A1A1A] hover:bg-[#FFEFA8]/60"
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#F3E7C4] disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================
         1. VIEW USER DETAILS MODAL
      ========================================================= */}
      {viewUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1204]/60 p-4 backdrop-blur-[2px]"
          onClick={closeView}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#F3E7C4] bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#F3E7C4] bg-[#FFFDF7] px-6 py-4">
              <div className="flex items-center gap-3">
                <Avatar user={viewUser} size="h-12 w-12" text="text-lg" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-[#1A1A1A]">
                      {viewUser.name || "User Details"}
                    </h2>
                    <Pill tone={viewUser._activity.tone}>
                      {viewUser._activity.label}
                    </Pill>
                    <Pill tone={viewUser._kyc.tone}>
                      {viewUser._kyc.label}
                    </Pill>
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    {viewUser._activity.detail} • Registered on{" "}
                    {fmtDate(viewUser.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    openEdit(viewUser);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs ${OUTLINE_BTN}`}
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openDelete(viewUser);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#D93025]/30 bg-[#FDE8E6] px-3 py-1.5 text-xs font-bold text-[#D93025] hover:bg-[#D93025] hover:text-white"
                >
                  <Trash2 size={13} /> Delete
                </button>
                <button
                  type="button"
                  onClick={closeView}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[#8A8F98] hover:bg-[#FFEFA8]"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-[#F3E7C4] bg-[#FFF9E3]/50 px-6">
              {[
                { id: "overview", label: "Overview & Credentials", icon: <UserRound size={14} /> },
                { id: "history", label: "Login History", icon: <History size={14} /> },
                { id: "kyc", label: "KYC Documents", icon: <ShieldCheck size={14} /> },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setViewTab(t.id)}
                  className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
                    viewTab === t.id
                      ? "border-[#F7B500] text-[#9A5B00]"
                      : "border-transparent text-[#6B7280] hover:text-[#1A1A1A]"
                  }`}
                >
                  {t.icon}
                  {t.label}
                  {t.id === "history" && viewUser.loginHistory?.length > 0 && (
                    <span className="rounded-full bg-[#FFEFA8] px-1.5 py-0.2 text-[10px] text-[#9A5B00]">
                      {viewUser.loginHistory.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              {viewTab === "overview" && (
                <>
                  {/* Account Information Section */}
                  <div>
                    <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-[#9A5B00]">
                      Account Information
                    </h3>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <div className="rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-3">
                        <p className="text-[11px] font-semibold text-[#6B7280]">
                          Full Name
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-[#1A1A1A]">
                          {viewUser.name || "Not available"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-3">
                        <p className="text-[11px] font-semibold text-[#6B7280]">
                          Mobile Number
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-[#1A1A1A]">
                          {viewUser.mobile || "Not available"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-semibold text-[#6B7280]">
                            User ID (_id)
                          </p>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(viewUser._id, "id")}
                            className="text-xs font-semibold text-[#9A5B00] hover:underline"
                          >
                            {copiedKey === "id" ? "Copied!" : "Copy"}
                          </button>
                        </div>
                        <p className="mt-0.5 break-all font-mono text-xs font-bold text-[#1A1A1A]">
                          {viewUser._id || "Not available"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-semibold text-[#6B7280]">
                            UUID
                          </p>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(viewUser.uuid, "uuid")}
                            className="text-xs font-semibold text-[#9A5B00] hover:underline"
                          >
                            {copiedKey === "uuid" ? "Copied!" : "Copy"}
                          </button>
                        </div>
                        <p className="mt-0.5 break-all font-mono text-xs font-bold text-[#1A1A1A]">
                          {viewUser.uuid || "Not available"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-3">
                        <p className="text-[11px] font-semibold text-[#6B7280]">
                          Role
                        </p>
                        <p className="mt-0.5 text-sm font-bold capitalize text-[#1A1A1A]">
                          {viewUser.role || "user"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-3">
                        <p className="text-[11px] font-semibold text-[#6B7280]">
                          Registration Date
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-[#1A1A1A]">
                          {fmtDateTime(viewUser.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Password & Credentials Section */}
                  <div>
                    <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-[#9A5B00]">
                      Security & Credentials
                    </h3>
                    <div className="rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-3.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-semibold text-[#6B7280]">
                            Password (Admin Authorized Access)
                          </p>
                          {viewUser.plainPassword ? (
                            <p className="mt-1 font-mono text-base font-bold text-[#1A1A1A]">
                              {showPlainPassword
                                ? viewUser.plainPassword
                                : "••••••••••••"}
                            </p>
                          ) : (
                            <p className="mt-1 text-xs italic text-[#9CA3AF]">
                              Not available (Encrypted / never stored in plain text)
                            </p>
                          )}
                        </div>

                        {viewUser.plainPassword && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setShowPlainPassword((prev) => !prev)}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#F3E7C4] bg-white px-2.5 py-1.5 text-xs font-bold text-[#6B7280] hover:bg-[#FFEFA8]"
                            >
                              {showPlainPassword ? (
                                <>
                                  <EyeOff size={14} /> Hide
                                </>
                              ) : (
                                <>
                                  <Eye size={14} /> Reveal
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(viewUser.plainPassword, "pass")
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-[#F3E7C4] bg-white px-2.5 py-1.5 text-xs font-bold text-[#6B7280] hover:bg-[#FFEFA8]"
                            >
                              {copiedKey === "pass" ? (
                                <Check size={14} className="text-[#12A36B]" />
                              ) : (
                                <Copy size={14} />
                              )}
                              Copy
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Wallet & Referral Section */}
                  <div>
                    <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-[#9A5B00]">
                      Wallet & Referrals
                    </h3>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                      <div className="rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-3">
                        <p className="text-[11px] font-semibold text-[#6B7280]">
                          Wallet Balance
                        </p>
                        <p className="mt-0.5 text-base font-black text-[#12A36B]">
                          ₹{Number(viewUser.wallet || 0).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-semibold text-[#6B7280]">
                            Referral Code
                          </p>
                          {viewUser.referralCode && (
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(viewUser.referralCode, "ref")
                              }
                              className="text-xs font-semibold text-[#9A5B00] hover:underline"
                            >
                              {copiedKey === "ref" ? "Copied!" : "Copy"}
                            </button>
                          )}
                        </div>
                        <p className="mt-0.5 font-mono text-sm font-bold text-[#1A1A1A]">
                          {viewUser.referralCode || "Not generated"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-3">
                        <p className="text-[11px] font-semibold text-[#6B7280]">
                          Referred By
                        </p>
                        <p className="mt-0.5 font-mono text-sm font-bold text-[#1A1A1A]">
                          {viewUser.referralBy || viewUser.referral || "None"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Last Login & Device Details */}
                  <div>
                    <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-[#9A5B00]">
                      Last Login Details
                    </h3>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <div className="rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-3">
                        <p className="text-[11px] font-semibold text-[#6B7280]">
                          Last Login Date & Time
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-[#1A1A1A]">
                          {viewUser.lastLogin?.time
                            ? fmtDateTime(viewUser.lastLogin.time)
                            : "Never logged in"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-3">
                        <p className="text-[11px] font-semibold text-[#6B7280]">
                          IP Address
                        </p>
                        <p className="mt-0.5 font-mono text-sm font-bold text-[#1A1A1A]">
                          {viewUser.lastLogin?.ip || "Not available"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-3">
                        <p className="text-[11px] font-semibold text-[#6B7280]">
                          Device & OS
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-[#1A1A1A]">
                          {viewUser.lastLogin?.device || "Not available"}
                          {viewUser.lastLogin?.os
                            ? ` (${viewUser.lastLogin.os})`
                            : ""}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-3">
                        <p className="text-[11px] font-semibold text-[#6B7280]">
                          Browser
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-[#1A1A1A]">
                          {viewUser.lastLogin?.browser || "Not available"}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Login History Tab */}
              {viewTab === "history" && (
                <div>
                  <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-[#9A5B00]">
                    Recent Login History
                  </h3>
                  {Array.isArray(viewUser.loginHistory) &&
                  viewUser.loginHistory.length > 0 ? (
                    <div className="divide-y divide-[#F3E7C4] overflow-hidden rounded-xl border border-[#F3E7C4] bg-[#FFFDF7]">
                      {viewUser.loginHistory.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col justify-between gap-2 p-3 text-xs sm:flex-row sm:items-center"
                        >
                          <div>
                            <span className="font-bold text-[#1A1A1A]">
                              {fmtDateTime(item.time)}
                            </span>
                            <span className="ml-2 font-mono text-[11px] text-[#6B7280]">
                              IP: {item.ip || "Not available"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[#8A8F98]">
                            <span>{item.device || "Desktop"}</span>
                            <span>•</span>
                            <span>{item.os || "OS"}</span>
                            <span>•</span>
                            <span>{item.browser || "Browser"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-8 text-center">
                      <Clock size={28} className="mx-auto mb-2 text-[#8A8F98]" />
                      <p className="text-sm font-bold text-[#1A1A1A]">
                        No Login History Recorded
                      </p>
                      <p className="mt-1 text-xs text-[#6B7280]">
                        The user has not logged in recently or session tracking was empty.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* KYC Documents Tab */}
              {viewTab === "kyc" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#9A5B00]">
                      Submitted KYC Documents
                    </h3>
                    <Pill tone={viewUser._kyc.tone}>
                      Current Status: {viewUser._kyc.label}
                    </Pill>
                  </div>

                  {viewUser._kycDocs && viewUser._kycDocs.length > 0 ? (
                    viewUser._kycDocs.map((doc) => {
                      const st = String(doc.status || "pending").toLowerCase();
                      const link =
                        doc.documentUrl ||
                        doc.image ||
                        doc.frontImage ||
                        doc.file;

                      return (
                        <div
                          key={doc._id}
                          className="rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-3.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-bold text-[#1A1A1A]">
                              {doc.documentType || doc.type || "Document"}
                            </p>
                            <Pill
                              tone={
                                st === "approved" || st === "verified"
                                  ? "green"
                                  : st === "rejected"
                                  ? "red"
                                  : "amber"
                              }
                            >
                              {st}
                            </Pill>
                          </div>

                          {(doc.documentNumber || doc.number) && (
                            <p className="mt-1 font-mono text-xs text-[#6B7280]">
                              Number: {doc.documentNumber || doc.number}
                            </p>
                          )}

                          {link && (
                            <a
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-block text-xs font-bold text-[#9A5B00] underline"
                            >
                              View uploaded file
                            </a>
                          )}

                          {doc.rejectionReason && (
                            <p className="mt-1 text-xs text-[#D93025]">
                              Reason: {doc.rejectionReason}
                            </p>
                          )}

                          {st === "pending" && (
                            <div className="mt-3">
                              {rejectDocId === doc._id ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={rejectReason}
                                    onChange={(e) =>
                                      setRejectReason(e.target.value)
                                    }
                                    rows={2}
                                    placeholder="Enter rejection reason..."
                                    className={`${INPUT_CLS} py-2`}
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRejectDocId(null);
                                        setRejectReason("");
                                      }}
                                      className={`flex-1 rounded-lg px-3 py-1.5 text-xs ${OUTLINE_BTN}`}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      disabled={
                                        kycActionLoading || !rejectReason.trim()
                                      }
                                      onClick={() => handleRejectKyc(doc._id)}
                                      className="flex-1 rounded-lg bg-[#D93025] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                                    >
                                      Confirm Reject
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    disabled={kycActionLoading}
                                    onClick={() => handleApproveKyc(doc._id)}
                                    className={`flex-1 rounded-lg px-3 py-1.5 text-xs disabled:opacity-50 ${GOLD_BTN}`}
                                  >
                                    Approve Document
                                  </button>
                                  <button
                                    type="button"
                                    disabled={kycActionLoading}
                                    onClick={() => setRejectDocId(doc._id)}
                                    className="flex-1 rounded-lg border border-[#D93025]/40 px-3 py-1.5 text-xs font-bold text-[#D93025] hover:bg-[#FDE8E6]"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-8 text-center">
                      <Shield size={28} className="mx-auto mb-2 text-[#8A8F98]" />
                      <p className="text-sm font-bold text-[#1A1A1A]">
                        No KYC Documents Submitted
                      </p>
                      <p className="mt-1 text-xs text-[#6B7280]">
                        The user has not submitted any verification documents yet.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-[#F3E7C4] bg-[#FFFDF7] px-6 py-3">
              <button
                type="button"
                onClick={closeView}
                className={`rounded-xl px-5 py-2 text-sm ${OUTLINE_BTN}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
         2. EDIT USER MODAL
      ========================================================= */}
      {editUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1204]/60 p-4 backdrop-blur-[2px]"
          onClick={closeEdit}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-[#F3E7C4] bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#F3E7C4] px-6 py-4">
              <div>
                <h2 className="text-lg font-black text-[#1A1A1A]">Edit User</h2>
                <p className="text-xs text-[#6B7280]">
                  Update user profile, credentials and wallet
                </p>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#8A8F98] hover:bg-[#FFEFA8]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitEdit} className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#1A1A1A]">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={INPUT_CLS}
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#1A1A1A]">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  className={INPUT_CLS}
                  placeholder="Enter mobile number"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#1A1A1A]">
                  New Password (Optional)
                </label>
                <input
                  type="password"
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={INPUT_CLS}
                  placeholder="Leave empty to keep current password"
                />
                <p className="mt-1 text-[11px] text-[#8A8F98]">
                  Min 6 characters. Leave empty to keep existing password.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#1A1A1A]">
                    Wallet Balance (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.wallet}
                    onChange={(e) =>
                      setForm({ ...form, wallet: Number(e.target.value) || 0 })
                    }
                    className={INPUT_CLS}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#1A1A1A]">
                    KYC Status
                  </label>
                  <select
                    value={form.isKycVerified ? "true" : "false"}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        isKycVerified: e.target.value === "true",
                      })
                    }
                    className={INPUT_CLS}
                  >
                    <option value="false">Pending</option>
                    <option value="true">Verified</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#6B7280]">
                  User UUID (System)
                </label>
                <div className="break-all rounded-xl border border-[#F3E7C4] bg-[#FFF9E3] px-3.5 py-2 font-mono text-xs text-[#6B7280]">
                  {editUser.uuid}
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeEdit}
                  disabled={updateLoading}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm disabled:opacity-50 ${OUTLINE_BTN}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm disabled:opacity-50 ${GOLD_BTN}`}
                >
                  {updateLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
         3. DELETE USER CONFIRMATION DIALOG
      ========================================================= */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1204]/60 p-4 backdrop-blur-[2px]"
          onClick={closeDelete}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-[#D93025]/30 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FDE8E6] text-[#D93025]">
                <Trash2 size={24} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-black text-[#1A1A1A]">
                  Delete User Account?
                </h3>
                <p className="mt-1 text-sm text-[#6B7280]">
                  Are you sure you want to permanently delete user{" "}
                  <strong className="text-[#1A1A1A]">
                    {deleteTarget.name}
                  </strong>{" "}
                  ({deleteTarget.mobile})?
                </p>

                <div className="mt-3 rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-2.5 font-mono text-xs text-[#6B7280]">
                  UUID: {deleteTarget.uuid}
                </div>

                <p className="mt-2 text-xs font-semibold text-[#D93025]">
                  Warning: This action cannot be undone. All data associated with this user will be removed.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#F3E7C4] bg-[#FFFDF7] px-6 py-4">
              <button
                type="button"
                onClick={closeDelete}
                disabled={deleteLoading}
                className={`rounded-xl px-4 py-2.5 text-sm ${OUTLINE_BTN}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-[#D93025] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#B3261E] disabled:opacity-50"
              >
                <Trash2 size={16} />
                {deleteLoading ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
