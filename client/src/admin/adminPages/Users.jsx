import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Ban,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Mail,
  MoreVertical,
  Pencil,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Ticket,
  UserCheck,
  UserRound,
  Users as UsersIcon,
  X,
} from "lucide-react";

import {
  getAllUsers,
  updateUserProfile,
  clearAdminError,
  clearAdminMessage,
} from "../../reducer/slice/adminAuthReducer";

import { getAllLotteryConfigs } from "../../reducer/slice/lotteryConfigSlice";

import {
  getAllKyc,
  approveKyc,
  rejectKyc,
  clearAdminKycError,
  clearAdminKycSuccess,
  selectAdminKycDocuments,
  selectAdminKycActionLoading,
  selectAdminKycActionError,
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
  gray: "bg-[#F1F2F4] text-[#6B7280] ring-[#D5D8DD]",
};

const KYC_META = {
  approved: { label: "Verified", tone: "green" },
  pending: { label: "Pending", tone: "amber" },
  rejected: { label: "Rejected", tone: "red" },
  not_submitted: { label: "Not Submitted", tone: "gray" },
};

/* =========================================================
   HELPERS
========================================================= */

const idOf = (v) =>
  String(v && typeof v === "object" ? (v._id ?? "") : (v ?? ""));

const docUserId = (doc) => idOf(doc?.user ?? doc?.userId ?? doc?.userID);

const deriveKycStatus = (docs) => {
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

const isSuspended = (u) =>
  Boolean(
    u?.isBlocked ||
      u?.isSuspended ||
      u?.isActive === false ||
      String(u?.status || "").toLowerCase() === "suspended"
  );

// "Rahul Sharma" -> "RS", "Rahul" -> "RA"
const getInitials = (name) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
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
  const d = new Date(date);
  if (!date || Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const fmtDateTime = (date) => {
  const d = new Date(date);
  if (!date || Number.isNaN(d.getTime())) return "-";
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
  const sorted = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
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
  account: "all",
  kyc: "all",
  date: "",
};

/* =========================================================
   SMALL COMPONENTS
========================================================= */

const Pill = ({ tone = "gray", children }) => (
  <span
    className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-bold ring-1 ${TONES[tone]}`}
  >
    {children}
  </span>
);

// Image ho to image, nahi to first + second letter
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
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bg}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="truncate text-[11px] font-semibold text-[#6B7280]">{label}</p>
      <p className="text-xl font-black leading-tight text-[#1A1A1A]">
        {Number(value).toLocaleString("en-IN")}
      </p>
    </div>
  </div>
);

const Field = ({ label, children }) => (
  <div className="min-w-0">
    <label className="mb-1 block text-[11px] font-semibold text-[#6B7280]">{label}</label>
    {children}
  </div>
);

const StatusBox = ({ label, tone, value }) => (
  <div className="min-w-0 rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-2 text-center">
    <p className="mb-1 text-[10px] font-semibold text-[#6B7280]">{label}</p>
    <Pill tone={tone}>{value}</Pill>
  </div>
);

/* =========================================================
   PAGE
========================================================= */

const Users = () => {
  const dispatch = useDispatch();

  // ---------- REDUX ----------
  const {
    users = [],
    usersLoading,
    usersError,
    updateLoading,
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
  const [activeId, setActiveId] = useState(null);
  const [tab, setTab] = useState("activity");
  const [menuId, setMenuId] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: "", mobile: "", password: "" });
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
      return {
        ...u,
        _kycDocs: kycByUser[uid] || [],
        _kyc: deriveKycStatus(kycByUser[uid]),
        _mobileVerified: isMobileVerified(u),
        _suspended: isSuspended(u),
        _tickets: ticketsByUser[uid] || [],
      };
    });
  }, [users, kycDocs, configs]);

  // ---------- STATS ----------
  const stats = useMemo(
    () => ({
      total: rows.length,
      mobile: rows.filter((r) => r._mobileVerified).length,
      kyc: rows.filter((r) => r._kyc === "approved").length,
      active: rows.filter((r) => !r._suspended).length,
      suspended: rows.filter((r) => r._suspended).length,
      pendingKyc: rows.filter((r) => r._kyc === "pending").length,
    }),
    [rows]
  );

  // ---------- FILTERING ----------
  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return rows.filter((r) => {
      if (term) {
        const hay = [r.name, r.mobile, r.uuid, r.email, r.userId]
          .map((v) => String(v || "").toLowerCase())
          .join(" ");
        if (!hay.includes(term)) return false;
      }
      if (filters.mobile === "verified" && !r._mobileVerified) return false;
      if (filters.mobile === "unverified" && r._mobileVerified) return false;
      if (filters.account === "active" && r._suspended) return false;
      if (filters.account === "suspended" && !r._suspended) return false;
      if (filters.kyc !== "all" && r._kyc !== filters.kyc) return false;
      if (filters.date && toYMD(r.createdAt) !== filters.date) return false;
      return true;
    });
  }, [rows, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * perPage;
  const pageRows = filtered.slice(start, start + perPage);

  const activeUser = useMemo(
    () => rows.find((r) => String(r._id) === activeId) || null,
    [rows, activeId]
  );

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
        allOnPageChecked ? next.delete(String(r._id)) : next.add(String(r._id))
      );
      return next;
    });

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name || "", mobile: u.mobile || "", password: "" });
    setMenuId(null);
    dispatch(clearAdminError());
    dispatch(clearAdminMessage());
  };

  const closeEdit = () => {
    setEditUser(null);
    setForm({ name: "", mobile: "", password: "" });
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    const payload = {
      uuid: editUser.uuid,
      name: form.name.trim(),
      mobile: form.mobile.trim(),
    };
    if (form.password.trim()) payload.password = form.password;
    const res = await dispatch(updateUserProfile(payload));
    if (updateUserProfile.fulfilled.match(res)) closeEdit();
  };

  // NOTE: backend ko `isBlocked` field support karna chahiye
  const toggleSuspend = (u) => {
    setMenuId(null);
    dispatch(
      updateUserProfile({
        uuid: u.uuid,
        name: u.name,
        mobile: u.mobile,
        isBlocked: !u._suspended,
      })
    );
  };

  const selectUser = (u, nextTab) => {
    setActiveId(String(u._id));
    if (nextTab) setTab(nextTab);
    setMenuId(null);
  };

  const handleApprove = async (id) => {
    dispatch(clearAdminKycError());
    dispatch(clearAdminKycSuccess());
    await dispatch(approveKyc(id));
  };

  const handleReject = async (id) => {
    dispatch(clearAdminKycError());
    dispatch(clearAdminKycSuccess());
    const res = await dispatch(rejectKyc({ id, rejectionReason: rejectReason }));
    if (rejectKyc.fulfilled.match(res)) {
      setRejectDocId(null);
      setRejectReason("");
    }
  };

  const exportCsv = () => {
    const list = checked.size
      ? filtered.filter((r) => checked.has(String(r._id)))
      : filtered;
    const head = ["User ID", "Name", "Mobile", "Mobile Verified", "KYC Status", "Account Status", "Join Date"];
    const body = list.map((r) => [
      r.uuid,
      r.name,
      r.mobile,
      r._mobileVerified ? "Verified" : "Not Verified",
      KYC_META[r._kyc].label,
      r._suspended ? "Suspended" : "Active",
      fmtDate(r.createdAt),
    ]);
    const csv = [head, ...body].map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${toYMD(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---------- ACTIVITY (derived from real data) ----------
  const activity = useMemo(() => {
    if (!activeUser) return [];
    const items = activeUser._tickets.map((t) => ({
      key: `t-${t._id || t.number}`,
      title: "Played Lottery",
      sub: `${t.marketName} • ${t.number || "-"} • ₹${Number(t.amount || 0).toFixed(2)}`,
      at: t.createdAt || t.entryDate,
      icon: <Ticket size={16} />,
    }));
    items.push({
      key: "joined",
      title: "Joined Winzox",
      sub: "Account created",
      at: activeUser.createdAt,
      icon: <UserCheck size={16} />,
    });
    return items.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
  }, [activeUser]);

  const banner = message || kycMessage;
  const bannerError = usersError || error || kycActionError;

  /* =======================================================
     UI
  ======================================================= */
  return (
    <div className="min-h-screen space-y-4 bg-[#FFFDF7] p-4 md:p-6">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#1A1A1A]">Users</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Manage users, verification status, KYC, activity history and support details.
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
        <StatCard bg="bg-[#FFEFA8]" label="Total Users" value={stats.total} icon={<UserRound size={24} className="text-[#9A5B00]" />} />
        <StatCard bg="bg-[#E6F6EF]" label="Verified Mobile" value={stats.mobile} icon={<Phone size={22} className="text-[#12A36B]" />} />
        <StatCard bg="bg-[#E6F6EF]" label="KYC Verified" value={stats.kyc} icon={<ShieldCheck size={24} className="text-[#12A36B]" />} />
        <StatCard bg="bg-[#E8F1FD]" label="Active Users" value={stats.active} icon={<UsersIcon size={24} className="text-[#2E7DD7]" />} />
        <StatCard bg="bg-[#FDE8E6]" label="Suspended" value={stats.suspended} icon={<Ban size={22} className="text-[#D93025]" />} />
        <StatCard bg="bg-[#FFF1CC]" label="Pending KYC" value={stats.pendingKyc} icon={<Clock size={22} className="text-[#B26A00]" />} />
      </div>

      {/* MESSAGES */}
      {banner && (
        <div className="flex items-center justify-between rounded-xl border border-[#12A36B]/30 bg-[#E6F6EF] px-4 py-3 text-sm font-medium text-[#0E7A52]">
          <span>{banner}</span>
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
          <span>{String(bannerError)}</span>
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
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8F98]" />
              <input
                type="text"
                value={draft.search}
                onChange={(e) => setDraft({ ...draft, search: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                placeholder="Name, Mobile or User ID..."
                className={`${INPUT_CLS} py-2.5 pl-9`}
              />
            </div>
          </Field>

          <Field label="Mobile Verification">
            <select value={draft.mobile} onChange={(e) => setDraft({ ...draft, mobile: e.target.value })} className={`${INPUT_CLS} py-2.5`}>
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="unverified">Not Verified</option>
            </select>
          </Field>

          <Field label="Account Status">
            <select value={draft.account} onChange={(e) => setDraft({ ...draft, account: e.target.value })} className={`${INPUT_CLS} py-2.5`}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </Field>

          <Field label="KYC Status">
            <select value={draft.kyc} onChange={(e) => setDraft({ ...draft, kyc: e.target.value })} className={`${INPUT_CLS} py-2.5`}>
              <option value="all">All Status</option>
              <option value="approved">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="not_submitted">Not Submitted</option>
            </select>
          </Field>

          <Field label="Join Date">
            <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className={`${INPUT_CLS} py-2.5`} />
          </Field>

          <button type="button" onClick={applyFilters} className={`rounded-xl px-6 py-2.5 text-sm ${GOLD_BTN}`}>
            Search
          </button>
          <button type="button" onClick={resetFilters} className={`rounded-xl px-6 py-2.5 text-sm ${OUTLINE_BTN}`}>
            Reset
          </button>
        </div>
      </div>

      {/* LIST + DETAIL PANEL */}
      <div className={`grid items-start gap-4 ${activeUser ? "xl:grid-cols-[1fr_340px]" : ""}`}>
        {/* ---------- TABLE ---------- */}
        <div className={`min-w-0 overflow-hidden ${CARD_CLS}`}>
          <div className="flex items-center justify-between gap-2 px-4 py-3">
            <div className="flex items-center gap-2">
              <UsersIcon size={20} className="text-[#9A5B00]" />
              <h2 className="font-black text-[#1A1A1A]">
                User List ({filtered.length.toLocaleString("en-IN")})
              </h2>
            </div>
            <button type="button" onClick={exportCsv} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs ${OUTLINE_BTN}`}>
              <Download size={14} />
              Export{checked.size ? ` (${checked.size})` : ""}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead className="bg-[#FFF9E3]">
                <tr>
                  <th className={`${TH_CLS} w-10`}>#</th>
                  <th className={`${TH_CLS} w-8`}>
                    <input type="checkbox" checked={allOnPageChecked} onChange={toggleAllOnPage} className="h-4 w-4 accent-[#F7B500]" />
                  </th>
                  <th className={TH_CLS}>User ID</th>
                  <th className={TH_CLS}>Name</th>
                  <th className={TH_CLS}>Mobile Number</th>
                  <th className={TH_CLS}>Mobile Verified</th>
                  <th className={TH_CLS}>KYC Status</th>
                  <th className={TH_CLS}>Account Status</th>
                  <th className={TH_CLS}>Join Date</th>
                  <th className={`${TH_CLS} text-center`}>Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F3E7C4]">
                {usersLoading ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-16 text-center">
                      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-[#FFEFA8] border-t-[#F7B500]" />
                      <p className="text-sm text-[#6B7280]">Loading users...</p>
                    </td>
                  </tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-16 text-center">
                      <p className="font-bold text-[#1A1A1A]">No users found</p>
                      <p className="mt-1 text-sm text-[#6B7280]">Try changing or resetting the filters.</p>
                    </td>
                  </tr>
                ) : (
                  pageRows.map((u, i) => {
                    const id = String(u._id);
                    const kyc = KYC_META[u._kyc];
                    const selected = id === activeId;
                    return (
                      <tr
                        key={id}
                        onClick={() => selectUser(u)}
                        className={`cursor-pointer transition hover:bg-[#FFFDF7] ${selected ? "bg-[#FFF9E3]" : ""}`}
                      >
                        <td className="px-3 py-2.5 text-sm text-[#6B7280]">{start + i + 1}</td>
                        <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={checked.has(id)} onChange={() => toggleOne(id)} className="h-4 w-4 accent-[#F7B500]" />
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="inline-block max-w-[90px] truncate font-mono text-xs text-[#6B7280]" title={u.uuid}>
                            {u.userId || u.uuid || "-"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar user={u} />
                            <span className="max-w-[130px] truncate text-sm font-semibold text-[#1A1A1A]">
                              {u.name || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-sm text-[#1A1A1A]">{u.mobile || "-"}</td>
                        <td className="px-3 py-2.5">
                          <Pill tone={u._mobileVerified ? "green" : "red"}>
                            {u._mobileVerified ? "Verified" : "Not Verified"}
                          </Pill>
                        </td>
                        <td className="px-3 py-2.5">
                          <Pill tone={kyc.tone}>{kyc.label}</Pill>
                        </td>
                        <td className="px-3 py-2.5">
                          <Pill tone={u._suspended ? "red" : "green"}>
                            {u._suspended ? "Suspended" : "Active"}
                          </Pill>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-sm text-[#6B7280]">{fmtDate(u.createdAt)}</td>
                        <td className="relative px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setMenuId(menuId === id ? null : id)}
                            aria-label="Actions"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#F3E7C4] bg-white text-[#6B7280] hover:bg-[#FFEFA8]"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {menuId === id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setMenuId(null)} />
                              <div className="absolute right-3 top-11 z-20 w-40 overflow-hidden rounded-xl border border-[#F3E7C4] bg-white py-1 text-left shadow-xl">
                                <button type="button" onClick={() => selectUser(u, "kyc")} className="block w-full px-4 py-2 text-left text-sm hover:bg-[#FFF9E3]">View KYC</button>
                                <button type="button" onClick={() => selectUser(u, "activity")} className="block w-full px-4 py-2 text-left text-sm hover:bg-[#FFF9E3]">View Activity</button>
                                <button type="button" onClick={() => openEdit(u)} className="block w-full px-4 py-2 text-left text-sm hover:bg-[#FFF9E3]">Edit User</button>
                                <button type="button" onClick={() => toggleSuspend(u)} className={`block w-full px-4 py-2 text-left text-sm hover:bg-[#FFF9E3] ${u._suspended ? "text-[#12A36B]" : "text-[#D93025]"}`}>
                                  {u._suspended ? "Activate" : "Suspend"}
                                </button>
                              </div>
                            </>
                          )}
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
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              per page
            </div>

            <div className="flex items-center gap-1">
              <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#F3E7C4] disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
              {pageList(currentPage, totalPages).map((p, i) =>
                p === "..." ? (
                  <span key={`d${i}`} className="px-1 text-[#8A8F98]">...</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`h-8 min-w-8 rounded-lg px-2 text-sm font-bold ${
                      p === currentPage ? GOLD_BTN : "border border-[#F3E7C4] bg-white text-[#1A1A1A] hover:bg-[#FFEFA8]/60"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button type="button" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#F3E7C4] disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ---------- DETAIL PANEL ---------- */}
        {activeUser && (
          <aside className={`min-w-0 p-4 ${CARD_CLS} xl:sticky xl:top-4`}>
            <div className="flex items-start gap-3">
              <Avatar user={activeUser} size="h-16 w-16" text="text-xl" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-black text-[#1A1A1A]">{activeUser.name || "-"}</h3>
                <p className="truncate font-mono text-xs text-[#6B7280]">{activeUser.userId || activeUser.uuid}</p>
                <p className="mt-1 text-[11px] capitalize text-[#9A5B00]">{activeUser.role || "user"}</p>
              </div>
              <button type="button" onClick={() => setActiveId(null)} aria-label="Close panel" className="rounded-full p-1 text-[#8A8F98] hover:bg-[#FFEFA8]">
                <X size={18} />
              </button>
            </div>

            {/* STATUS */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <StatusBox
                label="Account"
                tone={activeUser._suspended ? "red" : "green"}
                value={activeUser._suspended ? "Suspended" : "Active"}
              />
              <StatusBox
                label="KYC"
                tone={KYC_META[activeUser._kyc].tone}
                value={KYC_META[activeUser._kyc].label}
              />
              <StatusBox
                label="Mobile"
                tone={activeUser._mobileVerified ? "green" : "red"}
                value={activeUser._mobileVerified ? "Verified" : "Not Verified"}
              />
            </div>

            {/* CONTACT */}
            <div className="mt-4 space-y-2 text-sm text-[#1A1A1A]">
              <div className="flex items-center gap-2">
                <Phone size={15} className="shrink-0 text-[#6B7280]" />
                {activeUser.mobile || "-"}
              </div>
              {activeUser.email && (
                <div className="flex items-center gap-2">
                  <Mail size={15} className="shrink-0 text-[#6B7280]" />
                  <span className="truncate">{activeUser.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <CalendarDays size={15} className="shrink-0 text-[#6B7280]" />
                Joined {fmtDateTime(activeUser.createdAt)}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => openEdit(activeUser)} className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm ${OUTLINE_BTN}`}>
                <Pencil size={14} /> Edit User
              </button>
              <button
                type="button"
                onClick={() => toggleSuspend(activeUser)}
                disabled={updateLoading}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-bold disabled:opacity-50 ${
                  activeUser._suspended
                    ? "border-[#12A36B]/40 text-[#12A36B] hover:bg-[#E6F6EF]"
                    : "border-[#D93025]/40 text-[#D93025] hover:bg-[#FDE8E6]"
                }`}
              >
                <Ban size={14} /> {activeUser._suspended ? "Activate" : "Suspend"}
              </button>
            </div>

            {/* TABS */}
            <div className="mt-4 grid grid-cols-4 gap-1 border-b border-[#F3E7C4] text-[11px] font-bold">
              {[
                ["kyc", "KYC Details"],
                ["activity", "Activity"],
                ["support", "Support"],
                ["other", "Other Info"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`rounded-t-lg px-1 py-2 ${tab === key ? "bg-[#9A5B00] text-white" : "text-[#6B7280] hover:bg-[#FFF9E3]"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {/* KYC TAB */}
              {tab === "kyc" &&
                (activeUser._kycDocs.length === 0 ? (
                  <p className="py-6 text-center text-sm text-[#6B7280]">KYC not submitted yet.</p>
                ) : (
                  activeUser._kycDocs.map((doc) => {
                    const st = String(doc.status || "pending").toLowerCase();
                    const meta = KYC_META[st === "verified" ? "approved" : st] || KYC_META.pending;
                    const link = doc.documentUrl || doc.image || doc.frontImage || doc.file;
                    return (
                      <div key={doc._id} className="rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-bold text-[#1A1A1A]">
                            {doc.documentType || doc.type || "KYC Document"}
                          </p>
                          <Pill tone={meta.tone}>{meta.label}</Pill>
                        </div>
                        {(doc.documentNumber || doc.number) && (
                          <p className="mt-1 font-mono text-xs text-[#6B7280]">{doc.documentNumber || doc.number}</p>
                        )}
                        {link && (
                          <a href={link} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-bold text-[#9A5B00] underline">
                            View document
                          </a>
                        )}
                        {doc.rejectionReason && (
                          <p className="mt-1 text-xs text-[#D93025]">Reason: {doc.rejectionReason}</p>
                        )}

                        {st === "pending" && (
                          <div className="mt-2">
                            {rejectDocId === doc._id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                  rows={2}
                                  placeholder="Rejection reason"
                                  className={`${INPUT_CLS} py-2`}
                                />
                                <div className="flex gap-2">
                                  <button type="button" onClick={() => { setRejectDocId(null); setRejectReason(""); }} className={`flex-1 rounded-lg px-3 py-1.5 text-xs ${OUTLINE_BTN}`}>
                                    Cancel
                                  </button>
                                  <button type="button" disabled={kycActionLoading || !rejectReason.trim()} onClick={() => handleReject(doc._id)} className="flex-1 rounded-lg bg-[#D93025] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
                                    Confirm Reject
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button type="button" disabled={kycActionLoading} onClick={() => handleApprove(doc._id)} className={`flex-1 rounded-lg px-3 py-1.5 text-xs disabled:opacity-50 ${GOLD_BTN}`}>
                                  Approve
                                </button>
                                <button type="button" disabled={kycActionLoading} onClick={() => setRejectDocId(doc._id)} className="flex-1 rounded-lg border border-[#D93025]/40 px-3 py-1.5 text-xs font-bold text-[#D93025] hover:bg-[#FDE8E6]">
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ))}

              {/* ACTIVITY TAB */}
              {tab === "activity" &&
                activity.map((a) => (
                  <div key={a.key} className="flex items-center gap-3 rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FFEFA8] text-[#9A5B00]">
                      {a.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#1A1A1A]">{a.title}</p>
                      <p className="truncate text-xs text-[#6B7280]">{a.sub}</p>
                      <p className="text-[11px] text-[#8A8F98]">{fmtDateTime(a.at)}</p>
                    </div>
                  </div>
                ))}

              {/* SUPPORT TAB */}
              {tab === "support" && (
                <p className="py-6 text-center text-sm text-[#6B7280]">No support history available.</p>
              )}

              {/* OTHER TAB */}
              {tab === "other" && (
                <dl className="space-y-2 text-sm">
                  {[
                    ["Role", activeUser.role || "user"],
                    ["UUID", activeUser.uuid || "-"],
                    ["Total Tickets", activeUser._tickets.length],
                    [
                      "Total Spent",
                      `₹${activeUser._tickets.reduce((s, t) => s + Number(t.amount || 0), 0).toFixed(2)}`,
                    ],
                    ["KYC Status", KYC_META[activeUser._kyc].label],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3 rounded-lg bg-[#FFF9E3] px-3 py-2">
                      <dt className="text-[#6B7280]">{k}</dt>
                      <dd className="max-w-[170px] break-all text-right font-bold text-[#1A1A1A]">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* EDIT USER MODAL */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1204]/60 p-4 backdrop-blur-[2px]" onClick={closeEdit}>
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#F3E7C4] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#F3E7C4] px-6 py-5">
              <div>
                <h2 className="text-lg font-black text-[#1A1A1A]">Edit User</h2>
                <p className="mt-1 text-xs text-[#6B7280]">Update user profile information</p>
              </div>
              <button type="button" onClick={closeEdit} className="flex h-8 w-8 items-center justify-center rounded-full text-[#8A8F98] hover:bg-[#FFEFA8]">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitEdit} className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold">Name</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={INPUT_CLS} placeholder="Enter user name" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Mobile</label>
                <input type="tel" required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className={INPUT_CLS} placeholder="Enter mobile number" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">New Password</label>
                <input type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={INPUT_CLS} placeholder="Leave empty to keep current" />
                <p className="mt-1.5 text-xs text-[#8A8F98]">Leave empty if you don't want to change the password.</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">UUID</label>
                <div className="break-all rounded-xl border border-[#F3E7C4] bg-[#FFF9E3] px-4 py-3 font-mono text-xs text-[#6B7280]">
                  {editUser.uuid}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeEdit} disabled={updateLoading} className={`flex-1 rounded-xl px-4 py-3 text-sm disabled:opacity-50 ${OUTLINE_BTN}`}>
                  Cancel
                </button>
                <button type="submit" disabled={updateLoading} className={`flex-1 rounded-xl px-4 py-3 text-sm disabled:opacity-50 ${GOLD_BTN}`}>
                  {updateLoading ? "Updating..." : "Update User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;