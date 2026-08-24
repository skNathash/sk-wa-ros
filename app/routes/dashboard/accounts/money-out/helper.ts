import { tintAt, tintIndexFor } from "~/components/core/tint/tints";

/** What the toolbar filters hand the page on every change. */
export type PaymentToolbarForm = {
  search: string;
  dateRange: Date[];
};

/** Credit terms agreed with a vendor — the small chip beside the vendor name. */
export type VendorTerm = "COD" | "7-DAY" | "15-DAY" | "30-DAY" | "45-DAY";

/**
 * Tone for the terms chip. Cash on delivery is the tightest arrangement, so it
 * is kept visually apart from the credit terms, which all share one wash.
 */
export const termChipClass = (term: VendorTerm) =>
  term === "COD"
    ? "tw:bg-gray-100 tw:text-gray-600"
    : "tw:bg-amber-50 tw:text-amber-700";

/**
 * Avatar decoration for a vendor row.
 *
 * The money-out lists print two-letter initials rather than the single glyph
 * `tileDecor` gives, so the decoration is resolved here; the tint slot still
 * follows the name, so a vendor keeps the same colour across all the blocks on
 * the page.
 */
export type VendorDecor = {
  _initials: string;
  _tintIndex: number;
  _ink: string;
};

export const vendorDecor = (name = ""): VendorDecor => {
  const index = tintIndexFor(name);
  const initials = name
    .trim()
    .split(/[\s_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return {
    _initials: initials || "#",
    _tintIndex: index,
    _ink: tintAt(index).ink,
  };
};
