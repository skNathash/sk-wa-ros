/**
 * Retailers in and around, for the Trend watch screen —
 * `GET catalog/seller-deals/{sellerDealObjId}/price-history
 * ?view=b2cInAndAround&distance=1000&pricingType=b2c`.
 *
 * Same payload the product-view card reads, laid out for the wider detail
 * column this screen gives it: a taller plot, peer wording instead of seller
 * wording, and the headline figures pulled out for the card's top-right rail.
 */

import SellerCatalogService from "~/services/SellerCatalogService";

/** One peer on the chart, as the API sends it. */
export interface InAndAroundSeller {
  sellerId?: string;
  sellerRefId?: string;
  sellerName?: string;
  /** What this retailer sells the deal for. */
  price?: number;
  /** Distance from you, in kilometres. */
  distanceKm?: number;
  /** Units they move in a month — drives the dot size. */
  monthlyUnits?: number;
  /** How they price against you, as the API calls it. */
  relation?: string;
  /** Where they sit — the API has named this a few ways, so all are read. */
  town?: string;
  locality?: string;
  area?: string;
  city?: string;
}

/** In-and-around payload. */
export interface InAndAroundData {
  success?: boolean;
  sellerDealObjId?: string;
  dealId?: string;
  dealRefId?: string;
  dealName?: string;
  view?: string;
  /** Radius searched, as a label — "1km". */
  distance?: string;
  sellersCount?: number;
  avgSellerPrice?: number;
  you?: { price?: number; monthlyUnits?: number };
  sellers?: InAndAroundSeller[];
}

/** A plotted peer — everything the SVG needs, already in view units. */
export interface ChartPoint {
  key: string;
  name: string;
  /** "you" is your own dot; peers split by how they price against you. */
  kind: "you" | "cheaper" | "pricier";
  price: number;
  distanceKm: number;
  units: number;
  x: number;
  y: number;
  /** Dot radius, scaled by monthly units. */
  r: number;
  /** Hover text — "Kumar Stores · 1.7km · ₹62 · 48 units/mo". */
  title: string;
}

/**
 * One peer as the table lists it — the same dots, read row by row so the names,
 * the exact gap against your price and the reason each peer matters are legible
 * without hovering the chart.
 */
export interface PeerRow {
  key: string;
  name: string;
  /** First letter, for the avatar chip. */
  initial: string;
  /** Town or locality, when the payload carries one. */
  town: string;
  /** Store code — the sub-line when there's no town to show. */
  refId: string;
  distanceKm: number;
  distanceLabel: string;
  price: number;
  units: number;
  /** Which side of your price they sit on — "level" is an exact match. */
  kind: "cheaper" | "pricier" | "level";
  /** Their price minus yours. */
  delta: number;
  /** "+₹3" / "−₹2" / "=". */
  deltaLabel: string;
  /** Why this peer is worth a look — closest, cheapest, biggest mover. */
  signal: string;
}

/**
 * Ordering is the API's job, the same way the deal picker sends it, so the rows
 * the endpoint returns are rendered in the order they arrive. Nearest first —
 * the peers next door are the ones worth reacting to.
 */
export const PEER_SORT: Record<string, 1 | -1> = { distanceKm: 1 };

/** A labelled gridline on either axis. */
export interface AxisTick {
  key: string;
  label: string;
  /** View coordinate the tick sits at — `y` for price, `x` for distance. */
  at: number;
}

/** The whole chart, ready to render. */
export interface FormattedInAndAround {
  hasData: boolean;
  points: ChartPoint[];
  /** The same peers as table rows, in the order the API ordered them. */
  rows: PeerRow[];
  you: ChartPoint | null;
  yourPrice: number;
  /** Baseline at your price — the solid rule. */
  yourPriceY: number;
  peerAvg: number;
  /** Baseline at the seller average — the dashed rule. */
  peerAvgY: number;
  peersCount: number;
  /** "10 sellers" / "1 seller". */
  peersLabel: string;
  /** Radius searched, as the API labels it — "1km". */
  radiusLabel: string;
  dealName: string;
  priceTicks: AxisTick[];
  distanceTicks: AxisTick[];
}

/* Chart geometry, in view units — the SVG scales to its container. */
export const VIEW_WIDTH = 640;
export const VIEW_HEIGHT = 250;
const PLOT_LEFT = 58;
const PLOT_RIGHT = VIEW_WIDTH - 12;
const PLOT_TOP = 22;
const PLOT_BOTTOM = VIEW_HEIGHT - 42;

export const PLOT = {
  left: PLOT_LEFT,
  right: PLOT_RIGHT,
  top: PLOT_TOP,
  bottom: PLOT_BOTTOM,
};

/** Dot radii, smallest to largest peer by monthly units. */
const MIN_RADIUS = 4.5;
const MAX_RADIUS = 10;
/** Distance gridlines between "You" and the furthest peer. */
const DISTANCE_TICKS = 4;

