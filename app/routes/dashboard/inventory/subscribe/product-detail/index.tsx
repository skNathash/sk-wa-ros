import { Barcode, LayoutDashboard, ListChecks, Store } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router";
import Amount from "~/components/core/amount/Amount";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import NoData from "~/components/core/no-data/NoData";
import ContentLoader from "~/components/core/page-loader/ContentLoader";
import AppTab from "~/components/core/tab/AppTab";
import { useIsMobile } from "~/hooks/use-mobile";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";
import ProductVariants from "../../products/view/components/product-variants/ProductVariants";
import { getSubscribeHomeUrl } from "../helper";
import VariantModal from "../modals/variant-modal/VariantModal";
import SubscribeActions from "./components/SubscribeActions";
import SubscribeBarcodes from "./components/SubscribeBarcodes";
import SubscribeDetailSidePane from "./components/SubscribeDetailSidePane";
import SubscribeHero from "./components/SubscribeHero";
import SubscribePricingPanel from "./components/SubscribePricingPanel";
import SubscribeSpecifications from "./components/SubscribeSpecifications";
import SubscribedRetailers from "./components/SubscribedRetailers";
import { getDeal } from "./helper";

const SEARCH_PATH = "/dashboard/inventory/subscribe/search";

const tabs: TabItem[] = [
  { key: "overview", name: "Overview", icon: <LayoutDashboard /> },
  { key: "retailers", name: "Retailers", icon: <Store /> },
  { key: "barcodes", name: "Barcodes", icon: <Barcode /> },
];

/**
 * Mobile-only tab: the specifications block is dropped from the identity column
 * on small screens (see the layout below) and comes back as its own tab.
 */
const SPEC_TAB: TabItem = { key: "spec", name: "Spec", icon: <ListChecks /> };

/** WhatsApp system-message shape for the subscription-state notice: a centred,
 *  self-sized pill with a soft lift, instead of a full-bleed banner. */
const NOTICE_CLASS =
  "tw:mx-auto tw:mb-4 tw:w-fit tw:max-w-full tw:rounded-lg tw:px-3 tw:text-center tw:leading-relaxed tw:shadow-xs";

