import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import AppTab from "~/components/core/tab/AppTab";
import FilterChip from "~/components/core/filter-chip/FilterChip";
import FilterChipGroup from "~/components/core/filter-chip/FilterChipGroup";
import type { TabItem } from "~/types/CommonTypes";
import CommonService from "~/services/CommonService";
import InventoryDashboardService from "~/services/InventoryDashboardService";
import PageAccessService from "~/services/PageAccessService";
import CategoryWiseProducts from "./components/category-wise-products/CategoryWiseProducts";
import BrandWiseProducts from "./components/brand-wise-products/BrandWiseProducts";
import Overview from "./components/Overview";
import ShopToday from "./components/shop-today/ShopToday";

import {
  Package,
  Zap,
  TrendingDown,
  PauseCircle,
  RefreshCw,
  CalendarClock,
  LayoutGrid,
  Gauge,
  Tags,
  Lock,
  PackageX,
  Ban,
} from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import { useSidebar } from "~/components/ui/sidebar";
import useAppNav from "~/hooks/useAppNav";
import useTheme from "~/hooks/useTheme";
import { useIsMobile } from "~/hooks/use-mobile";
import CatalogJourney from "~/shared/inventory/components/catalog-journey/CatalogJourney";
import type { JourneyStep } from "~/shared/inventory/components/catalog-journey/helper";
import CatalogSidePane from "~/shared/inventory/components/catalog-side-pane/CatalogSidePane";
import NeedsAttention from "~/shared/inventory/components/needs-attention/NeedsAttention";
import type { AttentionTask } from "~/shared/inventory/components/needs-attention/helper";
import InventoryStats, {
  type InventoryStatKey,
} from "~/shared/inventory/components/inventory-stats/InventoryStats";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import SkuMovementProducts from "./components/sku-movement-products/SkuMovementProducts";
import ReorderProducts from "./components/reorder-products/ReorderProducts";
import InStockProducts from "./components/in-stock-products/InStockProducts";
import {
  defaultSummary,
  getInStockCount,
  type CategoryValue,
  type HealthScore,
  type InventorySummary,
  type RiskInsights,
} from "./helper";
import InventoryAgingAnalysis from "./components/InventoryAgingAnalysis";
import StockOverview from "./components/theme2/StockOverview";
import MovementBuckets from "./components/theme2/MovementBuckets";
import SellerCatalogService from "~/services/SellerCatalogService";

export async function clientLoader() {
  return PageAccessService.canAccessPage([]);
}

const breadcrumbs = [
  { label: "Dashboard" },
  { label: "Inventory Analytics Dashboard" },
];

const mainTabs: TabItem[] = [
  { name: "Overview", key: "overview", icon: <Gauge size={16} /> },
  { name: "Products", key: "products", icon: <Package size={16} /> },
  {
    name: "Category",
    key: "category_wise",
    icon: <LayoutGrid size={16} />,
  },
  { name: "Brand", key: "brand_wise", icon: <Tags size={16} /> },
];

const productViews: TabItem[] = [
  { name: "In Stock", key: "in_stock", icon: <Package size={16} /> },
  { name: "Fast Moving", key: "fast_moving", icon: <Zap size={16} /> },
  { name: "Slow Moving", key: "slow_moving", icon: <TrendingDown size={16} /> },
  { name: "Non Moving", key: "non_moving", icon: <PauseCircle size={16} /> },
  { name: "Reorder", key: "reorder", icon: <RefreshCw size={16} /> },
  {
    name: "Near Expiry",
    key: "near_expiry",
    icon: <CalendarClock size={16} />,
  },
  { name: "Reserve", key: "reserve", icon: <Lock size={16} /> },
  { name: "Out of Stock", key: "out_of_stock", icon: <PackageX size={16} /> },
  { name: "Non Sellable", key: "non_sellable", icon: <Ban size={16} /> },
];

const tabDescriptions: Record<string, string> = {
  in_stock: "Items that currently have stock on hand.",
  fast_moving: "Items that sold in the last 30 days. These sell fast.",
  // slow_moving:
  //   "Items that sold in the last 90 days but not in the last 30 days. These sell slowly.",
  non_moving: "Items that have not sold at all for a long time.",
  out_of_stock: "Items that currently have no stock on hand.",
  non_sellable: "Items that are not available for sale.",
  reorder: "Items that are selling but low in stock. Buy them again soon.",
  near_expiry: "Items that will expire in the next 30 days. Sell them quickly.",
  reserve:
    "Reserve Mode allows customers to place orders for items that are currently out of stock, but have been made available for future fulfillment.",
  category_wise: "Your stock split by product category.",
  brand_wise: "Your stock split by product brand.",
};

