import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  createLotteryConfig,
  getAllLotteryConfigs,
  activateLotteryConfig,
  deactivateLotteryConfig,
  deleteLotteryConfig,
  clearLotteryConfigError,
  clearLotteryConfigSuccess,
} from "../../reducer/slice/lotteryConfigSlice";

// =====================================================
// GET TODAY YYYY-MM-DD
// =====================================================

const getToday = () => {
  const now = new Date();

  return (
    `${now.getFullYear()}-` +
    `${String(now.getMonth() + 1).padStart(2, "0")}-` +
    `${String(now.getDate()).padStart(2, "0")}`
  );
};

// =====================================================
// FORMAT DATE
// =====================================================

const formatDate = (date) => {
  if (!date) return "-";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return "-";
  }

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// =====================================================
// DEFAULT FORM
// =====================================================

const getDefaultForm = () => ({
  marketName: "",
  drawDate: getToday(),
  drawTime: "18:30",
  firstPrize: "",
  secondPrize: "",
  thirdPrize: "",
});

// =====================================================
// COMPONENT
// =====================================================

const LotteryConfig = () => {
  const dispatch = useDispatch();

  // ===================================================
  // LOTTERY CONFIG SLICE
  // ===================================================

  const lotteryState = useSelector(
    (state) => state.lotteryConfig || {}
  );

  const {
    configs = [],
    loading = false,
    createLoading = false,
    activateLoading = false,
    deactivateLoading = false,
    deleteLoading = false,
    error = null,
    successMessage = null,
  } = lotteryState;

  // ===================================================
  // USERS (adminAuth slice) — for name lookup
  // ===================================================

  const {
    users = [],
    usersLoading = false,
  } = useSelector((state) => state.adminAuth || {});

  // ===================================================
  // USER LOOKUP MAP  (userId -> user object)
  // ===================================================

  const userMap = useMemo(() => {
    const map = {};

    (users || []).forEach((u) => {
      if (u?._id) {
        map[String(u._id)] = u;
      }
    });

    return map;
  }, [users]);

  // ===================================================
  // RESOLVE USER NAME FROM userId
  // ===================================================

  const getUserName = (userId) => {
    if (!userId) return "-";

    const user = userMap[String(userId)];

    if (!user) {
      return usersLoading ? "Loading..." : String(userId);
    }

    return (
      user.name ||
      user.fullName ||
      user.username ||
      user.email ||
      String(userId)
    );
  };

  // ===================================================
  // FORM STATE
  // ===================================================

  const [formData, setFormData] = useState(
    getDefaultForm()
  );

  const [validationError, setValidationError] =
    useState("");

  // ===================================================
  // DELETE STATE
  // ===================================================

  const [deleteModal, setDeleteModal] =
    useState(false);

  const [deleteId, setDeleteId] =
    useState(null);

  // ===================================================
  // LOAD LOTTERIES
  // ===================================================

  useEffect(() => {
    dispatch(getAllLotteryConfigs());
  }, [dispatch]);

  // ===================================================
  // CLEAR SUCCESS MESSAGE
  // ===================================================

  useEffect(() => {
    if (!successMessage) return;

    const timer = setTimeout(() => {
      dispatch(clearLotteryConfigSuccess());
    }, 3000);

    return () => clearTimeout(timer);
  }, [successMessage, dispatch]);

  // ===================================================
  // FORM CHANGE
  // ===================================================

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setValidationError("");

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ===================================================
  // VALIDATE FORM
  // ===================================================

  const validateCreateForm = () => {
    // MARKET NAME
    if (!formData.marketName.trim()) {
      return "Market name is required.";
    }

    // DRAW DATE
    if (!formData.drawDate) {
      return "Draw date is required.";
    }

    // DRAW TIME
    if (!formData.drawTime) {
      return "Draw time is required.";
    }

    // DATE VALIDATION
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = new Date(
      `${formData.drawDate}T00:00:00`
    );

    if (Number.isNaN(selectedDate.getTime())) {
      return "Invalid draw date.";
    }

    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return "Past draw date cannot be selected.";
    }

    // TIME VALIDATION
    if (
      !/^([01]\d|2[0-3]):([0-5]\d)$/.test(
        formData.drawTime
      )
    ) {
      return "Invalid draw time.";
    }

    // FIRST PRIZE
    if (
      formData.firstPrize === "" ||
      formData.firstPrize === null ||
      formData.firstPrize === undefined
    ) {
      return "First prize is required.";
    }

    // SECOND PRIZE
    if (
      formData.secondPrize === "" ||
      formData.secondPrize === null ||
      formData.secondPrize === undefined
    ) {
      return "Second prize is required.";
    }

    // THIRD PRIZE
    if (
      formData.thirdPrize === "" ||
      formData.thirdPrize === null ||
      formData.thirdPrize === undefined
    ) {
      return "Third prize is required.";
    }

    // CONVERT PRIZES
    const firstPrize = Number(formData.firstPrize);
    const secondPrize = Number(formData.secondPrize);
    const thirdPrize = Number(formData.thirdPrize);

    if (!Number.isFinite(firstPrize) || firstPrize < 0) {
      return "Please enter a valid first prize.";
    }

    if (!Number.isFinite(secondPrize) || secondPrize < 0) {
      return "Please enter a valid second prize.";
    }

    if (!Number.isFinite(thirdPrize) || thirdPrize < 0) {
      return "Please enter a valid third prize.";
    }

    return "";
  };

  // ===================================================
  // CREATE LOTTERY
  // ===================================================

  const handleCreate = async (e) => {
    e.preventDefault();

    setValidationError("");

    dispatch(clearLotteryConfigError());

    const validationMessage = validateCreateForm();

    if (validationMessage) {
      setValidationError(validationMessage);
      return;
    }

    const payload = {
      marketName: formData.marketName.trim(),

      drawDate: formData.drawDate,

      drawTime: formData.drawTime,

      prizes: {
        first: Number(formData.firstPrize),
        second: Number(formData.secondPrize),
        third: Number(formData.thirdPrize),
      },
    };

    console.log("CREATE LOTTERY PAYLOAD:", payload);

    try {
      const result = await dispatch(
        createLotteryConfig(payload)
      );

      console.log("CREATE LOTTERY RESPONSE:", result);

      if (createLotteryConfig.fulfilled.match(result)) {
        setFormData(getDefaultForm());
        setValidationError("");

        dispatch(getAllLotteryConfigs());

        return;
      }

      const message =
        result?.payload?.message ||
        result?.payload ||
        result?.error?.message ||
        "Unable to create lottery.";

      setValidationError(
        typeof message === "string"
          ? message
          : "Unable to create lottery."
      );
    } catch (err) {
      console.error("CREATE LOTTERY ERROR:", err);

      setValidationError(
        err?.message ||
          "Something went wrong while creating lottery."
      );
    }
  };

  // ===================================================
  // ACTIVATE
  // ===================================================

  const handleActivate = async (id) => {
    if (!id) return;

    const confirmed = window.confirm(
      "Are you sure you want to activate this lottery?"
    );

    if (!confirmed) return;

    dispatch(clearLotteryConfigError());

    try {
      const result = await dispatch(
        activateLotteryConfig(id)
      );

      if (activateLotteryConfig.fulfilled.match(result)) {
        dispatch(getAllLotteryConfigs());
      }
    } catch (err) {
      console.error("ACTIVATE ERROR:", err);
    }
  };

  // ===================================================
  // DEACTIVATE
  // ===================================================

  const handleDeactivate = async (id) => {
    if (!id) return;

    const confirmed = window.confirm(
      "Are you sure you want to deactivate this lottery?"
    );

    if (!confirmed) return;

    dispatch(clearLotteryConfigError());

    try {
      const result = await dispatch(
        deactivateLotteryConfig(id)
      );

      if (
        deactivateLotteryConfig.fulfilled.match(result)
      ) {
        dispatch(getAllLotteryConfigs());
      }
    } catch (err) {
      console.error("DEACTIVATE ERROR:", err);
    }
  };

  // ===================================================
  // OPEN DELETE MODAL
  // ===================================================

  const handleOpenDelete = (id) => {
    if (!id) return;

    setDeleteId(id);
    setDeleteModal(true);
  };

  // ===================================================
  // CLOSE DELETE MODAL
  // ===================================================

  const handleCloseDelete = () => {
    setDeleteModal(false);
    setDeleteId(null);
  };

  // ===================================================
  // DELETE
  // ===================================================

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const result = await dispatch(
        deleteLotteryConfig(deleteId)
      );

      if (deleteLotteryConfig.fulfilled.match(result)) {
        handleCloseDelete();

        dispatch(getAllLotteryConfigs());
      }
    } catch (err) {
      console.error("DELETE ERROR:", err);
    }
  };

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh = () => {
    dispatch(clearLotteryConfigError());

    dispatch(getAllLotteryConfigs());
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
          <h1 className="text-2xl font-bold text-gray-900">
            Lottery Configuration
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create and manage lottery markets.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* =================================================
          SUCCESS MESSAGE
      ================================================= */}

      {successMessage && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {successMessage}
        </div>
      )}

      {/* =================================================
          REDUX ERROR
      ================================================= */}

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>
            {typeof error === "string"
              ? error
              : error?.message ||
                "Something went wrong."}
          </span>

          <button
            type="button"
            onClick={() =>
              dispatch(clearLotteryConfigError())
            }
            className="ml-4 text-lg font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* =================================================
          VALIDATION ERROR
      ================================================= */}

      {validationError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {validationError}
        </div>
      )}

      {/* =================================================
          CREATE LOTTERY
      ================================================= */}

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Create Lottery
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Create one lottery market for the selected date
            and time.
          </p>
        </div>

        <form onSubmit={handleCreate}>
          {/* MARKET + DATE + TIME */}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* MARKET NAME */}

            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Market Name
              </label>

              <input
                type="text"
                name="marketName"
                value={formData.marketName}
                onChange={handleFormChange}
                placeholder="Enter market name"
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* DRAW DATE */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Draw Date
              </label>

              <input
                type="date"
                name="drawDate"
                value={formData.drawDate}
                min={getToday()}
                onChange={handleFormChange}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-1 text-xs text-gray-500">
                Past dates are not allowed.
              </p>
            </div>

            {/* DRAW TIME */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Draw Time
              </label>

              <input
                type="time"
                name="drawTime"
                value={formData.drawTime}
                onChange={handleFormChange}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-1 text-xs text-gray-500">
                Select draw time.
              </p>
            </div>
          </div>

          {/* PRIZES */}

          <div className="mt-6">
            <label className="mb-3 block text-sm font-medium text-gray-700">
              Prize Amounts
            </label>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* 1ST */}

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500">
                  1st Prize
                </label>

                <input
                  type="number"
                  name="firstPrize"
                  value={formData.firstPrize}
                  onChange={handleFormChange}
                  min="0"
                  step="0.01"
                  placeholder="Enter 1st prize"
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* 2ND */}

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500">
                  2nd Prize
                </label>

                <input
                  type="number"
                  name="secondPrize"
                  value={formData.secondPrize}
                  onChange={handleFormChange}
                  min="0"
                  step="0.01"
                  placeholder="Enter 2nd prize"
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* 3RD */}

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500">
                  3rd Prize
                </label>

                <input
                  type="number"
                  name="thirdPrize"
                  value={formData.thirdPrize}
                  onChange={handleFormChange}
                  min="0"
                  step="0.01"
                  placeholder="Enter 3rd prize"
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          {/* CREATE BUTTON */}

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={createLoading}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createLoading ? "Creating..." : "Create Lottery"}
            </button>
          </div>
        </form>
      </div>

      {/* =================================================
          ALL LOTTERIES
      ================================================= */}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* HEADER */}

        <div className="border-b border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900">
            All Lottery Draws
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Total:{" "}
            {Array.isArray(configs) ? configs.length : 0}
          </p>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="p-10 text-center text-gray-500">
            Loading lottery draws...
          </div>
        )}

        {/* EMPTY */}

        {!loading &&
          Array.isArray(configs) &&
          configs.length === 0 && (
            <div className="p-10 text-center">
              <div className="text-lg font-semibold text-gray-700">
                No lottery draws found
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Create your first lottery draw above.
              </p>
            </div>
          )}

        {/* TABLE */}

        {!loading &&
          Array.isArray(configs) &&
          configs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      #
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Market
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Draw Date
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Draw Time
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      1st Prize
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      2nd Prize
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      3rd Prize
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Status
                    </th>

                    {/* ✅ ADDED: Created By column */}

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Created By
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {configs.map((config, index) => {
                    const id = config?._id;

                    return (
                      <tr
                        key={id || index}
                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                      >
                        {/* INDEX */}

                        <td className="px-4 py-4 text-sm text-gray-600">
                          {index + 1}
                        </td>

                        {/* MARKET */}

                        <td className="px-4 py-4">
                          <div className="font-semibold text-gray-900">
                            {config?.marketName || "-"}
                          </div>
                        </td>

                        {/* DATE */}

                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                          {formatDate(config?.drawDate)}
                        </td>

                        {/* TIME */}

                        <td className="px-4 py-4">
                          <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
                            {config?.drawTime || "-"}
                          </span>
                        </td>

                        {/* FIRST PRIZE */}

                        <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                          ₹
                          {Number(
                            config?.prizes?.first || 0
                          ).toLocaleString("en-IN")}
                        </td>

                        {/* SECOND PRIZE */}

                        <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                          ₹
                          {Number(
                            config?.prizes?.second || 0
                          ).toLocaleString("en-IN")}
                        </td>

                        {/* THIRD PRIZE */}

                        <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                          ₹
                          {Number(
                            config?.prizes?.third || 0
                          ).toLocaleString("en-IN")}
                        </td>

                        {/* STATUS */}

                        <td className="px-4 py-4">
                          {config?.isActive ? (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                              Active
                            </span>
                          ) : (
                            <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* ✅ CREATED BY (user name lookup) */}

                        <td className="px-4 py-4">
                          {config?.createdBy ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {getUserName(config.createdBy)}
                              </div>

                              <div className="mt-0.5 max-w-[160px] truncate text-xs text-gray-400">
                                {config.createdBy}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">
                              -
                            </span>
                          )}
                        </td>

                        {/* ACTION */}

                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            {config?.isActive ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeactivate(id)
                                }
                                disabled={deactivateLoading}
                                className="rounded-lg border border-orange-300 bg-white px-3 py-2 text-xs font-medium text-orange-600 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {deactivateLoading
                                  ? "..."
                                  : "Deactivate"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  handleActivate(id)
                                }
                                disabled={activateLoading}
                                className="rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {activateLoading
                                  ? "..."
                                  : "Activate"}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                handleOpenDelete(id)
                              }
                              disabled={deleteLoading}
                              className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Delete
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

      {/* =================================================
          DELETE MODAL
      ================================================= */}

      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">
              Delete Lottery
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete this lottery
              draw? This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseDelete}
                disabled={deleteLoading}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LotteryConfig;