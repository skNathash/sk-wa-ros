import { Plus, ShoppingCart } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
// import AppPopover from "~/components/core/popover/AppPopover";
import SubscribeTabs from "../components/tabs/SubscribeTabs";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
// import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import SubscribeNavChips from "~/shared/inventory/components/subscribe-nav-chips/SubscribeNavChips";
import SubscribeSidePane from "~/shared/inventory/components/subscribe-side-pane/SubscribeSidePane";
import SubscribeCartBar from "~/shared/inventory/components/subscribe-cart-bar/SubscribeCartBar";
import useAppNav from "~/hooks/useAppNav";
import useTheme from "~/hooks/useTheme";
import type { BreadcrumbItem } from "~/types/CommonTypes";
// import CartItems from "../components/CartItems";
import AppBadge from "~/components/core/badge/AppBadge";
import Rbac from "~/components/core/rbac/Rbac";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import "animate.css";
import PageDescription from "~/components/core/page-description/PageDescription";
import AuthService from "~/services/AuthService";
import SubscribeToSellerDealCard from "~/shared/catalog/components/subscribe-to-seller-deal/SubscribeToSellerDealCard";
import FirstDealBanner from "~/shared/catalog/components/first-deal-banner/FirstDealBanner";
import MiscService from "~/services/MiscService";
import useScreenView from "~/hooks/useScreenView";
import { getSubscribeHomeUrl } from "../helper";
import { fetchLibrarySkuCount, prepareCatalogSubtitle } from "./helper";
import { getActiveSubscribeChip } from "~/shared/inventory/components/subscribe-pane-chips/helper";

const rbacRoles = {
  addProduct: ["CATALOG.ADD-PRODUCTS"],
};

