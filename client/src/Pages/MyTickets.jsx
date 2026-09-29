import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  Crown,
  Ticket,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  clearLotteryConfigError,
  getMyLotteryEntries,
} from "../reducer/slice/createLotteryConfigSlice";

// =====================================================
// HINDI MONTHS
// =====================================================

const MONTH_NAMES_HI = [
  "जनवरी",
  "फरवरी",
  "मार्च",
  "अप्रैल",
  "मई",
  "जून",
  "जुलाई",
  "अगस्त",
  "सितंबर",
  "अक्टूबर",
  "नवंबर",
  "दिसंबर",
];

// =====================================================
// IST DATE FORMATTER
// =====================================================

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("hi-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

// =====================================================
// IST TIME FORMATTER
// =====================================================

const formatTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString("hi-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// =====================================================
// AMOUNT FORMATTER
// =====================================================

const formatAmount = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "₹0";
  }

  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

// =====================================================
// DRAW DATE
//
// API structure:
// {
//   "drawDate": "2026-10-11T00:00:00.000Z",
//   "month": 10,
//   "year": 2026
// }
// =====================================================

const formatDrawDate = (item) => {
  // Priority 1: drawDate ISO string
  const drawDateValue = item?.drawDate;

  if (drawDateValue) {
    const date = new Date(drawDateValue);

    if (!Number.isNaN(date.getTime())) {
      const day = date.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
      });

      const month = date.toLocaleDateString("hi-IN", {
        timeZone: "Asia/Kolkata",
        month: "long",
      });

      const year = date.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
      });

      return { day, month, year };
    }
  }

  // Fallback: month + year from API
  const m = item?.month;
  const y = item?.year;

  if (m && y) {
    return {
      day: "—",
      month: MONTH_NAMES_HI[Number(m) - 1] || "",
      year: String(y),
    };
  }

  return { day: "—", month: "", year: "" };
};

// =====================================================
// STATUS NORMALIZER
// =====================================================

