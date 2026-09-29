import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  ArrowLeft,
  Plus,
  Wallet,
  CreditCard,
  ShieldCheck,
  Loader2,
} from "lucide-react";

import { useDispatch, useSelector } from "react-redux";

import {
  createDeposit,
  cancelDeposit,
  clearDepositState,
} from "../reducer/slice/depositSlice";

// =====================================================
// CONSTANTS
// =====================================================

const MIN_RECHARGE_AMOUNT = 220;
const RECHARGE_AMOUNTS = [220, 500, 1000, 2000, 5000];

// =====================================================
// COMPONENT
// =====================================================

const Recharge = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const [selectedAmount, setSelectedAmount] = useState(null);
  const [localError, setLocalError] = useState("");
  const [showCancelledInfo, setShowCancelledInfo] = useState(false);

  // Track pending deposit for auto-cancel on return
  const pendingDepositRef = useRef(null);

  const {
    loading: depositLoading,
    cancelLoading,
    error: depositError,
    currentStatus,
  } = useSelector(
    (state) =>
      state.deposit || {
        loading: false,
        cancelLoading: false,
        error: null,
        currentStatus: null,
      }
  );

  // ===================================================
  // REQUIRED AMOUNT
  // ===================================================

  const requiredAmount = useMemo(() => {
    const amount = Number(searchParams.get("amount"));
    if (!Number.isFinite(amount) || amount <= 0) return MIN_RECHARGE_AMOUNT;
    return Math.max(amount, MIN_RECHARGE_AMOUNT);
  }, [searchParams]);

  // ===================================================
  // CLEAR ERRORS
  // ===================================================

  const clearErrors = () => {
    setLocalError("");
    dispatch(clearDepositState());
  };

  // ===================================================
  // AUTO CANCEL — user gateway se back aaya
  // ===================================================

  useEffect(() => {
    const handleReturn = async () => {
      if (document.visibilityState !== "visible") return;

      const pendingId = sessionStorage.getItem("deposit_pending_id");
      if (!pendingId) return;

      // Duplicate calls prevent
      if (pendingDepositRef.current === pendingId) return;
      pendingDepositRef.current = pendingId;

      try {
        await dispatch(
          cancelDeposit({
            depositId: pendingId,
            reason: "User returned from gateway without completing payment",
          })
        ).unwrap();

        sessionStorage.removeItem("deposit_pending_id");
        sessionStorage.removeItem("deposit_pending_amount");
        setSelectedAmount(null);
        setShowCancelledInfo(true);
      } catch (e) {
        console.warn("Auto cancel failed:", e);
      } finally {
        pendingDepositRef.current = null;
      }
    };

    document.addEventListener("visibilitychange", handleReturn);
    window.addEventListener("focus", handleReturn);

    return () => {
      document.removeEventListener("visibilitychange", handleReturn);
      window.removeEventListener("focus", handleReturn);
    };
  }, [dispatch]);

  // ===================================================
  // HANDLE RECHARGE
  // ===================================================

  const handleRecharge = async (amount) => {
    try {
      setLocalError("");
      setShowCancelledInfo(false);
      dispatch(clearDepositState());

      let rechargeAmount = Number(amount);

      if (!Number.isFinite(rechargeAmount) || rechargeAmount <= 0) {
        setLocalError("कृपया सही Recharge amount चुनें");
        return;
      }

      if (rechargeAmount < MIN_RECHARGE_AMOUNT) {
        rechargeAmount = MIN_RECHARGE_AMOUNT;
      }

      rechargeAmount = Number(rechargeAmount.toFixed(2));
      setSelectedAmount(rechargeAmount);

      const response = await dispatch(
        createDeposit({
          paymentMethod: "INR",
          channel: "qwackpay",
          amount: rechargeAmount,
          utr: "",
        })
      ).unwrap();

      const paymentUrl =
        response?.paymentUrl ||
        response?.payment_url ||
        response?.data?.paymentUrl ||
        response?.data?.payment_url;

      if (!paymentUrl) {
        setSelectedAmount(null);
        setLocalError(response?.message || "Payment URL प्राप्त नहीं हुई");
        return;
      }

      // Save deposit id for later cancel
      const dId =
        response?.depositId ||
        response?.deposit?._id ||
        response?.orderId ||
        "";

      if (dId) {
        sessionStorage.setItem("deposit_pending_id", String(dId));
        sessionStorage.setItem(
          "deposit_pending_amount",
          String(rechargeAmount)
        );
      }

      // Redirect to gateway
      window.location.href = paymentUrl;
    } catch (error) {
      console.error("RECHARGE PAYMENT ERROR:", error);
      setSelectedAmount(null);
      setLocalError(
        typeof error === "string"
          ? error
          : error?.message ||
              error?.payload?.message ||
              "Recharge शुरू नहीं हो सका"
      );
    }
  };

  const displayError = localError || depositError;

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="min-h-screen bg-[#050606] text-white pb-10">
      {/* HEADER */}
      <div className="sticky top-0 z-50 border-b border-[#292929] bg-[#070909]/95 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={depositLoading || cancelLoading}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#333] bg-[#111414] text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-[20px] font-extrabold">Recharge Wallet</h1>
            <p className="text-[11px] text-white/50">
              अपने वॉलेट में बैलेंस जोड़ें
            </p>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <main className="px-4 pt-5">
        {/* LOW BALANCE */}
        <div className="rounded-[16px] border border-[#d7b838]/40 bg-[#11100a] p-4 shadow-[0_0_20px_rgba(215,184,56,0.08)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f5ce54]/10 text-[#f5ce54]">
              <Wallet size={22} />
            </div>

            <div>
              <p className="text-[13px] text-white/60">
                Ticket खरीदने के लिए
              </p>
              <p className="mt-1 text-[22px] font-extrabold text-[#f5ce54]">
                ₹{requiredAmount.toFixed(2)}
              </p>
              <p className="mt-1 text-[11px] text-white/45">
                न्यूनतम Recharge ₹220 है
              </p>
            </div>
          </div>
        </div>

        {/* ERROR */}
        {displayError && (
          <div className="mt-4 rounded-[12px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-[12px] text-red-300">
            {typeof displayError === "string"
              ? displayError
              : displayError?.message || "Recharge में समस्या हुई"}
          </div>
        )}

        {/* CANCELLED INFO */}
        {(showCancelledInfo || currentStatus === 3) && (
          <div className="mt-4 rounded-[12px] border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-center text-[12px] text-yellow-300">
            Payment cancel हो गया। आप दोबारा Recharge कर सकते हैं।
          </div>
        )}

        {/* CANCEL LOADING */}
        {cancelLoading && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-[12px] border border-white/10 bg-white/5 px-4 py-3 text-center text-[12px] text-white/70">
            <Loader2 size={14} className="animate-spin" />
            Cancelling previous payment...
          </div>
        )}

        {/* WALLET CARD */}
        <section className="mt-4 rounded-[18px] border border-[#292929] bg-[#0b0d0d] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[13px] bg-[#f5ce54]/10 text-[#f5ce54]">
              <Wallet size={25} />
            </div>

            <div>
              <p className="text-[12px] text-white/50">Wallet Recharge</p>
              <p className="mt-1 text-[17px] font-bold">
                अपना बैलेंस बढ़ाएं
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {RECHARGE_AMOUNTS.map((amount) => {
              const isSelected =
                Number(selectedAmount) === Number(amount);

              return (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleRecharge(amount)}
                  disabled={depositLoading || cancelLoading}
                  className={`
                    flex h-[58px] items-center justify-center gap-2
                    rounded-[12px] border bg-[#121515] text-[17px] font-bold
                    transition active:scale-[0.97] disabled:cursor-not-allowed
                    disabled:opacity-60
                    ${
                      isSelected
                        ? "border-[#f5ce54] text-[#f5ce54] shadow-[0_0_15px_rgba(245,206,84,0.15)]"
                        : "border-[#353535] text-white hover:border-[#f5ce54] hover:text-[#f5ce54]"
                    }
                  `}
                >
                  {depositLoading && isSelected ? (
                    <Loader2 size={19} className="animate-spin" />
                  ) : (
                    <Plus size={18} />
                  )}
                  ₹{amount}
                </button>
              );
            })}
          </div>
        </section>

        {/* REQUIRED AMOUNT */}
        <section className="mt-4 rounded-[18px] border border-[#d7b838]/40 bg-[#0d0f0f] p-4">
          <p className="text-[12px] text-white/50">Suggested Recharge</p>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[13px] text-white/60">
                Minimum required
              </p>
              <p className="mt-1 text-[28px] font-extrabold text-[#f5ce54]">
                ₹{requiredAmount.toFixed(2)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleRecharge(requiredAmount)}
              disabled={depositLoading || cancelLoading}
              className="flex min-w-[110px] items-center justify-center gap-2 rounded-[12px] bg-gradient-to-b from-[#fff59a] via-[#ffd84a] to-[#f4c21f] px-5 py-3 text-[14px] font-extrabold text-black shadow-[0_0_20px_rgba(255,210,35,0.25)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {depositLoading &&
              Number(selectedAmount) === Number(requiredAmount) ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Opening...
                </>
              ) : (
                "Recharge"
              )}
            </button>
          </div>
        </section>

        {/* MIN INFO */}
        <div className="mt-3 flex items-center justify-center">
          <p className="text-center text-[11px] text-white/40">
            Minimum recharge amount: ₹220
          </p>
        </div>

        {/* SECURITY */}
        <section className="mt-4 rounded-[18px] border border-[#292929] bg-[#080a0a] p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck size={22} className="mt-0.5 shrink-0 text-[#f5ce54]" />
            <div>
              <p className="text-[13px] font-bold">सुरक्षित Recharge</p>
              <p className="mt-1 text-[11px] leading-5 text-white/45">
                Recharge के बाद आपका wallet balance update होगा। पर्याप्त
                balance होने पर आप lottery ticket खरीद सकते हैं।
              </p>
            </div>
          </div>

          <div className="mt-4 border-t border-[#292929] pt-4">
            <div className="flex items-center gap-2 text-white/60">
              <CreditCard size={17} />
              <span className="text-[11px]">
                सुरक्षित भुगतान | Instant Balance
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Recharge;