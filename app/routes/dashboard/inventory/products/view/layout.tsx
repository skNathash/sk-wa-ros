import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Outlet,
  useLocation,
  useParams,
  useRevalidator,
  useSearchParams,
} from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import ContentLoader from "~/components/core/page-loader/ContentLoader";
import { getDetails } from "./helper";

import {
  Copy,
  History,
  IndianRupee,
  LayoutDashboard,
  Plus,
  Recycle,
  Settings,
  ShoppingCart,
  Store,
  Tags,
  TrendingUp,
  ListChecks,
  Truck,
} from "lucide-react";
import { clone as cloneCartItem } from "../../subscribe/cart/helper";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppButton from "~/components/core/button/AppButton";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import NoData from "~/components/core/no-data/NoData";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import { useIsMobile } from "~/hooks/use-mobile";
import useTheme from "~/hooks/useTheme";
import AuthService from "~/services/AuthService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import OmsService from "~/services/OmsService";
import PageAccessService from "~/services/PageAccessService";
import useAppToast from "~/hooks/useAppToast";
import { RefreshCw } from "lucide-react";
import ToggleProductStatus from "~/shared/catalog/components/toggle-product-status/ToggleProductStatus";
import ConsumerOfferConfigModal from "~/shared/catalog/modals/consumer-offer-config/ConsumerOfferConfigModal";
import UnitConfigurationModal from "~/shared/catalog/modals/unit-configuration/UnitConfigurationModal";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SimilarProducts from "~/shared/catalog/components/similar-products/SimilarProducts";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";
import BrandDeals from "./components/brand-deals/BrandDeals";
import ProductCartAction from "./components/product-cart-action/ProductCartAction";
import ProductActions from "./components/product-actions/ProductActions";
import ProductHero from "./components/product-hero/ProductHero";
import ProductPricingPanel from "./components/product-pricing-panel/ProductPricingPanel";
import ProductSidePane from "./components/product-side-pane/ProductSidePane";
import ProductSpecifications from "./components/product-specifications/ProductSpecifications";
import ProductVariants from "./components/product-variants/ProductVariants";
import { collectGroupValues } from "./components/product-variants/helper";
import type { Route } from "./+types/layout";

export async function clientLoader({ params }: { params: { id: string } }) {
  if (PageAccessService.canAccessPage(["INVENTORY.VIEW-INVENTORY"])) {
    return;
  }
  if (!params?.id) throw new Error("Product ID is required");
  const details = await getDetails(params.id);
  return details;
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "All Items",
    langKey: "allItems",
    redirect: { path: "/dashboard/inventory/products/list" },
  },
  { label: "Product Details", langKey: "itemDetails" },
];

const tabs: TabItem[] = [
  { key: "overview", name: "Overview", icon: <LayoutDashboard /> },
  { key: "pricing", name: "Pricing", icon: <Tags /> },
  { key: "trend", name: "Trend", icon: <TrendingUp /> },
  { key: "retailers", name: "Retailers", icon: <Store /> },
  { key: "sales", name: "Sales", icon: <ShoppingCart /> },
  // { key: "analytics", name: "Analytics", icon: "bar-chart-3" },
  { key: "vendors", name: "Vendors & Purchasing", icon: <IndianRupee /> },
  { key: "audit", name: "Audit History", icon: <History /> },
];

/**
 * Mobile-only tab: the specifications block is dropped from the identity column
 * on small screens (see the layout below) and comes back as its own tab, keyed
 * off the `?tab=spec` query param rather than a route of its own.
 */
const SPEC_TAB: TabItem = {
  key: "spec",
  name: "Spec",
  icon: <ListChecks />,
};
const SPEC_TAB_KEY = "spec";

/**
 * theme-2 drops the vendor list from the item page and gives purchasing a tab
 * of its own instead, so purchase history is one click away rather than buried
 * under Audit History (where it is hidden — see InventoryAuditTab).
 */
const PURCHASING_TAB: TabItem = {
  key: "purchasing",
  name: "Purchasing",
  icon: <Truck />,
};
const PURCHASING_TAB_KEY = "purchasing";

