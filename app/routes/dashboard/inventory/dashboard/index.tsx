import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import AppTab from "~/components/core/tab/AppTab";
import type { TabItem } from "~/types/CommonTypes";
import CommonService from "~/services/CommonService";
import InventoryDashboardService from "~/services/InventoryDashboardService";
import PageAccessService from "~/services/PageAccessService";
// import BottomDeadStockProducts from "./components/bottom-dead-stock-products/BottomDeadStockProducts";
import CategoryWiseProducts from "./components/category-wise-products/CategoryWiseProducts";
import InventoryAgingAnalysis from "./components/InventoryAgingAnalysis";
import InventoryHealthScore from "./components/InventoryHealthScore";
import InventoryValueByCategory from "./components/InventoryValueByCategory";
import ReorderRiskInsights from "./components/ReorderRiskInsights";

import {
  Zap,
  TrendingDown,
  PauseCircle,
  RefreshCw,
  CalendarClock,
  // Archive,
  LayoutGrid,
  Lock,
} from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import { useSidebar } from "~/components/ui/sidebar";
import useAppNav from "~/hooks/useAppNav";
import SummaryCards from "./components/SummaryCards";
import SkuMovementProducts from "./components/sku-movement-products/SkuMovementProducts";
import ReorderProducts from "./components/reorder-products/ReorderProducts";
import {
  defaultSummary,
  type CategoryValue,
  type HealthScore,
  type InventorySummary,
  type RiskInsights,
} from "./helper";

export async function clientLoader() {
  return PageAccessService.canAccessPage([]);
}

const breadcrumbs = [
  { label: "Dashboard" },
  { label: "Inventory Analytics Dashboard" },
];

const productTabs: TabItem[] = [
  { name: "Fast Moving Products", key: "fast_moving", icon: <Zap size={16} /> },
  { name: "Slow Moving", key: "slow_moving", icon: <TrendingDown size={16} /> },
  { name: "Non Moving", key: "non_moving", icon: <PauseCircle size={16} /> },
  { name: "Reorder", key: "reorder", icon: <RefreshCw size={16} /> },
  {
    name: "Near Expiry",
    key: "near_expiry",
    icon: <CalendarClock size={16} />,
  },
  // { name: "Dead Stock", key: "dead_stock", icon: <Archive size={16} /> },
  { name: "Reserve", key: "reserve", icon: <Lock size={16} /> },
  {
    name: "Category Wise",
    key: "category_wise",
    icon: <LayoutGrid size={16} />,
  },
];

const tabDescriptions: Record<string, string> = {
  fast_moving: "Items that sold in the last 30 days. These sell fast.",
  slow_moving:
    "Items that sold in the last 90 days but not in the last 30 days. These sell slowly.",
  non_moving: "Items that have not sold at all for a long time.",
  reorder: "Items that are selling but low in stock. Buy them again soon.",
  near_expiry: "Items that will expire in the next 30 days. Sell them quickly.",
  reserve:
    "Reserve Mode allows customers to place orders for items that are currently out of stock, but have been made available for future fulfillment.",
  // dead_stock: "Items lying in stock with no sales for a long time",
  category_wise: "Your stock split by product category.",
};

