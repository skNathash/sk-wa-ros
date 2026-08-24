import clsx from "clsx";
import { Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import B2BCustomerGroups from "./B2BCustomerGroups";
import PriceAlerts from "./price-alerts/PriceAlerts";
import type { PriceAlertPriceType } from "./price-alerts/helper";
import PricingPaneChips from "./PricingPaneChips";
import {
  formatPricingSummary,
  getPricingSummary,
  type PricingFilterKey,
  type PricingPaneSummary,
} from "./helper";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";

export interface PricingSidePaneProps {
  /** Pane header title. Defaults to "Prices & Tax". */
  title?: string;

  /** Search box value + handler. The box is dropped without a handler. */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  /** Placeholder for the search box. */
  searchPlaceholder?: string;

  /**
   * Which filter chip reads as active. The counts on them are the pane's own
   * (see {@link getPricingSummary}); the strip is dropped without a handler —
   * pages that can't act on the pricing gaps shouldn't show chips that do
   * nothing.
   */
  filter?: PricingFilterKey;
  onFilterChange?: (key: PricingFilterKey) => void;

  /** Channel the price alerts and the chip counts are read for. Defaults to B2B. */
  priceType?: PriceAlertPriceType;

  /**
   * Electronics: narrows the chip counts to the online-listed SKUs, the same
   * slice that sheet lists (`onlinePriceExist=true`).
   */
  onlinePriceExist?: boolean;

  className?: string;
}

/**
 * Side-pane contents for the Prices & Tax views in theme-2 desktop. Bundles the
 * pane header, the item search, the pricing-gap filter chips, the peer/SK price
 * alerts and the B2B customer groups, so every pricing page renders the same
 * pane without duplicating the layout.
 *
 * Only the search and the chips talk to the page — those drive its list, and
 * each is dropped when the page passes no handler for it. Everything the pane
 * reports it reads itself: the chip counts off the price-comparison endpoint
 * (one `outputType=count` per gap, scoped to this pane's channel), the alerts
 * off the network price-alerts API and the groups off the
 * seller-group-price-config API. Callers pass no data.
 */
const PricingSidePane = ({
  title = "Prices & Tax",
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search item, HSN, brand",
  filter,
  onFilterChange,
  priceType = "b2b",
  onlinePriceExist,
  className,
}: PricingSidePaneProps) => {
  // Catalogue-wide pricing gaps behind the chip badges — re-counted whenever
  // the scope changes, so the badges follow the active channel / sheet.
  const [summary, setSummary] = useState<PricingPaneSummary | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await getPricingSummary({ priceType, onlinePriceExist }));
    } catch (error) {
      console.error("Error loading pricing summary:", error);
      setSummary(null);
    }
  }, [priceType, onlinePriceExist]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const scopeLabel = formatPricingSummary(
    summary?.skuCount,
    summary?.unpricedCount,
  );

  return (
    <div className={clsx("tw:flex tw:flex-col tw:gap-4", className)}>
      {/* Pane header — section title + how much of the catalog it covers. */}
      <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-2 tw:px-1">
        <PaneTitle title={title} />
        {/* Scope label removed — the pane header carries the title alone.
        {scopeLabel && (
          <span className="tw:shrink-0 tw:text-xs tw:text-slate-400">
            {scopeLabel}
          </span>
        )}
        */}
      </div>

      {onSearchChange && (
        <div className="tw:relative">
          <Search className="tw:pointer-events-none tw:absolute tw:top-1/2 tw:left-3 tw:size-4 tw:-translate-y-1/2 tw:text-slate-400" />
          <input
            type="search"
            value={searchValue ?? ""}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="tw:w-full tw:rounded-xl tw:bg-slate-100 tw:py-2.5 tw:pr-3 tw:pl-9 tw:text-sm tw:text-slate-800 tw:outline-none tw:placeholder:text-slate-400 tw:focus:bg-white tw:focus:ring-1 tw:focus:ring-slate-300"
          />
        </div>
      )}

      {/* The pricing gaps worth clearing first. */}
      {onFilterChange && (
        <PricingPaneChips
          value={filter}
          counts={
            summary
              ? {
                  unpriced: summary.unpricedCount,
                  "low-margin": summary.lowMarginCount,
                }
              : undefined
          }
          onChange={onFilterChange}
        />
      )}

      {/* Where the market moved under us. */}
      <PriceAlerts priceType={priceType} />

      {/* Who we price for. */}
      <div className="tw:mb-4">
        <p className="app-pane-label">
          B2B customer groups
        </p>
        <B2BCustomerGroups className="tw:mt-1.5" />
      </div>
    </div>
  );
};

export default PricingSidePane;
