import clsx from "clsx";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import CommonService from "~/services/CommonService";
import SellerCatalogService from "~/services/SellerCatalogService";
import ToasterService from "~/services/ToasterService";
import type { SellerDeal } from "~/types/CommonTypes";
import MarketVerdict from "./MarketVerdict";

/**
 * Competitor price intelligence — shows what marketplaces are charging for the
 * same product so the retailer can price with the market in view.
 *
 * Reads the pre-shaped `partnerPriceData` (Amazon/Flipkart named slots + any
 * `others`) and compares each against the retailer's selling `price` (B2B or
 * B2C, whichever the caller is editing).
 *
 * Layout: a header row carrying the market verdict (cheaper/costlier than the
 * cheapest competitor) plus an inline refresh control, then a grid of
 * competitors — name on the left, direction arrow + price on the right.
 * Flipkart and Amazon stay visible; any remaining marketplaces tuck behind a
 * "view others" toggle so the card stays short.
 */

export interface PartnerOnlinePrice {
  name: string;
  price?: number;
  lastSynced?: string;
  isActive?: boolean;
  lastPrice?: number;
  productUrl?: string;
  /** Cheapest active price across competitors — sourced from `partnerPriceData`. */
  isLowest?: boolean;
}

type PartnerPriceData = SellerDeal["partnerPriceData"];

// Brand tints for known marketplaces; anything else falls back to a colour
// derived from its name so each row stays visually distinct and stable.
const BRAND_COLORS: Record<string, string> = {
  amazon: "#FF9900",
  flipkart: "#2874F0",
  bigbasket: "#84C225",
  smartprix: "#1A73E8",
  oppo: "#046A38",
};

const FALLBACK_COLORS = [
  "#6366F1",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#EF4444",
  "#8B5CF6",
];

const hashString = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

export const colorFor = (name: string) => {
  const key = name.trim().toLowerCase().split(/\s+/)[0];
  if (BRAND_COLORS[key]) return BRAND_COLORS[key];
  return FALLBACK_COLORS[hashString(name) % FALLBACK_COLORS.length];
};

/**
 * Flattens the raw `partnerOnlinePrices` feed into the list shape the cells
 * table reads. Prefers the pre-shaped `partnerPriceData` when present (carrying
 * each entry's `isLowest` flag and listing `url`), falling back to filtering the
 * raw feed for active, priced entries.
 */
export const getCompetitorPrices = (deal: any): PartnerOnlinePrice[] => {
  const data = deal?.partnerPriceData as PartnerPriceData | undefined;
  if (data) {
    const out: PartnerOnlinePrice[] = [];
    const push = (
      name: string,
      entry?: { price: number; isLowest: boolean; url?: string } | null,
    ) => {
      if (!entry) return;
      out.push({
        name,
        price: entry.price,
        isLowest: entry.isLowest,
        productUrl: entry.url,
      });
    };
    push("Flipkart", data.flipkart);
    push("Amazon", data.amazon);
    push("Other Online Price", data.other);
    (data.others || []).forEach((o) =>
      push(o.name, { price: o.price, isLowest: o.isLowest, url: o.url }),
    );
    return out;
  }

  const partners: PartnerOnlinePrice[] = deal?.partnerOnlinePrices || [];
  return partners.filter((p) => p?.isActive !== false && Number(p?.price) > 0);
};

export const Monogram = ({
  label,
  color,
}: {
  label: string;
  color: string;
}) => (
  <span
    className="tw:inline-flex tw:h-5 tw:w-5 tw:items-center tw:justify-center tw:rounded tw:text-[11px] tw:font-bold tw:text-white"
    style={{ backgroundColor: color }}
  >
    {label.charAt(0)}
  </span>
);

/**
 * Tiny directional marker showing how the retailer's price compares to one
 * competitor. Up/red = you're pricier, down/green = you're cheaper. Renders
 * nothing when either side is missing or they're within ₹1 (effectively equal).
 */
export const PriceArrow = ({
  yourPrice,
  competitorPrice,
  size = 13,
}: {
  yourPrice: number;
  competitorPrice: number;
  size?: number;
}) => {
  if (!yourPrice || !competitorPrice) return null;
  const diff = yourPrice - competitorPrice;
  if (Math.abs(diff) < 1) return null;
  const above = diff > 0;
  const Icon = above ? ArrowUpRight : ArrowDownRight;
  return (
    <Icon
      size={size}
      strokeWidth={2.5}
      className={above ? "tw:text-red-600" : "tw:text-green-600"}
    />
  );
};

type Row = { name: string; price: number; isLowest?: boolean; url?: string };

const toRows = (data: PartnerPriceData) => {
  const primary: Row[] = [];
  if (data?.flipkart) primary.push({ name: "Flipkart", ...data.flipkart });
  if (data?.amazon) primary.push({ name: "Amazon", ...data.amazon });
  if (data?.other)
    primary.push({ name: "Other Online Price", ...data.other });
  const others: Row[] = (data?.others || []).map((o) => ({ ...o }));
  return { primary, others };
};

