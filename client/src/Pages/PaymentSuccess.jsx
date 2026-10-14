import {
  Clock,
  HelpCircle,
  Home,
  Loader2,
  PartyPopper,
  RefreshCw,
  Ticket,
  Trophy,
  Wallet,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  clearCurrentDeposit,
  fetchDepositStatus,
} from "../reducer/slice/depositSlice";

const STATUS = {
  PENDING: 0,
  SUCCESS: 1,
  FAILED: 2,
  CANCELLED: 3,
};

const POLL_INTERVAL_FAST = 3000;
const POLL_INTERVAL_SLOW = 8000;
const FAST_POLL_ATTEMPTS = 10;
const SLOW_POLL_ATTEMPTS = 20;

const CONFETTI_DURATION_MS = 7000;
const CONFETTI_COLORS = [
  "#ed1d43",
  "#ffd34e",
  "#14a06a",
  "#173e70",
  "#d7198c",
  "#f08a25",
  "#ff7aa2",
];

const getOrderIdFromSources = (searchParams) => {
  const urlOrderId =
    searchParams.get("order_id") ||
    searchParams.get("merchant_order_id") ||
    searchParams.get("merchantOrderId") ||
    searchParams.get("orderId");

  if (urlOrderId) return String(urlOrderId).trim();

  try {
    const storedOrderId =
      localStorage.getItem("qwackpay_order_id") ||
      sessionStorage.getItem("deposit_pending_id");

    return storedOrderId ? String(storedOrderId).trim() : "";
  } catch {
    return "";
  }
};

// =====================================================
// TICKET STATUS BADGE
// =====================================================

const getTicketBadge = (ticketStatus) => {
  const s = String(ticketStatus || "").toLowerCase();

  if (s === "win") {
    return {
      label: "WINNER",
      className: "border-emerald-300 bg-emerald-50 text-emerald-700",
      icon: <Trophy size={12} />,
    };
  }

  if (s === "lost") {
    return {
      label: "NOT WON",
      className: "border-red-300 bg-red-50 text-red-600",
      icon: <XCircle size={12} />,
    };
  }

  // default = pending
  return {
    label: "PENDING DRAW",
    className: "border-amber-300 bg-amber-50 text-amber-700",
    icon: <Clock size={12} />,
  };
};

// =====================================================
// ANIMATION STYLES (pure CSS, no extra library)
// =====================================================

const ANIMATION_CSS = `
@keyframes ds-fall {
  0%   { transform: translate3d(0, -10vh, 0) rotate(0deg); opacity: 1; }
  100% { transform: translate3d(var(--drift), 110vh, 0) rotate(720deg); opacity: 0.9; }
}
@keyframes ds-burst {
  0%   { transform: translate3d(0, 0, 0) scale(0.3) rotate(0deg); opacity: 1; }
  55%  { transform: translate3d(var(--tx), var(--ty), 0) scale(1) rotate(260deg); opacity: 1; }
  100% { transform: translate3d(var(--tx), calc(var(--ty) + 320px), 0) scale(1) rotate(560deg); opacity: 0; }
}
@keyframes ds-draw-circle {
  to { stroke-dashoffset: 0; }
}
@keyframes ds-draw-check {
  to { stroke-dashoffset: 0; }
}
@keyframes ds-pop {
  0%   { transform: scale(0); opacity: 0; }
  60%  { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes ds-ring {
  0%   { transform: scale(0.8); opacity: 0.55; }
  100% { transform: scale(2.1); opacity: 0; }
}
@keyframes ds-fade-up {
  0%   { transform: translateY(14px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
@keyframes ds-shine {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes ds-float {
  0%, 100% { transform: translateY(0) rotate(-8deg); }
  50%      { transform: translateY(-6px) rotate(8deg); }
}

.ds-confetti-fall {
  position: absolute;
  top: 0;
  animation-name: ds-fall;
  animation-timing-function: linear;
  animation-fill-mode: both;
}
.ds-confetti-burst {
  position: absolute;
  bottom: 0;
  animation-name: ds-burst;
  animation-timing-function: cubic-bezier(0.15, 0.7, 0.3, 1);
  animation-fill-mode: both;
}
.ds-circle {
  stroke-dasharray: 277;
  stroke-dashoffset: 277;
  animation: ds-draw-circle 0.7s ease-out 0.15s forwards;
}
.ds-check {
  stroke-dasharray: 80;
  stroke-dashoffset: 80;
  animation: ds-draw-check 0.45s ease-out 0.75s forwards;
}
.ds-pop {
  animation: ds-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.ds-ring {
  animation: ds-ring 1.8s ease-out infinite;
}
.ds-ring-2 {
  animation: ds-ring 1.8s ease-out 0.6s infinite;
}
.ds-fade-up {
  animation: ds-fade-up 0.6s ease-out both;
}
.ds-shine-text {
  background-image: linear-gradient(
    100deg,
    #ffd34e 20%,
    #ffffff 40%,
    #ffd34e 60%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  animation: ds-shine 2.6s linear infinite;
}
.ds-float {
  animation: ds-float 2.2s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .ds-confetti-fall,
  .ds-confetti-burst,
  .ds-ring,
  .ds-ring-2,
  .ds-shine-text,
  .ds-float {
    animation: none !important;
  }
  .ds-confetti-layer {
    display: none !important;
  }
}
`;

