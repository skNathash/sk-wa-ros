/**
 * How the profit & loss screens print their figures.
 *
 * Every period tab shows the same kinds of number — shortened rupees, signed
 * movements, a month out of context — and they all have to read alike, so the
 * rules sit here rather than with any one tab. The data these format lives
 * behind `~/services/ProfitAndLossService`.
 */

/** Whether a line brings money in or takes it out — decides the delta tone. */
export type FlowDirection = "in" | "out";

/**
 * Coerce a value to a finite number. Non-numeric, NaN and Infinity are returned
 * as 0 so the UI never prints "NaN" or "Infinity".
 */
export const toFinite = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Short number for chart axes, without the rupee symbol: 3.4Cr, 1.2L, 6.8k.
 * Values below 1,000 are still shown in thousands so the axis labels stay
 * compact.
 */
export const compactNumber = (value: number): string => {
  const n = toFinite(value);
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";

  if (abs >= 10000000) return `${sign}${(abs / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `${sign}${(abs / 100000).toFixed(1)}L`;

  return `${sign}${(abs / 1000).toFixed(1)}k`;
};

/** Grouped rupees with the symbol, no decimals — "₹10,500". */
export const compactRupees = (value: number): string =>
  `₹${Math.round(toFinite(value)).toLocaleString("en-IN")}`;

/** Signed percentage as printed on the movement columns, e.g. "+12.4%". */
export const signedPercent = (value: number, decimals = 1): string => {
  const n = toFinite(value);
  return `${n > 0 ? "+" : n < 0 ? "-" : "+"}${Math.abs(n).toFixed(decimals)}%`;
};

/** Signed rupee movement as printed under a hero chip, e.g. "+₹10,500". */
export const signedAmount = (value: number): string => {
  const n = toFinite(value);
  return `${n < 0 ? "-" : "+"}${compactRupees(Math.abs(n))}`;
};

/**
 * Tone for a movement column.
 *
 * A rise is good news on an income line and bad news on a cost line, so the
 * direction of the line decides the colour rather than the sign alone. A cost
 * that has not moved still reads as a cost, so it keeps the cost tone.
 */
export const deltaClass = (value: number, direction: FlowDirection): string => {
  if (direction === "in") {
    return value >= 0 ? "tw:text-emerald-600" : "tw:text-red-600";
  }
  return value < 0 ? "tw:text-emerald-600" : "tw:text-red-600";
};

/** The palette the whole tab is drawn in, so blocks stay in step. */
export const pnlPalette = {
  profit: "#047857",
  profitSoft: "#d1fae5",
  revenue: "#2563eb",
  notable: "#f59e0b",
  leak: "#dc2626",
  track: "#e5e7eb",
};

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "2026-07" → "Jul". The month keys the endpoint groups by are plain strings. */
export const monthKeyLabel = (key: string): string => {
  const month = Number(String(key).slice(5, 7));
  return MONTH_NAMES[month - 1] ?? String(key);
};

/** "2026-07" → "Jul'26", for the footnotes that name a month out of context. */
export const monthKeyShortLabel = (key: string): string =>
  `${monthKeyLabel(key)}'${String(key).slice(2, 4)}`;
