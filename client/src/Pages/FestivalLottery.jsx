import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronDown,
  FileText,
  Flame,
  Flower2,
  Gift,
  Info,
  PartyPopper,
  Plus,
  ShieldCheck,
  Sparkles,
  Target,
  Ticket,
  Trash2,
  TreePine,
  Trophy,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// =====================================================
// CONSTANTS
// =====================================================

// ⚠️ Apne bottom navbar ki height (px) yahan daalo.
// Purchase bar isse ke upar baithega, navbar ke andar nahi jayega.
const BOTTOM_NAV_HEIGHT = 64;

// Purchase bar ki approx height
const PURCHASE_BAR_HEIGHT = 84;

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1605196560547-b2f7281b7355?auto=format&fit=crop&w=1400&q=80";

const EN_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const EN_DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const QUICK_OPTIONS = [10, 20, 30, 50, 100];

const MAX_TICKETS = 100;

const CHIP_COLORS = [
  { badge: "bg-[#ed1d43]", row: "bg-[#fff0f2]" },
  { badge: "bg-[#2e7dd7]", row: "bg-[#eef6ff]" },
  { badge: "bg-[#f08a25]", row: "bg-[#fff5ea]" },
  { badge: "bg-[#20a66a]", row: "bg-[#edfff6]" },
  { badge: "bg-[#8c4bd6]", row: "bg-[#f7efff]" },
  { badge: "bg-[#ff4d8d]", row: "bg-[#fff0f6]" },
  { badge: "bg-[#14a3a3]", row: "bg-[#e9fbfb]" },
  { badge: "bg-[#e0a800]", row: "bg-[#fff9e3]" },
  { badge: "bg-[#5b5fe0]", row: "bg-[#eeefff]" },
  { badge: "bg-[#a0561b]", row: "bg-[#fff1e8]" },
];

const FESTIVALS = [
  {
    key: "navratra",
    tab: "Navratra",
    icon: Flame,
    name: "Navratra",
    special: "Navratra Special",
    desc: "Play & celebrate this Navratra with bigger prizes and more happiness!",
    price: 50,
    drawTime: "9:00 PM",
  },
  {
    key: "diwali",
    tab: "Diwali",
    icon: Sparkles,
    name: "Diwali",
    special: "Diwali Special",
    desc: "Light up your Diwali with mega prizes and endless happiness!",
    price: 50,
    drawTime: "9:00 PM",
  },
  {
    key: "dussehra",
    tab: "Dussehra",
    icon: Target,
    name: "Dussehra",
    special: "Dussehra Special",
    desc: "Victory of good over evil, celebrate with a chance to win big!",
    price: 50,
    drawTime: "9:00 PM",
  },
  {
    key: "newyear",
    tab: "New Year",
    icon: PartyPopper,
    name: "New Year",
    special: "New Year Special",
    desc: "Start the new year with a lucky ticket and bigger dreams!",
    price: 50,
    drawTime: "9:00 PM",
  },
  {
    key: "christmas",
    tab: "Christmas",
    icon: TreePine,
    name: "Christmas",
    special: "Christmas Special",
    desc: "Unwrap the joy of Christmas with exciting festive prizes!",
    price: 50,
    drawTime: "9:00 PM",
  },
  {
    key: "holi",
    tab: "Holi",
    icon: Flower2,
    name: "Holi",
    special: "Holi Special",
    desc: "Add colors to your luck this Holi with rainbow-sized prizes!",
    price: 50,
    drawTime: "9:00 PM",
  },
];

// =====================================================
// TICKET HELPERS
// =====================================================

const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

const randomTicketNumber = () => {
  const d = () => String(Math.floor(Math.random() * 10));
  const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  return `${d()}${d()}${letter} ${d()}${d()}${d()}${d()}${d()}`;
};

const generateUniqueTickets = (count, existing = []) => {
  const used = new Set(existing.map((t) => t.number));
  const result = [];

  while (result.length < count) {
    const number = randomTicketNumber();
    if (used.has(number)) continue;
    used.add(number);
    result.push({ id: `${Date.now()}-${Math.random()}`, number });
  }

  return result;
};

// =====================================================
// COMPONENT
// =====================================================

