import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Settings,
  Ticket,
  PartyPopper,
  Percent,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  IndianRupee,
  Clock,
  Save,
  Check,
  ShieldAlert,
  Sparkles,
  Share2,
  TrendingUp,
} from "lucide-react";

import {
  clearSettingsMessages,
  fetchAllSettings,
  selectDailyLotteryAmount,
  selectFestivalLotteryAmount,
  selectReferralPercentage,
  selectSettingsData,
  selectSettingsError,
  selectSettingsLoading,
  selectSettingsMessage,
  selectSettingsSuccess,
  selectSettingsUpdateLoading,
  updateAllSettings,
  updateDailyAmountSetting,
  updateFestivalAmountSetting,
  updateReferralPercentageSetting,
} from "../../reducer/slice/settingsSlice";

/* =========================================================
   WINZOX THEME TOKENS
   bg: #FFFDF7, border: #F3E7C4, gold: #FFD83D -> #F7B500 -> #E39A00
   text: #1A1A1A, muted: #6B7280, brown: #9A5B00, danger: #D93025
========================================================= */

const AdminSettings = () => {
  const dispatch = useDispatch();

  const settingsState = useSelector(selectSettingsData);
  const dailyAmount = useSelector(selectDailyLotteryAmount);
  const festivalAmount = useSelector(selectFestivalLotteryAmount);
  const referralPercent = useSelector(selectReferralPercentage);

  const loading = useSelector(selectSettingsLoading);
  const updateLoading = useSelector(selectSettingsUpdateLoading);
  const success = useSelector(selectSettingsSuccess);
  const error = useSelector(selectSettingsError);
  const message = useSelector(selectSettingsMessage);

  // Form input states
  const [dailyInput, setDailyInput] = useState("");
  const [festivalInput, setFestivalInput] = useState("");
  const [referralInput, setReferralInput] = useState("");

  // Individual loading indicators
  const [updatingField, setUpdatingField] = useState(null); // 'daily' | 'festival' | 'referral' | 'all' | null

  // Fetch settings on mount
  useEffect(() => {
    dispatch(fetchAllSettings());
  }, [dispatch]);

  // Sync inputs with fetched settings
  useEffect(() => {
    if (dailyAmount !== undefined && dailyAmount !== null) {
      setDailyInput(String(dailyAmount));
    }
  }, [dailyAmount]);

  useEffect(() => {
    if (festivalAmount !== undefined && festivalAmount !== null) {
      setFestivalInput(String(festivalAmount));
    }
  }, [festivalAmount]);

  useEffect(() => {
    if (referralPercent !== undefined && referralPercent !== null) {
      setReferralInput(String(referralPercent));
    }
  }, [referralPercent]);

  // Auto-dismiss messages
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        dispatch(clearSettingsMessages());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [success, error, dispatch]);

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "Never";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Recently";
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Submit Daily Amount only
  const handleUpdateDaily = async (e) => {
    e?.preventDefault();
    const num = Number(dailyInput);
    if (isNaN(num) || num < 0) return;

    setUpdatingField("daily");
    await dispatch(updateDailyAmountSetting(num));
    setUpdatingField(null);
  };

  // Submit Festival Amount only
  const handleUpdateFestival = async (e) => {
    e?.preventDefault();
    const num = Number(festivalInput);
    if (isNaN(num) || num < 0) return;

    setUpdatingField("festival");
    await dispatch(updateFestivalAmountSetting(num));
    setUpdatingField(null);
  };

  // Submit Referral % only
  const handleUpdateReferral = async (e) => {
    e?.preventDefault();
    const num = Number(referralInput);
    if (isNaN(num) || num < 0 || num > 100) return;

    setUpdatingField("referral");
    await dispatch(updateReferralPercentageSetting(num));
    setUpdatingField(null);
  };

  // Submit All Settings together
  const handleUpdateAll = async () => {
    const dailyNum = Number(dailyInput);
    const festivalNum = Number(festivalInput);
    const referralNum = Number(referralInput);

    if (isNaN(dailyNum) || dailyNum < 0) return;
    if (isNaN(festivalNum) || festivalNum < 0) return;
    if (isNaN(referralNum) || referralNum < 0 || referralNum > 100) return;

    setUpdatingField("all");
    await dispatch(
      updateAllSettings({
        dailyLotteryAmount: dailyNum,
        festivalLotteryAmount: festivalNum,
        referralPercentage: referralNum,
      })
    );
    setUpdatingField(null);
  };

  // Check if any value is modified
  const hasChanges =
    Number(dailyInput) !== Number(dailyAmount) ||
    Number(festivalInput) !== Number(festivalAmount) ||
    Number(referralInput) !== Number(referralPercent);

  return (
    <div className="space-y-6">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFD83D] to-[#E39A00] text-[#1A1204] shadow-[0_4px_12px_rgba(247,181,0,0.4)]">
              <Settings size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#1A1A1A]">
                General Settings
              </h1>
              <p className="text-xs font-medium text-[#6B7280]">
                Manage ticket prices for Daily & Festival lotteries and Referral bonus rate
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch(fetchAllSettings())}
            disabled={loading || updateLoading}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#F3E7C4] bg-white text-[#9A5B00] shadow-sm transition hover:bg-[#FFEFA8]/50 disabled:opacity-50"
            title="Refresh Settings"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : "transition active:rotate-180"}
            />
          </button>

          <button
            onClick={handleUpdateAll}
            disabled={updateLoading || !hasChanges}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] px-5 py-2.5 text-xs font-black text-[#1A1204] shadow-[0_8px_18px_-4px_rgba(227,154,0,0.7)] transition active:scale-[0.98] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updatingField === "all" ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                Saving All...
              </>
            ) : (
              <>
                <Save size={15} className="stroke-[2.5]" />
                Save All Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* =====================================================
          NOTIFICATIONS (SUCCESS / ERROR)
      ====================================================== */}
      {success && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span>{message || "Settings updated successfully!"}</span>
          </div>
          <button
            onClick={() => dispatch(clearSettingsMessages())}
            className="rounded p-1 text-emerald-700 hover:bg-emerald-100"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-red-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => dispatch(clearSettingsMessages())}
            className="rounded p-1 text-red-700 hover:bg-red-100"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* =====================================================
          OVERVIEW STATS CARDS
      ====================================================== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Card 1: Daily Lottery Amount */}
        <div className="relative overflow-hidden rounded-2xl border border-[#F3E7C4] bg-white p-5 shadow-[0_6px_18px_-10px_rgba(247,181,0,0.35)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#9A5B00]">
              Daily Lottery
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFEFA8]/50 text-[#9A5B00]">
              <Ticket size={17} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-black text-[#1A1A1A]">
              ₹{Number(dailyAmount || 0).toLocaleString("en-IN")}
            </span>
            <span className="text-xs font-semibold text-[#6B7280]">/ 10 tickets</span>
          </div>
          <p className="mt-2 text-[11px] text-[#6B7280]">
            Last updated:{" "}
            <span className="font-semibold text-[#1A1A1A]">
              {formatDate(settingsState?.dailyUpdatedAt)}
            </span>
          </p>
          <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-[#FFEFA8]/20" />
        </div>

        {/* Card 2: Festival Lottery Amount */}
        <div className="relative overflow-hidden rounded-2xl border border-[#F3E7C4] bg-white p-5 shadow-[0_6px_18px_-10px_rgba(247,181,0,0.35)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#D93025]">
              Festival Lottery
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100/60 text-[#D93025]">
              <PartyPopper size={17} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-black text-[#1A1A1A]">
              ₹{Number(festivalAmount || 0).toLocaleString("en-IN")}
            </span>
            <span className="text-xs font-semibold text-[#6B7280]">/ 10 tickets</span>
          </div>
          <p className="mt-2 text-[11px] text-[#6B7280]">
            Last updated:{" "}
            <span className="font-semibold text-[#1A1A1A]">
              {formatDate(settingsState?.festivalUpdatedAt)}
            </span>
          </p>
          <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-red-50" />
        </div>

        {/* Card 3: Referral Percentage */}
        <div className="relative overflow-hidden rounded-2xl border border-[#F3E7C4] bg-white p-5 shadow-[0_6px_18px_-10px_rgba(247,181,0,0.35)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
              Referral Bonus
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Share2 size={17} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-black text-emerald-700">
              {Number(referralPercent || 0)}%
            </span>
            <span className="text-xs font-semibold text-[#6B7280]">commission</span>
          </div>
          <p className="mt-2 text-[11px] text-[#6B7280]">
            Last updated:{" "}
            <span className="font-semibold text-[#1A1A1A]">
              {formatDate(settingsState?.referralUpdatedAt)}
            </span>
          </p>
          <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-emerald-50" />
        </div>
      </div>

      {/* =====================================================
          DETAILED MANAGEMENT CARDS
      ====================================================== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ===================================================
            SECTION 1: DAILY LOTTERY AMOUNT
        ==================================================== */}
        <div className="flex flex-col justify-between rounded-3xl border border-[#F3E7C4] bg-white p-6 shadow-[0_6px_18px_-10px_rgba(247,181,0,0.35)]">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFD83D] to-[#E39A00] text-[#1A1204] shadow-sm">
                <Ticket size={20} className="stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-base font-black text-[#1A1A1A]">
                  Daily Lottery Price
                </h2>
                <p className="text-xs text-[#6B7280]">
                  Standard per-ticket entry price
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-[#6B7280]">
              This price applies to everyday lottery ticket selections and direct checkouts on the user portal.
            </p>

            {/* Input Form */}
            <form onSubmit={handleUpdateDaily} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1A1A1A]">
                  Daily Ticket Amount for 10 Tickets (₹)
                </label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-[#9A5B00]">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 250"
                    value={dailyInput}
                    onChange={(e) => setDailyInput(e.target.value)}
                    required
                    className="w-full rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] py-2.5 pl-8 pr-3 text-sm font-black text-[#1A1A1A] outline-none transition focus:border-[#F2B705] focus:ring-2 focus:ring-[#FFEFA8]"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[11px] font-bold text-[#9A5B00]">
                  Quick Presets:
                </span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {[50, 100, 200, 250, 300].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDailyInput(String(preset))}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                        Number(dailyInput) === preset
                          ? "border-[#F2B705] bg-[#FFEFA8] text-[#9A5B00]"
                          : "border-[#F3E7C4] bg-[#FFFDF7] text-[#6B7280] hover:bg-gray-50"
                      }`}
                    >
                      ₹{preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={
                  updateLoading ||
                  dailyInput === "" ||
                  Number(dailyInput) === Number(dailyAmount)
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] py-2.5 text-xs font-black text-[#1A1204] shadow-[0_4px_12px_rgba(227,154,0,0.5)] transition active:scale-[0.98] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updatingField === "daily" ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Updating Daily Price...
                  </>
                ) : (
                  <>
                    <Check size={14} className="stroke-[3]" />
                    Update Daily Price
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-5 rounded-xl border border-[#F3E7C4] bg-[#FFF9E3] p-3 text-[11px] text-[#9A5B00]">
            💡 <strong>Note:</strong> Yeh price 10 tickets ke pack ka hai (e.g. ₹250 = ₹25/ticket). Changes turant apply ho jate hain.
          </div>
        </div>

        {/* ===================================================
            SECTION 2: FESTIVAL LOTTERY AMOUNT
        ==================================================== */}
        <div className="flex flex-col justify-between rounded-3xl border border-[#F3E7C4] bg-white p-6 shadow-[0_6px_18px_-10px_rgba(247,181,0,0.35)]">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6b6b] to-[#c92a2a] text-white shadow-sm">
                <PartyPopper size={20} className="stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-base font-black text-[#1A1A1A]">
                  Festival Lottery Price
                </h2>
                <p className="text-xs text-[#6B7280]">
                  Price for a set of 10 tickets
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-[#6B7280]">
              This price is for a pack of 10 festival tickets (e.g. ₹270 for 10 tickets). Minimum purchase is 10 tickets.
            </p>

            {/* Input Form */}
            <form onSubmit={handleUpdateFestival} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1A1A1A]">
                  Price for 10 Tickets (₹)
                </label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-[#D93025]">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 270"
                    value={festivalInput}
                    onChange={(e) => setFestivalInput(e.target.value)}
                    required
                    className="w-full rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] py-2.5 pl-8 pr-3 text-sm font-black text-[#1A1A1A] outline-none transition focus:border-[#F2B705] focus:ring-2 focus:ring-[#FFEFA8]"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[11px] font-bold text-[#D93025]">
                  Quick Presets:
                </span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {[100, 200, 270, 300, 500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFestivalInput(String(preset))}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                        Number(festivalInput) === preset
                          ? "border-red-300 bg-red-100 text-[#D93025]"
                          : "border-[#F3E7C4] bg-[#FFFDF7] text-[#6B7280] hover:bg-gray-50"
                      }`}
                    >
                      ₹{preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={
                  updateLoading ||
                  festivalInput === "" ||
                  Number(festivalInput) === Number(festivalAmount)
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e03131] to-[#c92a2a] py-2.5 text-xs font-black text-white shadow-[0_4px_12px_rgba(201,42,42,0.4)] transition active:scale-[0.98] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updatingField === "festival" ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Updating Festival Price...
                  </>
                ) : (
                  <>
                    <Check size={14} className="stroke-[3]" />
                    Update Festival Price
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-5 rounded-xl border border-red-200 bg-red-50/60 p-3 text-[11px] text-red-800">
            🎉 <strong>Festival Tip:</strong> Higher festival ticket prices automatically adjust calculations on the Festival Bumper page.
          </div>
        </div>

        {/* ===================================================
            SECTION 3: REFERRAL BONUS PERCENTAGE
        ==================================================== */}
        <div className="flex flex-col justify-between rounded-3xl border border-[#F3E7C4] bg-white p-6 shadow-[0_6px_18px_-10px_rgba(247,181,0,0.35)]">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#20c997] to-[#099268] text-white shadow-sm">
                <Percent size={20} className="stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-base font-black text-[#1A1A1A]">
                  Referral Commission Rate
                </h2>
                <p className="text-xs text-[#6B7280]">
                  Percentage credited to referrers
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-[#6B7280]">
              Users earn this percentage when a friend registers using their referral link and makes deposits.
            </p>

            {/* Input Form */}
            <form onSubmit={handleUpdateReferral} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1A1A1A]">
                  Commission Percentage (%)
                </label>
                <div className="relative mt-1.5">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    placeholder="e.g. 5"
                    value={referralInput}
                    onChange={(e) => setReferralInput(e.target.value)}
                    required
                    className="w-full rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] py-2.5 pl-3.5 pr-8 text-sm font-black text-[#1A1A1A] outline-none transition focus:border-[#F2B705] focus:ring-2 focus:ring-[#FFEFA8]"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-emerald-600">
                    %
                  </span>
                </div>
              </div>

              {/* Progress bar visual indicator */}
              <div>
                <div className="mb-1 flex justify-between text-[10px] font-bold text-[#6B7280]">
                  <span>0%</span>
                  <span className="text-emerald-700 font-black">
                    Current: {Number(referralInput || 0)}%
                  </span>
                  <span>100%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-600 transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(0, Number(referralInput) || 0))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[11px] font-bold text-emerald-700">
                  Quick Presets:
                </span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {[2, 5, 7.5, 10, 15].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setReferralInput(String(preset))}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                        Number(referralInput) === preset
                          ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                          : "border-[#F3E7C4] bg-[#FFFDF7] text-[#6B7280] hover:bg-gray-50"
                      }`}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={
                  updateLoading ||
                  referralInput === "" ||
                  Number(referralInput) === Number(referralPercent)
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#12b886] to-[#0ca678] py-2.5 text-xs font-black text-white shadow-[0_4px_12px_rgba(18,184,134,0.4)] transition active:scale-[0.98] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updatingField === "referral" ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Updating Referral %...
                  </>
                ) : (
                  <>
                    <Check size={14} className="stroke-[3]" />
                    Update Referral Rate
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-[11px] text-emerald-800">
            🤝 <strong>Growth Engine:</strong> A healthy referral rate (between 5% - 10%) attracts organic viral player invitations.
          </div>
        </div>
      </div>

      {/* =====================================================
          SUMMARY & BULK SAVE FOOTER
      ====================================================== */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-[#F3E7C4] bg-gradient-to-r from-[#FFFDF7] via-white to-[#FFEFA8]/30 p-5 shadow-[0_4px_16px_-6px_rgba(247,181,0,0.2)] sm:flex-row">
        <div>
          <h3 className="text-sm font-black text-[#1A1A1A]">
            One-Click Unified Management
          </h3>
          <p className="text-xs text-[#6B7280]">
            You can change any values above and click "Save All Settings" to sync everything at once.
          </p>
        </div>

        <button
          onClick={handleUpdateAll}
          disabled={updateLoading || !hasChanges}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] px-6 py-3 text-xs font-black text-[#1A1204] shadow-[0_8px_18px_-4px_rgba(227,154,0,0.7)] transition active:scale-[0.98] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {updatingField === "all" ? (
            <>
              <RefreshCw size={15} className="animate-spin" />
              Saving Settings...
            </>
          ) : (
            <>
              <Save size={15} className="stroke-[2.5]" />
              Save All Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;
