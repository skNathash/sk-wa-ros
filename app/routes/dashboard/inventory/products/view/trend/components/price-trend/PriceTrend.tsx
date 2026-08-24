import clsx from "clsx";
import { LineChart } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import NoData from "~/components/core/no-data/NoData";
import ContentLoader from "~/components/core/page-loader/ContentLoader";
import SellerCatalogService from "~/services/SellerCatalogService";
import PricingTypeToggle from "~/shared/catalog/components/pricing-type-toggle/PricingTypeToggle";
import type { PricingType } from "~/shared/catalog/components/pricing-type-toggle/PricingTypeToggle";
import { getDetails } from "../../../helper";
import {
  normalizePriceTrend,
  PLOT,
  SERIES,
  VIEW_HEIGHT,
  VIEW_WIDTH,
} from "./helper";
import type { FormattedPriceTrend, SeriesKey } from "./helper";

/** Stroke per series — a lookup so the chart stays a plain property read. */
const STROKE: Record<SeriesKey, string> = {
  you: "#0f766e",
  peerAvg: "#8b5cf6",
  skCost: "#64748b",
};

/** The SK cost is a reference floor, so it reads as a dashed rule. */
const DASH: Partial<Record<SeriesKey, string>> = {
  skCost: "4 3",
};

const EMPTY: FormattedPriceTrend = {
  hasData: false,
  lines: [],
  priceTicks: [],
  weekTicks: [],
  weeks: 0,
};

export interface PriceTrendProps {
  /** Route deal id; falls back to the `id` route param. */
  dealId?: string;
  /** Weeks of history requested. */
  weeks?: number;
  /** Peer radius the peer average is drawn from. */
  distance?: number | string;
  /** Price book the card opens on; the toggle switches it from there. */
  pricingType?: PricingType;
  /** Card heading. */
  title?: string;
  className?: string;
}

/**
 * Price trend — your selling price week by week against the peer average and
 * the SK cost, so a drift apart from the market reads at a glance. Your line is
 * filled down to the axis; the SK cost stays dashed because it is a floor to
 * price against rather than a competing price. Fetches its own data off the
 * route's deal id.
 */
