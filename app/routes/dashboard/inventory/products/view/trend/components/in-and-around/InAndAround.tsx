import clsx from "clsx";
import { MapPinned, Tag } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import Amount from "~/components/core/amount/Amount";
import NoData from "~/components/core/no-data/NoData";
import ContentLoader from "~/components/core/page-loader/ContentLoader";
import SellerCatalogService from "~/services/SellerCatalogService";
import PricingTypeToggle from "~/shared/catalog/components/pricing-type-toggle/PricingTypeToggle";
import type { PricingType } from "~/shared/catalog/components/pricing-type-toggle/PricingTypeToggle";
import { getDetails } from "../../../helper";
import { normalizeInAndAround, PLOT, VIEW_HEIGHT, VIEW_WIDTH } from "./helper";
import type { ChartPoint, FormattedInAndAround } from "./helper";

/** Dot fill per kind — a lookup so the chart stays a plain property read. */
const DOT_FILL: Record<ChartPoint["kind"], string> = {
  you: "#0f766e",
  cheaper: "#14b8a6",
  pricier: "#f43f5e",
};

/** Legend entries, in the order they read on the chart. */
const LEGEND: { key: ChartPoint["kind"]; label: string }[] = [
  { key: "you", label: "You" },
  { key: "cheaper", label: "Cheaper seller" },
  { key: "pricier", label: "Pricier seller" },
];

const EMPTY: FormattedInAndAround = {
  hasData: false,
  points: [],
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
  priceTag: "",
};

export interface InAndAroundProps {
  /** Route deal id; falls back to the `id` route param. */
  dealId?: string;
  /** Radius searched, in metres. */
  distance?: number;
  /** History view requested — B2C by default. */
  view?: string;
  /** Price book the card opens on; the toggle switches it from there. */
  pricingType?: PricingType;
  /** Card heading; defaults to one named after the selected price book. */
  title?: string;
  /** Price being compared, named in the edit button — "CLUB". */
  priceTag?: string;
  /** Shown as "Edit {tag} price" when given. */
  onEdit?: () => void;
  className?: string;
}

/**
 * Retailers in and around — every peer within the radius plotted by how far
 * they are from you (x) against what they sell this deal for (y), with your own
 * price as the solid rule and the peer average as the dashed one. Dots are
 * coloured by which side of your price they fall on and sized by the units they
 * move, so the sellers worth reacting to stand out. Fetches its own data off the
 * route's deal id.
 */
