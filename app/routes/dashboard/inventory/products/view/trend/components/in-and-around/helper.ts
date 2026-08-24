/**
 * Retailers in and around — `GET catalog/seller-deals/{dealId}/price-history
 * ?view=b2cInAndAround&distance=1000`.
 *
 * Response shape:
 * { sellerDealObjId, dealId, dealRefId, dealName, view, distance: "1000km",
 *   sellersCount, avgSellerPrice, you: { price }, sellers: [...] }
 */

/** One retailer on the chart, as the API sends it. */
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
}

/** In-and-around payload. */
export interface InAndAround {
  success?: boolean;
  sellerDealObjId?: string;
  dealId?: string;
  dealRefId?: string;
  dealName?: string;
  view?: string;
  /** Radius searched, as a label — "1000km". */
  distance?: string;
  sellersCount?: number;
  /** Average selling price across the sellers. */
  avgSellerPrice?: number;
  /** Your own price, so it can be plotted at distance 0. */
  you?: { price?: number; monthlyUnits?: number };
  sellers?: InAndAroundSeller[];
}

/** A plotted retailer — everything the SVG needs, already in view units. */
export interface ChartPoint {
  key: string;
  name: string;
  /** "you" is the seller's own dot; sellers split by how they price against you. */
  kind: "you" | "cheaper" | "pricier";
  price: number;
  /** Kilometres from you. */
  distanceKm: number;
  units: number;
  x: number;
  y: number;
  /** Dot radius, scaled by monthly units. */
  r: number;
  /** Hover text — "Kumar Stores · 1.7km · ₹62 · 48 units/mo". */
  title: string;
}

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
  /** Your own dot, also present in `points`. */
  you: ChartPoint | null;
  yourPrice: number;
  /** Baseline at your price — the solid rule. */
  yourPriceY: number;
  peerAvg: number;
  /** Baseline at the peer average — the dashed rule. */
  peerAvgY: number;
  peersCount: number;
  /** "10 sellers" / "1 seller". */
  peersLabel: string;
  /** Radius searched, as the API labels it — "1000km". */
  radiusLabel: string;
  /** Product the chart is for, straight off the payload. */
  dealName: string;
  priceTicks: AxisTick[];
  distanceTicks: AxisTick[];
  priceTag: string;
}

/* Chart geometry, in view units — the SVG scales to its container. */
export const VIEW_WIDTH = 640;
export const VIEW_HEIGHT = 220;
const PLOT_LEFT = 54;
const PLOT_RIGHT = VIEW_WIDTH - 14;
const PLOT_TOP = 18;
const PLOT_BOTTOM = VIEW_HEIGHT - 38;

export const PLOT = {
  left: PLOT_LEFT,
  right: PLOT_RIGHT,
  top: PLOT_TOP,
  bottom: PLOT_BOTTOM,
};

/** Dot radii, smallest to largest seller by monthly units. */
const MIN_RADIUS = 4;
const MAX_RADIUS = 9;
/** Distance gridlines between "You" and the furthest seller. */
const DISTANCE_TICKS = 4;

/** "1.7km" past a kilometre, "320m" below it. */
export const formatDistance = (km: number) => {
  if (!km) return "0m";
  if (km >= 1) return `${Number(km.toFixed(km >= 10 ? 0 : 1))}km`;
  return `${Math.round(km * 1000)}m`;
};

/**
 * Price axis bounds. Sellers cluster within a few rupees of each other, so the
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

/**
 * Flatten the payload into plotted dots and axis ticks. Your own price is
 * plotted at distance 0 and every seller is coloured by how it prices against
 * it; dot size tracks monthly units so the sellers that actually matter read
 * biggest. The x axis spans the furthest seller rather than the requested
 * radius, which is far wider than where the sellers actually sit.
 */
export const normalizeInAndAround = (
  data: InAndAround | null | undefined,
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

  /* Pad the furthest seller so its dot doesn't sit on the right rail. */
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
        entry.seller.sellerName?.trim() || "Seller",
        entry.price,
        entry.distanceKm,
        entry.units,
        /* The API names the relation; fall back to comparing prices. */
        entry.seller.relation === "cheaper" || entry.price <= yourPrice
          ? "cheaper"
          : "pricier",
        entry.seller.sellerId || entry.seller.sellerRefId || `seller-${entry.index}`,
      ),
    );

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
    priceTag: "",
  };
};
