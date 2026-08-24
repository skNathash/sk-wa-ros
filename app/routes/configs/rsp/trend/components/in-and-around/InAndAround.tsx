import clsx from "clsx";
import { MapPinned } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import NoData from "~/components/core/no-data/NoData";
import ContentLoader from "~/components/core/page-loader/ContentLoader";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { TableHeaderItem } from "~/types/CommonTypes";
import PricingTypeToggle from "~/shared/catalog/components/pricing-type-toggle/PricingTypeToggle";
import type { PricingType } from "~/shared/catalog/components/pricing-type-toggle/PricingTypeToggle";
import {
  emptyChart,
  normalizeInAndAround,
  PEER_SORT,
  PLOT,
  resolveSellerDealObjId,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  type ChartPoint,
  type FormattedInAndAround,
  type PeerRow,
} from "./helper";

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

/** Row accents — the table reads in the same colours as the dots. */
const ROW_TONE: Record<
  PeerRow["kind"],
  { avatar: string; delta: string; label: string }
> = {
  cheaper: {
    avatar: "tw:bg-teal-500",
    delta: "tw:text-teal-600",
    label: "below you",
  },
  pricier: {
    avatar: "tw:bg-rose-500",
    delta: "tw:text-rose-600",
    label: "above you",
  },
  level: {
    avatar: "tw:bg-slate-400",
    delta: "tw:text-slate-500",
    label: "same as you",
  },
};

/** Header text — the same small caps the deal list's section labels read in. */
const HEADER_CLASS =
  "tw:bg-slate-50 tw:text-[10px] tw:font-semibold tw:tracking-wide tw:text-slate-500 tw:uppercase";

/** Peer table columns — the API orders by distance, so no header sorts. */
const HEADERS: TableHeaderItem[] = [
  {
    label: "Retailer · town",
    key: "name",
    width: "34%",
    className: HEADER_CLASS,
  },
  {
    label: "Distance",
    key: "distance",
    isRightAligned: true,
    width: "14%",
    className: HEADER_CLASS,
  },
  {
    label: "Their price",
    key: "price",
    isRightAligned: true,
    width: "14%",
    className: HEADER_CLASS,
  },
  {
    label: "Vs you",
    key: "delta",
    isRightAligned: true,
    width: "12%",
    className: HEADER_CLASS,
  },
  /* Sits right after a right-aligned column — the extra gutter keeps the two
     labels from reading as one word. */
  {
    label: "Signal",
    key: "signal",
    width: "26%",
    className: `${HEADER_CLASS} tw:pl-5`,
  },
];

const TABLE_CONTAINER_STYLE = { maxHeight: "320px" };

export interface InAndAroundProps {
  /** Deal id of the SKU picked in the list. */
  dealId?: string;
  /** Seller-deal document id, when the picked row already carries it. */
  sellerDealObjId?: string;
  /** Channel the card opens on — the toggle switches it from there. */
  pricingType?: PricingType;
  /** Radius searched, in metres. */
  distance?: number;
  /** History view requested. */
  view?: string;
  className?: string;
}

/**
 * Retailers in and around — every peer within the radius plotted by how far
 * they are from you (x) against what they sell this SKU for (y), with your own
 * price as the solid rule and the peer average as the dashed one. Dots are
 * coloured by which side of your price they fall on and sized by the units they
 * move, so the peers worth reacting to stand out.
 *
 * Trend watch's copy of the product-view card: the SKU comes from the picker
 * beside it, and the card carries its own B2C / B2B toggle so the two price
 * books can be compared without leaving the screen. The screen's channel cards
 * only decide which book it opens on.
 */