const InAndAround = ({
  dealId,
  distance = 1000,
  view = "b2cInAndAround",
  pricingType = "b2c",
  title,
  priceTag,
  onEdit,
  className,
}: InAndAroundProps) => {
  const { id } = useParams();
  const target = dealId || id || "";

  const [selectedType, setSelectedType] = useState<PricingType>(pricingType);
  const [chart, setChart] = useState<FormattedInAndAround>(EMPTY);
  const [loading, setLoading] = useState(true);

  /**
   * The history endpoints are keyed by the seller-deal document id, not the
   * deal id in the route, so the deal has to be resolved first.
   */
  const fetchInAndAround = useCallback(async () => {
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
    const resp = await SellerCatalogService.getInAndAroundPrices(
      sellerDealObjId,
      { view, distance, pricingType: selectedType },
    );
    setChart(
      resp.statusCode === 200 ? normalizeInAndAround(resp.data?.data) : EMPTY,
    );
    setLoading(false);
  }, [target, view, distance, selectedType]);

  useEffect(() => {
    fetchInAndAround();
  }, [fetchInAndAround]);

  const tag = priceTag || chart.priceTag;
  const heading =
    title || `${selectedType.toUpperCase()} · retailers in and around`;

  return (
    <section
      className={clsx(
        "tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:py-3",
        className,
      )}
    >
      <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
        <div className="tw:min-w-0">
          <span className="tw:text-[13px] tw:font-bold tw:text-slate-800">
            {heading}
          </span>

          {!!chart.peersCount && (
            <span className="tw:text-[11px] tw:text-slate-400">
              {" "}
              · {chart.peersCount} {chart.peersLabel}
              {chart.radiusLabel ? ` within ${chart.radiusLabel}` : ""}
            </span>
          )}
          {!!chart.peerAvg && (
            <span className="tw:text-[11px] tw:text-slate-400">
              {" · "}avg{" "}
              <Amount
                value={chart.peerAvg}
                decimalPlaces={0}
                className="tw:font-semibold tw:text-slate-600"
              />
            </span>
          )}
        </div>

        <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-2">
          {/* Price book the sellers are compared on — swaps the whole card. */}
          <PricingTypeToggle active={selectedType} onChange={setSelectedType} />

          {!!onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="tw:flex tw:shrink-0 tw:items-center tw:gap-1.5 tw:rounded-lg tw:border tw:border-slate-200 tw:px-2.5 tw:py-1.5 tw:text-[11px] tw:font-bold tw:text-slate-700 hover:tw:border-teal-300 hover:tw:text-teal-700"
            >
              <Tag size={13} />
              Edit {tag ? `${tag} ` : ""}price
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <ContentLoader />
      ) : !chart.hasData ? (
        <NoData
          title="Retailers in and around"
          description="Retailers near you selling this product will appear here."
          icon={
            <div className="tw:p-4 tw:bg-slate-50 tw:rounded-full tw:border tw:border-slate-200">
              <MapPinned className="tw:text-slate-400" size={32} />
            </div>
          }
        />
      ) : (
        <>
          <div className="tw:mt-3 tw:border-t tw:border-slate-100 tw:pt-3">
            <svg
              viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
              className="tw:h-auto tw:w-full tw:overflow-visible"
              role="img"
              aria-label={`${chart.peersCount} ${chart.peersLabel} selling ${chart.dealName || "this product"}`}
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

              {/* Axis rails. */}
              <line
                x1={PLOT.left}
                x2={PLOT.left}
                y1={PLOT.top}
                y2={PLOT.bottom}
                stroke="#e2e8f0"
                strokeWidth={1}
              />
              <line
                x1={PLOT.left}
                x2={PLOT.right}
                y1={PLOT.bottom}
                y2={PLOT.bottom}
                stroke="#e2e8f0"
                strokeWidth={1}
              />

              <text
                x={-((PLOT.top + PLOT.bottom) / 2)}
                y={14}
                transform="rotate(-90)"
                textAnchor="middle"
                fontSize={7}
                letterSpacing={0.6}
                fill="#94a3b8"
              >
                SELLING PRICE
              </text>

              {/* Seller average — dashed rule, labelled at the right edge. */}
              {!!chart.peerAvg && (
                <g>
                  <line
                    x1={PLOT.left}
                    x2={PLOT.right}
                    y1={chart.peerAvgY}
                    y2={chart.peerAvgY}
                    stroke="#475569"
                    strokeWidth={1}
                    strokeDasharray="4 3"
                  />
                  <text
                    x={PLOT.right}
                    y={chart.peerAvgY - 5}
                    textAnchor="end"
                    fontSize={8}
                    fontWeight={700}
                    fill="#475569"
                  >
                    Seller avg ₹{chart.peerAvg}
                  </text>
                </g>
              )}

              {/* Your price — solid rule the sellers are read against. */}
              {!!chart.yourPrice && (
                <g>
                  <line
                    x1={PLOT.left}
                    x2={PLOT.right}
                    y1={chart.yourPriceY}
                    y2={chart.yourPriceY}
                    stroke="#0f766e"
                    strokeWidth={1.5}
                  />
                  <text
                    x={PLOT.left + 6}
                    y={chart.yourPriceY - 5}
                    fontSize={8}
                    fontWeight={700}
                    fill="#0f766e"
                  >
                    YOU ₹{chart.yourPrice}
                  </text>
                </g>
              )}

              {/* One dot per retailer, dropped to the axis so the distance reads. */}
              {chart.points.map((point) => (
                <g key={point.key}>
                  <line
                    x1={point.x}
                    x2={point.x}
                    y1={point.y}
                    y2={PLOT.bottom}
                    stroke={DOT_FILL[point.kind]}
                    strokeWidth={0.75}
                    strokeDasharray="2 3"
                    opacity={0.35}
                  />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={point.r}
                    fill={DOT_FILL[point.kind]}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  >
                    <title>{point.title}</title>
                  </circle>
                </g>
              ))}

              {/* Distance ticks along the bottom. */}
              {chart.distanceTicks.map((tick) => (
                <text
                  key={tick.key}
                  x={tick.at}
                  y={PLOT.bottom + 14}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#94a3b8"
                >
                  {tick.label}
                </text>
              ))}

              <text
                x={(PLOT.left + PLOT.right) / 2}
                y={VIEW_HEIGHT - 6}
                textAnchor="middle"
                fontSize={7}
                letterSpacing={0.6}
                fill="#94a3b8"
              >
                DISTANCE FROM YOU →
              </text>
            </svg>
          </div>

          <div className="tw:mt-1 tw:flex tw:flex-wrap tw:items-center tw:justify-center tw:gap-x-4 tw:gap-y-1 tw:text-[11px] tw:text-slate-500">
            {LEGEND.map((entry) => (
              <span
                key={entry.key}
                className="tw:flex tw:items-center tw:gap-1.5"
              >
                <span
                  className="tw:size-2.5 tw:rounded-full"
                  style={{ backgroundColor: DOT_FILL[entry.key] }}
                />
                {entry.label}
              </span>
            ))}
            <span className="tw:text-slate-400">
              · dot size ≈ their monthly units
            </span>
          </div>
        </>
      )}
    </section>
  );
};

export default InAndAround;
