import React, { useEffect, useRef, useState } from "react";
import { Ticket, X, Flame, Sparkles } from "lucide-react";
import { socket } from "../socket";

// =====================================================
// HELPER: Format 8-char ticket number with space
// e.g. "47B39120" -> "47B 39120"
// =====================================================
const formatTicketNumber = (raw) => {
  if (!raw) return "";
  const s = String(raw).trim().toUpperCase();
  if (s.length === 8 && /^\d{2}[A-Z]\d{5}$/.test(s)) {
    return `${s.slice(0, 3)} ${s.slice(3)}`;
  }
  return s;
};

const NumberSoldNotification = () => {
  const [currentNotification, setCurrentNotification] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const hideTimerRef = useRef(null);
  const cleanupTimerRef = useRef(null);

  const dismiss = () => {
    setIsVisible(false);
    clearTimeout(hideTimerRef.current);
    clearTimeout(cleanupTimerRef.current);
    cleanupTimerRef.current = setTimeout(() => {
      setCurrentNotification(null);
    }, 350);
  };

  useEffect(() => {
    const handleTicketSold = (data) => {
      if (!data) return;

      const rawNumber =
        data.ticketNumber ||
        data.number ||
        data.ticket ||
        data.ticketCode ||
        "";

      const formattedNumber = formatTicketNumber(rawNumber);

      // Clear existing timers
      clearTimeout(hideTimerRef.current);
      clearTimeout(cleanupTimerRef.current);

      setCurrentNotification({
        number: formattedNumber || "Ticket",
        batchDate: data.batchDate,
        timestamp: data.timestamp || Date.now(),
      });

      // Slide in on next frame
      requestAnimationFrame(() => {
        setIsVisible(true);
      });

      // Keep visible for ~3 seconds, then slide out
      hideTimerRef.current = setTimeout(() => {
        setIsVisible(false);

        // Remove from DOM after slide-out transition completes (350ms)
        cleanupTimerRef.current = setTimeout(() => {
          setCurrentNotification(null);
        }, 350);
      }, 3000);
    };

    // Attach existing Socket.IO event listener
    socket.on("ticketSold", handleTicketSold);

    return () => {
      socket.off("ticketSold", handleTicketSold);
      clearTimeout(hideTimerRef.current);
      clearTimeout(cleanupTimerRef.current);
    };
  }, []);

  if (!currentNotification) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed top-4 right-4 z-[9999] flex w-full max-w-[340px] flex-col items-end px-3 sm:px-0"
    >
      <div
        className={`pointer-events-auto relative w-full overflow-hidden rounded-2xl border border-[#ffd34e]/40 bg-gradient-to-br from-[#0d2547] via-[#122e56] to-[#0a1c36] p-3.5 text-white shadow-2xl backdrop-blur-md transition-all duration-300 ease-out ${
          isVisible
            ? "translate-x-0 opacity-100 scale-100 shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
            : "translate-x-full opacity-0 scale-95"
        }`}
      >
        {/* Decorative corner glow */}
        <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#ffd34e]/15 blur-xl" />
        <div className="pointer-events-none absolute -left-6 -bottom-6 h-20 w-20 rounded-full bg-[#ed1d43]/20 blur-xl" />

        <div className="relative flex items-start gap-3">
          {/* Flame / Ticket badge */}
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ed1d43] to-[#ff5277] text-white shadow-md shadow-red-500/30">
            <Flame size={20} className="animate-pulse" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
          </div>

          {/* Text content */}
          <div className="min-w-0 flex-1 pr-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#ffd34e]">
                Number Sold
              </span>
              <Sparkles size={11} className="text-[#ffd34e]" />
            </div>

            <p className="mt-0.5 text-[12.5px] font-medium leading-snug text-white/90">
              Daily Number{" "}
              <strong className="font-mono font-black tracking-wider text-[#ffd34e]">
                {currentNotification.number}
              </strong>{" "}
              has been sold
            </p>
          </div>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close notification"
            className="shrink-0 rounded-lg p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={15} />
          </button>
        </div>

        {/* 3-second animated progress line */}
        <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full bg-gradient-to-r from-[#ffd34e] via-[#ff6b8b] to-[#ed1d43] transition-all duration-[3000ms] ease-linear ${
              isVisible ? "w-0" : "w-full"
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default NumberSoldNotification;
