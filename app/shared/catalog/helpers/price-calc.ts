import CommonService from "~/services/CommonService";
import UomPriceService from "~/services/UomPriceService";

/** How the entered amount turns into a selling price. */
export type PriceMode = "on_mrp" | "fixed";

/** Highest discount the price config forms accept. */
export const MAX_DISCOUNT_PERCENT = 99;

export interface FinalPriceInput {
  /** MRP as the API carries it (per gm/ml for small-uom deals). */
  mrp: number;
  /** Deal's stock uom — gm/ml prices are shown per kg/ltr. */
  uom?: string;
  mode: PriceMode;
  /** % off MRP for `on_mrp`, the price itself for `fixed`. */
  value: number | string | null;
}

/**
 * Clamps a typed discount to the 0–{@link MAX_DISCOUNT_PERCENT} range the price
 * config accepts. Returns null for an empty/negative entry so the caller can
 * blank the field, and reports whether the value had to be capped (the single
 * deal modal warns on that).
 */
export const clampDiscount = (value: number | string | null) => {
  const num = Number(value);
  if (value === null || value === "" || isNaN(num) || num < 0) {
    return { value: null, capped: false };
  }
  if (num > MAX_DISCOUNT_PERCENT) {
    return { value: MAX_DISCOUNT_PERCENT, capped: true };
  }
  return { value: num, capped: false };
};

/**
 * The one rule behind every selling price in the catalog — a % off MRP, or the
 * fixed price as typed. Used by the single-deal price config modal and by the
 * bulk price setter so both preview the exact same number.
 *
 * Works in display scale: `mrp` comes in on the API scale and the result is per
 * display uom (per kg/ltr for gm/ml deals), matching what the inputs show.
 * Returns null when there is nothing to compute from.
 */
export const getFinalPrice = ({
  mrp,
  uom,
  mode,
  value,
}: FinalPriceInput): number | null => {
  const num = Number(value);
  if (value === null || value === "" || isNaN(num)) return null;

  if (mode === "fixed") {
    return num < 0 ? null : CommonService.roundedByDecimalPlace(num, 2);
  }

  const displayMrp = Number(UomPriceService.toDisplayPrice(mrp, uom)) || 0;
  const price = displayMrp - (displayMrp * num) / 100;

  return CommonService.roundedByDecimalPlace(price < 0 ? 0 : price, 2);
};