/** "1.7km" past a kilometre, "320m" below it. */
export const formatDistance = (km: number) => {
  if (!km) return "0m";
  if (km >= 1) return `${Number(km.toFixed(km >= 10 ? 0 : 1))}km`;
  return `${Math.round(km * 1000)}m`;
};

/**
 * Price axis bounds. Peers cluster within a few rupees of each other, so the
 * axis is padded around the spread rather than started at zero — a zero
 * baseline collapses the whole field into one flat band.
 */
const getPriceBounds = (values: number[]) => {
  const priced = values.filter(Boolean);
  if (!priced.length) return { min: 0, max: 1 };
  const min = Math.min(...priced);
  const max = Math.max(...priced);
  if (max === min) return { min: min - 1, max: max + 1 };
  const pad = (max - min) * 0.15;
  return { min: min - pad, max: max + pad };
};

const EMPTY_CHART: FormattedInAndAround = {
  hasData: false,
  points: [],
  rows: [],
  you: null,
  yourPrice: 0,
  yourPriceY: 0,
  peerAvg: 0,
  peerAvgY: 0,
  peersCount: 0,
  peersLabel: "sellers",
  radiusLabel: "",
  dealName: "",
  priceTicks: [],
  distanceTicks: [],
};

export const emptyChart = (): FormattedInAndAround => ({ ...EMPTY_CHART });

/**
 * The price-history endpoints are keyed by the seller-deal document id, not the
 * deal id the picker lists on. The comparison rows usually already carry it, so
 * this is only the fallback lookup for rows that don't.
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

/** One peer as the normalizer holds it, mid-flatten. */
interface PeerEntry {
  seller: InAndAroundSeller;
  index: number;
  price: number;
  distanceKm: number;
  units: number;
}

/** "+₹3" above you, "−₹2" below, "=" when they match you exactly. */
const formatDelta = (delta: number) => {
  if (!delta) return "=";
  return `${delta > 0 ? "+" : "−"}₹${Math.abs(Number(delta.toFixed(2)))}`;
};

/**
 * Why this peer is worth a look. One line per row, picked in the order a
 * pricing call actually gets made: the peer next door first, then the ends of
 * the price spread, then the peer moving the most units, and finally where they
 * sit against the peer average.
 */
const getSignal = (
  entry: PeerEntry,
  delta: number,
  peerAvg: number,
  extremes: {
    closestKm: number;
    cheapest: number;
    priciest: number;
    topUnits: number;
  },
) => {
  const gap = Math.abs(Number(delta.toFixed(2)));

  if (entry.distanceKm === extremes.closestKm) {
    if (!delta) return "Your closest seller · matches your price";
    return `Your closest seller · sells ₹${gap} ${delta > 0 ? "above" : "below"} you`;
  }

  if (entry.price === extremes.cheapest && delta < 0)
    return `Cheapest in the radius · undercuts you by ₹${gap}`;

  if (entry.price === extremes.priciest && delta > 0)
    return `Priciest in the radius · ₹${gap} above you`;

  if (entry.units && entry.units === extremes.topUnits)
    return `Biggest mover nearby · ${entry.units} units/mo`;

  if (peerAvg && entry.price > peerAvg) return "Above seller avg";
  if (peerAvg && entry.price < peerAvg) return "Below seller avg";
  return "At seller avg";
};

/**
 * The chart's peers, listed. Rows carry the exact gap against your price and a
 * one-line reason so the table answers "who do I react to" without the reader
 * having to hover every dot.
 */
const buildRows = (
  sellers: PeerEntry[],
  yourPrice: number,
  peerAvg: number,
): PeerRow[] => {
  const priced = sellers.filter((entry) => !!entry.price);
  if (!priced.length) return [];

  const extremes = {
    closestKm: Math.min(...priced.map((entry) => entry.distanceKm)),
    cheapest: Math.min(...priced.map((entry) => entry.price)),
    priciest: Math.max(...priced.map((entry) => entry.price)),
    topUnits: Math.max(...priced.map((entry) => entry.units)),
  };

  const rows = priced.map((entry) => {
    const name = entry.seller.sellerName?.trim() || "Retailer";
    const delta = yourPrice ? Number((entry.price - yourPrice).toFixed(2)) : 0;

    return {
      key:
        entry.seller.sellerId ||
        entry.seller.sellerRefId ||
        `peer-${entry.index}`,
      name,
      initial: name.charAt(0).toUpperCase(),
      town: String(
        entry.seller.town ||
          entry.seller.locality ||
          entry.seller.area ||
          entry.seller.city ||
          "",
      ).trim(),
      refId: String(entry.seller.sellerRefId || "").trim(),
      distanceKm: entry.distanceKm,
      distanceLabel: formatDistance(entry.distanceKm),
      price: entry.price,
      units: entry.units,
      kind: delta === 0 ? "level" : delta < 0 ? "cheaper" : "pricier",
      delta,
      deltaLabel: formatDelta(delta),
      signal: getSignal(entry, delta, peerAvg, extremes),
    } as PeerRow;
  });

  /* Left in the order the API sent them — the sort headers refetch. */
  return rows;
};

