import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import PosService from "~/services/PosService";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { BreadcrumbItem, PaginationState } from "~/types/CommonTypes";
import {
  MATCH_API_TYPE,
  preparePriceComparisonParams,
  prepareFilters,
} from "../list/helper";

export { prepareFilters };

/**
 * Electronics price match — the CLUB price of every online-listed SKU next to
 * what Amazon / Flipkart / other marketplaces are charging for it.
 *
 * The screen runs on the same `catalog/seller-deals/price-comparison` endpoint
 * as the price sheet, narrowed to deals that actually carry an online listing
 * (`onlinePriceExist=true`) — there is nothing to match against otherwise.
 */

/** Match chip over the sheet: all / above online / winning. */
export type ElectronicsChip = "all" | "above" | "winning";

/**
 * Root-level `type` the price-comparison endpoint filters the deals by for each
 * chip. The list itself gets this from the filter form (`match`) through
 * {@link prepareFilters}; the badge counts need one query per chip regardless
 * of which one is active, so they override it explicitly.
 */
export const CHIP_API_TYPE = MATCH_API_TYPE;

const MATCH_TYPES = Object.values(CHIP_API_TYPE).filter(Boolean);

/**
 * Forces one chip's `type` onto a query, dropping the match narrowing for
 * "all". A pricing gap (`defaultToMrp` / `lowMargin`, put there by the side
 * pane through {@link prepareFilters}) rides on the same root `type`, so "all"
 * leaves anything that is not a match type alone.
 */
const withChip = (
  query: Record<string, any>,
  chip: ElectronicsChip = "all",
) => {
  const type = CHIP_API_TYPE[chip];
  if (type) return { ...query, type };

  if (!MATCH_TYPES.includes(query.type)) return query;

  const { type: _dropped, ...rest } = query;
  return rest;
};

export const defaultPagination: PaginationState = {
  activePage: 1,
  rowsPerPage: 50,
  startSlNo: 1,
  endSlNo: 50,
  totalRecords: 0,
};

export const defaultBreadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: {
      path: "/dashboard",
    },
  },
  {
    label: "Manage Price",
    redirect: {
      path: "/configs/rsp",
    },
  },
  {
    label: "Electronics",
  },
];

/** The marketplace columns, in the order the sheet renders them. */
export interface OnlinePartner {
  key: "amazon" | "flipkart" | "other";
  /** Desktop column header. */
  label: string;
  /** Mobile tile header — the column label does not fit a quarter-width tile. */
  short: string;
  /** Header text colour (the marketplace's own brand tone). */
  headerClass: string;
  /** Column tint, so each marketplace reads as its own band. */
  cellClass: string;
  /** Price colour when this marketplace is the cheapest listing. */
  lowestClass: string;
}

/**
 * Amazon and Flipkart are fixed columns; everything else the feed carries
 * (JioMart, Smartprix, …) collapses into "Others" so the sheet keeps a stable
 * shape no matter which marketplaces a given SKU was found on.
 */
export const ONLINE_PARTNERS: OnlinePartner[] = [
  {
    key: "amazon",
    label: "Amazon",
    short: "AMZN",
    headerClass: "tw:text-amber-600",
    cellClass: "tw:bg-amber-50/40",
    lowestClass: "tw:text-amber-600",
  },
  {
    key: "flipkart",
    label: "Flipkart",
    short: "FLIP",
    headerClass: "tw:text-blue-600",
    cellClass: "tw:bg-sky-50/40",
    lowestClass: "tw:text-blue-600",
  },
  {
    key: "other",
    label: "Others",
    short: "OTHER",
    headerClass: "tw:text-slate-600",
    cellClass: "tw:bg-slate-50/60",
    lowestClass: "tw:text-slate-700",
  },
];

/** One marketplace price on a row, display-ready. */
export interface RowPartnerPrice extends OnlinePartner {
  price: number;
  /** Listing link, when the feed carried one. */
  url?: string;
  /** Cheapest listing across the marketplaces on this row. */
  isLowest: boolean;
  /** "₹8.5k" — the mobile tile value; "—" when unlisted. */
  compact: string;
}

/** How this SKU's CLUB price sits against the cheapest online listing. */
export type RowTone = "winning" | "above" | "neutral";

export interface ElectronicsRow {
  _id: string;
  id: string;
  name: string;
  mrp: number;
  purchasePrice: number;
  b2cPrice: number;
  category?: { _id?: string; name?: string };
  brand?: { _id?: string; name?: string };
  hsn?: string;
  partnerPriceData?: any;

