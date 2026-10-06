import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ChevronRight,
  Crown,
  ExternalLink,
  Gift,
  RefreshCw,
  Search,
  Sparkles,
  Trophy,
  X,
  XCircle,
} from "lucide-react";

import { checkNumber } from "../reducer/slice/lotteryResultReducer";

// 8-character lottery ticket regex (2 digits, 1 letter, 5 digits e.g. 10F68057 or any 8-char alphanumeric)
const TICKET_REGEX = /^[0-9A-Z]{8}$/;
const QUICK_EXAMPLES = ["10F68057", "12A12345", "91D44732"];

const QuickVerifyTicket = ({
  defaultMode = "daily",
  title = "Verify Ticket Number",
  subtitle = "Check if your ticket is among the winning numbers",
  className = "",
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(defaultMode); // "daily" | "festival"
  const [ticketInput, setTicketInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [verifiedResult, setVerifiedResult] = useState(null);

  const handleSearch = async (e) => {
    e?.preventDefault();
    const cleanNumber = String(ticketInput || "")
      .toUpperCase()
      .replace(/\s+/g, "");

    if (!cleanNumber) {
      setErrorMsg("Please enter a ticket number");
      setVerifiedResult(null);
      return;
    }

    if (!TICKET_REGEX.test(cleanNumber)) {
      setErrorMsg("Enter an 8-character ticket (e.g. 10F68057)");
      setVerifiedResult(null);
      return;
    }

    setErrorMsg("");
    setLoading(true);
    setVerifiedResult(null);

    try {
      const res = await dispatch(
        checkNumber({
          userNumber: cleanNumber,
          ticketNumber: cleanNumber,
          type: activeTab,
        })
      ).unwrap();

      setVerifiedResult(res);
    } catch (err) {
      setErrorMsg(typeof err === "string" ? err : err?.message || "Failed to verify ticket");
    } finally {
      setLoading(false);
    }
  };

  const handlePickExample = (ex) => {
    setTicketInput(ex);
    setErrorMsg("");
    setVerifiedResult(null);
  };

  const handleReset = () => {
    setTicketInput("");
    setVerifiedResult(null);
    setErrorMsg("");
  };

  const isWin = verifiedResult && (verifiedResult.winner || verifiedResult.status === "win");

  return (
    <div
      className={`relative overflow-hidden rounded-[18px] border border-[#e2e5f0] bg-white p-3.5 shadow-sm transition ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff1744] to-[#c9102f] text-white shadow-sm">
            <Search size={18} strokeWidth={2.4} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[14px] font-extrabold text-[#173e70]">
              {title}
            </h3>
            <p className="truncate text-[10.5px] font-medium text-[#6b7280]">
              {subtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/verify")}
          className="flex shrink-0 items-center gap-0.5 rounded-lg border border-[#c9d3e3] px-2 py-1 text-[11px] font-bold text-[#173e70] transition hover:bg-gray-50 active:scale-95"
        >
          <span>Full Verify</span>
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-3 grid grid-cols-2 gap-1.5 rounded-xl border border-[#e2e5f0] bg-[#f6f9fe] p-1">
        <button
          type="button"
          onClick={() => {
            setActiveTab("daily");
            setVerifiedResult(null);
            setErrorMsg("");
          }}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-extrabold transition ${
            activeTab === "daily"
              ? "bg-[#173e70] text-white shadow-sm"
              : "text-[#6b7280] hover:text-[#173e70]"
          }`}
        >
          <Crown size={14} className={activeTab === "daily" ? "text-[#ffd34e]" : ""} />
          <span>Daily Lottery</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("festival");
            setVerifiedResult(null);
            setErrorMsg("");
          }}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-extrabold transition ${
            activeTab === "festival"
              ? "bg-[#173e70] text-white shadow-sm"
              : "text-[#6b7280] hover:text-[#173e70]"
          }`}
        >
          <Gift size={14} className={activeTab === "festival" ? "text-[#ffd34e]" : ""} />
          <span>Festival Bumper</span>
        </button>
      </div>

      {/* Search Input Form */}
      <form onSubmit={handleSearch} className="mt-2.5">
        <div className="flex items-center gap-1.5">
          <div className="relative min-w-0 flex-1">
            <input
              type="text"
              value={ticketInput}
              onChange={(e) => {
                setTicketInput(
                  e.target.value
                    .toUpperCase()
                    .replace(/[^0-9A-Z]/g, "")
                    .slice(0, 8)
                );
                setErrorMsg("");
              }}
              placeholder="e.g. 10F68057"
              maxLength={8}
              disabled={loading}
              className="h-[42px] w-full rounded-xl border border-[#dfe5f0] bg-[#f9fbff] px-3 pr-8 text-[13px] font-bold tracking-wider text-[#173e70] outline-none placeholder:text-[11.5px] placeholder:font-normal placeholder:tracking-normal placeholder:text-[#8a97ab] focus:border-[#ed1d43] focus:bg-white focus:shadow-[0_0_0_3px_rgba(237,29,67,0.12)] disabled:opacity-50"
            />
            {ticketInput && (
              <button
                type="button"
                onClick={handleReset}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !ticketInput.trim()}
            className="flex h-[42px] shrink-0 items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-[#ff1744] to-[#e0102f] px-3.5 text-[12px] font-extrabold text-white shadow-sm transition active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : (
              <>
                <span>Check</span>
                <ChevronRight size={14} strokeWidth={2.5} />
              </>
            )}
          </button>
        </div>

        {/* Validation error */}
        {errorMsg && (
          <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-center text-[11px] font-medium text-red-600">
            {errorMsg}
          </p>
        )}

        {/* Quick Examples */}
        {!verifiedResult && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-[#6b7280]">Try:</span>
            {QUICK_EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => handlePickExample(ex)}
                className="rounded-md border border-[#dfe5f0] bg-[#f6f9fe] px-1.5 py-0.5 text-[11px] font-bold text-[#173e70] hover:bg-[#FFEFA8]/50 active:scale-95"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Result Display */}
      {verifiedResult && (
        <div className="mt-3 overflow-hidden rounded-xl border animate-in fade-in">
          {isWin ? (
            <div className="border-[#20a66a]/40 bg-gradient-to-br from-[#e9f8f0] via-white to-[#f2fff7] p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#20a66a] text-white shadow-sm">
                    <Trophy size={20} className="text-[#ffd34e]" fill="#ffd34e" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-serif text-[16px] font-black leading-none text-[#20a66a]">
                        WINNER!
                      </span>
                      <CheckCircle2 size={15} className="text-[#20a66a]" />
                    </div>
                    <p className="mt-0.5 text-[11px] font-bold text-[#173e70]">
                      {verifiedResult.prizeLabel || "Winner"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[17px] font-black leading-none text-[#d7193f]">
                    {verifiedResult.prizeAmount}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[#6b7280]">
                    {verifiedResult.drawDate || "Draw Result"}
                  </p>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between border-t border-[#20a66a]/20 pt-2 text-[10.5px]">
                <span className="font-mono font-bold text-[#173e70]">
                  Ticket: {verifiedResult.ticketNumber || ticketInput}
                </span>

                <button
                  type="button"
                  onClick={() => navigate("/verify")}
                  className="inline-flex items-center gap-1 font-bold text-[#173e70] hover:underline"
                >
                  <span>View Details</span>
                  <ExternalLink size={11} />
                </button>
              </div>
            </div>
          ) : (
            <div className="border-[#ed1d43]/30 bg-gradient-to-br from-[#fff0f2] via-white to-[#fff5f6] p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ed1d43] text-white shadow-sm">
                    <XCircle size={18} />
                  </span>
                  <div>
                    <p className="text-[13px] font-black text-[#d7193f]">
                      NOT A WINNER
                    </p>
                    <p className="text-[10px] text-[#6b7280]">
                      Better luck next time!
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="mt-2 border-t border-[#ed1d43]/15 pt-2 text-[10px] text-[#6b7280]">
                Checked Ticket: <strong className="text-[#173e70]">{verifiedResult.ticketNumber || ticketInput}</strong>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuickVerifyTicket;
