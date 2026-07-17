import { Megaphone, ShoppingCart, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppHeader from "~/components/core/header/AppHeader";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppTab from "~/components/core/tab/AppTab";
import { EVENTS } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import CartService from "~/services/CartService";
import FranchiseService from "~/services/FranchiseService";
import MiscService from "~/services/MiscService";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import BasicInfo from "./components/basic-info/BasicInfo";
import Brand from "./components/brand/Brand";
import Category from "./components/category/Category";
import MoreInfo from "./components/more-info/MoreInfo";
import Orders from "./components/orders/Orders";
import Products from "./components/products/Products";
import BannerSlide from "~/shared/banners/banner-slide/BannerSlide";

const tabs: TabItem[] = [
  {
    name: "Stock",
    key: "inventory",
    langKey: "browseProducts",
  },
  {
    name: "Orders",
    key: "orders",
    langKey: "orders",
  },
  {
    name: "More Info",
    key: "more-info",
    langKey: "moreInfo",
  },
];

const breadcrumbData: BreadcrumbItem[] = [
  {
    label: "Home",
    redirect: { path: "/products/main" },
    langKey: "home",
  },
  {
    label: "Discover",
    redirect: { path: "/products/buy-from-other-retailer/retailers" },
    langKey: "discover",
  },
  {
    label: "Retailer",
    langKey: "retailer",
  },
];

const RetailerPage = () => {
  const { id } = useParams();
  const { t } = useTranslation(["common", "menu"]);
  const appNav = useAppNav();
  const appToast = useAppToast();

  const [loading, setLoading] = useState(false);
  const [retailer, setRetailer] = useState<any>({});

  const [cartCount, setCartCount] = useState<number>(0);

  const [searchParams, setSearchParams] = useSearchParams();

  const bannerTitle = searchParams.get("bannerTitle");
  const hasScrollToProduct = !!searchParams.get("scrollToProduct");
  const showBannerChip = hasScrollToProduct && !!bannerTitle;

  const clearBannerFilter = () => {
    const next = new URLSearchParams(searchParams.toString());
    [
      "scrollToProduct",
      "bannerTitle",
      "categoryId",
      "categoryName",
      "brandId",
      "brandName",
      "search",
      "menuId",
      "menuName",
      "inventoryTab",
    ].forEach((k) => next.delete(k));
    setSearchParams(next, { replace: true });
  };

  // default active tab should be Orders list view
  const defaultTab = "inventory";

  const [activeTab, setActiveTab] = useState<string>(
    (searchParams.get("tab") as string) || defaultTab,
  );

  // inner inventory tabs
  const inventoryTabs: TabItem[] = [
    { name: "Products", key: "products", langKey: "products" },
    { name: "Brands", key: "brands", langKey: "brands" },
    { name: "Category", key: "category", langKey: "category" },
  ];

  const [inventoryActiveTab, setInventoryActiveTab] = useState<string>(
    (searchParams.get("inventoryTab") as string) || "products",
  );

  const [busyLoader, setBusyLoader] = useState({ show: false, msg: "" });
  const productsSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // listen to cart events update the count
    const cartAdded = () => {
      setCartCount((prev) => prev + 1);
    };
    const cartRemoved = () => {
      setCartCount((prev) => prev - 1);
    };
    MiscService.listenEvent(EVENTS.CART_ITEM_ADDED, cartAdded);
    MiscService.listenEvent(EVENTS.CART_ITEM_REMOVED, cartRemoved);
    return () => {
      MiscService.removeEventListener(EVENTS.CART_ITEM_ADDED, cartAdded);
      MiscService.removeEventListener(EVENTS.CART_ITEM_REMOVED, cartRemoved);
    };
  }, []);

  useEffect(() => {
    const fetchRetailer = async () => {
      setLoading(true);
      // setRetailer({});

      if (!id) {
        setLoading(false);
        setRetailer({});
        return;
      }

      try {
        const resp = await FranchiseService.getFranchise(id);
        const d = resp.data.data || {};

        const rawDistance = searchParams.get("distance");
        const parsedDistance = Number(rawDistance);
        const resp2 = await FranchiseService.getRetailersNearby({
          filter: { franchiseId: resp.data.data.franchiseId },
          // Mirror the seller-catalog network APIs: "all" => send a very large
          // radius so the backend effectively ignores distance filtering.
          distance:
            Number.isFinite(parsedDistance) && parsedDistance > 0
              ? parsedDistance
              : 1000000000,
        });
        const d2 = resp2.data.data?.[0] || {};

        setRetailer({
          ...d,
          distanceToFranchiseKm: d2.distanceToFranchiseKm,
          isServiceable: d2.isServiceable !== false,
        });
      } catch (error) {
        console.error("Error fetching retailer:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRetailer();
  }, [id]);

  useEffect(() => {
    const fetchCartCount = async () => {
      if (!id) {
        setCartCount(0);
        return;
      }
      try {
        const resp = await CartService.getMyCart({ franchiseId: id });
        const count = resp.data?.data?.items?.length || 0;
        setCartCount(count);
      } catch (err) {
        console.error("Error fetching cart count:", err);
      }
    };

    fetchCartCount();
  }, [id]);

  const onTabChange = (tab: TabItem) => {
    setActiveTab(tab.key);
    // update URL search param so tab is shareable/bookmarkable
    try {
      const next = new URLSearchParams(searchParams.toString());
      next.set("tab", tab.key);
      setSearchParams(next, { preventScrollReset: true });
    } catch (e) {
      // fallback: set simple param
      setSearchParams({ tab: tab.key }, { preventScrollReset: true });
    }
  };

  // keep activeTab in sync when URL changes (back/forward etc)
  useEffect(() => {
    const tabFromUrl = (searchParams.get("tab") as string) || defaultTab;
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
    const invTabFromUrl =
      (searchParams.get("inventoryTab") as string) || "products";
    if (invTabFromUrl !== inventoryActiveTab) {
      setInventoryActiveTab(invTabFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const onInventoryTabChange = (tab: TabItem) => {
    setInventoryActiveTab(tab.key);
    try {
      const next = new URLSearchParams(searchParams.toString());
      next.set("inventoryTab", tab.key);
      setSearchParams(next, { preventScrollReset: true });
    } catch (e) {
      setSearchParams({ inventoryTab: tab.key }, { preventScrollReset: true });
    }
  };

  const onInventoryCallback = async (data: any) => {
    const action = (data && data.action) || "";

    try {
      if (["add", "update", "close"].indexOf(action) !== -1) {
        try {
          const resp = await CartService.getMyCart({ franchiseId: id });
          const count = resp.data?.data?.items?.length || 0;
          setCartCount(count);
        } catch (err) {
          console.error("Error updating cart count from callback:", err);
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const handleCategoryBrandCallback = (p: { action: string; data?: any }) => {
    if (p.action === "view" && p.data) {
      const params: Record<string, string> = {};
      if (p.data.categoryId) {
        params.categoryId = p.data.categoryId;
        params.categoryName = p.data.categoryName || "";
      }
      if (p.data.brandId) {
        params.brandId = p.data.brandId;
        params.brandName = p.data.brandName || "";
      }
      // set search params and switch to products tab
      try {
        const next = new URLSearchParams(params as any);
        next.set("inventoryTab", "products");
        setSearchParams(next, { replace: true, preventScrollReset: true });
      } catch (e) {
        setSearchParams(
          { ...params, inventoryTab: "products" },
          { replace: true, preventScrollReset: true },
        );
      }
      setInventoryActiveTab("products");
    }
  };

  const viewCart = async () => {
    setBusyLoader({ show: true, msg: "Redirecting to cart..." });
    const resp = await CartService.getMyCart({
      franchiseId: id,
    });
    const count = resp.data?.data?.items?.length || 0;
    setCartCount(count);
    setBusyLoader({ show: false, msg: "" });
    if (count > 0) {
      appNav.to("/products/cart/check", {
        retailer: retailer._id,
      });
    } else {
      appToast.show({
        msg: "No items in cart, please add some items to the cart",
        color: "warning",
      });
    }
  };

  return (
    <>
      <AppHeader
        title={`Buy from "${retailer.name || "Retailer"}"`}
        showRecordPayment={false}
      />
      <div className="page-bg app-page tw:p-4">
        <div className="app-container">
          <SectionTabs
            sectionKey="supply"
            activeTab="buy-from-network"
            noShadow
            sticky
          />

          <div className="section-layout section-layout--tight">
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="supply"
                  activeTab="buy-from-network"
                  title={t("manageSupply", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content tw:pb-32">
              <AppBreadcrumbs data={breadcrumbData} />
              {loading ? (
                <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
                  <AppSpinner />
                </div>
              ) : null}

              {retailer?._id ? (
                <>
                  {/* Allow purchase even when retailer is not serviceable */}
                  {/* {retailer.isServiceable === false && (
                <div
                  role="status"
                  aria-live="polite"
                  className="tw:flex tw:items-center tw:gap-3 tw:mb-4 tw:px-4 tw:py-3 tw:bg-red-50 tw:border tw:border-red-200 tw:rounded-lg"
                >
                  <span className="tw:shrink-0 tw:inline-flex tw:items-center tw:justify-center tw:w-8 tw:h-8 tw:rounded-full tw:bg-red-500 tw:text-white">
                    <X size={16} />
                  </span>
                  <div className="tw:min-w-0">
                    <p className="tw:text-sm tw:font-semibold tw:text-red-700">
                      {t("notServiceable")}
                    </p>
                    <p className="tw:text-xs tw:text-red-600">
                      {t("notServiceableNote")}
                    </p>
                  </div>
                </div>
              )} */}

                  {showBannerChip && (
                    <div
                      role="status"
                      aria-live="polite"
                      className="tw:relative tw:flex tw:items-center tw:justify-between tw:gap-4 tw:mb-4 tw:pl-4 tw:pr-3 tw:py-3 tw:bg-amber-50 tw:border tw:border-amber-200 tw:rounded-lg tw:overflow-hidden"
                    >
                      <span
                        className="tw:absolute tw:left-0 tw:top-0 tw:bottom-0 tw:w-1 tw:bg-amber-500"
                        aria-hidden="true"
                      />
                      <div className="tw:flex tw:items-center tw:gap-3 tw:min-w-0 tw:flex-1">
                        <span className="tw:shrink-0 tw:inline-flex tw:items-center tw:justify-center tw:w-8 tw:h-8 tw:rounded-full tw:bg-amber-500 tw:text-white">
                          <Megaphone size={16} />
                        </span>
                        <div className="tw:min-w-0">
                          <p className="tw:text-[10px] tw:uppercase tw:tracking-[0.12em] tw:font-semibold tw:text-amber-700">
                            From banner
                          </p>
                          <p
                            className="tw:text-base tw:font-bold tw:text-slate-900 tw:truncate tw:leading-tight"
                            title={bannerTitle ?? undefined}
                          >
                            {bannerTitle}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={clearBannerFilter}
                        aria-label="Clear filter"
                        className="tw:inline-flex tw:items-center tw:gap-1 tw:shrink-0 tw:px-2.5 tw:py-1.5 tw:text-xs tw:font-semibold tw:text-amber-900 tw:bg-white tw:border tw:border-amber-300 tw:rounded-md tw:hover:bg-amber-100 tw:focus:outline-none tw:focus:ring-2 tw:focus:ring-amber-400 tw:transition-colors"
                      >
                        Clear
                        <X size={12} />
                      </button>
                    </div>
                  )}

                  {!hasScrollToProduct && <BasicInfo data={retailer} />}

                  {!hasScrollToProduct && (
                    <div className="tw:mb-4">
                      <BannerSlide
                        placeholder="HOME_TOP_BANNER"
                        retailerId={retailer._id}
                      />
                    </div>
                  )}

                  {!hasScrollToProduct && (
                    <AppTab
                      tabs={tabs}
                      activeTab={activeTab}
                      onTabChange={onTabChange}
                      className="tw:mb-4"
                    />
                  )}

                  {activeTab === "inventory" ? (
                    <>
                      <div ref={productsSectionRef} className="tw:mb-3">
                        <div className="tw:text-xs tw:text-gray-600 tw:line-clamp-2">
                          {t("browseAvailableProductsFromThisRetailer")}
                        </div>
                      </div>

                      {!hasScrollToProduct && (
                        <AppTab
                          tabs={inventoryTabs}
                          activeTab={inventoryActiveTab}
                          onTabChange={onInventoryTabChange}
                          className="tw:mb-4"
                          variant="underline"
                        />
                      )}

                      {inventoryActiveTab === "products" ? (
                        <Products
                          retailerId={retailer._id}
                          callback={onInventoryCallback}
                          isServiceable={retailer.isServiceable !== false}
                        />
                      ) : null}

                      {inventoryActiveTab === "category" ? (
                        <Category
                          retailerId={retailer._id}
                          callback={handleCategoryBrandCallback}
                        />
                      ) : null}

                      {inventoryActiveTab === "brands" ? (
                        <Brand
                          retailerId={retailer._id}
                          callback={handleCategoryBrandCallback}
                        />
                      ) : null}
                    </>
                  ) : null}

                  {activeTab === "more-info" ? (
                    <MoreInfo data={retailer} />
                  ) : null}

                  {activeTab === "orders" ? (
                    <>
                      <div className="tw:mb-3">
                        <div className="tw:text-sm tw:text-gray-600 tw:line-clamp-2">
                          {t("viewOrdersPlacedForThisRetailer")}
                        </div>
                      </div>
                      <Orders retailerId={retailer._id} />
                    </>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Floating cart FAB — sits above the bottom tab bar. Replaces the sticky
          app-footer so the page doesn't reserve a footer strip. */}
      <button
        type="button"
        onClick={viewCart}
        aria-label={t("proceedToCart")}
        className="tw:fixed tw:right-4 tw:z-50 tw:bg-primary tw:text-primary-foreground tw:h-12 tw:px-5 tw:rounded-full tw:shadow-lg tw:flex tw:items-center tw:gap-2 tw:text-sm tw:font-semibold tw:transition-transform tw:duration-200 tw:cursor-pointer tw:active:scale-95"
        style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
      >
        <ShoppingCart className="tw:w-5 tw:h-5" />
        {t("proceedToCart")}
        {cartCount > 0 ? (
          <span className="tw:ml-1 tw:inline-flex tw:items-center tw:justify-center tw:min-w-5 tw:h-5 tw:px-1 tw:bg-red-500 tw:text-white tw:rounded-full tw:text-xs">
            {cartCount}
          </span>
        ) : null}
      </button>

      <BusyLoader
        show={busyLoader.show || loading}
        message={busyLoader.msg || t("loading")}
      />
    </>
  );
};

export default RetailerPage;
