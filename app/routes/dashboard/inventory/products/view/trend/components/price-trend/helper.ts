/**
 * Price trend — `GET catalog/seller-deals/{dealId}/price-history
 * ?view=priceTrend&weeks=6&distance=1km`.
 *
 * One point per week for your price, the peer average and the SK cost. Any of
 * the three can be null on a given week (a peer average only exists once peers
 * are found), so each line is built from the weeks it actually has and drawn as
 * its own path — a gap breaks the line rather than dropping it to zero.
 */

/**
 * One week of the series, as the API sends it. The peer average arrives under
 * more than one spelling depending on the view, so every alias is declared and
 * read through {@link SERIES}.
 */
export interface PriceTrendPoint {
  label?: string;
  at?: string;
  you?: number | null;
  peerAvg?: number | null;
  sellersAvg?: number | null;
  sellerAvg?: number | null;
  peersAvg?: number | null;
  skCost?: number | null;
  cost?: number | null;
  [key: string]: unknown;
}

/** Price trend payload. */
export interface PriceTrend {
  success?: boolean;
  sellerDealObjId?: string;
  dealId?: string;
  dealRefId?: string;
  dealName?: string;
  view?: string;
  weeks?: number;
  series?: PriceTrendPoint[];
}

/** The three lines on the chart. */
export type SeriesKey = "you" | "peerAvg" | "skCost";

/** A plotted point — already in view units. */
export interface TrendDot {
  key: string;
  label: string;
  value: number;
  x: number;
  y: number;
  /** Hover text — "2 wks ago · ₹193". */
  title: string;
}

/** One line, ready to render. */
export interface TrendLine {
  key: SeriesKey;
  label: string;
  /** Path drawn through the weeks that have a value. */
  path: string;
  /** Closed path under the line — only the `you` line is filled. */
  areaPath: string;
  dots: TrendDot[];
  /** Latest value on the line, used in the summary. */
  last: number;
}

/** A labelled tick on either axis. */
export interface AxisTick {
  key: string;
  label: string;
  /** View coordinate — `y` for price, `x` for the week. */
  at: number;
}

/** The whole chart, ready to render. */
export interface FormattedPriceTrend {
  hasData: boolean;
  lines: TrendLine[];
  priceTicks: AxisTick[];
  weekTicks: AxisTick[];
  /** Weeks actually covered — drives the "· 6 weeks" heading. */
  weeks: number;
}

/* Chart geometry, in view units — the SVG scales to its container. */
export const VIEW_WIDTH = 640;
export const VIEW_HEIGHT = 220;
const PLOT_LEFT = 54;
const PLOT_RIGHT = VIEW_WIDTH - 14;
const PLOT_TOP = 18;
const PLOT_BOTTOM = VIEW_HEIGHT - 34;

export const PLOT = {
  left: PLOT_LEFT,
  right: PLOT_RIGHT,
  top: PLOT_TOP,
  bottom: PLOT_BOTTOM,
};

/**
 * Lines in the order they read on the chart and in the legend, each with the
 * field names it can arrive under — the peer average is `sellersAvg` on some
 * deals and `peerAvg` on others.
 */
export const SERIES: { key: SeriesKey; label: string; fields: string[] }[] = [
  { key: "you", label: "You", fields: ["you"] },
  {
    key: "peerAvg",
    label: "Seller avg",
    fields: ["peerAvg", "sellersAvg", "sellerAvg", "peersAvg"],
  },
  { key: "skCost", label: "SK cost", fields: ["skCost", "cost"] },
];

/** First finite reading among the aliases — nulls and misses stay gaps. */
const readValue = (point: PriceTrendPoint, fields: string[]) => {
  for (const field of fields) {
    const value = point[field];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
};

/**
 * Price axis bounds. The three lines usually sit within a few rupees of each
 * other, so the axis is padded around the spread rather than started at zero —
 * a zero baseline flattens the whole trend into one straight band.
 */
const getPriceBounds = (values: number[]) => {
  if (!values.length) return { min: 0, max: 1 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return { min: min - 1, max: max + 1 };
  const pad = (max - min) * 0.15;
  return { min: min - pad, max: max + pad };
};

/**
 * Flatten the payload into one path per series plus axis ticks. Each line is
 * plotted only across the weeks it has a value for, so a series the API has no
 * data for yet simply doesn't render.
 */
export const normalizePriceTrend = (
  data: PriceTrend | null | undefined,
): FormattedPriceTrend => {
  const series = data?.series || [];

  const values = series.flatMap((point) =>
    SERIES.map((entry) => readValue(point, entry.fields)).filter(
      (value): value is number => value !== null,
    ),
  );

  if (!series.length || !values.length) {
    return { hasData: false, lines: [], priceTicks: [], weekTicks: [], weeks: 0 };
  }

  const bounds = getPriceBounds(values);
  const span = Math.max(series.length - 1, 1);

  const toY = (price: number) =>
    PLOT_BOTTOM -
    ((price - bounds.min) / (bounds.max - bounds.min)) *
      (PLOT_BOTTOM - PLOT_TOP);

  const toX = (index: number) =>
    PLOT_LEFT + (index / span) * (PLOT_RIGHT - PLOT_LEFT);

  const lines = SERIES.map(({ key, label, fields }) => {
    const dots = series
      .map((point, index) => {
        const value = readValue(point, fields);
        if (value === null) return null;
        const weekLabel = point.label || `week ${index + 1}`;
        return {
          key: `${key}-${index}`,
          label: weekLabel,
          value,
          x: toX(index),
          y: toY(value),
          title: `${weekLabel} · ₹${Math.round(value)}`,
        };
      })
      .filter((dot): dot is TrendDot => dot !== null);

    const path = dots
      .map((dot, index) => `${index ? "L" : "M"}${dot.x} ${dot.y}`)
      .join(" ");

    const areaPath = dots.length
      ? `${path} L${dots[dots.length - 1].x} ${PLOT_BOTTOM} L${dots[0].x} ${PLOT_BOTTOM} Z`
      : "";

    return {
      key,
      label,
      path,
      areaPath,
      dots,
      last: dots.length ? dots[dots.length - 1].value : 0,
    };
  }).filter((line) => !!line.dots.length);

  /* Three price gridlines — floor, middle and ceiling of the padded axis. */
  const priceTicks: AxisTick[] = [0, 0.5, 1].map((ratio) => {
    const value = Math.round(bounds.min + (bounds.max - bounds.min) * ratio);
    return { key: `price-${ratio}`, label: `₹${value}`, at: toY(value) };
  });

  const weekTicks: AxisTick[] = series.map((point, index) => ({
    key: `week-${index}`,
    label: point.label || `W${index + 1}`,
    at: toX(index),
  }));

  return {
    hasData: !!lines.length,
    lines,
    priceTicks,
    weekTicks,
    weeks: data?.weeks || Math.max(series.length - 1, 0),
  };
};
