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

  const { myWithdrawals, loading, error, success } = useSelector(
    (s) => s.withdrawal
  );

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

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    dispatch(
      createWithdrawal({
        ...form,
        amount: Number(form.amount),
      })
    );
  };

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
      className: "border-yellow-300 bg-yellow-50 text-yellow-700",
    },
    approved: {
      icon: CheckCircle2,
      label: "Approved",
      className: "border-green-300 bg-green-50 text-green-700",
    },
    rejected: {
      icon: XCircle,
      label: "Rejected",
      className: "border-red-300 bg-red-50 text-red-700",
    },
  };

  return (
    <div className="min-h-screen bg-[#EBF0F7] text-[#1b2a5c] px-4 sm:px-5 pt-4 pb-8">
      {/* ==================================================
          HEADER
      ================================================== */}
      <div className="max-w-3xl mx-auto mb-5">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-[#5a6082] hover:text-[#ed1d43] transition mb-4"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-semibold">Go Back</span>
        </button>

        <div>
          <p className="text-[#ed1d43] text-sm font-semibold tracking-wide">
            WALLET
          </p>

          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1 text-[#1b2a5c]">
            Withdraw Money
          </h1>

          <p className="text-[#5a6082] text-sm mt-2">
            Request a withdrawal to your bank account or UPI.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-5">
        {/* ==================================================
            WALLET CARD
        ================================================== */}
        <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#0f1c4d] via-[#1b2a5c] to-[#2c3a72] p-5 sm:p-6 shadow-[0_12px_30px_rgba(15,28,77,0.25)]">
          {/* Decorative circles */}
          <div className="absolute right-[-45px] top-[-45px] w-36 h-36 rounded-full border border-white/10" />
          <div className="absolute right-[-20px] top-[-20px] w-24 h-24 rounded-full border border-white/10" />

          <div className="relative flex items-center gap-4">
            <div className="w-[62px] h-[62px] rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <Wallet size={31} className="text-[#ffd84a]" />
            </div>

            <div>
              <p className="text-white/70 text-sm">Available Wallet Balance</p>

              <p className="text-[#ffd84a] text-3xl sm:text-4xl font-extrabold mt-1">
                ₹{formattedWalletBalance}
              </p>
            </div>
          </div>

          <div className="relative mt-5 flex items-center gap-2 text-white/70 text-xs">
            <ShieldCheck size={16} className="text-[#ffd84a]" />
            <span>Your withdrawal request will be processed securely.</span>
          </div>
        </div>

        {/* ==================================================
            SUCCESS MESSAGE
        ================================================== */}
        {success && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 flex items-start gap-3">
            <CheckCircle2
              size={22}
              className="text-green-600 flex-shrink-0 mt-0.5"
            />

            <div>
              <p className="text-green-700 font-bold">
                Withdrawal Request Submitted
              </p>

              <p className="text-green-700/80 text-sm mt-1">
                Your withdrawal request has been submitted successfully.
              </p>
            </div>
          </div>
        )}

        {/* ==================================================
            ERROR MESSAGE
        ================================================== */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
            <XCircle
              size={22}
              className="text-red-600 flex-shrink-0 mt-0.5"
            />

            <div>
              <p className="text-red-700 font-bold">Withdrawal Failed</p>

              <p className="text-red-700/80 text-sm mt-1">
                {typeof error === "string"
                  ? error
                  : "Could not submit withdrawal request."}
              </p>
            </div>
          </div>
        )}

        {/* ==================================================
            WITHDRAW FORM
        ================================================== */}
        <div className="rounded-[22px] border border-white bg-white p-5 sm:p-6 shadow-[0_8px_24px_rgba(15,28,77,0.08)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-[#ed1d43] flex items-center justify-center">
              <Banknote size={23} className="text-white" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-[#1b2a5c]">
                Withdrawal Details
              </h2>

              <p className="text-[#5a6082] text-xs mt-1">
                Enter your payment details correctly.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <InputField
              label="Account Holder Name"
              name="accountHolderName"
              placeholder="Enter account holder name"
              value={form.accountHolderName}
              onChange={handleChange}
              icon={<CreditCard size={19} />}
              required
            />

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

            <InputField
              label="IFSC Code"
              name="ifscCode"
              placeholder="Enter IFSC code"
              value={form.ifscCode}
              onChange={handleChange}
              icon={<Landmark size={19} />}
              required
            />

            <InputField
              label="Bank Name"
              name="bankName"
              placeholder="Enter bank name"
              value={form.bankName}
              onChange={handleChange}
              icon={<Landmark size={19} />}
              required
            />

            <InputField
              label="Branch Name"
              name="branchName"
              placeholder="Enter branch name"
              value={form.branchName}
              onChange={handleChange}
              icon={<Landmark size={19} />}
            />

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
              className="w-full mt-3 rounded-xl py-4 text-white text-[17px] font-extrabold flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-b from-red-500 to-red-700 shadow-[0_6px_18px_rgba(239,68,68,0.45)]"
            >
              {loading ? (
                <>
                  <Loader2 size={21} className="animate-spin" />
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
              <h2 className="text-xl font-extrabold text-[#1b2a5c]">
                Withdrawal History
              </h2>

              <p className="text-[#5a6082] text-xs mt-1">
                All your withdrawal requests
              </p>
            </div>

            <div className="px-3 py-1.5 rounded-lg border border-[#d6dfec] bg-white text-[#ed1d43] text-xs font-bold">
              {myWithdrawals?.length || 0} Requests
            </div>
          </div>

          <div className="space-y-3">
            {myWithdrawals?.map((w) => {
              const status = statusConfig[w.status] || statusConfig.pending;
              const StatusIcon = status.icon;

              return (
                <div
                  key={w._id}
                  className="rounded-[18px] border border-white bg-white p-4 sm:p-5 shadow-[0_6px_18px_rgba(15,28,77,0.06)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-[#ed1d43] flex items-center justify-center">
                          <Banknote size={19} className="text-white" />
                        </div>

                        <div>
                          <p className="text-[#5a6082] text-xs">
                            Withdrawal Amount
                          </p>

                          <p className="text-[#1b2a5c] text-xl font-extrabold">
                            ₹{Number(w.amount || 0).toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>

                      <p className="text-[#8a97ab] text-xs mt-3">
                        {w.createdAt
                          ? new Date(w.createdAt).toLocaleString()
                          : "-"}
                      </p>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold capitalize ${status.className}`}
                    >
                      <StatusIcon size={14} />
                      {status.label}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#e2e5f0]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-[#8a97ab] text-[11px]">Bank</p>
                        <p className="text-[#1b2a5c] text-sm mt-1">
                          {w.bankDetail?.bankName || "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[#8a97ab] text-[11px]">
                          Account Number
                        </p>
                        <p className="text-[#1b2a5c] text-sm mt-1">
                          {w.bankDetail?.accountNumber
                            ? `A/C ${w.bankDetail.accountNumber}`
                            : "-"}
                        </p>
                      </div>
                    </div>

                    {w.adminRemark && (
                      <div className="mt-3 rounded-xl border border-[#e2e5f0] bg-[#f6f9fe] p-3">
                        <p className="text-[#8a97ab] text-[11px]">
                          Admin Remark
                        </p>

                        <p className="text-[#1b2a5c] text-sm mt-1">
                          {w.adminRemark}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {(!myWithdrawals || myWithdrawals.length === 0) && (
              <div className="rounded-[20px] border border-white bg-white p-8 text-center shadow-[0_6px_18px_rgba(15,28,77,0.06)]">
                <div className="w-14 h-14 rounded-full bg-[#ed1d43] flex items-center justify-center mx-auto">
                  <Wallet size={26} className="text-white" />
                </div>

                <p className="text-[#1b2a5c] font-bold mt-4">
                  No Withdrawals Yet
                </p>

                <p className="text-[#5a6082] text-sm mt-1">
                  Your withdrawal requests will appear here.
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
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#1b2a5c]/30" />
            <ShieldCheck size={20} className="text-[#1b2a5c]" />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#1b2a5c]/30" />
          </div>

          <p className="text-[#1b2a5c] text-sm mt-2 font-medium">
            Play with trust
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
      <label className="block text-[#26354b] text-sm font-semibold mb-2">
        {label}
        {required && <span className="text-[#ed1d43] ml-1">*</span>}
      </label>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ed1d43] pointer-events-none">
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
          className="w-full h-[52px] rounded-xl border border-[#d6dfec] bg-[#f6f9fe] text-[#1b2a5c] placeholder:text-[#8a97ab] pl-12 pr-4 outline-none transition focus:border-[#ed1d43] focus:bg-white focus:shadow-[0_0_0_3px_rgba(237,29,67,0.12)]"
        />
      </div>
    </div>
  );
};

export default WithdrawalRequest;