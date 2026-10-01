import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ClipboardList,
  RefreshCw,
  Search,
  X,
  UserRound,
} from "lucide-react";

import {
  getAllUsers,
  updateUserProfile,
  clearAdminError,
  clearAdminMessage,
} from "../../reducer/slice/adminAuthReducer";

import {
  getAllLotteryConfigs,
} from "../../reducer/slice/lotteryConfigSlice";

/* =========================================================
   WINZOX THEME TOKENS (Bright Gold + White)

   bg          #FFFDF7
   border      #F3E7C4
   gold        #FFD83D -> #F7B500 -> #E39A00
   gold-soft   #FFEFA8
   gold-line   #F2B705
   on-gold     #1A1204
   text        #1A1A1A
   muted       #6B7280
   brown       #9A5B00
   success     #12A36B
   danger      #D93025
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
  "px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#9A5B00]";

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
  // FILTERED USERS
  // =====================================

  const filteredUsers = users.filter((user) => {
    if (!searchTerm.trim()) {
      return true;
    }

    const term = searchTerm.trim().toLowerCase();

    const mobileMatch = (user.mobile || "")
      .toLowerCase()
      .includes(term);

    const nameMatch = (user.name || "")
      .toLowerCase()
      .includes(term);

    const uuidMatch = (user.uuid || "")
      .toLowerCase()
      .includes(term);

    return mobileMatch || nameMatch || uuidMatch;
  });

  // =====================================
  // PAGE
  // =====================================

  return (
    <div className="min-h-screen space-y-6 bg-[#FFFDF7] p-4 md:p-6">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#1A1A1A]">
            Users
          </h1>

          <p className="mt-1 text-sm text-[#6B7280]">
            Manage all registered users.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">

          {/* TOTAL USERS */}

          <div
            className={`min-w-[125px] px-5 py-3 ${CARD_CLS}`}
          >
            <p className="text-xs font-semibold text-[#8A8F98]">
              Total Users
            </p>

            <p className="mt-1 text-xl font-black text-[#1A1A1A]">
              {users.length}
            </p>
          </div>

          {/* TOTAL TICKETS */}

          <div
            className={`min-w-[125px] px-5 py-3 ${CARD_CLS}`}
          >
            <p className="text-xs font-semibold text-[#8A8F98]">
              Total Tickets
            </p>

            <p className="mt-1 text-xl font-black text-[#9A5B00]">
              {lotteryLoading ? "..." : totalTickets}
            </p>
          </div>

          {/* REFRESH */}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={usersLoading || lotteryLoading}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${OUTLINE_BTN}`}
          >
            <RefreshCw
              size={15}
              className={
                usersLoading || lotteryLoading
                  ? "animate-spin"
                  : ""
              }
            />

            {usersLoading || lotteryLoading
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </div>
      </div>

      {/* =====================================
          SEARCH BAR
      ===================================== */}

      <div>
        <div className="relative">

          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search
              size={18}
              className="text-[#8A8F98]"
            />
          </div>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
            placeholder="Search by number, name, or UUID..."
            className={`${INPUT_CLS} pl-11 pr-11`}
          />

          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#8A8F98] transition hover:text-[#9A5B00]"
              title="Clear search"
            >
              <X size={18} />
            </button>
          )}

        </div>

        {searchTerm.trim() && (
          <p className="mt-2 text-xs font-medium text-[#6B7280]">
            Showing{" "}
            <span className="font-bold text-[#9A5B00]">
              {filteredUsers.length}
            </span>{" "}
            of {users.length} users
          </p>
        )}
      </div>

      {/* =====================================
          SUCCESS MESSAGE
      ===================================== */}

      {message && (
        <div className="flex items-center justify-between rounded-xl border border-[#12A36B]/30 bg-[#E6F6EF] px-4 py-3 text-sm font-medium text-[#0E7A52]">

          <span>{message}</span>

          <button
            type="button"
            onClick={() =>
              dispatch(clearAdminMessage())
            }
            className="ml-4 text-lg font-bold text-[#0E7A52] transition hover:text-[#075B3D]"
          >
            ×
          </button>

        </div>
      )}

      {/* =====================================
          ERROR MESSAGE
      ===================================== */}

      {(usersError || error) && (
        <div className="flex items-center justify-between rounded-xl border border-[#D93025]/30 bg-[#FDE8E6] px-4 py-3 text-sm font-medium text-[#B3261E]">

          <span>{usersError || error}</span>

          <button
            type="button"
            onClick={() =>
              dispatch(clearAdminError())
            }
            className="ml-4 text-lg font-bold text-[#B3261E] transition hover:text-[#7F1712]"
          >
            ×
          </button>

        </div>
      )}

      {/* =====================================
          USERS TABLE
      ===================================== */}

      <div className={`overflow-hidden ${CARD_CLS}`}>

        <div className="border-b border-[#F3E7C4] px-6 py-4">
          <div className="flex items-center justify-between">

            <div>
              <h2 className="font-black text-[#1A1A1A]">
                All Users
              </h2>

              <p className="mt-1 text-xs text-[#6B7280]">
                {filteredUsers.length} user(s)
              </p>
            </div>

          </div>
        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1050px]">

            {/* =================================
                TABLE HEADER
            ================================= */}

            <thead className="bg-[#FFF9E3]">

              <tr>

                <th className={TH_CLS}>
                  #
                </th>

                <th className={TH_CLS}>
                  User
                </th>

                <th className={TH_CLS}>
                  Mobile
                </th>

                <th className={TH_CLS}>
                  Role
                </th>

                <th className={TH_CLS}>
                  Tickets
                </th>

                <th className={TH_CLS}>
                  UUID
                </th>

                <th className={TH_CLS}>
                  Created
                </th>

                <th className={`${TH_CLS} !text-right`}>
                  Action
                </th>

              </tr>

            </thead>

            {/* =================================
                TABLE BODY
            ================================= */}

            <tbody className="divide-y divide-[#F3E7C4]">

              {usersLoading ? (

                <tr>

                  <td
                    colSpan="9"
                    className="px-6 py-16 text-center"
                  >

                    <div className="flex flex-col items-center justify-center">

                      <div className="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-[#FFEFA8] border-t-[#F7B500]" />

                      <p className="text-sm text-[#6B7280]">
                        Loading users...
                      </p>

                    </div>

                  </td>

                </tr>

              ) : filteredUsers.length > 0 ? (

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
                      className="transition hover:bg-[#FFFDF7]"
                    >

                      {/* NUMBER */}

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-[#8A8F98]">
                        {index + 1}
                      </td>

                      {/* USER */}

                      <td className="px-6 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFEFA8] text-sm font-black text-[#1A1204] ring-1 ring-[#F2B705]">
                            {user.name
                              ?.charAt(0)
                              ?.toUpperCase() || "U"}
                          </div>

                          <div className="min-w-0">

                            <p className="truncate font-semibold text-[#1A1A1A]">
                              {user.name || "-"}
                            </p>

                            <p className="text-xs text-[#6B7280]">
                              User
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* MOBILE */}

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-[#1A1A1A]">
                        {user.mobile || "-"}
                      </td>

                      {/* ROLE */}

                      <td className="px-6 py-4">

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                            user.role === "admin"
                              ? "bg-[#FFEFA8] text-[#9A5B00] ring-1 ring-[#F2B705]/60"
                              : "bg-[#FFF4C8] text-[#9A5B00] ring-1 ring-[#F2B705]/40"
                          }`}
                        >
                          {user.role || "user"}
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
                          className={`inline-flex min-w-[48px] items-center justify-center rounded-lg px-3 py-2 text-sm font-black transition ${
                            ticketCount > 0
                              ? "border border-[#F2B705] bg-[#FFEFA8] text-[#9A5B00] hover:bg-[#FFE680]"
                              : "cursor-not-allowed bg-[#F5F1E4] text-[#8A8F98]"
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

                        <span className="inline-block max-w-[180px] truncate rounded-md bg-[#FFF9E3] px-2 py-1 font-mono text-xs text-[#6B7280] ring-1 ring-[#F3E7C4]">
                          {user.uuid || "-"}
                        </span>

                      </td>

                      {/* CREATED */}

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-[#6B7280]">
                        {formatDate(user.createdAt)}
                      </td>

                      {/* ACTION */}

                      <td className="px-6 py-4 text-right">

                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(user)
                          }
                          className={`rounded-xl px-4 py-2 text-sm transition ${GOLD_BTN}`}
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

                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#FFEFA8] text-[#1A1204] ring-2 ring-[#F2B705]">
                        {searchTerm.trim() ? (
                          <Search size={24} />
                        ) : (
                          <UserRound size={24} />
                        )}
                      </div>

                      <p className="font-bold text-[#1A1A1A]">
                        {searchTerm.trim()
                          ? "No matching users found"
                          : "No users found"}
                      </p>

                      <p className="mt-1 text-sm text-[#6B7280]">
                        {searchTerm.trim()
                          ? `No results for "${searchTerm}"`
                          : "There are no registered users."}
                      </p>

                      {searchTerm.trim() && (
                        <button
                          type="button"
                          onClick={() =>
                            setSearchTerm("")
                          }
                          className={`mt-4 rounded-xl px-4 py-2 text-sm transition ${GOLD_BTN}`}
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
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1A1204]/60 p-4 backdrop-blur-[2px]"
          onClick={handleCloseTickets}
        >

          <div
            className="w-full max-w-6xl overflow-hidden rounded-2xl border border-[#F3E7C4] bg-white shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-[#F3E7C4] px-6 py-5">

              <div>

                <h2 className="text-xl font-black text-[#1A1A1A]">
                  User Tickets
                </h2>

                <p className="mt-1 text-sm text-[#6B7280]">

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
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#8A8F98] transition hover:bg-[#FFEFA8] hover:text-[#9A5B00]"
              >
                <X size={19} />
              </button>

            </div>

            {/* SUMMARY */}

            <div className="grid grid-cols-1 gap-4 border-b border-[#F3E7C4] bg-[#FFF9E3] p-5 sm:grid-cols-2 md:grid-cols-4">

              {/* TOTAL TICKETS */}

              <div className={`p-4 ${CARD_CLS}`}>

                <p className="text-xs font-semibold text-[#8A8F98]">
                  Total Tickets
                </p>

                <p className="mt-1 text-2xl font-black text-[#9A5B00]">
                  {
                    selectedTicketsUser
                      .tickets.length
                  }
                </p>

              </div>

              {/* TOTAL AMOUNT */}

              <div className={`p-4 ${CARD_CLS}`}>

                <p className="text-xs font-semibold text-[#8A8F98]">
                  Total Amount
                </p>

                <p className="mt-1 text-2xl font-black text-[#1A1A1A]">
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

              <div className={`p-4 ${CARD_CLS}`}>

                <p className="text-xs font-semibold text-[#8A8F98]">
                  User
                </p>

                <p className="mt-1 truncate text-lg font-black text-[#1A1A1A]">
                  {selectedTicketsUser.user.name ||
                    "-"}
                </p>

              </div>

              {/* MOBILE */}

              <div className={`p-4 ${CARD_CLS}`}>

                <p className="text-xs font-semibold text-[#8A8F98]">
                  Mobile
                </p>

                <p className="mt-1 text-lg font-black text-[#1A1A1A]">
                  {selectedTicketsUser.user.mobile ||
                    "-"}
                </p>

              </div>

            </div>

            {/* TICKET TABLE */}

            <div className="max-h-[60vh] overflow-auto">

              <table className="w-full min-w-[950px]">

                <thead className="sticky top-0 z-10 bg-[#FFF9E3]">

                  <tr>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#9A5B00]">
                      #
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#9A5B00]">
                      Lottery
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#9A5B00]">
                      Number
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#9A5B00]">
                      Amount
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#9A5B00]">
                      Draw Date
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#9A5B00]">
                      Draw Time
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#9A5B00]">
                      Status
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#9A5B00]">
                      Entry Date
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-[#F3E7C4]">

                  {selectedTicketsUser.tickets.map(
                    (ticket, index) => (

                      <tr
                        key={
                          ticket._id ||
                          `${ticket.lotteryId}-${index}`
                        }
                        className="transition hover:bg-[#FFFDF7]"
                      >

                        {/* NUMBER */}

                        <td className="px-5 py-4 text-sm text-[#8A8F98]">
                          {index + 1}
                        </td>

                        {/* LOTTERY */}

                        <td className="px-5 py-4">

                          <p className="font-semibold text-[#1A1A1A]">
                            {ticket.marketName ||
                              "-"}
                          </p>

                          {ticket.lotteryId && (
                            <p className="mt-1 max-w-[150px] truncate font-mono text-[10px] text-[#8A8F98]">
                              {ticket.lotteryId}
                            </p>
                          )}

                        </td>

                        {/* NUMBER */}

                        <td className="px-5 py-4">

                          <span className="rounded-md bg-[#FFEFA8] px-3 py-1 font-mono text-sm font-black tracking-wider text-[#1A1204] ring-1 ring-[#F2B705]/60">
                            {ticket.number || "-"}
                          </span>

                        </td>

                        {/* AMOUNT */}

                        <td className="px-5 py-4 text-sm font-bold text-[#1A1A1A]">
                          ₹
                          {Number(
                            ticket.amount || 0
                          ).toFixed(2)}
                        </td>

                        {/* DRAW DATE */}

                        <td className="px-5 py-4 text-sm text-[#1A1A1A]">
                          {formatDate(
                            ticket.drawDate
                          )}
                        </td>

                        {/* DRAW TIME */}

                        <td className="px-5 py-4 text-sm text-[#1A1A1A]">
                          {ticket.drawTime || "-"}
                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                              ticket.status ===
                              "won"
                                ? "bg-[#E6F6EF] text-[#12A36B]"
                                : ticket.status ===
                                  "lost"
                                ? "bg-[#FDE8E6] text-[#D93025]"
                                : "bg-[#FFEFA8] text-[#9A5B00]"
                            }`}
                          >
                            {ticket.status ||
                              "pending"}
                          </span>

                        </td>

                        {/* ENTRY DATE */}

                        <td className="px-5 py-4 text-sm text-[#6B7280]">
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

            <div className="flex justify-end border-t border-[#F3E7C4] bg-[#FFF9E3] px-6 py-4">

              <button
                type="button"
                onClick={handleCloseTickets}
                className={`rounded-xl px-5 py-2.5 text-sm transition ${GOLD_BTN}`}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1204]/60 p-4 backdrop-blur-[2px]"
          onClick={handleCloseEdit}
        >

          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-[#F3E7C4] bg-white shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-[#F3E7C4] px-6 py-5">

              <div>

                <h2 className="text-lg font-black text-[#1A1A1A]">
                  Edit User
                </h2>

                <p className="mt-1 text-xs text-[#6B7280]">
                  Update user profile information
                </p>

              </div>

              <button
                type="button"
                onClick={handleCloseEdit}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#8A8F98] transition hover:bg-[#FFEFA8] hover:text-[#9A5B00]"
              >
                <X size={18} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleUpdate}
              className="space-y-5 p-6"
            >

              {/* NAME */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-[#1A1A1A]">
                  Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={INPUT_CLS}
                  placeholder="Enter user name"
                />

              </div>

              {/* MOBILE */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-[#1A1A1A]">
                  Mobile
                </label>

                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                  className={INPUT_CLS}
                  placeholder="Enter mobile number"
                />

              </div>

              {/* PASSWORD */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-[#1A1A1A]">
                  New Password
                </label>

                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  minLength={6}
                  className={INPUT_CLS}
                  placeholder="Leave empty to keep current"
                />

                <p className="mt-1.5 text-xs text-[#8A8F98]">
                  Leave empty if you don't want to
                  change the password.
                </p>

              </div>

              {/* UUID */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-[#1A1A1A]">
                  UUID
                </label>

                <div className="rounded-xl border border-[#F3E7C4] bg-[#FFF9E3] px-4 py-3 font-mono text-xs break-all text-[#6B7280]">
                  {selectedUser.uuid}
                </div>

              </div>

              {/* BUTTONS */}

              <div className="flex gap-3 pt-2">

                <button
                  type="button"
                  onClick={handleCloseEdit}
                  disabled={updateLoading}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${OUTLINE_BTN}`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updateLoading}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${GOLD_BTN}`}
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