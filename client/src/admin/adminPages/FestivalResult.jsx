import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ClipboardList, RefreshCw, Plus, X, Pencil, Eye, Search } from "lucide-react";

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
} from "../../reducer/slice/festivalResultReducer";

// Namespace import: koi naam missing ho to bhi SyntaxError nahi aata
import * as festivalSlice from "../../reducer/slice/festivalLotteryReducer";

/* =========================================================
   FESTIVAL LIST (dropdown ke liye) - AUTO DETECT
   Festival reducer me "saare festivals laane wala" thunk dhoondhta hai.
   Mila nahi to console me saare thunk naam print hote hain;
   tab FETCH_FESTIVALS_NAME me asli naam likh do.
========================================================= */

const FETCH_FESTIVALS_NAME = ""; // optional: jaise "getFestivalLotteries"

const fetchFestivalsAction = (() => {
  const thunks = Object.keys(festivalSlice).filter(
    (k) =>
      typeof festivalSlice[k] === "function" &&
      typeof festivalSlice[k].fulfilled === "function"
  );

  if (FETCH_FESTIVALS_NAME && festivalSlice[FETCH_FESTIVALS_NAME]) {
    return festivalSlice[FETCH_FESTIVALS_NAME];
  }

  const bad = /(create|update|delete|remove|buy|purchase|publish|toggle|byid|single|ticket|user|my|order|check|image|upload)/i;
  const good = /(getall|fetchall|getfestival|fetchfestival|getlotter|fetchlotter|loadfestival|list)/i;

  const name = thunks.find((k) => good.test(k) && !bad.test(k));

  if (!name) {
    console.warn(
      "[FestivalResult] Festivals list wala thunk nahi mila. Available thunks:",
      thunks,
      "-> FETCH_FESTIVALS_NAME me sahi naam daalo."
    );
  }

  return name ? festivalSlice[name] : null;
})();

const EMPTY_LIST = [];

const pickFestivalState = (state) =>
  state.festivalLottery ?? state.festival ?? state.festivalLotteries ?? null;

const selectFestivals = (state) => {
  const s = pickFestivalState(state);
  if (!s) return EMPTY_LIST;

  const preferred =
    s.festivals ?? s.lotteries ?? s.festivalLotteries ?? s.configs ?? s.list ?? s.data;
  if (Array.isArray(preferred)) return preferred;

  const found = Object.values(s).find(
    (v) => Array.isArray(v) && v.length > 0 && typeof v[0] === "object" && v[0]?._id
  );

  return found || EMPTY_LIST;
};

const selectFestivalsLoading = (state) =>
  Boolean(pickFestivalState(state)?.loading);

/* WINZOX THEME: Bright Gold + White (dark text on gold) */

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

const NUM_INPUT = `${INPUT_CLS} font-mono font-bold tracking-widest`;

const getName = (c) =>
  c?.marketName || c?.festivalName || c?.name || c?.title || "-";

// Backend dates UTC me compare karta hai, isliye page bhi UTC use karta hai
const toDateOnlyString = (value) => {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};

