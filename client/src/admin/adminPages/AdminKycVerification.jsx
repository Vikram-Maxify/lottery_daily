import { useEffect, useMemo, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  Eye,
  FileText,
  MoreVertical,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";

import {
  approveKyc,
  clearAdminKycActionError,
  clearAdminKycSuccess,
  getAllKyc,
  rejectKyc,
  selectAdminKycActionError,
  selectAdminKycActionLoading,
  selectAdminKycDocuments,
  selectAdminKycLoading,
} from "../../reducer/slice/adminKycReducer";

const GOLD_BTN =
  "bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] text-[#1A1204] font-extrabold shadow-[0_4px_10px_-3px_rgba(227,154,0,0.55),inset_0_1px_0_rgba(255,255,255,0.55)] hover:brightness-105";

const OUTLINE_BTN =
  "border border-[#F2B705] bg-white font-bold text-[#9A5B00] hover:bg-[#FFEFA8]/60";

const INPUT_CLS =
  "w-full rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] px-3 py-2.5 text-sm text-[#1A1A1A] outline-none transition placeholder:text-[#8A8F98] focus:border-[#F2B705] focus:ring-2 focus:ring-[#FFEFA8]";

const CARD_CLS =
  "rounded-2xl border border-[#F3E7C4] bg-white shadow-[0_6px_18px_-10px_rgba(247,181,0,0.35)]";

const TH_CLS =
  "px-3 py-3 text-left text-[11px] font-bold tracking-wide text-[#6B7280]";

const TONES = {
  green: "bg-[#E6F6EF] text-[#12A36B] ring-[#12A36B]/20",
  amber: "bg-[#FFF1CC] text-[#B26A00] ring-[#F2B705]/30",
  red: "bg-[#FDE8E6] text-[#D93025] ring-[#D93025]/20",
};

const STATUS_META = {
  approved: { label: "Verified", panel: "Verified", tone: "green" },

  pending: { label: "Pending", panel: "Pending Verification", tone: "amber" },

  rejected: { label: "Rejected", panel: "Rejected", tone: "red" },
};

const DOC_STATUS_META = {
  approved: { label: "Valid Document", tone: "green" },

  pending: { label: "Under Review", tone: "amber" },

  rejected: { label: "Rejected", tone: "red" },
};

const PAGE_SIZES = [10, 25, 50, 100];

const EMPTY_FILTERS = {
  search: "",
  status: "all",
  docType: "all",
  from: "",
  to: "",
};

/* =========================================================

   HELPERS

\========================================================= */

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

const fmtDateTime = (date) => {
  const d = new Date(date);

  if (!date || Number.isNaN(d.getTime())) return "-";

  return d.toLocaleString("en-IN", {
    day: "2-digit",

    month: "short",

    year: "numeric",

    hour: "2-digit",

    minute: "2-digit",

    hour12: true,
  });
};

const fmtDateOnly = (date) => {
  const d = new Date(date);

  if (!date || Number.isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const fmtTimeOnly = (date) => {
  const d = new Date(date);

  if (!date || Number.isNaN(d.getTime())) return "";

  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
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

/* =========================================================

   SMALL COMPONENTS

\========================================================= */

const Pill = ({ tone = "amber", children }) => (
  <span
    className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-bold ring-1 ${TONES[tone]}`}
  >
    {children}
  </span>
);

const Avatar = ({ name, size = "h-9 w-9", text = "text-sm" }) => (
  <div
    className={`flex ${size} ${text} shrink-0 items-center justify-center rounded-full bg-[#FFEFA8] font-black tracking-wide text-[#1A1204] ring-1 ring-[#F2B705]`}
  >
    {getInitials(name)}
  </div>
);

const StatCard = ({ icon, label, value, bg }) => (
  <div className={`flex items-center gap-3 p-4 ${CARD_CLS}`}>
    <div
      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${bg}`}
    >
      {icon}
    </div>

    <div className="min-w-0">
      <p className="truncate text-xs font-semibold text-[#6B7280]">{label}</p>

      <p className="text-2xl font-black leading-tight text-[#1A1A1A]">
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

const FileChip = ({ file }) => (
  <span
    title={file.label}
    className={`flex h-7 w-7 items-center justify-center rounded-md ${
      file.docType === "pan"
        ? "bg-[#FDE8E6] text-[#D93025]"
        : "bg-[#E8F1FD] text-[#2E7DD7]"
    }`}
  >
    {file.docType === "pan" ? <CreditCard size={14} /> : <FileText size={14} />}
  </span>
);

/* =========================================================

   PAGE

\========================================================= */

const AdminKycVerification = () => {
  const dispatch = useDispatch();

  // ---------- REDUX ----------

  const rawKycList = useSelector(selectAdminKycDocuments);

  const kycList = useMemo(() => {
    if (Array.isArray(rawKycList)) return rawKycList;
    if (Array.isArray(rawKycList?.data)) return rawKycList.data;
    if (Array.isArray(rawKycList?.documents)) return rawKycList.documents;
    return [];
  }, [rawKycList]);

  const loading = useSelector(selectAdminKycLoading);

  const actionLoading = useSelector(selectAdminKycActionLoading);

  const actionError = useSelector(selectAdminKycActionError);

  // ---------- LOCAL STATE ----------

  const [draft, setDraft] = useState(EMPTY_FILTERS);

  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const [perPage, setPerPage] = useState(10);

  const [page, setPage] = useState(1);

  const [checked, setChecked] = useState(new Set());

  const [activeId, setActiveId] = useState(null);

  const [tab, setTab] = useState("documents");

  const [menuId, setMenuId] = useState(null);

  const [rejectOpen, setRejectOpen] = useState(false);

  const [rejectReason, setRejectReason] = useState("");

  const [preview, setPreview] = useState(null);

  const [detailModal, setDetailModal] = useState(null);

  const [detailRejectOpen, setDetailRejectOpen] = useState(false);

  const [detailRejectReason, setDetailRejectReason] = useState("");

  // ---------- IMAGE URL ----------

  // Backend stores complete ImgBB URLs, so no API import is needed here.
  const getImageUrl = (url) => url || null;

  // ---------- FETCH (saare ek baar, filters client-side) ----------

  useEffect(() => {
    dispatch(getAllKyc(""));

    return () => {
      dispatch(clearAdminKycActionError());

      dispatch(clearAdminKycSuccess());
    };
  }, [dispatch]);

  // ---------- NORMALIZE KYC DOCUMENTS ----------
  const groups = useMemo(() => {
    if (!Array.isArray(kycList)) return [];

    return kycList.filter(Boolean).map((kyc) => {
      const user = kyc.userId || {};
      const aadhaarReview = kyc.aadhaar?.review || {};
      const panReview = kyc.pan?.review || {};

      const aadhaarFrontUrl =
        kyc.aadhaar?.front?.url || kyc.aadhaarFront || null;
      const aadhaarBackUrl =
        kyc.aadhaar?.back?.url || kyc.aadhaarBack || null;
      const panFrontUrl =
        kyc.pan?.front?.url || kyc.pan?.url || kyc.panFront || null;
      const selfieUrl = kyc.selfie?.url || kyc.selfie || null;

      const hasAadhaar = Boolean(aadhaarFrontUrl && aadhaarBackUrl);
      const hasPan = Boolean(panFrontUrl);

      const submittedStatuses = [];
      if (hasAadhaar) {
        submittedStatuses.push(aadhaarReview.status || "pending");
      }
      if (hasPan) {
        submittedStatuses.push(panReview.status || "pending");
      }

      let status = kyc.status || "pending";
      if (submittedStatuses.length > 0) {
        if (submittedStatuses.includes("rejected")) {
          status = "rejected";
        } else if (submittedStatuses.includes("pending")) {
          status = "pending";
        } else if (submittedStatuses.every((s) => s === "approved")) {
          status = "approved";
        }
      }

      const files = [];

      if (aadhaarFrontUrl) {
        files.push({
          id: `${kyc._id}-aadhaar-front`,
          label: "Aadhaar Card (Front)",
          docType: "aadhaar",
          url: aadhaarFrontUrl,
          status: aadhaarReview.status || "pending",
          rejectionReason: aadhaarReview.rejectionReason,
          at: kyc.createdAt,
        });
      }

      if (aadhaarBackUrl) {
        files.push({
          id: `${kyc._id}-aadhaar-back`,
          label: "Aadhaar Card (Back)",
          docType: "aadhaar",
          url: aadhaarBackUrl,
          status: aadhaarReview.status || "pending",
          rejectionReason: aadhaarReview.rejectionReason,
          at: kyc.createdAt,
        });
      }

      if (panFrontUrl) {
        files.push({
          id: `${kyc._id}-pan-front`,
          label: "PAN Card",
          docType: "pan",
          url: panFrontUrl,
          status: panReview.status || "pending",
          rejectionReason: panReview.rejectionReason,
          at: kyc.createdAt,
        });
      }

      if (selfieUrl) {
        files.push({
          id: `${kyc._id}-selfie`,
          label: "Selfie",
          docType: "selfie",
          url: selfieUrl,
          status: "submitted",
          at: kyc.createdAt,
        });
      }

      return {
        key: String(kyc._id),
        user,
        documents: [kyc],
        kyc,
        files,
        status,
        name: user?.name || user?.username || "Unknown User",
        mobile: user?.mobile || user?.phone || "-",
        email: user?.email || "-",
        displayId:
          user?.uuid ||
          user?.userId ||
          String(user?._id || kyc._id)
            .slice(-6)
            .toUpperCase(),
        dob: kyc.dob,
        createdAt: kyc.createdAt,
      };
    });
  }, [kycList]);

  // ---------- STATS ----------

  const stats = useMemo(
    () => ({
      pending: groups.filter((g) => g.status === "pending").length,

      verified: groups.filter((g) => g.status === "approved").length,

      rejected: groups.filter((g) => g.status === "rejected").length,

      total: groups.length,
    }),

    [groups],
  );

  // ---------- FILTERING ----------

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();

    return groups.filter((g) => {
      if (term) {
        const hay = [g.name, g.mobile, g.displayId, g.user?.email]

          .map((v) => String(v || "").toLowerCase())

          .join(" ");

        if (!hay.includes(term)) return false;
      }

      if (filters.status !== "all" && g.status !== filters.status) return false;

      if (
        filters.docType !== "all" &&
        !g.files.some((f) => f.docType === filters.docType)
      )
        return false;

      const day = toYMD(g.createdAt);

      if (filters.from && day < filters.from) return false;

      if (filters.to && day > filters.to) return false;

      return true;
    });
  }, [groups, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  const currentPage = Math.min(page, totalPages);

  const start = (currentPage - 1) * perPage;

  const pageRows = filtered.slice(start, start + perPage);

  const active = useMemo(
    () => groups.find((g) => g.key === activeId) || filtered[0] || null,
    [groups, filtered, activeId],
  );

  const currentDetail = useMemo(() => {
    if (!detailModal) return null;
    return groups.find((g) => g.key === detailModal.key) || detailModal;
  }, [groups, detailModal]);

  // ---------- AUDIT & NOTES HELPERS ----------
  const computeAudit = (item) => {
    if (!item?.kyc) return [];

    const items = [];
    const kyc = item.kyc;
    const aadhaar = kyc.aadhaar?.review;
    const pan = kyc.pan?.review;

    items.push({
      key: `${kyc._id}-submitted`,
      title: "KYC submitted",
      sub: "Aadhaar, PAN and selfie submitted for verification",
      at: kyc.createdAt,
      tone: "amber",
    });

    if (aadhaar?.status === "approved") {
      items.push({
        key: `${kyc._id}-aadhaar-approved`,
        title: "Aadhaar verified",
        sub: "Aadhaar documents approved",
        at: aadhaar.reviewedAt || kyc.updatedAt || kyc.createdAt,
        tone: "green",
      });
    }

    if (aadhaar?.status === "rejected") {
      items.push({
        key: `${kyc._id}-aadhaar-rejected`,
        title: "Aadhaar rejected",
        sub: aadhaar.rejectionReason || "Aadhaar rejected",
        at: aadhaar.reviewedAt || kyc.updatedAt || kyc.createdAt,
        tone: "red",
      });
    }

    if (pan?.status === "approved") {
      items.push({
        key: `${kyc._id}-pan-approved`,
        title: "PAN verified",
        sub: "PAN document approved",
        at: pan.reviewedAt || kyc.updatedAt || kyc.createdAt,
        tone: "green",
      });
    }

    if (pan?.status === "rejected") {
      items.push({
        key: `${kyc._id}-pan-rejected`,
        title: "PAN rejected",
        sub: pan.rejectionReason || "PAN rejected",
        at: pan.reviewedAt || kyc.updatedAt || kyc.createdAt,
        tone: "red",
      });
    }

    return items.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
  };

  const computeNotes = (item) => {
    if (!item?.kyc) return [];

    const out = [];
    const aadhaarReason = item.kyc.aadhaar?.review?.rejectionReason;
    const panReason = item.kyc.pan?.review?.rejectionReason;
    const generalReason = item.kyc.rejectionReason;

    if (aadhaarReason) {
      out.push({
        key: `${item.key}-aadhaar-note`,
        type: "AADHAAR",
        reason: aadhaarReason,
        at: item.kyc.aadhaar?.review?.reviewedAt || item.kyc.updatedAt,
      });
    }

    if (panReason) {
      out.push({
        key: `${item.key}-pan-note`,
        type: "PAN",
        reason: panReason,
        at: item.kyc.pan?.review?.reviewedAt || item.kyc.updatedAt,
      });
    }

    if (generalReason && !aadhaarReason && !panReason) {
      out.push({
        key: `${item.key}-general-note`,
        type: "GENERAL",
        reason: generalReason,
        at: item.kyc.updatedAt,
      });
    }

    return out;
  };

  const audit = useMemo(() => computeAudit(active), [active]);
  const notes = useMemo(() => computeNotes(active), [active]);
  const detailNotes = useMemo(() => computeNotes(currentDetail), [currentDetail]);

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

  const toggleOne = (key) =>
    setChecked((prev) => {
      const next = new Set(prev);

      next.has(key) ? next.delete(key) : next.add(key);

      return next;
    });

  const allOnPageChecked =
    pageRows.length > 0 && pageRows.every((g) => checked.has(g.key));

  const toggleAllOnPage = () =>
    setChecked((prev) => {
      const next = new Set(prev);

      pageRows.forEach((g) =>
        allOnPageChecked ? next.delete(g.key) : next.add(g.key),
      );

      return next;
    });

  const openDetail = (g, nextTab = "documents") => {
    setActiveId(g.key);
    setDetailModal(g);
    setTab(nextTab);
    setDetailRejectOpen(false);
    setDetailRejectReason("");
    setMenuId(null);
    dispatch(clearAdminKycActionError());
  };

  const selectGroup = (g, nextTab = "documents") => {
    setActiveId(g.key);
    setTab(nextTab);
    setRejectOpen(false);
    setRejectReason("");
    setMenuId(null);
    dispatch(clearAdminKycActionError());
  };

  const handleApprove = async (target) => {
    const item = target || active;
    if (!item || actionLoading) return;

    // Only pending KYC can be approved.
    if (item.status !== "pending") return;

    const id = item.kyc?._id;
    if (!id) return;

    dispatch(clearAdminKycActionError());

    try {
      await dispatch(approveKyc(id)).unwrap();
      setRejectOpen(false);
      setDetailRejectOpen(false);
      await dispatch(getAllKyc("")).unwrap();
    } catch (err) {
      console.error("Approve KYC error:", err);
    }
  };

  const handleReject = async (target, customReason) => {
    const item = target || active;
    const reason = (customReason !== undefined ? customReason : rejectReason).trim();

    if (!item || actionLoading || !reason) return;

    // Approved/rejected KYC can NEVER be rejected again.
    if (item.status !== "pending") return;

    const id = item.kyc?._id;
    if (!id) return;

    dispatch(clearAdminKycActionError());

    try {
      await dispatch(rejectKyc({ id, rejectionReason: reason })).unwrap();
      setRejectOpen(false);
      setDetailRejectOpen(false);
      setRejectReason("");
      setDetailRejectReason("");
      await dispatch(getAllKyc("")).unwrap();
    } catch (err) {
      console.error("Reject KYC error:", err);
    }
  };

  const downloadFile = async (file) => {
    const url = getImageUrl(file.url);

    if (!url) return;

    try {
      const res = await fetch(url);

      const blob = await res.blob();

      const a = document.createElement("a");

      a.href = URL.createObjectURL(blob);

      a.download = `${file.label.replace(/\s+/g, "-")}.${(blob.type.split("/")[1] || "jpg").split("+")[0]}`;

      a.click();

      URL.revokeObjectURL(a.href);
    } catch {
      window.open(url, "_blank", "noopener");
    }
  };

  const exportCsv = () => {
    const list = checked.size
      ? filtered.filter((g) => checked.has(g.key))
      : filtered;

    const head = [
      "User ID",
      "Name",
      "Mobile",
      "Documents",
      "KYC Status",
      "Submitted On",
    ];

    const body = list.map((g) => [
      g.displayId,

      g.name,

      g.mobile,

      g.files.map((f) => f.label).join(" | "),

      STATUS_META[g.status]?.label,

      fmtDateTime(g.createdAt),
    ]);

    const csv = [head, ...body].map((r) => r.map(csvCell).join(",")).join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );

    const a = document.createElement("a");

    a.href = url;

    a.download = `kyc-${toYMD(new Date())}.csv`;

    a.click();

    URL.revokeObjectURL(url);
  };

  /* =======================================================

     UI

  \======================================================= */

  return (
    <div className="min-h-screen space-y-4 bg-[#FFFDF7] p-4 md:p-6">
      {/* HEADER */}

      <div>
        <h1 className="text-2xl font-black tracking-tight text-[#1A1A1A]">
          KYC / Compliance
        </h1>

        <p className="mt-1 text-sm text-[#6B7280]">
          Manage user KYC verification, document review, notes and audit
          history.
        </p>
      </div>

      {/* STATS */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          bg="bg-[#FFF1CC]"
          label="Pending Verification"
          value={stats.pending}
          icon={<Clock size={28} className="text-[#E39A00]" />}
        />

        <StatCard
          bg="bg-[#E6F6EF]"
          label="Verified"
          value={stats.verified}
          icon={<ShieldCheck size={28} className="text-[#12A36B]" />}
        />

        <StatCard
          bg="bg-[#FDE8E6]"
          label="Rejected"
          value={stats.rejected}
          icon={<XCircle size={28} className="text-[#D93025]" />}
        />

        <StatCard
          bg="bg-[#E8F1FD]"
          label="Total Submissions"
          value={stats.total}
          icon={<FileText size={28} className="text-[#2E7DD7]" />}
        />
      </div>

      {/* FILTERS */}

      <div className={`p-4 ${CARD_CLS}`}>
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.3fr_auto_auto]">
          <Field label="Search">
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
                placeholder="Search by name, mobile number or user ID..."
                className={`${INPUT_CLS} pl-9`}
              />
            </div>
          </Field>

          <Field label="KYC Status">
            <select
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value })}
              className={INPUT_CLS}
            >
              <option value="all">All Status</option>

              <option value="pending">Pending</option>

              <option value="approved">Verified</option>

              <option value="rejected">Rejected</option>
            </select>
          </Field>

          <Field label="Document Type">
            <select
              value={draft.docType}
              onChange={(e) => setDraft({ ...draft, docType: e.target.value })}
              className={INPUT_CLS}
            >
              <option value="all">All Documents</option>

              <option value="aadhaar">Aadhaar</option>

              <option value="pan">PAN</option>
            </select>
          </Field>

          <Field label="Date Range">
            <div className="flex items-center gap-1.5">
              <CalendarDays size={16} className="shrink-0 text-[#8A8F98]" />

              <input
                type="date"
                value={draft.from}
                onChange={(e) => setDraft({ ...draft, from: e.target.value })}
                className={`${INPUT_CLS} px-2`}
              />

              <span className="text-[#8A8F98]">-</span>

              <input
                type="date"
                value={draft.to}
                onChange={(e) => setDraft({ ...draft, to: e.target.value })}
                className={`${INPUT_CLS} px-2`}
              />
            </div>
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

      {/* LIST + PANEL */}

      <div
        className={`grid items-start gap-4 ${active ? "xl:grid-cols-[1fr_360px]" : ""}`}
      >
        {/* ---------- TABLE ---------- */}

        <div className={`min-w-0 overflow-hidden ${CARD_CLS}`}>
          <div className="flex items-center justify-between gap-2 px-4 py-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={22} className="text-[#E39A00]" />

              <h2 className="font-black text-[#173e70]">
                KYC Verification List ({filtered.length.toLocaleString("en-IN")}
                )
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
            <table className="w-full min-w-[820px]">
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

                  <th className={TH_CLS}>User Info</th>

                  <th className={TH_CLS}>Mobile Number</th>

                  <th className={TH_CLS}>Documents</th>

                  <th className={TH_CLS}>KYC Status</th>

                  <th className={TH_CLS}>Submitted On</th>

                  <th className={`${TH_CLS} text-center`}>Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F3E7C4]">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-16 text-center">
                      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-[#FFEFA8] border-t-[#F7B500]" />

                      <p className="text-sm text-[#6B7280]">
                        Loading KYC requests...
                      </p>
                    </td>
                  </tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-14 text-center">
                      <p className="font-bold text-[#1A1A1A]">
                        No KYC requests found
                      </p>

                      <p className="mt-1 text-sm text-[#6B7280]">
                        Try changing or resetting the filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  pageRows.map((g, i) => {
                    const meta = STATUS_META[g.status] || STATUS_META.pending;

                    const selected = active?.key === g.key;

                    const shown = g.files.slice(0, 4);

                    const extra = g.files.length - shown.length;

                    return (
                      <tr
                        key={g.key}
                        onClick={() => openDetail(g)}
                        className={`cursor-pointer transition hover:bg-[#FFFDF7] ${selected ? "bg-[#FFF9E3]" : ""}`}
                      >
                        <td className="px-3 py-2.5 text-sm text-[#6B7280]">
                          {start + i + 1}
                        </td>

                        <td
                          className="px-3 py-2.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={checked.has(g.key)}
                            onChange={() => toggleOne(g.key)}
                            className="h-4 w-4 accent-[#F7B500]"
                          />
                        </td>

                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={g.name} />

                            <div className="min-w-0">
                              <p className="max-w-[140px] truncate text-sm font-bold text-[#1A1A1A]">
                                {g.name}
                              </p>

                              <p className="max-w-[140px] truncate font-mono text-[11px] text-[#6B7280]">
                                ID: {g.displayId}
                              </p>

                              {g.dob && (
                                <p className="max-w-[140px] truncate text-[10px] text-[#8A8F98]">
                                  DOB: {fmtDateOnly(g.dob)}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-3 py-2.5 text-sm text-[#1A1A1A]">
                          {g.mobile}
                        </td>

                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            {shown.map((f) => (
                              <FileChip key={f.id} file={f} />
                            ))}

                            {extra > 0 && (
                              <span className="text-xs font-bold text-[#6B7280]">
                                +{extra}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-2.5">
                          <Pill tone={meta.tone}>{meta.label}</Pill>
                        </td>

                        <td className="whitespace-nowrap px-3 py-2.5">
                          <p className="text-sm text-[#1A1A1A]">
                            {fmtDateOnly(g.createdAt)}
                          </p>

                          <p className="text-[11px] text-[#8A8F98]">
                            {fmtTimeOnly(g.createdAt)}
                          </p>
                        </td>

                        <td
                          className="relative px-3 py-2.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openDetail(g)}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#F3E7C4] bg-[#FFF9E3] px-2.5 py-1 text-xs font-bold text-[#9A5B00] shadow-sm hover:bg-[#FFEFA8]"
                            >
                              <Eye size={13} />
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setMenuId(menuId === g.key ? null : g.key)
                              }
                              aria-label="More"
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#F3E7C4] bg-white text-[#6B7280] hover:bg-[#FFEFA8]"
                            >
                              <MoreVertical size={14} />
                            </button>
                          </div>

                          {menuId === g.key && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setMenuId(null)}
                              />

                              <div className="absolute right-3 top-10 z-20 w-40 overflow-hidden rounded-xl border border-[#F3E7C4] bg-white py-1 text-left shadow-xl">
                                <button
                                  type="button"
                                  onClick={() => openDetail(g, "documents")}
                                  className="block w-full px-4 py-2 text-left text-sm hover:bg-[#FFF9E3]"
                                >
                                  View Documents
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openDetail(g, "notes")}
                                  className="block w-full px-4 py-2 text-left text-sm hover:bg-[#FFF9E3]"
                                >
                                  Verification Notes
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openDetail(g, "audit")}
                                  className="block w-full px-4 py-2 text-left text-sm hover:bg-[#FFF9E3]"
                                >
                                  Audit History
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
                ),
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

        {/* ---------- RIGHT PROFILE PANEL ---------- */}

        {active && (
          <aside className={`min-w-0 p-4 ${CARD_CLS} xl:sticky xl:top-4`}>
            {/* PROFILE */}

            <div className="flex items-start gap-3">
              <Avatar name={active.name} size="h-14 w-14" text="text-lg" />

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-black text-[#173e70]">
                  {active.name}
                </h3>

                <p className="truncate font-mono text-xs text-[#6B7280]">
                  {active.displayId}
                </p>
                <p className="mt-0.5 text-[11px] text-[#6B7280]">
                  DOB: {fmtDateOnly(active.dob)}
                </p>

                <div className="mt-1.5">
                  <Pill
                    tone={
                      (STATUS_META[active.status] || STATUS_META.pending).tone
                    }
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />

                    {(STATUS_META[active.status] || STATUS_META.pending).panel}
                  </Pill>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveId(null)}
                aria-label="Close panel"
                className="rounded-full p-1 text-[#8A8F98] hover:bg-[#FFEFA8]"
              >
                <X size={18} />
              </button>
            </div>

            {/* TABS */}

            <div className="mt-4 grid grid-cols-3 gap-1 rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-1 text-[11px] font-bold">
              {[
                ["documents", "Documents"],

                ["notes", "Verification Notes"],

                ["audit", "Audit History"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`rounded-lg px-1 py-2 ${
                    tab === key
                      ? "bg-gradient-to-b from-[#B8741A] to-[#8A4B0B] text-white"
                      : "text-[#6B7280] hover:bg-[#FFF9E3]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-3 max-h-[380px] space-y-2 overflow-y-auto pr-1">
              {/* DOCUMENTS */}

              {tab === "documents" &&
                (active.files.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[#6B7280]">
                    No documents uploaded.
                  </p>
                ) : (
                  active.files.map((f) => {
                    const meta =
                      DOC_STATUS_META[f.status] || DOC_STATUS_META.pending;

                    const img = getImageUrl(f.url);

                    return (
                      <div
                        key={f.id}
                        className="flex items-center gap-3 rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-2.5"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setPreview({ url: img, label: f.label })
                          }
                          className="h-14 w-16 shrink-0 overflow-hidden rounded-lg border border-[#F3E7C4] bg-white"
                        >
                          {img ? (
                            <img
                              src={img}
                              alt={f.label}
                              className="h-full w-full object-cover"
                              onError={(e) =>
                                (e.currentTarget.style.display = "none")
                              }
                            />
                          ) : null}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-[#1A1A1A]">
                            {f.label}
                          </p>

                          <Pill tone={meta.tone}>
                            <CheckCircle2 size={10} />

                            {meta.label}
                          </Pill>

                          <p className="mt-0.5 text-[10px] text-[#8A8F98]">
                            Uploaded: {fmtDateTime(f.at)}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setPreview({ url: img, label: f.label })
                            }
                            className="rounded-lg border border-[#F3E7C4] bg-white px-2.5 py-1.5 text-xs font-bold text-[#1A1A1A] hover:bg-[#FFEFA8]"
                          >
                            View
                          </button>

                          <button
                            type="button"
                            onClick={() => downloadFile(f)}
                            aria-label="Download"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#F3E7C4] bg-white text-[#1A1A1A] hover:bg-[#FFEFA8]"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ))}

              {/* NOTES */}

              {tab === "notes" &&
                (notes.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[#6B7280]">
                    No verification notes yet.
                  </p>
                ) : (
                  notes.map((n) => (
                    <div
                      key={n.key}
                      className="rounded-xl border border-[#D93025]/25 bg-[#FDE8E6] p-3"
                    >
                      <p className="text-xs font-bold text-[#D93025]">
                        {n.type}
                      </p>

                      <p className="mt-1 text-sm text-[#B3261E]">{n.reason}</p>

                      <p className="mt-1 text-[10px] text-[#8A8F98]">
                        {fmtDateTime(n.at)}
                      </p>
                    </div>
                  ))
                ))}

              {/* AUDIT */}

              {tab === "audit" &&
                audit.map((a) => (
                  <div
                    key={a.key}
                    className="flex items-start gap-3 rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-2.5"
                  >
                    <span
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${a.tone === "green" ? "bg-[#12A36B]" : a.tone === "red" ? "bg-[#D93025]" : "bg-[#F7B500]"}`}
                    />

                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#1A1A1A]">
                        {a.title}
                      </p>

                      <p className="text-xs text-[#6B7280]">{a.sub}</p>

                      <p className="text-[10px] text-[#8A8F98]">
                        {fmtDateTime(a.at)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>

            {/* ERROR */}

            {actionError && (
              <div className="mt-3 rounded-xl border border-[#D93025]/30 bg-[#FDE8E6] p-3 text-sm font-semibold text-[#B3261E]">
                {String(actionError)}
              </div>
            )}

            {/* REJECT REASON */}

            {rejectOpen && (
              <div className="mt-3 rounded-xl border border-[#D93025]/30 bg-[#FDE8E6] p-3">
                <p className="text-sm font-bold text-[#B3261E]">
                  Reason for rejection
                </p>

                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                  disabled={actionLoading}
                  placeholder="Enter rejection reason..."
                  className="mt-2 w-full resize-none rounded-lg border border-[#D93025]/25 bg-white px-3 py-2 text-sm outline-none focus:border-[#D93025]"
                />

                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#8A8F98]">
                    {rejectReason.length}/500
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRejectOpen(false);

                        setRejectReason("");
                      }}
                      disabled={actionLoading}
                      className={`rounded-lg px-3 py-1.5 text-xs ${OUTLINE_BTN}`}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={actionLoading || !rejectReason.trim()}
                      className="rounded-lg bg-[#D93025] px-3 py-1.5 text-xs font-bold text-white disabled:bg-[#BDBDBD]"
                    >
                      {actionLoading ? "Rejecting..." : "Confirm Rejection"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ACTION STATUS BANNER */}

            {active.status === "approved" && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#12A36B]/30 bg-[#E6F6EF] p-3 text-xs font-bold text-[#12A36B]">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>KYC is approved & verified. Status cannot be rejected or modified.</span>
              </div>
            )}

            {active.status === "rejected" && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#D93025]/30 bg-[#FDE8E6] p-3 text-xs font-bold text-[#D93025]">
                <XCircle size={16} className="shrink-0" />
                <span>KYC has been rejected. Cannot be approved until user re-submits.</span>
              </div>
            )}

            {/* ACTION BUTTONS */}

            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  dispatch(clearAdminKycActionError());

                  setRejectOpen(true);
                }}
                disabled={
                  actionLoading ||
                  active.status === "approved" ||
                  active.status === "rejected" ||
                  active.status !== "pending"
                }
                title={
                  active.status === "approved"
                    ? "Approved KYC cannot be rejected"
                    : active.status === "rejected"
                    ? "KYC is already rejected"
                    : "Reject KYC"
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D93025]/30 bg-[#FDE8E6] px-4 py-3 text-sm font-bold text-[#D93025] transition hover:bg-[#F9D3CF] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <XCircle size={16} />
                Reject
              </button>

              <button
                type="button"
                onClick={handleApprove}
                disabled={
                  actionLoading ||
                  active.status === "approved" ||
                  active.status === "rejected" ||
                  active.status !== "pending"
                }
                title={
                  active.status === "approved"
                    ? "KYC is already verified"
                    : active.status === "rejected"
                    ? "Rejected KYC cannot be verified directly"
                    : "Verify User"
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#12A36B] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0E8A5A] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CheckCircle2 size={16} />

                {actionLoading && !rejectOpen ? "Processing..." : "Verify User"}
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* KYC DETAIL MODAL */}
      {currentDetail && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-[#1A1204]/70 p-3 sm:p-4 backdrop-blur-[2px]"
          onClick={() => setDetailModal(null)}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-[#F3E7C4] bg-[#FFF9E3] px-5 py-3.5">
              <div className="flex items-center gap-3">
                <Avatar name={currentDetail.name} size="h-12 w-12" text="text-base" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-[#173e70]">{currentDetail.name}</h2>
                    <Pill tone={(STATUS_META[currentDetail.status] || STATUS_META.pending).tone}>
                      {(STATUS_META[currentDetail.status] || STATUS_META.pending).panel}
                    </Pill>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6B7280]">
                    <span>
                      User ID: <strong className="font-mono text-[#1A1A1A]">{currentDetail.displayId}</strong>
                    </span>
                    <span>
                      Mobile: <strong className="text-[#1A1A1A]">{currentDetail.mobile}</strong>
                    </span>
                    {currentDetail.dob && (
                      <span>
                        DOB: <strong className="text-[#1A1A1A]">{fmtDateOnly(currentDetail.dob)}</strong>
                      </span>
                    )}
                    <span>
                      Submitted: <strong className="text-[#1A1A1A]">{fmtDateTime(currentDetail.createdAt)}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetailModal(null)}
                className="rounded-full p-2 text-[#8A8F98] hover:bg-[#FFEFA8]"
              >
                <X size={20} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* DOCUMENTS LIST */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-[#173e70]">
                  <ShieldCheck size={18} className="text-[#E39A00]" />
                  Uploaded Verification Documents ({currentDetail.files.length})
                </h3>

                {currentDetail.files.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#F3E7C4] p-8 text-center text-sm text-[#8A8F98]">
                    No documents uploaded yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {currentDetail.files.map((f) => {
                      const meta = DOC_STATUS_META[f.status] || DOC_STATUS_META.pending;
                      const img = getImageUrl(f.url);

                      return (
                        <div
                          key={f.id}
                          className="flex flex-col rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] p-3 shadow-sm transition hover:shadow"
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="truncate text-xs font-bold text-[#1A1A1A]">{f.label}</span>
                            <Pill tone={meta.tone}>{meta.label}</Pill>
                          </div>

                          <div
                            onClick={() => img && setPreview({ url: img, label: f.label })}
                            className="group relative flex h-44 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-[#F3E7C4] bg-white"
                          >
                            {img ? (
                              <>
                                <img
                                  src={img}
                                  alt={f.label}
                                  className="h-full w-full object-contain p-1 transition group-hover:scale-105"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
                                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-bold text-[#1A1A1A] shadow">
                                    <Eye size={14} /> Zoom Preview
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div className="p-4 text-center">
                                <FileText size={32} className="mx-auto mb-1 text-[#8A8F98]" />
                                <p className="text-xs text-[#8A8F98]">No image available</p>
                              </div>
                            )}
                          </div>

                          <div className="mt-2.5 flex items-center justify-between border-t border-[#F3E7C4]/50 pt-2">
                            <span className="text-[10px] text-[#8A8F98]">
                              Uploaded: {fmtDateTime(f.at)}
                            </span>
                            <div className="flex gap-1.5">
                              {img && (
                                <button
                                  type="button"
                                  onClick={() => setPreview({ url: img, label: f.label })}
                                  className="inline-flex items-center gap-1 rounded-lg border border-[#F3E7C4] bg-white px-2.5 py-1 text-xs font-bold text-[#1A1A1A] hover:bg-[#FFEFA8]"
                                >
                                  <Eye size={12} />
                                  Preview
                                </button>
                              )}
                              {img && (
                                <button
                                  type="button"
                                  onClick={() => downloadFile(f)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-[#F3E7C4] bg-white px-2.5 py-1 text-xs font-bold text-[#1A1A1A] hover:bg-[#FFEFA8]"
                                >
                                  <Download size={12} />
                                  Download
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* REJECTION NOTES */}
              {detailNotes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#D93025]">
                    Rejection History & Notes
                  </h4>
                  {detailNotes.map((n) => (
                    <div
                      key={n.key}
                      className="rounded-xl border border-[#D93025]/25 bg-[#FDE8E6] p-3 text-xs"
                    >
                      <span className="font-bold text-[#D93025]">{n.type}: </span>
                      <span className="text-[#B3261E]">{n.reason}</span>
                      <p className="mt-1 text-[10px] text-[#8A8F98]">{fmtDateTime(n.at)}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* ACTION ERROR */}
              {actionError && (
                <div className="rounded-xl border border-[#D93025]/30 bg-[#FDE8E6] p-3 text-sm font-semibold text-[#B3261E]">
                  {String(actionError)}
                </div>
              )}

              {/* REJECT FORM */}
              {detailRejectOpen && (
                <div className="rounded-xl border border-[#D93025]/30 bg-[#FDE8E6] p-4">
                  <p className="text-sm font-bold text-[#B3261E]">
                    Enter Reason for Rejecting KYC
                  </p>
                  <textarea
                    value={detailRejectReason}
                    onChange={(e) => setDetailRejectReason(e.target.value)}
                    rows={3}
                    maxLength={500}
                    disabled={actionLoading}
                    placeholder="Provide details why the KYC is rejected (e.g. blurry image, mismatched name)..."
                    className="mt-2 w-full resize-none rounded-lg border border-[#D93025]/25 bg-white px-3 py-2 text-sm outline-none focus:border-[#D93025]"
                  />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#8A8F98]">
                      {detailRejectReason.length}/500
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDetailRejectOpen(false);
                          setDetailRejectReason("");
                        }}
                        disabled={actionLoading}
                        className={`rounded-lg px-3 py-1.5 text-xs ${OUTLINE_BTN}`}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(currentDetail, detailRejectReason)}
                        disabled={actionLoading || !detailRejectReason.trim()}
                        className="rounded-lg bg-[#D93025] px-4 py-1.5 text-xs font-bold text-white disabled:bg-[#BDBDBD]"
                      >
                        {actionLoading ? "Rejecting..." : "Confirm Rejection"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="border-t border-[#F3E7C4] bg-[#FFFDF7] px-5 py-4">
              {currentDetail.status === "approved" && (
                <div className="flex items-center gap-2 rounded-xl border border-[#12A36B]/30 bg-[#E6F6EF] p-3 text-xs font-bold text-[#12A36B]">
                  <CheckCircle2 size={18} className="shrink-0" />
                  <span>KYC is approved & verified. Status is locked and cannot be rejected.</span>
                </div>
              )}

              {currentDetail.status === "rejected" && (
                <div className="flex items-center gap-2 rounded-xl border border-[#D93025]/30 bg-[#FDE8E6] p-3 text-xs font-bold text-[#D93025]">
                  <XCircle size={18} className="shrink-0" />
                  <span>KYC has been rejected. It cannot be approved until the user re-submits fresh documents.</span>
                </div>
              )}

              {currentDetail.status === "pending" && !detailRejectOpen && (
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      dispatch(clearAdminKycActionError());
                      setDetailRejectOpen(true);
                    }}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#D93025]/30 bg-[#FDE8E6] px-5 py-2.5 text-sm font-bold text-[#D93025] transition hover:bg-[#F9D3CF] disabled:opacity-40"
                  >
                    <XCircle size={18} />
                    Reject KYC
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApprove(currentDetail)}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#12A36B] px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#0E8A5A] disabled:opacity-40"
                  >
                    <CheckCircle2 size={18} />
                    {actionLoading ? "Processing..." : "Approve & Verify KYC"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* IMAGE PREVIEW */}

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1204]/70 p-4 backdrop-blur-[2px]"
          onClick={() => setPreview(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#F3E7C4] px-5 py-3">
              <h3 className="font-black text-[#1A1A1A]">{preview.label}</h3>

              <button
                type="button"
                onClick={() => setPreview(null)}
                className="rounded-full p-1.5 text-[#8A8F98] hover:bg-[#FFEFA8]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex max-h-[78vh] items-center justify-center overflow-auto bg-[#FFF9E3] p-3">
              {preview.url ? (
                <img
                  src={preview.url}
                  alt={preview.label}
                  className="max-h-[74vh] w-auto object-contain"
                />
              ) : (
                <p className="py-16 text-sm text-[#8A8F98]">
                  Document not available
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminKycVerification;
