import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ClipboardList, RefreshCw, Plus, X, Info, Trash2 } from "lucide-react";

import {
  getAllResults,
  createResult,
  publishResult,
  unpublishResult,
  deleteResult,
  clearResultMessage,
  getUnbetNumbers,
  clearUnbetNumbers,
} from "../../reducer/slice/lotteryResultReducer";

import { getAllLotteryConfigs } from "../../reducer/slice/lotteryConfigSlice";

/* =========================================================
   WINZOX THEME TOKENS
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

// =====================================================
// WINNING NUMBER FORMAT — 8 chars: 2 digits + 1 letter + 5 digits
// =====================================================
const WINNING_NUMBER_REGEX = /^[0-9]{2}[A-Z][0-9]{5}$/;

const isValidWinningNumber = (value) => {
  const v = String(value || "").trim().toUpperCase();
  return WINNING_NUMBER_REGEX.test(v);
};

const NUMBER_FORMAT_HINT =
  "8 chars — 2 digits + 1 letter (A-Z) + 5 digits. Example: 12A12345";

// =====================================================
// PRIZE CONFIG
// =====================================================
const PRIZE_CONFIG = {
  first: { label: "1st Prize (8-digit exact)", max: 1, digits: 8 },
  second: { label: "2nd Prize (last 5 digits)", max: 10, digits: 5 },
  third: { label: "3rd Prize (last 4 digits)", max: 10, digits: 4 },
  fourth: { label: "4th Prize (last 4 digits)", max: 10, digits: 4 },
  fifth: { label: "5th Prize (last 4 digits)", max: 100, digits: 4 },
};

// =====================================================
// SAFE DATE-ONLY STRING (YYYY-MM-DD)
// =====================================================
const toDateOnlyString = (value) => {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
};

// =====================================================
// EMPTY FORM STATE
// =====================================================
const emptyForm = {
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

// =====================================================
// COMPONENT
// =====================================================
const Results = () => {
  const dispatch = useDispatch();

  const {
    results = [],
    loading,
    createLoading,
    success,
    error,
    message,
    unbetNumbers = [],
    unbetLoading,
  } = useSelector((state) => state.lotteryResult);

  const { configs = [], loading: configLoading } = useSelector(
    (state) => state.lotteryConfig
  );

  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const [publishingIds, setPublishingIds] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);
  const [showUnbet, setShowUnbet] = useState(false);

  useEffect(() => {
    dispatch(getAllResults());
    dispatch(getAllLotteryConfigs());
  }, [dispatch]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => dispatch(clearResultMessage()), 6000);
      return () => clearTimeout(timer);
    }
  }, [success, error, dispatch]);

  const selectableConfigs = useMemo(
    () => (Array.isArray(configs) ? configs : []),
    [configs]
  );

  const selectedConfig = useMemo(
    () =>
      configs.find((c) => String(c?._id) === String(formData.lotteryConfigId)),
    [configs, formData.lotteryConfigId]
  );

  const availableDates = useMemo(() => {
    if (!selectedConfig) return [];
    const dateStr = toDateOnlyString(selectedConfig.drawDate);
    if (!dateStr) return [];
    return [{ _id: selectedConfig._id, date: dateStr }];
  }, [selectedConfig]);

  useEffect(() => {
    if (!selectedConfig) return;
    const dateStr = toDateOnlyString(selectedConfig.drawDate);
    if (dateStr && dateStr !== formData.date) {
      setFormData((prev) => ({ ...prev, date: dateStr }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConfig]);

  /* ---------------- CONFIG CHANGE ---------------- */
  const handleConfigChange = (e) => {
    const value = e.target.value;
    setFormError("");
    setFormData({
      lotteryConfigId: value,
      date: "",
      winningNumbers: {
        first: "",
        second: [""],
        third: [""],
        fourth: [""],
        fifth: [""],
      },
    });
    dispatch(clearUnbetNumbers());
    setShowUnbet(false);
  };

  /* ---------------- FIRST PRIZE INPUT ---------------- */
  const handleFirstChange = (value) => {
    const cleaned = String(value)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 8);
    setFormData((prev) => ({
      ...prev,
      winningNumbers: { ...prev.winningNumbers, first: cleaned },
    }));
    if (formError) setFormError("");
  };

  /* ---------------- ARRAY INPUT CHANGE ---------------- */
  const handleArrayChange = (prizeKey, index, value) => {
    const cleaned = String(value)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 8);

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
      if (arr.length <= 1) {
        arr[0] = "";
      } else {
        arr.splice(index, 1);
      }
      return {
        ...prev,
        winningNumbers: { ...prev.winningNumbers, [prizeKey]: arr },
      };
    });
  };

  /* ---------------- FETCH UNBET NUMBERS ---------------- */
  const handleFetchUnbet = async () => {
    if (!formData.lotteryConfigId) {
      setFormError("Select a lottery config first.");
      return;
    }
    setShowUnbet(true);
    dispatch(getUnbetNumbers(formData.lotteryConfigId));
  };

  /* ---------------- VALIDATE FORM ---------------- */
  const validateForm = () => {
    if (!formData.lotteryConfigId) return "Please select a lottery config.";
    if (!formData.date) return "Please select a result date.";

    const wn = formData.winningNumbers;

    // 1st prize required
    if (!isValidWinningNumber(wn.first)) {
      return "1st prize number is required (e.g. 12A12345).";
    }

    // Validate each array — filter non-empty
    for (const key of ["second", "third", "fourth", "fifth"]) {
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
    return null;
  };

  /* ---------------- CREATE ---------------- */
  const handleCreate = async (e) => {
    e.preventDefault();

    const err = validateForm();
    if (err) {
      setFormError(err);
      return;
    }
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

    const response = await dispatch(createResult(payload));

    if (createResult.fulfilled.match(response)) {
      setFormData(emptyForm);
      setShowCreate(false);
      setFormError("");
      setShowUnbet(false);
      dispatch(clearUnbetNumbers());
      dispatch(getAllResults());
      dispatch(getAllLotteryConfigs());
    } else if (createResult.rejected.match(response)) {
      setFormError(response.payload?.message || "Failed to create result");
    }
  };

  /* ---------------- PUBLISH / UNPUBLISH / DELETE ---------------- */
  const handlePublish = async (id) => {
    setPublishingIds((p) => [...p, id]);
    try {
      const r = await dispatch(publishResult(id));
      if (publishResult.fulfilled.match(r)) dispatch(getAllResults());
    } finally {
      setPublishingIds((p) => p.filter((x) => x !== id));
    }
  };

  const handleUnpublish = async (id) => {
    setPublishingIds((p) => [...p, id]);
    try {
      const r = await dispatch(unpublishResult(id));
      if (unpublishResult.fulfilled.match(r)) dispatch(getAllResults());
    } finally {
      setPublishingIds((p) => p.filter((x) => x !== id));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this result?")) return;
    setDeletingIds((p) => [...p, id]);
    try {
      const r = await dispatch(deleteResult(id));
      if (deleteResult.fulfilled.match(r)) dispatch(getAllResults());
    } finally {
      setDeletingIds((p) => p.filter((x) => x !== id));
    }
  };

  /* ---------------- FORMATTERS ---------------- */
  const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatConfigLabel = (config) => {
    if (!config) return "-";
    const market = config.marketName || "-";
    const dateStr = toDateOnlyString(config.drawDate) || "-";
    const time = config.drawTime || "-";
    return `${market} - ${dateStr} (${time})`;
  };

  /* ---------------- RENDER ARRAY INPUT GROUP ---------------- */
  const renderArrayGroup = (prizeKey) => {
    const { label, max } = PRIZE_CONFIG[prizeKey];
    const arr = formData.winningNumbers[prizeKey] || [""];
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
            onClick={() => addArrayItem(prizeKey)}
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
                onChange={(e) => handleArrayChange(prizeKey, idx, e.target.value)}
                maxLength={8}
                placeholder={`#${idx + 1}`}
                className={`${INPUT_CLS} !py-2 font-mono font-bold tracking-widest uppercase`}
              />
              {arr.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem(prizeKey, idx)}
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
            Lottery Results
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Manage date-wise lottery results with multiple prize tiers.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              dispatch(getAllResults());
              dispatch(getAllLotteryConfigs());
            }}
            disabled={loading}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition disabled:opacity-50 ${OUTLINE_BTN}`}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={() => {
              setShowCreate((p) => !p);
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

      {/* SUCCESS / ERROR */}
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

      {/* CREATE FORM */}
      {showCreate && (
        <div className={`p-6 ${CARD_CLS}`}>
          <h2 className="mb-2 text-lg font-black text-[#1A1A1A]">
            Create Lottery Result
          </h2>
          <p className="mb-6 text-sm text-[#6B7280]">
            1st prize = 1 exact 8-digit number. 2nd = 10 numbers (last 5 digits).
            3rd/4th = 10 numbers (last 4 digits). 5th = 100 numbers (last 4 digits).
          </p>

          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* CONFIG */}
            <div>
              <label className={LABEL_CLS}>Lottery Config</label>
              <select
                name="lotteryConfigId"
                value={formData.lotteryConfigId}
                onChange={handleConfigChange}
                disabled={configLoading}
                className={INPUT_CLS}
              >
                <option value="">
                  {configLoading ? "Loading configs..." : "Select Lottery Config"}
                </option>
                {selectableConfigs.map((c) => (
                  <option key={c._id} value={c._id}>
                    {formatConfigLabel(c)}
                    {c.isActive ? " ✅" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* DATE */}
            <div>
              <label className={LABEL_CLS}>Result Date</label>
              <select
                name="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, date: e.target.value }))
                }
                disabled={!selectedConfig}
                className={INPUT_CLS}
              >
                <option value="">
                  {!selectedConfig ? "Select config first" : "Select Date"}
                </option>
                {availableDates.map((d, i) => (
                  <option key={d._id || i} value={d.date}>
                    {formatDate(d.date)}
                  </option>
                ))}
              </select>
            </div>

            {/* UNBET BUTTON */}
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

            {/* UNBET NUMBERS PANEL */}
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
                        dispatch(clearUnbetNumbers());
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
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
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

            {/* 1ST PRIZE — SINGLE INPUT */}
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
                className={`${INPUT_CLS} font-mono font-bold tracking-widest uppercase`}
              />
              <p className="mt-2 flex items-start gap-1.5 text-xs text-[#6B7280]">
                <Info size={12} className="mt-0.5 shrink-0" />
                <span>{NUMBER_FORMAT_HINT}</span>
              </p>
            </div>

            {/* 2ND–5TH PRIZE ARRAYS */}
            {renderArrayGroup("second")}
            {renderArrayGroup("third")}
            {renderArrayGroup("fourth")}
            {renderArrayGroup("fifth")}

            {/* SELECTED CONFIG INFO */}
            {selectedConfig && (
              <div className="md:col-span-3">
                <div className="rounded-xl border border-[#F3E7C4] bg-[#FFF9E3] p-4">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                    <div>
                      <p className="text-xs font-semibold text-[#8A8F98]">Market</p>
                      <p className="mt-1 font-bold text-[#1A1A1A]">
                        {selectedConfig.marketName || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#8A8F98]">Draw Date</p>
                      <p className="mt-1 font-bold text-[#1A1A1A]">
                        {formatDate(selectedConfig.drawDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#8A8F98]">Draw Time</p>
                      <p className="mt-1 font-bold text-[#1A1A1A]">
                        {selectedConfig.drawTime || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#8A8F98]">Month</p>
                      <p className="mt-1 font-bold text-[#1A1A1A]">
                        {selectedConfig.month || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#8A8F98]">Year</p>
                      <p className="mt-1 font-bold text-[#1A1A1A]">
                        {selectedConfig.year || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FORM ERROR */}
            {formError && (
              <div className="md:col-span-3">
                <div className="rounded-xl border border-[#D93025]/30 bg-[#FDE8E6] px-4 py-3 text-sm font-medium text-[#B3261E]">
                  {formError}
                </div>
              </div>
            )}

            {/* SUBMIT */}
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
        <div className="border-b border-[#F3E7C4] px-6 py-4">
          <h2 className="font-black text-[#1A1A1A]">All Results</h2>
          <p className="mt-1 text-xs text-[#6B7280]">
            {results?.length || 0} result(s)
          </p>
        </div>

        {loading ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-[#FFEFA8] border-t-[#F7B500]" />
            <p className="text-sm text-[#6B7280]">Loading results...</p>
          </div>
        ) : results?.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#FFEFA8] text-[#1A1204] ring-2 ring-[#F2B705]">
              <ClipboardList size={24} />
            </div>
            <h3 className="font-bold text-[#1A1A1A]">No Results Found</h3>
            <p className="mt-1 text-sm text-[#6B7280]">
              Create your first lottery result.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-[#FFF9E3]">
                <tr>
                  <th className={TH_CLS}>#</th>
                  <th className={TH_CLS}>Market</th>
                  <th className={TH_CLS}>Draw Date</th>
                  <th className={TH_CLS}>Result Date</th>
                  <th className={TH_CLS}>Winning Numbers</th>
                  <th className={TH_CLS}>Status</th>
                  <th className={TH_CLS}>Created</th>
                  <th className={`${TH_CLS} !text-right`}>Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F3E7C4]">
                {results.map((item, index) => {
                  const published = item?.isPublished === true;
                  const config = item?.lotteryConfigId;
                  const isPublishing = publishingIds.includes(item._id);
                  const isDeleting = deletingIds.includes(item._id);

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

                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="font-semibold text-[#1A1A1A]">
                          {config?.marketName || item?.marketName || "-"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-[#1A1A1A]">
                        {formatDate(config?.drawDate)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-[#1A1A1A]">
                        {formatDate(item?.date)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-2 min-w-[240px]">
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

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-[#6B7280]">
                        {formatDate(item?.createdAt)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex justify-end gap-2">
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
    </div>
  );
};

export default Results;