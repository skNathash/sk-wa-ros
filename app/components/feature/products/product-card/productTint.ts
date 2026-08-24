import { tintIndexFor } from "~/components/core/tint/tints";

/**
 * Which tint a card's image plate should wear.
 *
 * `false` means "no tile" — the caller's `imgBgStyle` plate stays. A number is
 * used as-is (`-1` = theme tint). `true` keys the tone off the brand, so every
 * SKU of a brand shares one colour wherever the card shows up.
 *
 * Brand arrives as an array on the catalog deal shape and as an object on the
 * offer/cart shape, so both are read here rather than at each call site.
 */
export const productTintIndex = (
  tint: boolean | number | undefined,
  data: any,
): number | null => {
  if (tint === false || tint === undefined) return null;
  if (typeof tint === "number") return tint;

  const brand = Array.isArray(data?.brand) ? data.brand[0] : data?.brand;
  const seed = brand?._displayName || brand?.name || data?.name || "";
  return tintIndexFor(seed);
};
