import React, { useEffect } from "react";
import {
  ArrowLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Clock3,
  HandCoins,
  Loader2,
  RefreshCcw,
  Wallet,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  fetchMyWithdrawals,
  selectWithdrawals,
  selectWithdrawalsCount,
  selectWithdrawalsLoading,
  selectWithdrawalsError,
} from "../reducer/slice/withdrawalSlice";

// ==========================================================
// STATUS HELPER
// ==========================================================

const getWithdrawalStatus = (withdrawal) => {
  const rawStatus =
    withdrawal?.status ?? withdrawal?.withdrawStatus ?? withdrawal?.state;

  const status = String(rawStatus ?? "").toLowerCase();

  if (
    status === "success" ||
    status === "successful" ||
    status === "completed" ||
    status === "complete" ||
    status === "approved"
  ) {
    return {
      label: "Success",
      icon: CircleCheck,
      wrapper: "border-green-200 bg-green-50",
      text: "text-green-700",
    };
  }

  if (
    status === "failed" ||
    status === "failure" ||
    status === "rejected" ||
    status === "reject"
  ) {
    return {
      label: "Failed",
      icon: CircleX,
      wrapper: "border-red-200 bg-red-50",
      text: "text-red-700",
    };
  }

  return {
    label: "Pending",
    icon: Clock3,
    wrapper: "border-yellow-200 bg-yellow-50",
    text: "text-yellow-700",
  };
};

// ==========================================================
// STATUS BADGE
// ==========================================================

