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
  Trophy,
  CheckCircle2,
  XCircle,
  Settings2,
} from "lucide-react";

import {
  createLotteryConfig,
  updateLotteryConfig,
  getAllLotteryConfigs,
  getLotteryConfigById,
  activateLotteryConfig,
  deactivateLotteryConfig,
  deleteLotteryConfig,
} from "../../reducer/slice/adminLotteryReducer";

// =====================================================
// HELPERS
// =====================================================

const getToday = () => {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
};

const parseLocalDate = (dateString) => {
  if (!dateString) return null;

  const value = String(dateString).slice(0, 10);

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

const formatDate = (date) => {
  const parsed = parseLocalDate(date);

  if (!parsed) return "-";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getMonthYearFromDate = (date) => {
  const parsed = parseLocalDate(date);

  if (!parsed) {
    return {
      month: "-",
      year: "-",
    };
  }

  return {
    month: parsed.getMonth() + 1,
    year: parsed.getFullYear(),
  };
};

const getDefaultForm = () => ({
  marketName: "",
  drawDate: getToday(),
  drawTime: "18:30",
  firstPrize: "",
  secondPrize: "",
  thirdPrize: "",
});

const getErrorMessage = (
  error,
  fallback = "Something went wrong."
) => {
  if (!error) return fallback;

  if (typeof error === "string") {
    return error;
  }

  if (
    error?.message &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  if (
    error?.error &&
    typeof error.error === "string"
  ) {
    return error.error;
  }

  if (
    error?.data?.message &&
    typeof error.data.message === "string"
  ) {
    return error.data.message;
  }

  if (
    error?.data?.error &&
    typeof error.data.error === "string"
  ) {
    return error.data.error;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  return fallback;
};

const getConfigFromResponse = (result) => {
  if (!result) return null;

  if (
    result?._id ||
    result?.id ||
    result?.marketName
  ) {
    return result;
  }

  if (result?.data) {
    if (Array.isArray(result.data)) {
      return result.data[0] || null;
    }

    if (
      result.data?._id ||
      result.data?.id ||
      result.data?.marketName
    ) {
      return result.data;
    }

    if (result.data?.data) {
      if (Array.isArray(result.data.data)) {
        return result.data.data[0] || null;
      }

      return result.data.data;
    }
  }

  if (result?.config) {
    return result.config;
  }

  if (result?.lottery) {
    return result.lottery;
  }

  return null;
};

const getConfigId = (lottery) => {
  return lottery?._id || lottery?.id || null;
};

// =====================================================
// COMPONENT
// =====================================================

const AdminFestivalLottery = () => {
  const dispatch = useDispatch();

  // ===================================================
  // REDUX STATE
  // ===================================================

  const {
    lotteries = [],
    lottery = null,

    loading = false,
    createLoading = false,
    updateLoading = false,
    deleteLoading = false,
    actionLoading = false,

    error = null,
    success = false,
    message = "",
  } = useSelector(
    (state) => state.festivalLottery || {}
  );

  // ===================================================
  // LOCAL STATE
  // ===================================================

  const [formData, setFormData] = useState(
    getDefaultForm()
  );

  const [validationError, setValidationError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [editingId, setEditingId] =
    useState(null);

  const [deleteModal, setDeleteModal] =
    useState(false);

  const [deleteId, setDeleteId] =
    useState(null);

  const [actionId, setActionId] =
    useState(null);

  // ===================================================
  // NORMALIZED LOTTERIES
  // ===================================================

  const allLotteries = useMemo(() => {
    return Array.isArray(lotteries)
      ? lotteries
      : [];
  }, [lotteries]);

  // ===================================================
  // COUNTS
  // ===================================================

  const activeCount = useMemo(() => {
    return allLotteries.filter(
      (item) => Boolean(item?.isActive)
    ).length;
  }, [allLotteries]);

  const inactiveCount = useMemo(() => {
    return allLotteries.filter(
      (item) => !item?.isActive
    ).length;
  }, [allLotteries]);

  // ===================================================
  // FORM BUSY
  // ===================================================

  const isFormBusy =
    createLoading ||
    updateLoading ||
    (loading && editingId);

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    dispatch(getAllLotteryConfigs());
  }, [dispatch]);

  // ===================================================
  // REDUX ERROR
  // ===================================================

  useEffect(() => {
    if (!error) return;

    setValidationError(
      getErrorMessage(
        error,
        "Something went wrong."
      )
    );
  }, [error]);

  // ===================================================
  // REDUX SUCCESS MESSAGE
  // ===================================================

  useEffect(() => {
    if (!message) return;

    setSuccessMessage(message);
  }, [message]);

  // ===================================================
  // FORM CHANGE
  // ===================================================

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setValidationError("");
    setSuccessMessage("");

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ===================================================
  // VALIDATION
  // ===================================================

  const validateForm = () => {
    const marketName =
      formData.marketName.trim();

    if (!marketName) {
      return "Market name is required.";
    }

    if (marketName.length > 100) {
      return "Market name cannot exceed 100 characters.";
    }

    if (!formData.drawDate) {
      return "Draw date is required.";
    }

    const selectedDate =
      parseLocalDate(formData.drawDate);

    if (!selectedDate) {
      return "Invalid draw date.";
    }

    const today =
      parseLocalDate(getToday());

    if (!today) {
      return "Unable to validate today's date.";
    }

    if (selectedDate < today) {
      return "Past draw date cannot be selected.";
    }

    if (!formData.drawTime) {
      return "Draw time is required.";
    }

    const timePattern =
      /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (
      !timePattern.test(
        formData.drawTime
      )
    ) {
      return "Invalid draw time.";
    }

    const prizes = [
      ["First", formData.firstPrize],
      ["Second", formData.secondPrize],
      ["Third", formData.thirdPrize],
    ];

    for (const [label, value] of prizes) {
      if (
        value === "" ||
        value === null ||
        value === undefined
      ) {
        return `${label} prize is required.`;
      }

      const amount = Number(value);

      if (
        !Number.isFinite(amount) ||
        amount < 0
      ) {
        return `Invalid ${label.toLowerCase()} prize.`;
      }

      if (!Number.isInteger(amount)) {
        return `${label} prize must be a whole number.`;
      }
    }

    return "";
  };

  // ===================================================
  // RESET FORM
  // ===================================================

  const resetForm = () => {
    setFormData(getDefaultForm());
    setEditingId(null);
  };

  // ===================================================
  // SUBMIT
  // ===================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isFormBusy) return;

    setValidationError("");
    setSuccessMessage("");

    const validation =
      validateForm();

    if (validation) {
      setValidationError(validation);
      return;
    }

    const selectedDate =
      parseLocalDate(formData.drawDate);

    if (!selectedDate) {
      setValidationError(
        "Invalid draw date."
      );
      return;
    }

    const payload = {
      marketName:
        formData.marketName.trim(),

      month:
        selectedDate.getMonth() + 1,

      year:
        selectedDate.getFullYear(),

      drawDate:
        formData.drawDate,

      drawTime:
        formData.drawTime,

      prizes: {
        first:
          Number(formData.firstPrize),

        second:
          Number(formData.secondPrize),

        third:
          Number(formData.thirdPrize),
      },
    };

    const currentEditingId =
      editingId;

    try {
      if (currentEditingId) {
        await dispatch(
          updateLotteryConfig({
            id: currentEditingId,
            lotteryData: payload,
          })
        ).unwrap();

        setSuccessMessage(
          "Festival lottery updated successfully."
        );
      } else {
        await dispatch(
          createLotteryConfig(payload)
        ).unwrap();

        setSuccessMessage(
          "Festival lottery created successfully."
        );
      }

      // Always get latest data from backend.
      await dispatch(
        getAllLotteryConfigs()
      ).unwrap();

      resetForm();
    } catch (err) {
      setValidationError(
        getErrorMessage(
          err,
          currentEditingId
            ? "Failed to update festival lottery."
            : "Failed to create festival lottery."
        )
      );
    }
  };

  // ===================================================
  // EDIT
  // ===================================================

  const handleEdit = async (lotteryItem) => {
    if (
      loading ||
      createLoading ||
      updateLoading ||
      actionLoading ||
      deleteLoading
    ) {
      return;
    }

    const id =
      getConfigId(lotteryItem);

    if (!id) {
      setValidationError(
        "Lottery configuration ID is missing."
      );
      return;
    }

    setValidationError("");
    setSuccessMessage("");
    setActionId(id);

    try {
      const result =
        await dispatch(
          getLotteryConfigById(id)
        ).unwrap();

      const config =
        getConfigFromResponse(result) ||
        lotteryItem;

      const configDate =
        config?.drawDate
          ? String(
              config.drawDate
            ).slice(0, 10)
          : getToday();

      const parsedDate =
        parseLocalDate(configDate);

      const drawDate = parsedDate
        ? [
            parsedDate.getFullYear(),
            String(
              parsedDate.getMonth() + 1
            ).padStart(2, "0"),
            String(
              parsedDate.getDate()
            ).padStart(2, "0"),
          ].join("-")
        : getToday();

      setEditingId(
        config?._id ||
          config?.id ||
          id
      );

      setFormData({
        marketName:
          config?.marketName || "",

        drawDate,

        drawTime:
          config?.drawTime ||
          "18:30",

        firstPrize: String(
          config?.prizes?.first ??
            ""
        ),

        secondPrize: String(
          config?.prizes?.second ??
            ""
        ),

        thirdPrize: String(
          config?.prizes?.third ??
            ""
        ),
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      setValidationError(
        getErrorMessage(
          err,
          "Failed to load lottery configuration."
        )
      );
    } finally {
      setActionId(null);
    }
  };

  // ===================================================
  // CANCEL EDIT
  // ===================================================

  const handleCancelEdit = () => {
    resetForm();

    setValidationError("");
    setSuccessMessage("");
  };

  // ===================================================
  // ACTIVATE / DEACTIVATE
  // ===================================================

  const handleToggleStatus = async (
    lotteryItem
  ) => {
    if (
      actionLoading ||
      loading ||
      deleteLoading
    ) {
      return;
    }

    const id =
      getConfigId(lotteryItem);

    if (!id) {
      setValidationError(
        "Lottery configuration ID is missing."
      );
      return;
    }

    setValidationError("");
    setSuccessMessage("");
    setActionId(id);

    const currentlyActive =
      Boolean(
        lotteryItem?.isActive
      );

    try {
      if (currentlyActive) {
        await dispatch(
          deactivateLotteryConfig(id)
        ).unwrap();

        setSuccessMessage(
          "Festival lottery deactivated successfully."
        );
      } else {
        await dispatch(
          activateLotteryConfig(id)
        ).unwrap();

        setSuccessMessage(
          "Festival lottery activated successfully."
        );
      }

      await dispatch(
        getAllLotteryConfigs()
      ).unwrap();
    } catch (err) {
      setValidationError(
        getErrorMessage(
          err,
          "Failed to update lottery status."
        )
      );
    } finally {
      setActionId(null);
    }
  };

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh = async () => {
    if (loading) return;

    setValidationError("");
    setSuccessMessage("");

    try {
      await dispatch(
        getAllLotteryConfigs()
      ).unwrap();

      setSuccessMessage(
        "Festival lottery list refreshed successfully."
      );
    } catch (err) {
      setValidationError(
        getErrorMessage(
          err,
          "Failed to refresh festival lotteries."
        )
      );
    }
  };

  // ===================================================
  // DELETE MODAL
  // ===================================================

  const handleOpenDelete = (id) => {
    if (!id) {
      setValidationError(
        "Lottery configuration ID is missing."
      );
      return;
    }

    if (
      deleteLoading ||
      actionLoading
    ) {
      return;
    }

    setValidationError("");
    setSuccessMessage("");

    setDeleteId(id);
    setDeleteModal(true);
  };

  const handleCloseDelete = () => {
    if (deleteLoading) return;

    setDeleteId(null);
    setDeleteModal(false);
  };

  // ===================================================
  // DELETE
  // ===================================================

  const handleDelete = async () => {
    if (
      !deleteId ||
      deleteLoading
    ) {
      return;
    }

    const currentDeleteId =
      deleteId;

    setValidationError("");
    setSuccessMessage("");

    try {
      await dispatch(
        deleteLotteryConfig(
          currentDeleteId
        )
      ).unwrap();

      await dispatch(
        getAllLotteryConfigs()
      ).unwrap();

      if (
        editingId ===
        currentDeleteId
      ) {
        resetForm();
      }

      setDeleteId(null);
      setDeleteModal(false);

      setSuccessMessage(
        "Festival lottery deleted successfully."
      );
    } catch (err) {
      setValidationError(
        getErrorMessage(
          err,
          "Failed to delete festival lottery."
        )
      );
    }
  };

  // ===================================================
  // RESET
  // ===================================================

  const handleReset = () => {
    if (isFormBusy) return;

    resetForm();

    setValidationError("");
    setSuccessMessage("");
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Ticket size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Festival Lottery
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Create and manage festival lottery draws and prize settings.
              </p>
            </div>

          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />

          {loading
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {/* =================================================
          SUCCESS
      ================================================= */}

      {successMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          <CheckCircle2 size={17} />

          <span>
            {successMessage}
          </span>
        </div>
      )}

      {/* =================================================
          ERROR
      ================================================= */}

      {validationError && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">

          <div className="flex items-center gap-2">
            <XCircle size={17} />

            <span>
              {validationError}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              setValidationError("")
            }
            className="text-lg font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* =================================================
          CREATE / EDIT FORM
      ================================================= */}

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

        <div className="mb-6 flex flex-col gap-3 border-b border-gray-100 pb-5 md:flex-row md:items-center md:justify-between">

          <div>
            <div className="flex items-center gap-2">

              <Settings2
                size={19}
                className="text-blue-600"
              />

              <h2 className="text-lg font-semibold text-gray-900">
                {editingId
                  ? "Festival Lottery Details"
                  : "Create Festival Lottery"}
              </h2>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Configure only the fields currently supported by the Festival backend.
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={
                handleCancelEdit
              }
              disabled={isFormBusy}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={16} />
              Cancel
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>

          {/* =================================================
              DRAW INFORMATION
          ================================================= */}

          <div className="mb-7">

            <div className="mb-4 flex items-center gap-2">
              <CalendarDays
                size={18}
                className="text-blue-600"
              />

              <h3 className="text-sm font-semibold text-gray-900">
                Draw Information
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

              {/* MARKET */}

              <div className="lg:col-span-2">

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Market Name
                </label>

                <input
                  type="text"
                  name="marketName"
                  value={
                    formData.marketName
                  }
                  onChange={
                    handleFormChange
                  }
                  placeholder="Enter market name"
                  maxLength={100}
                  disabled={isFormBusy}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
              </div>

              {/* DATE */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Draw Date
                </label>

                <input
                  type="date"
                  name="drawDate"
                  value={
                    formData.drawDate
                  }
                  min={getToday()}
                  onChange={
                    handleFormChange
                  }
                  disabled={isFormBusy}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />

                <p className="mt-1 text-xs text-gray-500">
                  Past dates are not allowed.
                </p>
              </div>

              {/* TIME */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Draw Time
                </label>

                <div className="relative">

                  <Clock3
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="time"
                    name="drawTime"
                    value={
                      formData.drawTime
                    }
                    onChange={
                      handleFormChange
                    }
                    disabled={isFormBusy}
                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* =================================================
              CALENDAR CONFIGURATION
          ================================================= */}

          <div className="mb-7 border-t border-gray-100 pt-6">

            <div className="mb-4 flex items-center gap-2">

              <CalendarDays
                size={18}
                className="text-blue-600"
              />

              <h3 className="text-sm font-semibold text-gray-900">
                Calendar Configuration
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              {/* MONTH */}

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">

                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Month
                </p>

                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {formData.drawDate
                    ? parseLocalDate(
                        formData.drawDate
                      )?.toLocaleDateString(
                        "en-IN",
                        {
                          month: "long",
                        }
                      ) || "-"
                    : "-"}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Automatically sent from Draw Date.
                </p>
              </div>

              {/* YEAR */}

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">

                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Year
                </p>

                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {formData.drawDate
                    ? parseLocalDate(
                        formData.drawDate
                      )?.getFullYear() ||
                      "-"
                    : "-"}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Automatically sent from Draw Date.
                </p>
              </div>

            </div>
          </div>

          {/* =================================================
              PRIZES
          ================================================= */}

          <div className="mb-7 border-t border-gray-100 pt-6">

            <div className="mb-4 flex items-center gap-2">

              <Trophy
                size={18}
                className="text-blue-600"
              />

              <h3 className="text-sm font-semibold text-gray-900">
                Prize Configuration
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

              {[
                {
                  name: "firstPrize",
                  label: "1st Prize",
                  badge: "Winner 1",
                  badgeClass:
                    "bg-yellow-50 text-yellow-700",
                },
                {
                  name: "secondPrize",
                  label: "2nd Prize",
                  badge: "Winner 2",
                  badgeClass:
                    "bg-blue-50 text-blue-700",
                },
                {
                  name: "thirdPrize",
                  label: "3rd Prize",
                  badge: "Winner 3",
                  badgeClass:
                    "bg-purple-50 text-purple-700",
                },
              ].map((prize) => (
                <div
                  key={prize.name}
                  className="rounded-lg border border-gray-200 p-4"
                >

                  <div className="mb-3 flex items-center justify-between">

                    <span className="text-sm font-semibold text-gray-700">
                      {prize.label}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${prize.badgeClass}`}
                    >
                      {prize.badge}
                    </span>
                  </div>

                  <div className="relative">

                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-gray-500">
                      ₹
                    </span>

                    <input
                      type="number"
                      name={prize.name}
                      value={
                        formData[
                          prize.name
                        ]
                      }
                      min="0"
                      step="1"
                      inputMode="numeric"
                      placeholder={`Enter ${prize.label.toLowerCase()}`}
                      onChange={
                        handleFormChange
                      }
                      disabled={isFormBusy}
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* =================================================
              BACKEND INFO
          ================================================= */}

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">

            <div className="flex items-start gap-3">

              <Ticket
                size={19}
                className="mt-0.5 text-blue-600"
              />

              <div>

                <p className="text-sm font-semibold text-blue-800">
                  Backend-supported configuration
                </p>

                <p className="mt-1 text-xs leading-5 text-blue-700">
                  This admin form sends marketName,
                  month, year, drawDate, drawTime
                  and first/second/third prizes.
                  Ticket price, packages and
                  ticket-format settings were
                  removed because the current
                  Festival MongoDB model does not
                  store them.
                </p>
              </div>
            </div>
          </div>

          {/* =================================================
              FORM ACTIONS
          ================================================= */}

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={handleReset}
              disabled={isFormBusy}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset
            </button>

            <button
              type="submit"
              disabled={isFormBusy}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isFormBusy ? (
                <RefreshCw
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Ticket size={17} />
              )}

              {editingId
                ? updateLoading
                  ? "Updating..."
                  : "Update Festival Lottery"
                : createLoading
                  ? "Creating..."
                  : "Create Festival Lottery"}
            </button>
          </div>
        </form>
      </div>

      {/* =================================================
          ALL LOTTERIES TABLE
      ================================================= */}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

        {/* TABLE HEADER */}

        <div className="flex flex-col gap-3 border-b border-gray-200 p-5 md:flex-row md:items-center md:justify-between">

          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              All Festival Lotteries
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Total: {allLotteries.length}
            </p>
          </div>

          <div className="flex items-center gap-2">

            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              {activeCount} Active
            </span>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              {inactiveCount} Inactive
            </span>
          </div>
        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading &&
        allLotteries.length === 0 ? (
          <div className="p-12 text-center">

            <RefreshCw
              size={26}
              className="mx-auto animate-spin text-blue-600"
            />

            <h3 className="mt-4 text-lg font-semibold text-gray-700">
              Loading festival lotteries...
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Please wait while the lottery configurations are loaded.
            </p>
          </div>
        ) : allLotteries.length === 0 ? (

          /* =================================================
              EMPTY
          ================================================= */

          <div className="p-12 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Ticket size={25} />
            </div>

            <h3 className="mt-4 text-lg font-semibold text-gray-700">
              No festival lotteries found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Create your first festival lottery using the form above.
            </p>
          </div>
        ) : (

          /* =================================================
              TABLE
          ================================================= */

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1150px]">

              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    #
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Market
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Draw Date
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Time
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Month / Year
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Prizes
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Entries
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Action
                  </th>

                </tr>
              </thead>

              <tbody>

                {allLotteries.map(
                  (lotteryItem, index) => {
                    const id =
                      getConfigId(
                        lotteryItem
                      );

                    const drawDate =
                      lotteryItem?.drawDate
                        ? String(
                            lotteryItem.drawDate
                          ).slice(0, 10)
                        : "";

                    const derived =
                      getMonthYearFromDate(
                        drawDate
                      );

                    const month =
                      lotteryItem?.month ??
                      derived.month;

                    const year =
                      lotteryItem?.year ??
                      derived.year;

                    const entries =
                      Array.isArray(
                        lotteryItem?.users
                      )
                        ? lotteryItem.users
                            .length
                        : Number(
                            lotteryItem?.entriesCount ??
                              lotteryItem?.totalEntries ??
                              0
                          ) || 0;

                    const rowBusy =
                      actionId === id;

                    return (
                      <tr
                        key={
                          id ||
                          `lottery-${index}`
                        }
                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                      >

                        {/* INDEX */}

                        <td className="px-4 py-4 text-sm text-gray-600">
                          {index + 1}
                        </td>

                        {/* MARKET */}

                        <td className="px-4 py-4">

                          <div className="font-semibold text-gray-900">
                            {lotteryItem?.marketName ||
                              "-"}
                          </div>

                          <div className="mt-1 max-w-[220px] truncate text-xs text-gray-400">
                            ID: {id || "-"}
                          </div>
                        </td>

                        {/* DATE */}

                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                          {formatDate(
                            drawDate
                          )}
                        </td>

                        {/* TIME */}

                        <td className="px-4 py-4">

                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">

                            <Clock3 size={14} />

                            {lotteryItem?.drawTime ||
                              "-"}
                          </span>
                        </td>

                        {/* MONTH YEAR */}

                        <td className="px-4 py-4 text-sm text-gray-700">

                          <div className="font-semibold">
                            {month}
                          </div>

                          <div className="text-xs text-gray-400">
                            {year}
                          </div>
                        </td>

                        {/* PRIZES */}

                        <td className="px-4 py-4">

                          <div className="space-y-1 text-xs">

                            <div>
                              <span className="font-semibold text-gray-500">
                                1st:
                              </span>{" "}
                              ₹
                              {Number(
                                lotteryItem
                                  ?.prizes
                                  ?.first ?? 0
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </div>

                            <div>
                              <span className="font-semibold text-gray-500">
                                2nd:
                              </span>{" "}
                              ₹
                              {Number(
                                lotteryItem
                                  ?.prizes
                                  ?.second ?? 0
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </div>

                            <div>
                              <span className="font-semibold text-gray-500">
                                3rd:
                              </span>{" "}
                              ₹
                              {Number(
                                lotteryItem
                                  ?.prizes
                                  ?.third ?? 0
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </div>

                          </div>
                        </td>

                        {/* ENTRIES */}

                        <td className="px-4 py-4 text-sm font-semibold text-gray-700">
                          {entries}
                        </td>

                        {/* STATUS */}

                        <td className="px-4 py-4">

                          {lotteryItem?.isActive ? (

                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">

                              <CheckCircle2
                                size={13}
                              />

                              Active
                            </span>

                          ) : (

                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">

                              <XCircle
                                size={13}
                              />

                              Inactive
                            </span>
                          )}
                        </td>

                        {/* ACTIONS */}

                        <td className="px-4 py-4">

                          <div className="flex justify-end gap-2">

                            {/* EDIT */}

                            <button
                              type="button"
                              onClick={() =>
                                handleEdit(
                                  lotteryItem
                                )
                              }
                              disabled={
                                loading ||
                                createLoading ||
                                updateLoading ||
                                actionLoading ||
                                deleteLoading
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                              title="View / Edit"
                            >

                              {loading &&
                              rowBusy ? (

                                <RefreshCw
                                  size={15}
                                  className="animate-spin"
                                />

                              ) : (

                                <Pencil
                                  size={15}
                                />
                              )}

                            </button>

                            {/* ACTIVATE / DEACTIVATE */}

                            <button
                              type="button"
                              onClick={() =>
                                handleToggleStatus(
                                  lotteryItem
                                )
                              }
                              disabled={
                                actionLoading
                              }
                              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                lotteryItem?.isActive
                                  ? "border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100"
                                  : "border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
                              }`}
                              title={
                                lotteryItem?.isActive
                                  ? "Deactivate"
                                  : "Activate"
                              }
                            >

                              {actionLoading &&
                              rowBusy ? (

                                <RefreshCw
                                  size={15}
                                  className="animate-spin"
                                />

                              ) : (

                                <Power
                                  size={15}
                                />
                              )}

                            </button>

                            {/* DELETE */}

                            <button
                              type="button"
                              onClick={() =>
                                handleOpenDelete(
                                  id
                                )
                              }
                              disabled={
                                deleteLoading ||
                                !id
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
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

      {/* =================================================
          DELETE MODAL
      ================================================= */}

      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 size={20} />
            </div>

            <h2 className="mt-4 text-lg font-bold text-gray-900">
              Delete Festival Lottery
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Are you sure you want to delete this
              festival lottery? This action cannot
              be undone and its stored entries will
              also be removed with the configuration.
            </p>

            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                onClick={
                  handleCloseDelete
                }
                disabled={
                  deleteLoading
                }
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleDelete
                }
                disabled={
                  deleteLoading ||
                  !deleteId
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {deleteLoading && (
                  <RefreshCw
                    size={15}
                    className="animate-spin"
                  />
                )}

                {deleteLoading
                  ? "Deleting..."
                  : "Delete"}
s
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFestivalLottery;