import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Calendar, Clock } from "lucide-react";

import {
  createLotteryConfig,
  getAllLotteryConfigs,
  getLotteryConfigById,
  getActiveLotteryConfig,
  activateLotteryConfig,
  deactivateLotteryConfig,
  updateUserLotteryEntry,
  deleteUserLotteryEntry,
  deleteLotteryConfig,
  clearLotteryError,
  clearLotteryMessage,
} from "../../reducer/slice/adminLotteryReducer";

import { getAllUsers } from "../../reducer/slice/adminAuthReducer";

/* =========================================================
   WINZOX THEME TOKENS  (Bright Gold + White)
   bg          #FFFDF7
   border      #F3E7C4
   gold        #FFD83D -> #F7B500 -> #E39A00
   gold-soft   #FFEFA8
   gold-line   #F2B705
   on-gold     #1A1204  (text on gold is DARK)
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
  "w-full rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] py-2.5 text-sm text-[#1A1A1A] outline-none transition placeholder:text-[#8A8F98] focus:border-[#F2B705] focus:ring-2 focus:ring-[#FFEFA8]";

const LABEL_CLS = "mb-2 block text-sm font-semibold text-[#1A1A1A]";

const CARD_CLS =
  "rounded-2xl border border-[#F3E7C4] bg-white shadow-[0_6px_18px_-10px_rgba(247,181,0,0.35)]";

const TH_CLS =
  "whitespace-nowrap px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#9A5B00]";

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

const AdminLottery = () => {
  const dispatch = useDispatch();

  // =====================================================
  // LOTTERY SLICE
  // =====================================================

  const {
    lotteries,
    lottery,
    activeLottery,
    loading,
    createLoading,
    updateLoading,
    deleteLoading,
    actionLoading,
    error,
    message,
  } = useSelector((state) => state.adminLottery);

  // =====================================================
  // USERS (adminAuth slice) — for name lookup
  // =====================================================

  const {
    users = [],
    usersLoading,
  } = useSelector((state) => state.adminAuth);

  // =====================================================
  // USER LOOKUP MAP  (userId / uuid -> user object)
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
  // RESOLVE USER NAME FROM userId
  // =====================================================

  const getUserName = (userId) => {
    if (!userId) return "-";

    // If userId is already a populated object
    if (typeof userId === "object") {
      return (
        userId.name ||
        userId.fullName ||
        userId.username ||
        userId.email ||
        String(userId._id || "-")
      );
    }

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

  // =====================================================
  // FORM STATE
  // =====================================================

  const getInitialFormData = () => ({
    marketName: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),

    // Draw Date & Draw Time
    drawDate: getToday(),
    drawTime: "18:30",

    prizes: {
      first: "",
      second: "",
      third: "",
    },
  });

  const [formData, setFormData] = useState(getInitialFormData());

  const [formError, setFormError] = useState("");

  // =====================================================
  // UPDATE ENTRY MODAL
  // =====================================================

  const [editingEntry, setEditingEntry] = useState(null);

  const [editData, setEditData] = useState({
    number: "",
    amount: "",
    status: "pending",
    entryDate: "",
  });

  // =====================================================
  // GET ALL MARKETS + USERS
  // =====================================================

  useEffect(() => {
    dispatch(getAllLotteryConfigs());
    dispatch(getAllUsers());

    return () => {
      dispatch(clearLotteryError());
      dispatch(clearLotteryMessage());
    };
  }, [dispatch]);

  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Prize inputs
    if (name === "firstPrize") {
      setFormData((prev) => ({
        ...prev,
        prizes: {
          ...prev.prizes,
          first: value,
        },
      }));

      setFormError("");
      return;
    }

    if (name === "secondPrize") {
      setFormData((prev) => ({
        ...prev,
        prizes: {
          ...prev.prizes,
          second: value,
        },
      }));

      setFormError("");
      return;
    }

    if (name === "thirdPrize") {
      setFormData((prev) => ({
        ...prev,
        prizes: {
          ...prev.prizes,
          third: value,
        },
      }));

      setFormError("");
      return;
    }

    // Normal inputs (includes drawDate & drawTime)
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFormError("");
  };

  // =====================================================
  // CREATE MARKET
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setFormError("");

    // Market name
    if (!formData.marketName.trim()) {
      setFormError("Market name is required");
      return;
    }

    // Month
    if (!formData.month) {
      setFormError("Month is required");
      return;
    }

    // Year
    if (!formData.year) {
      setFormError("Year is required");
      return;
    }

    // Draw Date validation
    if (!formData.drawDate) {
      setFormError("Draw date is required");
      return;
    }

    // Draw Time validation
    if (!formData.drawTime) {
      setFormError("Draw time is required");
      return;
    }

    // Past date validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = new Date(`${formData.drawDate}T00:00:00`);

    if (Number.isNaN(selectedDate.getTime())) {
      setFormError("Invalid draw date");
      return;
    }

    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setFormError("Past draw date cannot be selected");
      return;
    }

    // Time format validation
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(formData.drawTime)) {
      setFormError("Invalid draw time");
      return;
    }

    // First prize
    if (
      formData.prizes.first === "" ||
      formData.prizes.first === null ||
      Number(formData.prizes.first) < 0
    ) {
      setFormError("First prize amount is required");
      return;
    }

    // Second prize
    if (
      formData.prizes.second === "" ||
      formData.prizes.second === null ||
      Number(formData.prizes.second) < 0
    ) {
      setFormError("Second prize amount is required");
      return;
    }

    // Third prize
    if (
      formData.prizes.third === "" ||
      formData.prizes.third === null ||
      Number(formData.prizes.third) < 0
    ) {
      setFormError("Third prize amount is required");
      return;
    }

    const payload = {
      marketName: formData.marketName.trim(),

      month: Number(formData.month),

      year: Number(formData.year),

      drawDate: formData.drawDate,

      drawTime: formData.drawTime,

      prizes: {
        first: Number(formData.prizes.first),
        second: Number(formData.prizes.second),
        third: Number(formData.prizes.third),
      },
    };

    console.log("CREATE MARKET PAYLOAD:", payload);

    const result = await dispatch(createLotteryConfig(payload));

    if (createLotteryConfig.fulfilled.match(result)) {
      setFormData(getInitialFormData());

      await dispatch(getAllLotteryConfigs());
    }
  };

  // =====================================================
  // GET MARKET BY ID
  // =====================================================

  const handleViewMarket = async (id) => {
    await dispatch(getLotteryConfigById(id));
  };

  // =====================================================
  // GET ACTIVE MARKET
  // =====================================================

  const handleGetActiveMarket = async () => {
    await dispatch(getActiveLotteryConfig());
  };

  // =====================================================
  // ACTIVATE MARKET
  // =====================================================

  const handleActivate = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to activate this market?"
      )
    ) {
      return;
    }

    const result = await dispatch(activateLotteryConfig(id));

    if (activateLotteryConfig.fulfilled.match(result)) {
      await dispatch(getAllLotteryConfigs());
    }
  };

  // =====================================================
  // DEACTIVATE MARKET
  // =====================================================

  const handleDeactivate = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to deactivate this market?"
      )
    ) {
      return;
    }

    const result = await dispatch(deactivateLotteryConfig(id));

    if (deactivateLotteryConfig.fulfilled.match(result)) {
      await dispatch(getAllLotteryConfigs());
    }
  };

  // =====================================================
  // DELETE MARKET
  // =====================================================

  const handleDeleteMarket = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this market?"
      )
    ) {
      return;
    }

    const result = await dispatch(deleteLotteryConfig(id));

    if (deleteLotteryConfig.fulfilled.match(result)) {
      await dispatch(getAllLotteryConfigs());
    }
  };

  // =====================================================
  // OPEN EDIT ENTRY
  // =====================================================

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);

    setEditData({
      number: entry.number || "",
      amount:
        entry.amount !== undefined && entry.amount !== null
          ? entry.amount
          : "",
      status: entry.status || "pending",
      entryDate: entry.entryDate || "",
    });
  };

  // =====================================================
  // EDIT INPUT CHANGE
  // =====================================================

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // UPDATE USER ENTRY
  // =====================================================

  const handleUpdateEntry = async (e) => {
    e.preventDefault();

    if (!lottery?._id) return;

    if (!editingEntry?._id) return;

    if (!editData.number || String(editData.number).length !== 6) {
      return;
    }

    if (editData.amount === "" || Number(editData.amount) < 0) {
      return;
    }

    const result = await dispatch(
      updateUserLotteryEntry({
        id: lottery._id,

        userEntryId: editingEntry._id,

        data: {
          number: editData.number,
          amount: Number(editData.amount),
          status: editData.status,
          entryDate: editData.entryDate,
        },
      })
    );

    if (updateUserLotteryEntry.fulfilled.match(result)) {
      closeEditModal();

      await dispatch(getLotteryConfigById(lottery._id));

      dispatch(getAllLotteryConfigs());
    }
  };

  // =====================================================
  // DELETE USER ENTRY
  // =====================================================

  const handleDeleteEntry = async (configId, entryId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user entry?"
      )
    ) {
      return;
    }

    const result = await dispatch(
      deleteUserLotteryEntry({
        id: configId,
        userEntryId: entryId,
      })
    );

    if (deleteUserLotteryEntry.fulfilled.match(result)) {
      await dispatch(getLotteryConfigById(configId));

      dispatch(getAllLotteryConfigs());
    }
  };

  // =====================================================
  // MONTH NAME
  // =====================================================

  const getMonthName = (month) => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    return months[Number(month) - 1] || "-";
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

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

  // =====================================================
  // CLOSE ENTRY MODAL
  // =====================================================

  const closeEditModal = () => {
    setEditingEntry(null);

    setEditData({
      number: "",
      amount: "",
      status: "pending",
      entryDate: "",
    });
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#1A1A1A]">
              Lottery Markets
            </h1>

            <p className="mt-1 text-sm text-[#6B7280]">
              Create and manage monthly lottery markets.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGetActiveMarket}
            disabled={loading}
            className={`rounded-xl px-5 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${GOLD_BTN}`}
          >
            {loading ? "Loading..." : "Get Active Market"}
          </button>
        </div>

        {/* =================================================
            SUCCESS MESSAGE
        ================================================= */}

        {message && (
          <div className="mb-5 rounded-xl border border-[#12A36B]/30 bg-[#E6F6EF] px-4 py-3 text-sm font-medium text-[#0E7A52]">
            {message}
          </div>
        )}

        {/* =================================================
            ERROR MESSAGE
        ================================================= */}

        {(error || formError) && (
          <div className="mb-5 rounded-xl border border-[#D93025]/30 bg-[#FDE8E6] px-4 py-3 text-sm font-medium text-[#B3261E]">
            {formError || error}
          </div>
        )}

        {/* =================================================
            ACTIVE MARKET
        ================================================= */}

        {activeLottery && (
          <div className="mb-8 rounded-2xl border border-[#F2B705] bg-[#FFF9E3] p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#9A5B00]">
                  Active Market
                </p>

                <h2 className="mt-1 text-lg font-black text-[#1A1A1A]">
                  {activeLottery.marketName}
                </h2>

                <p className="mt-1 text-sm text-[#6B7280]">
                  {getMonthName(activeLottery.month)}{" "}
                  {activeLottery.year}
                </p>

                {/* Active Draw Date & Time */}

                <div className="mt-2 flex flex-wrap gap-2">
                  {activeLottery.drawDate && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1A1A] ring-1 ring-[#F3E7C4]">
                      <Calendar size={13} className="text-[#9A5B00]" />
                      Draw Date: {formatDate(activeLottery.drawDate)}
                    </span>
                  )}

                  {activeLottery.drawTime && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1A1A] ring-1 ring-[#F3E7C4]">
                      <Clock size={13} className="text-[#9A5B00]" />
                      Draw Time: {activeLottery.drawTime}
                    </span>
                  )}
                </div>

                {/* Active Prize Amounts */}

                {activeLottery.prizes && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-lg bg-[#FFEFA8] px-3 py-2 text-xs font-bold text-[#1A1204] ring-1 ring-[#F2B705]/60">
                      1st: ₹
                      {Number(
                        activeLottery.prizes.first || 0
                      ).toLocaleString("en-IN")}
                    </span>

                    <span className="rounded-lg bg-[#FFEFA8] px-3 py-2 text-xs font-bold text-[#1A1204] ring-1 ring-[#F2B705]/60">
                      2nd: ₹
                      {Number(
                        activeLottery.prizes.second || 0
                      ).toLocaleString("en-IN")}
                    </span>

                    <span className="rounded-lg bg-[#FFEFA8] px-3 py-2 text-xs font-bold text-[#1A1204] ring-1 ring-[#F2B705]/60">
                      3rd: ₹
                      {Number(
                        activeLottery.prizes.third || 0
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
              </div>

              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#12A36B] px-4 py-1.5 text-xs font-bold text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                Active
              </span>
            </div>
          </div>
        )}

        {/* =================================================
            CREATE MARKET
        ================================================= */}

        <div className={`mb-8 ${CARD_CLS}`}>
          <div className="border-b border-[#F3E7C4] px-5 py-4">
            <h2 className="text-lg font-black text-[#1A1A1A]">
              Create Market
            </h2>

            <p className="mt-1 text-sm text-[#6B7280]">
              Create a lottery market and set prize amounts.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {/* Market Name */}

              <div>
                <label className={LABEL_CLS}>Market Name</label>

                <input
                  type="text"
                  name="marketName"
                  value={formData.marketName}
                  onChange={handleChange}
                  placeholder="Enter market name"
                  className={`${INPUT_CLS} px-4`}
                />
              </div>

              {/* Month */}

              <div>
                <label className={LABEL_CLS}>Month</label>

                <select
                  name="month"
                  value={formData.month}
                  onChange={handleChange}
                  className={`${INPUT_CLS} px-4`}
                >
                  {[
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                  ].map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year */}

              <div>
                <label className={LABEL_CLS}>Year</label>

                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  min="2000"
                  placeholder="Enter year"
                  className={`${INPUT_CLS} px-4`}
                />
              </div>

              {/* DRAW DATE */}

              <div>
                <label className={LABEL_CLS}>Draw Date</label>

                <input
                  type="date"
                  name="drawDate"
                  value={formData.drawDate}
                  onChange={handleChange}
                  min={getToday()}
                  className={`${INPUT_CLS} px-4`}
                />

                <p className="mt-1 text-xs text-[#6B7280]">
                  Past dates are not allowed.
                </p>
              </div>

              {/* DRAW TIME */}

              <div>
                <label className={LABEL_CLS}>Draw Time</label>

                <input
                  type="time"
                  name="drawTime"
                  value={formData.drawTime}
                  onChange={handleChange}
                  className={`${INPUT_CLS} px-4`}
                />

                <p className="mt-1 text-xs text-[#6B7280]">
                  Select the draw time.
                </p>
              </div>

              {/* FIRST PRIZE */}

              <div>
                <label className={LABEL_CLS}>1st Prize Amount</label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#9A5B00]">
                    ₹
                  </span>

                  <input
                    type="number"
                    name="firstPrize"
                    value={formData.prizes.first}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    placeholder="Enter 1st prize"
                    className={`${INPUT_CLS} pl-9 pr-4`}
                  />
                </div>
              </div>

              {/* SECOND PRIZE */}

              <div>
                <label className={LABEL_CLS}>2nd Prize Amount</label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#9A5B00]">
                    ₹
                  </span>

                  <input
                    type="number"
                    name="secondPrize"
                    value={formData.prizes.second}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    placeholder="Enter 2nd prize"
                    className={`${INPUT_CLS} pl-9 pr-4`}
                  />
                </div>
              </div>

              {/* THIRD PRIZE */}

              <div>
                <label className={LABEL_CLS}>3rd Prize Amount</label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#9A5B00]">
                    ₹
                  </span>

                  <input
                    type="number"
                    name="thirdPrize"
                    value={formData.prizes.third}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    placeholder="Enter 3rd prize"
                    className={`${INPUT_CLS} pl-9 pr-4`}
                  />
                </div>
              </div>
            </div>

            {/* Prize Preview */}

            <div className="mt-5 rounded-xl border border-[#F3E7C4] bg-[#FFF9E3] p-4">
              <p className="mb-3 text-sm font-bold text-[#1A1A1A]">
                Prize Summary
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-white p-3 ring-1 ring-[#F3E7C4]">
                  <p className="text-xs font-semibold text-[#8A8F98]">
                    1st Prize
                  </p>

                  <p className="mt-1 text-lg font-black text-[#1A1A1A]">
                    ₹
                    {Number(
                      formData.prizes.first || 0
                    ).toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-3 ring-1 ring-[#F3E7C4]">
                  <p className="text-xs font-semibold text-[#8A8F98]">
                    2nd Prize
                  </p>

                  <p className="mt-1 text-lg font-black text-[#1A1A1A]">
                    ₹
                    {Number(
                      formData.prizes.second || 0
                    ).toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-3 ring-1 ring-[#F3E7C4]">
                  <p className="text-xs font-semibold text-[#8A8F98]">
                    3rd Prize
                  </p>

                  <p className="mt-1 text-lg font-black text-[#1A1A1A]">
                    ₹
                    {Number(
                      formData.prizes.third || 0
                    ).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>

            {/* Submit */}

            <div className="mt-5 flex justify-end">
              <button
                type="submit"
                disabled={createLoading}
                className={`rounded-xl px-6 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${GOLD_BTN}`}
              >
                {createLoading ? "Creating..." : "Create Market"}
              </button>
            </div>
          </form>
        </div>

        {/* =================================================
            SELECTED MARKET
        ================================================= */}

        {lottery && (
          <div className="mb-8 rounded-2xl border border-[#F2B705]/60 bg-[#FFF9E3] shadow-[0_6px_18px_-10px_rgba(247,181,0,0.35)]">
            <div className="flex flex-col gap-3 border-b border-[#F3E7C4] px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-black text-[#1A1A1A]">
                  {lottery.marketName}
                </h2>

                <p className="mt-1 text-sm text-[#6B7280]">
                  {getMonthName(lottery.month)} {lottery.year} •{" "}
                  {lottery.users?.length || 0} Users
                </p>

                {/* Selected Market Draw Date & Time */}

                <div className="mt-2 flex flex-wrap gap-2">
                  {lottery.drawDate && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1A1A] ring-1 ring-[#F3E7C4]">
                      <Calendar size={13} className="text-[#9A5B00]" />
                      {formatDate(lottery.drawDate)}
                    </span>
                  )}

                  {lottery.drawTime && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1A1A] ring-1 ring-[#F3E7C4]">
                      <Clock size={13} className="text-[#9A5B00]" />
                      {lottery.drawTime}
                    </span>
                  )}
                </div>

                {/* Selected Market Prize */}

                {lottery.prizes && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#FFEFA8] px-3 py-1.5 text-xs font-bold text-[#1A1204] ring-1 ring-[#F2B705]/60">
                      1st: ₹
                      {Number(
                        lottery.prizes.first || 0
                      ).toLocaleString("en-IN")}
                    </span>

                    <span className="rounded-full bg-[#FFEFA8] px-3 py-1.5 text-xs font-bold text-[#1A1204] ring-1 ring-[#F2B705]/60">
                      2nd: ₹
                      {Number(
                        lottery.prizes.second || 0
                      ).toLocaleString("en-IN")}
                    </span>

                    <span className="rounded-full bg-[#FFEFA8] px-3 py-1.5 text-xs font-bold text-[#1A1204] ring-1 ring-[#F2B705]/60">
                      3rd: ₹
                      {Number(
                        lottery.prizes.third || 0
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  dispatch(getLotteryConfigById(lottery._id))
                }
                disabled={loading}
                className={`rounded-xl px-4 py-2 text-sm transition disabled:opacity-60 ${OUTLINE_BTN}`}
              >
                Refresh Details
              </button>
            </div>

            {/* User Entries */}

            <div className="overflow-x-auto">
              {lottery.users?.length > 0 ? (
                <table className="min-w-full">
                  <thead className="bg-white">
                    <tr>
                      <th className={TH_CLS}>#</th>
                      <th className={TH_CLS}>User</th>
                      <th className={TH_CLS}>Number</th>
                      <th className={TH_CLS}>Amount</th>
                      <th className={TH_CLS}>Prize</th>
                      <th className={TH_CLS}>Date</th>
                      <th className={TH_CLS}>Status</th>
                      <th className={TH_CLS}>Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#F3E7C4]">
                    {lottery.users.map((entry, index) => (
                      <tr
                        key={entry._id}
                        className="bg-white hover:bg-[#FFFDF7]"
                      >
                        <td className="px-5 py-4 text-sm text-[#8A8F98]">
                          {index + 1}
                        </td>

                        {/* USER NAME + ID */}

                        <td className="px-5 py-4 text-sm text-[#1A1A1A]">
                          <div className="font-semibold text-[#1A1A1A]">
                            {getUserName(entry.userId)}
                          </div>

                          <div className="mt-0.5 max-w-[180px] truncate text-xs text-[#8A8F98]">
                            {typeof entry.userId === "object"
                              ? entry.userId?._id
                              : entry.userId}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-[#FFEFA8] px-3 py-1 text-sm font-black tracking-wider text-[#1A1204] ring-1 ring-[#F2B705]/60">
                            {entry.number}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-[#1A1A1A]">
                          ₹
                          {Number(entry.amount || 0).toLocaleString(
                            "en-IN"
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-[#1A1A1A]">
                          {entry.status === "win" ? (
                            <div>
                              <span className="text-[#12A36B]">
                                {entry.prizeType || "Winner"}
                              </span>

                              {entry.prize && (
                                <div className="mt-1 text-xs text-[#6B7280]">
                                  ₹
                                  {Number(
                                    entry.prize.first ||
                                      entry.prize.second ||
                                      entry.prize.third ||
                                      0
                                  ).toLocaleString("en-IN")}
                                </div>
                              )}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-[#6B7280]">
                          {entry.entryDate}
                        </td>

                        <td className="px-5 py-4">
                          {entry.status === "win" ? (
                            <span className="rounded-full bg-[#E6F6EF] px-3 py-1 text-xs font-bold text-[#12A36B]">
                              Win
                            </span>
                          ) : entry.status === "lost" ? (
                            <span className="rounded-full bg-[#FDE8E6] px-3 py-1 text-xs font-bold text-[#D93025]">
                              Lost
                            </span>
                          ) : (
                            <span className="rounded-full bg-[#FFEFA8] px-3 py-1 text-xs font-bold text-[#9A5B00]">
                              Pending
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditEntry(entry)}
                              className={`rounded-lg px-3 py-1.5 text-xs transition ${GOLD_BTN}`}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteEntry(
                                  lottery._id,
                                  entry._id
                                )
                              }
                              disabled={deleteLoading}
                              className="rounded-lg bg-[#D93025] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#B3261E] disabled:opacity-50"
                            >
                              {deleteLoading ? "..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="bg-white p-8 text-center text-sm text-[#6B7280]">
                  No user entries found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================
            ALL MARKETS
        ================================================= */}

        <div className={CARD_CLS}>
          <div className="flex flex-col gap-3 border-b border-[#F3E7C4] px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-black text-[#1A1A1A]">
                All Markets
              </h2>

              <p className="mt-1 text-sm text-[#6B7280]">
                Total markets: {lotteries?.length || 0}
              </p>
            </div>

            <button
              type="button"
              onClick={() => dispatch(getAllLotteryConfigs())}
              disabled={loading}
              className={`rounded-xl px-4 py-2 text-sm transition disabled:opacity-60 ${OUTLINE_BTN}`}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <div className="text-sm text-[#6B7280]">
                Loading markets...
              </div>
            </div>
          ) : lotteries?.length === 0 ? (
            <div className="flex min-h-[250px] items-center justify-center px-5">
              <div className="text-center">
                <h3 className="text-base font-bold text-[#1A1A1A]">
                  No markets found
                </h3>

                <p className="mt-1 text-sm text-[#6B7280]">
                  Create your first lottery market above.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-[#FFF9E3]">
                  <tr>
                    <th className={TH_CLS}>#</th>
                    <th className={TH_CLS}>Market</th>
                    <th className={TH_CLS}>Month</th>
                    <th className={TH_CLS}>Year</th>
                    <th className={TH_CLS}>Draw Date</th>
                    <th className={TH_CLS}>Draw Time</th>
                    <th className={TH_CLS}>Prize Amounts</th>
                    <th className={TH_CLS}>Users</th>
                    <th className={TH_CLS}>Status</th>
                    <th className={TH_CLS}>Created</th>
                    <th className={TH_CLS}>Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#F3E7C4]">
                  {lotteries.map((lotteryItem, index) => (
                    <tr
                      key={lotteryItem._id}
                      className="transition hover:bg-[#FFFDF7]"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-[#8A8F98]">
                        {index + 1}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="font-semibold text-[#1A1A1A]">
                          {lotteryItem.marketName}
                        </div>

                        <div className="mt-1 text-xs text-[#8A8F98]">
                          ID: {lotteryItem._id}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-[#1A1A1A]">
                        {getMonthName(lotteryItem.month)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-[#1A1A1A]">
                        {lotteryItem.year}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-[#1A1A1A]">
                        {formatDate(lotteryItem.drawDate)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        {lotteryItem.drawTime ? (
                          <span className="rounded-lg bg-[#FFEFA8] px-3 py-1.5 text-xs font-bold text-[#9A5B00] ring-1 ring-[#F2B705]/60">
                            {lotteryItem.drawTime}
                          </span>
                        ) : (
                          <span className="text-sm text-[#8A8F98]">-</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {lotteryItem.prizes ? (
                          <div className="flex min-w-[220px] flex-wrap gap-1.5">
                            <span className="rounded-md bg-[#FFF9E3] px-2 py-1 text-xs font-semibold text-[#9A5B00] ring-1 ring-[#F3E7C4]">
                              1st ₹
                              {Number(
                                lotteryItem.prizes.first || 0
                              ).toLocaleString("en-IN")}
                            </span>

                            <span className="rounded-md bg-[#FFF9E3] px-2 py-1 text-xs font-semibold text-[#9A5B00] ring-1 ring-[#F3E7C4]">
                              2nd ₹
                              {Number(
                                lotteryItem.prizes.second || 0
                              ).toLocaleString("en-IN")}
                            </span>

                            <span className="rounded-md bg-[#FFF9E3] px-2 py-1 text-xs font-semibold text-[#9A5B00] ring-1 ring-[#F3E7C4]">
                              3rd ₹
                              {Number(
                                lotteryItem.prizes.third || 0
                              ).toLocaleString("en-IN")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-[#8A8F98]">
                            Not configured
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-[#1A1A1A]">
                        {lotteryItem.users?.length || 0}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        {lotteryItem.isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F6EF] px-3 py-1 text-xs font-bold text-[#12A36B]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#12A36B]" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-[#6B7280]">
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-[#6B7280]">
                        {formatDate(lotteryItem.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex min-w-[250px] flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleViewMarket(lotteryItem._id)
                            }
                            disabled={loading}
                            className={`rounded-lg px-3 py-1.5 text-xs transition disabled:opacity-50 ${GOLD_BTN}`}
                          >
                            View
                          </button>

                          {!lotteryItem.isActive && (
                            <button
                              type="button"
                              onClick={() =>
                                handleActivate(lotteryItem._id)
                              }
                              disabled={actionLoading}
                              className="rounded-lg bg-[#12A36B] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#0E8A59] disabled:opacity-50"
                            >
                              {actionLoading ? "..." : "Activate"}
                            </button>
                          )}

                          {lotteryItem.isActive && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDeactivate(lotteryItem._id)
                              }
                              disabled={actionLoading}
                              className="rounded-lg border border-[#F2B705] bg-[#FFEFA8] px-3 py-1.5 text-xs font-bold text-[#9A5B00] transition hover:bg-[#FFE680] disabled:opacity-50"
                            >
                              {actionLoading ? "..." : "Deactivate"}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteMarket(lotteryItem._id)
                            }
                            disabled={deleteLoading}
                            className="rounded-lg bg-[#D93025] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#B3261E] disabled:opacity-50"
                          >
                            {deleteLoading ? "..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          EDIT USER ENTRY MODAL
      ===================================================== */}

      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#F3E7C4] bg-white shadow-xl">
            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-[#F3E7C4] px-5 py-4">
              <div>
                <h2 className="text-lg font-black text-[#1A1A1A]">
                  Edit User Entry
                </h2>

                <p className="mt-1 text-xs text-[#6B7280]">
                  Update lottery entry details.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                className="text-xl text-[#8A8F98] hover:text-[#1A1A1A]"
              >
                ×
              </button>
            </div>

            {/* Form */}

            <form onSubmit={handleUpdateEntry} className="p-5">
              {/* Number */}

              <div className="mb-4">
                <label className={LABEL_CLS}>Lottery Number</label>

                <input
                  type="text"
                  name="number"
                  value={editData.number}
                  onChange={handleEditChange}
                  maxLength={6}
                  placeholder="123456"
                  className={`${INPUT_CLS} px-4`}
                />
              </div>

              {/* Amount */}

              <div className="mb-4">
                <label className={LABEL_CLS}>Entry Amount</label>

                <input
                  type="number"
                  name="amount"
                  value={editData.amount}
                  onChange={handleEditChange}
                  min="0"
                  placeholder="100"
                  className={`${INPUT_CLS} px-4`}
                />
              </div>

              {/* Status */}

              <div className="mb-4">
                <label className={LABEL_CLS}>Status</label>

                <select
                  name="status"
                  value={editData.status}
                  onChange={handleEditChange}
                  className={`${INPUT_CLS} px-4`}
                >
                  <option value="pending">Pending</option>

                  <option value="win">Win</option>

                  <option value="lost">Lost</option>
                </select>
              </div>

              {/* Entry Date */}

              <div className="mb-5">
                <label className={LABEL_CLS}>Entry Date</label>

                <input
                  type="date"
                  name="entryDate"
                  value={editData.entryDate}
                  onChange={handleEditChange}
                  className={`${INPUT_CLS} px-4`}
                />
              </div>

              {/* Buttons */}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className={`rounded-xl px-5 py-2.5 text-sm transition ${OUTLINE_BTN}`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updateLoading}
                  className={`rounded-xl px-5 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${GOLD_BTN}`}
                >
                  {updateLoading ? "Updating..." : "Update Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLottery;