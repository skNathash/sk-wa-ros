import SellerCatalogService from "~/services/SellerCatalogService";

/** Kind of price move recorded. Unknown types still render, just unstyled. */
export type PriceEventType =
  | "BUY_PRICE"
  | "SELL_PRICE"
  | "NETWORK_PRICE"
  | "MRP"
  | "PEER_AVG"
  | string;

/** One entry in the events feed. */
export interface PriceEvent {
  type: PriceEventType;
  /** Pre-composed sentence from the API — "You raised buy to ₹571.5". */
  message: string;
  /** Signed move; positive = up. */
  delta?: number;
  /** Price after the move — absent on peer events. */
  price?: number;
  /** Peers the average was computed from. */
  samplesCount?: number;
  at: string;
  /** "Today · 11:37 AM", "20 days ago". */
  label: string;
}

/**
 * Price events payload —
 * `GET catalog/seller-deals/{dealId}/price-history?view=events`.
 */
export interface PriceEvents {
  success?: boolean;
  sellerDealObjId?: string;
  dealId?: string;
  dealRefId?: string;
  dealName?: string;
  view?: string;
  days?: number;
  events?: PriceEvent[];
  totalEvents?: number;
}

/** One event with the display fields the feed needs, derived up front. */
export interface FormattedPriceEvent extends PriceEvent {
  _key: string;
  /** Seller's own move rather than something the market did. */
  _own: boolean;
  _direction: "up" | "down" | "flat";
  /** Short tag shown against the row — "Buy", "Seller avg". */
  _label: string;
  /** Unsigned move, ready to render next to the +/− sign. */
  _absDelta: number;
  /** "seller" / "sellers", matched to `samplesCount`. */
  _peersLabel: string;
}

/**
 * Price events are keyed by the seller-deal document id, not the deal id the
 * screens carry, so a deal has to be looked up before the feed can be fetched.
 * Screens that already hold the seller-deal id skip this entirely.
 */
export const resolveSellerDealObjId = async (dealId: string) => {
  if (!dealId) return "";

  const response = await SellerCatalogService.getProducts(
    { filter: { dealId }, showAllDeals: true },
    { showOutOfStock: true },
  );

  const deal = SellerCatalogService.formatProductResponse(
    response.data?.data || [],
  )[0];

  return deal?.sellerDealObjId || "";
};

const isOwnEvent = (type: PriceEventType) => type !== "PEER_AVG";

/** Short tag shown against each row. */
const getEventLabel = (type: PriceEventType) => {
  switch (type) {
    case "BUY_PRICE":
      return "Buy";
    case "SELL_PRICE":
      return "Sell";
    case "NETWORK_PRICE":
      return "B2B";
    case "MRP":
      return "MRP";
    case "PEER_AVG":
      return "Seller avg";
    default:
      return type;
  }
};

/**
 * Direction of the move. Events with no delta (or a flat one) get "flat" so the
 * row still renders without a misleading arrow.
 */
const getEventDirection = (delta?: number): "up" | "down" | "flat" => {
  if (!delta) return "flat";
  return delta > 0 ? "up" : "down";
};

/**
 * Rows arrive newest-first from the API. Keys fall back to the index because
 * two moves can share a timestamp when they are written in one batch. Every
 * display field is derived here so the feed only reads properties.
 */
export const normalizePriceEvents = (
  data: PriceEvents | null | undefined,
): FormattedPriceEvent[] =>
  (data?.events || []).map((event, index) => ({
    ...event,
    _key: `${event.at || ""}-${event.type}-${index}`,
    _own: isOwnEvent(event.type),
    _direction: getEventDirection(event.delta),
    _label: getEventLabel(event.type),
    _absDelta: Math.abs(event.delta || 0),
    _peersLabel: event.samplesCount === 1 ? "seller" : "sellers",
  }));
