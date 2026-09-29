import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  getAllUsers,
  updateUserProfile,
  clearAdminError,
  clearAdminMessage,
} from "../../reducer/slice/adminAuthReducer";

import {
  getAllLotteryConfigs,
} from "../../reducer/slice/lotteryConfigSlice";

const Users = () => {
  const dispatch = useDispatch();

  // =====================================
  // REDUX STATE
  // =====================================

  const {
    users = [],
    usersLoading,
    usersError,
    updateLoading,
    error,
    message,
  } = useSelector((state) => state.adminAuth);

  const {
    configs = [],
    loading: lotteryLoading,
  } = useSelector((state) => state.lotteryConfig || {});

  // =====================================
  // LOCAL STATE
  // =====================================

  const [selectedUser, setSelectedUser] = useState(null);

  const [selectedTicketsUser, setSelectedTicketsUser] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    password: "",
  });

  // =====================================
  // SEARCH STATE (NEW)
  // =====================================

  const [searchTerm, setSearchTerm] = useState("");

  // =====================================
  // GET ALL USERS + LOTTERY CONFIGS
  // =====================================

  useEffect(() => {
    dispatch(getAllUsers());
    dispatch(getAllLotteryConfigs());
  }, [dispatch]);

  // =====================================
  // INPUT CHANGE
  // =====================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================
  // GET USER TICKETS
  // =====================================

  const getUserTickets = (userId) => {
    if (!userId || !Array.isArray(configs)) {
      return [];
    }

    const tickets = [];

    configs.forEach((config) => {
      if (!Array.isArray(config?.users)) {
        return;
      }

      config.users.forEach((ticket) => {
        if (
          ticket?.userId &&
          String(ticket.userId) === String(userId)
        ) {
          tickets.push({
            ...ticket,

            lotteryId: config._id,

            marketName:
              config.marketName ||
              config.name ||
              "-",

            drawDate: config.drawDate || null,

            drawTime: config.drawTime || "-",
          });
        }
      });
    });

    return tickets;
  };

  // =====================================
  // GET TICKET COUNT
  // =====================================

  const getUserTicketCount = (user) => {
    if (!user?._id) {
      return 0;
    }

    return getUserTickets(user._id).length;
  };

  // =====================================
  // OPEN TICKET MODAL
  // =====================================

  const handleTicketsClick = (user) => {
    const tickets = getUserTickets(user?._id);

    if (!tickets.length) {
      return;
    }

    setSelectedTicketsUser({
      user,
      tickets,
    });
  };

  // =====================================
  // CLOSE TICKET MODAL
  // =====================================

  const handleCloseTickets = () => {
    setSelectedTicketsUser(null);
  };

  // =====================================
  // OPEN EDIT MODAL
  // =====================================

  const handleEdit = (user) => {
    setSelectedUser(user);

    setFormData({
      name: user.name || "",
      mobile: user.mobile || "",
      password: "",
    });

    dispatch(clearAdminError());
    dispatch(clearAdminMessage());
  };

  // =====================================
  // CLOSE EDIT MODAL
  // =====================================

  const handleCloseEdit = () => {
    setSelectedUser(null);

    setFormData({
      name: "",
      mobile: "",
      password: "",
    });

    dispatch(clearAdminError());
    dispatch(clearAdminMessage());
  };

  // =====================================
  // UPDATE USER
  // =====================================

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!selectedUser) {
      return;
    }

    const updateData = {
      uuid: selectedUser.uuid,
      name: formData.name.trim(),
      mobile: formData.mobile.trim(),
    };

    // Password only send if entered
    if (formData.password.trim()) {
      updateData.password = formData.password;
    }

    const result = await dispatch(
      updateUserProfile(updateData)
    );

    if (updateUserProfile.fulfilled.match(result)) {
      setSelectedUser(null);

      setFormData({
        name: "",
        mobile: "",
        password: "",
      });
    }
  };

  // =====================================
  // REFRESH USERS
  // =====================================

  const handleRefresh = () => {
    dispatch(clearAdminError());

    dispatch(getAllUsers());

    dispatch(getAllLotteryConfigs());
  };

  // =====================================
  // FORMAT DATE
  // =====================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================
  // FORMAT DATE TIME
  // =====================================

  const formatDateTime = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =====================================
  // TOTAL TICKETS
  // =====================================

  const totalTickets = Array.isArray(configs)
    ? configs.reduce((total, config) => {
        return (
          total +
          (Array.isArray(config?.users)
            ? config.users.length
            : 0)
        );
      }, 0)
    : 0;

  // =====================================
  // FILTERED USERS (NEW)
  // =====================================

  const filteredUsers = users.filter((user) => {
    if (!searchTerm.trim()) {
      return true;
    }

    const term = searchTerm.trim().toLowerCase();

    // Search by mobile
    const mobileMatch = (user.mobile || "")
      .toLowerCase()
      .includes(term);

    // Search by name
    const nameMatch = (user.name || "")
      .toLowerCase()
      .includes(term);

    // Search by UUID
    const uuidMatch = (user.uuid || "")
      .toLowerCase()
      .includes(term);

    return mobileMatch || nameMatch || uuidMatch;
  });

  // =====================================
  // PAGE
  // =====================================

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Users
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage all registered users
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">

          {/* TOTAL USERS */}

          <div className="rounded-xl bg-white px-5 py-3 shadow-sm">
            <p className="text-xs font-medium text-gray-500">
              Total Users
            </p>

            <p className="text-xl font-bold text-gray-900">
              {users.length}
            </p>
          </div>

          {/* TOTAL TICKETS */}

          <div className="rounded-xl bg-white px-5 py-3 shadow-sm">
            <p className="text-xs font-medium text-gray-500">
              Total Tickets
            </p>

            <p className="text-xl font-bold text-blue-600">
              {lotteryLoading ? "..." : totalTickets}
            </p>
          </div>

          {/* REFRESH */}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={usersLoading || lotteryLoading}
            className="rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {usersLoading || lotteryLoading
              ? "Loading..."
              : "Refresh"}
          </button>

        </div>
      </div>

      {/* =====================================
          SEARCH BAR (NEW)
      ===================================== */}

      <div className="mb-5">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              className="h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
              />
            </svg>
          </div>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by number, name, or UUID..."
            className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-10 text-sm text-gray-700 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
          />

          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition hover:text-gray-600"
              title="Clear search"
            >
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {searchTerm.trim() && (
          <p className="mt-2 text-xs text-gray-500">
            Showing {filteredUsers.length} of {users.length} users
          </p>
        )}
      </div>

      {/* =====================================
          SUCCESS MESSAGE
      ===================================== */}

      {message && (
        <div className="mb-5 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">

          <span>{message}</span>

          <button
            type="button"
            onClick={() =>
              dispatch(clearAdminMessage())
            }
            className="ml-4 text-lg font-bold"
          >
            ×
          </button>

        </div>
      )}

      {/* =====================================
          ERROR MESSAGE
      ===================================== */}

      {(usersError || error) && (
        <div className="mb-5 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          <span>{usersError || error}</span>

          <button
            type="button"
            onClick={() =>
              dispatch(clearAdminError())
            }
            className="ml-4 text-lg font-bold"
          >
            ×
          </button>

        </div>
      )}

      {/* =====================================
          USERS TABLE
      ===================================== */}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1050px]">

            {/* =================================
                TABLE HEADER
            ================================= */}

            <thead className="border-b bg-gray-50">

              <tr>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  #
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  User
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Mobile
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Role
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Wallet
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Tickets
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  UUID
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Created
                </th>

                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Action
                </th>

              </tr>

            </thead>

            {/* =================================
                TABLE BODY
            ================================= */}

            <tbody className="divide-y divide-gray-100">

              {usersLoading ? (

                /* LOADING */

                <tr>

                  <td
                    colSpan="9"
                    className="px-6 py-16 text-center"
                  >

                    <div className="flex flex-col items-center justify-center">

                      <div className="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />

                      <p className="text-sm text-gray-500">
                        Loading users...
                      </p>

                    </div>

                  </td>

                </tr>

              ) : filteredUsers.length > 0 ? (

                /* USERS */

                filteredUsers.map((user, index) => {

                  const ticketCount =
                    getUserTicketCount(user);

                  return (
                    <tr
                      key={
                        user.uuid ||
                        user._id ||
                        index
                      }
                      className="transition hover:bg-gray-50"
                    >

                      {/* NUMBER */}

                      <td className="px-6 py-4 text-sm text-gray-500">
                        {index + 1}
                      </td>

                      {/* USER */}

                      <td className="px-6 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">

                            {user.name
                              ?.charAt(0)
                              ?.toUpperCase() || "U"}

                          </div>

                          <div className="min-w-0">

                            <p className="truncate font-medium text-gray-900">
                              {user.name || "-"}
                            </p>

                            <p className="text-xs text-gray-500">
                              User
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* MOBILE */}

                      <td className="px-6 py-4 text-sm text-gray-700">
                        {user.mobile || "-"}
                      </td>

                      {/* ROLE */}

                      <td className="px-6 py-4">

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {user.role || "user"}
                        </span>

                      </td>

                      {/* WALLET */}

                      <td className="px-6 py-4">

                        <span className="font-semibold text-gray-900">
                          ₹
                          {Number(
                            user.wallet || 0
                          ).toFixed(2)}
                        </span>

                      </td>

                      {/* TICKETS */}

                      <td className="px-6 py-4">

                        <button
                          type="button"
                          onClick={() =>
                            handleTicketsClick(user)
                          }
                          disabled={ticketCount === 0}
                          className={`inline-flex min-w-[48px] items-center justify-center rounded-lg px-3 py-2 text-sm font-bold transition ${
                            ticketCount > 0
                              ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                              : "cursor-not-allowed bg-gray-100 text-gray-400"
                          }`}
                          title={
                            ticketCount > 0
                              ? "View all tickets"
                              : "No tickets"
                          }
                        >
                          {ticketCount}
                        </button>

                      </td>

                      {/* UUID */}

                      <td className="px-6 py-4">

                        <span className="inline-block max-w-[180px] truncate rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-600">
                          {user.uuid || "-"}
                        </span>

                      </td>

                      {/* CREATED */}

                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>

                      {/* ACTION */}

                      <td className="px-6 py-4 text-right">

                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(user)
                          }
                          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
                        >
                          Edit
                        </button>

                      </td>

                    </tr>
                  );
                })

              ) : (

                /* EMPTY / NO SEARCH RESULTS */

                <tr>

                  <td
                    colSpan="9"
                    className="px-6 py-16 text-center"
                  >

                    <div className="flex flex-col items-center">

                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">
                        {searchTerm.trim() ? "🔍" : "👤"}
                      </div>

                      <p className="font-medium text-gray-900">
                        {searchTerm.trim()
                          ? "No matching users found"
                          : "No users found"}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {searchTerm.trim()
                          ? `No results for "${searchTerm}"`
                          : "There are no registered users."}
                      </p>

                      {searchTerm.trim() && (
                        <button
                          type="button"
                          onClick={() => setSearchTerm("")}
                          className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
                        >
                          Clear Search
                        </button>
                      )}

                    </div>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =====================================================
          TICKET DETAILS MODAL
      ===================================================== */}

      {selectedTicketsUser && (

        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          onClick={handleCloseTickets}
        >

          <div
            className="w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-gray-900">
                  User Tickets
                </h2>

                <p className="mt-1 text-sm text-gray-500">

                  {selectedTicketsUser.user.name ||
                    "User"}

                  {selectedTicketsUser.user.mobile
                    ? ` • ${selectedTicketsUser.user.mobile}`
                    : ""}

                </p>

              </div>

              <button
                type="button"
                onClick={handleCloseTickets}
                className="flex h-9 w-9 items-center justify-center rounded-full text-2xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                ×
              </button>

            </div>

            {/* SUMMARY */}

            <div className="grid grid-cols-1 gap-4 border-b bg-gray-50 p-5 sm:grid-cols-2 md:grid-cols-4">

              {/* TOTAL TICKETS */}

              <div className="rounded-xl bg-white p-4 shadow-sm">

                <p className="text-xs font-medium text-gray-500">
                  Total Tickets
                </p>

                <p className="mt-1 text-2xl font-bold text-blue-600">
                  {
                    selectedTicketsUser
                      .tickets.length
                  }
                </p>

              </div>

              {/* TOTAL AMOUNT */}

              <div className="rounded-xl bg-white p-4 shadow-sm">

                <p className="text-xs font-medium text-gray-500">
                  Total Amount
                </p>

                <p className="mt-1 text-2xl font-bold text-gray-900">

                  ₹
                  {selectedTicketsUser.tickets
                    .reduce(
                      (total, ticket) =>
                        total +
                        Number(
                          ticket.amount || 0
                        ),
                      0
                    )
                    .toFixed(2)}

                </p>

              </div>

              {/* USER NAME */}

              <div className="rounded-xl bg-white p-4 shadow-sm">

                <p className="text-xs font-medium text-gray-500">
                  User
                </p>

                <p className="mt-1 truncate text-lg font-bold text-gray-900">
                  {selectedTicketsUser.user.name ||
                    "-"}
                </p>

              </div>

              {/* MOBILE */}

              <div className="rounded-xl bg-white p-4 shadow-sm">

                <p className="text-xs font-medium text-gray-500">
                  Mobile
                </p>

                <p className="mt-1 text-lg font-bold text-gray-900">
                  {selectedTicketsUser.user.mobile ||
                    "-"}
                </p>

              </div>

            </div>

            {/* TICKET TABLE */}

            <div className="max-h-[60vh] overflow-auto">

              <table className="w-full min-w-[950px]">

                <thead className="sticky top-0 z-10 border-b bg-gray-50">

                  <tr>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      #
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Lottery
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Number
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Amount
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Draw Date
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Draw Time
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Entry Date
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {selectedTicketsUser.tickets.map(
                    (ticket, index) => (

                      <tr
                        key={
                          ticket._id ||
                          `${ticket.lotteryId}-${index}`
                        }
                        className="hover:bg-gray-50"
                      >

                        {/* NUMBER */}

                        <td className="px-5 py-4 text-sm text-gray-500">
                          {index + 1}
                        </td>

                        {/* LOTTERY */}

                        <td className="px-5 py-4">

                          <p className="font-semibold text-gray-900">
                            {ticket.marketName ||
                              "-"}
                          </p>

                          {ticket.lotteryId && (
                            <p className="mt-1 max-w-[150px] truncate font-mono text-[10px] text-gray-400">
                              {ticket.lotteryId}
                            </p>
                          )}

                        </td>

                        {/* NUMBER */}

                        <td className="px-5 py-4">

                          <span className="rounded-md bg-gray-100 px-3 py-1 font-mono text-sm font-bold tracking-wider text-gray-800">
                            {ticket.number || "-"}
                          </span>

                        </td>

                        {/* AMOUNT */}

                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                          ₹
                          {Number(
                            ticket.amount || 0
                          ).toFixed(2)}
                        </td>

                        {/* DRAW DATE */}

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {formatDate(
                            ticket.drawDate
                          )}
                        </td>

                        {/* DRAW TIME */}

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {ticket.drawTime || "-"}
                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              ticket.status ===
                              "won"
                                ? "bg-green-100 text-green-700"
                                : ticket.status ===
                                  "lost"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {ticket.status ||
                              "pending"}
                          </span>

                        </td>

                        {/* ENTRY DATE */}

                        <td className="px-5 py-4 text-sm text-gray-500">
                          {formatDateTime(
                            ticket.createdAt ||
                              ticket.entryDate
                          )}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

            {/* MODAL FOOTER */}

            <div className="flex justify-end border-t bg-gray-50 px-6 py-4">

              <button
                type="button"
                onClick={handleCloseTickets}
                className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

      {/* =====================================================
          EDIT USER MODAL
      ===================================================== */}

      {selectedUser && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={handleCloseEdit}
        >

          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b px-6 py-5">

              <div>

                <h2 className="text-lg font-bold text-gray-900">
                  Edit User
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Update user profile information
                </p>

              </div>

              <button
                type="button"
                onClick={handleCloseEdit}
                className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleUpdate}
              className="space-y-5 p-6"
            >

              {/* NAME */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  placeholder="Enter user name"
                />

              </div>

              {/* MOBILE */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Mobile
                </label>

                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  placeholder="Enter mobile number"
                />

              </div>

              {/* PASSWORD */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  New Password
                </label>

                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  minLength={6}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  placeholder="Leave empty to keep current"
                />

                <p className="mt-1.5 text-xs text-gray-400">
                  Leave empty if you don't want to
                  change the password.
                </p>

              </div>

              {/* UUID */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  UUID
                </label>

                <div className="rounded-lg bg-gray-100 px-4 py-3 font-mono text-xs break-all text-gray-600">
                  {selectedUser.uuid}
                </div>

              </div>

              {/* BUTTONS */}

              <div className="flex gap-3 pt-2">

                <button
                  type="button"
                  onClick={handleCloseEdit}
                  disabled={updateLoading}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updateLoading}
                  className="flex-1 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updateLoading
                    ? "Updating..."
                    : "Update User"}
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