const FestivalLottery = () => {
  const navigate = useNavigate();

  const [festivalKey, setFestivalKey] = useState("navratra");
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [showQuick, setShowQuick] = useState(true);
  const [tickets, setTickets] = useState(() => generateUniqueTickets(10));

  const festival =
    FESTIVALS.find((f) => f.key === festivalKey) || FESTIVALS[0];

  const price = festival.price;
  const totalTickets = tickets.length;
  const totalAmount = price * totalTickets;

  // ---------------------------------------------------
  // DATES
  // ---------------------------------------------------

  const dateOptions = useMemo(() => {
    const today = new Date();

    return Array.from({ length: 8 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      return {
        day: d.getDate(),
        month: EN_MONTHS[d.getMonth()],
        year: d.getFullYear(),
        weekday: EN_DAYS[d.getDay()],
      };
    });
  }, []);

  const selectedDate = dateOptions[selectedDateIndex] || dateOptions[0];

  const summaryDate = `${String(selectedDate.day).padStart(2, "0")} ${
    selectedDate.month
  } ${selectedDate.year}`;

  // ---------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------

  const setQuantity = (next) => {
    const quantity = Math.min(Math.max(next, 1), MAX_TICKETS);

    setTickets((prev) => {
      if (quantity === prev.length) return prev;
      if (quantity < prev.length) return prev.slice(0, quantity);
      return [...prev, ...generateUniqueTickets(quantity - prev.length, prev)];
    });
  };

  const handleClear = () => setTickets(generateUniqueTickets(1));

  const handlePurchase = () => {
    // TODO: yahan apni purchase API / redux dispatch laga lena
    // payload: festival.key, selectedDate, tickets (number), price
    console.log("FESTIVAL PURCHASE", {
      festival: festival.key,
      date: summaryDate,
      price,
      tickets: tickets.map((t) => t.number),
      totalAmount,
    });
    navigate("/buy-ticket");
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#eef3fa] text-[#173e70]">
      <div
        className="relative mx-auto w-full max-w-[480px] overflow-x-hidden"
        style={{ paddingBottom: BOTTOM_NAV_HEIGHT + PURCHASE_BAR_HEIGHT + 16 }}
      >
        {/* =====================================================
            HERO
        ===================================================== */}
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

          <div className="relative grid grid-cols-[1.05fr_1fr] items-center gap-2 px-3 pb-14 pt-5">
            {/* text */}
            <div className="relative z-10 min-w-0">
              <h1 className="font-serif font-black leading-[0.9] tracking-tight">
                <span className="block bg-gradient-to-b from-[#fff1a8] to-[#e0a11b] bg-clip-text text-[42px] text-transparent">
                  Festival
                </span>
                <span className="block bg-gradient-to-b from-[#fff1a8] to-[#e0a11b] bg-clip-text text-[46px] text-transparent">
                  Lottery
                </span>
              </h1>

              <p className="mt-2 text-[11px] font-medium leading-tight text-white">
                Bigger Draws, Bigger Celebrations
              </p>

              <div className="mt-3 grid grid-cols-4 gap-1">
                <HeroFeature icon={<Gift size={20} />} text="Mega Prizes" />
                <HeroFeature icon={<ShieldCheck size={20} />} text="Special Draws" />
                <HeroFeature icon={<Trophy size={20} />} text="Limited Period" />
                <HeroFeature icon={<Users size={20} />} text="More Chances" />
              </div>
            </div>

            {/* ticket */}
            <div className="relative flex items-center justify-center">
              <FestivalHeroTicket
                special={festival.special}
                price={price}
                number="10F 68057"
              />
            </div>
          </div>
        </section>

        {/* =====================================================
            FESTIVAL TABS
        ===================================================== */}
        <section className="relative z-10 -mt-10 px-2">
          <div className="grid grid-cols-6 gap-1">
            {FESTIVALS.map((f) => {
              const Icon = f.icon;
              const active = f.key === festivalKey;

              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFestivalKey(f.key)}
                  className={`flex min-h-[72px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-2 text-center shadow-md transition active:scale-95 ${
                    active
                      ? "bg-gradient-to-b from-[#ff1744] to-[#c9102f] text-white"
                      : "bg-[#fffaf4] text-[#173e70]"
                  }`}
                >
                  <Icon size={22} />
                  <span className="text-[9.5px] font-bold leading-tight">
                    {f.tab}
                    <br />
                    Lottery
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <main className="space-y-3 px-2 pt-3">
          {/* =====================================================
              FESTIVAL INFO CARD
          ===================================================== */}
          <section className="relative overflow-hidden rounded-[16px] border border-[#f1d9a0] bg-gradient-to-r from-[#fff0c9] via-[#fff8e8] to-[#ffe7b8] p-3 shadow-sm">
            <div className="grid grid-cols-[auto_1fr] items-center gap-3">
              <MiniTicket
                className="w-[104px]"
                title={`${festival.name.toUpperCase()} LOTTERY`}
                price={price}
              />

              <div className="min-w-0">
                <h3 className="font-serif text-[16px] font-black leading-tight text-[#173e70]">
                  {festival.name} Festival Lottery
                </h3>

                <p className="mt-0.5 text-[10px] leading-snug text-[#4b5563]">
                  {festival.desc}
                </p>

                <div className="mt-2 grid grid-cols-3 gap-1">
                  <InfoMini
                    icon={<Trophy size={20} />}
                    title="₹5 Crore"
                    sub="First Prize"
                  />
                  <InfoMini
                    icon={<Users size={20} />}
                    title="10 Tickets"
                    sub="Per Draw"
                  />
                  <InfoMini
                    icon={<CalendarDays size={20} />}
                    title="Special Draw"
                    sub={festival.drawTime}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* =====================================================
              SELECT DRAW DATE
          ===================================================== */}
          <section className="rounded-[16px] bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalendarDays size={24} className="text-[#173e70]" />
                <h2 className="text-[16px] font-extrabold text-[#173e70]">
                  Select Draw Date
                </h2>
              </div>

              <button
                type="button"
                className="flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-[#c9d3e3] bg-white px-2.5 text-[10px] font-semibold text-[#173e70]"
              >
                View Full Schedule
                <ArrowRight size={12} />
              </button>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {dateOptions.map((d, index) => {
                const active = index === selectedDateIndex;

                return (
                  <button
                    key={`${d.day}-${d.month}`}
                    type="button"
                    onClick={() => setSelectedDateIndex(index)}
                    className={`relative flex h-[66px] w-[64px] shrink-0 flex-col items-center justify-center rounded-xl border text-center transition active:scale-95 ${
                      active
                        ? "border-2 border-[#ed1d43] bg-[#fff0f2]"
                        : "border-transparent bg-[#e3e9f3]"
                    }`}
                  >
                    {index === 0 && (
                      <span className="text-[10px] font-semibold text-[#ed1d43]">
                        Today
                      </span>
                    )}

                    <span
                      className={`text-[13px] font-extrabold ${
                        active ? "text-[#ed1d43]" : "text-[#26354b]"
                      }`}
                    >
                      {d.day} {d.month}
                    </span>

                    <span
                      className={`text-[10px] ${
                        active ? "text-[#ed1d43]" : "text-[#6b7280]"
                      }`}
                    >
                      {d.weekday}
                    </span>

                    <span
                      className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${
                        active ? "bg-[#ed1d43]" : "bg-[#20a66a]"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </section>

          {/* =====================================================
              HOW MANY TICKETS
          ===================================================== */}
          <section className="rounded-[16px] bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket
                  size={26}
                  className="-rotate-[30deg] text-[#173e70]"
                  fill="#173e70"
                />
                <h2 className="text-[16px] font-extrabold text-[#173e70]">
                  How Many Tickets?
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuick((v) => !v)}
                  className="h-8 whitespace-nowrap rounded-lg border border-[#c9d3e3] bg-white px-3 text-[11px] font-semibold text-[#173e70]"
                >
                  Quick Select
                </button>

                <button
                  type="button"
                  onClick={() => setShowQuick((v) => !v)}
                  aria-label="Toggle quick select"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef3fa] text-[#173e70]"
                >
                  <ChevronDown
                    size={18}
                    className={`transition ${showQuick ? "rotate-180" : ""}`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-[auto_1fr] gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-[#dfe5f0] bg-white px-2 py-2 shadow-sm">
                <button
                  type="button"
                  onClick={() => setQuantity(totalTickets - 1)}
                  disabled={totalTickets <= 1}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9eef7] text-[22px] font-bold text-[#173e70] disabled:opacity-50"
                >
                  −
                </button>

                <span className="min-w-[30px] text-center text-[24px] font-black text-[#173e70]">
                  {totalTickets}
                </span>

                <button
                  type="button"
                  onClick={() => setQuantity(totalTickets + 1)}
                  disabled={totalTickets >= MAX_TICKETS}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9eef7] text-[22px] font-bold text-[#173e70] disabled:opacity-50"
                >
                  +
                </button>
              </div>

              <div className="grid min-w-0 grid-cols-[1fr_auto_1fr_auto_1.2fr] items-center gap-1 rounded-xl bg-[#f3f6fb] px-2 py-2 text-center">
                <div className="min-w-0">
                  <p className="text-[9px] text-[#4b5563]">Ticket Price</p>
                  <p className="text-[14px] font-black text-[#d7193f]">
                    ₹{price}/-
                  </p>
                </div>

                <span className="text-[15px] text-[#9aa5b8]">×</span>

                <div className="min-w-0">
                  <p className="text-[9px] text-[#4b5563]">Total Tickets</p>
                  <p className="text-[14px] font-black text-[#d7193f]">
                    {totalTickets}
                  </p>
                </div>

                <span className="text-[15px] text-[#9aa5b8]">=</span>

                <div className="min-w-0">
                  <p className="text-[9px] text-[#4b5563]">Total Amount</p>
                  <p className="truncate text-[14px] font-black text-[#14a06a]">
                    ₹{totalAmount.toLocaleString("en-IN")}/-
                  </p>
                </div>
              </div>
            </div>

            {showQuick && (
              <div className="mt-3 grid grid-cols-5 gap-1.5">
                {QUICK_OPTIONS.map((count) => {
                  const active = totalTickets === count;

                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setQuantity(count)}
                      className={`relative min-w-0 rounded-lg border px-0.5 py-2 text-center transition active:scale-95 ${
                        active
                          ? "border-2 border-[#ed1d43] bg-[#fff0f2]"
                          : "border-[#dfe5f0] bg-white"
                      }`}
                    >
                      <p
                        className={`whitespace-nowrap text-[9.5px] font-semibold ${
                          active ? "text-[#ed1d43]" : "text-[#26354b]"
                        }`}
                      >
                        {count} Tickets
                      </p>
                      <p
                        className={`whitespace-nowrap text-[12px] font-black ${
                          active ? "text-[#ed1d43]" : "text-[#173e70]"
                        }`}
                      >
                        ₹{(price * count).toLocaleString("en-IN")}
                      </p>

                      {active && (
                        <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-[#ed1d43]" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* =====================================================
              SELECTED TICKETS
          ===================================================== */}
          <section className="rounded-[16px] bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <FileText size={22} className="shrink-0 text-[#173e70]" />
                <h2 className="truncate text-[15px] font-extrabold text-[#173e70]">
                  Selected Tickets ({totalTickets})
                </h2>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setQuantity(totalTickets + 1)}
                  disabled={totalTickets >= MAX_TICKETS}
                  className="flex h-8 items-center gap-1 whitespace-nowrap rounded-lg border border-[#ed1d43] bg-white px-2 text-[11px] font-bold text-[#ed1d43] disabled:opacity-50"
                >
                  Add More
                  <Plus size={13} />
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  className="flex h-8 items-center gap-1 px-1 text-[11px] font-semibold text-[#173e70]"
                >
                  <Trash2 size={14} />
                  Clear
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {tickets.map((ticket, index) => {
                const color = CHIP_COLORS[index % CHIP_COLORS.length];

                return (
                  <div
                    key={ticket.id}
                    className={`flex min-w-0 items-center gap-2 rounded-lg border border-white/70 px-2 py-2 shadow-sm ${color.row}`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-black text-white ${color.badge}`}
                    >
                      {index + 1}
                    </span>

                    <span className="truncate text-[13px] font-bold tracking-wide text-[#26354b]">
                      {ticket.number}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#bfe8d3] bg-[#e7f8ef] px-3 py-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#14a06a] text-white">
                <Info size={13} />
              </span>

              <p className="text-[10px] leading-snug text-[#26354b]">
                {totalTickets} unique tickets will be generated for the selected
                draw date. Each ticket costs ₹{price}.
              </p>
            </div>
          </section>

          {/* =====================================================
              WINNING RULES
          ===================================================== */}
          <section className="overflow-hidden rounded-[18px] bg-gradient-to-br from-[#3a0b17] via-[#2b0a16] to-[#1a0710] p-2.5 shadow-lg">
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex min-w-0 items-center gap-2">
                <BookOpen size={24} className="shrink-0 text-[#ffd34e]" />
                <h2 className="text-[12.5px] font-extrabold leading-tight text-white">
                  {festival.name} Festival Lottery Winning Rules
                </h2>
              </div>

              <button
                type="button"
                className="flex h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-white/40 px-2 text-[9px] font-semibold text-white"
              >
                View Official Terms
                <ArrowRight size={11} />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-[1fr_1.05fr] gap-2">
              <div className="flex min-w-0 items-center justify-between gap-1.5 rounded-xl border border-white/15 bg-white/5 px-2 py-2">
                <span className="text-[9.5px] font-medium leading-tight text-white">
                  Example Winning Number:
                </span>

                <span className="whitespace-nowrap rounded-md bg-white px-2 py-1 text-[15px] font-black tracking-wider text-[#d7193f]">
                  10F <span className="text-[#173e70]">68057</span>
                </span>
              </div>

              <div className="flex min-w-0 items-center gap-1.5 rounded-xl border border-[#ffd34e]/30 bg-white/5 px-2 py-2">
                <Trophy
                  size={30}
                  className="shrink-0 text-[#ffd34e]"
                  fill="#ffd34e"
                />

                <div className="min-w-0">
                  <p className="text-[8px] text-white/80">Total First Prize</p>
                  <p className="whitespace-nowrap text-[18px] font-black leading-none text-[#ffd34e]">
                    ₹5 CRORE
                  </p>
                  <p className="mt-0.5 whitespace-nowrap text-[7px] text-white/75">
                    (10 Tickets × ₹50 Lakh)
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 overflow-hidden rounded-lg">
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
                      "Total Prize (10 Tickets)",
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
                  <RuleRow
                    number="1"
                    condition="All digits/characters match"
                    example="10F 68057"
                    prize="₹50 Lakh"
                    total="₹5 Crore"
                    badge="bg-[#ed1d43]"
                    row="bg-[#ffe4e8]"
                  />
                  <RuleRow
                    number="2"
                    condition="Alphabet does not match but all remaining digits match"
                    example="11F 68057"
                    prize="₹30 Lakh"
                    total="₹3 Crore"
                    badge="bg-[#2e7dd7]"
                    row="bg-[#e3f0ff]"
                  />
                  <RuleRow
                    number="3"
                    condition="All numbers after the alphabet match"
                    example="99F 68057"
                    prize="₹20,000"
                    total="₹2 Lakh"
                    badge="bg-[#f08a25]"
                    row="bg-[#ffefdc]"
                  />
                  <RuleRow
                    number="4"
                    condition="Left-most 4 digits match"
                    example="10F6 1234"
                    prize="₹20,000"
                    total="₹2 Lakh"
                    badge="bg-[#20a66a]"
                    row="bg-[#dcf8ea]"
                  />
                  <RuleRow
                    number="5"
                    condition="Left-most 3 digits match"
                    example="10A 1234"
                    prize="₹900"
                    total="₹9,000"
                    badge="bg-[#8c4bd6]"
                    row="bg-[#f0e4ff]"
                  />
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* =====================================================
          BOTTOM PURCHASE BAR
          (navbar ke upar + app width ke andar)
      ===================================================== */}
      <div
        className="fixed left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 overflow-hidden border-t border-[#ff3155]/20 bg-gradient-to-b from-[#2b0a16] to-[#160610] shadow-[0_-10px_30px_rgba(0,0,0,0.4)]"
        style={{ bottom: BOTTOM_NAV_HEIGHT }}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_150px] items-center gap-2 px-3 py-3">
          {/* PRICE */}
          <div className="min-w-0">
            <p className="text-[11px] font-medium leading-none text-white/90">
              Total Amount
            </p>

            <div className="mt-1 flex items-end gap-1.5">
              <span className="shrink-0 whitespace-nowrap text-[24px] font-black leading-none text-[#2ee59d]">
                ₹{totalAmount.toLocaleString("en-IN")}/-
              </span>

              <span className="min-w-0 pb-0.5 text-[8.5px] leading-tight text-white/70">
                {totalTickets} Tickets • {summaryDate}
                <br />
                {festival.name} Lottery
              </span>
            </div>
          </div>

          {/* BUTTON */}
          <button
            type="button"
            onClick={handlePurchase}
            className="flex h-[50px] w-full min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-r from-[#ff1744] to-[#e0102f] px-2 text-[14px] font-extrabold text-white shadow-[0_8px_25px_rgba(255,20,67,0.45)] transition active:scale-[0.98]"
          >
            Purchase Now
            <ArrowRight size={18} className="shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// SMALL COMPONENTS
// =====================================================

const HeroFeature = ({ icon, text }) => (
  <div className="flex min-w-0 flex-col items-center gap-1 text-center">
    <span className="text-[#ffd34e]">{icon}</span>
    <span className="text-[8px] font-medium leading-tight text-white/90">
      {text}
    </span>
  </div>
);

const FestivalHeroTicket = ({ special, price, number }) => (
  <div className="relative w-full max-w-[230px]">
    {/* back paper */}
    <div className="absolute inset-0 -rotate-[5deg] rounded-lg border border-[#e5c8a4] bg-[#fdf1dc]" />

    <div
      className="relative rotate-[2deg] rounded-lg border-[0.3em] border-[#f7d9a8] bg-[#fffaf0] p-[0.7em] shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
      style={{ fontSize: "11px" }}
    >
      <div className="flex items-start justify-between gap-[0.4em]">
        <div className="min-w-0">
          <p className="text-[1.8em] font-black leading-none text-[#d7193f]">
            DEAR
          </p>
          <p className="text-[0.7em] font-bold text-[#153c78]">
            FESTIVAL LOTTERY
          </p>
          <p className="mt-[0.2em] font-serif text-[1.15em] font-black leading-tight text-[#d7193f]">
            {special}
          </p>
        </div>

        <div className="flex h-[3.4em] w-[3.4em] shrink-0 flex-col items-center justify-center rounded-full bg-[#d7198c] text-center text-[0.65em] font-black leading-tight text-white">
          Price
          <span className="text-[1.4em]">₹{price}/-</span>
        </div>
      </div>

      <p className="mt-[0.4em] text-[0.8em] font-bold text-[#26354b]">
        First Prize
      </p>

      <p className="whitespace-nowrap text-[2.7em] font-black leading-none text-[#153c78]">
        ₹5 CRORE
      </p>

      <div className="mt-[0.5em] border-y border-[#d7bba5] py-[0.3em] text-center">
        <p className="text-[0.55em] font-bold text-[#26354b]">Ticket Number</p>
        <p className="whitespace-nowrap text-[1.4em] font-black tracking-[0.15em] text-[#173e70]">
          {number}
        </p>
      </div>
    </div>
  </div>
);

const MiniTicket = ({ className = "", title, price }) => (
  <div className={`relative ${className}`}>
    <div className="absolute inset-0 -rotate-[8deg] rounded-md border border-[#e5c8a4] bg-[#fdf1dc]" />

    <div
      className="relative -rotate-[3deg] rounded-md border-[3px] border-[#f2d1b8] bg-[#fffaf0] p-[0.45em] shadow-lg"
      style={{ fontSize: "10px" }}
    >
      <div className="flex items-start justify-between">
        <p className="text-[1.9em] font-black leading-none text-[#d7193f]">
          DEAR
        </p>

        <div className="flex h-[2.6em] w-[2.6em] flex-col items-center justify-center rounded-full bg-[#d7198c] text-center text-[0.5em] font-black leading-tight text-white">
          Price
          <span className="text-[1.3em]">₹{price}/-</span>
        </div>
      </div>

      <p className="truncate text-[0.6em] font-bold text-[#153c78]">{title}</p>
      <p className="text-[0.55em] font-bold text-[#d7193f]">First Prize</p>
      <p className="whitespace-nowrap text-[1.6em] font-black leading-none text-[#153c78]">
        ₹5 CRORE
      </p>
    </div>
  </div>
);

const InfoMini = ({ icon, title, sub }) => (
  <div className="flex min-w-0 flex-col items-center gap-0.5 text-center">
    <span className="shrink-0 text-[#8a4b12]">{icon}</span>

    <div className="w-full min-w-0">
      <p className="truncate text-[10.5px] font-bold leading-tight text-[#173e70]">
        {title}
      </p>
      <p className="truncate text-[8px] leading-tight text-[#4b5563]">{sub}</p>
    </div>
  </div>
);

const RuleRow = ({ number, condition, example, prize, total, badge, row }) => (
  <tr className={`${row} border-b border-white/60`}>
    <td className="px-1.5 py-2">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-black text-white ${badge}`}
      >
        {number}
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

export default FestivalLottery;