const normalizeStatus = (status) => {
  const value = String(status || "").toLowerCase().trim();

  if (value === "win" || value === "winner" || value === "won") {
    return "active";
  }

  if (value === "lost" || value === "loss") {
    return "lost";
  }

  return "pending";
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const MyTickets = () => {
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState("all");

  // ===================================================
  // REDUX
  // ===================================================

  const {
    myEntries = [],
    totalEntries = 0,
    myEntriesLoading = false,
    error = null,
    activeConfig = null,
  } = useSelector((state) => state.createLotteryConfig || {});

  // ===================================================
  // FETCH MY TICKETS
  // ===================================================

  useEffect(() => {
    dispatch(getMyLotteryEntries());

    return () => {
      dispatch(clearLotteryConfigError());
    };
  }, [dispatch]);

  // ===================================================
  // MARKET NAME
  // ===================================================

  const marketName = useMemo(() => {
    const name =
      activeConfig?.marketName ||
      myEntries?.[0]?.marketName ||
      myEntries?.[0]?.entry?.marketName ||
      "Market";

    return String(name)
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }, [activeConfig, myEntries]);

  // ===================================================
  // NORMALIZE TICKETS
  // ===================================================

  const tickets = useMemo(() => {
    const entries = Array.isArray(myEntries) ? myEntries : [];

    return entries.map((item, index) => {
      // =================================================
      // API ENTRY
      // =================================================

      const entry = item?.entry || item;

      // =================================================
      // NUMBER
      // =================================================

      const number = String(entry?.number ?? "").padStart(6, "0");

      // =================================================
      // STATUS
      // =================================================

      const status = normalizeStatus(entry?.status);

      // =================================================
      // TICKET ID
      // =================================================

      const id =
        item?.entryId ||
        entry?._id ||
        entry?.id ||
        `ticket-${index}`;

      // =================================================
      // DRAW DATE (from item.drawDate)
      // =================================================

      const drawDate = formatDrawDate(item);

      // =================================================
      // PRIZES (from item.prizes — the configured prize)
      // =================================================

      const prizes = item?.prizes || {};

      // =================================================
      // PURCHASE DATE (from entry.createdAt)
      // =================================================

      const purchaseDate = formatDate(entry?.createdAt);
      const purchaseTime = formatTime(entry?.createdAt);

      // =================================================
      // FINAL TICKET OBJECT
      // =================================================

      return {
        id,
        number: number.slice(0, 6).split(""),
        status,
        statusText:
          status === "active"
            ? "विजेता"
            : status === "lost"
              ? "हार गया"
              : "पेंडिंग",
        drawDate,
        price: formatAmount(entry?.amount),
        purchaseDate,
        purchaseTime,
        message:
          status === "active"
            ? "बधाई हो! आपका टिकट विजेता है"
            : status === "lost"
              ? "अगली बार किस्मत आजमाएं"
              : "भाग्य का नया अवसर",
        prizes: {
          first: Number(prizes?.first) || 0,
          second: Number(prizes?.second) || 0,
          third: Number(prizes?.third) || 0,
        },
      };
    });
  }, [myEntries]);

  // ===================================================
  // TABS
  // ===================================================

  const tabs = [
    { key: "all", label: "सभी", count: tickets.length },
    {
      key: "pending",
      label: "पेंडिंग",
      count: tickets.filter((t) => t.status === "pending").length,
    },
    {
      key: "active",
      label: "विजेता",
      count: tickets.filter((t) => t.status === "active").length,
    },
    {
      key: "lost",
      label: "हार गए",
      count: tickets.filter((t) => t.status === "lost").length,
    },
  ];

  // ===================================================
  // FILTER
  // ===================================================

  const filteredTickets =
    activeTab === "all"
      ? tickets
      : tickets.filter((t) => t.status === activeTab);

  // ===================================================
  // COPY TICKET ID
  // ===================================================

  const copyId = async (id) => {
    try {
      await navigator.clipboard.writeText(id);
    } catch {}
  };

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="w-full bg-[#030404] text-white">
      <main className="w-full max-w-[680px] mx-auto px-[12px] sm:px-[18px] pt-[22px] pb-[35px]">
        {/* HEADER */}
        <div className="relative flex items-center justify-between gap-[10px]">
          <div className="flex items-center gap-[10px] min-w-0">
            <Ticket
              size={42}
              strokeWidth={1.8}
              className="text-[#f5c542] rotate-[-18deg] drop-shadow-[0_0_10px_rgba(245,197,66,0.35)] shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-[25px] sm:text-[30px] leading-none font-extrabold tracking-tight">
                मेरे टिकट
              </h1>
              <p className="mt-[5px] text-[13px] leading-[1.15] text-[#d1d1d1]">
                आपके द्वारा खरीदे गए सभी टिकट यहाँ दिखेंगे
              </p>
            </div>
          </div>

          <button
            type="button"
            className="shrink-0 w-[112px] sm:w-[135px] h-[45px] rounded-[11px] border border-[#a38b35] bg-[#080a09] px-[11px] flex items-center justify-between text-white"
          >
            <span className="text-[13px] font-medium">सभी टिकट</span>
            <ChevronDown size={19} strokeWidth={2.3} />
          </button>
        </div>

        {/* TABS */}
        <div className="grid grid-cols-4 gap-[6px] mt-[22px]">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`h-[47px] rounded-[10px] border flex items-center justify-center whitespace-nowrap transition-all ${
                  active
                    ? "border-[#ffe27a] text-black font-extrabold bg-gradient-to-b from-[#ffe77b] via-[#f5c542] to-[#e9b528] shadow-[0_3px_12px_rgba(245,197,66,0.22)]"
                    : "border-[#353938] bg-[#101212] text-[#eeeeee] font-semibold"
                }`}
              >
                <span className="text-[12px] sm:text-[14px]">
                  {tab.label} ({tab.count})
                </span>
              </button>
            );
          })}
        </div>

        {/* LOADING */}
        {myEntriesLoading ? (
          <div className="h-[160px] rounded-[16px] border border-[#282b29] bg-[#090b0b] flex flex-col items-center justify-center">
            <Ticket size={40} className="text-[#f5c542] animate-pulse" />
            <p className="mt-3 text-[13px] text-white/60">
              आपके टिकट लोड हो रहे हैं...
            </p>
          </div>
        ) : error && !tickets.length ? (
          <div className="h-[160px] rounded-[16px] border border-red-500/30 bg-[#090b0b] flex flex-col items-center justify-center px-4 text-center">
            <p className="text-[13px] text-red-300">{error}</p>
          </div>
        ) : null}

        {/* TICKETS */}
        <div className="mt-[25px] space-y-[22px]">
          {filteredTickets.length ? (
            filteredTickets.map((ticket) => (
              <LotteryTicket
                key={ticket.id}
                ticket={ticket}
                copyId={copyId}
                marketName={marketName}
              />
            ))
          ) : (
            <div className="h-[160px] rounded-[16px] border border-[#282b29] bg-[#090b0b] flex flex-col items-center justify-center">
              <Ticket size={40} className="text-[#f5c542]" />
              <p className="mt-3 text-[13px] text-white/60">
                इस श्रेणी में कोई टिकट नहीं है
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// =====================================================
// LOTTERY TICKET
// =====================================================

const LotteryTicket = ({ ticket, copyId, marketName }) => {
  const pending = ticket.status === "pending";

  return (
    <div className="relative w-full h-[236px] rounded-[15px] overflow-hidden bg-[#f4dda0] shadow-[0_5px_22px_rgba(0,0,0,0.4)]">
      {/* BORDER */}
      <div className="absolute inset-[4px] rounded-[12px] border border-[#f1d276]/70 pointer-events-none z-[30]" />

      {/* LEFT */}
      <div className="absolute left-0 top-0 bottom-0 w-[24%] flex flex-col items-center text-center px-[6px] py-[17px] overflow-hidden bg-gradient-to-b from-[#d82b2d] via-[#b8171b] to-[#820b10] border-r border-[#e4b844]">
        <Crown
          size={43}
          strokeWidth={1.5}
          fill="#f7d24d"
          className="text-[#f7d24d] drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]"
        />
        <h2 className="mt-[6px] text-[17px] leading-none font-extrabold text-white">
          {marketName}
        </h2>
        <h2 className="mt-[3px] text-[17px] leading-none font-extrabold text-white">
          Ticket
        </h2>
        <div className="w-[65%] h-px bg-[#f5c542]/60 mt-[15px]" />
        <p className="mt-[16px] text-[11px] leading-[1.35] font-semibold text-white">
          {ticket.message}
        </p>
        <div className="mt-auto">
          <svg
            width="38"
            height="34"
            viewBox="0 0 52 45"
            fill="none"
            stroke="#f7d24d"
            strokeWidth="2"
          >
            <path d="M26 42C17 36 16 29 26 21C36 29 35 36 26 42Z" />
            <path d="M26 41C17 38 8 31 10 23C18 25 24 31 26 41Z" />
            <path d="M26 41C35 38 44 31 42 23C34 25 28 31 26 41Z" />
            <path d="M26 37C22 28 23 19 26 11C29 19 30 28 26 37Z" />
          </svg>
        </div>
        <p className="mt-[3px] text-[10px] font-semibold text-white">
          खेलो विश्वास
        </p>
        <p className="text-[10px] font-semibold text-white">के साथ</p>
      </div>

      {/* CENTER */}
      <div className="absolute left-[24%] right-[24%] top-0 bottom-0 px-[8px] py-[13px] text-[#19140c] bg-gradient-to-b from-[#fff1c4] via-[#f8e4ad] to-[#efd394]">
        <div className="flex items-center justify-center gap-[4px]">
          <span className="text-[#c49a3d] text-[10px]">❧</span>
          <div className="px-[8px] py-[4px] rounded-full border border-[#d1ad55] bg-[#f9e9b9]">
            <p className="text-[11px] font-extrabold whitespace-nowrap">
              भारत की भरोसेमंद लॉटरी
            </p>
          </div>
          <span className="text-[#c49a3d] text-[10px]">❧</span>
        </div>

        <p className="text-center text-[12px] font-semibold mt-[11px]">
          आपका चुना हुआ नंबर
        </p>

        {/* NUMBER */}
        <div className="grid grid-cols-6 gap-[3px] mt-[7px]">
          {ticket.number.map((digit, index) => (
            <div
              key={index}
              className="h-[37px] rounded-[6px] border border-[#bd8b2d] bg-[#fff0c3] flex items-center justify-center"
            >
              <span className="text-[19px] font-extrabold">{digit}</span>
            </div>
          ))}
        </div>

        {/* PRIZES */}
        <div className="grid grid-cols-3 gap-[4px] mt-[11px]">
          <MiniPrize
            title="प्रथम पुरस्कार"
            amount={formatPrize(ticket.prizes.first)}
            subtitle="(6 अंक मिलने पर)"
          />
          <MiniPrize
            title="द्वितीय पुरस्कार"
            amount={formatPrize(ticket.prizes.second)}
            subtitle="(5 अंक मिलने पर)"
          />
          <MiniPrize
            title="तृतीय पुरस्कार"
            amount={formatPrize(ticket.prizes.third)}
            subtitle="(4 अंक मिलने पर)"
          />
        </div>

        <div className="h-px bg-[#c9a85c] mt-[10px]" />

        <div className="flex items-center justify-center gap-[3px] mt-[6px]">
          <span className="text-[#c09232] text-[9px]">✧</span>
          <p className="text-[9px] font-semibold text-center leading-[1.15]">
            छोटी सी राशि, बड़ी खुशियों की शुरुआत
          </p>
          <span className="text-[#c09232] text-[9px]">✧</span>
        </div>
      </div>

      {/* RIGHT */}
      <div className="absolute right-0 top-0 bottom-0 w-[24%] px-[7px] py-[11px] text-[#21180d] bg-gradient-to-b from-[#fff1c7] via-[#f7e2a8] to-[#edd28f] border-l border-[#c39b43]">
        {/* STATUS */}
        <div
          className={`w-full h-[30px] rounded-[8px] flex items-center justify-center gap-[3px] text-white font-bold ${
            pending
              ? "bg-gradient-to-b from-[#ed4d4a] to-[#c82729]"
              : "bg-gradient-to-b from-[#42c45b] to-[#209d3c]"
          }`}
        >
          {pending ? (
            <Clock3 size={14} strokeWidth={2} />
          ) : (
            <CheckCircle2 size={14} strokeWidth={2} />
          )}
          <span className="text-[10px]">{ticket.statusText}</span>
        </div>

        {/* DRAW DATE */}
        <SideInfo
          label="ड्रॉ दिनांक"
          value={
            <>
              <span>{ticket.drawDate.day}</span>{" "}
              <span>{ticket.drawDate.month}</span>{" "}
              <span>{ticket.drawDate.year}</span>
            </>
          }
        />

        {/* PRICE */}
        <SideInfo
          label="टिकट मूल्य"
          value={ticket.price}
          valueClass="text-[#9d2020] text-[15px] font-extrabold"
        />

        {/* PURCHASE DATE */}
        <div className="mt-[12px]">
          <p className="text-[9px] text-[#6a5533]">खरीद की तारीख</p>
          <p className="text-[10px] font-bold leading-[1.2] mt-[3px]">
            {ticket.purchaseDate}
          </p>
          <p className="text-[9px] mt-[2px]">{ticket.purchaseTime}</p>
        </div>

        {/* TICKET ID */}
        <div className="mt-[12px]">
          <p className="text-[9px] text-[#6a5533]">टिकट आईडी</p>
          <div className="flex items-start gap-[3px] mt-[3px]">
            <span className="text-[9px] font-bold break-all leading-[1.1]">
              {ticket.id}
            </span>
            <button
              type="button"
              onClick={() => copyId(ticket.id)}
              className="shrink-0"
            >
              <Copy size={12} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>

      {/* NOTCHES */}
      <TicketNotches />
    </div>
  );
};

// =====================================================
// PRIZE FORMAT
// =====================================================

const formatPrize = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "₹0";
  }

  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2).replace(/\.00$/, "")} करोड़`;
  }

  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2).replace(/\.00$/, "")} लाख`;
  }

  return `₹${amount.toLocaleString("en-IN")}`;
};

