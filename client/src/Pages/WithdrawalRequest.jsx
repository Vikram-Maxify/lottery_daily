import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  createWithdrawal,
  fetchMyWithdrawals,
  resetWithdrawalState,
  clearWithdrawalErrors,
} from "../reducer/slice/withdrawalSlice";
import { getMyKyc, selectKycDocuments } from "../reducer/slice/kycReducer";

import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  ExternalLink,
  History,
  Landmark,
  Loader2,
  Plus,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Trash2,
  Wallet,
  X,
  XCircle,
  Zap,
} from "lucide-react";

// ==========================================================
// UPI REGEX (Matches backend withdrawalController.js)
// ==========================================================
const isValidUpiId = (upi) => {
  if (typeof upi !== "string") return false;
  const upiRegex = /^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/;
  return upiRegex.test(upi.trim());
};

// ==========================================================
// IFSC REGEX (Indian Banking: 4 letters + 0 + 6 alphanumeric)
// ==========================================================
const isValidIfsc = (ifsc) => {
  if (typeof ifsc !== "string") return false;
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscRegex.test(ifsc.trim().toUpperCase());
};

const POPULAR_UPI_HANDLES = ["@okhdfcbank", "@okaxis", "@okicici", "@oksbi", "@paytm", "@ybl"];
const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000];

const POPULAR_BANKS = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Punjab National Bank",
  "Bank of Baroda",
];

