import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createWithdrawal,
  fetchMyWithdrawals,
  resetWithdrawalState,
} from "../reducer/slice/withdrawalSlice";

import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  Landmark,
  Loader2,
  ShieldCheck,
  Smartphone,
  Wallet,
  XCircle,
} from "lucide-react";

const WithdrawalRequest = () => {
  const dispatch = useDispatch();

  const {
    myWithdrawals,
    loading,
    error,
    success,
  } = useSelector((s) => s.withdrawal);

  const user = useSelector((s) => s.auth?.user);

  const [form, setForm] = useState({
    amount: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    branchName: "",
    upiId: "",
  });

  // ==========================================
  // FETCH WITHDRAWAL HISTORY
  // ==========================================
  useEffect(() => {
    dispatch(fetchMyWithdrawals());
  }, [dispatch]);

  // ==========================================
  // RESET FORM AFTER SUCCESS
  // ==========================================
  useEffect(() => {
    if (success) {
      setForm({
        amount: "",
        accountHolderName: "",
        accountNumber: "",
        ifscCode: "",
        bankName: "",
        branchName: "",
        upiId: "",
      });

      const t = setTimeout(() => {
        dispatch(resetWithdrawalState());
      }, 2500);

      return () => clearTimeout(t);
    }
  }, [success, dispatch]);

  // ==========================================
  // HANDLE INPUT
  // ==========================================
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ==========================================
  // SUBMIT WITHDRAWAL
  // ==========================================
  const handleSubmit = (e) => {
    e.preventDefault();

    dispatch(
      createWithdrawal({
        ...form,
        amount: Number(form.amount),
      })
    );
  };

  // ==========================================
  // WALLET
  // ==========================================
  const walletBalance = Number(user?.wallet || 0);

  const formattedWalletBalance = walletBalance.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  // ==========================================
  // STATUS CONFIG
  // ==========================================
  const statusConfig = {
    pending: {
      icon: Clock3,
      label: "Pending",
      className:
        "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
    },

    approved: {
      icon: CheckCircle2,
      label: "Approved",
      className:
        "border-green-500/30 bg-green-500/10 text-green-400",
    },

    rejected: {
      icon: XCircle,
      label: "Rejected",
      className:
        "border-red-500/30 bg-red-500/10 text-red-400",
    },
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white px-4 sm:px-5 pt-3 pb-8">

      {/* ==================================================
          HEADER
      ================================================== */}
      <div className="max-w-3xl mx-auto mb-5">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-[#cfcfcf] hover:text-[#f5c542] transition mb-4"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-semibold">
            वापस जाएं
          </span>
        </button>

        <div>
          <p className="text-[#f5c542] text-sm font-semibold tracking-wide">
            WALLET
          </p>

          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            पैसे निकालें
          </h1>

          <p className="text-[#9f9f9f] text-sm mt-2">
            अपने बैंक खाते या UPI में पैसे निकालने का अनुरोध करें।
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-5">

        {/* ==================================================
            WALLET CARD
        ================================================== */}
        <div
          className="relative overflow-hidden rounded-[22px] border border-[#80631f] p-5 sm:p-6"
          style={{
            background:
              "radial-gradient(circle at 80% 0%, rgba(150,105,20,0.28) 0%, rgba(30,24,10,0.65) 35%, #080808 78%)",
            boxShadow:
              "0 0 35px rgba(245,197,66,0.08)",
          }}
        >
          {/* Decorative Circle */}
          <div className="absolute right-[-45px] top-[-45px] w-36 h-36 rounded-full border border-[#f5c542]/10" />
          <div className="absolute right-[-20px] top-[-20px] w-24 h-24 rounded-full border border-[#f5c542]/10" />

          <div className="relative flex items-center gap-4">

            <div className="w-[62px] h-[62px] rounded-full border border-[#80631f] bg-black/50 flex items-center justify-center flex-shrink-0">
              <Wallet
                size={31}
                fill="#f5c542"
                className="text-[#f5c542]"
              />
            </div>

            <div>
              <p className="text-[#bdbdbd] text-sm">
                उपलब्ध वॉलेट बैलेंस
              </p>

              <p className="text-[#f5c542] text-3xl sm:text-4xl font-extrabold mt-1">
                ₹{formattedWalletBalance}
              </p>
            </div>
          </div>

          <div className="relative mt-5 flex items-center gap-2 text-[#a9a9a9] text-xs">
            <ShieldCheck
              size={16}
              className="text-[#f5c542]"
            />

            <span>
              आपका withdrawal request सुरक्षित रूप से process किया जाएगा।
            </span>
          </div>
        </div>

        {/* ==================================================
            SUCCESS MESSAGE
        ================================================== */}
        {success && (
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4 flex items-start gap-3">
            <CheckCircle2
              size={22}
              className="text-green-400 flex-shrink-0 mt-0.5"
            />

            <div>
              <p className="text-green-400 font-bold">
                Withdrawal Request Submitted
              </p>

              <p className="text-green-400/70 text-sm mt-1">
                आपका withdrawal request successfully submit हो गया है।
              </p>
            </div>
          </div>
        )}

        {/* ==================================================
            ERROR MESSAGE
        ================================================== */}
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3">
            <XCircle
              size={22}
              className="text-red-400 flex-shrink-0 mt-0.5"
            />

            <div>
              <p className="text-red-400 font-bold">
                Withdrawal Failed
              </p>

              <p className="text-red-400/80 text-sm mt-1">
                {typeof error === "string"
                  ? error
                  : "Withdrawal request submit नहीं हो पाया।"}
              </p>
            </div>
          </div>
        )}

        {/* ==================================================
            WITHDRAW FORM
        ================================================== */}
        <div
          className="rounded-[22px] border border-[#303030] bg-[#0b0c0c] p-5 sm:p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-[#211b0b] border border-[#80631f] flex items-center justify-center">
              <Banknote
                size={23}
                className="text-[#f5c542]"
              />
            </div>

            <div>
              <h2 className="text-xl font-extrabold">
                Withdrawal Details
              </h2>

              <p className="text-[#8f8f8f] text-xs mt-1">
                अपने payment details सही-सही भरें।
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* AMOUNT */}
            <InputField
              label="Withdrawal Amount"
              name="amount"
              type="number"
              placeholder="Enter amount"
              value={form.amount}
              onChange={handleChange}
              icon={<Banknote size={19} />}
              required
            />

            {/* ACCOUNT HOLDER */}
            <InputField
              label="Account Holder Name"
              name="accountHolderName"
              placeholder="Enter account holder name"
              value={form.accountHolderName}
              onChange={handleChange}
              icon={<CreditCard size={19} />}
              required
            />

            {/* ACCOUNT NUMBER */}
            <InputField
              label="Account Number"
              name="accountNumber"
              type="text"
              placeholder="Enter account number"
              value={form.accountNumber}
              onChange={handleChange}
              icon={<CreditCard size={19} />}
              required
            />

            {/* IFSC */}
            <InputField
              label="IFSC Code"
              name="ifscCode"
              placeholder="Enter IFSC code"
              value={form.ifscCode}
              onChange={handleChange}
              icon={<Landmark size={19} />}
              required
            />

            {/* BANK NAME */}
            <InputField
              label="Bank Name"
              name="bankName"
              placeholder="Enter bank name"
              value={form.bankName}
              onChange={handleChange}
              icon={<Landmark size={19} />}
              required
            />

            {/* BRANCH */}
            <InputField
              label="Branch Name"
              name="branchName"
              placeholder="Enter branch name"
              value={form.branchName}
              onChange={handleChange}
              icon={<Landmark size={19} />}
            />

            {/* UPI */}
            <InputField
              label="UPI ID"
              name="upiId"
              placeholder="example@upi"
              value={form.upiId}
              onChange={handleChange}
              icon={<Smartphone size={19} />}
            />

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 rounded-xl py-4 text-black text-[17px] font-extrabold flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background:
                  "linear-gradient(180deg, #FFD966 0%, #f5c542 50%, #d4a017 100%)",
                boxShadow:
                  "0 4px 18px rgba(245,197,66,0.25), inset 0 1px 0 rgba(255,255,255,0.45)",
              }}
            >
              {loading ? (
                <>
                  <Loader2
                    size={21}
                    className="animate-spin"
                  />
                  Processing...
                </>
              ) : (
                <>
                  <Banknote size={21} />
                  Request Withdrawal
                </>
              )}
            </button>
          </form>
        </div>

        {/* ==================================================
            WITHDRAWAL HISTORY
        ================================================== */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-extrabold">
                Withdrawal History
              </h2>

              <p className="text-[#8f8f8f] text-xs mt-1">
                आपके सभी withdrawal requests
              </p>
            </div>

            <div className="px-3 py-1.5 rounded-lg border border-[#80631f] bg-[#17130a] text-[#f5c542] text-xs font-bold">
              {myWithdrawals?.length || 0} Requests
            </div>
          </div>

          <div className="space-y-3">

            {myWithdrawals?.map((w) => {
              const status =
                statusConfig[w.status] || statusConfig.pending;

              const StatusIcon = status.icon;

              return (
                <div
                  key={w._id}
                  className="rounded-[18px] border border-[#303030] bg-[#0b0c0c] p-4 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">

                    {/* LEFT */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-[#211b0b] border border-[#80631f] flex items-center justify-center">
                          <Banknote
                            size={19}
                            className="text-[#f5c542]"
                          />
                        </div>

                        <div>
                          <p className="text-[#999] text-xs">
                            Withdrawal Amount
                          </p>

                          <p className="text-white text-xl font-extrabold">
                            ₹{Number(w.amount || 0).toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>

                      {/* DATE */}
                      <p className="text-[#777] text-xs mt-3">
                        {w.createdAt
                          ? new Date(w.createdAt).toLocaleString()
                          : "-"}
                      </p>
                    </div>

                    {/* STATUS */}
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold capitalize ${status.className}`}
                    >
                      <StatusIcon size={14} />
                      {status.label}
                    </div>
                  </div>

                  {/* BANK DETAILS */}
                  <div className="mt-4 pt-4 border-t border-[#242424]">

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                      <div>
                        <p className="text-[#707070] text-[11px]">
                          Bank
                        </p>

                        <p className="text-[#d6d6d6] text-sm mt-1">
                          {w.bankDetail?.bankName || "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[#707070] text-[11px]">
                          Account Number
                        </p>

                        <p className="text-[#d6d6d6] text-sm mt-1">
                          {w.bankDetail?.accountNumber
                            ? `A/C ${w.bankDetail.accountNumber}`
                            : "-"}
                        </p>
                      </div>

                    </div>

                    {/* REMARK */}
                    {w.adminRemark && (
                      <div className="mt-3 rounded-xl border border-[#303030] bg-black/30 p-3">
                        <p className="text-[#707070] text-[11px]">
                          Admin Remark
                        </p>

                        <p className="text-[#cfcfcf] text-sm mt-1">
                          {w.adminRemark}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* EMPTY */}
            {(!myWithdrawals ||
              myWithdrawals.length === 0) && (
              <div className="rounded-[20px] border border-[#303030] bg-[#0b0c0c] p-8 text-center">
                <div className="w-14 h-14 rounded-full border border-[#80631f] bg-[#17130a] flex items-center justify-center mx-auto">
                  <Wallet
                    size={26}
                    className="text-[#f5c542]"
                  />
                </div>

                <p className="text-white font-bold mt-4">
                  No Withdrawals Yet
                </p>

                <p className="text-[#777] text-sm mt-1">
                  आपके withdrawal requests यहां दिखाई देंगे।
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ==================================================
            FOOTER
        ================================================== */}
        <div className="pt-3 flex flex-col items-center">
          <div className="w-full flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#f5c542] to-[#f5c542]" />

            <div className="text-[#f5c542]">
              <SmallLotus />
            </div>

            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#f5c542] to-[#f5c542]" />
          </div>

          <p className="text-[#f5c542] text-sm mt-2">
            खेलो विश्वास के साथ
          </p>
        </div>

      </div>
    </div>
  );
};

// ==========================================================
// INPUT FIELD
// ==========================================================

const InputField = ({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  icon,
  required = false,
}) => {
  return (
    <div>
      <label className="block text-[#c8c8c8] text-sm font-semibold mb-2">
        {label}
        {required && (
          <span className="text-[#f5c542] ml-1">
            *
          </span>
        )}
      </label>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#80631f] pointer-events-none">
          {icon}
        </div>

        <input
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          min={name === "amount" ? "1" : undefined}
          className="w-full h-[52px] rounded-xl border border-[#303030] bg-[#080909] text-white placeholder:text-[#555] pl-12 pr-4 outline-none transition focus:border-[#f5c542] focus:ring-1 focus:ring-[#f5c542]/20"
        />
      </div>
    </div>
  );
};

// ==========================================================
// SMALL LOTUS
// ==========================================================

const SmallLotus = () => (
  <svg
    width="42"
    height="27"
    viewBox="0 0 46 30"
    fill="none"
  >
    <path
      d="M23 2C19 7 19 12 23 16C27 12 27 7 23 2Z"
      fill="#f5c542"
    />

    <path
      d="M23 13C15 13 9 17 6 23C13 24 19 21 23 13Z"
      fill="#f5c542"
    />

    <path
      d="M23 13C31 13 37 17 40 23C33 24 27 21 23 13Z"
      fill="#f5c542"
    />

    <path
      d="M23 13C20 19 20 24 23 28C26 24 26 19 23 13Z"
      fill="#f5c542"
    />
  </svg>
);

export default WithdrawalRequest;
