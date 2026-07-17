/**
 * Resolves the savings amount for a label. Prefers an explicit `saving`, falls
 * back to `mrp - price`, and clamps to 0 so a same-price (or bad) item never
 * renders a "0" or negative discount. Templates treat a result of 0 as
 * "no savings" and suppress the savings block entirely.
 */
export const getSaving = (
  saving: number | undefined,
  mrp: number,
  price: number,
): number => Math.max(0, saving || mrp - price);

/**
 * Formats a value for a label: whole numbers print with no decimals (so the
 * common case has no dot to crush), real fractional values keep 2 decimals.
 */
export const formatLabelAmount = (value: number | string): string => {
  const n = Number(value) || 0;
  return n.toFixed(2);
};

/**
 * Returns a font size (px) for the large discount number that shrinks as the
 * number grows, so multi-digit values stay inside the label instead of
 * overflowing. `base` is the size used for short (1-2 digit) values; longer
 * values are scaled down proportionally.
 */
export const fitDiscountFontSize = (
  value: number | string,
  base: number,
): number => {
  const len = String(value ?? "").length;
  if (len <= 2) return base;
  if (len === 3) return Math.round(base * 0.72);
  if (len === 4) return Math.round(base * 0.55);
  return Math.round(base * 0.45);
};
