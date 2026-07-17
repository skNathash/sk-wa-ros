import { Plus, ShoppingCart } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
// import AppPopover from "~/components/core/popover/AppPopover";
import SubscribeTabs from "../components/tabs/SubscribeTabs";
import useAppNav from "~/hooks/useAppNav";
import type { BreadcrumbItem } from "~/types/CommonTypes";
// import CartItems from "../components/CartItems";
import AppBadge from "~/components/core/badge/AppBadge";
import Rbac from "~/components/core/rbac/Rbac";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import "animate.css";
import PageDescription from "~/components/core/page-description/PageDescription";
import AuthService from "~/services/AuthService";
import SubscribeToSellerDealCard from "~/shared/catalog/components/subscribe-to-seller-deal/SubscribeToSellerDealCard";
import MiscService from "~/services/MiscService";
import useScreenView from "~/hooks/useScreenView";
import { getSubscribeHomeUrl } from "../helper";

const rbacRoles = {
  addProduct: ["CATALOG.ADD-PRODUCTS"],
};

const SubscriptionLayout: React.FC = () => {
  const { t } = useTranslation();
  const appNav = useAppNav();
  const { isMobile } = useScreenView();

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

  // Label for the current page, shown as the last (non-clickable) breadcrumb.
  const currentPageLabel = (() => {
    if (location.pathname.includes("browse-brands")) return "Browse by Brand";
    if (isUnbrand || location.pathname.includes("un-brands")) return "Unbranded";
    if (searchParams.get("tab") === "top") return "Popular Near Me";
    return "Catalog";
  })();

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

  const [cartCount, setCartCount] = useState(0);
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
      const { totalCount } =
        await InventorySubscribeService.getCartAndPendingCount();
      setCartCount(totalCount);
    } catch (error) {
      console.error("Error fetching cart details:", error);
      // Fallback to local cart count
      setCartCount(InventorySubscribeService.getLocalCart().length);
    }
  };

  useEffect(() => {
    // Fetch cart details on component mount
    fetchCartDetails();
  }, []);

  useEffect(() => {
    const activeTab = searchParams.get("tab");
    if (
      activeTab === "un-brands" &&
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
  }, [searchParams]);

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
      MiscService.removeEventListener("create-pending-updated", handleCountRefresh);
      // window.removeEventListener(
      //   "subscribe-open-cart-popover",
      //   handleOpenCartPopover
      // );
    };
  }, [cartCount]);

  return (
    <>
      <AppHeader
        title={t("inventorySubscribe:header.title")}
        showAudioNote={true}
        audioNoteTitle={t("inventorySubscribe:header.title")}
        audioFeature="createMyCatalog"
      />
      <div className="page-bg app-page tw:p-4">
        <div className="app-container">
          <div className="tw:flex tw:flex-col tw:md:flex-row tw:items-start tw:md:items-center tw:md:justify-between tw:gap-4 tw:md:mb-4">
            <div>
              <AppBreadcrumbs data={breadcrumbs} className="tw:!mb-0" />
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
            <div className="tw:flex tw:gap-2 tw:md:justify-start tw:w-full tw:md:w-auto tw:self-start tw:sticky tw:top-0 tw:z-10">
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

          <SubscribeToSellerDealCard />

          {!isUnbrand && !hideTab && (
            <div ref={tabsSectionRef}>
              <SubscribeTabs className="tw:mb-4" />
            </div>
          )}
          <Outlet />
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

      {/* Mobile Footer with Create Product and Cart buttons */}
      {isMobile && (
        <div className="app-footer tw:flex tw:gap-2 tw:justify-center tw:items-center">
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
