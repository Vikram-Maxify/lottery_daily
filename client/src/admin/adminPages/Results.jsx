import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  getAllResults,
  createResult,
  publishResult,
  unpublishResult,
  deleteResult,
  clearResultMessage,
} from "../../reducer/slice/lotteryResultReducer";

import { getAllLotteryConfigs } from "../../reducer/slice/lotteryConfigSlice";

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

  return (
    `${d.getFullYear()}-` +
    `${String(d.getMonth() + 1).padStart(2, "0")}-` +
    `${String(d.getDate()).padStart(2, "0")}`
  );
};

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
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error, dispatch]);

  // =====================================================
  // ACTIVE CONFIGS
  // =====================================================

  const activeConfigs = useMemo(() => {
    return configs.filter((config) => config?.isActive === true);
  }, [configs]);

  // =====================================================
  // SELECTED CONFIG
  // =====================================================

  const selectedConfig = useMemo(() => {
    return configs.find(
      (config) =>
        String(config?._id) === String(formData.lotteryConfigId)
    );
  }, [configs, formData.lotteryConfigId]);

  // =====================================================
  // AVAILABLE DATES
  //
  // Har config mein `drawDate` (Date) hota hai
  // → seedha usi ko YYYY-MM-DD mein convert karo
  // =====================================================

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

  // =====================================================
  // AUTO-SELECT DATE JAB CONFIG CHANGE HO
  // =====================================================

  useEffect(() => {
    if (!selectedConfig) return;

    const dateStr = toDateOnlyString(selectedConfig.drawDate);

    if (dateStr && dateStr !== formData.date) {
      setFormData((prev) => ({
        ...prev,
        date: dateStr,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConfig]);

  // =====================================================
  // INPUT CHANGE
  // =====================================================

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
      const onlyNumbers = value.replace(/\D/g, "").slice(0, 6);
      setFormData((prev) => ({
        ...prev,
        winningNumber: onlyNumbers,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // CREATE RESULT
  // =====================================================

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

    if (!/^\d{6}$/.test(formData.winningNumber)) {
      setFormError("Winning number must be exactly 6 digits.");
      return;
    }

    setFormError("");

    const payload = {
      lotteryConfigId: formData.lotteryConfigId,
      date: formData.date,
      winningNumber: formData.winningNumber,
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
    }
  };

  // =====================================================
  // PUBLISH
  // =====================================================

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

  // =====================================================
  // UNPUBLISH
  // =====================================================

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

  // =====================================================
  // DELETE
  // =====================================================

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

  // =====================================================
  // FORMAT DATE
  // =====================================================

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

  // =====================================================
  // FORMAT MONTH / YEAR
  // =====================================================

  const formatMonthYear = (config) => {
    if (!config) return "-";

    const month = config.month ?? null;
    const year = config.year ?? null;

    if (month == null && year == null) return "-";
    if (month == null) return String(year);
    if (year == null) return String(month);

    return `${month}/${year}`;
  };

  // =====================================================
  // FORMAT CONFIG LABEL (dropdown mein dikhane ke liye)
  // Ab `drawDate` + `drawTime` bhi dikhayenge
  // =====================================================

  const formatConfigLabel = (config) => {
    if (!config) return "-";

    const market = config.marketName || "-";
    const dateStr = toDateOnlyString(config.drawDate) || "-";
    const time = config.drawTime || "-";

    return `${market} - ${dateStr} (${time})`;
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Lottery Results
          </h1>
          <p className="mt-1 text-sm text-slate-500">
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
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={() => {
              setShowCreate((prev) => !prev);
              setFormError("");
            }}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {showCreate ? "Close" : "+ Create Result"}
          </button>
        </div>
      </div>

      {/* SUCCESS */}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {message}
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* CREATE FORM */}
      {showCreate && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">
            Create Lottery Result
          </h2>
          <p className="mb-6 text-sm text-slate-500">
            Select the date-wise lottery config, then enter the 6 digit
            winning number.
          </p>

          <form
            onSubmit={handleCreate}
            className="grid grid-cols-1 gap-5 md:grid-cols-3"
          >
            {/* CONFIG */}
            <div>
              <label
                htmlFor="lotteryConfigId"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Lottery Config (Date-wise)
              </label>

              <select
                id="lotteryConfigId"
                name="lotteryConfigId"
                value={formData.lotteryConfigId}
                onChange={handleChange}
                disabled={configLoading}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
              >
                <option value="">
                  {configLoading
                    ? "Loading configs..."
                    : "Select Lottery Config"}
                </option>

                {activeConfigs.map((config) => (
                  <option key={config._id} value={config._id}>
                    {formatConfigLabel(config)}
                  </option>
                ))}
              </select>

              {activeConfigs.length === 0 && !configLoading && (
                <p className="mt-2 text-xs text-red-500">
                  No active lottery config found.
                </p>
              )}
            </div>

            {/* DATE */}
            <div>
              <label
                htmlFor="date"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Result Date
              </label>

              <select
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                disabled={!selectedConfig}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-100"
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
                <p className="mt-2 text-xs text-slate-500">
                  {availableDates.length} date(s) available in this config.
                </p>
              )}

              {selectedConfig && availableDates.length === 0 && (
                <p className="mt-2 text-xs text-red-500">
                  No dates available for this config.
                </p>
              )}
            </div>

            {/* WINNING NUMBER */}
            <div>
              <label
                htmlFor="winningNumber"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Winning Number
              </label>

              <input
                id="winningNumber"
                type="text"
                inputMode="numeric"
                name="winningNumber"
                value={formData.winningNumber}
                onChange={handleChange}
                maxLength={6}
                placeholder="Enter 6 digit number"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 font-mono text-sm tracking-widest outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                {formData.winningNumber.length}/6 digits
              </p>
            </div>

            {/* SELECTED CONFIG INFO */}
            {selectedConfig && (
              <div className="md:col-span-3">
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                    <div>
                      <p className="text-xs text-slate-500">Market</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {selectedConfig.marketName || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Draw Date</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {formatDate(selectedConfig.drawDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Draw Time</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {selectedConfig.drawTime || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Month</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {selectedConfig.month || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Year</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {selectedConfig.year || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VALIDATION ERROR */}
            {formError && (
              <div className="md:col-span-3">
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {formError}
                </div>
              </div>
            )}

            {/* SUBMIT */}
            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={createLoading}
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {createLoading ? "Creating..." : "Create Result"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RESULTS TABLE */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">All Results</h2>
              <p className="mt-1 text-xs text-slate-500">
                {results?.length || 0} result(s)
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
            <p className="text-sm text-slate-500">Loading results...</p>
          </div>
        ) : results?.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mb-3 text-4xl">📋</div>
            <h3 className="font-semibold text-slate-900">
              No Results Found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Create your first lottery result.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Market
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Draw Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Draw Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Result Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Winning Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Created
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {results.map((item, index) => {
                  const published = item?.isPublished === true;
                  const config = item?.lotteryConfigId;

                  const isPublishing = publishingIds.includes(item._id);
                  const isDeleting = deletingIds.includes(item._id);

                  return (
                    <tr
                      key={item?._id || index}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                        {index + 1}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="font-semibold text-slate-900">
                          {config?.marketName || item?.marketName || "-"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                        {formatDate(config?.drawDate)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                        {config?.drawTime || "-"}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                        {formatDate(item?.date)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-sm font-bold tracking-widest text-slate-900">
                          {item?.winningNumber || "-"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        {published ? (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            Published
                          </span>
                        ) : (
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                            Unpublished
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                        {formatDate(item?.createdAt)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex justify-end gap-2">
                          {published ? (
                            <button
                              type="button"
                              onClick={() => handleUnpublish(item._id)}
                              disabled={isPublishing}
                              className="rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs font-semibold text-yellow-700 hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isPublishing ? "..." : "Unpublish"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handlePublish(item._id)}
                              disabled={isPublishing}
                              className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
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
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
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