const SubscriptionLayout: React.FC = () => {
  const { t } = useTranslation(["inventorySubscribe", "menu", "common"]);
  const appNav = useAppNav();
  const { isMobile } = useScreenView();
  const isTheme2 = useTheme() === "theme-2";

  const [searchParams] = useSearchParams();
  const location = useLocation();

  const mode = searchParams.get("mode") || "";
  const version = searchParams.get("version");

  const isUnbrand = mode === "unbrand";

  // Cart link carries the active flow so the cart breadcrumb can route back to
  // the right "Create My Catalog" landing.
  const cartUrl =
    version === "old"
      ? "/dashboard/inventory/subscribe/cart?version=old"
      : "/dashboard/inventory/subscribe/cart";

  const hideTab = searchParams.get("hideTab") === "true";

  // `hideTab=true` (drill-downs from Discover, the brand/category grids, the
  // side pane …) drops the desktop tab row, but in theme-2 the chip strip is
  // the page's only sub-nav on mobile — hiding it leaves no way back to
  // Discover/Search/Menus. Keep the strip there regardless; the CSS already
  // hides it from md up.
  const showNavChips = !hideTab || isTheme2;

  // The chip the current view belongs to — the header title and the last
  // breadcrumb both read from it, so a view opened from the side pane is titled
  // with the chip that led there ("In and Around", "Browse Brands" …) instead
  // of the generic section name.
  const activeChip = isUnbrand
    ? getActiveSubscribeChip("/dashboard/inventory/subscribe/un-brands")
    : getActiveSubscribeChip(location.pathname, searchParams.get("tab"));

  const pageTitle = activeChip
    ? t(`inventorySubscribe:${activeChip.langKey}`, {
        defaultValue: activeChip.label,
      })
    : t("inventorySubscribe:header.title");

  // Label for the current page, shown as the last (non-clickable) breadcrumb.
  const currentPageLabel = activeChip ? pageTitle : "Catalog";

  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: t("inventorySubscribe:breadcrumbs.dashboard"),
      redirect: { path: "/dashboard" },
    },
    {
      label: t("inventorySubscribe:breadcrumbs.subscription"),
      redirect: { path: getSubscribeHomeUrl(version) },
    },
    { label: currentPageLabel },
  ];

  // Size of the catalog behind this section, shown under the header title.
  const [librarySkus, setLibrarySkus] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetchLibrarySkuCount().then((count) => {
      if (!cancelled) setLibrarySkus(count);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const headerSubtitle = prepareCatalogSubtitle(librarySkus);

  const [cartCount, setCartCount] = useState(0);
  // Cart value for the mobile bar. Pending AI barcode items carry no price, so
  // this can lag the count — 0 just drops the amount from the bar.
  const [cartValue, setCartValue] = useState(0);
  // theme-2 mobile has no cart entry otherwise: the FAB below is md+ only and
  // the page footer is hidden there, so the pinned cart bar stands in for both.
  const showCartBar = isMobile && isTheme2 && cartCount > 0;
  const [isAnimating, setIsAnimating] = useState(false);
  const [invalidBarcodeCount, setInvalidBarcodeCount] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await InventorySubscribeService.getInvalidBarcodes({
          filter: { status: "PENDING" },
          outputType: "count",
        });
        setInvalidBarcodeCount(res?.data?.data?.count || 0);
      } catch (e) {
        console.error("Error fetching invalid barcode count:", e);
      }
    })();
  }, []);
  // const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // const cartTriggerRef = useRef<HTMLDivElement>(null);
  const tabsSectionRef = useRef<HTMLDivElement>(null);

  // Fetch cart details and update count on component load
  const fetchCartDetails = async () => {
    try {
      const { totalCount, cartValue: value } =
        await InventorySubscribeService.getCartAndPendingCount();
      setCartCount(totalCount);
      setCartValue(value);
    } catch (error) {
      console.error("Error fetching cart details:", error);
      // Fallback to local cart count
      setCartCount(InventorySubscribeService.getLocalCart().length);
      setCartValue(0);
    }
  };

  useEffect(() => {
    // Fetch cart details on component mount
    fetchCartDetails();
  }, []);

  useEffect(() => {
    const activeTab = searchParams.get("tab");
    // theme-2 mobile pins the tab strip under the sticky header already, so the
    // auto-scroll just yanks the page away from the top for no gain.
    if (
      activeTab === "un-brands" &&
      !isTheme2 &&
      tabsSectionRef.current &&
      MiscService.isMobile()
    ) {
      const scrollTimer = setTimeout(() => {
        tabsSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 1000);

      return () => clearTimeout(scrollTimer);
    }
  }, [searchParams, isTheme2]);

  useEffect(() => {
    const handleItemAdded = () => {
      // Refresh cart data from API
      fetchCartDetails();

      // Trigger flip animation
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 2000);

      // Commented out: Auto-open cart popover when first item is added
      // if (cartTriggerRef.current) {
      //   if (cartCount === 0) {
      //     cartTriggerRef.current.click();
      //   }
      // }
    };

    const handleItemRemoved = () => {
      // Refresh cart data from API
      fetchCartDetails();
    };

    const handleCountRefresh = () => {
      fetchCartDetails();
    };

    // Commented out: Handle open cart popover event
    // const handleOpenCartPopover = () => {
    //   setIsPopoverOpen(true);
    // };

    document.addEventListener("subscribe-item-added", handleItemAdded);
    document.addEventListener("subscribe-item-removed", handleItemRemoved);
    MiscService.listenEvent("create-pending-updated", handleCountRefresh);
    // window.addEventListener(
    //   "subscribe-open-cart-popover",
    //   handleOpenCartPopover
    // );

    return () => {
      document.removeEventListener("subscribe-item-added", handleItemAdded);
      document.removeEventListener("subscribe-item-removed", handleItemRemoved);
      MiscService.removeEventListener(
        "create-pending-updated",
        handleCountRefresh,
      );
      // window.removeEventListener(
      //   "subscribe-open-cart-popover",
      //   handleOpenCartPopover
      // );
    };
  }, [cartCount]);

  return (
    <>
      <AppHeader
        title={pageTitle}
        subtitle={headerSubtitle}
        showAudioNote={true}
        audioNoteTitle={t("inventorySubscribe:header.title")}
        audioFeature="createMyCatalog"
        sectionKey="catalog"
        activeTab="library"
        mobileLead="menu"
        renderActions={
          isTheme2 && !isMobile ? (
            <Rbac
              roles={rbacRoles.addProduct}
              forceDisplay={AuthService.isMasterLogin()}
            >
              <AppButton
                onClick={() =>
                  appNav.to("/dashboard/inventory/subscribe/add-product")
                }
                color="primary"
                size="small"
                className="tw:relative"
              >
                <Plus />
                {t("inventorySubscribe:actions.addProduct")}
                {invalidBarcodeCount > 0 && (
                  <span className="tw:absolute tw:-top-2 tw:-right-2 tw:bg-red-600 tw:text-white tw:text-xs tw:font-bold tw:rounded-full tw:min-w-5 tw:h-5 tw:px-1 tw:flex tw:items-center tw:justify-center">
                    {invalidBarcodeCount}
                  </span>
                )}
              </AppButton>
            </Rbac>
          ) : undefined
        }
      />
      {/* theme-2 mobile shows the cart as a pinned bar instead of the footer
          below (which theme-2 hides) — reserve its strip so the last row of
          content isn't stuck behind it. */}
      <div
        className={`page-bg app-page tw:p-4 ${showCartBar ? "has-footer" : ""}`}
      >
        {/* Section tabs — replaced on mobile by the SubscribeNavChips strip the
            pages render, so the two sticky bars don't stack. */}
        {/* {!isSearchPage && (
          <SectionTabs
            sectionKey="catalog"
            activeTab="library"
            noShadow
            sticky
          />
        )} */}

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

          {/* `subscribe-flush-top` cancels the page's 1rem top gutter on
              theme-2 mobile so the chip strip / tab block sits flush under
              the sticky header (see theme-2.css). */}
          <div className="section-content app-container subscribe-flush-top">
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start theme-2-mobile-gap-top">
              {/* Main column — spans the full grid (the side pane only exists
                  in theme-2 desktop, where the CSS lifts it out of the grid
                  into the fixed list pane; see AppPane / theme-2.css). */}
              <AppPaneMain className="tw:lg:col-span-12">
                {/* In theme-2 the breadcrumbs, page description and action block
                    are all hidden, so this row would collapse to an empty band
                    that still pays its bottom margin — skip it entirely. The
                    unbrand caption is the one thing theme-2 still shows here. */}
                {(!isTheme2 || isUnbrand) && (
                  <div className="tw:flex tw:flex-col tw:md:flex-row tw:items-start tw:md:items-center tw:md:justify-between tw:gap-4 tw:md:mb-4 theme-2-mobile-hide">
                    <div>
                      <AppBreadcrumbs data={breadcrumbs} className="tw:mb-0!" />
                      {isUnbrand ? (
                        <div className="tw:text-sm tw:text-slate-500">
                          Items under{" "}
                          <span className="tw:font-bold">
                            {searchParams.get("categoryName")}
                          </span>
                        </div>
                      ) : (
                        <PageDescription description="createCatalog" />
                      )}
                    </div>
                    {/* theme-2 drops the top-right action block; the create-product
                        entry lives in the section nav / side pane instead. */}
                    <div className="tw:flex tw:gap-2 tw:md:justify-start tw:w-full tw:md:w-auto tw:self-start tw:sticky tw:top-0 tw:z-10 theme-2-hide">
                      <Rbac
                        roles={rbacRoles.addProduct}
                        forceDisplay={AuthService.isMasterLogin()}
                      >
                        <AppButton
                          onClick={() =>
                            appNav.to(
                              "/dashboard/inventory/subscribe/add-product",
                            )
                          }
                          color="success"
                          size="small"
                          className="tw:hidden tw:md:inline-flex tw:relative"
                        >
                          <Plus />
                          {t("inventorySubscribe:actions.createProduct")}
                          {invalidBarcodeCount > 0 && (
                            <span className="tw:absolute tw:-top-2 tw:-right-2 tw:bg-red-600 tw:text-white tw:text-xs tw:font-bold tw:rounded-full tw:min-w-5 tw:h-5 tw:px-1 tw:flex tw:items-center tw:justify-center">
                              {invalidBarcodeCount}
                            </span>
                          )}
                        </AppButton>
                      </Rbac>
                    </div>
                  </div>
                )}

                {/* First-time franchise (nothing ever subscribed) — points at
                    the catalog before anything else on the page. */}
                <FirstDealBanner />

                <SubscribeToSellerDealCard />

                {/* The tab bar and the routed content share this wrapper so the
                sticky sub-nav has a tall enough parent to travel over as the
                page scrolls (position:sticky is bounded by its parent's box). */}
                {/* `has-subscribe-nav` tells the pages' sticky search bars that
                    there is a chip strip above them to pin under (theme-2
                    mobile) — see `.catalog-search-sticky` in theme-2.css. */}
                <div
                  ref={tabsSectionRef}
                  className={`app-tabs-flush ${showNavChips ? "has-subscribe-nav" : ""}`}
                >
                  {/* Mobile sub-nav — the chip strip stands in for the section
                      tab bar on every subscribe page under this layout, so the
                      pages don't each have to render it. */}
                  {showNavChips && <SubscribeNavChips className="tw:mb-2" />}

                  {/* The tab row is hidden on mobile, where the chip strip above
                      is the sub-nav, and also drops out where the theme-2 split
                      pane is active (lg+), since the side pane's
                      SubscribePaneChips replace it there — see `.app-pane-hide`. */}
                  {!isUnbrand && !hideTab && (
                    <SubscribeTabs className="tw:hidden tw:md:block tw:mb-2 edge-tabs subscribe-tabs-sticky app-pane-hide" />
                  )}
                  <Outlet />
                </div>
              </AppPaneMain>

              {/* Side column — only rendered while the theme-2 split layout is
                  active (lg+), where the CSS re-homes it as the fixed catalog
                  list pane beside the icon rail. */}
              <AppPaneSide className="app-pane-only">
                {/* The pane heads with the section-menu name ("SK Library");
                    the scope label carries the view you're actually on. */}
                <SubscribeSidePane scopeLabel={currentPageLabel} />
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>

      {/* Commented out: Cart Popover */}
      {/* <AppPopover
        open={isPopoverOpen}
        onOpenChange={setIsPopoverOpen}
        triggerContent={
          <div
            className={`tw:fixed tw:bottom-4 tw:right-4 tw:rounded-full tw:bg-orange-500 tw:text-white tw:p-1 tw:shadow-lg tw:h-12 tw:w-12 tw:items-center tw:justify-center tw:cursor-pointer tw:hover:scale-105 tw:transition-all tw:duration-300 tw:z-20 tw:ring-2 tw:ring-orange-300 tw:ring-opacity-50 tw:hidden tw:md:flex ${
              isAnimating
                ? "animate__animated animate__flipInY animate__slow"
                : ""
            } ${
              cartCount > 0
                ? "tw:ring-4 tw:ring-orange-400 tw:ring-opacity-75 tw:bg-orange-600"
                : ""
            }`}
            ref={cartTriggerRef}
          >
            {cartCount > 0 && (
              <AppBadge
                variant="danger"
                className="tw:absolute tw:-top-2 tw:right-0 animate__animated animate__pulse"
              >
                <div className="tw:text-xs tw:font-bold">{cartCount}</div>
              </AppBadge>
            )}
            <ShoppingCart
              size={24}
              className={
                cartCount > 0
                  ? "animate__animated animate__bounceIn animate__infinite animate__slow"
                  : ""
              }
            />
          </div>
        }
        noPadding
      >
        <CartItems onClose={() => setIsPopoverOpen(false)} />
      </AppPopover> */}

      {/* Cart FAB - Desktop view only, redirects to cart page */}
      <div
        className={`tw:fixed tw:bottom-4 tw:right-4 tw:rounded-full tw:bg-orange-500 tw:text-white tw:p-1 tw:shadow-lg tw:h-12 tw:w-12 tw:items-center tw:justify-center tw:cursor-pointer tw:hover:scale-105 tw:transition-all tw:duration-300 tw:z-20 tw:ring-2 tw:ring-orange-300 tw:ring-opacity-50 tw:hidden tw:md:flex ${
          isAnimating ? "animate__animated animate__flipInY animate__slow" : ""
        } ${
          cartCount > 0
            ? "tw:ring-4 tw:ring-orange-400 tw:ring-opacity-75 tw:bg-orange-600"
            : ""
        }`}
        onClick={() => appNav.to(cartUrl)}
      >
        {cartCount > 0 && (
          <AppBadge
            variant="danger"
            className="tw:absolute tw:-top-2 tw:right-0 animate__animated animate__pulse"
          >
            <div className="tw:text-xs tw:font-bold">{cartCount}</div>
          </AppBadge>
        )}
        <ShoppingCart
          size={24}
          className={
            cartCount > 0
              ? "animate__animated animate__bounceIn animate__infinite animate__slow"
              : ""
          }
        />
      </div>

      {/* Cart bar — theme-2 mobile only, pinned above the bottom tab bar. */}
      {showCartBar && (
        <SubscribeCartBar
          count={cartCount}
          amount={cartValue}
          pulse={isAnimating}
          onView={() => appNav.to(cartUrl)}
        />
      )}

      {/* Mobile Footer with Create Product and Cart buttons */}
      {isMobile && (
        <div className="app-footer theme-2-mobile-hide tw:flex tw:gap-2 tw:justify-center tw:items-center">
          <Rbac
            roles={rbacRoles.addProduct}
            forceDisplay={AuthService.isMasterLogin()}
          >
            <AppButton
              onClick={() =>
                appNav.to("/dashboard/inventory/subscribe/add-product")
              }
              color="success"
              size="small"
              className="tw:flex-1 tw:relative"
            >
              <Plus />
              {t("inventorySubscribe:actions.createProduct")}
              {invalidBarcodeCount > 0 && (
                <span className="tw:absolute tw:-top-2 tw:-right-2 tw:bg-red-600 tw:text-white tw:text-xs tw:font-bold tw:rounded-full tw:min-w-5 tw:h-5 tw:px-1 tw:flex tw:items-center tw:justify-center">
                  {invalidBarcodeCount}
                </span>
              )}
            </AppButton>
          </Rbac>

          <AppButton
            size="small"
            onClick={() => appNav.to(cartUrl)}
            className="tw:flex-1"
          >
            <ShoppingCart size={16} />
            Cart ({cartCount})
          </AppButton>
        </div>
      )}
    </>
  );
};

export default SubscriptionLayout;