  /** Marketplace columns, always three entries in `ONLINE_PARTNERS` order. */
  _partners: RowPartnerPrice[];
  /** Cheapest marketplace price on the row (0 when nothing is listed). */
  _lowestOnline: number;
  _lowestOnlineName: string;
  /** Priced at or under every marketplace. */
  _isWinning: boolean;
  /** How much the CLUB price sits above the cheapest listing (0 when winning). */
  _aboveBy: number;
  _tone: RowTone;
  /** "Audio · margin now 4%" — the desktop sub-line under the product name. */
  _subLine: string;
  /** "→ 2% if matched" — what the margin becomes after matching. */
  _matchedHint: string;
  /** "Cooling · MRP ₹42,990 · SK ₹36,500" — the mobile meta line. */
  _mobileMeta: string;
  /** "you're ₹1,691 above" — the mobile footer strip. */
  _aboveLabel: string;
  /** Short SKU tile shown in place of a product image. */
  _monogram: string;
  _monogramColor: string;
}

/** Compact money for the mobile tiles: ₹8.3k / ₹43k / ₹450, "—" when unpriced. */
export const formatCompactPrice = (value: number): string =>
  CommonService.formatCompact(value, { style: "short", fallback: "—" });

const MONOGRAM_COLORS = [
  "#6366F1",
  "#0EA5E9",
  "#8B5CF6",
  "#14B8A6",
  "#F59E0B",
  "#EC4899",
];

const hash = (value: string) => {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/** Four-character SKU tile derived from the product name. */
const buildMonogram = (name: string) =>
  (name || "")
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 4)
    .toUpperCase() || "SKU";

/**
 * "Others" is whichever non-Amazon/Flipkart listing is cheapest — the named
 * `other` slot when the feed has one, otherwise the cheapest of the rest.
 */
const pickOther = (partnerPriceData: any) => {
  const named = partnerPriceData?.other;
  if (Number(named?.price) > 0) return named;

  const rest = (partnerPriceData?.others || []).filter(
    (entry: any) => Number(entry?.price) > 0,
  );
  if (!rest.length) return undefined;

  return rest.reduce((lowest: any, entry: any) =>
    Number(entry.price) < Number(lowest.price) ? entry : lowest,
  );
};

const marginPct = (price: number, cost: number): number | null =>
  price > 0 && cost > 0 ? ((price - cost) / price) * 100 : null;

/**
 * Turns one price-comparison row into the shape both views render: the three
 * marketplace columns, where the CLUB price sits against them, and every label
 * the cells display — so neither view computes anything at render time.
 */
export const buildElectronicsRow = (item: any): ElectronicsRow => {
  const price = item.b2cPrice || 0;
  const cost = item.purchasePrice || 0;

  const partners: RowPartnerPrice[] = ONLINE_PARTNERS.map((partner) => {
    const entry =
      partner.key === "other"
        ? pickOther(item.partnerPriceData)
        : item.partnerPriceData?.[partner.key];

    const partnerPrice = Number(entry?.price) || 0;

    return {
      ...partner,
      price: partnerPrice,
      url: entry?.url || entry?.productUrl || undefined,
      isLowest: false,
      compact: formatCompactPrice(partnerPrice),
    };
  });

  const listed = partners.filter((partner) => partner.price > 0);
  const cheapest = listed.length
    ? listed.reduce((lowest, partner) =>
        partner.price < lowest.price ? partner : lowest,
      )
    : null;

  if (cheapest) {
    partners.forEach((partner) => {
      partner.isLowest = partner.key === cheapest.key;
    });
  }

  const lowestOnline = cheapest?.price || 0;
  const aboveBy =
    lowestOnline > 0 && price > lowestOnline
      ? CommonService.roundedByDecimalPlace(price - lowestOnline, 2)
      : 0;
  const isWinning = lowestOnline > 0 && price > 0 && aboveBy === 0;

  const margin = marginPct(price, cost);
  const matchedMargin = marginPct(lowestOnline, cost);

  const categoryName = item.category?.name || "";
  const marginLabel =
    margin === null
      ? ""
      : `margin now ${CommonService.roundedByDecimalPlace(margin, 0)}%`;

  return {
    ...item,
    _partners: partners,
    _lowestOnline: lowestOnline,
    _lowestOnlineName: cheapest?.label || "",
    _isWinning: isWinning,
    _aboveBy: aboveBy,
    _tone: isWinning ? "winning" : aboveBy > 0 ? "above" : "neutral",
    _subLine: [categoryName, marginLabel].filter(Boolean).join(" · "),
    _matchedHint:
      aboveBy > 0 && matchedMargin !== null
        ? `→ ${CommonService.roundedByDecimalPlace(matchedMargin, 0)}% if matched`
        : "",
    // Cost stays out of the customer-facing match view — the row is read
    // against the marketplaces, not against what the SKU was bought for.
    _mobileMeta: [
      categoryName,
      item.mrp ? `MRP ₹${CommonService.formattedAmount(item.mrp, 0)}` : "",
    ]
      .filter(Boolean)
      .join(" · "),
    _aboveLabel:
      aboveBy > 0
        ? `you're ₹${CommonService.formattedAmount(aboveBy, 0)} above`
        : "",
    _monogram: buildMonogram(item.name),
    _monogramColor:
      MONOGRAM_COLORS[
        hash(item._id || item.name || "") % MONOGRAM_COLORS.length
      ],
  };
};

