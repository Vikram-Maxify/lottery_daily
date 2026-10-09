import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ClipboardList,
  RefreshCw,
  Plus,
  X,
  Pencil,
  Eye,
  Search,
  Info,
} from "lucide-react";

import {
  getAllFestivalResults,
  createFestivalResult,
  updateFestivalResult,
  publishFestivalResult,
  unpublishFestivalResult,
  deleteFestivalResult,
  checkFestivalNumber,
  clearFestivalResultMessage,
  clearFestivalResultSummary,
  clearFestivalCheckResult,
  getFestivalUnbetNumbers,
  clearFestivalUnbetNumbers,
} from "../../reducer/slice/festivalResultReducer";

import { getAllLotteryConfigs } from "../../reducer/slice/festivalLotteryReducer";

/* =========================================================
   WINZOX THEME
========================================================= */
const GOLD_BTN =
  "bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] text-[#1A1204] font-extrabold shadow-[0_4px_10px_-3px_rgba(227,154,0,0.55),inset_0_1px_0_rgba(255,255,255,0.55)] hover:brightness-105";

const OUTLINE_BTN =
  "border border-[#F2B705] bg-white font-bold text-[#9A5B00] hover:bg-[#FFEFA8]/60";

const INPUT_CLS =
  "w-full rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] px-4 py-3 text-sm text-[#1A1A1A] outline-none transition placeholder:text-[#8A8F98] focus:border-[#F2B705] focus:ring-2 focus:ring-[#FFEFA8] disabled:bg-[#F5F1E4] disabled:text-[#8A8F98]";

const LABEL_CLS = "mb-2 block text-sm font-semibold text-[#1A1A1A]";

const CARD_CLS =
  "rounded-2xl border border-[#F3E7C4] bg-white shadow-[0_6px_18px_-10px_rgba(247,181,0,0.35)]";

const TH_CLS =
  "px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#9A5B00]";

const NUM_INPUT = `${INPUT_CLS} font-mono font-bold tracking-widest uppercase`;

/* =========================================================
   HELPERS
========================================================= */
const getName = (c) =>
  c?.marketName || c?.festivalName || c?.name || c?.title || "-";

const WINNING_NUMBER_REGEX = /^[0-9]{2}[A-Z][0-9]{5}$/;

const isValidWinningNumber = (value) => {
  const v = String(value || "").trim().toUpperCase();
  return WINNING_NUMBER_REGEX.test(v);
};

const isValidShortNumber = (value) => {
  const v = String(value || "").trim().toUpperCase();
  return /^[A-Z0-9]{3,8}$/.test(v);
};

const cleanWinningNumber = (value) =>
  String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);

const toDateOnlyString = (value) => {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value))
    return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};