const InventoryDashboard = () => {
  const { setOpen } = useSidebar();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const productView = searchParams.get("view") || "in_stock";
  const effectiveTab = activeTab === "products" ? productView : activeTab;
  const appNav = useAppNav();
  const theme = useTheme();
  const isTheme2 = theme === "theme-2";
  const isMobile = useIsMobile();
  // Theme-2 desktop keeps the underline tabs; theme-2 mobile uses pills.
  // Everywhere else the default segmented `tabs` variant.
  const mainTabVariant = !isTheme2 ? "tabs" : isMobile ? "pills" : "underline";

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
  const productsSectionRef = useRef<HTMLDivElement>(null);

  const goToProductTab = (tab: string, view?: string) => {
    setSearchParams(view ? { tab, view } : { tab }, {
      preventScrollReset: true,
    });
    productsSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const openProductsTab = (tabKey: string) => {
    const isProductView = productViews.some((t) => t.key === tabKey);
    if (isProductView) goToProductTab("products", tabKey);
    else goToProductTab(tabKey);
  };

  const handleViewMovementBuckets = (view: string) => {
    const m = SellerCatalogService.getMovementTypes();
    const v = m.find((m) => m.key === view?.replace("_", "-"));
    if (v) {
      appNav.to(`/dashboard/inventory/products/list?velocity=${v.value}`);
    }
  };

  const STOCK_ALERT_VIEWS: Record<string, string> = {
    "out-of-stock": "out_of_stock",
    "slow-moving": "slow_moving",
    "non-moving": "non_moving",
    "near-expiry": "near_expiry",
  };

  const activeStockAlertKey =
    activeTab === "products"
      ? Object.keys(STOCK_ALERT_VIEWS).find(
          (key) => STOCK_ALERT_VIEWS[key] === productView,
        )
      : undefined;

  // The headline stat tiles drop into the product views that back them; the
  // pre-owned pool has no view of its own yet, so that tile stays inert.
  const handleStatSelect = (key: InventoryStatKey) => {
    if (key === "slow-movers") goToProductTab("products", "slow_moving");
    else if (key !== "pre-owned") goToProductTab("products", "in_stock");
  };

  const handlePaneValueSelect = (key: "totalItems" | "inventoryValue") => {
    if (key === "totalItems") goToProductTab("products", "in_stock");
    else goToProductTab("overview");
  };

  // The journey strip's last step lands on the in-stock products view, which
  // lives on this very page — the other two leave for pricing / stock entry.
  const handleJourneyStep = (step: JourneyStep) => {
    if (step.key === "stocked") {
      goToProductTab("products", "in_stock");
      return;
    }
    appNav.to(step.nextPath);
  };

  // Three of the attention cards (near expiry / slow movers / out of stock)
  // land on product views that live on this very page, so they switch tabs
  // instead of navigating; pricing and stock entry leave for their own screens.
  const handleAttentionTask = (task: AttentionTask) => {
    const view = task.query?.view;
    if (task.query?.tab === "products" && view) {
      goToProductTab("products", view);
      return;
    }
    appNav.to(task.path, task.query);
  };

  const loadSummaryData = async () => {
    try {
      const [
        totalDealsRes,
        inStockCountRes,
        inventoryValueRes,
        skuMovementRes,
        outOfStockRes,
        turnoverRes,
      ] = await Promise.all([
        InventoryDashboardService.getTotalDeals(
          {},
          { signal: abortRef.current?.signal },
        ),
        getInStockCount({}),
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
      const inStockSKUs = inStockCountRes || 0;
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
      const nonMovingPercentage =
        skuMovement.nonMoving?.percentage ??
        (total > 0 ? Number(((nonMoving / total) * 100).toFixed(2)) : 0);

      setAgingData([
        { name: "Fast Moving", value: fast, color: "#22c55e" },
        { name: "Slow Moving", value: slow, color: "#f59e0b" },
        { name: "Non-Moving", value: nonMoving, color: "#ef4444" },
      ]);
      setAgingLoading(false);

      setSummary({
        totalSKUs: totalDeals,
        inStockSKUs: inStockSKUs,
        inventoryValue: inventoryValue,
        inventoryValueChange: 0,
        fastMovingSKUs: total > 0 ? fast : 0,
        fastMovingSKUsChange: 0,
        fastMovingPercentage: fastPercentage,
        slowMovingSKUs: total > 0 ? slow : 0,
        slowMovingSKUsChange: 0,
        slowMovingPercentage: slowPercentage,
        slowMovingValue: 0,
        nonMovingPercentage: total > 0 ? nonMovingPercentage : 0,
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
    } catch {}
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
    } catch {}
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
      <AppHeader
        title="Dashboard"
        sectionKey="catalog"
        activeTab="inventory-dashboard"
        mobileLead="menu"
      />
      <div className="page-padding app-page page-bg">
        {/* Section tab strip is hidden on this page — the switcher inside the
            header handles section navigation instead. */}
        {/* {!isMobile && (
          <SectionTabs
            sectionKey="catalog"
            activeTab="inventory-dashboard"
            noShadow
            sticky
          />
        )} */}

        <div className="section-layout section-layout--tight">
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="catalog"
                activeTab="inventory-dashboard"
                title="Dashboard"
              />
            </div>
          </aside>

          <div className="section-content app-container no-padding">
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
              <AppPaneMain className="tw:lg:col-span-12">
                <AppTab
                  tabs={mainTabs}
                  activeTab={activeTab}
                  onTabChange={(tab) => {
                    setSearchParams(
                      { tab: tab.key },
                      { preventScrollReset: true },
                    );
                  }}
                  className={clsx(
                    // Hide the tab bar on mobile screens, and everywhere in
                    // theme-2 — the header switcher handles navigation there.
                    (isMobile || isTheme2) && "tw:hidden",
                    isTheme2 && "edge-tabs app-tabs-sticky app-tabs-solid",
                    // No section tab bar above on mobile, so pin under the
                    // header rather than below a bar that isn't there.
                    isTheme2 && isMobile && "app-tabs-sticky-header",
                    // Flush bottom only in theme-2 on desktop.
                    isTheme2 && !isMobile && "app-tabs-flush-bottom",
                  )}
                  variant={mainTabVariant}
                />

                <div className="section-content-inner">
                  {activeTab === "overview" && (
                    <>
                      <ShopToday className="tw:mt-3 tw:mb-4" />

                      <MovementBuckets
                        data={summary}
                        onOpenTab={handleViewMovementBuckets}
                        className="tw:mb-4"
                      />
                    </>
                  )}

                  {activeTab === "products" && (
                    <FilterChipGroup className="tw:mt-3">
                      {productViews.map((view) => (
                        <FilterChip
                          key={view.key}
                          active={productView === view.key}
                          leadingIcon={view.icon}
                          onClick={() =>
                            setSearchParams(
                              { tab: "products", view: view.key },
                              { preventScrollReset: true },
                            )
                          }
                        >
                          {view.name}
                        </FilterChip>
                      ))}
                    </FilterChipGroup>
                  )}

                  {/* {tabDescriptions[effectiveTab] && (
                    <p className="tw:text-sm tw:text-gray-500 tw:mt-2 tw:mb-3">
                      {tabDescriptions[effectiveTab]}
                    </p>
                  )} */}

                  {activeTab === "overview" && (
                    <CatalogJourney
                      className="tw:mt-3"
                      onStepClick={handleJourneyStep}
                    />
                  )}

                  {activeTab === "overview" && (
                    <NeedsAttention
                      className="tw:mt-3"
                      onTaskClick={handleAttentionTask}
                    />
                  )}

                  {activeTab === "overview" && (
                    <InventoryStats
                      className="tw:mt-3 tw:mb-4"
                      onSelect={handleStatSelect}
                    />
                  )}

                  {activeTab === "overview" && (
                    <Overview
                      summary={summary}
                      categoryData={categoryData}
                      categoryLoading={categoryLoading}
                      agingData={agingData}
                      agingLoading={agingLoading}
                      riskInsights={riskInsights}
                      riskLoading={riskLoading}
                      healthScore={healthScore}
                      healthLoading={healthLoading}
                      onNavigate={goToProductTab}
                      onOpenTab={openProductsTab}
                    />
                  )}

                  {activeTab === "products" && (
                    <div className="tw:mt-1">
                      {productView === "in_stock" && <InStockProducts />}
                      {productView === "fast_moving" && (
                        <SkuMovementProducts type="FAST" />
                      )}
                      {productView === "slow_moving" && (
                        <SkuMovementProducts type="SLOW" />
                      )}
                      {productView === "non_moving" && (
                        <SkuMovementProducts type="NON_MOVING" />
                      )}
                      {productView === "out_of_stock" && (
                        <SkuMovementProducts type="OUT_OF_STOCK" />
                      )}
                      {productView === "non_sellable" && (
                        <SkuMovementProducts type="NON_SELLABLE" />
                      )}
                      {productView === "reorder" && <ReorderProducts />}
                      {productView === "near_expiry" && (
                        <ReorderProducts type="expiryRisk" />
                      )}
                      {productView === "reserve" && (
                        <ReorderProducts type="reserve" />
                      )}
                    </div>
                  )}

                  {activeTab === "category_wise" && <CategoryWiseProducts />}
                  {activeTab === "brand_wise" && <BrandWiseProducts />}
                </div>
              </AppPaneMain>

              <AppPaneSide className="app-pane-only">
                <CatalogSidePane
                  activeTab="inventory-dashboard"
                  scopeLabel="Analytics"
                  onValueSelect={handlePaneValueSelect}
                  activeStockAlertKey={activeStockAlertKey}
                  showInventoryValue={false}
                  showMenuList={false}
                  showActivityLog
                />
              </AppPaneSide>
            </div>
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
