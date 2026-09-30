import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Info,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";

import {
  createDeposit,
  selectDepositError,
  selectDepositLoading,
  selectDepositOrderId,
  selectDepositPaymentUrl,
} from "../reducer/slice/depositSlice";

// =====================================================
// CONSTANTS
// =====================================================

// ⚠️ Apne bottom navbar ki height (px) yahan daalo.
const BOTTOM_NAV_HEIGHT = 64;

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1605196560547-b2f7281b7355?auto=format&fit=crop&w=1400&q=80";

const MIN_AMOUNT = 200;
const MAX_AMOUNT = 30000;

const QUICK_AMOUNTS = [200, 500, 1000, 5000];

// =====================================================
// AUTO GENERATE TEST UTR
// =====================================================
const generateUTR = () => {
  const timestamp = Date.now().toString().slice(-10);
  const random = Math.floor(100000 + Math.random() * 900000);
  return `QWP${timestamp}${random}`;
};

export default function QwackPayDeposit() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const loading = useSelector(selectDepositLoading);
  const error = useSelector(selectDepositError);
  const paymentUrl = useSelector(selectDepositPaymentUrl);
  const orderId = useSelector(selectDepositOrderId);

  const [amount, setAmount] = useState("");
  const [utr, setUtr] = useState("");
  const [localError, setLocalError] = useState("");

  // =====================================================
  // CREATE DEPOSIT
  // =====================================================
  const handleSubmit = async (event) => {
    event.preventDefault();

    setLocalError("");

    const numericAmount = Number(amount);

    // QwackPay minimum amount
    if (!Number.isFinite(numericAmount) || numericAmount < MIN_AMOUNT) {
      setLocalError("Minimum QwackPay deposit amount is ₹200.");
      return;
    }

    // QwackPay maximum amount
    if (numericAmount > MAX_AMOUNT) {
      setLocalError("Maximum QwackPay deposit amount is ₹30,000.");
      return;
    }

    // AUTO UTR
    const generatedUtr = generateUTR();
    setUtr(generatedUtr);

    try {
      const result = await dispatch(
        createDeposit({
          amount: numericAmount,
          paymentMethod: "INR",
          channel: "qwackpay",

          // UTR sent with create request
          utr: generatedUtr,
        })
      ).unwrap();

      const createdOrderId = String(
        result?.orderId || result?.deposit?.orderId || ""
      ).trim();

      const url = String(
        result?.paymentUrl ||
          result?.payment_url ||
          result?.data?.paymentUrl ||
          result?.data?.payment_url ||
          ""
      ).trim();

      // SAVE ORDER ID
      if (createdOrderId) {
        try {
          localStorage.setItem("qwackpay_order_id", createdOrderId);
        } catch {}
      }

      // SAVE GENERATED UTR
      if (generatedUtr) {
        try {
          localStorage.setItem("qwackpay_test_utr", generatedUtr);
        } catch {}
      }

      if (!url) {
        setLocalError("Payment URL was not returned by the gateway.");
        return;
      }

      // OPEN QWACKPAY
      window.location.assign(url);
    } catch (err) {
      setLocalError(String(err || "Payment order creation failed."));
    }
  };

  // =====================================================
  // CHECK STATUS
  // =====================================================
  const handleStatus = () => {
    const id = String(orderId || "").trim();

    if (!id) {
      setLocalError("Payment order ID is not available.");
      return;
    }

    navigate(`/payment-success?order_id=${encodeURIComponent(id)}`);
  };

  // =====================================================
  // REGENERATE UTR
  // =====================================================
  const handleGenerateUtr = () => {
    const newUtr = generateUTR();
    setUtr(newUtr);

    try {
      localStorage.setItem("qwackpay_test_utr", newUtr);
    } catch {}
  };

  const displayError = localError || error;

  // =====================================================
  // UI
  // =====================================================
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#eef3fa] text-[#173e70]">
      <div
        className="relative mx-auto w-full max-w-[500px] overflow-x-hidden"
        style={{ paddingBottom: BOTTOM_NAV_HEIGHT + 24 }}
      >
        {/* ================= HERO ================= */}
        <section
          className="relative overflow-hidden bg-[#3b0a14] bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#2a0610]/95 via-[#4a0b18]/75 to-[#2a0610]/55" />
          <div className="pointer-events-none absolute -right-10 top-0 h-52 w-52 rounded-full bg-[#ff8a00]/25 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-[#ff1744]/20 blur-3xl" />

          <Sparkles
            size={16}
            className="pointer-events-none absolute left-[46%] top-4 text-[#ffcf4a]/80"
          />
          <Sparkles
            size={12}
            className="pointer-events-none absolute bottom-[30%] left-[4%] text-[#ffb82e]/70"
          />

          <div className="relative flex items-center gap-3 px-3 pb-16 pt-6">
            <div className="flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-[18px] border-2 border-[#ffd34e] bg-white/10 shadow-[0_0_25px_rgba(255,209,90,0.25)]">
              <Wallet className="h-[32px] w-[32px] text-[#ffd34e]" strokeWidth={1.7} />
            </div>

            <div className="min-w-0">
              <p className="text-[12px] font-medium text-white/70">
                Secure payment through QwackPay
              </p>
              <h1 className="mt-0.5 bg-gradient-to-b from-[#fff1a8] to-[#e0a11b] bg-clip-text font-serif text-[34px] font-black leading-none text-transparent">
                Add Money
              </h1>
              <p className="mt-1.5 text-[12px] leading-tight text-white/85">
                Add balance to your wallet instantly
              </p>
            </div>
          </div>
        </section>

        <main className="relative z-10 -mt-10 space-y-3 px-2">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* ================= AMOUNT ================= */}
            <section className="rounded-[16px] bg-white p-3 shadow-md">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#ff1744] to-[#c9102f] text-[16px] font-black text-white">
                  ₹
                </span>
                <h2 className="text-[16px] font-extrabold text-[#173e70]">
                  Amount (INR)
                </h2>
              </div>

              <input
                type="number"
                inputMode="numeric"
                min={MIN_AMOUNT}
                max={MAX_AMOUNT}
                step="1"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setLocalError("");
                }}
                placeholder="Minimum ₹200"
                disabled={loading}
                className="mt-3 h-[50px] w-full min-w-0 rounded-xl border border-[#dfe5f0] bg-[#f6f9fe] px-3 text-[18px] font-black text-[#173e70] outline-none placeholder:text-[14px] placeholder:font-normal placeholder:text-[#8a97ab] focus:border-[#ed1d43] focus:bg-white focus:shadow-[0_0_0_3px_rgba(237,29,67,0.12)] disabled:opacity-60"
              />

              <p className="mt-1.5 text-[12px] text-[#4b5563]">
                Minimum ₹200 • Maximum ₹30,000
              </p>

              {/* quick amounts */}
              <div className="mt-3 grid grid-cols-4 gap-1.5">
                {QUICK_AMOUNTS.map((v) => {
                  const active = Number(amount) === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setAmount(String(v));
                        setLocalError("");
                      }}
                      className={`min-w-0 rounded-lg border py-2 text-center text-[13px] font-extrabold transition active:scale-95 disabled:opacity-60 ${
                        active
                          ? "border-2 border-[#ed1d43] bg-[#fff0f2] text-[#ed1d43]"
                          : "border-[#dfe5f0] bg-white text-[#173e70]"
                      }`}
                    >
                      ₹{v.toLocaleString("en-IN")}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ================= UTR ================= */}
            <section className="rounded-[16px] bg-white p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#173e70] text-white">
                  <ShieldCheck size={18} />
                </span>
                <h2 className="text-[16px] font-extrabold text-[#173e70]">UTR</h2>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={utr}
                  readOnly
                  placeholder="UTR will be generated automatically"
                  className="h-[46px] min-w-0 flex-1 rounded-xl border border-[#dfe5f0] bg-[#eef3fa] px-3 font-mono text-[13px] font-bold text-[#173e70] outline-none placeholder:font-sans placeholder:text-[12px] placeholder:font-normal placeholder:text-[#8a97ab]"
                />

                <button
                  type="button"
                  onClick={handleGenerateUtr}
                  disabled={loading}
                  className="flex h-[46px] shrink-0 items-center gap-1 rounded-xl border border-[#c9d3e3] bg-white px-3 text-[13px] font-bold text-[#173e70] transition active:scale-95 disabled:opacity-60"
                >
                  <RefreshCw size={14} />
                  Generate
                </button>
              </div>

              <p className="mt-1.5 text-[12px] text-[#4b5563]">
                Test UTR is generated automatically.
              </p>
            </section>

            {/* ================= ERROR ================= */}
            {displayError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] font-medium text-red-600">
                {typeof displayError === "string"
                  ? displayError
                  : displayError?.message || "Something went wrong"}
              </div>
            )}

            {/* ================= SUBMIT ================= */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff1744] to-[#e0102f] text-[15px] font-extrabold text-white shadow-[0_8px_25px_rgba(255,20,67,0.45)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating payment...
                </>
              ) : (
                <>
                  Pay with QwackPay
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* ================= CREATED ORDER ================= */}
          {paymentUrl && orderId && (
            <section className="rounded-[16px] border-2 border-[#20a66a]/40 bg-gradient-to-br from-[#e9f8f0] via-white to-[#f2fff7] p-3 shadow-sm">
              <p className="text-[12px] text-[#4b5563]">Order ID</p>
              <p className="mt-0.5 break-all font-mono text-[14px] font-bold text-[#173e70]">
                {orderId}
              </p>

              {utr && (
                <div className="mt-3">
                  <p className="text-[12px] text-[#4b5563]">Test UTR</p>
                  <p className="mt-0.5 break-all font-mono text-[14px] font-bold text-[#173e70]">
                    {utr}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => window.location.assign(paymentUrl)}
                className="mt-4 flex h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#173e70] text-[14px] font-extrabold text-white transition active:scale-[0.98]"
              >
                Open Payment Page
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={handleStatus}
                className="mt-2 h-[42px] w-full rounded-xl border border-[#c9d3e3] bg-white text-[13px] font-bold text-[#173e70] transition active:scale-[0.98]"
              >
                Check Payment Status
              </button>
            </section>
          )}

          {/* ================= INFO ================= */}
          <section className="flex items-start gap-2 rounded-[16px] border border-[#bfe8d3] bg-[#e7f8ef] px-3 py-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#14a06a] text-white">
              <Info size={13} />
            </span>
            <p className="min-w-0 text-[12px] leading-snug text-[#26354b]">
              Your payment is processed securely through QwackPay. Balance is
              added to your wallet after successful payment.
            </p>
          </section>

          {/* ================= FOOTER ================= */}
          <div className="flex flex-col items-center px-4 pt-2">
            <div className="flex w-full items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#173e70]/30" />
              <ShieldCheck size={22} className="text-[#173e70]" />
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#173e70]/30" />
            </div>
            <p className="mt-2 text-[14px] font-medium text-[#173e70]">
              Play with trust
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}