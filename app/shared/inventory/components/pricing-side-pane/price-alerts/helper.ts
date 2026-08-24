/** Data access + response formatting for the "Seller & SK alerts" list. */

import SellerCatalogService from "~/services/SellerCatalogService";
import type { PaginationState } from "~/types/CommonTypes";

/** Which way the price went. `down` reads green, `up` reads red. */
export type PriceAlertDirection = "down" | "up";

/** The channel the alerts are read for. */
export type PriceAlertPriceType = "b2b" | "b2c";

/** What the list filters on — everything else is fixed context for the feed. */
export interface PriceAlertFilters {
  search?: string;
  priceType?: PriceAlertPriceType;
  /** Peer radius in km. */
  distance?: number;
  /** Lookback window in days. */
  days?: number;
}

/**
 * One row in the alerts list, already display-ready — every label is derived
 * here so the component renders plain fields.
 */
export interface PriceAlert {
  id: string;
  dealId: string;
  dealRefId?: string;
  /** Product name shown on the row. */
  name: string;
  /** First deal image, when the deal has one. */
  image?: string;
  /** Initials painted on the fallback tile. */
  tileLabel: string;
  direction: PriceAlertDirection;
  /** Price after the move. */
  price: number;
  /** Price before the move, struck through beside the new one. */
  previousPrice: number;
  /** How much the price moved, unsigned. */
  delta: number;
  /** Our own price for the same deal. */
  yourPrice: number;
  /** Where we sit against the moved price — signed, positive = we're dearer. */
  priceDifference: number;
  /** True when the deal that moved is our own. */
  isOwn: boolean;
  /** "SK dropped ₹6" / "Karthik testing store · 2 km" — the reason line. */
  reasonLabel: string;
  /** "−₹6 · 4%" — the size of the move. */
  changeLabel: string;
  /** Full remarks from the API, used as the row's hover title. */
  remarks?: string;
  changedAt?: string;
}

/** Peer radius (km) the alert feed is read against. */
export const PRICE_ALERT_DISTANCE = 1000;
/** How far back the feed looks for price movements. */
export const PRICE_ALERT_DAYS = 100;

/** Change reasons the API sends, in the words the pane uses for them. */
const CHANGE_REASONS: Record<string, string> = {
  STOCK_SYNC_AUTO: "auto stock sync",
  STOCK_SYNC: "stock sync",
  MANUAL: "manual change",
  BULK_UPDATE: "bulk update",
  SCHEME: "scheme change",
};

/**
 * The list runs on `catalog/seller-deals/network/price-alerts`, which takes the
 * feed context (seller radius, lookback window, channel) plus the standard list
 * params. Search goes under `filter.search`, as on the rest of the seller-deal
 * endpoints.
 */
export const prepareParams = (
  filters: PriceAlertFilters,
  pagination: PaginationState,
) => {
  const params: Record<string, any> = {
    page: pagination?.activePage ?? 1,
    limit: pagination?.rowsPerPage ?? 10,
    distance: filters?.distance ?? PRICE_ALERT_DISTANCE,
    days: filters?.days ?? PRICE_ALERT_DAYS,
    priceType: filters?.priceType || "b2b",
    filter: {} as Record<string, any>,
  };

  if (filters?.search?.trim()) {
    params.filter.search = filters.search.trim();
  }

  return params;
};

const money = (value: number) => `₹${Math.round(Math.abs(value))}`;

/**
 * Reason line for a row. Our own deals read as an action with the actor that
 * caused it ("auto stock sync"), because that is what we can go and change;
 * peer moves read as the seller and how far away they are, since all they tell
 * us is where the market around us sat.
 */
const buildReasonLabel = (raw: Record<string, any>, isOwn: boolean): string => {
  if (isOwn) {
    const reason =
      CHANGE_REASONS[raw?.changeReason] ||
      (raw?.changeReason || "").toLowerCase().replace(/_/g, " ") ||
      "price changed";
    return raw?.changedBy?.userName
      ? `${raw.changedBy.userName} · ${reason}`
      : reason;
  }

  const distance = Number(raw?.distance ?? raw?.seller?.distance ?? 0);
  const seller = raw?.sellerName || raw?.seller?.sellerName || "seller";
  return distance > 0 ? `${seller} · ${Math.round(distance)} km` : seller;
};

/** Price-alert document -> the row shape this list renders. */
export const formatAlertResponse = (raw: Record<string, any>): PriceAlert => {
  const name = raw?.dealName || "";
  const direction: PriceAlertDirection = raw?.direction === "down" ? "down" : "up";
  const delta = Math.abs(Number(raw?.change) || 0);
  const changePercent = Math.abs(Number(raw?.changePercent) || 0);
  const isOwn = raw?.source === "own";

  return {
    id: `${raw?.dealId || raw?.dealRefId || name}-${raw?.sellerId || ""}`,
    dealId: raw?.dealId || "",
    dealRefId: raw?.dealRefId || "",
    name,
    image: Array.isArray(raw?.images) ? raw.images[0] : undefined,
    tileLabel: name.slice(0, 4).toUpperCase(),
    direction,
    price: Number(raw?.newPrice) || 0,
    previousPrice: Number(raw?.oldPrice) || 0,
    delta,
    yourPrice: Number(raw?.yourPrice) || 0,
    priceDifference: Number(raw?.priceDifference) || 0,
    isOwn,
    reasonLabel: buildReasonLabel(raw, isOwn),
    changeLabel: delta
      ? `${direction === "down" ? "−" : "+"}${money(delta)}${
          changePercent ? ` · ${Math.round(changePercent)}%` : ""
        }`
      : "price changed",
    remarks: raw?.remarks || "",
    changedAt: raw?.changedAt || "",
  };
};

export const getData = async (params: Record<string, any>) => {
  const response = await SellerCatalogService.getNetworkPriceAlerts(params);
  return (response?.data?.data || []).map(formatAlertResponse);
};

export const getCount = async (params: Record<string, any>) => {
  const response = await SellerCatalogService.getNetworkPriceAlerts({
    ...params,
    outputType: "count",
  });
  const payload = response?.data;
  const total =
    payload?.total ??
    payload?.count ??
    (typeof payload?.data === "number" ? payload.data : 0);
  return Number(total) || 0;
};