const InventoryProductLayout = ({ loaderData }: Route.ComponentProps) => {
  const { t } = useTranslation(["common", "menu"]);

  const { id } = useParams();

  const { revalidate } = useRevalidator();

  // Keep deal in state so child components can update it (e.g. status)
  const [dealState, setDealState] = useState<any>(loaderData);
  const deal = dealState;
  const appNav = useAppNav();
  const isMobile = useIsMobile();
  const isTheme2 = useTheme() === "theme-2";

  const [consumerRequest, setConsumerRequest] = useState<any>(null);
  const [consumerRequestLoading, setConsumerRequestLoading] = useState(false);
  const [showConsumerOfferModal, setShowConsumerOfferModal] = useState(false);
  const [showUnitConfigModal, setShowUnitConfigModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloneLoading, setCloneLoading] = useState(false);
  const [showCloneConfirm, setShowCloneConfirm] = useState(false);
  const { show: showToast } = useAppToast();

  const handleClone = async () => {
    if (!deal?._id) return;
    setShowCloneConfirm(false);
    setCloneLoading(true);
    try {
      const result = await cloneCartItem({
        name: deal.name || "",
        dealName: deal.name || "",
        quantity: 0,
        isCloned: true,
        clonedFrom: deal._id,
        mrp: deal.mrp,
        price: deal.price,
        unitType: deal._raw?.unit || "unit",
      });
      if (result.status === "success") {
        showToast({ msg: result.msg, color: "success" });
        appNav.to("/dashboard/inventory/subscribe/cart");
      } else {
        showToast({ msg: result.msg, color: "error" });
      }
    } finally {
      setCloneLoading(false);
    }
  };

  const fetchSyncStatus = async (dealId: string) => {
    try {
      const resp = await OmsService.getSellerDealSyncStatus(dealId);
      setSyncStatus(resp?.data?.data || null);
    } catch (e) {
      setSyncStatus(null);
    }
  };

  const handleSyncStock = async () => {
    if (!deal?._id) return;
    setIsSyncing(true);
    try {
      const resp = await OmsService.updateSellerDealQuantity({
        sellerId: AuthService.getLoggedInUserId(),
        action: "STOCKCORRECTION_UPDATE",
        remarks: "Stock sync from inventory",
        dealId: deal._id,
        quantity: 1,
      });
      if (resp?.statusCode === 200 || resp?.statusCode === 201) {
        showToast({ msg: "Stock synced successfully", color: "success" });
        await fetchSyncStatus(deal._id);
        revalidate();
      } else {
        showToast({
          msg: resp?.data?.message || "Failed to sync stock",
          color: "error",
        });
      }
    } catch (err: any) {
      showToast({
        msg: err?.message || "Failed to sync stock",
        color: "error",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    setDealState(loaderData);
  }, [loaderData]);

  useEffect(() => {
    if (id) {
      revalidate();
    }
  }, [id, revalidate]);

  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Spec lives on the overview route behind `?tab=spec`, and only exists while
  // the mobile layout (which hides the identity column's spec block) is on.
  const isSpecTab = isMobile && searchParams.get("tab") === SPEC_TAB_KEY;

  // theme-2 swaps "Vendors & Purchasing" out for a plain "Purchasing" tab.
  const baseTabs = useMemo(
    () =>
      isTheme2
        ? tabs.map((item) => (item.key === "vendors" ? PURCHASING_TAB : item))
        : tabs,
    [isTheme2],
  );

  // Spec sits right after Overview so the two identity views stay adjacent.
  const visibleTabs = useMemo(
    () => (isMobile ? [baseTabs[0], SPEC_TAB, ...baseTabs.slice(1)] : baseTabs),
    [isMobile, baseTabs],
  );

  let activeTab =
    baseTabs.find((item) => item.key === location.pathname.split("/").pop())
      ?.key || "overview";
  if (location.pathname.includes("sales-history")) {
    activeTab = "sales";
  } else if (location.pathname.includes("purchase-history")) {
    // In theme-2 purchase history is its own tab; elsewhere it opens Audit.
    activeTab = isTheme2 ? PURCHASING_TAB_KEY : "audit";
  } else if (
    ["stock-ledger", "price-changes"].some((segment) =>
      location.pathname.includes(segment),
    )
  ) {
    activeTab = "audit";
  }
  if (isSpecTab) {
    activeTab = SPEC_TAB_KEY;
  }

  const showViewBins = activeTab === "overview";

  /** Grouped products show their siblings; ungrouped ones get the brand rail. */
  const hasVariants = collectGroupValues(deal).length > 0;

  const fetchConsumerRequests = async (id: string) => {
    setConsumerRequestLoading(true);
    const response = await InventorySubscribeService.getSellerImportProducts({
      filter: {
        isConsumerOffer: true,
        "orgData.dealId": id,
      },
      sort: {
        createdAt: -1,
      },
    });
    const d = InventorySubscribeService.formatSellerImportProducts(
      response.data?.data || [],
    )?.[0];
    setConsumerRequest(d);
    setConsumerRequestLoading(false);
  };

  const handleConsumerOfferClick = () => {
    setShowConsumerOfferModal(true);
  };

  const handleConsumerOfferModalCallback = ({
    action,
    data: modalData,
  }: {
    action: string;
    data?: any;
  }) => {
    setShowConsumerOfferModal(false);
    if (action === "submit") {
      fetchConsumerRequests(deal?._id || "");
    }
  };

  React.useEffect(() => {
    const id = deal?._id || "";
    if (id && !deal?.consumerOffer?.enabled) {
      fetchConsumerRequests(id);
    }
  }, [deal?._id, deal?.consumerOffer?.enabled]);

  React.useEffect(() => {
    if (deal?._id) {
      fetchSyncStatus(deal._id);
    }
  }, [deal?._id]);

  const onTabChange = (tab: TabItem) => {
    if (!deal?._id) return;
    const base = `/dashboard/inventory/products/view/${deal._id}`;
    // The tabs sit part-way down the page, so keep the scroll position instead
    // of letting the router jump back to the top on every switch.
    const navOptions = { preventScrollReset: true };

    if (tab.key == "overview") {
      appNav.to(base, undefined, navOptions);
    } else if (tab.key == SPEC_TAB_KEY) {
      appNav.to(base, { tab: SPEC_TAB_KEY }, navOptions);
    } else if (tab.key == "analytics") {
      appNav.to(`${base}/analytics`, undefined, navOptions);
    } else if (["sales"].includes(String(tab.key))) {
      appNav.to(`${base}/sales-history`, undefined, navOptions);
    } else if (["pricing", "trend", "retailers"].includes(String(tab.key))) {
      appNav.to(`${base}/${tab.key}`, undefined, navOptions);
    } else if (tab.key == "vendors") {
      appNav.to(`${base}/vendors`, undefined, navOptions);
    } else if (tab.key == PURCHASING_TAB_KEY) {
      appNav.to(`${base}/purchase-history`, undefined, navOptions);
    } else if (tab.key == "audit") {
      // theme-2 has moved purchase history out of Audit, so it opens on the
      // first sub-tab that is still there.
      appNav.to(
        `${base}/${isTheme2 ? "stock-ledger" : "purchase-history"}`,
        undefined,
        navOptions,
      );
    }
  };

  const handleViewBins = () => {
    if (!deal?._id) return;

    const scrollToBins = () => {
      setTimeout(() => {
        const element = document.getElementById("product-bin-block");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);
    };

    scrollToBins();
  };

  return (
    <>
      <AppHeader title={t("itemDetails")} />
      <div className="page-bg app-page tw:p-4">
        {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css). */}
        {/* <SectionTabs
          sectionKey="catalog"
          activeTab="my-catalog"
          noShadow
          sticky
        /> */}

        <div className="section-layout section-layout--tight">
          {/* Desktop-only left rail — catalog section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="catalog"
                activeTab="my-catalog"
                title={t("manageCatalog", { ns: "menu" })}
              />
            </div>
          </aside>

          <div className="section-content app-container">
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
              {/* Main column — spans the full grid (the side pane only exists
                  in theme-2 desktop, where the CSS lifts it out of the grid
                  into the fixed list pane; see AppPane / theme-2.css). */}
              <AppPaneMain className="tw:lg:col-span-12 tw:space-y-0">
                <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />

                {!deal ? (
                  <ContentLoader />
                ) : !deal._id ? (
                  <NoData />
                ) : (
                  <div className="tw:grid tw:grid-cols-1 tw:lg:grid-cols-2 tw:gap-4 tw:items-start">
                    {/* Left column — identity and specifications. Sticks below
                        the header while the right column scrolls (lg+ only,
                        where the two-column split exists). No inner scroll container —
                        the column sticks as one block and anything past the
                        viewport comes back into reach as the page scrolls. */}
                    <div className="tw:min-w-0 tw:lg:sticky tw:lg:top-16 tw:lg:self-start">
                      <ProductHero
                        deal={deal}
                        className="detail-hero-flush tw:mb-4"
                        onImagesRequested={revalidate}
                      />

                      {/* theme-1 exposes the product actions below the hero.
                          On desktop they render as a button row; on mobile a
                          single "Actions" button opens a popover with the same
                          actions. theme-2 keeps these in its fixed side pane. */}
                      {!isTheme2 && (
                        <ProductActions
                          deal={deal}
                          showViewBins={showViewBins}
                          onViewBins={handleViewBins}
                          onUnitConfigClick={() => setShowUnitConfigModal(true)}
                          onClone={() => setShowCloneConfirm(true)}
                          cloneLoading={cloneLoading}
                          onEnableOfferClick={handleConsumerOfferClick}
                          hasConsumerRequest={!!consumerRequest?._id}
                          onStatusChange={(newStatus: string) =>
                            setDealState((prev: any) => ({
                              ...prev,
                              status: newStatus,
                            }))
                          }
                          className="tw:mb-4"
                        />
                      )}

                      {/* Same product in other pack sizes / weights. */}
                      <SimilarProducts
                        dealId={deal._id}
                        className="tw:mb-4"
                      />

                      {/* Desktop keeps the add-to-cart with the identity block;
                          mobile carries it in the footer bar instead. */}
                      {/* <div className="tw:mb-4 tw:hidden tw:md:flex tw:justify-end">
                        <ProductCartAction deal={deal} />
                      </div> */}
                      <ProductVariants deal={deal} className="tw:mb-4" />
                      {/* Ungrouped products have no variants list, so the
                          same slot carries a brand rail instead — desktop
                          only, where the identity column has the room. */}
                      {!hasVariants && (
                        <BrandDeals
                          brandId={deal.brand?._id || ""}
                          excludeDealId={deal._id}
                          className="tw:mb-4 tw:hidden tw:lg:block"
                        />
                      )}
                      {/* Mobile moves specifications into its own "Spec" tab. */}
                      <ProductSpecifications
                        deal={deal}
                        className="tw:mb-4 tw:hidden tw:md:block"
                      />
                    </div>

                    {/* Right column — alerts, tabs and the routed content. */}
                    <div className="tw:min-w-0">
                      {syncStatus && syncStatus.isSynced === false && (
                        <InfoBlock
                          className="tw:mb-4"
                          variant="warning"
                          size="sm"
                          bordered
                        >
                          <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:items-center tw:md:justify-between tw:gap-2">
                            <div>
                              Stock is out of sync. Seller deal qty:{" "}
                              {syncStatus.sellerDealQuantity ?? "-"}, Stock
                              master qty:{" "}
                              {syncStatus.stockMasterQuantity ?? "-"}.
                            </div>
                            <AppButton
                              size="small"
                              color="warning"
                              fill="solid"
                              isLoading={isSyncing}
                              onClick={handleSyncStock}
                            >
                              <RefreshCw size={16} />
                              Sync Stock
                            </AppButton>
                          </div>
                        </InfoBlock>
                      )}
                      {deal?.status === "Inactive" && (
                        <InfoBlock
                          className="tw:mb-4"
                          variant="danger"
                          size="sm"
                          bordered
                        >
                          Product is currently “Inactive”, Sales activity for
                          this product is currently paused
                        </InfoBlock>
                      )}
                      <ProductPricingPanel
                        deal={deal}
                        className="tw:mb-4"
                        onUpdated={revalidate}
                      />
                      <AppTab
                        variant={isMobile ? "pills" : "underline"}
                        tabs={visibleTabs}
                        activeTab={activeTab}
                        onTabChange={onTabChange}
                        className="tw:mb-4"
                      />
                      {isSpecTab ? (
                        <ProductSpecifications deal={deal} />
                      ) : (
                        <Outlet />
                      )}
                    </div>
                  </div>
                )}
              </AppPaneMain>

              {/* Side column — only rendered while the theme-2 split layout is
                  active (lg+), where the CSS re-homes it as the fixed pane
                  beside the section icon rail. */}
              <AppPaneSide className="app-pane-only">
                <ProductSidePane
                  deal={deal}
                  onClone={() => setShowCloneConfirm(true)}
                  cloneLoading={cloneLoading}
                  onUnitConfigClick={() => setShowUnitConfigModal(true)}
                  onViewBins={handleViewBins}
                  showViewBins={showViewBins}
                  onEnableOfferClick={handleConsumerOfferClick}
                  hasConsumerRequest={!!consumerRequest?._id}
                  onStatusChange={(newStatus: string) =>
                    setDealState((prev: any) => ({
                      ...prev,
                      status: newStatus,
                    }))
                  }
                />
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>

      {deal && deal._id && (
        <div className="app-footer tw:md:hidden tw:p-4">
          {/* Secondary actions scroll on the left; add-to-cart is pinned right
              so the primary action stays in reach however many chips there are. */}
          <div className="tw:flex tw:items-center tw:gap-3">
            <div className="tw:min-w-0 tw:flex-1">
              {isTheme2 && !deal.isKCStoreEnabled && (
                <AppSwiper
                  config={{
                    slidesPerView: "auto",
                    spaceBetween: 8,
                    freeMode: true,
                  }}
                >
                  <AppSwiper.Slide isAutoWidth>
                    <ToggleProductStatus
                      dealId={deal._raw?._id}
                      status={deal.status}
                      size="small"
                      callback={(res) => {
                        if (res?.action === "submit") {
                          const nextStatus =
                            String(deal.status || "").toLowerCase() === "active"
                              ? "Inactive"
                              : "Active";
                          setDealState((prev: any) => ({
                            ...prev,
                            status: nextStatus,
                          }));
                        }
                      }}
                    />
                  </AppSwiper.Slide>
                  <AppSwiper.Slide isAutoWidth>
                    <AppButton
                      size="small"
                      color="primary"
                      fill="outline"
                      onClick={() => setShowCloneConfirm(true)}
                      isLoading={cloneLoading}
                    >
                      <Copy size={16} />
                      Duplicate
                    </AppButton>
                  </AppSwiper.Slide>
                  <AppSwiper.Slide isAutoWidth>
                    <AppButton
                      size="small"
                      color="primary"
                      fill="outline"
                      onClick={() =>
                        appNav.to(
                          "/dashboard/inventory/products/pre-owned",
                          { dealId: deal._id },
                        )
                      }
                    >
                      <Recycle size={16} />
                      Intake Pre-owned Unit
                    </AppButton>
                  </AppSwiper.Slide>
                  {/* {!deal.consumerOffer?.enabled && !consumerRequest?._id ? (
                <AppSwiper.Slide isAutoWidth>
                  <AppButton
                    color="success"
                    fill="solid"
                    size="small"
                    onClick={handleConsumerOfferClick}
                  >
                    <Plus className="tw:text-white" size={16} />
                    Enable Offer
                  </AppButton>
                </AppSwiper.Slide>
              ) : null} */}
                </AppSwiper>
              )}
            </div>

            <div className="tw:shrink-0">
              <ProductCartAction deal={deal} />
            </div>
          </div>
        </div>
      )}

      <AppAlertDialog
        show={showCloneConfirm}
        title="Duplicate this product?"
        description="A copy of this product will be added to your Catalog Cart for editing."
        okText="Duplicate"
        onConfirm={handleClone}
        onCancel={() => setShowCloneConfirm(false)}
      />

      {/* Consumer Offer Modal */}
      <ConsumerOfferConfigModal
        show={showConsumerOfferModal}
        callback={handleConsumerOfferModalCallback}
        feature="inventory"
        dealData={{
          dealName: deal?.name || "-",
          dealId: deal?._id || "-",
          mrp: deal?.mrp || 0,
          b2cPrice: deal?.b2cPrice || 0,
          brand: deal?.brand,
          category: deal?.category,
          price: deal?.price || 0,
        }}
      />

      <UnitConfigurationModal
        show={showUnitConfigModal}
        dealId={deal?._id}
        callback={({ action }) => {
          setShowUnitConfigModal(false);
          if (action === "submit") {
            revalidate();
          }
        }}
      />
    </>
  );
};

export default InventoryProductLayout;
