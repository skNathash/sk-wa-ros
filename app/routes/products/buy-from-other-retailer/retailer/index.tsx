import { ArrowRight, Megaphone, ShoppingCart, Star, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppHeader from "~/components/core/header/AppHeader";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import Amount from "~/components/core/amount/Amount";
import AppTab from "~/components/core/tab/AppTab";
import { EVENTS } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useTheme from "~/hooks/useTheme";
import clsx from "clsx";
import CartService from "~/services/CartService";
import FranchiseService from "~/services/FranchiseService";
import MiscService from "~/services/MiscService";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import BasicInfo from "./components/basic-info/BasicInfo";
import Brand from "./components/brand/Brand";
import Category from "./components/category/Category";
import MoreInfo from "./tabs/more-info/MoreInfo";
import Orders from "./tabs/orders/Orders";
import Products from "./components/products/Products";
import Overview from "./tabs/overview/Overview";
import Offers from "./tabs/offers/Offers";
import PaylaterTab from "./tabs/paylater/Paylater";
import SellerCatalogService from "~/services/SellerCatalogService";
import SellerNavService from "~/services/SellerNavService";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import Sellers from "~/shared/network/components/sellers/Sellers";
import Reorder from "./components/reorder/Reorder";
import NetworkStatement from "~/shared/accounts/components/network-statement/NetworkStatement";

const tabs: TabItem[] = [
  {
    name: "Overview",
    key: "overview",
    langKey: "overview",
  },
  {
    name: "Reorder",
    key: "reorder",
    langKey: "reorder",
  },
  {
    name: "Catalog",
    key: "catalog",
    langKey: "catalog",
  },
  {
    name: "Orders",
    key: "orders",
    langKey: "orders",
  },
  {
    name: "Paylater",
    key: "paylater",
    langKey: "paylater",
  },
  {
    name: "Statement",
    key: "statement",
    langKey: "statement",
  },
  {
    name: "Offers",
    key: "offers",
    langKey: "offers",
  },
  {
    name: "Info",
    key: "info",
    langKey: "info",
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
  const theme = useTheme();
  const isTheme2 = theme === "theme-2";

  const [loading, setLoading] = useState(false);
  const [retailer, setRetailer] = useState<any>({});

  const [cartCount, setCartCount] = useState<number>(0);
  const [cartTotal, setCartTotal] = useState<number>(0);
  const [totalProductsCount, setTotalProductsCount] = useState<number>(0);

  // Derive the item count and payable total from a getMyCart response.
  const readCart = (resp: any) => {
    const items = resp?.data?.data?.items || [];
    const total = items.reduce(
      (sum: number, item: any) =>
        sum + (Number(item.purchasePrice) || 0) * (Number(item.quantity) || 0),
      0,
    );
    return { count: items.length, total };
  };

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

  // default active tab should be Overview
  const defaultTab = "overview";

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

  // Re-fetch the cart whenever items are added or removed so the sticky
  // footer shows the correct count and total immediately. Without this the
  // total stayed at 0 after an add because the count was only incremented
  // locally while the total was never refreshed.
  useEffect(() => {
    const refreshCart = async () => {
      if (!id) return;
      try {
        const resp = await CartService.getMyCart({ franchiseId: id });
        const { count, total } = readCart(resp);
        setCartCount(count);
        setCartTotal(total);
      } catch (err) {
        console.error("Error refreshing cart from cart event:", err);
      }
    };

    MiscService.listenEvent(EVENTS.CART_ITEM_ADDED, refreshCart);
    MiscService.listenEvent(EVENTS.CART_ITEM_REMOVED, refreshCart);
    return () => {
      MiscService.removeEventListener(EVENTS.CART_ITEM_ADDED, refreshCart);
      MiscService.removeEventListener(EVENTS.CART_ITEM_REMOVED, refreshCart);
    };
  }, [id]);

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

        // Remember the seller so the desktop rail's "Sellers" item can jump
        // straight back here (see SellerNavService).
        SellerNavService.rememberLastSeller(d._id || id);

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

        // Fetch total product count for this retailer to display in the footer.
        try {
          const baseParams = SellerCatalogService.getBaseParamsToBuyProduct();
          const countResp = await SellerCatalogService.getProducts({
            ...baseParams,
            sellerId: d._id,
            outputType: "count",
            filter: {
              ...baseParams.filter,
              isLocalDeal: false,
            },
          });
          setTotalProductsCount(countResp.data?.count || 0);
        } catch (countError) {
          console.error("Error fetching total products count:", countError);
          setTotalProductsCount(0);
        }
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
        setCartTotal(0);
        return;
      }
      try {
        const resp = await CartService.getMyCart({ franchiseId: id });
        const { count, total } = readCart(resp);
        setCartCount(count);
        setCartTotal(total);
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
          const { count, total } = readCart(resp);
          setCartCount(count);
          setCartTotal(total);
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
      // set search params and switch to products tab, preserving the other
      // params (tab, distance, …) so the page stays on the Catalog tab
      try {
        const next = new URLSearchParams(searchParams.toString());
        Object.entries(params).forEach(([k, v]) => next.set(k, v));
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
    const { count, total } = readCart(resp);
    setCartCount(count);
    setCartTotal(total);
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

  const handleBrowseCatalog = () => {
    onTabChange({ key: "catalog", name: "Catalog", langKey: "catalog" });
  };

  const retailerName = retailer.name || "Retailer";
  const retailerLocation =
    retailer.city || retailer.district || retailer.addressLine1 || "-";
  // Only show a rating once the store actually has reviews — no invented default.
  const retailerRating =
    Number(retailer.ratingsSummary?.totalReviews) > 0
      ? Number(retailer.ratingsSummary?.avgRating).toFixed(1)
      : null;

  return (
    <>
      <AppHeader
        title={retailerName}
        subtitle={
          retailer?._id ? (
            <span className="tw:flex tw:items-center tw:gap-1">
              <span className="tw:truncate">{retailerLocation}</span>
              {retailerRating ? (
                <>
                  <span>·</span>
                  <span className="tw:flex tw:items-center tw:gap-0.5">
                    <Star
                      size={10}
                      className="tw:fill-amber-400 tw:text-amber-400"
                    />
                    {retailerRating}
                  </span>
                </>
              ) : null}
            </span>
          ) : null
        }
        showRecordPayment={false}
      />
      <div
        className={clsx(
          "page-bg app-page tw:p-4",
          (activeTab === "overview" ||
            (activeTab === "catalog" && cartCount > 0)) &&
            "has-footer",
        )}
      >
        <div className="app-container">
          {/* <SectionTabs
            sectionKey="supply"
            activeTab="sellers"
            noShadow
            sticky
          /> */}

          <div className="section-layout section-layout--tight">
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="supply"
                  activeTab="sellers"
                  title={t("manageSupply", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content tw:pb-32">
              <AppBreadcrumbs data={breadcrumbData} />

              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                {/* Main column — spans the full grid (the side pane only
                    exists in theme-2 desktop, where the CSS lifts it out of
                    the grid into the fixed list pane; see AppPane). */}
                <AppPaneMain className="tw:lg:col-span-12">
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

                      {/* Seller info sits above the tabs on every breakpoint,
                          and the two pin together under the header as one
                          full-bleed band — see `.detail-hero*` in theme-2.css.
                          The wrapper is `display: contents` below md, so the
                          tab bar keeps its own sticky behaviour there. */}
                      <div className="detail-hero">
                        {!hasScrollToProduct && (
                          <div className="tw:mb-4 app-bleed-x detail-hero-bleed">
                            <BasicInfo data={retailer} />
                          </div>
                        )}

                        {!hasScrollToProduct && (
                          <AppTab
                            tabs={tabs}
                            activeTab={activeTab}
                            onTabChange={onTabChange}
                            className="tw:mb-4 tw:sticky tw:top-15 tw:z-30 edge-tabs vendor-tab-sticky detail-hero-tabs"
                            variant="underline"
                          />
                        )}
                      </div>

                      {activeTab === "overview" ? (
                        <Overview
                          retailer={retailer}
                          showIntro={!hasScrollToProduct}
                        />
                      ) : null}

                      {activeTab === "reorder" ? (
                        <Reorder
                          retailerId={retailer._id}
                          retailerName={retailer.name}
                          onBrowseCatalog={handleBrowseCatalog}
                        />
                      ) : null}

                      {activeTab === "catalog" ? (
                        <>
                          {!isTheme2 && (
                            <div ref={productsSectionRef} className="tw:mb-3">
                              <div className="tw:text-xs tw:text-gray-600 tw:line-clamp-2">
                                {t("browseAvailableProductsFromThisRetailer")}
                              </div>
                            </div>
                          )}

                          {!isTheme2 && !hasScrollToProduct && (
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

                      {activeTab === "orders" ? (
                        <>
                          {/* <div className="tw:mb-3">
                            <div className="tw:text-sm tw:text-gray-600 tw:line-clamp-2">
                              {t("viewOrdersPlacedForThisRetailer")}
                            </div>
                          </div> */}
                          <Orders
                            retailerId={retailer._id}
                            retailerName={retailer.name}
                          />
                        </>
                      ) : null}

                      {activeTab === "paylater" ? (
                        <PaylaterTab
                          retailerId={retailer._id}
                          retailerName={retailer.name}
                        />
                      ) : null}

                      {activeTab === "statement" ? (
                        <NetworkStatement
                          id={retailer._id}
                          title="Statement"
                          partyName={retailer.name}
                          partyPhone={retailer.mobile}
                        />
                      ) : null}

                      {activeTab === "offers" ? (
                        <Offers retailerId={retailer._id} />
                      ) : null}

                      {activeTab === "info" ? (
                        <MoreInfo data={retailer} />
                      ) : null}
                    </>
                  ) : null}
                </AppPaneMain>

                {/* Side column — only rendered while the theme-2 split layout
                    is active (lg+), where the CSS re-homes it as the fixed
                    seller list pane beside the icon rail. */}
                <AppPaneSide className="app-pane-only">
                  <Sellers
                    activeSellerId={id}
                    distance={searchParams.get("distance") || undefined}
                  />
                </AppPaneSide>
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeTab === "catalog" && cartCount > 0 ? (
        <footer className="app-footer app-footer-fixed tw:flex tw:items-center tw:justify-between tw:gap-3 tw:rounded-t-2xl tw:px-4 tw:py-3">
          <div className="tw:flex tw:flex-col tw:min-w-0 tw:flex-1">
            <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
              {t("total", "Total")}
            </span>
            <Amount
              value={cartTotal}
              className="tw:text-lg tw:font-bold tw:text-slate-800"
            />
          </div>
          <button
            type="button"
            onClick={viewCart}
            aria-label={t("viewCart", "View cart")}
            className="tw:inline-flex tw:shrink-0 tw:items-center tw:gap-1.5 tw:rounded-full tw:bg-primary tw:px-3.5 tw:py-1.5 tw:text-xs tw:font-semibold tw:text-primary-foreground tw:shadow-sm tw:transition-colors tw:hover:bg-primary-dark tw:focus:outline-none tw:focus:ring-2 tw:focus:ring-primary/50 tw:cursor-pointer tw:active:scale-95"
          >
            <ShoppingCart className="tw:w-3.5 tw:h-3.5" />
            {t("viewCart", "View cart")}
            {cartCount > 0 ? (
              <span className="tw:ml-1 tw:inline-flex tw:items-center tw:justify-center tw:min-w-4 tw:h-4 tw:px-1 tw:bg-red-500 tw:text-white tw:rounded-full tw:text-[10px]">
                {cartCount}
              </span>
            ) : null}
          </button>
        </footer>
      ) : null}

      {activeTab === "overview" ? (
        <footer className="app-footer app-footer-fixed tw:md:hidden tw:flex tw:items-center tw:justify-between tw:gap-3 tw:rounded-t-2xl tw:px-4 tw:py-3">
          <div className="tw:flex tw:flex-col tw:min-w-0 tw:flex-1">
            <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
              {t("orderFrom", "Order from")}
            </span>
            <span className="tw:text-sm tw:font-semibold tw:text-slate-800">
              {t("browseCatalog", "Browse catalog")} · {totalProductsCount}{" "}
              {t("skus", "SKUs")}
            </span>
          </div>
          <button
            type="button"
            onClick={handleBrowseCatalog}
            className="tw:inline-flex tw:shrink-0 tw:items-center tw:gap-1 tw:rounded-full tw:bg-primary tw:px-4 tw:py-2 tw:text-sm tw:font-semibold tw:text-white tw:shadow-sm tw:transition-colors tw:hover:bg-primary-dark tw:focus:outline-none tw:focus:ring-2 tw:focus:ring-primary/50"
          >
            {t("browse", "Browse")}
            <ArrowRight size={16} />
          </button>
        </footer>
      ) : null}

      <BusyLoader
        show={busyLoader.show || loading}
        message={busyLoader.msg || t("loading")}
      />
    </>
  );
};

export default RetailerPage;
