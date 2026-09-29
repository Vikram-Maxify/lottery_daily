import React, { useEffect } from "react";

import {
  ArrowLeft,
  CalendarDays,
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
    withdrawal?.status ??
    withdrawal?.withdrawStatus ??
    withdrawal?.state;

  const status = String(
    rawStatus ?? ""
  ).toLowerCase();

  // SUCCESS

  if (
    status === "success" ||
    status === "successful" ||
    status === "completed" ||
    status === "complete" ||
    status === "approved"
  ) {
    return {
      label: "सफल",
      icon: CircleCheck,
      wrapper:
        "border-green-500/30 bg-green-500/10",
      text: "text-green-400",
    };
  }

  // FAILED

  if (
    status === "failed" ||
    status === "failure" ||
    status === "rejected" ||
    status === "reject"
  ) {
    return {
      label: "असफल",
      icon: CircleX,
      wrapper:
        "border-red-500/30 bg-red-500/10",
      text: "text-red-400",
    };
  }

  // PENDING

  return {
    label: "प्रतीक्षारत",
    icon: Clock3,
    wrapper:
      "border-yellow-500/30 bg-yellow-500/10",
    text: "text-yellow-400",
  };
};

// ==========================================================
// STATUS BADGE
// ==========================================================

const StatusBadge = ({ withdrawal }) => {
  const status = getWithdrawalStatus(
    withdrawal
  );

  const Icon = status.icon;

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        px-3
        py-1.5
        rounded-full
        border
        text-[10px]
        sm:text-[11px]
        font-bold
        tracking-wide
        whitespace-nowrap
        ${status.wrapper}
        ${status.text}
      `}
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
  if (
    amount === undefined ||
    amount === null ||
    amount === ""
  ) {
    return "₹0";
  }

  const number = Number(amount);

  if (Number.isNaN(number)) {
    return `₹${amount}`;
  }

  return `₹${number.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  )}`;
};

// ==========================================================
// FORMAT DATE
// ==========================================================

const formatDate = (date) => {
  if (!date) {
    return "-";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

// ==========================================================
// GET WITHDRAWAL ID
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

// ==========================================================
// GET PAYMENT METHOD
// ==========================================================

const getPaymentMethod = (withdrawal) => {
  return (
    withdrawal?.paymentMethod ||
    withdrawal?.method ||
    withdrawal?.type ||
    "निकासी"
  );
};

// ==========================================================
// WITHDRAW HISTORY PAGE
// ==========================================================

const WithdrawHistory = () => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  // ========================================================
  // REDUX
  // ========================================================

  const withdrawals =
    useSelector(selectWithdrawals);

  const count =
    useSelector(selectWithdrawalsCount);

  const loading =
    useSelector(selectWithdrawalsLoading);

  const error =
    useSelector(selectWithdrawalsError);

  // ========================================================
  // FETCH
  // ========================================================

  useEffect(() => {
    dispatch(fetchMyWithdrawals());
  }, [dispatch]);

  // ========================================================
  // REFRESH
  // ========================================================

  const handleRefresh = () => {
    dispatch(fetchMyWithdrawals());
  };

  // ========================================================
  // RETURN
  // ========================================================

  return (
    <div className="min-h-screen bg-[#050505] text-white px-4 sm:px-5 pt-3 pb-8">

      <div className="max-w-5xl mx-auto">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div
          className="
            relative
            overflow-hidden
            rounded-[22px]
            border
            border-[#8d6b20]
            px-4
            py-4
            sm:px-5
          "
          style={{
            background:
              "radial-gradient(circle at 75% 0%, rgba(150,105,20,0.30) 0%, rgba(30,24,10,0.72) 35%, #080808 75%)",

            boxShadow:
              "0 0 35px rgba(245,197,66,0.08)",
          }}
        >

          {/* GLOW */}

          <div
            className="
              absolute
              right-[-70px]
              top-[-80px]
              w-[190px]
              h-[190px]
              rounded-full
              bg-[#f5c542]/10
              blur-3xl
              pointer-events-none
            "
          />

          <div className="relative flex items-center gap-3">

            {/* BACK */}

            <button
              type="button"
              onClick={() =>
                navigate("/profile")
              }
              className="
                w-11
                h-11
                rounded-full
                border
                border-[#80631f]
                bg-black/50
                flex
                items-center
                justify-center
                text-[#f5c542]
                active:scale-95
                transition
                flex-shrink-0
              "
            >
              <ArrowLeft size={21} />
            </button>

            {/* ICON */}

            <div
              className="
                w-12
                h-12
                rounded-full
                border
                border-[#80631f]
                bg-black/50
                flex
                items-center
                justify-center
                flex-shrink-0
              "
            >
              <HandCoins
                size={25}
                className="text-[#f5c542]"
              />
            </div>

            {/* TITLE */}

            <div className="flex-1 min-w-0">

              <p className="text-[#bcbcbc] text-xs sm:text-sm">
                मेरा खाता
              </p>

              <h1 className="text-white text-xl sm:text-2xl font-extrabold truncate">
                निकासी इतिहास
              </h1>

              <p className="text-[#8e8e8e] text-xs sm:text-sm mt-0.5">
                अपने सभी निकासी देखें
              </p>

            </div>

            {/* REFRESH */}

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="
                w-11
                h-11
                rounded-full
                border
                border-[#80631f]
                bg-black/50
                flex
                items-center
                justify-center
                text-[#f5c542]
                active:scale-95
                transition
                disabled:opacity-40
                flex-shrink-0
              "
            >
              {loading ? (
                <Loader2
                  size={19}
                  className="animate-spin"
                />
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

          <div
            className="
              rounded-[18px]
              border
              border-[#80631f]
              px-4
              py-4
            "
            style={{
              background:
                "linear-gradient(110deg, #17130a 0%, #0b0b0b 65%)",
            }}
          >

            <div className="flex items-center gap-3">

              <div
                className="
                  w-11
                  h-11
                  rounded-full
                  border
                  border-[#80631f]
                  bg-black/50
                  flex
                  items-center
                  justify-center
                  flex-shrink-0
                "
              >
                <HandCoins
                  size={22}
                  className="text-[#f5c542]"
                />
              </div>

              <div>

                <p className="text-[#9e9e9e] text-xs">
                  कुल निकासी
                </p>

                <p className="text-white text-xl sm:text-2xl font-extrabold mt-0.5">
                  {count}
                </p>

              </div>

            </div>

          </div>

          {/* WALLET */}

          <div
            className="
              rounded-[18px]
              border
              border-[#80631f]
              px-4
              py-4
            "
            style={{
              background:
                "linear-gradient(110deg, #17130a 0%, #0b0b0b 65%)",
            }}
          >

            <div className="flex items-center gap-3">

              <div
                className="
                  w-11
                  h-11
                  rounded-full
                  border
                  border-[#80631f]
                  bg-black/50
                  flex
                  items-center
                  justify-center
                  flex-shrink-0
                "
              >
                <Wallet
                  size={22}
                  className="text-[#f5c542]"
                />
              </div>

              <div>

                <p className="text-[#9e9e9e] text-xs">
                  इतिहास
                </p>

                <p className="text-[#f5c542] text-xl sm:text-2xl font-extrabold mt-0.5">
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
          <div
            className="
              mt-4
              rounded-[18px]
              border
              border-red-500/30
              bg-red-500/10
              px-4
              py-3
              text-red-400
              text-sm
            "
          >
            {error}
          </div>
        )}

        {/* ==================================================
            CONTENT
        ================================================== */}

        <div className="mt-5">

          <div className="flex items-center justify-between mb-3">

            <div>

              <h2 className="text-white text-xl font-extrabold">
                निकासी
              </h2>

              <p className="text-[#777] text-xs mt-1">
                आपके सभी निकासी लेनदेन
              </p>

            </div>

            <span className="text-[#f5c542] text-sm font-bold">
              कुल {count}
            </span>

          </div>

          {/* ==================================================
              LOADING
          ================================================== */}

          {loading ? (

            <div
              className="
                rounded-[20px]
                border
                border-[#80631f]
                bg-[#0b0c0c]
                py-16
                flex
                flex-col
                items-center
                justify-center
              "
            >

              <Loader2
                size={34}
                className="text-[#f5c542] animate-spin"
              />

              <p className="text-[#bcbcbc] text-sm mt-4">
                निकासी इतिहास लोड हो रही है...
              </p>

            </div>

          ) : withdrawals.length === 0 ? (

            /* ==================================================
                EMPTY
            ================================================== */

            <div
              className="
                rounded-[20px]
                border
                border-[#80631f]
                bg-[#0b0c0c]
                py-16
                px-5
                flex
                flex-col
                items-center
                justify-center
                text-center
              "
            >

              <div
                className="
                  w-20
                  h-20
                  rounded-full
                  border
                  border-[#80631f]
                  bg-black/50
                  flex
                  items-center
                  justify-center
                "
              >
                <HandCoins
                  size={35}
                  className="text-[#f5c542]"
                />
              </div>

              <h3 className="text-white text-lg font-extrabold mt-5">
                अभी कोई निकासी नहीं है
              </h3>

              <p className="text-[#777] text-sm mt-2">
                आपके निकासी लेनदेन यहां दिखाई देंगे।
              </p>

            </div>

          ) : (

            /* ==================================================
                WITHDRAWAL LIST
            ================================================== */

            <div className="flex flex-col gap-3">

              {withdrawals.map(
                (withdrawal, index) => {

                  return (
                    <div
                      key={
                        withdrawal?._id ||
                        withdrawal?.withdrawalId ||
                        withdrawal?.orderId ||
                        index
                      }
                      className="
                        rounded-[20px]
                        border
                        border-[#80631f]
                        bg-[#0b0c0c]
                        p-4
                        sm:p-5
                      "
                    >

                      {/* ==================================================
                          TOP
                      ================================================== */}

                      <div className="flex items-start justify-between gap-3">

                        <div className="flex items-center gap-3 min-w-0">

                          <div
                            className="
                              w-12
                              h-12
                              rounded-full
                              border
                              border-[#80631f]
                              bg-black/50
                              flex
                              items-center
                              justify-center
                              flex-shrink-0
                            "
                          >
                            <HandCoins
                              size={22}
                              className="text-[#f5c542]"
                            />
                          </div>

                          <div className="min-w-0">

                            <p className="text-[#777] text-[10px] uppercase">
                              निकासी आईडी
                            </p>

                            <p className="text-white text-sm font-bold truncate max-w-[190px] sm:max-w-[350px]">
                              {getWithdrawalId(
                                withdrawal
                              )}
                            </p>

                          </div>

                        </div>

                        <StatusBadge
                          withdrawal={
                            withdrawal
                          }
                        />

                      </div>

                      {/* ==================================================
                          AMOUNT
                      ================================================== */}

                      <div
                        className="
                          mt-4
                          rounded-xl
                          border
                          border-[#30270f]
                          bg-black/40
                          px-4
                          py-3
                          flex
                          items-center
                          justify-between
                          gap-3
                        "
                      >

                        <div>

                          <p className="text-[#777] text-xs">
                            निकासी राशि
                          </p>

                          <p className="text-[#f5c542] text-2xl font-extrabold mt-0.5">
                            {formatAmount(
                              withdrawal?.amount
                            )}
                          </p>

                        </div>

                        <div className="text-right">

                          <p className="text-[#777] text-[10px]">
                            #{index + 1}
                          </p>

                          <p className="text-[#aaa] text-xs mt-1">
                            {formatDate(
                              withdrawal?.createdAt
                            )}
                          </p>

                        </div>

                      </div>

                      {/* ==================================================
                          DETAILS
                      ================================================== */}

                      <div className="grid grid-cols-2 gap-3 mt-4">

                        <WithdrawalDetail
                          label="भुगतान विधि"
                          value={getPaymentMethod(
                            withdrawal
                          )}
                        />

                        <WithdrawalDetail
                          label="लेनदेन आईडी"
                          value={
                            withdrawal?.transactionId ||
                            withdrawal?.txnId ||
                            "-"
                          }
                        />

                        <WithdrawalDetail
                          label="खाता"
                          value={
                            withdrawal?.accountNumber ||
                            withdrawal?.upiId ||
                            withdrawal?.upi ||
                            withdrawal?.bankAccount ||
                            "-"
                          }
                        />

                        <WithdrawalDetail
                          label="दिनांक"
                          value={formatDate(
                            withdrawal?.createdAt
                          )}
                        />

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          )}

        </div>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="mt-7 flex flex-col items-center">

          <div className="w-full flex items-center gap-4">

            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#f5c542] to-[#f5c542]" />

            <div className="text-[#f5c542] text-xl">
              ✦
            </div>

            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#f5c542] to-[#f5c542]" />

          </div>

          <p className="text-[#f5c542] text-[15px] mt-2">
            खेलो विश्वास के साथ
          </p>

        </div>

      </div>
    </div>
  );
};

// ==========================================================
// WITHDRAWAL DETAIL
// ==========================================================

const WithdrawalDetail = ({
  label,
  value,
}) => {
  return (
    <div
      className="
        rounded-xl
        border
        border-[#26231b]
        bg-black/30
        px-3
        py-2.5
        min-w-0
      "
    >

      <p className="text-[#666] text-[10px] uppercase">
        {label}
      </p>

      <p className="text-[#c9c9c9] text-xs font-semibold mt-1 truncate">
        {value || "-"}
      </p>

    </div>
  );
};

export default WithdrawHistory;