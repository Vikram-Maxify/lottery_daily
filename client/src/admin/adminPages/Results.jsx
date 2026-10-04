import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ClipboardList, RefreshCw, Plus, X, Info } from "lucide-react";

import {
  getAllResults,
  createResult,
  publishResult,
  unpublishResult,
  deleteResult,
  clearResultMessage,
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
// Example: 12A12345
// =====================================================
const WINNING_NUMBER_REGEX = /^[0-9]{2}[A-Z][0-9]{5}$/;

const isValidWinningNumber = (value) => {
  const v = String(value || "").trim().toUpperCase();
  return WINNING_NUMBER_REGEX.test(v);
};

const NUMBER_FORMAT_HINT =
  "8 characters — 2 digits, 1 letter (A-Z), 5 digits. Example: 12A12345";

// =====================================================
// SAFE DATE-ONLY STRING (YYYY-MM-DD)
// =====================================================
const toDateOnlyString = (value) => {
  if (!value) return "";

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  // ✅ UTC use karo (backend bhi UTC use karta hai)
  // Isse timezone ka 1-din difference nahi hoga
  return d.toISOString().split("T")[0];
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
  } = useSelector((state) => state.lotteryResult);

  const { configs = [], loading: configLoading } = useSelector(
    (state) => state.lotteryConfig
  );

  const [showCreate, setShowCreate] = useState(false);

  const [formData, setFormData] = useState({
    lotteryConfigId: "",
    date: "",
    winningNumber: "",
  });

  const [formError, setFormError] = useState("");

  const [publishingIds, setPublishingIds] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);

  useEffect(() => {
    dispatch(getAllResults());
    dispatch(getAllLotteryConfigs());
  }, [dispatch]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        dispatch(clearResultMessage());
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [success, error, dispatch]);

  // ALL CONFIGS (active filter hata diya)
  const selectableConfigs = useMemo(() => {
    return Array.isArray(configs) ? configs : [];
  }, [configs]);

  const selectedConfig = useMemo(() => {
    return configs.find(
      (config) =>
        String(config?._id) === String(formData.lotteryConfigId)
    );
  }, [configs, formData.lotteryConfigId]);

  const availableDates = useMemo(() => {
    if (!selectedConfig) return [];

    const dateStr = toDateOnlyString(selectedConfig.drawDate);
    if (!dateStr) return [];

    return [
      {
        _id: selectedConfig._id,
        date: dateStr,
      },
    ];
  }, [selectedConfig]);

  useEffect(() => {
    if (!selectedConfig) return;

    const dateStr = toDateOnlyString(selectedConfig.drawDate);

    if (dateStr && dateStr !== formData.date) {
      setFormData((prev) => ({ ...prev, date: dateStr }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConfig]);

  /* ---------------- INPUT CHANGE ---------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (formError) setFormError("");

    if (name === "lotteryConfigId") {
      setFormData({
        lotteryConfigId: value,
        date: "",
        winningNumber: "",
      });
      return;
    }

    if (name === "winningNumber") {
      // Uppercase, alphanumeric only, max 8 chars
      const cleaned = String(value)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 8);

      setFormData((prev) => ({ ...prev, winningNumber: cleaned }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* ---------------- CREATE RESULT ---------------- */
  const handleCreate = async (e) => {
    e.preventDefault();

    if (!formData.lotteryConfigId) {
      setFormError("Please select a lottery config.");
      return;
    }

    if (!formData.date) {
      setFormError("Please select a result date.");
      return;
    }

    if (!isValidWinningNumber(formData.winningNumber)) {
      setFormError(
        "Invalid winning number. Format must be: 2 digits + 1 letter + 5 digits (e.g. 12A12345)."
      );
      return;
    }

    setFormError("");

    const payload = {
      lotteryConfigId: formData.lotteryConfigId,
      date: formData.date,
      winningNumber: formData.winningNumber.toUpperCase(),
    };

    const response = await dispatch(createResult(payload));

    if (createResult.fulfilled.match(response)) {
      setFormData({
        lotteryConfigId: "",
        date: "",
        winningNumber: "",
      });
      setShowCreate(false);
      setFormError("");

      dispatch(getAllResults());
      dispatch(getAllLotteryConfigs());
    } else if (createResult.rejected.match(response)) {
      const backendError =
        response.payload?.message || "Failed to create result";
      setFormError(backendError);
    }
  };

  /* ---------------- PUBLISH ---------------- */
  const handlePublish = async (id) => {
    setPublishingIds((prev) => [...prev, id]);
    try {
      const response = await dispatch(publishResult(id));
      if (publishResult.fulfilled.match(response)) {
        dispatch(getAllResults());
      }
    } finally {
      setPublishingIds((prev) => prev.filter((x) => x !== id));
    }
  };

  /* ---------------- UNPUBLISH ---------------- */
  const handleUnpublish = async (id) => {
    setPublishingIds((prev) => [...prev, id]);
    try {
      const response = await dispatch(unpublishResult(id));
      if (unpublishResult.fulfilled.match(response)) {
        dispatch(getAllResults());
      }
    } finally {
      setPublishingIds((prev) => prev.filter((x) => x !== id));
    }
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this result?"
    );
    if (!confirmed) return;

    setDeletingIds((prev) => [...prev, id]);
    try {
      const response = await dispatch(deleteResult(id));
      if (deleteResult.fulfilled.match(response)) {
        dispatch(getAllResults());
      }
    } finally {
      setDeletingIds((prev) => prev.filter((x) => x !== id));
    }
  };

  /* ---------------- FORMATTERS ---------------- */
  const formatDate = (date) => {
    if (!date) return "-";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "-";

    return parsedDate.toLocaleDateString("en-IN", {
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
            Manage date-wise lottery results.
          </p>
        </div>

        <div className="flex gap-3">
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
              setShowCreate((prev) => !prev);
              setFormError("");
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition ${GOLD_BTN}`}
          >
            {showCreate ? (
              <>
                <X size={16} strokeWidth={2.8} />
                Close
              </>
            ) : (
              <>
                <Plus size={16} strokeWidth={2.8} />
                Create Result
              </>
            )}
          </button>
        </div>
      </div>

      {/* SUCCESS */}
      {success && message && (
        <div className="rounded-xl border border-[#12A36B]/30 bg-[#E6F6EF] px-4 py-3 text-sm font-medium text-[#0E7A52]">
          {message}
        </div>
      )}

      {/* ERROR */}
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
            Select the lottery config, then enter the 8-character winning
            number.
          </p>

          <form
            onSubmit={handleCreate}
            className="grid grid-cols-1 gap-5 md:grid-cols-3"
          >
            {/* CONFIG */}
            <div>
              <label htmlFor="lotteryConfigId" className={LABEL_CLS}>
                Lottery Config
              </label>

              <select
                id="lotteryConfigId"
                name="lotteryConfigId"
                value={formData.lotteryConfigId}
                onChange={handleChange}
                disabled={configLoading}
                className={INPUT_CLS}
              >
                <option value="">
                  {configLoading
                    ? "Loading configs..."
                    : "Select Lottery Config"}
                </option>

                {selectableConfigs.map((config) => (
                  <option key={config._id} value={config._id}>
                    {formatConfigLabel(config)}
                    {config.isActive ? " ✅" : ""}
                  </option>
                ))}
              </select>

              {selectableConfigs.length === 0 && !configLoading && (
                <p className="mt-2 text-xs font-medium text-[#D93025]">
                  No lottery config found. Please create one first.
                </p>
              )}
            </div>

            {/* DATE */}
            <div>
              <label htmlFor="date" className={LABEL_CLS}>
                Result Date
              </label>

              <select
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                disabled={!selectedConfig}
                className={INPUT_CLS}
              >
                <option value="">
                  {!selectedConfig
                    ? "Select config first"
                    : "Select Date"}
                </option>

                {availableDates.map((dateItem, index) => {
                  const dateValue = dateItem?.date;
                  return (
                    <option
                      key={dateItem?._id || `${dateValue}-${index}`}
                      value={dateValue}
                    >
                      {formatDate(dateValue)}
                    </option>
                  );
                })}
              </select>

              {selectedConfig && (
                <p className="mt-2 text-xs text-[#6B7280]">
                  {availableDates.length} date(s) available in this config.
                </p>
              )}

              {selectedConfig && availableDates.length === 0 && (
                <p className="mt-2 text-xs font-medium text-[#D93025]">
                  No dates available for this config.
                </p>
              )}
            </div>

            {/* WINNING NUMBER */}
            <div>
              <label htmlFor="winningNumber" className={LABEL_CLS}>
                Winning Number
              </label>

              <input
                id="winningNumber"
                type="text"
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
                name="winningNumber"
                value={formData.winningNumber}
                onChange={handleChange}
                maxLength={8}
                placeholder="e.g. 12A12345"
                className={`${INPUT_CLS} font-mono font-bold tracking-widest uppercase`}
              />

              <p className="mt-2 flex items-start gap-1.5 text-xs text-[#6B7280]">
                <Info size={12} className="mt-0.5 shrink-0" />
                <span>{NUMBER_FORMAT_HINT}</span>
              </p>

              <p className="mt-1 text-xs text-[#6B7280]">
                {formData.winningNumber.length}/8 characters
              </p>
            </div>

            {/* SELECTED CONFIG INFO */}
            {selectedConfig && (
              <div className="md:col-span-3">
                <div className="rounded-xl border border-[#F3E7C4] bg-[#FFF9E3] p-4">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                    <div>
                      <p className="text-xs font-semibold text-[#8A8F98]">
                        Market
                      </p>
                      <p className="mt-1 font-bold text-[#1A1A1A]">
                        {selectedConfig.marketName || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-[#8A8F98]">
                        Draw Date
                      </p>
                      <p className="mt-1 font-bold text-[#1A1A1A]">
                        {formatDate(selectedConfig.drawDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-[#8A8F98]">
                        Draw Time
                      </p>
                      <p className="mt-1 font-bold text-[#1A1A1A]">
                        {selectedConfig.drawTime || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-[#8A8F98]">
                        Month
                      </p>
                      <p className="mt-1 font-bold text-[#1A1A1A]">
                        {selectedConfig.month || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-[#8A8F98]">
                        Year
                      </p>
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-black text-[#1A1A1A]">All Results</h2>
              <p className="mt-1 text-xs text-[#6B7280]">
                {results?.length || 0} result(s)
              </p>
            </div>
          </div>
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
            <table className="w-full min-w-[1000px]">
              <thead className="bg-[#FFF9E3]">
                <tr>
                  <th className={TH_CLS}>#</th>
                  <th className={TH_CLS}>Market</th>
                  <th className={TH_CLS}>Draw Date</th>
                  <th className={TH_CLS}>Draw Time</th>
                  <th className={TH_CLS}>Result Date</th>
                  <th className={TH_CLS}>Winning Number</th>
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

                  return (
                    <tr
                      key={item?._id || index}
                      className="transition hover:bg-[#FFFDF7]"
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

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-[#1A1A1A]">
                        {config?.drawTime || "-"}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-[#1A1A1A]">
                        {formatDate(item?.date)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="rounded-full bg-[#FFEFA8] px-3.5 py-1.5 font-mono text-sm font-black tracking-widest text-[#1A1204] ring-1 ring-[#F2B705]/60">
                          {item?.winningNumber || "-"}
                        </span>
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