const InventoryDashboard = () => {
  const appNav = useAppNav();
  const { setOpen } = useSidebar();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "fast_moving";

  // Collapse the side menu when landing on the dashboard to give the wide
  // analytics tables more room. Run only on mount — `setOpen`'s identity
  // changes whenever the sidebar opens, so depending on it would re-collapse
  // the sidebar every time the user tries to expand it.
  useEffect(() => {
    setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [summary, setSummary] = useState<InventorySummary>({
    ...defaultSummary,
  });
  const [categoryData, setCategoryData] = useState<CategoryValue[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [riskInsights, setRiskInsights] = useState<RiskInsights>({
    reorderRequired: 0,
    overstocked: 0,
    expiryRisk: 0,
    zeroSales30Days: 0,
  });
  const [riskLoading, setRiskLoading] = useState(true);
  const [healthScore, setHealthScore] = useState<HealthScore>({
    score: 0,
    status: "",
  });
  const [healthLoading, setHealthLoading] = useState(true);
  const [agingData, setAgingData] = useState<
    { name: string; value: number; color: string }[]
  >([]);
  const [agingLoading, setAgingLoading] = useState(true);

  const abortRef = useRef<AbortController | null>(null);

  const loadSummaryData = async () => {
    try {
      const [
        totalDealsRes,
        inventoryValueRes,
        skuMovementRes,
        outOfStockRes,
        turnoverRes,
      ] = await Promise.all([
        InventoryDashboardService.getTotalDeals(
          {},
          { signal: abortRef.current?.signal },
        ),
        InventoryDashboardService.getInventoryValue(
          {},
          { signal: abortRef.current?.signal },
        ),
        InventoryDashboardService.getSkuMovement(
          {},
          { signal: abortRef.current?.signal },
        ),
        InventoryDashboardService.getOutOfStockSkus(
          {},
          { signal: abortRef.current?.signal },
        ),
        InventoryDashboardService.getInventoryTurnover(
          {},
          { signal: abortRef.current?.signal },
        ),
      ]);

      const totalDeals = totalDealsRes?.data?.data || 0;
      const inventoryValue = inventoryValueRes?.data?.data || 0;
      const skuMovement = skuMovementRes?.data?.data || {};
      const outOfStock = outOfStockRes?.data?.data || 0;
      const inventoryTurnover = turnoverRes?.data?.data?.inventoryValue || 0;
      const inventoryTurnoverPct =
        turnoverRes?.data?.data?.inventoryTurnoverPct || 0;

      const fast = skuMovement.fast?.count || 0;
      const slow = skuMovement.slow?.count || 0;
      const nonMoving = skuMovement.nonMoving?.count || 0;
      const reserved = skuMovement.reserved?.count || 0;
      const total = skuMovement.total || fast + slow + nonMoving;
      const fastPercentage =
        skuMovement.fast?.percentage ??
        (total > 0 ? Number(((fast / total) * 100).toFixed(2)) : 0);
      const slowPercentage =
        skuMovement.slow?.percentage ??
        (total > 0 ? Number(((slow / total) * 100).toFixed(2)) : 0);

      setAgingData([
        { name: "Fast Moving", value: fast, color: "#22c55e" },
        { name: "Slow Moving", value: slow, color: "#f59e0b" },
        { name: "Non-Moving", value: nonMoving, color: "#ef4444" },
      ]);
      setAgingLoading(false);

      setSummary({
        totalSKUs: totalDeals,
        inventoryValue: inventoryValue,
        inventoryValueChange: 0,
        fastMovingSKUs: total > 0 ? fast : 0,
        fastMovingSKUsChange: 0,
        fastMovingPercentage: fastPercentage,
        slowMovingSKUs: total > 0 ? slow : 0,
        slowMovingSKUsChange: 0,
        slowMovingPercentage: slowPercentage,
        slowMovingValue: 0,
        outOfStockSKUs: outOfStock,
        inventoryValueLocked: 0,
        inventoryTurnover: inventoryTurnover,
        inventoryTurnoverPct: inventoryTurnoverPct,
        inventoryTurnoverLocked: 0,
        nonMovingSKUs: nonMoving,
        reservedSKUs: reserved,
        loading: false,
      });
    } catch {
      setSummary((prev) => ({ ...prev, loading: false }));
      setAgingLoading(false);
    }
  };

  const loadCategoryData = async () => {
    setCategoryLoading(true);
    try {
      const r = await InventoryDashboardService.getInventoryValueByCategory(
        {},
        { signal: abortRef.current?.signal },
      );
      const d = r?.data?.data || [];
      console.log(d);
      const mapped = Array.isArray(d)
        ? d.map((item: any) => ({
            category: item.categoryName || "",
            inventoryValue: item.value || 0,
            categoryName: item.categoryName || "",
            categoryId: item.categoryId || "",
            categoryRefId: item.categoryRefId || "",
            fast: item.fast || 0,
            slow: item.slow || 0,
            nonMoving: item.nonMoving || 0,
            avgAge: item.avgAge || 0,
            margin: item.margin || 0,
          }))
        : [];
      setCategoryData(
        mapped
          .sort((a: any, b: any) => b.inventoryValue - a.inventoryValue)
          .slice(0, 10),
      );
    } catch {
      setCategoryData([]);
    }
    setCategoryLoading(false);
  };

  const loadRiskData = async () => {
    setRiskLoading(true);
    try {
      const [reorderRes, overstockedRes, expiryRes] = await Promise.all([
        InventoryDashboardService.getInventoryRisk(
          "reorderRequired",
          { outputType: "count" },
          { signal: abortRef.current?.signal },
        ),
        InventoryDashboardService.getInventoryRisk(
          "overstocked",
          { outputType: "count" },
          { signal: abortRef.current?.signal },
        ),
        InventoryDashboardService.getInventoryRisk(
          "expiryRisk",
          { outputType: "count" },
          { signal: abortRef.current?.signal },
        ),
      ]);

      setRiskInsights({
        reorderRequired: reorderRes?.data?.count || 0,
        overstocked: overstockedRes?.data?.count || 0,
        expiryRisk: expiryRes?.data?.count || 0,
        zeroSales30Days: 0,
      });
    } catch {
      // ignore
    }
    setRiskLoading(false);
  };

  const loadHealthData = async () => {
    setHealthLoading(true);
    try {
      const r = await InventoryDashboardService.getInventoryHealthScore(
        {},
        { signal: abortRef.current?.signal },
      );
      const d = r?.data?.data || {};
      setHealthScore({
        score: d.healthScore || 0,
        status: d.status || "",
      });
    } catch {
      // ignore
    }
    setHealthLoading(false);
  };

  useEffect(() => {
    abortRef.current = new AbortController();
    loadSummaryData();
    loadCategoryData();
    loadRiskData();
    loadHealthData();

    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return (
    <>
      <AppHeader title="Inventory Analytics Dashboard" />
      <div className="tw:p-4 app-page page-bg">
        <div className="app-container !tw:lg:max-w-[1600px]">
          <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
            <div>
              <AppBreadcrumbs data={breadcrumbs} className="!tw:mb-0" />
              <p className="tw:text-sm tw:text-gray-500">
                See your stock health, what is selling, and your stock by
                category.
              </p>
            </div>
            <AppButton
              size="small"
              fill="outline"
              onClick={() => appNav.to("/dashboard/inventory/products/list")}
            >
              View All Items
            </AppButton>
          </div>

          {/* Summary Cards Row */}
          <SummaryCards data={summary} />

          {/* Category Chart Row */}
          <div className="tw:grid tw:grid-cols-1 tw:lg:grid-cols-2 tw:gap-4">
            <InventoryValueByCategory
              data={categoryData}
              loading={categoryLoading}
            />
            <InventoryAgingAnalysis data={agingData} loading={agingLoading} />
          </div>

          {/* Reorder Risk + Health Score Row */}
          <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:lg:grid-cols-4 tw:gap-4 tw:mb-4">
            <ReorderRiskInsights data={riskInsights} loading={riskLoading} />
            <InventoryHealthScore data={healthScore} loading={healthLoading} />
          </div>

          {/* Tabbed Products Section */}
          <AppTab
            tabs={productTabs}
            activeTab={activeTab}
            onTabChange={(tab) => {
              setSearchParams({ tab: tab.key }, { preventScrollReset: true });
            }}
          />
          {tabDescriptions[activeTab] && (
            <p className="tw:text-sm tw:text-gray-500 tw:mt-2">
              {tabDescriptions[activeTab]}
            </p>
          )}
          <div className="tw:mt-4">
            {activeTab === "fast_moving" && <SkuMovementProducts type="FAST" />}
            {activeTab === "slow_moving" && <SkuMovementProducts type="SLOW" />}
            {activeTab === "non_moving" && (
              <SkuMovementProducts type="NON_MOVING" />
            )}
            {activeTab === "reorder" && <ReorderProducts />}
            {activeTab === "near_expiry" && (
              <ReorderProducts type="expiryRisk" />
            )}
            {activeTab === "reserve" && <ReorderProducts type="reserve" />}
            {/* {activeTab === "dead_stock" && <BottomDeadStockProducts />} */}
            {activeTab === "category_wise" && <CategoryWiseProducts />}
          </div>
        </div>
      </div>
    </>
  );
};

export default InventoryDashboard;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle(
        "Inventory Analytics Dashboard",
      ),
    },
  ];
}