const InAndAround = ({
  dealId,
  sellerDealObjId,
  pricingType = "b2c",
  distance = 1000,
  view = "b2cInAndAround",
  className,
}: InAndAroundProps) => {
  const [selectedType, setSelectedType] = useState<PricingType>(pricingType);
  const [chart, setChart] = useState<FormattedInAndAround>(emptyChart);
  const [loading, setLoading] = useState(true);

  const fetchInAndAround = useCallback(async () => {
    if (!dealId && !sellerDealObjId) {
      setChart(emptyChart());
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const target =
        sellerDealObjId || (await resolveSellerDealObjId(dealId || ""));

      if (!target) {
        setChart(emptyChart());
        return;
      }

      const resp = await SellerCatalogService.getInAndAroundPrices(target, {
        view,
        distance,
        pricingType: selectedType,
        sort: PEER_SORT,
      });

      setChart(
        resp.statusCode === 200
          ? normalizeInAndAround(resp.data?.data)
          : emptyChart(),
      );
    } catch (error) {
      console.error("Error loading in-and-around prices:", error);
      setChart(emptyChart());
    } finally {
      setLoading(false);
    }
  }, [dealId, sellerDealObjId, view, distance, selectedType]);

  useEffect(() => {
    fetchInAndAround();
  }, [fetchInAndAround]);

  /* The screen's channel cards decide which book the card opens on; switching
     them re-seeds the toggle. */
  useEffect(() => {
    setSelectedType(pricingType);
  }, [pricingType]);

  const heading = `${selectedType.toUpperCase()} · retailers in and around`;

  return (
    <section
      className={clsx(
        "tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white",
        className,
      )}
    >
      <div className="tw:flex tw:items-start tw:justify-between tw:gap-3 tw:border-b tw:border-slate-100 tw:px-4 tw:py-3">
        <div className="tw:min-w-0">
          <span className="tw:text-[13px] tw:font-bold tw:text-slate-800">
            {heading}
          </span>
          <span className="tw:text-[11px] tw:text-slate-400">
            {" "}
            · selling price map
            {chart.peersCount
              ? ` · ${chart.peersCount} ${chart.peersLabel}${
                  chart.radiusLabel ? ` within ${chart.radiusLabel}` : ""
                }`
              : ""}
          </span>
        </div>

        <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-2.5">
          {/* Headline figures — the two numbers the chart is read against. */}
          {!!(chart.peerAvg || chart.yourPrice) && (
            <div className="tw:text-[11px] tw:font-bold tw:tracking-wide tw:text-teal-700 tw:uppercase">
              {!!chart.peerAvg && <span>Avg ₹{chart.peerAvg}</span>}
              {!!chart.peerAvg && !!chart.yourPrice && (
                <span className="tw:text-slate-300"> · </span>
              )}
              {!!chart.yourPrice && <span>You ₹{chart.yourPrice}</span>}
            </div>
          )}

          {/* Price book the peers are compared on — swaps the whole card. */}
          <PricingTypeToggle active={selectedType} onChange={setSelectedType} />
        </div>
      </div>

      {loading ? (
        <ContentLoader />
      ) : !chart.hasData ? (
        <NoData
          title="Retailers in and around"
          description="Retailers near you selling this product will appear here."
          icon={
            <div className="tw:rounded-full tw:border tw:border-slate-200 tw:bg-slate-50 tw:p-4">
              <MapPinned className="tw:text-slate-400" size={32} />
            </div>
          }
        />
      ) : (
        <>
          <div className="tw:px-4 tw:pt-4">
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
                    strokeDasharray="3 3"
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

              {/* Peer average — dashed rule, labelled at the right edge. */}
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

              {/* Your price — solid rule the peers are read against. */}
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
                    y={chart.yourPriceY - 6}
                    fontSize={9}
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
                  y={PLOT.bottom + 16}
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
                fontWeight={700}
                fill="#94a3b8"
              >
                DISTANCE FROM YOU →
              </text>
            </svg>
          </div>

          <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-center tw:gap-x-4 tw:gap-y-1 tw:px-4 tw:pt-1 tw:pb-3 tw:text-[11px] tw:text-slate-500">
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

          {/* The same peers, listed — the chart shows the spread, the table
              names who sits where and by how much. Below md the columns have
              nowhere to go, so each peer reads as a card instead. */}
          {!!chart.rows.length && (
            <div className="tw:hidden tw:border-t tw:border-slate-100 tw:md:block">
              <AppTable
                container
                responsive
                stickyHeader
                containerStyle={TABLE_CONTAINER_STYLE}
              >
                <AppTable.Header>
                  <TableHeader headers={HEADERS} />
                </AppTable.Header>

                <AppTable.Body>
                  {chart.rows.map((row) => (
                    <AppTable.Row key={row.key}>
                      <AppTable.Cell>
                        <div className="tw:flex tw:items-center tw:gap-2.5">
                          <span
                            className={clsx(
                              "tw:flex tw:size-6 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-[10px] tw:font-bold tw:text-white",
                              ROW_TONE[row.kind].avatar,
                            )}
                          >
                            {row.initial}
                          </span>
                          <div className="tw:min-w-0">
                            <div className="tw:line-clamp-1 tw:font-semibold">
                              {row.name}
                            </div>
                            {!!(row.town || row.refId) && (
                              <div className="tw:line-clamp-1 tw:text-xs tw:text-gray-400">
                                {row.town || row.refId}
                              </div>
                            )}
                          </div>
                        </div>
                      </AppTable.Cell>

                      <AppTable.Cell className="tw:text-right tw:text-gray-500">
                        {row.distanceLabel}
                      </AppTable.Cell>

                      <AppTable.Cell className="tw:text-right tw:font-semibold">
                        ₹{row.price}
                      </AppTable.Cell>

                      <AppTable.Cell
                        className={clsx(
                          "tw:text-right tw:font-semibold",
                          ROW_TONE[row.kind].delta,
                        )}
                      >
                        <span title={ROW_TONE[row.kind].label}>
                          {row.deltaLabel}
                        </span>
                      </AppTable.Cell>

                      <AppTable.Cell className="tw:pl-5 tw:text-xs tw:text-gray-500">
                        {row.signal}
                      </AppTable.Cell>
                    </AppTable.Row>
                  ))}
                </AppTable.Body>
              </AppTable>
            </div>
          )}

          {/* Mobile peer list — the table's five columns as one card per peer,
              square-cornered so it can run to the screen edges inside a bled
              parent. */}
          {!!chart.rows.length && (
            <div className="tw:divide-y tw:divide-slate-100 tw:border-t tw:border-slate-100 tw:md:hidden">
              {chart.rows.map((row) => (
                <div key={row.key} className="tw:flex tw:gap-2.5 tw:px-4 tw:py-3">
                  <span
                    className={clsx(
                      "tw:flex tw:size-7 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-[11px] tw:font-bold tw:text-white",
                      ROW_TONE[row.kind].avatar,
                    )}
                  >
                    {row.initial}
                  </span>

                  <div className="tw:min-w-0 tw:flex-1">
                    <div className="tw:flex tw:items-start tw:justify-between tw:gap-2">
                      <div className="tw:min-w-0">
                        <div className="tw:truncate tw:text-[13px] tw:font-semibold tw:text-slate-800">
                          {row.name}
                        </div>
                        {!!(row.town || row.refId) && (
                          <div className="tw:truncate tw:text-[11px] tw:text-slate-400">
                            {row.town || row.refId}
                          </div>
                        )}
                      </div>

                      <div className="tw:shrink-0 tw:text-right">
                        <div className="tw:text-[13px] tw:font-bold tw:text-slate-800">
                          ₹{row.price}
                        </div>
                        <div
                          className={clsx(
                            "tw:text-[11px] tw:font-bold",
                            ROW_TONE[row.kind].delta,
                          )}
                        >
                          {row.deltaLabel} · {ROW_TONE[row.kind].label}
                        </div>
                      </div>
                    </div>

                    <div className="tw:mt-1 tw:flex tw:flex-wrap tw:items-center tw:gap-x-2 tw:gap-y-0.5 tw:text-[11px] tw:text-slate-500">
                      <span className="tw:whitespace-nowrap tw:font-semibold tw:text-slate-600">
                        {row.distanceLabel}
                      </span>
                      {!!row.signal && <span>{row.signal}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default InAndAround;