export default function SubscribeProductDetail() {
  const { t } = useTranslation(["common", "menu", "inventorySubscribe"]);
  const { id } = useParams();
  const appNav = useAppNav();
  const appToast = useAppToast();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();

  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showVariantModal, setShowVariantModal] = useState(false);

  const version = searchParams.get("version");

  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: "Dashboard",
      langKey: "dashboard",
      redirect: { path: "/dashboard" },
    },
    {
      label: t("inventorySubscribe:breadcrumbs.subscription"),
      redirect: { path: getSubscribeHomeUrl(version) },
    },
    { label: "Product Details" },
  ];

  // The header names the item itself — "Item Details" alone never told the user
  // which library item they had opened. The subtitle keeps the section framing
  // (catalog library) plus the brand, so the page still places itself.
  const headerTitle = deal?.name || t("productDetails");
  const headerSubtitle = [
    "SK Library",
    deal?.brand?._displayName || deal?.brand?.name,
  ]
    .filter(Boolean)
    .join(" · ");

  // Spec sits right after Overview so the two identity views stay adjacent.
  const visibleTabs = useMemo(
    () => (isMobile ? [tabs[0], SPEC_TAB, ...tabs.slice(1)] : tabs),
    [isMobile],
  );

  const fetchDeal = async () => {
    if (!id) return;
    setLoading(true);
    try {
      setDeal(await getDeal(id));
    } catch (error) {
      console.error("Failed to fetch product details", error);
      appToast.show({ msg: "Failed to load product details", color: "danger" });
      setDeal(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeal();
  }, [id]);

  // The spec tab only exists on mobile — fall back to overview when the layout
  // widens out from under it.
  useEffect(() => {
    if (!isMobile && activeTab === SPEC_TAB.key) setActiveTab("overview");
  }, [isMobile, activeTab]);

  /** Opens the subscribe catalog scoped to one of the product's taxonomies. */
  const handleFilter = (type: "brand" | "category" | "menu" | "company") => {
    if (!deal) return;

    const params: Record<string, any> = { tab: "search" };

    if (type === "brand" && deal.brand?.id) {
      params.brandId = deal.brand.id;
      params.brandName = deal.brand.name;
    } else if (type === "category" && deal.category?.id) {
      params.categoryId = deal.category.id;
      params.categoryName = deal.category.name;
    } else if (type === "menu" && deal.menu?.id) {
      params.menuId = deal.menu.id;
      params.menuName = deal.menu.name;
    } else if (type === "company" && deal.companyName) {
      params.companyId = deal.companyName;
      params.companyName = deal.companyName;
    } else {
      return;
    }

    appNav.to(SEARCH_PATH, params);
  };

  const handleSubscribed = (data: { action: string; data?: any }) => {
    if (data?.action !== "subscribed") return;
    setDeal((prev: any) =>
      prev
        ? { ...prev, isInCart: true, itemId: data?.data?.itemId || null }
        : prev,
    );
  };

  const handleRemoved = (data: { action: string; data?: any }) => {
    if (data?.action !== "removed") return;
    setDeal((prev: any) =>
      prev ? { ...prev, isInCart: false, itemId: null } : prev,
    );
  };

  const handleVariantModalCallback = ({
    action,
    data,
  }: {
    action: string;
    data?: any;
  }) => {
    setShowVariantModal(false);

    if (action === "subscribed") {
      setDeal((prev: any) =>
        prev
          ? { ...prev, isInCart: true, itemId: data?.itemId || prev.itemId }
          : prev,
      );
      return;
    }

    if (action === "removed") {
      setDeal((prev: any) =>
        prev ? { ...prev, isInCart: false, itemId: null } : prev,
      );
      return;
    }

    if (action === "open_cart" || action === "openCart") {
      appNav.to("/dashboard/inventory/subscribe/cart");
      return;
    }

    // Closed without an explicit result — a variant may still have been added
    // or dropped inside the modal, so re-read the cart for this deal's group.
    if (action === "close" && deal?.groupDeals?.length) {
      const variantIds = deal.groupDeals
        .flatMap((group: any) => (group.values || []).map((v: any) => v._id))
        .filter(Boolean);
      const cartItem = (InventorySubscribeService.getLocalCart() || []).find(
        (item: any) => variantIds.includes(item.dealId),
      );
      setDeal((prev: any) =>
        prev
          ? { ...prev, isInCart: !!cartItem, itemId: cartItem?.itemId || null }
          : prev,
      );
    }
  };

  const description = String(deal?.description || "").trim();

  const renderTabPanel = () => {
    if (activeTab === SPEC_TAB.key)
      return <SubscribeSpecifications deal={deal} />;

    if (activeTab === "retailers")
      return <SubscribedRetailers sellers={deal?.subscribedSellers || []} />;

    if (activeTab === "barcodes")
      return <SubscribeBarcodes barcodes={deal?.barcodes || []} />;

    return (
      <section>
        <h3 className="app-section-label tw:mb-2 tw:px-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
          About this product
        </h3>
        <div className="tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:py-3">
          {description ? (
            <div
              className="rich-text tw:text-sm tw:leading-relaxed tw:text-slate-700"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          ) : (
            <p className="tw:text-sm tw:text-slate-400">
              StoreKing hasn't published a description for this product yet.
            </p>
          )}
        </div>
      </section>
    );
  };

  return (
    <>
      <AppHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        sectionKey="catalog"
        activeTab="library"
      />

      {/* Mobile keeps the subscribe action in the footer bar, so the page
          reserves its strip. */}
      <div className={`page-bg app-page tw:p-4 ${deal ? "has-footer" : ""}`}>
        <div className="section-layout section-layout--tight">
          {/* Desktop-only left rail — catalog section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="catalog"
                activeTab="library"
                title={t("menu:manageCatalog")}
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

                {loading ? (
                  <ContentLoader />
                ) : !deal?._id ? (
                  <NoData />
                ) : (
                  <div className="tw:grid tw:grid-cols-1 tw:lg:grid-cols-2 tw:gap-4 tw:items-start">
                    {/* Left column — identity, variants and specifications.
                        Sticks below the header while the right column scrolls
                        (lg+ only, where the two-column split exists). */}
                    <div className="tw:min-w-0 tw:lg:sticky tw:lg:top-16 tw:lg:self-start">
                      <SubscribeHero
                        deal={deal}
                        className="detail-hero-flush tw:mb-4"
                      />

                      {/* Desktop keeps the subscribe action with the identity
                          block; mobile carries it in the footer bar instead. */}
                      <SubscribeActions
                        deal={deal}
                        onChooseVariant={() => setShowVariantModal(true)}
                        onSubscribed={handleSubscribed}
                        onRemoved={handleRemoved}
                        className="tw:mb-4 tw:hidden tw:md:flex"
                      />

                      <ProductVariants deal={deal} className="tw:mb-4" />

                      {/* Mobile moves specifications into its own "Spec" tab. */}
                      <SubscribeSpecifications
                        deal={deal}
                        className="tw:mb-4 tw:hidden tw:md:block"
                      />
                    </div>

                    {/* Right column — state, pricing, tabs and their content. */}
                    <div className="tw:min-w-0">
                      {/* State notice, shaped like a WhatsApp system message:
                          a centred pill floating on the page tint rather than a
                          full-width banner. Colour still carries the state. */}
                      {deal.isSubscribed ? (
                        <InfoBlock
                          className={NOTICE_CLASS}
                          variant="success"
                          size="sm"
                        >
                          This product is already in your catalog — open it to
                          manage price, stock and status.
                        </InfoBlock>
                      ) : deal.isInCart ? (
                        <InfoBlock
                          className={NOTICE_CLASS}
                          variant="warning"
                          size="sm"
                        >
                          Added to your catalog cart. Submit the cart to send
                          the subscription for approval.
                        </InfoBlock>
                      ) : (
                        <InfoBlock
                          className={NOTICE_CLASS}
                          variant="info"
                          size="sm"
                        >
                          Subscribe to add this product to your catalog and
                          start selling it.
                        </InfoBlock>
                      )}

                      <SubscribePricingPanel
                        deal={deal}
                        onFilter={handleFilter}
                        className="tw:mb-4"
                      />

                      <AppTab
                        variant={isMobile ? "pills" : "underline"}
                        tabs={visibleTabs}
                        activeTab={activeTab}
                        onTabChange={(tab: TabItem) => setActiveTab(tab.key)}
                        className="tw:mb-4"
                      />

                      {renderTabPanel()}
                    </div>
                  </div>
                )}
              </AppPaneMain>

              {/* Side column — only rendered while the theme-2 split layout is
                  active (lg+), where the CSS re-homes it as the fixed pane
                  beside the section icon rail. */}
              <AppPaneSide className="app-pane-only">
                <SubscribeDetailSidePane deal={deal} onFilter={handleFilter} />
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile footer bar — the price stays in view beside the primary action,
          since the pricing panel scrolls away with the page. */}
      {deal?._id && (
        <div className="app-footer tw:md:hidden tw:p-4">
          <div className="tw:flex tw:items-center tw:gap-3">
            <div className="tw:min-w-0 tw:flex-1">
              <div className="app-section-label tw:truncate tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
                {deal.isSubscribed ? "In your catalog" : "Your price"}
              </div>
              <div className="tw:mt-0.5 tw:truncate tw:text-lg tw:font-bold tw:leading-none tw:text-slate-900">
                <Amount value={deal.price || deal.mrp || 0} />
              </div>
            </div>

            <SubscribeActions
              deal={deal}
              compact
              onChooseVariant={() => setShowVariantModal(true)}
              onSubscribed={handleSubscribed}
              onRemoved={handleRemoved}
              className="tw:shrink-0"
            />
          </div>
        </div>
      )}

      {deal?._id && (
        <VariantModal
          show={showVariantModal}
          dealId={deal._id}
          callback={handleVariantModalCallback}
          showAllDeals
        />
      )}
    </>
  );
}