/**
 * Flatten the payload into plotted dots and axis ticks. Your own price is
 * plotted at distance 0 and every peer is coloured by how it prices against it;
 * dot size tracks monthly units so the peers that actually matter read biggest.
 * The x axis spans the furthest peer rather than the requested radius, which is
 * usually far wider than where the peers actually sit.
 */
export const normalizeInAndAround = (
  data: InAndAroundData | null | undefined,
): FormattedInAndAround => {
  const yourPrice = Number(data?.you?.price) || 0;
  const sellers = (data?.sellers || []).map((seller, index) => ({
    seller,
    index,
    price: Number(seller.price) || 0,
    distanceKm: Number(seller.distanceKm) || 0,
    units: Number(seller.monthlyUnits) || 0,
  }));

  const peerAvg =
    Number(data?.avgSellerPrice) ||
    (sellers.length
      ? sellers.reduce((sum, entry) => sum + entry.price, 0) / sellers.length
      : 0);

  const peersCount = Number(data?.sellersCount) || sellers.length;

  const bounds = getPriceBounds([
    ...sellers.map((entry) => entry.price),
    yourPrice,
    peerAvg,
  ]);

  /* Pad the furthest peer so its dot doesn't sit on the right rail. */
  const span =
    Math.max(...sellers.map((entry) => entry.distanceKm), 0) * 1.15 || 1;

  const maxUnits = Math.max(
    ...sellers.map((entry) => entry.units),
    Number(data?.you?.monthlyUnits) || 0,
  );

  const toY = (price: number) =>
    PLOT_BOTTOM -
    ((price - bounds.min) / (bounds.max - bounds.min)) *
      (PLOT_BOTTOM - PLOT_TOP);

  const toX = (km: number) =>
    PLOT_LEFT + Math.min(km / span, 1) * (PLOT_RIGHT - PLOT_LEFT);

  const toRadius = (units: number) => {
    if (!units || !maxUnits) return MIN_RADIUS;
    return MIN_RADIUS + (units / maxUnits) * (MAX_RADIUS - MIN_RADIUS);
  };

  const toPoint = (
    name: string,
    price: number,
    distanceKm: number,
    units: number,
    kind: ChartPoint["kind"],
    key: string,
  ): ChartPoint => {
    const parts = [name, formatDistance(distanceKm), `₹${price}`];
    if (units) parts.push(`${units} units/mo`);

    return {
      key,
      name,
      kind,
      price,
      distanceKm,
      units,
      x: toX(distanceKm),
      y: toY(price),
      r: toRadius(units),
      title: parts.join(" · "),
    };
  };

  const you = yourPrice
    ? toPoint(
        "You",
        yourPrice,
        0,
        Number(data?.you?.monthlyUnits) || 0,
        "you",
        "you",
      )
    : null;

  const points = sellers
    .filter((entry) => !!entry.price)
    .map((entry) =>
      toPoint(
        entry.seller.sellerName?.trim() || "Retailer",
        entry.price,
        entry.distanceKm,
        entry.units,
        /* The API names the relation; fall back to comparing prices. */
        entry.seller.relation === "cheaper" || entry.price <= yourPrice
          ? "cheaper"
          : "pricier",
        entry.seller.sellerId ||
          entry.seller.sellerRefId ||
          `peer-${entry.index}`,
      ),
    );

  const rows = buildRows(sellers, yourPrice, peerAvg);

  /* Three price gridlines — floor, middle and ceiling of the padded axis. */
  const priceTicks: AxisTick[] = [0, 0.5, 1].map((ratio) => {
    const value = Math.round(bounds.min + (bounds.max - bounds.min) * ratio);
    return { key: `price-${ratio}`, label: `₹${value}`, at: toY(value) };
  });

  const distanceTicks: AxisTick[] = Array.from(
    { length: DISTANCE_TICKS + 1 },
    (_, index) => {
      const km = (span / DISTANCE_TICKS) * index;
      return {
        key: `distance-${index}`,
        label: index === 0 ? "You" : formatDistance(km),
        at: toX(km),
      };
    },
  );

  return {
    hasData: !!points.length || !!you,
    points: you ? [you, ...points] : points,
    rows,
    you,
    yourPrice,
    yourPriceY: toY(yourPrice),
    peerAvg: Math.round(peerAvg),
    peerAvgY: toY(peerAvg),
    peersCount,
    peersLabel: peersCount === 1 ? "seller" : "sellers",
    radiusLabel: String(data?.distance || "").trim(),
    dealName: String(data?.dealName || "").trim(),
    priceTicks,
    distanceTicks,
  };
};
