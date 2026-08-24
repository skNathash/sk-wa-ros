/**
 * B2B retailer groups — the same per-group prices the pricing tab lists
 * (`networkGroupPrices` / `networkGroupPriceInfo` off the deal response), read
 * as a compact ranking instead of a table: which buyer group pays what, and how
 * far under MRP that price sits.
 */

import type { NetworkGroupPrice } from "~/types/CommonTypes";

/** Dot and price colour per row, picked by position so the card stays legible. */
export const TONES = [
  { dot: "tw:bg-emerald-500", text: "tw:text-emerald-600" },
  { dot: "tw:bg-violet-500", text: "tw:text-violet-600" },
  { dot: "tw:bg-amber-500", text: "tw:text-amber-600" },
  { dot: "tw:bg-blue-500", text: "tw:text-blue-600" },
  { dot: "tw:bg-rose-500", text: "tw:text-rose-600" },
  { dot: "tw:bg-fuchsia-500", text: "tw:text-fuchsia-600" },
];

/** One row of the card. */
export interface GroupRow {
  id: string;
  name: string;
  /** Retailers mapped to the group. */
  sellersCount: number;
  price: number;
  /** Percent under MRP, negative; null when there is nothing to compare to. */
  discount: number | null;
  dot: string;
  text: string;
}

export interface FormattedRetailerGroups {
  hasData: boolean;
  rows: GroupRow[];
  /** Groups counted in the header chip. */
  totalGroups: number;
  /** Average of the priced groups — the second half of the chip. */
  avgPrice: number;
}

export const EMPTY_RETAILER_GROUPS: FormattedRetailerGroups = {
  hasData: false,
  rows: [],
  totalGroups: 0,
  avgPrice: 0,
};

/**
 * Rows in price order, cheapest last, so the card reads top-down from the group
 * that pays most. Groups without a price of their own fall back to the deal's
 * network price, which is what the pricing tab charges them anyway.
 */
export const normalizeRetailerGroups = (
  groups: NetworkGroupPrice[] | undefined,
  {
    mrp = 0,
    fallbackPrice = 0,
    info,
  }: {
    mrp?: number;
    /** Deal network price used for groups that carry no price. */
    fallbackPrice?: number;
    info?: { totalGroups?: number; totalSellers?: number };
  } = {},
): FormattedRetailerGroups => {
  const priced = (groups || [])
    .map((group) => ({
      group,
      price: Number(group.price) || Number(fallbackPrice) || 0,
    }))
    .filter((entry) => !!entry.price)
    .sort((a, b) => b.price - a.price);

  if (!priced.length) return EMPTY_RETAILER_GROUPS;

  const rows: GroupRow[] = priced.map((entry, index) => {
    const tone = TONES[index % TONES.length];
    return {
      id: entry.group.id,
      name: entry.group.name || "Group",
      sellersCount: Number(entry.group.sellersCount) || 0,
      price: entry.price,
      /* Against MRP, because that is the number the discount is quoted on. */
      discount: mrp ? Math.round(((entry.price - mrp) / mrp) * 100) : null,
      dot: tone.dot,
      text: tone.text,
    };
  });

  const avgPrice = Math.round(
    rows.reduce((sum, row) => sum + row.price, 0) / rows.length,
  );

  return {
    hasData: true,
    rows,
    totalGroups: Number(info?.totalGroups) || rows.length,
    avgPrice,
  };
};