const CompetitorRow = ({
  row,
  yourPrice,
  hideArrow,
  hideLowest,
}: {
  row: Row;
  yourPrice: number;
  hideArrow?: boolean;
  hideLowest?: boolean;
}) => {
  const amount = Number(row.price);
  const hasAmount = amount > 0;

  const name = (
    <span className="tw:flex tw:min-w-0 tw:flex-1 tw:items-center tw:gap-1.5">
      <Monogram label={row.name} color={colorFor(row.name)} />
      <span className="tw:truncate tw:text-xs tw:font-medium tw:text-gray-600">
        {row.name}
      </span>
      {row.isLowest && !hideLowest && (
        <span className="tw:shrink-0 tw:rounded tw:bg-green-100 tw:px-1.5 tw:py-px tw:text-[9px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-green-700">
          Lowest
        </span>
      )}
    </span>
  );

  return (
    <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:py-1">
      {row.url ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            CommonService.openInNewWindow(row.url);
          }}
          className="tw:flex tw:min-w-0 tw:flex-1 tw:cursor-pointer tw:transition-opacity hover:tw:opacity-70"
        >
          {name}
        </button>
      ) : (
        name
      )}

      <span className="tw:inline-flex tw:shrink-0 tw:items-center tw:gap-1">
        {hasAmount ? (
          <>
            {!hideArrow && (
              <PriceArrow yourPrice={yourPrice} competitorPrice={amount} />
            )}
            <Amount
              value={amount}
              className={clsx(
                "tw:whitespace-nowrap tw:tabular-nums tw:text-sm",
                row.isLowest
                  ? "tw:font-bold tw:text-green-700"
                  : "tw:font-semibold tw:text-gray-700",
              )}
            />
          </>
        ) : (
          <span className="tw:text-sm tw:font-semibold tw:text-gray-400">
            -
          </span>
        )}
      </span>
    </div>
  );
};

const CompetitorPrice = ({
  partnerPriceData,
  price = 0,
  dealId,
  onRefreshed,
  className,
  hideVerdict = false,
  hideArrows = false,
  hideLowest = false,
}: {
  partnerPriceData: PartnerPriceData;
  /** The retailer's selling price (B2B or B2C) to compare against the market. */
  price?: number;
  /** Deal id used to re-sync the competitor feed; refresh is hidden without it. */
  dealId?: string;
  /** Notifies the parent with freshly-synced competitor data. */
  onRefreshed?: (data: PartnerPriceData) => void;
  className?: string;
  /** Hides the market verdict in the header row. */
  hideVerdict?: boolean;
  /** Hides the directional arrows shown next to each competitor price. */
  hideArrows?: boolean;
  /** Hides the "Lowest" badge shown next to the cheapest competitor. */
  hideLowest?: boolean;
}) => {
  const [data, setData] = useState(partnerPriceData);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Keep in sync when the parent reloads the deal with fresh data.
  useEffect(() => {
    setData(partnerPriceData);
  }, [partnerPriceData]);

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!dealId || refreshing) return;

    setRefreshing(true);
    try {
      const res = await SellerCatalogService.refreshOnlinePrices(dealId);
      const payload = res?.data?.data ?? res?.data;
      const updated = payload?.partnerPrices ?? payload?.partnerOnlinePrices;
      if (Array.isArray(updated)) {
        const next = SellerCatalogService.buildPartnerPriceData(updated);
        setData(next);
        onRefreshed?.(next);
      }
      ToasterService.success("Competitor prices refreshed");
    } catch {
      ToasterService.error("Failed to refresh competitor prices");
    } finally {
      setRefreshing(false);
    }
  };

  const { primary, others } = toRows(data);

  if (!primary.length && !others.length) return null;

  return (
    <div
      className={clsx(
        "tw:flex tw:flex-col tw:gap-2 tw:rounded-lg tw:bg-gray-50 tw:p-3",
        className,
      )}
    >
      {/* Verdict + refresh share the header row */}
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
        <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-2">
          <span className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
            Online Price
          </span>
          {!hideVerdict && (
            <MarketVerdict partnerPriceData={data} price={price} />
          )}
        </div>

        {dealId && (
          <button
            type="button"
            disabled={refreshing}
            onClick={handleRefresh}
            title="Refresh competitor prices"
            className={clsx(
              "tw:inline-flex tw:h-6 tw:w-6 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-gray-200 tw:bg-white tw:text-gray-400 tw:transition-colors hover:tw:border-gray-300 hover:tw:bg-gray-50 hover:tw:text-gray-600",
              !refreshing && "tw:cursor-pointer",
            )}
          >
            <RefreshCw
              size={12}
              strokeWidth={2.5}
              className={clsx(refreshing && "tw:animate-spin")}
            />
          </button>
        )}
      </div>

      {/* Competitor grid */}
      <div className="tw:flex tw:flex-col tw:divide-y tw:divide-gray-100">
        {primary.map((row) => (
          <CompetitorRow
            key={row.name}
            row={row}
            yourPrice={price}
            hideArrow={hideArrows}
            hideLowest={hideLowest}
          />
        ))}

        {expanded &&
          others.map((row) => (
            <CompetitorRow
              key={row.name}
              row={row}
              yourPrice={price}
              hideArrow={hideArrows}
              hideLowest={hideLowest}
            />
          ))}
      </div>

      {others.length > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className="tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1 tw:self-start tw:text-[11px] tw:font-semibold tw:text-blue-600 tw:transition-colors hover:tw:text-blue-700"
        >
          <ChevronDown
            size={13}
            strokeWidth={2.5}
            className={clsx(
              "tw:transition-transform",
              expanded && "tw:rotate-180",
            )}
          />
          {expanded
            ? "Show less"
            : `View ${others.length} other${others.length > 1 ? "s" : ""}`}
        </button>
      )}
    </div>
  );
};

export default CompetitorPrice;