const formatDate = (date) => {
  if (!date) return "-";
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    const [y, m, d] = date.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  }
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
};

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const Modal = ({ title, onClose, wide, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div
      className={`max-h-[88vh] w-full overflow-y-auto p-6 ${CARD_CLS} ${
        wide ? "max-w-3xl" : "max-w-md"
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <h3 className="text-lg font-black text-[#1A1A1A]">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-[#6B7280] hover:text-[#1A1A1A]"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

/* =========================================================
   PRIZE CONFIG
========================================================= */
const PRIZE_CONFIG = {
  first: { label: "1st Prize (8-digit exact)", max: 1, digits: 8 },
  second: { label: "2nd Prize (last 5 digits)", max: 10, digits: 5 },
  third: { label: "3rd Prize (last 4 digits)", max: 10, digits: 4 },
  fourth: { label: "4th Prize (last 4 digits)", max: 10, digits: 4 },
  fifth: { label: "5th Prize (last 3 digits)", max: 100, digits: 3 },
};

const EMPTY_FORM = {
  lotteryConfigId: "",
  date: "",
  winningNumbers: {
    first: "",
    second: [""],
    third: [""],
    fourth: [""],
    fifth: [""],
  },
};

const FestivalResult = () => {
  const dispatch = useDispatch();

  const {
    results = [],
    loading,
    createLoading,
    updateLoading,
    checkLoading,
    checkResult,
    summary,
    success,
    error,
    message,
    unbetNumbers = [],
    unbetLoading,
  } = useSelector((state) => state.festivalResult);

  const { configs: festivals = [], loading: festivalLoading = false } =
    useSelector((state) => state.festivalLottery || {});

  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [publishingIds, setPublishingIds] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);

  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [editNumbers, setEditNumbers] = useState(EMPTY_FORM.winningNumbers);

  const [showCheck, setShowCheck] = useState(false);
  const [checkForm, setCheckForm] = useState({
    userNumber: "",
    winningNumbers: {
      first: "",
      second: [""],
      third: [""],
      fourth: [""],
      fifth: [""],
    },
  });

  const [showUnbet, setShowUnbet] = useState(false);

  const refreshFestivals = () => {
    dispatch(getAllLotteryConfigs());
  };

  useEffect(() => {
    dispatch(getAllFestivalResults());
    dispatch(getAllLotteryConfigs());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    if (!success && !error) return;
    const timer = setTimeout(
      () => dispatch(clearFestivalResultMessage()),
      3500
    );
    return () => clearTimeout(timer);
  }, [success, error, dispatch]);

  const selectableFestivals = useMemo(
    () => (Array.isArray(festivals) ? festivals : []),
    [festivals]
  );

  const selectedFestival = useMemo(
    () =>
      (Array.isArray(festivals) ? festivals : []).find(
        (c) => String(c?._id) === String(formData.lotteryConfigId)
      ),
    [festivals, formData.lotteryConfigId]
  );

  const hasDrawDate = Boolean(selectedFestival?.drawDate);

  const filteredResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    return results.filter((item) => {
      const name = getName(item?.lotteryConfigId).toLowerCase();
      const wn = item?.winningNumbers || {};
      const allNums = [
        wn.first,
        ...(wn.second || []),
        ...(wn.third || []),
        ...(wn.fourth || []),
        ...(wn.fifth || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchSearch =
        !q ||
        name.includes(q) ||
        allNums.includes(q) ||
        String(item?.winningNumber || "").toLowerCase().includes(q);

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "published" ? item?.isPublished : !item?.isPublished);

      return matchSearch && matchStatus;
    });
  }, [results, search, statusFilter]);

  /* ---------------- FORM ---------------- */

  const handleConfigChange = (value) => {
    const cfg = festivals.find((c) => String(c?._id) === String(value));
    setFormError("");
    setFormData({
      lotteryConfigId: value,
      date: cfg ? toDateOnlyString(cfg.drawDate) : "",
      winningNumbers: {
        first: "",
        second: [""],
        third: [""],
        fourth: [""],
        fifth: [""],
      },
    });
    dispatch(clearFestivalUnbetNumbers());
    setShowUnbet(false);
  };

  const handleFirstChange = (value) => {
    const cleaned = cleanWinningNumber(value);
    setFormData((prev) => ({
      ...prev,
      winningNumbers: { ...prev.winningNumbers, first: cleaned },
    }));
    if (formError) setFormError("");
  };

  const handleArrayChange = (prizeKey, index, value) => {
    const cleaned = cleanWinningNumber(value);
    setFormData((prev) => {
      const arr = [...prev.winningNumbers[prizeKey]];
      arr[index] = cleaned;
      return {
        ...prev,
        winningNumbers: { ...prev.winningNumbers, [prizeKey]: arr },
      };
    });
    if (formError) setFormError("");
  };

  const addArrayItem = (prizeKey) => {
    const { max } = PRIZE_CONFIG[prizeKey];
    setFormData((prev) => {
      const arr = [...prev.winningNumbers[prizeKey]];
      if (arr.length >= max) return prev;
      arr.push("");
      return {
        ...prev,
        winningNumbers: { ...prev.winningNumbers, [prizeKey]: arr },
      };
    });
  };

  const removeArrayItem = (prizeKey, index) => {
    setFormData((prev) => {
      const arr = [...prev.winningNumbers[prizeKey]];
      if (arr.length <= 1) arr[0] = "";
      else arr.splice(index, 1);
      return {
        ...prev,
        winningNumbers: { ...prev.winningNumbers, [prizeKey]: arr },
      };
    });
  };

  const handleFetchUnbet = () => {
    if (!formData.lotteryConfigId) {
      setFormError("Select a festival first.");
      return;
    }
    setShowUnbet(true);
    dispatch(getFestivalUnbetNumbers(formData.lotteryConfigId));
  };

  const validateForm = () => {
    if (!formData.lotteryConfigId) return "Please select a festival lottery.";
    if (!formData.date) return "Please select the result date.";

    const wn = formData.winningNumbers;

    if (!isValidWinningNumber(wn.first)) {
      return "1st prize number is required (e.g. 12A12345).";
    }

    for (const key of ["second", "third", "fourth"]) {
      const arr = (wn[key] || []).filter((x) => String(x).trim() !== "");
      if (arr.length === 0) {
        return `${PRIZE_CONFIG[key].label}: at least 1 number required.`;
      }
      if (arr.length > PRIZE_CONFIG[key].max) {
        return `${PRIZE_CONFIG[key].label}: max ${PRIZE_CONFIG[key].max} numbers allowed.`;
      }
      for (const n of arr) {
        if (!isValidWinningNumber(n)) {
          return `Invalid number in ${PRIZE_CONFIG[key].label}: ${n}`;
        }
      }
    }

    // 5th prize — 3-8 alphanumeric
    const fifthArr = (wn.fifth || []).filter((x) => String(x).trim() !== "");
    if (fifthArr.length === 0) {
      return "5th Prize: at least 1 number required.";
    }
    if (fifthArr.length > PRIZE_CONFIG.fifth.max) {
      return `5th Prize: max ${PRIZE_CONFIG.fifth.max} numbers allowed.`;
    }
    for (const n of fifthArr) {
      if (!isValidShortNumber(n)) {
        return `Invalid 5th prize number: ${n} (3-8 alphanumeric chars)`;
      }
    }

    return null;
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    const err = validateForm();
    if (err) return setFormError(err);
    setFormError("");

    const wn = formData.winningNumbers;
    const payload = {
      lotteryConfigId: formData.lotteryConfigId,
      date: formData.date,
      winningNumbers: {
        first: wn.first.toUpperCase(),
        second: wn.second.filter(Boolean).map((n) => n.toUpperCase()),
        third: wn.third.filter(Boolean).map((n) => n.toUpperCase()),
        fourth: wn.fourth.filter(Boolean).map((n) => n.toUpperCase()),
        fifth: wn.fifth.filter(Boolean).map((n) => n.toUpperCase()),
      },
    };

    const response = await dispatch(createFestivalResult(payload));

    if (createFestivalResult.fulfilled.match(response)) {
      setFormData(EMPTY_FORM);
      setShowCreate(false);
      setShowUnbet(false);
      dispatch(clearFestivalUnbetNumbers());
      refreshFestivals();
    } else if (createFestivalResult.rejected.match(response)) {
      setFormError(response.payload?.message || "Failed to create result");
    }
  };

  /* ---------------- EDIT ---------------- */

  const handleEditSave = async () => {
    const wn = editNumbers;
    const payload = {
      winningNumbers: {
        first: (wn.first || "").toUpperCase(),
        second: wn.second.filter(Boolean).map((n) => n.toUpperCase()),
        third: wn.third.filter(Boolean).map((n) => n.toUpperCase()),
        fourth: wn.fourth.filter(Boolean).map((n) => n.toUpperCase()),
        fifth: wn.fifth.filter(Boolean).map((n) => n.toUpperCase()),
      },
    };

    const res = await dispatch(
      updateFestivalResult({ id: editItem._id, data: payload })
    );

    if (updateFestivalResult.fulfilled.match(res)) {
      setEditItem(null);
      refreshFestivals();
    }
  };

  /* ---------------- PUBLISH / DELETE ---------------- */

  const runWithId = async (setter, id, action) => {
    setter((prev) => [...prev, id]);
    try {
      await dispatch(action);
    } finally {
      setter((prev) => prev.filter((x) => x !== id));
    }
  };

  const handlePublish = (id) =>
    runWithId(setPublishingIds, id, publishFestivalResult(id));
  const handleUnpublish = (id) =>
    runWithId(setPublishingIds, id, unpublishFestivalResult(id));

  const handleDelete = async (id) => {
    const ok = window.confirm(
      "Delete this result? Winners ka prize unke wallet se wapas kat jayega."
    );
    if (!ok) return;
    await runWithId(setDeletingIds, id, deleteFestivalResult(id));
    refreshFestivals();
  };

  /* ---------------- CHECK NUMBER ---------------- */

  const closeCheck = () => {
    setShowCheck(false);
    setCheckForm({
      userNumber: "",
      winningNumbers: {
        first: "",
        second: [""],
        third: [""],
        fourth: [""],
        fifth: [""],
      },
    });
    dispatch(clearFestivalCheckResult());
  };

  const runCheck = () => {
    if (!isValidWinningNumber(checkForm.userNumber)) return;
    dispatch(
      checkFestivalNumber({
        userNumber: checkForm.userNumber,
        winningNumbers: checkForm.winningNumbers,
      })
    );
  };

  /* ---------------- RENDER ARRAY GROUP ---------------- */

  const renderArrayGroup = (prizeKey, source, onChange, onAdd, onRemove) => {
    const { label, max } = PRIZE_CONFIG[prizeKey];
    const arr = source[prizeKey] || [""];
    const filled = arr.filter(Boolean).length;

    return (
      <div className="md:col-span-3">
        <div className="mb-2 flex items-center justify-between">
          <label className={LABEL_CLS + " !mb-0"}>
            {label}{" "}
            <span className="text-xs font-medium text-[#8A8F98]">
              ({filled}/{max})
            </span>
          </label>
          <button
            type="button"
            onClick={onAdd}
            disabled={arr.length >= max}
            className="inline-flex items-center gap-1 rounded-lg border border-[#F2B705] bg-[#FFEFA8] px-3 py-1.5 text-xs font-bold text-[#9A5B00] transition hover:bg-[#FFE680] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={12} /> Add
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          {arr.map((val, idx) => (
            <div key={idx} className="relative">
              <input
                type="text"
                value={val}
                onChange={(e) => onChange(idx, e.target.value)}
                maxLength={8}
                placeholder={`#${idx + 1}`}
                className={`${INPUT_CLS} !py-2 font-mono font-bold tracking-widest uppercase`}
              />
              {arr.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full border border-[#D93025]/30 bg-[#FDE8E6] text-[#D93025] transition hover:bg-[#FAD2CE]"
                  title="Remove"
                >
                  <X size={10} strokeWidth={3} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ---------------- RENDER ---------------- */

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#1A1A1A]">
            Festival Lottery Results
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Manage festival lottery results with 5 prize tiers.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              dispatch(getAllFestivalResults());
              refreshFestivals();
            }}
            disabled={loading}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition disabled:opacity-50 ${OUTLINE_BTN}`}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={() => setShowCheck(true)}
            className={`rounded-xl px-4 py-2.5 text-sm transition ${OUTLINE_BTN}`}
          >
            Check Number
          </button>

          <button
            type="button"
            onClick={() => {
              setShowCreate((prev) => !prev);
              setFormError("");
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition ${GOLD_BTN}`}
          >
            {showCreate ? (
              <>
                <X size={16} strokeWidth={2.8} /> Close
              </>
            ) : (
              <>
                <Plus size={16} strokeWidth={2.8} /> Create Result
              </>
            )}
          </button>
        </div>
      </div>

      {/* MESSAGES */}
      {success && message && (
        <div className="rounded-xl border border-[#12A36B]/30 bg-[#E6F6EF] px-4 py-3 text-sm font-medium text-[#0E7A52]">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-[#D93025]/30 bg-[#FDE8E6] px-4 py-3 text-sm font-medium text-[#B3261E]">
          {error}
        </div>
      )}

      {/* SUMMARY */}
      {summary && (
        <div className={`p-5 ${CARD_CLS}`}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-black text-[#1A1A1A]">
              Result summary — {summary.date}
            </h3>
            <button
              type="button"
              onClick={() => dispatch(clearFestivalResultSummary())}
              className="text-[#6B7280] hover:text-[#1A1A1A]"
            >
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-8">
            {[
              ["Entries", summary.totalUsers],
              ["1st", summary.firstPrize],
              ["2nd", summary.secondPrize],
              ["3rd", summary.thirdPrize],
              ["4th", summary.fourthPrize],
              ["5th", summary.fifthPrize],
              ["Lost", summary.lost],
              ["Prize paid", money(summary.totalPrizePaid)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-[#F3E7C4] bg-[#FFF9E3] p-3"
              >
                <p className="text-xs font-semibold text-[#8A8F98]">{label}</p>
                <p className="mt-1 text-lg font-black text-[#1A1A1A]">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE FORM */}
      {showCreate && (
        <div className={`p-6 ${CARD_CLS}`}>
          <h2 className="mb-2 text-lg font-black text-[#1A1A1A]">
            Create Festival Result
          </h2>
          <p className="mb-6 text-sm text-[#6B7280]">
            1st = 1 exact 8-digit number. 2nd = 10 (last 5 digits). 3rd/4th =
            10 (last 4 digits). 5th = 100 (last 3 digits).
          </p>

          <form
            onSubmit={handleCreate}
            className="grid grid-cols-1 gap-5 md:grid-cols-3"
          >
            <div>
              <label className={LABEL_CLS}>Festival Lottery</label>
              <select
                value={formData.lotteryConfigId}
                onChange={(e) => handleConfigChange(e.target.value)}
                disabled={festivalLoading}
                className={INPUT_CLS}
              >
                <option value="">
                  {festivalLoading ? "Loading..." : "Select Festival Lottery"}
                </option>
                {selectableFestivals.map((c) => (
                  <option key={c._id} value={c._id}>
                    {`${getName(c)}${
                      c.drawDate ? ` - ${toDateOnlyString(c.drawDate)}` : ""
                    }${c.drawTime ? ` (${c.drawTime})` : ""}${
                      c.isActive ? " ✅" : ""
                    }`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLS}>Result Date</label>
              <input
                type="text"
                readOnly
                disabled
                value={formData.date ? formatDate(formData.date) : ""}
                placeholder="Select festival first"
                className={INPUT_CLS}
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleFetchUnbet}
                disabled={!formData.lotteryConfigId || unbetLoading}
                className={`w-full rounded-xl px-4 py-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${OUTLINE_BTN}`}
              >
                {unbetLoading ? "Loading..." : "Show Unbet Numbers"}
              </button>
            </div>

            {showUnbet && (
              <div className="md:col-span-3">
                <div className="rounded-xl border border-[#F3E7C4] bg-[#FFF9E3] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#1A1A1A]">
                      Unbet Numbers ({unbetNumbers.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUnbet(false);
                        dispatch(clearFestivalUnbetNumbers());
                      }}
                      className="text-xs font-bold text-[#9A5B00] hover:underline"
                    >
                      Hide
                    </button>
                  </div>
                  {unbetLoading ? (
                    <p className="text-xs text-[#6B7280]">Loading...</p>
                  ) : unbetNumbers.length === 0 ? (
                    <p className="text-xs text-[#6B7280]">
                      No unbet numbers found.
                    </p>
                  ) : (
                    <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
                      {unbetNumbers.map((n, i) => (
                        <span
                          key={i}
                          className="rounded-lg bg-white px-2.5 py-1 font-mono text-xs font-bold text-[#1A1204] ring-1 ring-[#F2B705]/60"
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 1st */}
            <div className="md:col-span-3">
              <label className={LABEL_CLS}>
                1st Prize Number (8-digit exact)
              </label>
              <input
                type="text"
                value={formData.winningNumbers.first}
                onChange={(e) => handleFirstChange(e.target.value)}
                maxLength={8}
                placeholder="e.g. 12A12345"
                className={NUM_INPUT}
              />
              <p className="mt-2 flex items-start gap-1.5 text-xs text-[#6B7280]">
                <Info size={12} className="mt-0.5 shrink-0" />
                <span>
                  8 chars — 2 digits + 1 letter + 5 digits (e.g. 12A12345)
                </span>
              </p>
            </div>

            {/* 2nd - 5th */}
            {renderArrayGroup(
              "second",
              formData.winningNumbers,
              (idx, v) => handleArrayChange("second", idx, v),
              () => addArrayItem("second"),
              (idx) => removeArrayItem("second", idx)
            )}
            {renderArrayGroup(
              "third",
              formData.winningNumbers,
              (idx, v) => handleArrayChange("third", idx, v),
              () => addArrayItem("third"),
              (idx) => removeArrayItem("third", idx)
            )}
            {renderArrayGroup(
              "fourth",
              formData.winningNumbers,
              (idx, v) => handleArrayChange("fourth", idx, v),
              () => addArrayItem("fourth"),
              (idx) => removeArrayItem("fourth", idx)
            )}
            {renderArrayGroup(
              "fifth",
              formData.winningNumbers,
              (idx, v) => handleArrayChange("fifth", idx, v),
              () => addArrayItem("fifth"),
              (idx) => removeArrayItem("fifth", idx)
            )}

            {selectedFestival && (
              <div className="md:col-span-3">
                <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#F3E7C4] bg-[#FFF9E3] p-4 md:grid-cols-5">
                  {[
                    ["Festival", getName(selectedFestival)],
                    ["Draw Date", formatDate(selectedFestival.drawDate)],
                    ["Draw Time", selectedFestival.drawTime],
                    ["Month", selectedFestival.month],
                    ["Year", selectedFestival.year],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs font-semibold text-[#8A8F98]">
                        {label}
                      </p>
                      <p className="mt-1 font-bold text-[#1A1A1A]">
                        {value || "-"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formError && (
              <div className="md:col-span-3">
                <div className="rounded-xl border border-[#D93025]/30 bg-[#FDE8E6] px-4 py-3 text-sm font-medium text-[#B3261E]">
                  {formError}
                </div>
              </div>
            )}

            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={createLoading}
                className={`rounded-xl px-6 py-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${GOLD_BTN}`}
              >
                {createLoading ? "Creating..." : "Create Result"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RESULTS TABLE */}
      <div className={`overflow-hidden ${CARD_CLS}`}>
        <div className="flex flex-col gap-3 border-b border-[#F3E7C4] px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-black text-[#1A1A1A]">All Results</h2>
            <p className="mt-1 text-xs text-[#6B7280]">
              {filteredResults.length} of {results.length} result(s)
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8F98]"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Festival ya number khojo"
                className={`${INPUT_CLS} !py-2 pl-9 md:w-60`}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`${INPUT_CLS} !w-auto !py-2`}
            >
              <option value="all">All status</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
            </select>
          </div>
        </div>

        {loading && results.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-[#FFEFA8] border-t-[#F7B500]" />
            <p className="text-sm text-[#6B7280]">Loading results...</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#FFEFA8] text-[#1A1204] ring-2 ring-[#F2B705]">
              <ClipboardList size={24} />
            </div>
            <h3 className="font-bold text-[#1A1A1A]">No Results Found</h3>
            <p className="mt-1 text-sm text-[#6B7280]">
              {results.length === 0
                ? "Create your first festival result."
                : "Search ya filter badal ke dekho."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-[#FFF9E3]">
                <tr>
                  {[
                    "#",
                    "Festival",
                    "Draw Date",
                    "Result Date",
                    "Winning Numbers",
                    "Winners",
                    "Prize Paid",
                    "Status",
                  ].map((h) => (
                    <th key={h} className={TH_CLS}>
                      {h}
                    </th>
                  ))}
                  <th className={`${TH_CLS} !text-right`}>Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F3E7C4]">
                {filteredResults.map((item, index) => {
                  const published = item?.isPublished === true;
                  const config = item?.lotteryConfigId;
                  const isPublishing = publishingIds.includes(item._id);
                  const isDeleting = deletingIds.includes(item._id);
                  const winners = item?.winners || [];
                  const paid = winners.reduce(
                    (t, w) => t + Number(w.prizeAmount || 0),
                    0
                  );

                  const wn = item?.winningNumbers || {};
                  const firstNum = wn.first || item?.winningNumber || null;
                  const secondArr = Array.isArray(wn.second) ? wn.second : [];
                  const thirdArr = Array.isArray(wn.third) ? wn.third : [];
                  const fourthArr = Array.isArray(wn.fourth) ? wn.fourth : [];
                  const fifthArr = Array.isArray(wn.fifth) ? wn.fifth : [];

                  return (
                    <tr
                      key={item?._id || index}
                      className="align-top transition hover:bg-[#FFFDF7]"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-[#8A8F98]">
                        {index + 1}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-semibold text-[#1A1A1A]">
                        {getName(config)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-[#1A1A1A]">
                        {formatDate(config?.drawDate)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-[#1A1A1A]">
                        {formatDate(item?.date)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="min-w-[240px] space-y-2">
                          {firstNum && (
                            <div className="flex items-center gap-2">
                              <span className="rounded-md bg-[#FFE680] px-2 py-0.5 text-[10px] font-black text-[#9A5B00]">
                                1st
                              </span>
                              <span className="rounded-full bg-[#FFEFA8] px-3 py-1 font-mono text-xs font-black tracking-widest text-[#1A1204] ring-1 ring-[#F2B705]/60">
                                {firstNum}
                              </span>
                            </div>
                          )}

                          {secondArr.length > 0 && (
                            <div className="flex flex-wrap items-start gap-1">
                              <span className="rounded-md bg-[#E6F6EF] px-2 py-0.5 text-[10px] font-black text-[#0E7A52]">
                                2nd ({secondArr.length})
                              </span>
                              {secondArr.map((n, i) => (
                                <span
                                  key={i}
                                  className="rounded bg-[#F5F1E4] px-2 py-0.5 font-mono text-[10px] font-bold text-[#1A1204]"
                                >
                                  {n}
                                </span>
                              ))}
                            </div>
                          )}

                          {thirdArr.length > 0 && (
                            <div className="flex flex-wrap items-start gap-1">
                              <span className="rounded-md bg-[#E0F0FF] px-2 py-0.5 text-[10px] font-black text-[#1E5FA8]">
                                3rd ({thirdArr.length})
                              </span>
                              {thirdArr.map((n, i) => (
                                <span
                                  key={i}
                                  className="rounded bg-[#F5F1E4] px-2 py-0.5 font-mono text-[10px] font-bold text-[#1A1204]"
                                >
                                  {n}
                                </span>
                              ))}
                            </div>
                          )}

                          {fourthArr.length > 0 && (
                            <div className="flex flex-wrap items-start gap-1">
                              <span className="rounded-md bg-[#F3E7FF] px-2 py-0.5 text-[10px] font-black text-[#6B2FA8]">
                                4th ({fourthArr.length})
                              </span>
                              {fourthArr.map((n, i) => (
                                <span
                                  key={i}
                                  className="rounded bg-[#F5F1E4] px-2 py-0.5 font-mono text-[10px] font-bold text-[#1A1204]"
                                >
                                  {n}
                                </span>
                              ))}
                            </div>
                          )}

                          {fifthArr.length > 0 && (
                            <div className="flex flex-wrap items-start gap-1">
                              <span className="rounded-md bg-[#FFE8E0] px-2 py-0.5 text-[10px] font-black text-[#A83E1E]">
                                5th ({fifthArr.length})
                              </span>
                              {fifthArr.slice(0, 8).map((n, i) => (
                                <span
                                  key={i}
                                  className="rounded bg-[#F5F1E4] px-2 py-0.5 font-mono text-[10px] font-bold text-[#1A1204]"
                                >
                                  {n}
                                </span>
                              ))}
                              {fifthArr.length > 8 && (
                                <span className="text-[10px] font-bold text-[#8A8F98]">
                                  +{fifthArr.length - 8} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-[#1A1A1A]">
                        {winners.length}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-[#1A1A1A]">
                        {money(paid)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        {published ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F6EF] px-3 py-1 text-xs font-bold text-[#12A36B]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#12A36B]" />
                            Published
                          </span>
                        ) : (
                          <span className="rounded-full bg-[#FFEFA8] px-3 py-1 text-xs font-bold text-[#9A5B00]">
                            Unpublished
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setViewItem(item)}
                            title="View winners"
                            className={`rounded-lg px-3 py-2 text-xs ${OUTLINE_BTN}`}
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditItem(item);
                              setEditNumbers({
                                first: wn.first || item?.winningNumber || "",
                                second:
                                  secondArr.length > 0 ? [...secondArr] : [""],
                                third:
                                  thirdArr.length > 0 ? [...thirdArr] : [""],
                                fourth:
                                  fourthArr.length > 0 ? [...fourthArr] : [""],
                                fifth:
                                  fifthArr.length > 0 ? [...fifthArr] : [""],
                              });
                            }}
                            disabled={published}
                            title={
                              published
                                ? "Unpublish result before editing"
                                : "Edit winning numbers"
                            }
                            className={`rounded-lg px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50 ${OUTLINE_BTN}`}
                          >
                            <Pencil size={14} />
                          </button>

                          {published ? (
                            <button
                              type="button"
                              onClick={() => handleUnpublish(item._id)}
                              disabled={isPublishing}
                              className="rounded-lg border border-[#F2B705] bg-[#FFEFA8] px-3 py-2 text-xs font-bold text-[#9A5B00] transition hover:bg-[#FFE680] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isPublishing ? "..." : "Unpublish"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handlePublish(item._id)}
                              disabled={isPublishing}
                              className="rounded-lg border border-[#12A36B]/40 bg-[#E6F6EF] px-3 py-2 text-xs font-bold text-[#12A36B] transition hover:bg-[#D3EFE2] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isPublishing ? "..." : "Publish"}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(item._id)}
                            disabled={isDeleting || published}
                            title={
                              published
                                ? "Unpublish result before deleting"
                                : "Delete result"
                            }
                            className="rounded-lg border border-[#D93025]/30 bg-[#FDE8E6] px-3 py-2 text-xs font-bold text-[#D93025] transition hover:bg-[#FAD2CE] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isDeleting ? "..." : "Delete"}
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

      {/* VIEW WINNERS */}
      {viewItem && (
        <Modal
          wide
          onClose={() => setViewItem(null)}
          title={`${getName(viewItem.lotteryConfigId)} - ${formatDate(
            viewItem.date
          )}`}
        >
          {(viewItem.winners || []).length === 0 ? (
            <p className="py-8 text-center text-sm text-[#6B7280]">
              Is result mein koi winner nahi hai.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px]">
                <thead className="bg-[#FFF9E3]">
                  <tr>
                    {[
                      "User ID",
                      "Number",
                      "Matched",
                      "Played",
                      "Prize",
                      "Match",
                      "Won",
                    ].map((h) => (
                      <th key={h} className={TH_CLS}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3E7C4]">
                  {viewItem.winners.map((w, i) => (
                    <tr key={w._id || i}>
                      <td className="px-6 py-3 text-sm text-[#1A1A1A]">
                        {w.userId}
                      </td>
                      <td className="px-6 py-3 font-mono text-sm font-bold tracking-widest">
                        {w.userNumber}
                      </td>
                      <td className="px-6 py-3 font-mono text-sm">
                        {w.matchedNumber || "-"}
                      </td>
                      <td className="px-6 py-3 text-sm">{money(w.amount)}</td>
                      <td className="px-6 py-3 text-sm font-semibold text-[#9A5B00]">
                        {w.prizeType}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        {w.matchedDigits} digit
                      </td>
                      <td className="px-6 py-3 text-sm font-bold text-[#12A36B]">
                        {money(w.prizeAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}

      {/* EDIT */}
      {editItem && (
        <Modal
          wide
          title="Edit winning numbers"
          onClose={() => setEditItem(null)}
        >
          <p className="mb-4 text-sm text-[#6B7280]">
            {getName(editItem.lotteryConfigId)} - {formatDate(editItem.date)}
          </p>

          <div className="space-y-4">
            <div>
              <label className={LABEL_CLS}>1st Prize (8-digit exact)</label>
              <input
                type="text"
                maxLength={8}
                value={editNumbers.first}
                onChange={(e) =>
                  setEditNumbers((p) => ({
                    ...p,
                    first: cleanWinningNumber(e.target.value),
                  }))
                }
                className={NUM_INPUT}
                placeholder="e.g. 12A12345"
              />
            </div>

            {["second", "third", "fourth", "fifth"].map((key) => {
              const { label, max } = PRIZE_CONFIG[key];
              const arr = editNumbers[key] || [""];
              return (
                <div key={key}>
                  <div className="mb-2 flex items-center justify-between">
                    <label className={LABEL_CLS + " !mb-0"}>{label}</label>
                    <button
                      type="button"
                      onClick={() =>
                        setEditNumbers((p) => {
                          const a = [...p[key]];
                          if (a.length >= max) return p;
                          a.push("");
                          return { ...p, [key]: a };
                        })
                      }
                      disabled={arr.length >= max}
                      className="rounded-lg border border-[#F2B705] bg-[#FFEFA8] px-3 py-1.5 text-xs font-bold text-[#9A5B00] disabled:opacity-50"
                    >
                      <Plus size={12} /> Add
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                    {arr.map((v, idx) => (
                      <div key={idx} className="relative">
                        <input
                          type="text"
                          maxLength={8}
                          value={v}
                          onChange={(e) =>
                            setEditNumbers((p) => {
                              const a = [...p[key]];
                              a[idx] = cleanWinningNumber(e.target.value);
                              return { ...p, [key]: a };
                            })
                          }
                          className={`${INPUT_CLS} !py-2 font-mono font-bold tracking-widest uppercase`}
                          placeholder={`#${idx + 1}`}
                        />
                        {arr.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setEditNumbers((p) => {
                                const a = [...p[key]];
                                if (a.length <= 1) a[0] = "";
                                else a.splice(idx, 1);
                                return { ...p, [key]: a };
                              })
                            }
                            className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full border border-[#D93025]/30 bg-[#FDE8E6] text-[#D93025]"
                          >
                            <X size={10} strokeWidth={3} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-4 rounded-xl border border-[#F3E7C4] bg-[#FFF9E3] p-3 text-xs text-[#9A5B00]">
            Save karte hi purane winners ka prize wallet se wapas kat jayega aur
            naye numbers se dobara calculate hoga.
          </p>

          <button
            type="button"
            onClick={handleEditSave}
            disabled={updateLoading || !isValidWinningNumber(editNumbers.first)}
            className={`mt-5 w-full rounded-xl py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60 ${GOLD_BTN}`}
          >
            {updateLoading ? "Saving..." : "Save changes"}
          </button>
        </Modal>
      )}

      {/* CHECK NUMBER */}
      {showCheck && (
        <Modal wide title="Check number" onClose={closeCheck}>
          <p className="mb-4 text-xs text-[#6B7280]">
            Sirf test ke liye. Isse koi result ya wallet nahi badalta.
          </p>

          <div className="space-y-4">
            <div>
              <label className={LABEL_CLS}>User ka number</label>
              <input
                type="text"
                maxLength={8}
                value={checkForm.userNumber}
                onChange={(e) =>
                  setCheckForm((p) => ({
                    ...p,
                    userNumber: cleanWinningNumber(e.target.value),
                  }))
                }
                placeholder="e.g. 12A12345"
                className={NUM_INPUT}
              />
            </div>

            <div>
              <label className={LABEL_CLS}>1st Prize (8-digit exact)</label>
              <input
                type="text"
                maxLength={8}
                value={checkForm.winningNumbers.first}
                onChange={(e) =>
                  setCheckForm((p) => ({
                    ...p,
                    winningNumbers: {
                      ...p.winningNumbers,
                      first: cleanWinningNumber(e.target.value),
                    },
                  }))
                }
                placeholder="e.g. 12A12345"
                className={NUM_INPUT}
              />
            </div>

            {["second", "third", "fourth", "fifth"].map((key) => (
              <div key={key}>
                <label className={LABEL_CLS}>{PRIZE_CONFIG[key].label}</label>
                <input
                  type="text"
                  maxLength={8}
                  value={checkForm.winningNumbers[key][0] || ""}
                  onChange={(e) =>
                    setCheckForm((p) => ({
                      ...p,
                      winningNumbers: {
                        ...p.winningNumbers,
                        [key]: [cleanWinningNumber(e.target.value)],
                      },
                    }))
                  }
                  placeholder="Optional"
                  className={NUM_INPUT}
                />
              </div>
            ))}

            <button
              type="button"
              onClick={runCheck}
              disabled={checkLoading}
              className={`w-full rounded-xl py-3 text-sm disabled:opacity-60 ${GOLD_BTN}`}
            >
              {checkLoading ? "Checking..." : "Check"}
            </button>

            {checkResult && (
              <div
                className={`rounded-xl border p-3 text-sm font-medium ${
                  checkResult.winner
                    ? "border-[#12A36B]/30 bg-[#E6F6EF] text-[#0E7A52]"
                    : "border-[#F3E7C4] bg-[#FFF9E3] text-[#6B7280]"
                }`}
              >
                {checkResult.winner
                  ? `Prize banta hai: ${checkResult.result?.prize} (${checkResult.result?.matchedDigits} digit match)`
                  : "Koi prize nahi banta."}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FestivalResult;