const WithdrawalRequest = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const {
    myWithdrawals = [],
    loading,
    error,
    errorDetails,
    kycRequired,
    success,
    successMessage,
  } = useSelector((s) => s.withdrawal || {});

  const user = useSelector((s) => s.auth?.user);
  const kycDocuments = useSelector(selectKycDocuments);

  // Storage key scoped to logged-in user
  const userKey = user?.uuid || user?._id || user?.mobile || "user";
  const storageKey = `lottery_payment_methods_${userKey}`;

  // Saved Payment Methods State
  const [savedMethods, setSavedMethods] = useState([]);
  const [selectedMethodId, setSelectedMethodId] = useState(null);

  // Modals State
  const [showAddMethodModal, setShowAddMethodModal] = useState(false);
  const [showKycRequiredModal, setShowKycRequiredModal] = useState(false);
  const [methodToDelete, setMethodToDelete] = useState(null);

  // Add Method Form State inside Modal
  const [methodType, setMethodType] = useState("bank"); // "bank" | "upi"
  const [methodForm, setMethodForm] = useState({
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    branchName: "",
    upiId: "",
  });
  const [methodFormErrors, setMethodFormErrors] = useState({});
  const [feedbackToast, setFeedbackToast] = useState(null);

  // Withdrawal Amount State
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState("");
  const [lastSubmittedAmount, setLastSubmittedAmount] = useState(null);

  // ==========================================================
  // INITIAL FETCHES
  // ==========================================================
  useEffect(() => {
    dispatch(fetchMyWithdrawals());
    dispatch(getMyKyc());
  }, [dispatch]);

  // ==========================================================
  // LOAD SAVED METHODS FROM LOCAL STORAGE
  // Auto-populate from existing withdrawals if local is empty
  // ==========================================================
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      let methods = [];
      if (raw) {
        methods = JSON.parse(raw);
      }

      if ((!methods || methods.length === 0) && myWithdrawals && myWithdrawals.length > 0) {
        const inferred = [];
        myWithdrawals.forEach((w) => {
          if (w.paymentMethod === "bank" && w.bankDetail?.accountNumber) {
            const exists = inferred.some(
              (m) =>
                m.type === "bank" &&
                m.accountNumber === w.bankDetail.accountNumber
            );
            if (!exists) {
              inferred.push({
                id: `bank_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                type: "bank",
                bankName: w.bankDetail.bankName || "Bank Account",
                accountHolderName: w.bankDetail.accountHolderName || "",
                accountNumber: w.bankDetail.accountNumber,
                ifscCode: w.bankDetail.ifscCode || "",
                branchName: w.bankDetail.branchName || "",
              });
            }
          } else if (w.paymentMethod === "upi" && w.bankDetail?.upiId) {
            const exists = inferred.some(
              (m) => m.type === "upi" && m.upiId === w.bankDetail.upiId
            );
            if (!exists) {
              inferred.push({
                id: `upi_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                type: "upi",
                upiId: w.bankDetail.upiId,
              });
            }
          }
        });

        if (inferred.length > 0) {
          methods = inferred;
          localStorage.setItem(storageKey, JSON.stringify(methods));
        }
      }

      setSavedMethods(Array.isArray(methods) ? methods : []);
      if (methods && methods.length > 0) {
        setSelectedMethodId(methods[0].id);
      }
    } catch (e) {
      console.error("Failed to load saved payment methods", e);
    }
  }, [storageKey, myWithdrawals]);

  // Persist methods
  const saveMethodsToStorage = (updatedList) => {
    setSavedMethods(updatedList);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedList));
    } catch (e) {
      console.error("Failed to save payment methods", e);
    }
  };

  // ==========================================================
  // RESET FORM AFTER SUCCESS
  // ==========================================================
  useEffect(() => {
    if (success) {
      setAmount("");
      setAmountError("");
      const timer = setTimeout(() => {
        dispatch(resetWithdrawalState());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);

  // Listen to server error if KYC required returned from API
  useEffect(() => {
    if (kycRequired || errorDetails?.kycVerified === false) {
      setShowKycRequiredModal(true);
    }
  }, [kycRequired, errorDetails]);

  // ==========================================================
  // KYC STATUS CHECK
  // ==========================================================
  const isKycApproved = useMemo(() => {
    if (user?.isKycVerified === true) return true;
    if (Array.isArray(kycDocuments) && kycDocuments.length > 0) {
      return kycDocuments.some(
        (doc) => String(doc?.status || "").toLowerCase() === "approved"
      );
    }
    return false;
  }, [user, kycDocuments]);

  // Active selected method
  const selectedMethod = useMemo(() => {
    return (
      savedMethods.find((m) => m.id === selectedMethodId) ||
      savedMethods[0] ||
      null
    );
  }, [savedMethods, selectedMethodId]);

  const walletBalance = Number(user?.wallet || 0);

  const formattedWalletBalance = walletBalance.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  // ==========================================================
  // ADD PAYMENT METHOD FORM HANDLERS
  // ==========================================================
  const handleOpenAddModal = (type = "bank") => {
    setMethodType(type);
    setMethodFormErrors({});
    setMethodForm({
      bankName: "",
      accountHolderName: user?.name || "",
      accountNumber: "",
      confirmAccountNumber: "",
      ifscCode: "",
      branchName: "",
      upiId: "",
    });
    setShowAddMethodModal(true);
  };

  const handleMethodFormChange = (e) => {
    const { name, value } = e.target;
    setMethodForm((prev) => ({
      ...prev,
      [name]: name === "ifscCode" ? value.toUpperCase() : value,
    }));
    if (methodFormErrors[name]) {
      setMethodFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleAppendUpiDomain = (handle) => {
    const currentVal = methodForm.upiId.trim();
    if (!currentVal) {
      setMethodForm((prev) => ({ ...prev, upiId: `user${handle}` }));
      return;
    }
    const username = currentVal.includes("@") ? currentVal.split("@")[0] : currentVal;
    setMethodForm((prev) => ({ ...prev, upiId: `${username}${handle}` }));
    if (methodFormErrors.upiId) {
      setMethodFormErrors((prev) => ({ ...prev, upiId: "" }));
    }
  };

  const validateMethodForm = () => {
    const errors = {};

    if (methodType === "bank") {
      if (!methodForm.bankName.trim()) {
        errors.bankName = "Bank name is required";
      }
      if (!methodForm.accountHolderName.trim()) {
        errors.accountHolderName = "Account holder name is required";
      }
      if (!methodForm.accountNumber.trim()) {
        errors.accountNumber = "Account number is required";
      } else if (!/^\d{8,20}$/.test(methodForm.accountNumber.trim())) {
        errors.accountNumber = "Account number must be 8-20 numeric digits";
      }
      if (!methodForm.confirmAccountNumber.trim()) {
        errors.confirmAccountNumber = "Please confirm your account number";
      } else if (
        methodForm.accountNumber.trim() !== methodForm.confirmAccountNumber.trim()
      ) {
        errors.confirmAccountNumber = "Account numbers do not match";
      }
      if (!methodForm.ifscCode.trim()) {
        errors.ifscCode = "IFSC code is required";
      } else if (!isValidIfsc(methodForm.ifscCode.trim())) {
        errors.ifscCode = "Invalid IFSC format (e.g. SBIN0001234)";
      }
    } else if (methodType === "upi") {
      if (!methodForm.upiId.trim()) {
        errors.upiId = "UPI ID is required";
      } else if (!isValidUpiId(methodForm.upiId.trim())) {
        errors.upiId = "Invalid format (e.g. name@bank or 9876543210@paytm)";
      }
    }

    setMethodFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveMethod = (e) => {
    e.preventDefault();
    if (!validateMethodForm()) return;

    let newEntry;
    if (methodType === "bank") {
      newEntry = {
        id: `bank_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: "bank",
        bankName: methodForm.bankName.trim(),
        accountHolderName: methodForm.accountHolderName.trim(),
        accountNumber: methodForm.accountNumber.trim(),
        ifscCode: methodForm.ifscCode.trim().toUpperCase(),
        branchName: methodForm.branchName?.trim() || "",
      };
    } else {
      newEntry = {
        id: `upi_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: "upi",
        upiId: methodForm.upiId.trim(),
      };
    }

    const updated = [newEntry, ...savedMethods];
    saveMethodsToStorage(updated);
    setSelectedMethodId(newEntry.id);
    setShowAddMethodModal(false);

    setFeedbackToast({
      type: "success",
      message: `${methodType === "bank" ? "Bank Account" : "UPI ID"} added successfully!`,
    });
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const handleDeleteMethod = (id) => {
    const updated = savedMethods.filter((m) => m.id !== id);
    saveMethodsToStorage(updated);
    setMethodToDelete(null);

    if (selectedMethodId === id) {
      if (updated.length > 0) {
        setSelectedMethodId(updated[0].id);
      } else {
        setSelectedMethodId(null);
      }
    }
  };

  // ==========================================================
  // WITHDRAWAL CONFIRMATION & SUBMIT
  // ==========================================================
  const handleAmountChange = (e) => {
    const val = e.target.value;
    setAmount(val);
    if (amountError) setAmountError("");
    if (error) dispatch(clearWithdrawalErrors());
  };

  const handleQuickAmount = (val) => {
    setAmount(String(val));
    if (amountError) setAmountError("");
    if (error) dispatch(clearWithdrawalErrors());
  };

  const handleWithdrawAll = () => {
    if (walletBalance > 0) {
      setAmount(String(Math.floor(walletBalance)));
      if (amountError) setAmountError("");
      if (error) dispatch(clearWithdrawalErrors());
    }
  };

  const handleWithdrawSubmit = (e) => {
    e.preventDefault();
    dispatch(clearWithdrawalErrors());

    // 1. If NO payment method added, prompt popup
    if (!selectedMethod) {
      setShowAddMethodModal(true);
      return;
    }

    // 2. Validate amount
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setAmountError("Please enter a valid amount greater than 0");
      return;
    }

    if (amt > walletBalance) {
      setAmountError(
        `Insufficient balance. You have ₹${formattedWalletBalance} available.`
      );
      return;
    }

    // 3. KYC CHECK WHEN USER CONFIRMS WITHDRAWAL
    // As per requirement: "kyc ka error tab jayega jab user withdrawal confirm krne jayega tab dikhayenge"
    if (!isKycApproved) {
      setShowKycRequiredModal(true);
      return;
    }

    setAmountError("");
    setLastSubmittedAmount(amt);

    // 4. Construct payload for backend
    let payload = {
      amount: amt,
      paymentMethod: selectedMethod.type, // "bank" | "upi"
    };

    if (selectedMethod.type === "bank") {
      payload = {
        ...payload,
        accountHolderName: selectedMethod.accountHolderName,
        accountNumber: selectedMethod.accountNumber,
        ifscCode: selectedMethod.ifscCode,
        bankName: selectedMethod.bankName,
        branchName: selectedMethod.branchName || "",
      };
    } else if (selectedMethod.type === "upi") {
      payload = {
        ...payload,
        upiId: selectedMethod.upiId,
      };
    }

    dispatch(createWithdrawal(payload));
  };

  // Status Badge Config
  const statusConfig = {
    pending: {
      icon: Clock3,
      label: "Pending",
      className: "border-amber-300/40 bg-amber-500/10 text-amber-600",
    },
    approved: {
      icon: CheckCircle2,
      label: "Approved",
      className: "border-emerald-300/40 bg-emerald-500/10 text-emerald-600",
    },
    rejected: {
      icon: XCircle,
      label: "Rejected",
      className: "border-red-300/40 bg-red-500/10 text-red-600",
    },
  };

  return (
    <div className="min-h-screen bg-[#F0F4F9] text-[#131E3D] px-3 sm:px-6 pt-4 pb-14">
      {/* ==================================================
          TOP TOAST NOTIFICATION
      ================================================== */}
      {feedbackToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#0f1c4d] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={18} className="text-[#ffd84a]" />
          <span className="text-sm font-bold">{feedbackToast.message}</span>
        </div>
      )}

      {/* ==================================================
          NAVBAR / HEADER
      ================================================== */}
      <div className="max-w-2xl mx-auto mb-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-[#5a6788] hover:text-[#ed1d43] transition font-bold text-sm bg-white/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#dce3ee] shadow-xs active:scale-95"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/withdraw-history")}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#1b2a5c] hover:text-[#ed1d43] transition bg-white px-3.5 py-2 rounded-xl border border-[#dce3ee] shadow-xs"
          >
            <History size={15} className="text-[#ed1d43]" />
            <span>History</span>
          </button>
        </div>

        <div className="mt-4">
          <p className="text-[#ed1d43] text-xs font-black tracking-widest uppercase flex items-center gap-1.5">
            <Zap size={14} className="fill-[#ed1d43]" /> Instant Payouts
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-[#131E3D] tracking-tight mt-0.5">
            Withdraw Funds
          </h1>
          <p className="text-[#5f6e8f] text-xs sm:text-sm mt-0.5">
            Safely transfer your winning balance to your Bank Account or UPI ID.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-5">
        {/* ==================================================
            ULTRA-PREMIUM WALLET CARD
        ================================================== */}
        <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#0a122e] via-[#152352] to-[#1d2f6d] p-5 sm:p-6 text-white shadow-[0_16px_40px_rgba(10,18,46,0.35)] border border-white/10">
          {/* Subtle Ambient Glows */}
          <div className="absolute right-[-30px] top-[-30px] w-48 h-48 rounded-full bg-[#ffd84a]/10 blur-2xl pointer-events-none" />
          <div className="absolute left-[-20px] bottom-[-20px] w-40 h-40 rounded-full bg-[#ed1d43]/15 blur-2xl pointer-events-none" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 border border-white/20 flex items-center justify-center shadow-inner">
                <Wallet size={24} className="text-[#ffd84a]" />
              </div>
              <div>
                <p className="text-white/70 text-xs font-semibold tracking-wide uppercase">
                  Available Wallet Balance
                </p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-[#ffd84a] text-3xl sm:text-4xl font-black tracking-tight">
                    ₹{formattedWalletBalance}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => dispatch(fetchMyWithdrawals())}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition active:scale-95"
              title="Refresh Balance"
            >
              <RefreshCw size={15} />
            </button>
          </div>

          <div className="relative mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between text-xs text-white/75 font-medium">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-[#ffd84a]" />
              <span>100% Encrypted & Direct Settlement</span>
            </div>
            <span className="text-[11px] text-[#ffd84a] font-bold bg-[#ffd84a]/15 px-2.5 py-0.5 rounded-full border border-[#ffd84a]/20">
              0% Fee
            </span>
          </div>
        </div>

        {/* ==================================================
            SUCCESS NOTIFICATION
        ================================================== */}
        {success && (
          <div className="rounded-[22px] border border-emerald-300 bg-emerald-50/90 p-4 sm:p-5 shadow-sm animate-in fade-in">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <CheckCircle2 size={22} />
              </div>
              <div className="flex-1">
                <h3 className="text-emerald-950 font-black text-sm sm:text-base">
                  Withdrawal Request Submitted!
                </h3>
                <p className="text-emerald-800 text-xs mt-1 leading-relaxed">
                  {successMessage ||
                    `Your payout of ₹${lastSubmittedAmount || ""} is queued for approval. You will receive money in your chosen account soon.`}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate("/withdraw-history")}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs"
                  >
                    Track in History
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch(resetWithdrawalState())}
                    className="px-3 py-1.5 rounded-xl border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================
            ERROR BANNER
        ================================================== */}
        {error && !kycRequired && (
          <div className="rounded-[22px] border border-red-200 bg-red-50 p-4 sm:p-5 shadow-sm animate-in fade-in">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <XCircle size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-red-950 font-black text-sm sm:text-base">
                    Withdrawal Failed
                  </h3>
                  <button
                    type="button"
                    onClick={() => dispatch(clearWithdrawalErrors())}
                    className="text-red-400 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="text-red-800 text-xs mt-1 font-medium">
                  {typeof error === "string" ? error : "Could not process withdrawal request."}
                </p>
                {errorDetails?.balance !== undefined && (
                  <p className="text-xs text-red-700 bg-red-100 p-2 rounded-lg mt-2 font-semibold">
                    Current Balance: ₹{errorDetails.balance} • Requested: ₹{errorDetails.requestedAmount}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================
            STEP 1: WITHDRAWAL DESTINATION CARD
        ================================================== */}
        <div className="rounded-[24px] border border-white bg-white p-5 sm:p-6 shadow-[0_8px_25px_rgba(15,28,77,0.06)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#ed1d43] text-white flex items-center justify-center font-black text-xs">
                1
              </div>
              <h2 className="text-base sm:text-lg font-black text-[#131E3D]">
                Payout Method
              </h2>
            </div>

            {savedMethods.length > 0 && (
              <button
                type="button"
                onClick={() => handleOpenAddModal("bank")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#d6dfec] bg-[#f8fafc] hover:bg-[#ed1d43] hover:text-white text-[#131E3D] text-xs font-bold transition shadow-xs"
              >
                <Plus size={14} />
                <span>Add Method</span>
              </button>
            )}
          </div>

          {/* EMPTY STATE: USER HAS NO PAYMENT METHOD */}
          {savedMethods.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#ccd6e6] bg-[#f9fbfe] p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#ed1d43] flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Landmark size={26} />
              </div>
              <h3 className="text-base font-extrabold text-[#131E3D]">
                No Payment Method Added
              </h3>
              <p className="text-xs text-[#5f6e8f] max-w-sm mx-auto mt-1 leading-relaxed">
                Add your verified Bank Account or UPI ID to receive fast withdrawals.
              </p>

              <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleOpenAddModal("bank")}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#ed1d43] hover:bg-[#d4153a] text-white text-xs font-extrabold transition shadow-md flex items-center justify-center gap-2 active:scale-95"
                >
                  <Plus size={15} />
                  <span>+ Add Bank Account</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAddModal("upi")}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0f1c4d] hover:bg-[#1a2d73] text-white text-xs font-extrabold transition shadow-md flex items-center justify-center gap-2 active:scale-95"
                >
                  <Smartphone size={15} />
                  <span>+ Add UPI ID</span>
                </button>
              </div>
            </div>
          ) : (
            /* LIST OF SAVED METHODS */
            <div className="space-y-2.5">
              {savedMethods.map((m) => {
                const isSelected = selectedMethod?.id === m.id;

                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMethodId(m.id)}
                    className={`group relative cursor-pointer rounded-2xl p-4 border transition-all duration-200 flex items-center justify-between gap-3 ${
                      isSelected
                        ? "border-[#ed1d43] bg-gradient-to-r from-red-50/50 to-white shadow-[0_4px_16px_rgba(237,29,67,0.12)] ring-2 ring-[#ed1d43]/15"
                        : "border-[#e2e7f0] bg-[#fbfcfe] hover:border-[#cbd5e1] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Selection radio check */}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                          isSelected
                            ? "border-[#ed1d43] bg-[#ed1d43] text-white shadow-xs"
                            : "border-[#ccd6e6] bg-white group-hover:border-[#94a3b8]"
                        }`}
                      >
                        {isSelected && <Check size={13} strokeWidth={3} />}
                      </div>

                      {/* Icon */}
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          m.type === "bank"
                            ? "bg-blue-50 text-[#15275e] border border-blue-100"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        }`}
                      >
                        {m.type === "bank" ? (
                          <Landmark size={20} />
                        ) : (
                          <Smartphone size={20} />
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0">
                        {m.type === "bank" ? (
                          <>
                            <div className="flex items-center gap-2">
                              <p className="font-extrabold text-sm text-[#131E3D] truncate">
                                {m.bankName}
                              </p>
                              {isSelected && (
                                <span className="text-[10px] font-bold text-[#ed1d43] bg-red-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                  Selected
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-mono font-semibold text-[#5a6788] mt-0.5">
                              A/C •••• {m.accountNumber?.slice(-4) || m.accountNumber}
                            </p>
                            <p className="text-[11px] text-[#8a97ab] truncate">
                              Holder: {m.accountHolderName} • IFSC: {m.ifscCode}
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <p className="font-mono font-bold text-sm text-emerald-800 truncate">
                                {m.upiId}
                              </p>
                              {isSelected && (
                                <span className="text-[10px] font-bold text-[#ed1d43] bg-red-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                  Selected
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#8a97ab] mt-0.5">
                              Instant UPI Transfer
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMethodToDelete(m);
                      }}
                      title="Remove method"
                      className="text-[#94a3b8] hover:text-red-600 p-2 transition rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ==================================================
            STEP 2: WITHDRAWAL AMOUNT & SUBMIT
        ================================================== */}
        <div className="rounded-[24px] border border-white bg-white p-5 sm:p-6 shadow-[0_8px_25px_rgba(15,28,77,0.06)]">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-[#ed1d43] text-white flex items-center justify-center font-black text-xs">
              2
            </div>
            <h2 className="text-base sm:text-lg font-black text-[#131E3D]">
              Withdrawal Amount
            </h2>
          </div>

          <form onSubmit={handleWithdrawSubmit} className="space-y-4">
            {/* Amount Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#26354b]">
                  Enter Amount <span className="text-[#ed1d43]">*</span>
                </label>
                <span className="text-xs font-semibold text-[#5a6788]">
                  Available: <strong className="text-[#131E3D]">₹{formattedWalletBalance}</strong>
                </span>
              </div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-[#131E3D] pointer-events-none">
                  ₹
                </div>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={handleAmountChange}
                  className={`w-full h-14 pl-11 pr-24 rounded-2xl border text-xl font-black outline-none transition ${
                    amountError
                      ? "border-red-400 bg-red-50/20 text-red-700"
                      : "border-[#d6dfec] bg-[#f8fafc] text-[#131E3D] focus:border-[#ed1d43] focus:bg-white focus:shadow-[0_0_0_3px_rgba(237,29,67,0.1)]"
                  }`}
                />
                <button
                  type="button"
                  onClick={handleWithdrawAll}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#e9edf5] hover:bg-[#ed1d43] hover:text-white text-xs font-black text-[#131E3D] transition active:scale-95"
                >
                  MAX
                </button>
              </div>

              {amountError && (
                <p className="text-xs text-red-600 font-bold mt-1.5 flex items-center gap-1 animate-in fade-in">
                  <AlertTriangle size={13} />
                  {amountError}
                </p>
              )}

              {/* Quick Select Chips */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-[#8a97ab] font-bold">
                  Quick Add:
                </span>
                {QUICK_AMOUNTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleQuickAmount(q)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition active:scale-95 ${
                      Number(amount) === q
                        ? "bg-[#ed1d43] text-white border-[#ed1d43]"
                        : "bg-[#f8fafc] text-[#131E3D] border-[#d6dfec] hover:border-[#ed1d43]"
                    }`}
                  >
                    +₹{q.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Destination Summary */}
            {selectedMethod && (
              <div className="rounded-2xl border border-[#e2e7f0] bg-[#fbfcfe] p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[#8a97ab] font-medium">Payout to:</span>
                  <span className="font-extrabold text-[#131E3D] truncate">
                    {selectedMethod.type === "bank"
                      ? `${selectedMethod.bankName} (•••• ${selectedMethod.accountNumber?.slice(-4)})`
                      : selectedMethod.upiId}
                  </span>
                </div>
                <span className="font-bold text-emerald-600 text-[11px]">Free Transfer</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl text-white text-base font-black flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-[#ed1d43] to-[#c70f31] hover:from-[#d4153a] hover:to-[#b00b2a] shadow-[0_8px_25px_rgba(237,29,67,0.35)]"
            >
              {loading ? (
                <>
                  <Loader2 size={22} className="animate-spin" />
                  <span>Processing Withdrawal...</span>
                </>
              ) : (
                <>
                  <Banknote size={22} />
                  <span>
                    {Number(amount) > 0
                      ? `Confirm & Withdraw ₹${Number(amount).toLocaleString("en-IN")}`
                      : "Confirm Withdrawal"}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* ==================================================
            WITHDRAWAL HISTORY SECTION
        ================================================== */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h2 className="text-lg font-black text-[#131E3D]">
                Recent Withdrawals
              </h2>
              <p className="text-[#5f6e8f] text-xs">
                Status of your payout requests
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/withdraw-history")}
              className="text-[#ed1d43] hover:underline text-xs font-bold flex items-center gap-1"
            >
              <span>See All</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {myWithdrawals?.slice(0, 5).map((w) => {
              const status = statusConfig[w.status] || statusConfig.pending;
              const StatusIcon = status.icon;

              return (
                <div
                  key={w._id}
                  className="rounded-[20px] border border-white bg-white p-4 shadow-[0_4px_16px_rgba(15,28,77,0.04)] transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-50 text-[#ed1d43] flex items-center justify-center flex-shrink-0">
                        <Banknote size={19} />
                      </div>
                      <div>
                        <p className="text-[#131E3D] text-base font-black">
                          ₹{Number(w.amount || 0).toLocaleString("en-IN")}
                        </p>
                        <p className="text-[#8a97ab] text-[11px] mt-0.5">
                          {w.createdAt ? new Date(w.createdAt).toLocaleString("en-IN") : "-"}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-black capitalize ${status.className}`}
                    >
                      <StatusIcon size={13} />
                      <span>{status.label}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#f0f4f9] flex items-center justify-between text-xs text-[#5a6788]">
                    <span className="font-medium capitalize">
                      {w.paymentMethod === "bank" ? "Bank Transfer" : "UPI Payout"}
                    </span>
                    <span className="font-mono font-semibold">
                      {w.paymentMethod === "bank"
                        ? w.bankDetail?.accountNumber
                          ? `A/C •••• ${w.bankDetail.accountNumber.slice(-4)}`
                          : "-"
                        : w.bankDetail?.upiId || "-"}
                    </span>
                  </div>

                  {w.adminRemark && (
                    <div className="mt-2.5 rounded-xl bg-[#f8fafc] border border-[#e2e7f0] p-2.5 text-xs">
                      <span className="text-[#8a97ab] font-bold">Admin Remark: </span>
                      <span className="text-[#131E3D] font-medium">{w.adminRemark}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {(!myWithdrawals || myWithdrawals.length === 0) && (
              <div className="rounded-[20px] border border-white bg-white p-6 text-center shadow-xs">
                <p className="text-xs text-[#5a6788] font-medium">
                  No withdrawal requests found.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Security Trust Footer */}
        <div className="pt-3 text-center">
          <p className="text-[#8a97ab] text-xs font-medium flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} className="text-[#131E3D]" />
            <span>Guaranteed Secure & Regulatory Compliant Withdrawals</span>
          </p>
        </div>
      </div>

      {/* ==================================================
          MODAL 1: ADD PAYMENT METHOD POPUP
      ================================================== */}
      {showAddMethodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3.5 sm:p-4 animate-in fade-in duration-200">
          <div className="relative bg-white rounded-[26px] max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-t-0 border-b border-[#f0f4f9]">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-[#131E3D]">
                  Add Withdrawal Method
                </h3>
                <p className="text-xs text-[#5f6e8f] mt-0.5">
                  Select Bank Account or UPI to receive funds
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMethodModal(false)}
                className="w-8 h-8 rounded-full bg-[#f0f4f9] hover:bg-[#e2e8f0] text-[#5a6788] flex items-center justify-center transition"
              >
                <X size={17} />
              </button>
            </div>

            {/* Segmented Switcher: Bank vs UPI */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#f0f4f9] rounded-2xl mb-5">
              <button
                type="button"
                onClick={() => {
                  setMethodType("bank");
                  setMethodFormErrors({});
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition ${
                  methodType === "bank"
                    ? "bg-white text-[#131E3D] shadow-sm"
                    : "text-[#5f6e8f] hover:text-[#131E3D]"
                }`}
              >
                <Landmark size={16} />
                <span>Bank Account</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMethodType("upi");
                  setMethodFormErrors({});
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition ${
                  methodType === "upi"
                    ? "bg-white text-[#131E3D] shadow-sm"
                    : "text-[#5f6e8f] hover:text-[#131E3D]"
                }`}
              >
                <Smartphone size={16} />
                <span>UPI ID</span>
              </button>
            </div>

            <form onSubmit={handleSaveMethod} className="space-y-3.5">
              {/* ---------------- BANK ACCOUNT FIELDS ---------------- */}
              {methodType === "bank" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#26354b] mb-1">
                      Bank Name <span className="text-[#ed1d43]">*</span>
                    </label>
                    <input
                      type="text"
                      name="bankName"
                      placeholder="e.g. State Bank of India, HDFC"
                      value={methodForm.bankName}
                      onChange={handleMethodFormChange}
                      className={`w-full h-11 px-3.5 rounded-xl border bg-[#fbfcfe] text-sm outline-none transition ${
                        methodFormErrors.bankName
                          ? "border-red-400 bg-red-50/20"
                          : "border-[#d6dfec] focus:border-[#ed1d43] focus:bg-white"
                      }`}
                    />
                    {methodFormErrors.bankName && (
                      <p className="text-[11px] text-red-600 font-semibold mt-1">
                        {methodFormErrors.bankName}
                      </p>
                    )}

                    {/* Quick popular bank pills */}
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-[#8a97ab] font-bold">Suggestions:</span>
                      {POPULAR_BANKS.slice(0, 3).map((bank) => (
                        <button
                          key={bank}
                          type="button"
                          onClick={() => {
                            setMethodForm((p) => ({ ...p, bankName: bank }));
                            if (methodFormErrors.bankName) {
                              setMethodFormErrors((p) => ({ ...p, bankName: "" }));
                            }
                          }}
                          className="text-[10px] font-semibold text-[#131E3D] bg-[#f0f4f9] hover:bg-[#ed1d43] hover:text-white px-2 py-0.5 rounded-md transition"
                        >
                          {bank}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#26354b] mb-1">
                      Account Holder Name <span className="text-[#ed1d43]">*</span>
                    </label>
                    <input
                      type="text"
                      name="accountHolderName"
                      placeholder="Full Name as in Bank Records"
                      value={methodForm.accountHolderName}
                      onChange={handleMethodFormChange}
                      className={`w-full h-11 px-3.5 rounded-xl border bg-[#fbfcfe] text-sm outline-none transition ${
                        methodFormErrors.accountHolderName
                          ? "border-red-400 bg-red-50/20"
                          : "border-[#d6dfec] focus:border-[#ed1d43] focus:bg-white"
                      }`}
                    />
                    {methodFormErrors.accountHolderName && (
                      <p className="text-[11px] text-red-600 font-semibold mt-1">
                        {methodFormErrors.accountHolderName}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#26354b] mb-1">
                        Account Number <span className="text-[#ed1d43]">*</span>
                      </label>
                      <input
                        type="password"
                        name="accountNumber"
                        placeholder="Enter account number"
                        value={methodForm.accountNumber}
                        onChange={handleMethodFormChange}
                        className={`w-full h-11 px-3.5 rounded-xl border bg-[#fbfcfe] text-sm outline-none transition font-mono ${
                          methodFormErrors.accountNumber
                            ? "border-red-400 bg-red-50/20"
                            : "border-[#d6dfec] focus:border-[#ed1d43] focus:bg-white"
                        }`}
                      />
                      {methodFormErrors.accountNumber && (
                        <p className="text-[11px] text-red-600 font-semibold mt-1">
                          {methodFormErrors.accountNumber}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#26354b] mb-1">
                        Confirm Account Number <span className="text-[#ed1d43]">*</span>
                      </label>
                      <input
                        type="text"
                        name="confirmAccountNumber"
                        placeholder="Re-enter to confirm"
                        value={methodForm.confirmAccountNumber}
                        onChange={handleMethodFormChange}
                        className={`w-full h-11 px-3.5 rounded-xl border bg-[#fbfcfe] text-sm outline-none transition font-mono ${
                          methodFormErrors.confirmAccountNumber
                            ? "border-red-400 bg-red-50/20"
                            : "border-[#d6dfec] focus:border-[#ed1d43] focus:bg-white"
                        }`}
                      />
                      {methodFormErrors.confirmAccountNumber && (
                        <p className="text-[11px] text-red-600 font-semibold mt-1">
                          {methodFormErrors.confirmAccountNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#26354b] mb-1">
                        IFSC Code <span className="text-[#ed1d43]">*</span>
                      </label>
                      <input
                        type="text"
                        name="ifscCode"
                        placeholder="e.g. SBIN0001234"
                        maxLength={11}
                        value={methodForm.ifscCode}
                        onChange={handleMethodFormChange}
                        className={`w-full h-11 px-3.5 rounded-xl border bg-[#fbfcfe] text-sm outline-none transition font-mono uppercase ${
                          methodFormErrors.ifscCode
                            ? "border-red-400 bg-red-50/20"
                            : "border-[#d6dfec] focus:border-[#ed1d43] focus:bg-white"
                        }`}
                      />
                      {methodFormErrors.ifscCode && (
                        <p className="text-[11px] text-red-600 font-semibold mt-1">
                          {methodFormErrors.ifscCode}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#26354b] mb-1">
                        Branch Name (Optional)
                      </label>
                      <input
                        type="text"
                        name="branchName"
                        placeholder="e.g. Main Branch"
                        value={methodForm.branchName}
                        onChange={handleMethodFormChange}
                        className="w-full h-11 px-3.5 rounded-xl border border-[#d6dfec] focus:border-[#ed1d43] focus:bg-white bg-[#fbfcfe] text-sm outline-none transition"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ---------------- UPI FIELDS ---------------- */}
              {methodType === "upi" && (
                <div>
                  <label className="block text-xs font-bold text-[#26354b] mb-1">
                    UPI ID / VPA <span className="text-[#ed1d43]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#ed1d43]">
                      <Smartphone size={17} />
                    </div>
                    <input
                      type="text"
                      name="upiId"
                      placeholder="e.g. name@okhdfcbank or 9876543210@paytm"
                      value={methodForm.upiId}
                      onChange={handleMethodFormChange}
                      className={`w-full h-12 pl-10 pr-3.5 rounded-xl border bg-[#fbfcfe] text-sm font-medium outline-none transition ${
                        methodFormErrors.upiId
                          ? "border-red-400 bg-red-50/20"
                          : "border-[#d6dfec] focus:border-[#ed1d43] focus:bg-white"
                      }`}
                    />
                  </div>
                  {methodFormErrors.upiId && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1">
                      {methodFormErrors.upiId}
                    </p>
                  )}

                  {/* UPI Handle Quick Buttons */}
                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-[#8a97ab] font-bold">
                      Quick Handles:
                    </span>
                    {POPULAR_UPI_HANDLES.map((handle) => (
                      <button
                        key={handle}
                        type="button"
                        onClick={() => handleAppendUpiDomain(handle)}
                        className="text-[11px] font-semibold text-[#131E3D] bg-[#f0f4f9] hover:bg-[#ed1d43] hover:text-white px-2 py-0.5 rounded-md transition"
                      >
                        {handle}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#f0f4f9]">
                <button
                  type="button"
                  onClick={() => setShowAddMethodModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#5f6e8f] hover:bg-[#f0f4f9] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#ed1d43] hover:bg-[#d4153a] text-white text-xs font-black transition shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  <Check size={15} />
                  <span>Save Method</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================
          MODAL 2: KYC REQUIRED POPUP
          (Triggered ONLY when user confirms withdrawal without KYC)
      ================================================== */}
      {showKycRequiredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative bg-white rounded-[26px] max-w-sm w-full p-6 text-center shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setShowKycRequiredModal(false);
                dispatch(clearWithdrawalErrors());
              }}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-[#f0f4f9] text-[#5a6788] hover:bg-[#e2e8f0] flex items-center justify-center transition"
            >
              <X size={16} />
            </button>

            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <ShieldAlert size={32} />
            </div>

            <h3 className="text-xl font-black text-[#131E3D] tracking-tight">
              KYC Verification Required
            </h3>

            <p className="text-xs text-[#5f6e8f] mt-2 leading-relaxed">
              As per financial safety regulations, you must verify your identity
              (KYC) before any withdrawal request can be processed.
            </p>

            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowKycRequiredModal(false);
                  navigate("/kyc");
                }}
                className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition shadow-md flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Complete KYC Verification</span>
                <ExternalLink size={14} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowKycRequiredModal(false);
                  dispatch(clearWithdrawalErrors());
                }}
                className="w-full py-2.5 rounded-xl border border-[#d6dfec] text-xs font-bold text-[#5f6e8f] hover:bg-[#f0f4f9] transition"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          MODAL 3: DELETE PAYMENT METHOD CONFIRMATION
      ================================================== */}
      {methodToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] max-w-sm w-full p-6 shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={24} />
            </div>

            <h3 className="text-lg font-black text-center text-[#131E3D]">
              Remove Payment Method?
            </h3>
            <p className="text-xs text-center text-[#5f6e8f] mt-1.5 leading-relaxed">
              Are you sure you want to remove{" "}
              <strong className="text-[#131E3D]">
                {methodToDelete.type === "bank"
                  ? `${methodToDelete.bankName} (•••• ${methodToDelete.accountNumber?.slice(-4)})`
                  : methodToDelete.upiId}
              </strong>
              ? You can add it back later at any time.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setMethodToDelete(null)}
                className="py-2.5 rounded-xl border border-[#d6dfec] text-xs font-bold text-[#5f6e8f] hover:bg-[#f8fafc] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteMethod(methodToDelete.id)}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition shadow-sm active:scale-95"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalRequest;