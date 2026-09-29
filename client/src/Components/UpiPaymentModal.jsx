// src/components/UpiPaymentModal.jsx
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createDeposit,
  clearDepositState,
  getSingleDeposit,
} from "../reducer/slice/depositSlice";

// =====================================================
// ALL UPI OPTIONS (static list — modify as per backend)
// =====================================================
const UPI_APPS = [
  {
    id: "phonepe",
    name: "PhonePe",
    color: "#5f259f",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg",
    scheme: "phonepe://pay",
  },
  {
    id: "gpay",
    name: "Google Pay",
    color: "#1a73e8",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg",
    scheme: "tez://upi/pay",
  },
  {
    id: "paytm",
    name: "Paytm",
    color: "#00baf2",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg",
    scheme: "paytmmp://pay",
  },
  {
    id: "bhim",
    name: "BHIM UPI",
    color: "#00529b",
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e1/BHIM_logo.svg",
    scheme: "upi://pay",
  },
  {
    id: "amazonpay",
    name: "Amazon Pay",
    color: "#ff9900",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/02/Amazon_Pay_logo.svg",
    scheme: "amazonpay://pay",
  },
  {
    id: "cred",
    name: "CRED",
    color: "#1a1a1a",
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/1e/CRED_logo.svg",
    scheme: "credpay://pay",
  },
];

const UpiPaymentModal = ({ open, onClose, onPaymentSuccess, amount }) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const { loading, success, error, message, paymentUrl, currentDeposit } =
    useSelector((state) => state.deposit);

  // =====================================================
  // STATE
  // =====================================================
  const [step, setStep] = useState("init"); // init | qr | verify | done
  const [utr, setUtr] = useState("");
  const [proof, setProof] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [localError, setLocalError] = useState("");
  const [depositId, setDepositId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 min timer
  const [pollCount, setPollCount] = useState(0);

  // =====================================================
  // RESET ON OPEN
  // =====================================================
  useEffect(() => {
    if (open) {
      dispatch(clearDepositState());
      setUtr("");
      setProof(null);
      setProofPreview(null);
      setStep("init");
      setLocalError("");
      setDepositId(null);
      setCopied(false);
      setSelectedApp(null);
      setTimeLeft(600);
      setPollCount(0);
    }
  }, [open, dispatch]);

  // =====================================================
  // AFTER CREATE SUCCESS
  // =====================================================
  useEffect(() => {
    if (success && currentDeposit) {
      setDepositId(currentDeposit._id);
      if (currentDeposit.paymentUrl || paymentUrl) {
        setStep("qr");
      } else {
        setStep("verify");
      }
    }
  }, [success, currentDeposit, paymentUrl]);

  // =====================================================
  // COUNTDOWN TIMER (QR step)
  // =====================================================
  useEffect(() => {
    if (step !== "qr" || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearInterval(t);
  }, [step, timeLeft]);

  // =====================================================
  // AUTO POLL FOR PAYMENT (QR step)
  // =====================================================
  useEffect(() => {
    if (step !== "qr" || !depositId) return;

    const interval = setInterval(async () => {
      try {
        const res = await dispatch(getSingleDeposit(depositId)).unwrap();
        const status = res?.deposit?.status;
        setPollCount((c) => c + 1);

        if (
          status === "success" ||
          status === "approved" ||
          status === "completed"
        ) {
          setStep("done");
          if (onPaymentSuccess) {
            onPaymentSuccess({
              depositId,
              utr: res?.deposit?.utr,
              autoConfirmed: true,
            });
          }
        }
      } catch (_) {
        /* silent */
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [step, depositId, dispatch, onPaymentSuccess]);

  // =====================================================
  // STEP 1 : CREATE DEPOSIT
  // =====================================================
  const handleCreateDeposit = async () => {
    setLocalError("");
    try {
      await dispatch(
        createDeposit({
          paymentMethod: "upi",
          channel: "upi",
          amount: Number(amount),
        }),
      ).unwrap();
    } catch (err) {
      setLocalError(
        typeof err === "string" ? err : "Deposit creation failed",
      );
    }
  };

  // =====================================================
  // STEP 2 : SUBMIT UTR + PROOF
  // =====================================================
  const handleVerifyPayment = async () => {
    setLocalError("");

    if (!utr || utr.trim().length < 6) {
      setLocalError("कृपया सही UTR / Transaction ID दर्ज करें (min 6 अंक)");
      return;
    }

    try {
      await dispatch(
        createDeposit({
          gatewayId: depositId,
          paymentMethod: "upi",
          channel: "upi",
          amount: Number(amount),
          utr: utr.trim(),
          paymentProof: proof,
        }),
      ).unwrap();

      setStep("done");
      if (onPaymentSuccess) {
        onPaymentSuccess({ utr: utr.trim(), depositId });
      }
    } catch (err) {
      setLocalError(
        typeof err === "string" ? err : "Verification failed",
      );
    }
  };

  // =====================================================
  // COPY UPI / PAYMENT URL
  // =====================================================
  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  // =====================================================
  // OPEN UPI APP
  // =====================================================
  const handleOpenApp = (app) => {
    setSelectedApp(app.id);
    const url = paymentUrl || currentDeposit?.paymentUrl || "";
    // Try app deep link first, fall back to generic upi
    const deepLink = `${app.scheme}?${url.split("?")[1] || ""}`;
    window.location.href = deepLink || url;

    setTimeout(() => setSelectedApp(null), 2000);
  };

  // =====================================================
  // FILE PICK
  // =====================================================
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setLocalError("Image 5MB से कम होनी चाहिए");
      return;
    }

    setProof(file);
    const reader = new FileReader();
    reader.onloadend = () => setProofPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeProof = () => {
    setProof(null);
    setProofPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // =====================================================
  // FORMAT TIME
  // =====================================================
  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  if (!open) return null;

  const activePaymentUrl = paymentUrl || currentDeposit?.paymentUrl || "";
  const upiId = currentDeposit?.upiId || currentDeposit?.vpa || "";

  return (
    <div className="fixed inset-0 z-[999] bg-black/85 backdrop-blur-sm flex items-center justify-center px-4 py-6 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl border border-[#d7b838] bg-[#0a0d0e] text-white overflow-hidden my-auto">
        {/* ==============================
            HEADER
        ============================== */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#242828]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#f5ce54]/15 flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f5ce54"
                strokeWidth="2"
              >
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </div>
            <h3 className="text-[16px] font-bold text-[#f5ce54]">
              UPI भुगतान
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5"
          >
            ✕
          </button>
        </div>

        {/* ==============================
            STEP INDICATOR
        ============================== */}
        <div className="flex items-center justify-center gap-2 px-4 py-3 border-b border-[#1a1d1e]">
          {["init", "qr", "verify", "done"].map((s, i) => {
            const steps = ["init", "qr", "verify", "done"];
            const currentIdx = steps.indexOf(step);
            const isActive = i <= currentIdx;
            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive
                      ? "bg-[#f5ce54] text-black"
                      : "bg-[#1a1d1e] text-white/40"
                  }`}
                >
                  {i + 1}
                </div>
                {i < 3 && (
                  <div
                    className={`w-8 h-[2px] ${
                      i < currentIdx ? "bg-[#f5ce54]" : "bg-[#1a1d1e]"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ==============================
            BODY
        ============================== */}
        <div className="p-4 max-h-[75vh] overflow-y-auto">
          {/* AMOUNT BOX */}
          <div className="rounded-xl bg-gradient-to-r from-[#101416] to-[#0f1213] border border-[#252828] px-4 py-3 mb-4 flex items-center justify-between">
            <div>
              <span className="text-white/60 text-[11px] block">
                कुल राशि
              </span>
              <span className="text-[26px] font-extrabold text-[#f5ce54] leading-none">
                ₹{amount}
              </span>
            </div>
            <div className="text-right">
              <span className="text-white/40 text-[10px] block">
                Order ID
              </span>
              <span className="text-[11px] text-white/70 font-mono">
                {depositId ? depositId.slice(-8).toUpperCase() : "—"}
              </span>
            </div>
          </div>

          {/* ==============================
              STEP : INIT
          ============================== */}
          {step === "init" && (
            <>
              <div className="rounded-xl bg-[#101416] border border-[#252828] p-4 mb-4">
                <h4 className="text-[13px] font-bold text-[#f5ce54] mb-2">
                  भुगतान कैसे करें?
                </h4>
                <ol className="text-[12px] text-white/70 space-y-1.5 list-decimal list-inside">
                  <li>नीचे "भुगतान शुरू करें" पर क्लिक करें</li>
                  <li>QR स्कैन करें या UPI ऐप चुनें</li>
                  <li>₹{amount} का भुगतान पूरा करें</li>
                  <li>UTR नंबर दर्ज करके कन्फर्म करें</li>
                </ol>
              </div>

              <button
                onClick={handleCreateDeposit}
                disabled={loading}
                className="w-full h-[54px] rounded-xl bg-gradient-to-b from-[#ffe16b] to-[#eab52c] text-black font-extrabold text-[16px] disabled:opacity-60 active:scale-[0.99] transition"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner /> बनाया जा रहा है...
                  </span>
                ) : (
                  "भुगतान शुरू करें"
                )}
              </button>
            </>
          )}

          {/* ==============================
              STEP : QR
          ============================== */}
          {step === "qr" && (
            <>
              {/* TIMER */}
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[11px] text-white/50">
                  भुगतान के लिए समय
                </span>
                <span
                  className={`text-[13px] font-bold font-mono ${
                    timeLeft < 60 ? "text-red-400" : "text-[#f5ce54]"
                  }`}
                >
                  ⏱ {formatTime(timeLeft)}
                </span>
              </div>

              {/* QR CODE */}
              <div className="rounded-xl bg-white p-3 flex flex-col items-center mb-3">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                    activePaymentUrl,
                  )}`}
                  alt="UPI QR"
                  className="w-[240px] h-[240px]"
                />
                <p className="text-[10px] text-black/60 mt-2 font-medium">
                  QR को स्कैन करके भुगतान करें
                </p>
              </div>

              {/* UPI ID COPY */}
              {upiId && (
                <div className="flex items-center gap-2 mb-3 rounded-lg bg-[#101416] border border-[#252828] px-3 py-2">
                  <span className="text-[11px] text-white/50 shrink-0">
                    UPI ID
                  </span>
                  <span className="text-[12px] font-mono text-white flex-1 truncate">
                    {upiId}
                  </span>
                  <button
                    onClick={() => handleCopy(upiId)}
                    className="text-[10px] text-[#f5ce54] font-bold shrink-0"
                  >
                    {copied ? "✓ Copied" : "Copy"}
                  </button>
                </div>
              )}

              {/* OPEN UPI APPS */}
              <p className="text-[11px] text-white/50 mb-2 px-1">
                UPI ऐप से भुगतान करें
              </p>

              <div className="grid grid-cols-3 gap-2 mb-3">
                {UPI_APPS.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => handleOpenApp(app)}
                    className={`rounded-lg border p-2 flex flex-col items-center gap-1.5 transition ${
                      selectedApp === app.id
                        ? "border-[#f5ce54] bg-[#f5ce54]/10"
                        : "border-[#252828] bg-[#101416] hover:border-[#3a3e40]"
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ backgroundColor: app.color }}
                    >
                      {app.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-[9px] text-white/70 text-center leading-tight">
                      {app.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* OPEN LINK BUTTON */}
              {activePaymentUrl && (
                <a
                  href={activePaymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full text-center mb-3 text-[12px] text-[#f5ce54] underline"
                >
                  किसी अन्य UPI ऐप में खोलें →
                </a>
              )}

              {/* POLL STATUS */}
              <div className="flex items-center justify-center gap-2 mb-3 text-[10px] text-white/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                भुगतान की जांच हो रही है... ({pollCount})
              </div>

              {/* I PAID BUTTON */}
              <button
                onClick={() => setStep("verify")}
                className="w-full h-[50px] rounded-xl bg-[#f5ce54] text-black font-bold active:scale-[0.99] transition"
              >
                भुगतान कर दिया ✅
              </button>
            </>
          )}

          {/* ==============================
              STEP : VERIFY
          ============================== */}
          {step === "verify" && (
            <>
              <div className="rounded-lg bg-[#f5ce54]/10 border border-[#f5ce54]/30 px-3 py-2 mb-4">
                <p className="text-[11px] text-[#f5ce54] text-center">
                  भुगतान के बाद UTR नंबर दर्ज करें
                </p>
              </div>

              {/* UTR INPUT */}
              <label className="block text-[12px] text-white/70 mb-1">
                UTR / Transaction ID *
              </label>
              <input
                value={utr}
                onChange={(e) =>
                  setUtr(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))
                }
                placeholder="जैसे: 123456789012"
                maxLength={22}
                className="w-full h-[46px] rounded-lg bg-[#101416] border border-[#2a2e30] px-3 text-white text-[14px] font-mono outline-none focus:border-[#f5ce54] mb-1"
              />
              <p className="text-[10px] text-white/40 mb-3">
                UPI ऐप में "Transaction ID" या "UTR" देखें
              </p>

              {/* PROOF UPLOAD */}
              <label className="block text-[12px] text-white/70 mb-1">
                भुगतान स्क्रीनशॉट (optional)
              </label>

              {!proofPreview ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-[70px] rounded-lg border-2 border-dashed border-[#2a2e30] bg-[#101416] flex flex-col items-center justify-center gap-1 hover:border-[#f5ce54]/50 transition mb-4"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#f5ce54"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                  </svg>
                  <span className="text-[11px] text-white/60">
                    स्क्रीनशॉट अपलोड करें
                  </span>
                </button>
              ) : (
                <div className="relative mb-4">
                  <img
                    src={proofPreview}
                    alt="proof"
                    className="w-full h-[140px] object-cover rounded-lg border border-[#2a2e30]"
                  />
                  <button
                    type="button"
                    onClick={removeProof}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white text-[14px] flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* BUTTONS */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setStep("qr")}
                  className="col-span-1 h-[50px] rounded-xl bg-[#1a1d1e] border border-[#2a2e30] text-white font-bold text-[12px]"
                >
                  ← पीछे
                </button>
                <button
                  onClick={handleVerifyPayment}
                  disabled={loading}
                  className="col-span-2 h-[50px] rounded-xl bg-gradient-to-b from-[#ffe16b] to-[#eab52c] text-black font-extrabold text-[13px] disabled:opacity-60 active:scale-[0.99] transition"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner /> सबमिट हो रहा है...
                    </span>
                  ) : (
                    "भुगतान कन्फर्म करें"
                  )}
                </button>
              </div>
            </>
          )}

          {/* ==============================
              STEP : DONE
          ============================== */}
          {step === "done" && (
            <div className="text-center py-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center mb-4">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <p className="text-emerald-300 font-bold text-[16px] mb-1">
                भुगतान सबमिट हो गया!
              </p>
              <p className="text-white/60 text-[12px] mb-1">
                आपका टिकट बुक हो गया है
              </p>
              {utr && (
                <p className="text-[11px] text-white/40 font-mono mb-4">
                  UTR: {utr}
                </p>
              )}

              <div className="rounded-lg bg-[#101416] border border-[#252828] p-3 mb-4 text-left">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-white/50">राशि</span>
                  <span className="text-white font-bold">₹{amount}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-white/50">स्थिति</span>
                  <span className="text-emerald-300 font-bold">
                    वेरिफिकेशन में
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full h-[50px] rounded-xl bg-[#f5ce54] text-black font-bold active:scale-[0.99] transition"
              >
                बंद करें
              </button>
            </div>
          )}

          {/* ==============================
              ERROR
          ============================== */}
          {(localError || error) && (
            <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-[12px] text-red-300 flex items-start gap-2">
              <span className="shrink-0">⚠</span>
              <span>{localError || error}</span>
            </div>
          )}

          {/* ==============================
              SUCCESS MESSAGE
          ============================== */}
          {message && step !== "done" && (
            <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center text-[12px] text-emerald-300">
              {message}
            </div>
          )}
        </div>

        {/* ==============================
            FOOTER
        ============================== */}
        <div className="px-4 py-2 border-t border-[#1a1d1e] flex items-center justify-center gap-2">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="#ffffff60"
          >
            <path d="M17 9V7a5 5 0 00-10 0v2H5v12h14V9h-2zm-8 0V7a3 3 0 016 0v2H9z" />
          </svg>
          <span className="text-[10px] text-white/40">
            100% सुरक्षित भुगतान | SSL Encrypted
          </span>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// SPINNER
// =====================================================
const Spinner = () => (
  <span className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
);

export default UpiPaymentModal;