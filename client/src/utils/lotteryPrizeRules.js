/**
 * Shared lottery prize formatting and dynamic winning rules utility.
 */

/**
 * Format prize amounts with Crore / Lakh formatting:
 * e.g. 50000000 -> "₹5 Crore"
 * e.g. 500000 -> "₹5 Lakh"
 * e.g. 50000 -> "₹50,000"
 * Handles undefined, null, and non-numeric values gracefully.
 */
export const formatPrize = (amount, prefix = "₹") => {
  const num = Number(amount);
  if (!Number.isFinite(num) || num <= 0) return `${prefix}0`;

  const trim = (v) => {
    const s = Number(v.toFixed(2));
    return String(s);
  };

  if (num >= 10000000) {
    return `${prefix}${trim(num / 10000000)} Crore`;
  }
  if (num >= 100000) {
    return `${prefix}${trim(num / 100000)} Lakh`;
  }
  return `${prefix}${num.toLocaleString("en-IN")}`;
};

/**
 * Format amounts into Indian currency standard with Crore / Lakh
 */
export const formatINR = (amount) => formatPrize(amount);

/**
 * Format draw date into a readable format (e.g. "23 Oct 2026")
 */
export const formatDrawDate = (dateValue) => {
  if (!dateValue) return "Draw date soon";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Draw date soon";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * Format draw time clearly in 12-hour format (e.g. "18:30" -> "06:30 PM")
 */
export const formatDrawTime = (timeValue) => {
  if (!timeValue) return "--:--";
  const str = String(timeValue).trim();
  if (/am|pm/i.test(str)) return str;
  const parts = str.split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return str;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  const min = String(m).padStart(2, "0");
  return `${String(hour12).padStart(2, "0")}:${min} ${period}`;
};

/**
 * Generates exactly 5 winning rules mapped to API prizes:
 * 1. All 6 digits match -> prizes.first
 * 2. Last 5 digits match -> prizes.second
 * 3. Last 4 digits match -> prizes.third
 * 4. Last 3 digits match -> prizes.fourth
 * 5. Last 2 digits match -> prizes.fifth
 */
export const getFestivalWinningRules = (
  prizes = {},
  exampleCode = "12A12345",
  ruleTickets = 10
) => {
  const safePrizes = prizes || {};

  const isBExample = String(exampleCode || "").includes("B");
  const baseCode = isBExample ? "12B12345" : "12A12345";
  const prefix = isBExample ? "99B" : "99A";

  const config = [
    {
      number: 1,
      condition: "All 6 digits match",
      example: baseCode,
      key: "first",
      badge: "bg-[#ed1d43]",
      row: "bg-[#ffe4e8]",
    },
    {
      number: 2,
      condition: "Last 5 digits match",
      example: `${prefix}12345`,
      key: "second",
      badge: "bg-[#2e7dd7]",
      row: "bg-[#e3f0ff]",
    },
    {
      number: 3,
      condition: "Last 4 digits match",
      example: `${prefix}92345`,
      key: "third",
      badge: "bg-[#f08a25]",
      row: "bg-[#ffefdc]",
    },
    {
      number: 4,
      condition: "Last 3 digits match",
      example: `${prefix}99345`,
      key: "fourth",
      badge: "bg-[#20a66a]",
      row: "bg-[#dcf8ea]",
    },
    {
      number: 5,
      condition: "Last 2 digits match",
      example: `${prefix}99945`,
      key: "fifth",
      badge: "bg-[#8c4bd6]",
      row: "bg-[#f0e4ff]",
    },
  ];

  return config.map((r) => {
    const rawTotal = safePrizes[r.key];
    const totalAmount =
      Number.isFinite(Number(rawTotal)) && Number(rawTotal) > 0
        ? Number(rawTotal)
        : 0;
    const perTicketAmount =
      ruleTickets > 0 ? Math.round(totalAmount / ruleTickets) : totalAmount;

    return {
      number: r.number,
      n: String(r.number), // for HomeLotterySection.jsx
      condition: r.condition,
      cond: r.condition,
      example: r.example,
      ex: r.example,
      key: r.key,
      badge: r.badge,
      row: r.row,
      totalAmount,
      perTicketAmount,
      total: formatPrize(totalAmount),
      totalText: formatPrize(totalAmount),
      prize: formatPrize(perTicketAmount),
      prizeText: formatPrize(perTicketAmount),
    };
  });
};