// =====================================================
// SIDE INFO
// =====================================================

const SideInfo = ({ label, value, valueClass = "" }) => (
  <div className="mt-[10px]">
    <p className="text-[9px] text-[#6a5533]">{label}</p>
    <div
      className={`text-[11px] font-semibold leading-[1.2] mt-[3px] ${valueClass}`}
    >
      {value}
    </div>
  </div>
);

// =====================================================
// MINI PRIZE
// =====================================================

const MiniPrize = ({ title, amount, subtitle }) => (
  <div className="min-w-0 rounded-[7px] border border-[#c79b3d] bg-[#f8e8b4] py-[5px] px-[1px] text-center">
    <p className="text-[7px] font-bold leading-[1.1]">{title}</p>
    <p className="mt-[4px] text-[12px] leading-none font-extrabold text-[#9e2922] whitespace-nowrap">
      {amount}
    </p>
    <p className="mt-[3px] text-[6px] leading-[1.1]">{subtitle}</p>
  </div>
);

// =====================================================
// TICKET NOTCHES
// =====================================================

const TicketNotches = () => {
  const positions = [
    "top-[8px]",
    "top-[29px]",
    "top-[50px]",
    "top-[71px]",
    "top-[92px]",
    "top-[113px]",
    "top-[134px]",
    "top-[155px]",
    "top-[176px]",
    "top-[197px]",
    "top-[218px]",
  ];

  return (
    <>
      {positions.map((position, index) => (
        <span
          key={`left-notch-${index}`}
          className={`absolute left-[-7px] ${position} w-[14px] h-[14px] rounded-full bg-[#030404] z-[50] pointer-events-none`}
        />
      ))}
      {positions.map((position, index) => (
        <span
          key={`right-notch-${index}`}
          className={`absolute right-[-7px] ${position} w-[14px] h-[14px] rounded-full bg-[#030404] z-[50] pointer-events-none`}
        />
      ))}
    </>
  );
};

export default MyTickets;