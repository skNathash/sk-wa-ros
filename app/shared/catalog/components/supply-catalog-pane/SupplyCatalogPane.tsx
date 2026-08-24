import clsx from "clsx";
import React from "react";
import { useSearchParams } from "react-router";
import AuthService from "~/services/AuthService";
import PreviousPurchases, {
  type PreviousPurchaseItem,
} from "./PreviousPurchases";
import PurchaseCartCard from "./PurchaseCartCard";
import SellerCatalogChips, {
  type SellerCatalogChipKey,
} from "./SellerCatalogChips";
import TrendingSearches, { type TrendingSearchItem } from "./TrendingSearches";
import CatalogOverview from "./CatalogOverview";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";

interface SupplyCatalogPaneProps {
  title: string;
  subtitle?: string;
  activeKey?: SellerCatalogChipKey;
  distance?: string | number;
  showNavChips?: boolean;
  showPurchaseCart?: boolean;
  showTrendingSearches?: boolean;
  trendingSearchesLabel?: string;
  /** Pre-resolved rows; when omitted the search-logs API is queried. */
  trendingSearches?: TrendingSearchItem[];
  /** Scopes the trending counts to one seller's catalogue. */
  trendingSearchesSellerId?: string;
  /** Matches the logged search term. */
  trendingSearchesSearch?: string;
  /** How many trending rows to show. */
  trendingSearchesLimit?: number;
  showPreviousPurchases?: boolean;
  previousPurchasesLabel?: string;
  previousPurchases?: PreviousPurchaseItem[];
  className?: string;
  /** When true, renders the CatalogOverview list instead of the nav chips. */
  showCatalogOverview?: boolean;
  /** Active data-point key for the overview list (when `showCatalogOverview`). */
  catalogOverviewActiveKey?: string;
  /** External counts to share between the page and the overview list. */
  catalogOverviewCounts?: Record<string, number>;
  /** Loading state paired with the external counts. */
  catalogOverviewCountsLoading?: boolean;
}

const SupplyCatalogPane: React.FC<SupplyCatalogPaneProps> = ({
  title,
  subtitle,
  activeKey,
  distance,
  showNavChips = true,
  showPurchaseCart = false,
  showTrendingSearches = false,
  trendingSearchesLabel = "Trending searches",
  trendingSearches,
  trendingSearchesSellerId,
  trendingSearchesSearch,
  trendingSearchesLimit,
  showPreviousPurchases = false,
  previousPurchasesLabel,
  previousPurchases,
  className,
  showCatalogOverview = false,
  catalogOverviewActiveKey,
  catalogOverviewCounts,
  catalogOverviewCountsLoading,
}) => {
  const [searchParams] = useSearchParams();
  const resolvedDistance =
    distance ?? searchParams.get("distance") ?? undefined;

  const buyerFirstName = (AuthService.getLoggedInUser()?.name || "")
    .trim()
    .split(" ")[0];
  const resolvedPreviousPurchasesLabel =
    previousPurchasesLabel ??
    (buyerFirstName ? `${buyerFirstName}'s usual` : "Your usual");

  const defaultChips = (
    <SellerCatalogChips activeKey={activeKey} distance={resolvedDistance} />
  );

  return (
    <>
      <div className={clsx("tw:flex tw:flex-col tw:gap-1.5", className)}>
        <div className="tw:flex tw:items-baseline tw:justify-between tw:px-1">
          <PaneTitle title={title} className="tw:text-xl" />
          {subtitle && (
            <span className="tw:text-xs tw:text-slate-400">{subtitle}</span>
          )}
        </div>

        {showNavChips && defaultChips}

        {showPurchaseCart && <PurchaseCartCard />}

        {showCatalogOverview ? (
          <CatalogOverview
            className="tw:mt-2"
            variant="list"
            activeKey={catalogOverviewActiveKey}
            counts={catalogOverviewCounts}
            countsLoading={catalogOverviewCountsLoading}
            distance={resolvedDistance}
          />
        ) : null}
      </div>

      {showTrendingSearches && (
        <div>
          <p className="app-pane-label">
            {trendingSearchesLabel}
          </p>
          <TrendingSearches
            items={trendingSearches}
            sellerId={trendingSearchesSellerId}
            search={trendingSearchesSearch}
            {...(trendingSearchesLimit !== undefined
              ? { limit: trendingSearchesLimit }
              : {})}
            distance={resolvedDistance}
            className="tw:mt-1.5"
          />
        </div>
      )}

      {showPreviousPurchases && (
        <div>
          <p className="app-pane-label">
            {resolvedPreviousPurchasesLabel}
          </p>
          <PreviousPurchases
            items={previousPurchases}
            distance={resolvedDistance}
            className="tw:mt-1.5"
          />
        </div>
      )}
    </>
  );
};

export default SupplyCatalogPane;
