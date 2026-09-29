import React, { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  Copy,
  Crown,
  FileText,
  Gift,
  Info,
  Search,
  Sparkles,
  Trophy,
  User,
} from "lucide-react";

// =====================================================
// CONSTANTS
// =====================================================

// ⚠️ Apne bottom navbar ki height (px) yahan daalo.
const BOTTOM_NAV_HEIGHT = 64;

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1605196560547-b2f7281b7355?auto=format&fit=crop&w=1400&q=80";

const LATEST = {
  drawDate: "26 Sep 2026 (Saturday)",
  drawTime: "8:00 PM",
  ticket: "10F 68057",
  prize: "₹1 CRORE",
};

const TICKET_TABS = [
  { key: "daily", label: "DEAR DAILY LOTTERY", icon: Crown },
  { key: "festival", label: "DEAR FESTIVAL LOTTERY", icon: Gift },
];

const PRIZE_TIERS = [
  { no: 1, rank: "1st Prize", amount: "₹1 CRORE", ticket: "10F 68057", tickets: "10 Tickets", badge: "bg-[#ffd34e] text-[#7a0f1e]" },
  { no: 2, rank: "2nd Prize", amount: "₹30 LAKH", ticket: "11F 68057", tickets: "10 Tickets", badge: "bg-[#2e7dd7] text-white" },
  { no: 3, rank: "3rd Prize", amount: "₹20,000", ticket: "99F 68057", tickets: "10 Tickets", badge: "bg-[#f08a25] text-white" },
  { no: 4, rank: "4th Prize", amount: "₹20,000", ticket: "10F6XXXX", tickets: "10 Tickets", badge: "bg-[#20a66a] text-white" },
  { no: 5, rank: "5th Prize", amount: "₹900", ticket: "10AXXXXX", tickets: "10 Tickets", badge: "bg-[#8c4bd6] text-white" },
];

const TOP_WINNERS = [
  { name: "Rakesh Kumar", location: "West Bengal", prize: "₹1,00,00,000", ticket: "10F 68057" },
  { name: "Sunita Devi", location: "Assam", prize: "₹1,00,00,000", ticket: "10F 68057" },
  { name: "Md. Irfan", location: "Kolkata", prize: "₹1,00,00,000", ticket: "10F 68057" },
  { name: "Suresh Patel", location: "Guwahati", prize: "₹1,00,00,000", ticket: "10F 68057" },
];

const PAST_DRAWS = [
  { no: 1, date: "26 Sep 2026", day: "Sat", time: "8:00 PM", drawNumber: "DL-6824", ticket: "10F 68057" },
  { no: 2, date: "25 Sep 2026", day: "Fri", time: "8:00 PM", drawNumber: "DL-6823", ticket: "77C 34682" },
  { no: 3, date: "24 Sep 2026", day: "Thu", time: "8:00 PM", drawNumber: "DL-6822", ticket: "32B 90814" },
  { no: 4, date: "23 Sep 2026", day: "Wed", time: "8:00 PM", drawNumber: "DL-6821", ticket: "19A 55237" },
  { no: 5, date: "22 Sep 2026", day: "Tue", time: "8:00 PM", drawNumber: "DL-6820", ticket: "91D 44732" },
];

const WINNING_RULES = [
  { no: 1, condition: "All digits/characters match", example: "10F68057", prize: "₹50 Lakh", total: "₹5 Crore", badge: "bg-[#ed1d43]", row: "bg-[#ffe4e8]" },
  { no: 2, condition: "Alphabet does not match but all remaining digits match", example: "11F68057", prize: "₹30 Lakh", total: "₹3 Crore", badge: "bg-[#2e7dd7]", row: "bg-[#e3f0ff]" },
  { no: 3, condition: "All numbers after the alphabet match", example: "99F68057", prize: "₹20,000", total: "₹2 Lakh", badge: "bg-[#f08a25]", row: "bg-[#ffefdc]" },
  { no: 4, condition: "Left-most 4 digits match", example: "10F6XXXX", prize: "₹20,000", total: "₹2 Lakh", badge: "bg-[#20a66a]", row: "bg-[#dcf8ea]" },
  { no: 5, condition: "Left-most 3 digits match", example: "10AXXXXX", prize: "₹900", total: "₹9,000", badge: "bg-[#8c4bd6]", row: "bg-[#f0e4ff]" },
];

// =====================================================
// MAIN PAGE
// =====================================================

const LeaderboardPage = () => {
  const [activeTab, setActiveTab] = useState("festival");

  const lotteryName =
    activeTab === "festival" ? "FESTIVAL LOTTERY" : "DAILY LOTTERY";

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(LATEST.ticket.replace(/\s+/g, ""));
    } catch {}
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#eef3fa] text-[#173e70]">
      <div
        className="relative mx-auto w-full max-w-[450px] overflow-x-hidden"
        style={{ paddingBottom: BOTTOM_NAV_HEIGHT + 24 }}
      >
        {/* ================= TABS ================= */}
        <section className="px-2 pt-3">
          <div className="grid grid-cols-2 gap-1.5">
            {TICKET_TABS.map((t) => {
              const Icon = t.icon;
              const active = t.key === activeTab;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={`flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-1.5 py-3 text-center text-[10.5px] font-extrabold leading-tight shadow-md transition active:scale-[0.98] ${
                    active
                      ? "bg-gradient-to-b from-[#ff1744] to-[#c9102f] text-white"
                      : "bg-[#fffaf4] text-[#173e70]"
                  }`}
                >
                  <Icon
                    size={17}
                    className={`shrink-0 ${active ? "text-[#ffd34e]" : "text-[#ed1d43]"}`}
                  />
                  <span className="min-w-0">{t.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ================= LATEST RESULT HERO ================= */}
        <section className="mt-3 px-2">
          <div
            className="relative overflow-hidden rounded-[16px] bg-[#3b0a14] bg-cover bg-center shadow-lg"
            style={{ backgroundImage: `url(${HERO_IMAGE})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#2a0610]/95 via-[#4a0b18]/80 to-[#2a0610]/60" />
            <div className="pointer-events-none absolute -right-10 top-0 h-48 w-48 rounded-full bg-[#ff8a00]/25 blur-3xl" />
            <div className="pointer-events-none absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-[#ff1744]/20 blur-3xl" />

            <Sparkles
              size={14}
              className="pointer-events-none absolute left-[42%] top-3 text-[#ffcf4a]/80"
            />

            <div className="relative grid grid-cols-[104px_minmax(0,1fr)] items-center gap-3 p-3">
              {/* ticket */}
              <div className="relative min-w-0">
                <div className="absolute inset-0 -rotate-[8deg] rounded-md border border-[#e5c8a4] bg-[#fdf1dc]" />
                <div className="relative -rotate-[3deg] rounded-md border-[3px] border-[#f2d1b8] bg-[#fffaf0] p-1.5 shadow-lg">
                  <p className="text-[8.5px] font-bold leading-tight text-[#153c78]">
                    Government Lottery
                  </p>
                  <p className="text-[19px] font-black leading-none text-[#d7193f]">
                    DEAR
                  </p>
                  <p className="text-[8.5px] font-black leading-tight text-[#153c78]">
                    {lotteryName}
                  </p>
                  <p className="mt-1.5 text-[8px] font-semibold text-[#5a4a2a]">
                    Draw No:
                  </p>
                  <p className="whitespace-nowrap text-[12px] font-black tracking-wide text-[#173e70]">
                    {LATEST.ticket}
                  </p>
                </div>
              </div>

              {/* info */}
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-[15px] font-black leading-tight tracking-wide text-white">
                    LATEST RESULT
                  </h2>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#ed1d43] px-2 py-[3px] text-[10px] font-black text-white">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                    LIVE
                  </span>
                </div>

                <p className="mt-1 text-[10.5px] leading-tight text-white/85">
                  Draw Date: {LATEST.drawDate}
                  <br />
                  Draw Time: {LATEST.drawTime}
                </p>

                <div className="mt-2 flex items-end justify-between gap-1">
                  <div className="min-w-0">
                    <p className="bg-gradient-to-b from-[#fff1a8] to-[#e0a11b] bg-clip-text font-serif text-[15px] font-black leading-none text-transparent">
                      1ST PRIZE
                    </p>
                    <p
                      className="mt-0.5 whitespace-nowrap font-black leading-none text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                      style={{ fontSize: "clamp(22px, 7vw, 30px)" }}
                    >
                      {LATEST.prize}
                    </p>
                  </div>

                  <span className="relative flex h-9 w-9 shrink-0 items-center justify-center">
                    <span className="absolute inset-0 rounded-full bg-[#ffd34e]/30 blur-md" />
                    <Trophy size={32} className="relative text-[#ffd34e]" fill="#ffd34e" />
                  </span>
                </div>

                <div className="mt-2 flex">
                  <div className="flex min-w-0 max-w-full items-center gap-2 rounded-lg border border-[#ffd34e]/60 bg-white px-2 py-1">
                    <span className="whitespace-nowrap text-[15px] font-black tracking-wide text-[#173e70]">
                      {LATEST.ticket}
                    </span>
                    <button
                      type="button"
                      onClick={copyNumber}
                      aria-label="Copy number"
                      className="shrink-0 text-[#173e70] active:scale-90"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                <span className="mt-1.5 inline-block rounded-full bg-gradient-to-b from-[#ffb800] to-[#d99a00] px-2 py-[2px] text-[8.5px] font-black uppercase tracking-wide text-[#3b0a14]">
                  Congratulations Winner
                </span>
              </div>
            </div>
          </div>
        </section>

        <main className="space-y-3 px-2 pt-3">
          {/* ================= PRIZE TIERS ================= */}
          <section className="grid grid-cols-5 gap-1">
            {PRIZE_TIERS.map((tier) => (
              <PrizeTile key={tier.no} {...tier} active={tier.no === 1} />
            ))}
          </section>

          {/* ================= QUICK ACTIONS (2 x 2) ================= */}
          <section className="grid grid-cols-2 gap-2">
            <QuickAction
              icon={<Search size={20} />}
              title="Check Result"
              sub="Enter Ticket Number"
              tone="bg-[#ed1d43]"
            />
            <QuickAction
              icon={<BarChart3 size={20} />}
              title="All Draw Results"
              sub="View past results"
              tone="bg-[#2e7dd7]"
            />
            <QuickAction
              icon={<Trophy size={20} />}
              title="Prize Structure"
              sub="See winning rules"
              tone="bg-[#8c4bd6]"
            />
            <QuickAction
              icon={<FileText size={20} />}
              title="Official PDF"
              sub="Download result"
              tone="bg-[#20a66a]"
            />
          </section>

          {/* ================= TOP WINNERS ================= */}
          <section className="rounded-[16px] bg-white p-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
              <div className="flex min-w-0 items-center gap-2">
                <Trophy size={20} className="shrink-0 text-[#d4a017]" fill="#ffd34e" />
                <h2 className="text-[14px] font-extrabold text-[#173e70]">
                  Top Winners (₹1 Crore)
                </h2>
              </div>

              <button
                type="button"
                className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-[#c9d3e3] bg-white px-2 py-1.5 text-[10.5px] font-semibold text-[#173e70]"
              >
                View All Winners
                <ArrowRight size={12} />
              </button>
            </div>

            {/* swipe row */}
            <div className="-mx-3 mt-3 flex snap-x gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {TOP_WINNERS.map((w, i) => (
                <WinnerCard key={i} rank={i + 1} {...w} />
              ))}
            </div>
          </section>

          {/* ================= PAST DRAW RESULTS ================= */}
          <section className="rounded-[16px] bg-white p-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
              <div className="flex min-w-0 items-center gap-2">
                <CalendarDays size={20} className="shrink-0 text-[#ed1d43]" />
                <h2 className="text-[14px] font-extrabold text-[#173e70]">
                  Past Draw Results
                </h2>
              </div>

              <button
                type="button"
                className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-[#c9d3e3] bg-white px-2 py-1.5 text-[10.5px] font-semibold text-[#173e70]"
              >
                View All Results
                <ArrowRight size={12} />
              </button>
            </div>

            <div className="mt-3 overflow-hidden rounded-lg border border-[#e2e5f0]">
              <table className="w-full table-fixed border-collapse text-left">
                <colgroup>
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "27%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "25%" }} />
                  <col style={{ width: "23%" }} />
                </colgroup>

                <thead>
                  <tr className="bg-[#3a0b17] text-white">
                    {["#", "Draw Date", "Draw No.", "1st Prize No.", "Result"].map((h) => (
                      <th
                        key={h}
                        className="px-1 py-2 text-[9px] font-semibold leading-tight"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {PAST_DRAWS.map((d, i) => (
                    <tr
                      key={d.no}
                      className={`${i % 2 === 0 ? "bg-white" : "bg-[#f6f9fe]"} border-b border-[#e2e5f0]`}
                    >
                      <td className="px-1 py-2.5 text-[11px] font-black text-[#ed1d43]">
                        {d.no}
                      </td>
                      <td className="px-1 py-2.5">
                        <p className="text-[10px] font-bold leading-tight text-[#173e70]">
                          {d.date}
                        </p>
                        <p className="mt-0.5 text-[8.5px] leading-tight text-[#4b5563]">
                          {d.day} · {d.time}
                        </p>
                      </td>
                      <td className="px-1 py-2.5 font-mono text-[9.5px] font-bold leading-tight text-[#173e70]">
                        {d.drawNumber}
                      </td>
                      <td className="px-1 py-2.5">
                        <span className="whitespace-nowrap font-mono text-[10px] font-black text-[#d7193f]">
                          {d.ticket}
                        </span>
                      </td>
                      <td className="px-1 py-2.5">
                        <button
                          type="button"
                          className="flex items-center gap-0.5 whitespace-nowrap rounded-md bg-gradient-to-b from-[#ffb800] to-[#d99a00] px-1.5 py-1 text-[9px] font-extrabold text-white shadow-sm active:scale-95"
                        >
                          <span className="min-[400px]:hidden">View</span>
                          <span className="hidden min-[400px]:inline">View Result</span>
                          <ArrowRight size={9} strokeWidth={3} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ================= WINNING RULES ================= */}
          <section className="overflow-hidden rounded-[18px] bg-gradient-to-br from-[#3a0b17] via-[#2b0a16] to-[#1a0710] p-2.5 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <BookOpen size={22} className="shrink-0 text-[#ffd34e]" />
                <h2 className="text-[14px] font-extrabold leading-tight text-white">
                  Winning Rules
                </h2>
              </div>

              <button
                type="button"
                className="flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-white/40 px-2.5 text-[10.5px] font-semibold text-white"
              >
                View Full Rules
                <ArrowRight size={12} />
              </button>
            </div>

            <p className="mt-2 px-1 text-[11px] leading-snug text-white/80">
              Match your ticket number with the drawn number and see exciting prizes!
            </p>

            <div className="mt-2 overflow-hidden rounded-lg">
              <table className="w-full table-fixed border-collapse text-left">
                <colgroup>
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "30%" }} />
                  <col style={{ width: "24%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "19%" }} />
                </colgroup>

                <thead>
                  <tr className="bg-[#1a0710] text-white">
                    {["#", "Match Condition", "Example", "Prize / Ticket", "Total (×10)"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-1 py-2.5 text-[9.5px] font-semibold leading-tight"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {WINNING_RULES.map((r) => (
                    <RuleRow key={r.no} {...r} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ================= IMPORTANT INFO ================= */}
          <section className="flex items-start gap-2 rounded-[16px] border border-[#bfe8d3] bg-[#e7f8ef] px-3 py-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#14a06a] text-white">
              <Info size={13} />
            </span>
            <p className="min-w-0 text-[11.5px] leading-snug text-[#26354b]">
              All results are verified against official government lottery draw
              publications. Winners are listed as per the official release.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
};

// =====================================================
// SMALL COMPONENTS
// =====================================================

const PrizeTile = ({ no, rank, amount, ticket, tickets, badge, active }) => (
  <div
    className={`relative min-w-0 rounded-xl px-0.5 py-2 text-center shadow-md ${
      active ? "bg-gradient-to-b from-[#ff1744] to-[#c9102f]" : "bg-white"
    }`}
  >
    <span
      className={`mx-auto flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${badge}`}
    >
      {no}
    </span>

    <p
      className={`mt-1 text-[9px] font-bold leading-tight ${
        active ? "text-white" : "text-[#4b5563]"
      }`}
    >
      {rank}
    </p>

    <p
      className={`mt-0.5 whitespace-nowrap text-[10.5px] font-black leading-tight ${
        active ? "text-white" : "text-[#173e70]"
      }`}
    >
      {amount}
    </p>

    <span
      className={`mt-1 inline-block max-w-full whitespace-nowrap rounded px-0.5 py-[1px] font-mono text-[8px] font-black leading-tight ${
        active
          ? "bg-white text-[#c9102f]"
          : "border border-[#dfe5f0] bg-[#f6f9fe] text-[#173e70]"
      }`}
    >
      {ticket}
    </span>

    <p
      className={`mt-1 text-[8.5px] leading-tight ${
        active ? "text-white/90" : "text-[#4b5563]"
      }`}
    >
      {tickets}
    </p>
  </div>
);

const QuickAction = ({ icon, title, sub, tone }) => (
  <button
    type="button"
    className="flex min-w-0 items-center gap-2.5 rounded-xl bg-white p-2.5 text-left shadow-sm transition active:scale-[0.97]"
  >
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white ${tone}`}
    >
      {icon}
    </span>
    <span className="min-w-0">
      <span className="block text-[12px] font-extrabold leading-tight text-[#173e70]">
        {title}
      </span>
      <span className="mt-0.5 block text-[10px] leading-tight text-[#4b5563]">
        {sub}
      </span>
    </span>
  </button>
);

const WinnerCard = ({ rank, name, location, prize, ticket }) => (
  <div className="flex w-[108px] shrink-0 snap-start flex-col items-center rounded-xl border border-[#f1d9a0] bg-gradient-to-b from-[#fff0c9] to-[#fff8e8] px-1.5 pb-2 pt-1.5 text-center shadow-sm">
    <span className="flex items-center gap-0.5">
      <Crown size={13} className="text-[#d4a017]" fill="#d4a017" />
      <span className="text-[12px] font-black text-[#a0561b]">{rank}</span>
    </span>

    <span className="mt-1 flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#d4a017] bg-[#fff5d1] text-[#a0561b]">
      <User size={22} />
    </span>

    <p className="mt-1 text-[11px] font-black leading-tight text-[#173e70]">
      {name}
    </p>
    <p className="mt-0.5 text-[9.5px] leading-tight text-[#4b5563]">
      {location}
    </p>
    <p className="mt-1 whitespace-nowrap text-[9px] leading-tight text-[#4b5563]">
      Ticket: {ticket}
    </p>

    <span className="mt-1.5 w-full whitespace-nowrap rounded-full bg-gradient-to-r from-[#ff1744] to-[#c9102f] px-1 py-1 text-[9.5px] font-black text-white">
      {prize}
    </span>
  </div>
);

const RuleRow = ({ no, condition, example, prize, total, badge, row }) => (
  <tr className={`${row} border-b border-white/60`}>
    <td className="px-1 py-2.5">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-black text-white ${badge}`}
      >
        {no}
      </span>
    </td>

    <td className="px-1 py-2.5 text-[10px] font-medium leading-tight text-[#26354b]">
      {condition}
    </td>

    <td className="px-1 py-2.5">
      <span className="whitespace-nowrap rounded border border-[#e6c97c] bg-[#fffdf5] px-0.5 py-0.5 font-mono text-[9.5px] font-black text-[#d7193f]">
        {example}
      </span>
    </td>

    <td className="px-1 py-2.5 text-[10.5px] font-bold leading-tight text-[#173e70]">
      {prize}
    </td>

    <td className="px-1 py-2.5 text-[10.5px] font-black leading-tight text-[#d7193f]">
      {total}
    </td>
  </tr>
);

export default LeaderboardPage;