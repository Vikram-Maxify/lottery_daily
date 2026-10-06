import React, { useState, useEffect, useRef } from "react";
import {
  Trophy,
  Crown,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

const DURATION_MS = 4000; // 4 seconds per winner

const TopWinnersToast = ({ winners = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  const total = winners.length;

  useEffect(() => {
    if (!total || isPaused) return;

    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, DURATION_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, isPaused, total]);

  if (!total) return null;

  const winner = winners[currentIndex];

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  return (
    <div className="w-full">
      {/* Toast Slide-In Keyframes */}
      <style>{`
        @keyframes toastSlideIn {
          0% {
            transform: translateX(105%);
            opacity: 0;
          }
          10% {
            transform: translateX(0);
            opacity: 1;
          }
          88% {
            transform: translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateX(-105%);
            opacity: 0;
          }
        }

        @keyframes toastProgress {
          0% {
            width: 0%;
          }
          10% {
            width: 0%;
          }
          88% {
            width: 100%;
          }
          100% {
            width: 100%;
          }
        }

        .toast-slide-card {
          animation: toastSlideIn ${DURATION_MS}ms cubic-bezier(0.16, 1, 0.3, 1) infinite;
          will-change: transform, opacity;
        }

        .toast-progress-bar {
          animation: toastProgress ${DURATION_MS}ms linear infinite;
        }

        .toast-paused {
          animation-play-state: paused !important;
        }
      `}</style>

      {/* Top Header */}
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[#ffd34e] to-[#f59e0b] text-[#173e70] shadow-sm">
            <Trophy size={14} strokeWidth={2.6} />
          </div>
          <div className="leading-tight">
            <h3 className="text-[13px] font-black uppercase tracking-wider text-[#173e70]">
              Top Winners
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-[#ed1d43]/30 bg-[#ed1d43]/10 px-2 py-0.5 text-[9.5px] font-extrabold text-[#ed1d43]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ed1d43] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ed1d43]" />
            </span>
            Live Alert
          </span>

          <span className="text-[10px] font-bold text-[#6b7280]">
            {currentIndex + 1}/{total}
          </span>
        </div>
      </div>

      {/* Toast Notification Container */}
      <div
        className="relative overflow-hidden rounded-2xl"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div
          key={currentIndex}
          className={`toast-slide-card relative overflow-hidden rounded-2xl border border-[#ff3155]/40 bg-gradient-to-br from-[#460f22] via-[#2f0c1c] to-[#1a0711] p-3 shadow-[0_10px_28px_rgba(0,0,0,0.28)] ${
            isPaused ? "toast-paused" : ""
          }`}
        >
          {/* Subtle Ambient Glow */}
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#ffd34e]/10 blur-xl" />
          <div className="pointer-events-none absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-[#ed1d43]/15 blur-xl" />

          {/* Subheader inside the Toast */}
          <div className="relative mb-2 flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-black tracking-wide text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              CONGRATULATIONS
            </span>

            <span className="inline-flex items-center gap-1 text-[9.5px] font-medium text-white/70">
              <Clock size={10} />
              {winner.time}
            </span>
          </div>

          {/* Main Winner Body */}
          <div className="relative flex items-center gap-3">
            {/* Avatar with Gold Crown */}
            <div className="relative shrink-0">
              <img
                src={winner.image}
                alt={winner.name}
                className="h-12 w-12 rounded-full border-2 border-[#ffd34e] object-cover shadow-md"
                onError={(e) => {
                  e.target.src =
                    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80";
                }}
              />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ffd34e] text-[#173e70] shadow">
                <Crown size={10} strokeWidth={3} />
              </span>
            </div>

            {/* Winner Details */}
            <div className="min-w-0 flex-1 leading-tight">
              <div className="flex items-baseline gap-1.5">
                <h4 className="truncate text-[13.5px] font-extrabold text-white">
                  {winner.name}
                </h4>
                <span className="text-[10px] font-semibold text-white/70">
                  just won
                </span>
              </div>

              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="text-[16px] font-black tracking-tight text-[#ffd34e]">
                  {winner.amount}
                </span>
              </div>

              <p className="mt-0.5 truncate text-[10px] text-white/65">
                Ticket:{" "}
                <span className="font-mono font-bold text-white/95">
                  {winner.ticket}
                </span>
              </p>
            </div>

            {/* Right Badge / Trophy */}
            <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border border-[#ffd34e]/30 bg-gradient-to-br from-[#ffd34e]/20 to-white/5 text-[#ffd34e] shadow-sm">
              <Trophy size={18} fill="#ffd34e" />
              <span className="mt-0.5 text-[7.5px] font-black tracking-tighter text-[#ffd34e]">
                JACKPOT
              </span>
            </div>
          </div>

          {/* Toast Timer Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/10">
            <div
              className={`toast-progress-bar h-full bg-gradient-to-r from-[#ed1d43] via-[#ffd34e] to-emerald-400 ${
                isPaused ? "toast-paused" : ""
              }`}
            />
          </div>
        </div>

        {/* Floating Mini Controls (Dots & Quick Nav) */}
        <div className="mt-1.5 flex items-center justify-between px-1">
          <div className="flex items-center gap-1">
            {winners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to winner ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentIndex
                    ? "w-4 bg-[#173e70]"
                    : "w-1.5 bg-[#cbd5e1] hover:bg-[#94a3b8]"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous winner"
              className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#173e70] shadow-sm hover:bg-gray-100 active:scale-95"
            >
              <ChevronLeft size={12} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next winner"
              className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#173e70] shadow-sm hover:bg-gray-100 active:scale-95"
            >
              <ChevronRight size={12} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopWinnersToast;