/**
 * Electronics rows: the price-comparison list narrowed to deals carrying an
 * online listing. B2C only — the match is against what a customer sees on the
 * marketplaces, so there is no B2B variant of this screen.
 */
export const getData = async (
  params: Record<string, any>,
): Promise<ElectronicsRow[]> => {
  const response = await SellerCatalogService.getPriceComparison({
    ...preparePriceComparisonParams(params, "customer"),
    onlinePriceExist: true,
    outputType: "list",
  });

  const formatted = SellerCatalogService.formatProductResponse(
    response.data?.data || [],
  );

  return formatted.map(buildElectronicsRow);
};

export const getCount = async (
  params: Record<string, any>,
  chip: ElectronicsChip = "all",
) => {
  const query: Record<string, any> = withChip(
    {
      ...preparePriceComparisonParams(params, "customer"),
      onlinePriceExist: true,
      outputType: "count",
    },
    chip,
  );

  delete query.page;
  delete query.limit;
  delete query.sort;

  const response = await SellerCatalogService.getPriceComparison(query);

  return response.data?.count || 0;
};

/** How many deals sit in each chip for the current filters — the chip badges. */
export const getChipCounts = async (params: Record<string, any>) => {
  const [all, above, winning] = await Promise.all([
    getCount(params, "all"),
    getCount(params, "above"),
    getCount(params, "winning"),
  ]);

  return { all, above, winning };
};

/** The stat cards above the sheet. */
export interface ElectronicsSummary {
  pricedCount: number;
  totalCount: number;
  defaultToMrpHint: string;
  lowMarginCount: number;
  lowMarginLabel: string;
}

/**
 * Filter-aware summary for the stat strip — the same `priceSummary` block the
 * price sheet reads, scoped to the online-listed slice. Returns null when the
 * API has nothing usable so the cards can hold their last value.
 *
 * The match chip is not applied here — the endpoint's root `type` is what
 * selects the summary block, so the strip always reports the full online slice.
 */
export const getSummary = async (
  params: Record<string, any>,
): Promise<ElectronicsSummary | null> => {
  const response = await SellerCatalogService.getPriceComparison({
    ...preparePriceComparisonParams(params, "customer"),
    onlinePriceExist: true,
    type: "priceSummary",
  });

  const summary = response?.data?.data;
  if (!summary) return null;

  const priced = summary.pricedItems || {};
  const lowMargin = summary.lowMargin || {};

  return {
    pricedCount: priced.configuredPrice || 0,
    totalCount: priced.totalDeals || 0,
    defaultToMrpHint: `${priced.defaultToMrp || 0} default to MRP`,
    lowMarginCount: lowMargin.count || 0,
    lowMarginLabel: `Low margin (< ${lowMargin.thresholdPercent || 0}% cushion)`,
  };
};

/**
 * Writes one deal's CLUB price as a fixed price. Shared by the inline editor
 * and the "match all" banner so both take the exact same path to the API.
 * Throws on a non-200 so callers only have one failure branch to handle.
 */
export const updateClubPrice = async (dealId: string, price: number) => {
  const response = await PosService.createRspConfig({
    applicableFor: "Customer",
    configOnType: "Deal",
    franchiseId: AuthService.getLoggedInUserId(),
    id: dealId,
    discount: 0,
    isFixedPrice: true,
    fixedPrice: price,
  });

  if (response?.statusCode !== 200) {
    throw new Error((response as any)?.message || "Could not update the price");
  }

  return response;
};
