import useAppNav from "~/hooks/useAppNav";
import useTheme from "~/hooks/useTheme";
import CategoryTiles from "~/shared/inventory/components/category-tiles/CategoryTiles";
import InventoryAgingAnalysis from "./InventoryAgingAnalysis";
import InventoryHealthScore from "./InventoryHealthScore";
import InventoryValueByCategory from "./InventoryValueByCategory";
import ReorderRiskInsights from "./ReorderRiskInsights";
import SummaryCards from "./SummaryCards";
import BrandBreakdown from "./brand-breakdown/BrandBreakdown";
import CategoryBreakdown from "./category-breakdown/CategoryBreakdown";
import FastMovers from "./fast-movers/FastMovers";
import NearExpiry from "./near-expiry/NearExpiry";
import SlowMovers from "./slow-movers/SlowMovers";
import WhatsSelling from "./whats-selling/WhatsSelling";
import InventoryValueSummary from "./in-stock-products/components/InventoryValueSummary";
import InsightHero from "./theme2/InsightHero";
import MovementBuckets from "./theme2/MovementBuckets";
import QuickPagesList from "./theme2/QuickPagesList";
import StockOverview from "./theme2/StockOverview";
import ValueBreakdown from "./theme2/ValueBreakdown";
import type {
  CategoryValue,
  HealthScore,
  InventorySummary,
  RiskInsights,
} from "../helper";

type AgingDatum = { name: string; value: number; color: string };

interface OverviewProps {
  summary: InventorySummary;
  categoryData: CategoryValue[];
  categoryLoading: boolean;
  agingData: AgingDatum[];
  agingLoading: boolean;
  riskInsights: RiskInsights;
  riskLoading: boolean;
  healthScore: HealthScore;
  healthLoading: boolean;
  /** Switch to a dashboard tab (and product view) and scroll to it. */
  onNavigate: (tab: string, view?: string) => void;
  /** Open a tab by key, resolving product-view keys to the products tab. */
  onOpenTab: (tabKey: string) => void;
}

const Overview = ({
  summary,
  categoryData,
  categoryLoading,
  agingData,
  agingLoading,
  riskInsights,
  riskLoading,
  healthScore,
  healthLoading,
  onNavigate,
  onOpenTab,
}: OverviewProps) => {
  const appNav = useAppNav();
  const theme = useTheme();
  const isTheme2 = theme === "theme-2";

  return (
    <div>
      <div className="tw:mb-4 tw:grid tw:grid-cols-1 tw:gap-4 tw:xl:grid-cols-2">
        <WhatsSelling onSeeAll={() => onOpenTab("fast_moving")} />
        <CategoryTiles />
      </div>

      <div className="tw:mb-4 tw:grid tw:grid-cols-1 tw:gap-4 tw:xl:grid-cols-2">
        <FastMovers onSeeAll={() => onOpenTab("fast_moving")} />
        <SlowMovers onSeeAll={() => onOpenTab("slow_moving")} />
      </div>

      <div className="tw:mb-4 tw:grid tw:grid-cols-1 tw:gap-4 tw:lg:grid-cols-2 tw:xl:grid-cols-3">
        <CategoryBreakdown onSeeAll={() => onOpenTab("category_wise")} />
        <BrandBreakdown onSeeAll={() => onOpenTab("brand_wise")} />
        <NearExpiry onSeeAll={() => onOpenTab("near_expiry")} />
      </div>

      {isTheme2 ? (
        <>
          {/* Theme-2 summary blocks parked for now.
          <InsightHero
            data={summary}
            overstocked={riskInsights.overstocked}
            riskLoading={riskLoading}
            className="tw:mb-4"
          />
          <ValueBreakdown
            data={summary}
            onOpenTab={onOpenTab}
            className="tw:mb-4"
          />
          <StockOverview
            data={summary}
            onOpenTab={onOpenTab}
            className="tw:mb-4"
          />
          <MovementBuckets
            data={summary}
            onOpenTab={onOpenTab}
            className="tw:mb-4"
          /> */}
        </>
      ) : (
        <>
          <h2 className="tw:text-base tw:font-semibold tw:text-gray-800 tw:mb-2">
            Inventory Value
          </h2>
          <InventoryValueSummary onNavigate={onNavigate} />

          <h2 className="tw:text-base tw:font-semibold tw:text-gray-800 tw:mb-2">
            Stock Overview
          </h2>
          <SummaryCards data={summary} group="counts" onNavigate={onNavigate} />

          <h2 className="tw:text-base tw:font-semibold tw:text-gray-800 tw:mb-2">
            Stock Movement
          </h2>
          <SummaryCards
            data={summary}
            group="movement"
            onNavigate={onNavigate}
          />
        </>
      )}

      {/* <h2 className="tw:text-base tw:font-semibold tw:text-gray-800 tw:mb-2 app-section-label">
        Analytics
      </h2>
      <div className="tw:mb-4 tw:grid tw:grid-cols-1 tw:lg:grid-cols-2 tw:gap-4">
        <InventoryValueByCategory
          data={categoryData}
          loading={categoryLoading}
        />
        <InventoryAgingAnalysis data={agingData} loading={agingLoading} />
      </div> */}

      {isTheme2 ? (
        // Dedicated-pages list + stock health parked alongside the blocks above.
        // <QuickPagesList
        //   risk={riskInsights}
        //   riskLoading={riskLoading}
        //   health={healthScore}
        //   healthLoading={healthLoading}
        //   onOpenTab={onOpenTab}
        //   onViewAllItems={() => appNav.to("/dashboard/inventory/products/list")}
        //   className="tw:mb-4"
        // />
        null
      ) : (
        <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:lg:grid-cols-4 tw:gap-4 tw:mb-4">
          <ReorderRiskInsights data={riskInsights} loading={riskLoading} />
          <InventoryHealthScore data={healthScore} loading={healthLoading} />
        </div>
      )}
    </div>
  );
};

export default Overview;