const StatusBadge = ({ withdrawal }) => {
  const status = getWithdrawalStatus(withdrawal);
  const Icon = status.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] sm:text-[11px] font-bold tracking-wide whitespace-nowrap ${status.wrapper} ${status.text}`}
    >
      <Icon size={13} />
      {status.label}
    </span>
  );
};

// ==========================================================
// FORMAT AMOUNT
// ==========================================================

const formatAmount = (amount) => {
  if (amount === undefined || amount === null || amount === "") return "₹0";

  const number = Number(amount);

  if (Number.isNaN(number)) return `₹${amount}`;

  return `₹${number.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

// ==========================================================
// FORMAT DATE
// ==========================================================

const formatDate = (date) => {
  if (!date) return "-";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "-";

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ==========================================================
// GET WITHDRAWAL ID / METHOD
// ==========================================================

const getWithdrawalId = (withdrawal) => {
  return (
    withdrawal?.withdrawalId ||
    withdrawal?.orderId ||
    withdrawal?.transactionId ||
    withdrawal?._id ||
    "-"
  );
};

const getPaymentMethod = (withdrawal) => {
  return (
    withdrawal?.paymentMethod ||
    withdrawal?.method ||
    withdrawal?.type ||
    "Withdrawal"
  );
};

// ==========================================================
// WITHDRAW HISTORY PAGE
// ==========================================================

const WithdrawHistory = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const withdrawals = useSelector(selectWithdrawals);
  const count = useSelector(selectWithdrawalsCount);
  const loading = useSelector(selectWithdrawalsLoading);
  const error = useSelector(selectWithdrawalsError);

  useEffect(() => {
    dispatch(fetchMyWithdrawals());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchMyWithdrawals());
  };

  return (
    <div className="min-h-screen bg-[#EBF0F7] text-[#1b2a5c] px-4 sm:px-5 pt-4 pb-8">
      <div className="max-w-[500px] mx-auto">
        {/* ==================================================
            HEADER
        ================================================== */}
        <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#0f1c4d] via-[#1b2a5c] to-[#2c3a72] px-4 py-4 sm:px-5 shadow-[0_12px_30px_rgba(15,28,77,0.25)]">
          <div className="absolute right-[-70px] top-[-80px] w-[190px] h-[190px] rounded-full bg-white/5 blur-3xl pointer-events-none" />

          <div className="relative flex items-center gap-3">
            {/* BACK */}
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-95 transition flex-shrink-0"
            >
              <ArrowLeft size={21} />
            </button>

            {/* ICON */}
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <HandCoins size={25} className="text-[#ffd84a]" />
            </div>

            {/* TITLE */}
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-xs sm:text-sm">My Account</p>

              <h1 className="text-white text-xl sm:text-2xl font-extrabold truncate">
                Withdrawal History
              </h1>

              <p className="text-white/60 text-xs sm:text-sm mt-0.5">
                View all your withdrawals
              </p>
            </div>

            {/* REFRESH */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-95 transition disabled:opacity-40 flex-shrink-0"
            >
              {loading ? (
                <Loader2 size={19} className="animate-spin" />
              ) : (
                <RefreshCcw size={19} />
              )}
            </button>
          </div>
        </div>

        {/* ==================================================
            SUMMARY
        ================================================== */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {/* TOTAL WITHDRAWALS */}
          <div className="rounded-[18px] border border-white bg-white px-4 py-4 shadow-[0_6px_18px_rgba(15,28,77,0.06)]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#ed1d43] flex items-center justify-center flex-shrink-0">
                <HandCoins size={22} className="text-white" />
              </div>

              <div>
                <p className="text-[#5a6082] text-xs">Total Withdrawals</p>
                <p className="text-[#1b2a5c] text-xl sm:text-2xl font-extrabold mt-0.5">
                  {count}
                </p>
              </div>
            </div>
          </div>

          {/* HISTORY COUNT */}
          <div className="rounded-[18px] border border-white bg-white px-4 py-4 shadow-[0_6px_18px_rgba(15,28,77,0.06)]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#1b2a5c] flex items-center justify-center flex-shrink-0">
                <Wallet size={22} className="text-[#ffd84a]" />
              </div>

              <div>
                <p className="text-[#5a6082] text-xs">History</p>
                <p className="text-[#ed1d43] text-xl sm:text-2xl font-extrabold mt-0.5">
                  {count}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
            ERROR
        ================================================== */}
        {error && (
          <div className="mt-4 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* ==================================================
            CONTENT
        ================================================== */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[#1b2a5c] text-xl font-extrabold">
                Withdrawals
              </h2>
              <p className="text-[#5a6082] text-xs mt-1">
                All your withdrawal transactions
              </p>
            </div>

            <span className="text-[#ed1d43] text-sm font-bold">
              Total {count}
            </span>
          </div>

          {/* ==================================================
              LOADING
          ================================================== */}
          {loading ? (
            <div className="rounded-[20px] border border-white bg-white py-16 flex flex-col items-center justify-center shadow-[0_6px_18px_rgba(15,28,77,0.06)]">
              <Loader2 size={34} className="text-[#ed1d43] animate-spin" />
              <p className="text-[#5a6082] text-sm mt-4">
                Loading withdrawal history...
              </p>
            </div>
          ) : withdrawals.length === 0 ? (
            /* ==================================================
                EMPTY
            ================================================== */
            <div className="rounded-[20px] border border-white bg-white py-16 px-5 flex flex-col items-center justify-center text-center shadow-[0_6px_18px_rgba(15,28,77,0.06)]">
              <div className="w-20 h-20 rounded-full bg-[#ed1d43] flex items-center justify-center">
                <HandCoins size={35} className="text-white" />
              </div>

              <h3 className="text-[#1b2a5c] text-lg font-extrabold mt-5">
                No Withdrawals Yet
              </h3>

              <p className="text-[#5a6082] text-sm mt-2">
                Your withdrawal transactions will appear here.
              </p>
            </div>
          ) : (
            /* ==================================================
                WITHDRAWAL LIST
            ================================================== */
            <div className="flex flex-col gap-3">
              {withdrawals.map((withdrawal, index) => (
                <div
                  key={
                    withdrawal?._id ||
                    withdrawal?.withdrawalId ||
                    withdrawal?.orderId ||
                    index
                  }
                  className="rounded-[20px] border border-white bg-white p-4 sm:p-5 shadow-[0_6px_18px_rgba(15,28,77,0.06)]"
                >
                  {/* TOP */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-[#ed1d43] flex items-center justify-center flex-shrink-0">
                        <HandCoins size={22} className="text-white" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[#8a97ab] text-[10px] uppercase">
                          Withdrawal ID
                        </p>
                        <p className="text-[#1b2a5c] text-sm font-bold truncate max-w-[190px] sm:max-w-[350px]">
                          {getWithdrawalId(withdrawal)}
                        </p>
                      </div>
                    </div>

                    <StatusBadge withdrawal={withdrawal} />
                  </div>

                  {/* AMOUNT */}
                  <div className="mt-4 rounded-xl border border-[#e2e5f0] bg-[#f6f9fe] px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[#5a6082] text-xs">
                        Withdrawal Amount
                      </p>
                      <p className="text-[#ed1d43] text-2xl font-extrabold mt-0.5">
                        {formatAmount(withdrawal?.amount)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[#8a97ab] text-[10px]">
                        #{index + 1}
                      </p>
                      <p className="text-[#5a6082] text-xs mt-1">
                        {formatDate(withdrawal?.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* DETAILS */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <WithdrawalDetail
                      label="Payment Method"
                      value={getPaymentMethod(withdrawal)}
                    />

                    <WithdrawalDetail
                      label="Transaction ID"
                      value={
                        withdrawal?.transactionId || withdrawal?.txnId || "-"
                      }
                    />

                    <WithdrawalDetail
                      label="Account"
                      value={
                        withdrawal?.accountNumber ||
                        withdrawal?.upiId ||
                        withdrawal?.upi ||
                        withdrawal?.bankAccount ||
                        "-"
                      }
                    />

                    <WithdrawalDetail
                      label="Date"
                      value={formatDate(withdrawal?.createdAt)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ==================================================
            FOOTER
        ================================================== */}
        <div className="mt-7 flex flex-col items-center">
          <div className="w-full flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#1b2a5c]/30" />
            <div className="text-[#1b2a5c] text-xl">✦</div>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#1b2a5c]/30" />
          </div>

          <p className="text-[#1b2a5c] text-[15px] mt-2 font-medium">
            Play with trust
          </p>
        </div>
      </div>
    </div>
  );
};

// ==========================================================
// WITHDRAWAL DETAIL
// ==========================================================

const WithdrawalDetail = ({ label, value }) => (
  <div className="rounded-xl border border-[#e2e5f0] bg-[#f6f9fe] px-3 py-2.5 min-w-0">
    <p className="text-[#8a97ab] text-[10px] uppercase">{label}</p>
    <p className="text-[#1b2a5c] text-xs font-semibold mt-1 truncate">
      {value || "-"}
    </p>
  </div>
);

export default WithdrawHistory;