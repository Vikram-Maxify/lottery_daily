import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Wallet,
  Home,
  RefreshCw,
  HelpCircle,
  Ticket,
  Trophy,
} from "lucide-react";

import {
  fetchDepositStatus,
  clearCurrentDeposit,
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
      className:
        "border-green-500/30 bg-green-500/10 text-green-400",
      icon: <Trophy size={12} />,
    };
  }

  if (s === "lost") {
    return {
      label: "NOT WON",
      className: "border-red-500/30 bg-red-500/10 text-red-400",
      icon: <XCircle size={12} />,
    };
  }

  // default = pending
  return {
    label: "PENDING DRAW",
    className:
      "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
    icon: <Clock size={12} />,
  };
};

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
    !lotteryEntries.length &&
    Array.isArray(currentDeposit?.lotteryNumbers)
      ? currentDeposit.lotteryNumbers
      : [];

  const hasTickets =
    lotteryEntries.length > 0 || lotteryNumbersFallback.length > 0;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#050606] px-4 py-8 text-white">
      <div className="w-full max-w-md rounded-[20px] border border-[#292929] bg-[#0b0d0d] p-6 text-center shadow-[0_0_30px_rgba(245,206,84,0.05)]">
        {localStatus === "loading" && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f5ce54]/10">
              <Loader2 size={52} className="animate-spin text-[#f5ce54]" />
            </div>
            <h1 className="mt-5 text-xl font-bold">Checking Payment...</h1>
            <p className="mt-2 text-sm text-white/50">कृपया प्रतीक्षा करें</p>
            {orderId && (
              <p className="mt-4 break-all text-[11px] text-white/30">
                Order ID: {orderId}
              </p>
            )}
          </>
        )}

        {localStatus === "success" && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 size={52} className="text-green-500" />
            </div>
            <h1 className="mt-5 text-2xl font-extrabold text-green-500">
              Recharge Successful
            </h1>
            {formattedAmount ? (
              <p className="mt-3 flex items-center justify-center gap-2 text-base text-white/70">
                <Wallet size={18} className="text-[#f5ce54]" />
                <span className="font-bold text-[#f5ce54]">
                  ₹{formattedAmount}
                </span>
                <span>added to wallet</span>
              </p>
            ) : (
              <p className="mt-3 text-sm text-white/60">
                आपका wallet balance update हो गया है
              </p>
            )}
            {orderId && (
              <p className="mt-3 break-all text-[11px] text-white/35">
                Order ID: {orderId}
              </p>
            )}
            <div className="mt-4 rounded-lg border border-green-500/10 bg-green-500/5 px-4 py-3">
              <p className="text-xs text-green-400">
                Payment successfully verified by server.
              </p>
            </div>

            {/* =====================================================
                YOUR LOTTERY TICKETS
            ===================================================== */}

            {hasTickets && (
              <div className="mt-5 rounded-xl border border-[#f5ce54]/20 bg-[#f5ce54]/5 p-4 text-left">
                <div className="mb-3 flex items-center gap-2">
                  <Ticket size={16} className="text-[#f5ce54]" />
                  <h2 className="text-sm font-bold text-[#f5ce54]">
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
                        className="flex items-center justify-between rounded-lg border border-[#2a2a2a] bg-[#0f1111] px-3 py-2.5"
                      >
                        <div className="flex flex-col">
                          <span className="font-mono text-base font-bold tracking-[0.2em] text-white">
                            {entry.number}
                          </span>
                          {entry.amount !== undefined &&
                            entry.amount !== null && (
                              <span className="mt-0.5 text-[10px] text-white/40">
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

                  {/* Case 2: fallback — only numbers (no per-ticket status) */}
                  {!lotteryEntries.length &&
                    lotteryNumbersFallback.map((num, idx) => (
                      <div
                        key={`${num}-${idx}`}
                        className="flex items-center justify-between rounded-lg border border-[#2a2a2a] bg-[#0f1111] px-3 py-2.5"
                      >
                        <span className="font-mono text-base font-bold tracking-[0.2em] text-white">
                          {String(num)}
                        </span>
                        <span className="flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-[10px] font-bold text-yellow-400">
                          <Clock size={12} />
                          PENDING DRAW
                        </span>
                      </div>
                    ))}
                </div>

                <p className="mt-3 text-[10px] leading-4 text-white/40">
                  अगर आपका number draw में आता है तो prize amount अपने आप
                  आपके wallet में add हो जाएगा।
                </p>
              </div>
            )}
          </>
        )}

        {localStatus === "pending" && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/10">
              <Clock size={48} className="text-yellow-400" />
            </div>
            <h1 className="mt-5 text-2xl font-extrabold text-yellow-400">
              Payment Processing
            </h1>
            <p className="mt-2 text-sm leading-6 text-white/60">
              आपका payment verify किया जा रहा है। Payment gateway से confirmation
              आने के बाद wallet में balance add होगा।
            </p>
            {formattedAmount && (
              <p className="mt-3 text-lg font-bold text-[#f5ce54]">
                ₹{formattedAmount}
              </p>
            )}
            {orderId && (
              <p className="mt-3 break-all text-[11px] text-white/35">
                Order ID: {orderId}
              </p>
            )}
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/50">
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
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-[12px] border border-[#353535] bg-[#121515] px-5 py-3 text-sm font-bold text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={statusLoading ? "animate-spin" : ""}
              />
              Check Payment Again
            </button>
          </>
        )}

        {localStatus === "unverifiable" && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/10">
              <HelpCircle size={52} className="text-blue-400" />
            </div>
            <h1 className="mt-5 text-2xl font-extrabold text-blue-400">
              Couldn't Auto-Verify
            </h1>
            <p className="mt-2 text-sm leading-6 text-white/60">
              हम इस payment को automatically identify नहीं कर पाए, लेकिन इसका
              मतलब payment fail नहीं हुआ। कृपया अपना wallet balance ya
              deposit history check करें।
            </p>
          </>
        )}

        {localStatus === "failed" && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
              <XCircle size={52} className="text-red-500" />
            </div>
            <h1 className="mt-5 text-2xl font-extrabold text-red-500">
              Payment Failed
            </h1>
            <p className="mt-2 text-sm leading-6 text-white/60">
              आपका payment पूरा नहीं हो सका। कृपया दोबारा प्रयास करें।
            </p>
            {formattedAmount && (
              <p className="mt-3 text-lg font-bold text-white/70">
                ₹{formattedAmount}
              </p>
            )}
            {orderId && (
              <p className="mt-3 break-all text-[11px] text-white/35">
                Order ID: {orderId}
              </p>
            )}
          </>
        )}

        {localStatus === "cancelled" && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/10">
              <XCircle size={52} className="text-yellow-400" />
            </div>
            <h1 className="mt-5 text-2xl font-extrabold text-yellow-400">
              Payment Cancelled
            </h1>
            <p className="mt-2 text-sm leading-6 text-white/60">
              आपने payment cancel कर दिया। कोई राशि wallet में add नहीं हुई।
            </p>
            {formattedAmount && (
              <p className="mt-3 text-lg font-bold text-white/70">
                ₹{formattedAmount}
              </p>
            )}
            {orderId && (
              <p className="mt-3 break-all text-[11px] text-white/35">
                Order ID: {orderId}
              </p>
            )}
          </>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {(localStatus === "failed" || localStatus === "cancelled") && (
            <button
              type="button"
              onClick={handleTryAgain}
              className="w-full rounded-[12px] bg-gradient-to-b from-[#fff59a] via-[#ffd84a] to-[#f4c21f] px-5 py-3 text-sm font-extrabold text-black transition active:scale-95"
            >
              Try Again
            </button>
          )}

          <button
            type="button"
            onClick={handleGoHome}
            className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-[#353535] bg-[#121515] px-5 py-3 text-sm font-bold text-white transition active:scale-95"
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