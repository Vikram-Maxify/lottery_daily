import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  getAllDepositsForAdmin,
  setAdminDepositFilters,
  resetAdminDepositFilters,
} from "../../reducer/slice/depositSlice";

import { getAllUsers } from "../../reducer/slice/adminAuthReducer";

// =====================================================
// STATUS MAP
// 0 = Pending | 1 = Success | 2 = Failed | 3 = Cancelled
// =====================================================

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "0", label: "Pending" },
  { value: "1", label: "Success" },
  { value: "2", label: "Failed" },
  { value: "3", label: "Cancelled" },
];

const AdminDeposits = () => {
  const dispatch = useDispatch();

  const {
    adminDeposits,
    adminPagination,
    loading,
    error,
    adminFilters,
  } = useSelector((state) => state.deposit);

  // =====================================================
  // USERS (adminAuth slice) — for name lookup
  // =====================================================

  const { users = [], usersLoading } = useSelector(
    (state) => state.adminAuth
  );

  // =====================================================
  // USER LOOKUP MAP  (_id / uuid -> user object)
  // =====================================================

  const userMap = useMemo(() => {
    const map = {};

    (users || []).forEach((u) => {
      if (u?._id) map[String(u._id)] = u;
      if (u?.uuid) map[String(u.uuid)] = u;
    });

    return map;
  }, [users]);

  // =====================================================
  // RESOLVE USER NAME
  // =====================================================

  const getUserName = (deposit) => {
    if (deposit?.username) return deposit.username;

    const userId = deposit?.userId;

    if (userId) {
      if (typeof userId === "object") {
        return (
          userId.name ||
          userId.fullName ||
          userId.username ||
          userId.email ||
          "-"
        );
      }

      const user = userMap[String(userId)];
      if (user) {
        return (
          user.name ||
          user.fullName ||
          user.username ||
          user.email ||
          "-"
        );
      }

      if (usersLoading) return "Loading...";
    }

    const uid = deposit?.uid;

    if (uid) {
      const user = userMap[String(uid)];
      if (user) {
        return (
          user.name ||
          user.fullName ||
          user.username ||
          user.email ||
          "-"
        );
      }

      if (usersLoading) return "Loading...";
    }

    return "Unknown";
  };

  // =====================================================
  // RESOLVE USER PHONE
  // =====================================================

  const getUserPhone = (deposit) => {
    if (deposit?.phone) return deposit.phone;

    const userId = deposit?.userId;

    if (userId && typeof userId === "object") {
      return userId.mobile || userId.phone || "-";
    }

    if (userId) {
      const user = userMap[String(userId)];
      if (user) return user.mobile || user.phone || "-";
    }

    const uid = deposit?.uid;

    if (uid) {
      const user = userMap[String(uid)];
      if (user) return user.mobile || user.phone || "-";
    }

    return "-";
  };

  const [localFilters, setLocalFilters] = useState({
    status: "",
    paymentMethod: "",
    channel: "",
    phone: "",
    username: "",
    uid: "",
    orderId: "",
    transactionId: "",
    utr: "",
    fromDate: "",
    toDate: "",
    minAmount: "",
    maxAmount: "",
    sort: "desc",
  });

  // =====================================================
  // FETCH DEPOSITS
  // =====================================================

  const fetchDeposits = (page = 1) => {
    const filters = {
      ...localFilters,
      page,
      limit: 20,
    };

    dispatch(setAdminDepositFilters(localFilters));
    dispatch(getAllDepositsForAdmin(filters));
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchDeposits(1);
    dispatch(getAllUsers());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setLocalFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // SEARCH
  // =====================================================

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDeposits(1);
  };

  // =====================================================
  // RESET
  // =====================================================

  const handleReset = () => {
    const resetFilters = {
      status: "",
      paymentMethod: "",
      channel: "",
      phone: "",
      username: "",
      uid: "",
      orderId: "",
      transactionId: "",
      utr: "",
      fromDate: "",
      toDate: "",
      minAmount: "",
      maxAmount: "",
      sort: "desc",
    };

    setLocalFilters(resetFilters);
    dispatch(resetAdminDepositFilters());

    dispatch(
      getAllDepositsForAdmin({
        ...resetFilters,
        page: 1,
        limit: 20,
      })
    );
  };

  // =====================================================
  // PAGINATION
  // =====================================================

  const handlePageChange = (page) => {
    if (
      page < 1 ||
      page > adminPagination.totalPages ||
      loading
    ) {
      return;
    }

    fetchDeposits(page);
  };

  // =====================================================
  // STATUS BADGE (updated — 4 statuses)
  // =====================================================

  const getStatus = (status) => {
    switch (Number(status)) {
      case 1:
        return {
          text: "Success",
          className:
            "bg-green-100 text-green-700 border-green-200",
        };

      case 2:
        return {
          text: "Failed",
          className: "bg-red-100 text-red-700 border-red-200",
        };

      case 3:
        return {
          text: "Cancelled",
          className:
            "bg-gray-100 text-gray-700 border-gray-300",
        };

      default:
        return {
          text: "Pending",
          className:
            "bg-yellow-100 text-yellow-700 border-yellow-200",
        };
    }
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "-";

    try {
      return new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  // =====================================================
  // FORMAT AMOUNT
  // =====================================================

  const formatAmount = (amount) => {
    const value = Number(amount || 0);

    return value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // =====================================================
  // PAGE NUMBERS
  // =====================================================

  const getPageNumbers = () => {
    const totalPages = adminPagination.totalPages || 0;
    const currentPage = adminPagination.currentPage || 1;

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };

  // =====================================================
  // STATS COUNTERS (page-level)
  // =====================================================

  const stats = useMemo(() => {
    const counts = { pending: 0, success: 0, failed: 0, cancelled: 0 };

    (adminDeposits || []).forEach((item) => {
      const s = Number(item.status);
      if (s === 1) counts.success++;
      else if (s === 2) counts.failed++;
      else if (s === 3) counts.cancelled++;
      else counts.pending++;
    });

    return counts;
  }, [adminDeposits]);

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-5 lg:p-6">
      <div className="mx-auto max-w-[1600px]">
        {/* HEADER */}
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              All Deposits
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and view all user deposit transactions
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              fetchDeposits(adminPagination.currentPage || 1)
            }
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9M4 4l4 4m12 12v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2L16 16"
              />
            </svg>
            Refresh
          </button>
        </div>

        {/* =================================================
            STATS — 5 cards (added Cancelled)
        ================================================= */}

        <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Deposits
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {adminPagination.total || 0}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Pending
            </p>
            <p className="mt-1 text-2xl font-bold text-yellow-600">
              {stats.pending}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Success
            </p>
            <p className="mt-1 text-2xl font-bold text-green-600">
              {stats.success}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Failed
            </p>
            <p className="mt-1 text-2xl font-bold text-red-600">
              {stats.failed}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Cancelled
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-700">
              {stats.cancelled}
            </p>
          </div>
        </div>

        {/* =================================================
            FILTERS
        ================================================= */}

        <form
          onSubmit={handleSearch}
          className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              Search & Filters
            </h2>

            <button
              type="button"
              onClick={handleReset}
              className="text-sm font-medium text-red-600 hover:text-red-700"
            >
              Reset
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {/* STATUS — updated with 4 options */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Status
              </label>

              <select
                name="status"
                value={localFilters.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={localFilters.username}
                onChange={handleChange}
                placeholder="Search username"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Phone
              </label>
              <input
                type="text"
                name="phone"
                value={localFilters.phone}
                onChange={handleChange}
                placeholder="Search phone"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                UID
              </label>
              <input
                type="text"
                name="uid"
                value={localFilters.uid}
                onChange={handleChange}
                placeholder="Search UID"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Order ID
              </label>
              <input
                type="text"
                name="orderId"
                value={localFilters.orderId}
                onChange={handleChange}
                placeholder="DEP..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                UTR
              </label>
              <input
                type="text"
                name="utr"
                value={localFilters.utr}
                onChange={handleChange}
                placeholder="Search UTR"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Payment Method
              </label>
              <input
                type="text"
                name="paymentMethod"
                value={localFilters.paymentMethod}
                onChange={handleChange}
                placeholder="INR / USDT"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Channel
              </label>
              <input
                type="text"
                name="channel"
                value={localFilters.channel}
                onChange={handleChange}
                placeholder="Gateway"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                From Date
              </label>
              <input
                type="date"
                name="fromDate"
                value={localFilters.fromDate}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                To Date
              </label>
              <input
                type="date"
                name="toDate"
                value={localFilters.toDate}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Min Amount
              </label>
              <input
                type="number"
                name="minAmount"
                value={localFilters.minAmount}
                onChange={handleChange}
                placeholder="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Max Amount
              </label>
              <input
                type="number"
                name="maxAmount"
                value={localFilters.maxAmount}
                onChange={handleChange}
                placeholder="100000"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Searching..." : "Search Deposits"}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </form>

        {/* ERROR */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* TABLE */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                Deposit Transactions
              </h2>
              <p className="text-xs text-gray-500">
                Showing {adminDeposits.length} of{" "}
                {adminPagination.total || 0}
              </p>
            </div>

            <select
              value={localFilters.sort}
              onChange={(e) => {
                const value = e.target.value;

                setLocalFilters((prev) => ({
                  ...prev,
                  sort: value,
                }));

                dispatch(
                  getAllDepositsForAdmin({
                    ...localFilters,
                    sort: value,
                    page: adminPagination.currentPage || 1,
                    limit: 20,
                  })
                );
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1400px] w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                    #
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                    User
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                    Order ID
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                    Amount
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                    Method
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                    Channel
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                    UTR
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                    Transaction ID
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                    Status
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                    Date
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                    Proof
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading && (
                  <tr>
                    <td colSpan="11" className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                        <p className="mt-3 text-sm text-gray-500">
                          Loading deposits...
                        </p>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && adminDeposits.length === 0 && (
                  <tr>
                    <td colSpan="11" className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                          <svg
                            className="h-6 w-6 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <p className="font-medium text-gray-700">
                          No deposits found
                        </p>
                        <p className="mt-1 text-sm text-gray-400">
                          Try changing your filters
                        </p>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading &&
                  adminDeposits.map((deposit, index) => {
                    const status = getStatus(deposit.status);

                    const resolvedUid =
                      typeof deposit.userId === "object"
                        ? deposit.userId?._id
                        : deposit.userId || deposit.uid;

                    const isCancelled = Number(deposit.status) === 3;

                    return (
                      <tr
                        key={deposit._id || deposit.orderId || index}
                        className={`transition hover:bg-gray-50 ${
                          isCancelled ? "bg-gray-50/50" : ""
                        }`}
                      >
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                          {(adminPagination.currentPage - 1) *
                            adminPagination.perPage +
                            index +
                            1}
                        </td>

                        {/* USER */}
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {getUserName(deposit)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {getUserPhone(deposit)}
                            </p>
                            {resolvedUid && (
                              <p className="mt-0.5 max-w-[180px] truncate text-[11px] text-gray-400">
                                UID: {resolvedUid}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700">
                            {deposit.orderId || "-"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <span className="font-bold text-gray-900">
                            ₹{formatAmount(deposit.amount)}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                          {deposit.paymentMethod || "-"}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                          {deposit.channel || "-"}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <span className="font-mono text-xs text-gray-700">
                            {deposit.utr || "-"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <span className="font-mono text-xs text-gray-600">
                            {deposit.transactionId || "-"}
                          </span>
                        </td>

                        {/* STATUS — with cancel tooltip */}
                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}
                            >
                              {status.text}
                            </span>

                            {isCancelled && deposit.cancelReason && (
                              <span
                                className="max-w-[180px] truncate text-[10px] text-gray-400"
                                title={deposit.cancelReason}
                              >
                                {deposit.cancelReason}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-xs text-gray-600">
                          {formatDate(deposit.createdAt)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          {deposit.paymentProof ? (
                            <a
                              href={deposit.paymentProof}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                            >
                              View Proof
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">
                              No Proof
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {adminPagination.totalPages > 0 && (
            <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Page{" "}
                <span className="font-semibold text-gray-800">
                  {adminPagination.currentPage}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-800">
                  {adminPagination.totalPages}
                </span>
              </p>

              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  disabled={
                    loading || adminPagination.currentPage <= 1
                  }
                  onClick={() =>
                    handlePageChange(
                      adminPagination.currentPage - 1
                    )
                  }
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {getPageNumbers().map((page, index) => {
                  if (page === "...") {
                    return (
                      <span
                        key={`dots-${index}`}
                        className="px-2 text-gray-400"
                      >
                        ...
                      </span>
                    );
                  }

                  return (
                    <button
                      key={page}
                      type="button"
                      disabled={loading}
                      onClick={() => handlePageChange(page)}
                      className={`min-w-[38px] rounded-lg px-3 py-2 text-sm font-medium ${
                        page === adminPagination.currentPage
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={
                    loading ||
                    adminPagination.currentPage >=
                      adminPagination.totalPages
                  }
                  onClick={() =>
                    handlePageChange(
                      adminPagination.currentPage + 1
                    )
                  }
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDeposits;