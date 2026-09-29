import React, { useState } from "react";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  CalendarDays,
  Crown,
  Download,
  FileText,
  Flame,
  Gift,
  Info,
  Search,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";

// =====================================================
// MOCK DATA
// =====================================================

const TOP_WINNERS = [
  {
    name: "Rakesh Kumar",
    location: "Nagpur, Maharashtra",
    prize: "₹1,00,00,000",
    ticket: "10F68057",
  },
  {
    name: "Sunita Devi",
    location: "Patna, Bihar",
    prize: "₹1,00,00,000",
    ticket: "10F68057",
  },
  {
    name: "Md. Irfan",
    location: "Lucknow, UP",
    prize: "₹1,00,00,000",
    ticket: "10F68057",
  },
  {
    name: "Suresh Patel",
    location: "Surat, Gujarat",
    prize: "₹1,00,00,000",
    ticket: "10F68057",
  },
];

const PRIZE_TIERS = [
  {
    rank: "1st Prize",
    amount: "₹1 CRORE",
    ticket: "10F68057",
    tickets: "10 Tickets",
    tone: "red",
    icon: "crown",
  },
  {
    rank: "2nd Prize",
    amount: "₹30 LAKH",
    ticket: "11F68057",
    tickets: "10 Tickets",
    tone: "blue",
    icon: "medal",
  },
  {
    rank: "3rd Prize",
    amount: "₹20,000",
    ticket: "99F 68057",
    tickets: "10 Tickets",
    tone: "orange",
    icon: "medal",
  },
  {
    rank: "4th Prize",
    amount: "₹20,000",
    ticket: "10F6XXX",
    tickets: "10 Tickets",
    tone: "green",
    icon: "medal",
  },
  {
    rank: "5th Prize",
    amount: "₹900",
    ticket: "10AXXXX",
    tickets: "10 Tickets",
    tone: "violet",
    icon: "medal",
  },
];

const PAST_DRAWS = [
  {
    no: 1,
    date: "26 Sep 2026",
    day: "Saturday",
    time: "8:00 PM",
    drawNumber: "DL-6824",
    ticket: "10F 68057",
    result: "win",
  },
  {
    no: 2,
    date: "25 Sep 2026",
    day: "Friday",
    time: "8:00 PM",
    drawNumber: "DL-6823",
    ticket: "77C 34682",
    result: "win",
  },
  {
    no: 3,
    date: "24 Sep 2026",
    day: "Thursday",
    time: "8:00 PM",
    drawNumber: "DL-6822",
    ticket: "32B 90814",
    result: "win",
  },
  {
    no: 4,
    date: "23 Sep 2026",
    day: "Wednesday",
    time: "8:00 PM",
    drawNumber: "DL-6821",
    ticket: "19A 55237",
    result: "win",
  },
  {
    no: 5,
    date: "22 Sep 2026",
    day: "Tuesday",
    time: "8:00 PM",
    drawNumber: "DL-6820",
    ticket: "91D 44732",
    result: "win",
  },
];

const WINNING_RULES = [
  {
    no: 1,
    condition: "All digits/characters match",
    example: "10F68057",
    prize: "₹50 Lakh",
    total: "₹5 Crore",
    badge: "bg-[#ed1d43]",
    row: "bg-[#ffe4e8]",
  },
  {
    no: 2,
    condition: "Alphabet does not match but all remaining digits match",
    example: "11F68057",
    prize: "₹30 Lakh",
    total: "₹3 Crore",
    badge: "bg-[#2e7dd7]",
    row: "bg-[#e3f0ff]",
  },
  {
    no: 3,
    condition: "All numbers after the alphabet match",
    example: "99F68057",
    prize: "₹20,000",
    total: "₹2 Lakh",
    badge: "bg-[#f08a25]",
    row: "bg-[#ffefdc]",
  },
  {
    no: 4,
    condition: "Left-most 4 digits match",
    example: "10F6XXXX",
    prize: "₹20,000",
    total: "₹2 Lakh",
    badge: "bg-[#20a66a]",
    row: "bg-[#dcf8ea]",
  },
  {
    no: 5,
    condition: "Left-most 3 digits match",
    example: "10AXXXXX",
    prize: "₹900",
    total: "₹9,000",
    badge: "bg-[#8c4bd6]",
    row: "bg-[#f0e4ff]",
  },
];

const TICKET_TABS = [
  { key: "daily", label: "Daily Lottery", icon: Crown },
  { key: "festival", label: "Festival Lottery", icon: Gift },
];

// =====================================================
// MAIN PAGE
// =====================================================

const LeaderboardPage = () => {
  const [activeTab, setActiveTab] = useState("daily");

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#eef3fa] text-[#173e70]">
      <div className="mx-auto w-full max-w-[480px] pb-10">
        {/* =====================================================
            HERO  — Latest Result banner
        ===================================================== */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#2a0610] via-[#4a0b18] to-[#7a0f1e] px-3 pb-3 pt-20">
          <div className="pointer-events-none absolute -right-10 top-0 h-52 w-52 rounded-full bg-[#ff8a00]/25 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-[#ff1744]/20 blur-3xl" />

          <Sparkles
            size={16}
            className="pointer-events-none absolute left-[44%] top-3 text-[#ffcf4a]/80"
          />

          {/* title row */}
          <div className="relative flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ffd34e] text-[#173e70] shadow">
              <CalendarDays size={16} />
            </span>
            <h2 className="text-[13px] font-black tracking-wide text-white">
              LATEST RESULT
            </h2>
            <span className="ml-auto flex items-center gap-1 rounded-full bg-[#ed1d43] px-2 py-[3px] text-[8.5px] font-black text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white" /> LIVE
            </span>
          </div>

          <p className="relative mt-1 text-[9.5px] leading-tight text-white/75">
            Draw Date: 26 Sep 2026 (Saturday) · Draw Time: 8:00 PM
          </p>

          <div className="relative mt-2 grid grid-cols-[1fr_auto] items-center gap-2">
            <div className="min-w-0">
              <p className="font-serif text-[20px] font-black leading-[1] text-[#ffd34e] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                1st PRIZE
              </p>
              <p className="text-[26px] font-black leading-[1] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                ₹1 CRORE
              </p>
            </div>

            <span className="relative flex h-12 w-12 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-[#ffd34e]/30 blur-md" />
              <Trophy size={36} className="relative text-[#ffd34e]" fill="#ffd34e" />
            </span>
          </div>

          <div className="relative mt-2 flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-2 py-1.5">
            <span className="text-[9px] font-semibold text-white/80">
              Draw No:
            </span>
            <span className="rounded-md bg-white px-2 py-0.5 text-[13px] font-black tracking-wider text-[#d7193f]">
              10F 68057
            </span>
            <button className="ml-auto flex h-6 w-6 items-center justify-center rounded-md border border-white/30 text-white">
              <Download size={12} />
            </button>
          </div>
        </section>

        {/* =====================================================
            TICKET TABS  (Daily / Festival)
        ===================================================== */}
        <section className="relative z-10 -mt-1 px-2 pt-2">
          <div className="grid grid-cols-2 gap-1">
            {TICKET_TABS.map((t) => {
              const Icon = t.icon;
              const active = t.key === activeTab;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={`flex min-h-[46px] min-w-0 items-center justify-center gap-2 rounded-xl px-2 py-2 text-center shadow-md transition active:scale-95 ${
                    active
                      ? "bg-gradient-to-b from-[#ff1744] to-[#c9102f] text-white"
                      : "bg-[#fffaf4] text-[#173e70]"
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-[10.5px] font-extrabold leading-tight">
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <main className="space-y-3 px-2 pt-3">
          {/* =====================================================
              PRIZE TIERS  (5 tiles)
          ===================================================== */}
          <section className="grid grid-cols-5 gap-1">
            {PRIZE_TIERS.map((tier) => (
              <PrizeTile key={tier.rank} {...tier} />
            ))}
          </section>

          {/* =====================================================
              QUICK ACTION GRID (4 tiles)
          ===================================================== */}
          <section className="grid grid-cols-4 gap-2">
            <QuickAction
              icon={<Search size={20} />}
              title="Check Result"
              sub="Enter Ticket Number"
              tone="red"
            />
            <QuickAction
              icon={<BarChart3 size={20} />}
              title="All Draw Results"
              sub="View past results"
              tone="violet"
            />
            <QuickAction
              icon={<Trophy size={20} />}
              title="Prize Structure"
              sub="See winning rules"
              tone="green"
            />
            <QuickAction
              icon={<FileText size={20} />}
              title="Official PDF"
              sub="Download result"
              tone="orange"
            />
          </section>

          {/* =====================================================
              TOP WINNERS (₹1 Crore)
          ===================================================== */}
          <section className="rounded-[16px] bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Trophy size={22} className="shrink-0 text-[#d4a017]" />
                <h2 className="truncate text-[14.5px] font-extrabold text-[#173e70]">
                  Top Winners (₹1 Crore)
                </h2>
              </div>

              <button
                type="button"
                className="flex h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-[#c9d3e3] bg-white px-2 text-[9.5px] font-semibold text-[#173e70]"
              >
                View All Winners
                <ArrowRight size={11} />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-1.5">
              {TOP_WINNERS.map((w, i) => (
                <WinnerCard key={i} {...w} />
              ))}
            </div>
          </section>

          {/* =====================================================
              PAST DRAW RESULTS
          ===================================================== */}
          <section className="rounded-[16px] bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <CalendarDays size={20} className="shrink-0 text-[#173e70]" />
                <h2 className="truncate text-[14.5px] font-extrabold text-[#173e70]">
                  Past Draw Results
                </h2>
              </div>

              <button
                type="button"
                className="flex h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-[#c9d3e3] bg-white px-2 text-[9.5px] font-semibold text-[#173e70]"
              >
                View All Results
                <ArrowRight size={11} />
              </button>
            </div>

            <div className="mt-3 overflow-hidden rounded-lg">
              <table className="w-full table-fixed border-collapse text-left">
                <colgroup>
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "14%" }} />
                </colgroup>

                <thead>
                  <tr className="bg-[#173e70] text-white">
                    {["#", "Draw Date", "Day", "Draw Time", "Draw Number", "1st Prize Number", "Result"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-1 py-1.5 text-[7.5px] font-semibold leading-tight"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {PAST_DRAWS.map((d, i) => (
                    <tr
                      key={d.no}
                      className={`${i % 2 === 0 ? "bg-white" : "bg-[#f6f9fe]"} border-b border-[#e2e5f0]`}
                    >
                      <td className="px-1 py-2 text-[9px] font-black text-[#173e70]">
                        {d.no}
                      </td>
                      <td className="px-1 py-2 text-[8.5px] font-semibold text-[#173e70]">
                        {d.date}
                      </td>
                      <td className="px-1 py-2 text-[8px] text-[#4b5563]">
                        {d.day}
                      </td>
                      <td className="px-1 py-2 text-[8px] text-[#4b5563]">
                        {d.time}
                      </td>
                      <td className="px-1 py-2 text-[8.5px] font-mono font-bold text-[#173e70]">
                        {d.drawNumber}
                      </td>
                      <td className="px-1 py-2">
                        <span className="whitespace-nowrap rounded border border-[#e6c97c] bg-[#fffdf5] px-1 py-0.5 font-mono text-[8.5px] font-black tracking-wider text-[#d7193f]">
                          {d.ticket}
                        </span>
                      </td>
                      <td className="px-1 py-2">
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-[#dcf8ea] px-1.5 py-[2px] text-[8px] font-bold text-[#20a66a]">
                          <Award size={9} /> Win
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* =====================================================
              WINNING RULES  (dark, same as FestivalLottery)
          ===================================================== */}
          <section className="overflow-hidden rounded-[18px] bg-gradient-to-br from-[#3a0b17] via-[#2b0a16] to-[#1a0710] p-2.5 shadow-lg">
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex min-w-0 items-center gap-2">
                <BookOpen size={22} className="shrink-0 text-[#ffd34e]" />
                <h2 className="text-[12.5px] font-extrabold leading-tight text-white">
                  Winning Rules
                </h2>
              </div>

              <button
                type="button"
                className="flex h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-white/40 px-2 text-[9px] font-semibold text-white"
              >
                View Full Rules
                <ArrowRight size={11} />
              </button>
            </div>

            <p className="mt-2 px-1 text-[9px] leading-snug text-white/70">
              Match your ticket number with the draw number and see winning prizes.
            </p>

            <div className="mt-2 overflow-hidden rounded-lg">
              <table className="w-full table-fixed border-collapse text-left">
                <colgroup>
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "30%" }} />
                  <col style={{ width: "24%" }} />
                  <col style={{ width: "17%" }} />
                  <col style={{ width: "20%" }} />
                </colgroup>

                <thead>
                  <tr className="bg-[#1a0710] text-white">
                    {[
                      "#",
                      "Match Condition",
                      "Example (For 10F 68057)",
                      "Prize Per Ticket",
                      "Total Prize",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-1.5 py-2 text-[8px] font-semibold leading-tight"
                      >
                        {h}
                      </th>
                    ))}
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

          {/* =====================================================
              IMPORTANT INFO
          ===================================================== */}
          <section className="rounded-[16px] border border-[#bfe8d3] bg-[#e7f8ef] px-3 py-2">
            <div className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#14a06a] text-white">
                <Info size={13} />
              </span>
              <p className="text-[10px] leading-snug text-[#26354b]">
                All results are verified against official government lottery draw
                publications. Winners are listed as per the official release.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

// =====================================================
// SMALL COMPONENTS
// =====================================================

const PrizeTile = ({ rank, amount, ticket, tickets, tone = "red" }) => {
  const TONES = {
    red: {
      bg: "bg-gradient-to-b from-[#ff1744] to-[#c9102f]",
      text: "text-white",
      sub: "text-white/85",
      chip: "bg-white text-[#c9102f]",
      border: "border-[#ff3155]/40",
    },
    blue: {
      bg: "bg-gradient-to-b from-[#3a8bea] to-[#1b5cb8]",
      text: "text-white",
      sub: "text-white/85",
      chip: "bg-white text-[#1b5cb8]",
      border: "border-[#3a8bea]/40",
    },
    orange: {
      bg: "bg-gradient-to-b from-[#ffa940] to-[#d97a17]",
      text: "text-white",
      sub: "text-white/85",
      chip: "bg-white text-[#d97a17]",
      border: "border-[#ffa940]/40",
    },
    green: {
      bg: "bg-gradient-to-b from-[#3bc97a] to-[#1a8b4e]",
      text: "text-white",
      sub: "text-white/85",
      chip: "bg-white text-[#1a8b4e]",
      border: "border-[#3bc97a]/40",
    },
    violet: {
      bg: "bg-gradient-to-b from-[#a066e6] to-[#6b32b5]",
      text: "text-white",
      sub: "text-white/85",
      chip: "bg-white text-[#6b32b5]",
      border: "border-[#a066e6]/40",
    },
  };

  const c = TONES[tone] || TONES.red;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${c.border} ${c.bg} px-1 py-2 text-center shadow-md`}
    >
      <span className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-white">
        <Trophy size={11} />
      </span>
      <p className={`mt-0.5 text-[8px] font-black leading-tight ${c.text}`}>
        {rank}
      </p>
      <p className={`mt-0.5 text-[10.5px] font-black leading-tight ${c.text}`}>
        {amount}
      </p>
      <span
        className={`mt-1 inline-block rounded px-1 py-[1px] font-mono text-[7.5px] font-black leading-tight ${c.chip}`}
      >
        {ticket}
      </span>
      <p className={`mt-0.5 text-[7px] ${c.sub}`}>{tickets}</p>
    </div>
  );
};

const QuickAction = ({ icon, title, sub, tone = "red" }) => {
  const TONES = {
    red: "bg-[#ed1d43]",
    violet: "bg-[#8c4bd6]",
    green: "bg-[#20a66a]",
    orange: "bg-[#f08a25]",
  };

  return (
    <button
      type="button"
      className="flex flex-col items-center gap-1.5 rounded-[14px] border border-[#e2e5f0] bg-white p-2 text-center shadow-[0_4px_14px_rgba(15,28,77,0.06)] transition active:scale-[0.97]"
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl text-white ${TONES[tone]}`}
      >
        {icon}
      </span>
      <span className="text-[9px] font-extrabold leading-tight text-[#173e70]">
        {title}
      </span>
      <span className="text-[7.5px] leading-tight text-[#8a97ab]">{sub}</span>
    </button>
  );
};

const WinnerCard = ({ name, location, prize, ticket }) => (
  <div className="flex min-w-0 flex-col items-center rounded-xl border border-[#f1d9a0] bg-gradient-to-b from-[#fff0c9] to-[#fff8e8] px-1 py-2 text-center shadow-sm">
    {/* Avatar with crown */}
    <div className="relative">
      <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#d4a017] bg-[#fff5d1] text-[#a0561b]">
        <Users size={20} />
      </span>
      <Crown
        size={12}
        className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[#d4a017]"
        fill="#d4a017"
      />
    </div>

    <p className="mt-1 truncate text-[9.5px] font-black leading-tight text-[#173e70]">
      {name}
    </p>
    <p className="mt-0.5 truncate text-[7.5px] leading-tight text-[#4b5563]">
      {location}
    </p>

    <p className="mt-1 text-[10px] font-black leading-tight text-[#d7193f]">
      {prize}
    </p>
    <p className="text-[7px] leading-tight text-[#4b5563]">Ticket: {ticket}</p>
  </div>
);

const RuleRow = ({ no, condition, example, prize, total, badge, row }) => (
  <tr className={`${row} border-b border-white/60`}>
    <td className="px-1.5 py-2">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-black text-white ${badge}`}
      >
        {no}
      </span>
    </td>

    <td className="px-1.5 py-2 text-[8.5px] font-medium leading-tight text-[#26354b]">
      {condition}
    </td>

    <td className="px-1.5 py-2">
      <span className="whitespace-nowrap rounded border border-[#e6c97c] bg-[#fffdf5] px-1 py-0.5 font-mono text-[9px] font-black tracking-[0.5px] text-[#d7193f]">
        {example}
      </span>
    </td>

    <td className="px-1.5 py-2 text-[9.5px] font-bold text-[#173e70]">
      {prize}
    </td>

    <td className="px-1.5 py-2 text-[9.5px] font-black text-[#d7193f]">
      {total}
    </td>
  </tr>
);

export default LeaderboardPage;