const PriceTrend = ({
  dealId,
  weeks = 6,
  distance = "1km",
  pricingType = "b2c",
  title = "Price trend",
  className,
}: PriceTrendProps) => {
  const { id } = useParams();
  const target = dealId || id || "";

  const [selectedType, setSelectedType] = useState<PricingType>(pricingType);
  const [chart, setChart] = useState<FormattedPriceTrend>(EMPTY);
  const [loading, setLoading] = useState(true);

  /**
   * The history endpoints are keyed by the seller-deal document id, not the
   * deal id in the route, so the deal has to be resolved first.
   */
  const fetchTrend = useCallback(async () => {
    if (!target) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const deal = await getDetails(target);
    const sellerDealObjId = deal?.sellerDealObjId || "";
    if (!sellerDealObjId) {
      setChart(EMPTY);
      setLoading(false);
      return;
    }
    const resp = await SellerCatalogService.getPriceTrend(sellerDealObjId, {
      weeks,
      distance,
      pricingType: selectedType,
    });
    setChart(
      resp.statusCode === 200 ? normalizePriceTrend(resp.data?.data) : EMPTY,
    );
    setLoading(false);
  }, [target, weeks, distance, selectedType]);

  useEffect(() => {
    fetchTrend();
  }, [fetchTrend]);

  const heading = `${selectedType.toUpperCase()} · ${title}`;

  return (
    <section
      className={clsx(
        "tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:py-3",
        className,
      )}
    >
      {/* Title and legend share a row when there is room and stack when there
          is not, so the heading never breaks mid-sentence. */}
      <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-x-3 tw:gap-y-1">
        <div className="tw:min-w-0">
          <span className="tw:text-[13px] tw:font-bold tw:text-slate-800">
            {heading}
            {!!chart.weeks && ` · ${chart.weeks} weeks`}
          </span>
          <span className="tw:whitespace-nowrap tw:text-[11px] tw:text-slate-400">
            {" "}
            · YOU vs seller avg vs SK cost
          </span>
        </div>

        {/* Price book the trend is drawn from — swaps the whole card. */}
        <PricingTypeToggle active={selectedType} onChange={setSelectedType} />

        <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-x-3 tw:text-[11px] tw:text-slate-500">
          {/* All three series stay in the legend even when the API has no
              readings for one yet, so the chart always says what it compares —
              the missing ones dim rather than disappear. */}
          {SERIES.map((entry) => {
            const plotted = chart.lines.some((line) => line.key === entry.key);
            return (
              <span
                key={entry.key}
                className={clsx(
                  "tw:flex tw:items-center tw:gap-1.5",
                  !plotted && "tw:opacity-40",
                )}
                title={plotted ? undefined : `No ${entry.label} data yet`}
              >
                <svg width={14} height={8} aria-hidden="true">
                  <line
                    x1={0}
                    x2={14}
                    y1={4}
                    y2={4}
                    stroke={STROKE[entry.key]}
                    strokeWidth={2}
                    strokeDasharray={DASH[entry.key]}
                  />
                </svg>
                {entry.label}
              </span>
            );
          })}
        </div>
      </div>

      {loading ? (
        <ContentLoader />
      ) : !chart.hasData ? (
        <NoData
          title="Price trend"
          description="Your price against sellers over the last few weeks will appear here."
          icon={
            <div className="tw:p-4 tw:bg-slate-50 tw:rounded-full tw:border tw:border-slate-200">
              <LineChart className="tw:text-slate-400" size={32} />
            </div>
          }
        />
      ) : (
        <div className="tw:mt-3 tw:border-t tw:border-slate-100 tw:pt-3">
          <svg
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            className="tw:h-auto tw:w-full tw:overflow-visible"
            role="img"
            aria-label={`Price trend over the last ${chart.weeks} weeks`}
          >
            {/* Price gridlines and their labels. */}
            {chart.priceTicks.map((tick) => (
              <g key={tick.key}>
                <line
                  x1={PLOT.left}
                  x2={PLOT.right}
                  y1={tick.at}
                  y2={tick.at}
                  stroke="#f1f5f9"
                  strokeWidth={1}
                />
                <text
                  x={PLOT.left - 8}
                  y={tick.at + 3}
                  textAnchor="end"
                  fontSize={9}
                  fill="#94a3b8"
                >
                  {tick.label}
                </text>
              </g>
            ))}

            {/* Baseline only — the price labels carry the left edge. */}
            <line
              x1={PLOT.left}
              x2={PLOT.right}
              y1={PLOT.bottom}
              y2={PLOT.bottom}
              stroke="#e2e8f0"
              strokeWidth={1}
            />

            {/* Your line is filled to the axis so it reads as the subject. */}
            {chart.lines
              .filter((line) => line.key === "you")
              .map((line) => (
                <path
                  key={`area-${line.key}`}
                  d={line.areaPath}
                  fill={STROKE.you}
                  opacity={0.12}
                />
              ))}

            {chart.lines.map((line) => (
              <g key={line.key}>
                <path
                  d={line.path}
                  fill="none"
                  stroke={STROKE[line.key]}
                  strokeWidth={line.key === "skCost" ? 1.25 : 2}
                  strokeDasharray={DASH[line.key]}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* The SK cost is a reference, so only the priced lines carry dots. */}
                {line.key !== "skCost" &&
                  line.dots.map((dot) => (
                    <circle
                      key={dot.key}
                      cx={dot.x}
                      cy={dot.y}
                      r={3.5}
                      fill="#ffffff"
                      stroke={STROKE[line.key]}
                      strokeWidth={2}
                    >
                      <title>
                        {line.label} · {dot.title}
                      </title>
                    </circle>
                  ))}
              </g>
            ))}

            {/* Week labels along the bottom — "today" is the one to land on. */}
            {chart.weekTicks.map((tick, index) => (
              <text
                key={tick.key}
                x={tick.at}
                y={PLOT.bottom + 15}
                textAnchor={
                  index === 0
                    ? "start"
                    : index === chart.weekTicks.length - 1
                      ? "end"
                      : "middle"
                }
                fontSize={9}
                fontWeight={index === chart.weekTicks.length - 1 ? 700 : 400}
                fill={
                  index === chart.weekTicks.length - 1 ? "#0f766e" : "#94a3b8"
                }
              >
                {tick.label}
              </text>
            ))}
          </svg>
        </div>
      )}
    </section>
  );
};

export default PriceTrend;