// =====================================================
// CONFETTI (party popper blast + falling confetti)
// =====================================================

const Confetti = () => {
  const falling = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        id: `f-${i}`,
        left: Math.random() * 100,
        delay: Math.random() * 1.4,
        duration: 3 + Math.random() * 2.4,
        size: 6 + Math.random() * 8,
        drift: (Math.random() - 0.5) * 180,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        round: Math.random() > 0.65,
        tall: Math.random() > 0.5,
      })),
    [],
  );

  const bursts = useMemo(() => {
    const make = (side) =>
      Array.from({ length: 26 }, (_, i) => {
        const angle = ((18 + Math.random() * 62) * Math.PI) / 180;
        const dist = 220 + Math.random() * 280;
        const dir = side === "left" ? 1 : -1;
        return {
          id: `${side}-${i}`,
          side,
          tx: Math.cos(angle) * dist * dir,
          ty: -Math.sin(angle) * dist * 1.25,
          delay: Math.random() * 0.25,
          duration: 1.8 + Math.random() * 1.2,
          size: 6 + Math.random() * 7,
          color:
            CONFETTI_COLORS[
              (i + (side === "left" ? 0 : 3)) % CONFETTI_COLORS.length
            ],
          round: Math.random() > 0.6,
        };
      });
    return [...make("left"), ...make("right")];
  }, []);

  return (
    <div
      className="ds-confetti-layer pointer-events-none fixed inset-0 z-[100] overflow-hidden"
      aria-hidden="true"
    >
      {bursts.map((b) => (
        <span
          key={b.id}
          className="ds-confetti-burst"
          style={{
            [b.side]: "4%",
            width: b.size,
            height: b.round ? b.size : b.size * 0.5,
            background: b.color,
            borderRadius: b.round ? "9999px" : "2px",
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
            "--tx": `${b.tx}px`,
            "--ty": `${b.ty}px`,
          }}
        />
      ))}

      {falling.map((p) => (
        <span
          key={p.id}
          className="ds-confetti-fall"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.tall ? p.size * 1.8 : p.size * 0.6,
            background: p.color,
            borderRadius: p.round ? "9999px" : "2px",
            animationDelay: `${0.5 + p.delay}s`,
            animationDuration: `${p.duration}s`,
            "--drift": `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
};

// =====================================================
// ANIMATED SUCCESS CHECK
// =====================================================

const AnimatedCheck = () => (
  <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
    <span className="ds-ring absolute inset-3 rounded-full bg-[#14a06a]/40" />
    <span className="ds-ring-2 absolute inset-3 rounded-full bg-[#14a06a]/30" />

    <div className="ds-pop relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-b from-[#1fc283] to-[#0e8a5a] shadow-[0_8px_24px_rgba(20,160,106,0.55)]">
      <svg viewBox="0 0 100 100" className="h-20 w-20" fill="none">
        <circle
          className="ds-circle"
          cx="50"
          cy="50"
          r="44"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="4"
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
        <path
          className="ds-check"
          d="M30 52 L44 66 L71 36"
          stroke="#ffffff"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  </div>
);

// =====================================================
// MAIN COMPONENT
// =====================================================

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    currentDeposit = null,
    statusLoading = false,
    error = null,
  } = useSelector((state) => state.deposit || {});

  const [localStatus, setLocalStatus] = useState("loading");
  const [amount, setAmount] = useState(null);
  const [orderId, setOrderId] = useState("");
  const [pollingFinished, setPollingFinished] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const pollTimerRef = useRef(null);
  const pollCountRef = useRef(0);
  const mountedRef = useRef(false);
  const startedRef = useRef(false);

  const clearPollTimer = () => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      clearPollTimer();
    };
  }, []);

  useEffect(() => {
    const id = getOrderIdFromSources(searchParams);

    if (!id) {
      setOrderId("");
      setLocalStatus("unverifiable");
      setPollingFinished(true);
      return;
    }

    setOrderId(id);
    setLocalStatus("loading");
    setPollingFinished(false);
    pollCountRef.current = 0;
    startedRef.current = false;

    try {
      sessionStorage.removeItem("deposit_pending_id");
      sessionStorage.removeItem("deposit_pending_amount");
    } catch {}

    if (!startedRef.current) {
      startedRef.current = true;
      dispatch(fetchDepositStatus(id));
    }

    return () => clearPollTimer();
  }, [searchParams, dispatch]);

  useEffect(() => {
    if (!currentDeposit) return;

    const backendStatus = Number(currentDeposit.status);

    if (currentDeposit.amount !== undefined && currentDeposit.amount !== null) {
      setAmount(currentDeposit.amount);
    }

    const backendOrderId =
      currentDeposit.orderId ||
      currentDeposit.merchantOrderId ||
      currentDeposit.merchant_order_id ||
      currentDeposit.identifier;

    if (backendOrderId) {
      setOrderId(String(backendOrderId));
    }

    if (backendStatus === STATUS.SUCCESS) {
      clearPollTimer();
      setPollingFinished(true);
      setLocalStatus("success");

      try {
        localStorage.removeItem("qwackpay_order_id");
      } catch {}
      return;
    }

    if (backendStatus === STATUS.FAILED) {
      clearPollTimer();
      setPollingFinished(true);
      setLocalStatus("failed");
      return;
    }

    if (backendStatus === STATUS.CANCELLED) {
      clearPollTimer();
      setPollingFinished(true);
      setLocalStatus("cancelled");
      return;
    }

    setLocalStatus("pending");
  }, [currentDeposit]);

  useEffect(() => {
    if (!orderId || pollingFinished) return;

    if (currentDeposit) {
      const currentStatus = Number(currentDeposit.status);
      if (
        currentStatus === STATUS.SUCCESS ||
        currentStatus === STATUS.FAILED ||
        currentStatus === STATUS.CANCELLED
      ) {
        return;
      }
    }

    clearPollTimer();

    const attemptNumber = pollCountRef.current;
    const isFastPhase = attemptNumber < FAST_POLL_ATTEMPTS;
    const nextInterval = isFastPhase ? POLL_INTERVAL_FAST : POLL_INTERVAL_SLOW;
    const totalAttemptsAllowed = FAST_POLL_ATTEMPTS + SLOW_POLL_ATTEMPTS;

    pollTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;

      if (pollCountRef.current >= totalAttemptsAllowed) {
        clearPollTimer();
        setPollingFinished(true);
        setLocalStatus("pending");
        return;
      }

      pollCountRef.current += 1;
      dispatch(fetchDepositStatus(orderId));
    }, nextInterval);

    return () => clearPollTimer();
  }, [orderId, currentDeposit, pollingFinished, dispatch]);

  useEffect(() => {
    if (error && !currentDeposit) {
      setLocalStatus("pending");
    }
  }, [error, currentDeposit]);

  // Party popper: success aate hi confetti chalao, kuch sec baad band
  useEffect(() => {
    if (localStatus !== "success") {
      setShowConfetti(false);
      return;
    }

    setShowConfetti(true);
    const t = setTimeout(() => setShowConfetti(false), CONFETTI_DURATION_MS);
    return () => clearTimeout(t);
  }, [localStatus]);

  const handleRetryStatus = () => {
    if (!orderId) return;

    clearPollTimer();
    pollCountRef.current = 0;
    setPollingFinished(false);
    setLocalStatus("loading");
    dispatch(fetchDepositStatus(orderId));
  };

  const handleGoHome = () => {
    clearPollTimer();
    dispatch(clearCurrentDeposit());
    navigate("/");
  };

  const handleTryAgain = () => {
    clearPollTimer();
    dispatch(clearCurrentDeposit());

    try {
      localStorage.removeItem("qwackpay_order_id");
      sessionStorage.removeItem("deposit_pending_id");
      sessionStorage.removeItem("deposit_pending_amount");
    } catch {}

    navigate("/recharge");
  };

  const formattedAmount =
    amount !== null &&
    amount !== undefined &&
    amount !== "" &&
    !Number.isNaN(Number(amount))
      ? Number(amount).toFixed(2)
      : null;

  // =====================================================
  // TICKET DATA
  // =====================================================

  const lotteryEntries = Array.isArray(currentDeposit?.lotteryEntries)
    ? currentDeposit.lotteryEntries
    : [];

  const lotteryNumbersFallback =
    !lotteryEntries.length && Array.isArray(currentDeposit?.lotteryNumbers)
      ? currentDeposit.lotteryNumbers
      : [];

  const hasTickets =
    lotteryEntries.length > 0 || lotteryNumbersFallback.length > 0;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#eef3fa] px-4 py-8 text-[#173e70]">
      <style>{ANIMATION_CSS}</style>

      {showConfetti && localStatus === "success" && <Confetti />}

      <div className="w-full max-w-md overflow-hidden rounded-[22px] border border-[#dfe5f0] bg-white text-center shadow-[0_10px_40px_rgba(23,62,112,0.15)]">
        {/* ================= LOADING ================= */}
        {localStatus === "loading" && (
          <div className="p-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#eef3fa]">
              <Loader2 size={48} className="animate-spin text-[#ed1d43]" />
            </div>
            <h1 className="mt-5 text-xl font-extrabold text-[#173e70]">
              Checking Payment...
            </h1>
            <p className="mt-2 text-sm text-[#6b7280]">Please wait a moment</p>
            {orderId && (
              <p className="mt-4 break-all text-[11px] text-[#9aa5b8]">
                Order ID: {orderId}
              </p>
            )}
          </div>
        )}

        {/* ================= SUCCESS ================= */}
        {localStatus === "success" && (
          <>
            {/* Celebration header */}
            <div className="relative overflow-hidden bg-gradient-to-b from-[#3a0b17] via-[#2b0a16] to-[#1a0710] px-6 pb-7 pt-8">
              <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[#ed1d43]/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-[#ffd34e]/20 blur-3xl" />

              <div className="relative">
                <AnimatedCheck />

                <div
                  className="ds-fade-up mt-4 flex items-center justify-center gap-2"
                  style={{ animationDelay: "0.9s" }}
                >
                  <PartyPopper size={22} className="ds-float text-[#ffd34e]" />
                  <h1 className="ds-shine-text text-[26px] font-black leading-tight">
                    {hasTickets ? "Payment Successful" : "Recharge Successful"}
                  </h1>
                  <PartyPopper
                    size={22}
                    className="ds-float -scale-x-100 text-[#ffd34e]"
                    style={{ animationDelay: "0.3s" }}
                  />
                </div>

                <p
                  className="ds-fade-up mt-1.5 text-[13px] font-medium text-white/80"
                  style={{ animationDelay: "1.05s" }}
                >
                  {hasTickets
                    ? "Congratulations! Your tickets are confirmed."
                    : "Congratulations! Your payment went through."}
                </p>

                {formattedAmount ? (
                  <div
                    className="ds-fade-up mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-[#ffd34e]/40 bg-white/10 px-4 py-2"
                    style={{ animationDelay: "1.2s" }}
                  >
                    <Wallet size={18} className="text-[#ffd34e]" />
                    <span className="text-lg font-black text-[#ffd34e]">
                      ₹{formattedAmount}
                    </span>
                    <span className="text-sm text-white/80">
                      {hasTickets ? "paid" : "added to wallet"}
                    </span>
                  </div>
                ) : (
                  <p
                    className="ds-fade-up mt-4 text-sm text-white/75"
                    style={{ animationDelay: "1.2s" }}
                  >
                    Your wallet balance has been updated
                  </p>
                )}
              </div>
            </div>

            <div className="p-5">
              {orderId && (
                <p
                  className="ds-fade-up break-all text-[11px] text-[#9aa5b8]"
                  style={{ animationDelay: "1.3s" }}
                >
                  Order ID: {orderId}
                </p>
              )}

              <div
                className="ds-fade-up mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5"
                style={{ animationDelay: "1.4s" }}
              >
                <p className="text-xs font-semibold text-emerald-700">
                  Payment successfully verified by server.
                </p>
              </div>

              {/* =====================================================
                  YOUR LOTTERY TICKETS
              ===================================================== */}
              {hasTickets && (
                <div
                  className="ds-fade-up mt-5 rounded-xl border border-[#f1d9a0] bg-gradient-to-r from-[#fff0c9] via-[#fff8e8] to-[#ffe7b8] p-4 text-left"
                  style={{ animationDelay: "1.5s" }}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <Ticket
                      size={18}
                      className="-rotate-[30deg] text-[#173e70]"
                    />
                    <h2 className="text-sm font-extrabold text-[#173e70]">
                      Your Lottery Tickets
                    </h2>
                  </div>

                  <div className="space-y-2">
                    {/* Case 1: full entries with status */}
                    {lotteryEntries.map((entry, idx) => {
                      const badge = getTicketBadge(entry.status);

                      return (
                        <div
                          key={entry._id || `${entry.number}-${idx}`}
                          className="flex items-center justify-between rounded-lg border border-[#e3d3ae] bg-white px-3 py-2.5 shadow-sm"
                        >
                          <div className="flex flex-col">
                            <span className="font-mono text-base font-black tracking-[0.2em] text-[#173e70]">
                              {entry.number}
                            </span>
                            {entry.amount !== undefined &&
                              entry.amount !== null && (
                                <span className="mt-0.5 text-[10px] text-[#6b7280]">
                                  ₹{Number(entry.amount).toFixed(2)}
                                </span>
                              )}
                          </div>

                          <span
                            className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${badge.className}`}
                          >
                            {badge.icon}
                            {badge.label}
                          </span>
                        </div>
                      );
                    })}

                    {/* Case 2: fallback - only numbers (no per-ticket status) */}
                    {!lotteryEntries.length &&
                      lotteryNumbersFallback.map((num, idx) => (
                        <div
                          key={`${num}-${idx}`}
                          className="flex items-center justify-between rounded-lg border border-[#e3d3ae] bg-white px-3 py-2.5 shadow-sm"
                        >
                          <span className="font-mono text-base font-black tracking-[0.2em] text-[#173e70]">
                            {String(num)}
                          </span>
                          <span className="flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                            <Clock size={12} />
                            PENDING DRAW
                          </span>
                        </div>
                      ))}
                  </div>

                  <p className="mt-3 text-[11px] leading-4 text-[#4b5563]">
                    If your number is drawn, the prize amount will be added to
                    your wallet automatically.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ================= PENDING ================= */}
        {localStatus === "pending" && (
          <div className="p-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
              <Clock size={48} className="text-amber-500" />
            </div>
            <h1 className="mt-5 text-2xl font-extrabold text-amber-600">
              Payment Processing
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#4b5563]">
              Your payment is being verified. Once the payment gateway confirms
              it, the balance will be added to your wallet.
            </p>
            {formattedAmount && (
              <p className="mt-3 text-lg font-black text-[#173e70]">
                ₹{formattedAmount}
              </p>
            )}
            {orderId && (
              <p className="mt-3 break-all text-[11px] text-[#9aa5b8]">
                Order ID: {orderId}
              </p>
            )}
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#6b7280]">
              {statusLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Auto-checking status...
                </>
              ) : (
                <>
                  <Clock size={14} />
                  Waiting for payment confirmation...
                </>
              )}
            </div>
            <button
              type="button"
              onClick={handleRetryStatus}
              disabled={statusLoading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-[12px] border border-[#c9d3e3] bg-white px-5 py-3 text-sm font-bold text-[#173e70] transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={statusLoading ? "animate-spin" : ""}
              />
              Check Payment Again
            </button>
          </div>
        )}

        {/* ================= UNVERIFIABLE ================= */}
        {localStatus === "unverifiable" && (
          <div className="p-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
              <HelpCircle size={52} className="text-blue-500" />
            </div>
            <h1 className="mt-5 text-2xl font-extrabold text-blue-600">
              Couldn't Auto-Verify
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#4b5563]">
              We couldn't identify this payment automatically, but that doesn't
              mean the payment failed. Please check your wallet balance or
              deposit history.
            </p>
          </div>
        )}

        {/* ================= FAILED ================= */}
        {localStatus === "failed" && (
          <div className="p-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
              <XCircle size={52} className="text-[#ed1d43]" />
            </div>
            <h1 className="mt-5 text-2xl font-extrabold text-[#ed1d43]">
              Payment Failed
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#4b5563]">
              Your payment could not be completed. Please try again.
            </p>
            {formattedAmount && (
              <p className="mt-3 text-lg font-black text-[#173e70]">
                ₹{formattedAmount}
              </p>
            )}
            {orderId && (
              <p className="mt-3 break-all text-[11px] text-[#9aa5b8]">
                Order ID: {orderId}
              </p>
            )}
          </div>
        )}

        {/* ================= CANCELLED ================= */}
        {localStatus === "cancelled" && (
          <div className="p-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
              <XCircle size={52} className="text-amber-500" />
            </div>
            <h1 className="mt-5 text-2xl font-extrabold text-amber-600">
              Payment Cancelled
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#4b5563]">
              You cancelled the payment. No amount was added to your wallet.
            </p>
            {formattedAmount && (
              <p className="mt-3 text-lg font-black text-[#173e70]">
                ₹{formattedAmount}
              </p>
            )}
            {orderId && (
              <p className="mt-3 break-all text-[11px] text-[#9aa5b8]">
                Order ID: {orderId}
              </p>
            )}
          </div>
        )}

        {/* ================= ACTION BUTTONS ================= */}
        <div className="flex flex-col gap-3 px-5 pb-6 pt-1">
          {(localStatus === "failed" || localStatus === "cancelled") && (
            <button
              type="button"
              onClick={handleTryAgain}
              className="w-full rounded-[12px] bg-gradient-to-r from-[#ff1744] to-[#e0102f] px-5 py-3 text-sm font-extrabold text-white shadow-[0_8px_25px_rgba(255,20,67,0.35)] transition active:scale-95"
            >
              Try Again
            </button>
          )}

          <button
            type="button"
            onClick={handleGoHome}
            className={`flex w-full items-center justify-center gap-2 rounded-[12px] px-5 py-3 text-sm font-extrabold transition active:scale-95 ${
              localStatus === "success"
                ? "bg-gradient-to-r from-[#ff1744] to-[#e0102f] text-white shadow-[0_8px_25px_rgba(255,20,67,0.35)]"
                : "border border-[#c9d3e3] bg-white text-[#173e70]"
            }`}
          >
            <Home size={16} />
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