const formatDate = (date) => {
  if (!date) return "-";

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

const onlySix = (v) => v.replace(/\D/g, "").slice(0, 6);

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

const EMPTY_FORM = { lotteryConfigId: "", date: "", winningNumber: "" };

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
  } = useSelector((state) => state.festivalResult);

  const festivals = useSelector(selectFestivals);
  const festivalLoading = useSelector(selectFestivalsLoading);

  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [publishingIds, setPublishingIds] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);

  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [editNumber, setEditNumber] = useState("");

  const [showCheck, setShowCheck] = useState(false);
  const [checkForm, setCheckForm] = useState({ userNumber: "", winningNumber: "" });

  const refreshFestivals = () => {
    if (fetchFestivalsAction) dispatch(fetchFestivalsAction());
  };

  useEffect(() => {
    dispatch(getAllFestivalResults());
    refreshFestivals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    if (!success && !error) return;
    const timer = setTimeout(() => dispatch(clearFestivalResultMessage()), 3500);
    return () => clearTimeout(timer);
  }, [success, error, dispatch]);

  const activeFestivals = useMemo(
    () => festivals.filter((c) => c?.isActive !== false),
    [festivals]
  );

  const selectedFestival = useMemo(
    () => festivals.find((c) => String(c?._id) === String(formData.lotteryConfigId)),
    [festivals, formData.lotteryConfigId]
  );

  const hasDrawDate = Boolean(selectedFestival?.drawDate);

  const filteredResults = useMemo(() => {
    const q = search.trim().toLowerCase();

    return results.filter((item) => {
      const name = getName(item?.lotteryConfigId).toLowerCase();
      const matchSearch =
        !q || name.includes(q) || String(item?.winningNumber || "").includes(q);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "published" ? item?.isPublished : !item?.isPublished);

      return matchSearch && matchStatus;
    });
  }, [results, search, statusFilter]);

  // ---------------- CREATE ----------------

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (formError) setFormError("");

    if (name === "lotteryConfigId") {
      const cfg = festivals.find((c) => String(c?._id) === String(value));
      setFormData({
        lotteryConfigId: value,
        date: cfg ? toDateOnlyString(cfg.drawDate) : "",
        winningNumber: "",
      });
      return;
    }

    if (name === "winningNumber") {
      setFormData((prev) => ({ ...prev, winningNumber: onlySix(value) }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!formData.lotteryConfigId) return setFormError("Please select a festival lottery.");
    if (!formData.date) return setFormError("Please select the result date.");
    if (!/^\d{6}$/.test(formData.winningNumber)) {
      return setFormError("Winning number must be exactly 6 digits.");
    }

    setFormError("");

    const response = await dispatch(createFestivalResult(formData));

    if (createFestivalResult.fulfilled.match(response)) {
      setFormData(EMPTY_FORM);
      setShowCreate(false);
      refreshFestivals();
    }
  };

  // ---------------- EDIT ----------------

  const handleEditSave = async () => {
    if (!/^\d{6}$/.test(editNumber)) return;

    const res = await dispatch(
      updateFestivalResult({ id: editItem._id, data: { winningNumber: editNumber } })
    );

    if (updateFestivalResult.fulfilled.match(res)) {
      setEditItem(null);
      refreshFestivals();
    }
  };

  // ---------------- PUBLISH / DELETE ----------------

  const runWithId = async (setter, id, action) => {
    setter((prev) => [...prev, id]);
    try {
      await dispatch(action);
    } finally {
      setter((prev) => prev.filter((x) => x !== id));
    }
  };

  const handlePublish = (id) => runWithId(setPublishingIds, id, publishFestivalResult(id));
  const handleUnpublish = (id) => runWithId(setPublishingIds, id, unpublishFestivalResult(id));

  const handleDelete = async (id) => {
    const ok = window.confirm(
      "Delete this result? Winners ka prize unke wallet se wapas kat jayega."
    );
    if (!ok) return;

    await runWithId(setDeletingIds, id, deleteFestivalResult(id));
    refreshFestivals();
  };

  // ---------------- CHECK NUMBER ----------------

  const closeCheck = () => {
    setShowCheck(false);
    setCheckForm({ userNumber: "", winningNumber: "" });
    dispatch(clearFestivalCheckResult());
  };

  const runCheck = () => {
    if (!/^\d{6}$/.test(checkForm.userNumber) || !/^\d{6}$/.test(checkForm.winningNumber)) return;
    dispatch(checkFestivalNumber(checkForm));
  };

  // ---------------- RENDER ----------------

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#1A1A1A]">
            Festival Lottery Results
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">Manage festival lottery results.</p>
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
              Result summary: {summary.winningNumber} ({summary.date})
            </h3>
            <button
              type="button"
              onClick={() => dispatch(clearFestivalResultSummary())}
              className="text-[#6B7280] hover:text-[#1A1A1A]"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
            {[
              ["Entries", summary.totalUsers],
              ["1st prize", summary.firstPrize],
              ["2nd prize", summary.secondPrize],
              ["3rd prize", summary.thirdPrize],
              ["Lost", summary.lost],
              ["Prize paid", money(summary.totalPrizePaid)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-[#F3E7C4] bg-[#FFF9E3] p-3">
                <p className="text-xs font-semibold text-[#8A8F98]">{label}</p>
                <p className="mt-1 text-lg font-black text-[#1A1A1A]">{value}</p>
              </div>
            ))}
          </div>

          <p className="mt-3 text-xs text-[#6B7280]">
            Result abhi unpublished hai. Table se Publish karo.
          </p>
        </div>
      )}

      {/* CREATE FORM */}
      {showCreate && (
        <div className={`p-6 ${CARD_CLS}`}>
          <h2 className="mb-2 text-lg font-black text-[#1A1A1A]">Create Festival Result</h2>
          <p className="mb-6 text-sm text-[#6B7280]">
            Select the festival lottery, then enter the 6 digit winning number.
            Save karte hi jeetne walon ka prize turant wallet mein jayega.
          </p>

          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div>
              <label htmlFor="lotteryConfigId" className={LABEL_CLS}>
                Festival Lottery
              </label>
              <select
                id="lotteryConfigId"
                name="lotteryConfigId"
                value={formData.lotteryConfigId}
                onChange={handleChange}
                disabled={festivalLoading}
                className={INPUT_CLS}
              >
                <option value="">
                  {festivalLoading ? "Loading festivals..." : "Select Festival Lottery"}
                </option>
                {activeFestivals.map((c) => (
                  <option key={c._id} value={c._id}>
                    {`${getName(c)}${c.drawDate ? ` - ${toDateOnlyString(c.drawDate)}` : ""}${
                      c.drawTime ? ` (${c.drawTime})` : ""
                    }`}
                  </option>
                ))}
              </select>

              {activeFestivals.length === 0 && !festivalLoading && (
                <p className="mt-2 text-xs font-medium text-[#D93025]">
                  {fetchFestivalsAction
                    ? "No festival lottery found."
                    : "Festival list load nahi ho rahi. Console me thunk naam dekho."}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="date" className={LABEL_CLS}>
                Result Date
              </label>
              {hasDrawDate || !selectedFestival ? (
                <input
                  id="date"
                  type="text"
                  readOnly
                  disabled
                  value={formData.date ? formatDate(formData.date) : ""}
                  placeholder="Select festival first"
                  className={INPUT_CLS}
                />
              ) : (
                <input
                  id="date"
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={INPUT_CLS}
                />
              )}
              <p className="mt-2 text-xs text-[#6B7280]">
                {hasDrawDate || !selectedFestival
                  ? "Draw date festival se automatically aati hai."
                  : "Is festival me draw date nahi hai, date khud chuno."}
              </p>
            </div>

            <div>
              <label htmlFor="winningNumber" className={LABEL_CLS}>
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
                className={NUM_INPUT}
              />
              <p className="mt-2 text-xs text-[#6B7280]">{formData.winningNumber.length}/6 digits</p>
            </div>

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
                      <p className="text-xs font-semibold text-[#8A8F98]">{label}</p>
                      <p className="mt-1 font-bold text-[#1A1A1A]">{value || "-"}</p>
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
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8F98]" />
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
            <table className="w-full min-w-[1100px]">
              <thead className="bg-[#FFF9E3]">
                <tr>
                  {["#", "Festival", "Draw Date", "Draw Time", "Result Date", "Winning Number", "Winners", "Prize Paid", "Status"].map(
                    (h) => (
                      <th key={h} className={TH_CLS}>
                        {h}
                      </th>
                    )
                  )}
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
                  const paid = winners.reduce((t, w) => t + Number(w.prizeAmount || 0), 0);

                  return (
                    <tr key={item?._id || index} className="transition hover:bg-[#FFFDF7]">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-[#8A8F98]">{index + 1}</td>

                      <td className="whitespace-nowrap px-6 py-4 font-semibold text-[#1A1A1A]">
                        {getName(config)}
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

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-[#1A1A1A]">{winners.length}</td>

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
                              setEditNumber(item.winningNumber || "");
                            }}
                            disabled={published}
                            title={published ? "Unpublish result before editing" : "Edit winning number"}
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
                            title={published ? "Unpublish result before deleting" : "Delete result"}
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
          title={`${getName(viewItem.lotteryConfigId)} - ${formatDate(viewItem.date)}`}
        >
          <p className="mb-4 text-sm text-[#6B7280]">
            Winning number:{" "}
            <span className="font-mono text-base font-black tracking-widest text-[#1A1A1A]">
              {viewItem.winningNumber}
            </span>
          </p>

          {(viewItem.winners || []).length === 0 ? (
            <p className="py-8 text-center text-sm text-[#6B7280]">
              Is result mein koi winner nahi hai.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead className="bg-[#FFF9E3]">
                  <tr>
                    {["User ID", "Number", "Played", "Prize", "Match", "Won"].map((h) => (
                      <th key={h} className={TH_CLS}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3E7C4]">
                  {viewItem.winners.map((w, i) => (
                    <tr key={w._id || i}>
                      <td className="px-6 py-3 text-sm text-[#1A1A1A]">{w.userId}</td>
                      <td className="px-6 py-3 font-mono text-sm font-bold tracking-widest">{w.userNumber}</td>
                      <td className="px-6 py-3 text-sm">{money(w.amount)}</td>
                      <td className="px-6 py-3 text-sm font-semibold text-[#9A5B00]">{w.prizeType}</td>
                      <td className="px-6 py-3 text-sm">{w.matchedDigits} digit</td>
                      <td className="px-6 py-3 text-sm font-bold text-[#12A36B]">{money(w.prizeAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}

      {/* EDIT WINNING NUMBER */}
      {editItem && (
        <Modal title="Edit winning number" onClose={() => setEditItem(null)}>
          <p className="mb-4 text-sm text-[#6B7280]">
            {getName(editItem.lotteryConfigId)} - {formatDate(editItem.date)}
          </p>

          <label className={LABEL_CLS}>Winning Number</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={editNumber}
            onChange={(e) => setEditNumber(onlySix(e.target.value))}
            className={NUM_INPUT}
          />

          <p className="mt-3 rounded-xl border border-[#F3E7C4] bg-[#FFF9E3] p-3 text-xs text-[#9A5B00]">
            Save karte hi purane winners ka prize wallet se wapas kat jayega aur naye number se dobara calculate hoga.
          </p>

          <button
            type="button"
            onClick={handleEditSave}
            disabled={updateLoading || !/^\d{6}$/.test(editNumber)}
            className={`mt-5 w-full rounded-xl py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60 ${GOLD_BTN}`}
          >
            {updateLoading ? "Saving..." : "Save changes"}
          </button>
        </Modal>
      )}

      {/* CHECK NUMBER */}
      {showCheck && (
        <Modal title="Check number" onClose={closeCheck}>
          <p className="mb-4 text-xs text-[#6B7280]">
            Sirf test ke liye. Isse koi result ya wallet nahi badalta.
          </p>

          <div className="space-y-4">
            {[
              ["userNumber", "User ka number"],
              ["winningNumber", "Winning number"],
            ].map(([key, label]) => (
              <div key={key}>
                <label className={LABEL_CLS}>{label}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={checkForm[key]}
                  onChange={(e) => setCheckForm((p) => ({ ...p, [key]: onlySix(e.target.value) }))}
                  placeholder="6 digit"
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