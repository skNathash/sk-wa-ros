import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import { withTileDecor, type TileDecor } from "~/components/core/tint/tints";
import { useSidebar } from "~/components/ui/sidebar";
import { DEFAULT_BROWSE_DISTANCE } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import useTheme from "~/hooks/useTheme";
import SellerCatalogService from "~/services/SellerCatalogService";
import { useCatalogOverviewCounts } from "~/shared/catalog/components/supply-catalog-pane/CatalogOverview";
import SupplyCatalogPane from "~/shared/catalog/components/supply-catalog-pane/SupplyCatalogPane";
import SupplyCatalogSectionTabs from "~/shared/catalog/components/supply-catalog-section-tabs/SupplyCatalogSectionTabs";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import BuyFromNetworkTab from "../../components/BuyFromNetworkTab";
import {
  getCount as getSellerCount,
  prepareParams as prepareSellerParams,
} from "../../retailers/helper";
import Brands from "../components/Brands";
import Footer from "../components/Footer";
import MenuList from "../components/menu-list/MenuList";
import Menus from "../components/Menus";
import ProductsBanner from "../components/ProductsBanner";
import SearchWithVoice from "../components/SearchWithVoice";
import SmartCartCard from "../components/SmartCartCard";
import TopBrandsCategory from "../components/top-brands-category/TopBrandsCategory";
import TopSellers from "../components/top-sellers/TopSellers";
import TrySearches from "../components/TrySearches";
import MenuData from "./components/menu-data/MenuData";
import NewlyLaunched from "./components/newly-launched/NewlyLaunched";
import ProductsList from "./components/products-list/ProductsList";
import TopSelling from "./components/top-selling/TopSelling";
import Trending from "./components/trending/Trending";

type MenuBase = {
  name: string;
  _id: string;
  _displayImg: string;
  _displayName: string;
};

/** What the tiles consume — the API shape plus its resolved tile decoration. */
type Menu = MenuBase & TileDecor;

const KM = DEFAULT_BROWSE_DISTANCE;

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Home",
    redirect: { path: "/products/main" },
  },
  {
    label: "Products",
    langKey: "browseProducts",
  },
];

const BuyFromOtherRetailerProductsMainPage = () => {
  const { t } = useTranslation(["common", "menu"]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [searchParams] = useSearchParams();
  const rawDistance = searchParams.get("distance") || KM;
  const distance: any = rawDistance === "all" ? "all" : Number(rawDistance);
  const appNav = useAppNav();
  const { setOpen, open } = useSidebar();
  const isTheme2 = useTheme() === "theme-2";

  // Collapse the side menu when this page opens; the user can reopen it via the toggle.
  useEffect(() => {
    setOpen(false);
  }, []);

  // ref to hold the full menus data so we always slice from the source
  const allMenusRef = useRef<Menu[]>([]);
  // full menus list shared with the Menus / MenuList components
  const [allMenus, setAllMenus] = useState<Menu[]>([]);
  const [displayedMenus, setDisplayedMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    // Clear previous data when distance changes and show loading state
    setLoading(true);
    setMenus([]);
    setAllMenus([]);
    setDisplayedMenus([]);
    allMenusRef.current = [];

    const fetchMenus = async () => {
      try {
        const response = await SellerCatalogService.getNetworkMenus(
          {
            page: 1,
            limit: 50,
          },
          distance,
        );
        // Label, initial and tint are resolved here, once, so the tiles that
        // render these menus have nothing left to compute.
        const formattedMenus = withTileDecor<MenuBase>(
          SellerCatalogService.formatMenuResponse(response.data?.data || []),
        );
        // store full formatted menus in ref and state
        allMenusRef.current = formattedMenus;
        setAllMenus(formattedMenus);
        // keep the `menus` state for components that read it (e.g. Menus)
        setMenus(formattedMenus.slice(0, 14));
        // initial displayed menus should come from the ref as well
        setDisplayedMenus(allMenusRef.current.slice(0, 3));
      } catch (error) {
        console.error("Error fetching menus:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, [distance]);

  const loadMore = async () => {
    setLoadingMore(true);
    // Simulate async for loading state
    await new Promise((resolve) => setTimeout(resolve, 500));
    // slice from the ref which holds the full, canonical menus
    const nextMenus = allMenusRef.current.slice(
      displayedMenus.length,
      displayedMenus.length + 3,
    );
    setDisplayedMenus((prev) => [...prev, ...nextMenus]);
    setLoadingMore(false);
  };

  const handleDiscoverSellers = () => {
    appNav.to("/products/buy-from-other-retailer/retailers", { distance });
  };

  // Counts fetch for the feed-grid CatalogOverview.
  const { counts, countsLoading } = useCatalogOverviewCounts(distance);

  // Seller total for the header subtitle — same count query the Sellers page
  // runs, asked for the current radius only.
  const [sellerCount, setSellerCount] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;

    const fetchSellerCount = async () => {
      try {
        const params = prepareSellerParams({ distance }, {
          activePage: 1,
          rowsPerPage: 1,
        } as any);
        const total = Number(await getSellerCount(params)) || 0;
        if (!cancelled) setSellerCount(total);
      } catch (error) {
        console.error("Error fetching seller count:", error);
      }
    };

    fetchSellerCount();

    return () => {
      cancelled = true;
    };
  }, [distance]);

  return (
    <>
      <AppHeader
        sectionKey="supply"
        activeTab="browse"
        mobileLead="menu"
        title="Marketplace"
        subtitle={
          sellerCount
            ? `${sellerCount} ${sellerCount === 1 ? "seller" : "sellers"}`
            : undefined
        }
        showAudioNote={true}
        audioNoteTitle="Buy from Other Retailer"
        audioFeature="buyFromOtherRetailer"
        showCart={true}
        showRecordPayment={false}
      />

      <div className="page-bg app-page tw:p-4">
        {/* Section tabs — `sticky` pins them under the header and breaks out
            of the page padding. */}
        <SupplyCatalogSectionTabs activeTab="discover" />

        <div className="section-layout section-layout--tight">
          {/* Desktop-only left rail — section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="supply"
                activeTab="browse"
                title={t("manageSupply", { ns: "menu" })}
              />
            </div>
          </aside>

          <div className="section-content">
            <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />
            <BuyFromNetworkTab
              activeTab="products"
              className="tw:mb-3 hide-in-theme-2"
            />

            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
              {/* Main column — spans the full grid (the side pane only exists
                  in theme-2 desktop, where the CSS lifts it out of the grid
                  into the fixed list pane; see AppPane / theme-2.css). */}
              <AppPaneMain className="tw:lg:col-span-12">
                <div className="tw:flex tw:gap-4">
                  {/* Left column — desktop only, and theme-1 only: theme-2
                      serves this navigation from its own side pane. */}
                  {!isTheme2 && (
                    <aside className="tw:hidden tw:lg:block tw:w-56 tw:shrink-0 tw:sticky tw:top-20 tw:self-start tw:max-h-[calc(100vh-11rem)]">
                      <MenuList
                        menus={allMenus}
                        loading={loading}
                        distance={distance}
                      />
                    </aside>
                  )}

                  {/* Center column — main content (always visible, wider) */}
                  <div className="tw:flex-1 tw:min-w-0">
                    {/* Search band — sticky + primary fill on mobile only so it
                        pins under the section tabs while scrolling; desktop
                        stays in normal flow. */}
                    <div className="search-sticky search-sticky-primary tw:mb-3 tw:sticky tw:top-29 tw:z-10 tw:bg-primary tw:px-4 tw:py-3.5 tw:md:static tw:md:bg-transparent tw:md:m-0 tw:md:p-0">
                      <SearchWithVoice
                        onDiscoverSellers={handleDiscoverSellers}
                      />
                    </div>

                    <TrySearches />

                    {/* The smart-cart card is duplicated in the theme-2 desktop
                    side pane, so hide the feed copy there. */}
                    <SmartCartCard className="app-pane-hide" />

                    {/* <CatalogOverview
                      className="tw:mt-4 tw:lg:mt-3"
                      counts={counts}
                      countsLoading={countsLoading}
                      distance={distance}
                    />

                    <TopReorderList className="tw:mt-4" distance={distance} /> */}

                    <ProductsBanner distance={distance} />

                    <Trending distance={distance} />

                    {/* Menus beside brands on desktop, stacked on mobile. */}
                    <div className="tw:mb-6 tw:grid tw:grid-cols-1 tw:lg:grid-cols-2 tw:gap-5 tw:lg:gap-8">
                      <Menus
                        menus={allMenus}
                        loading={loading}
                        distance={distance}
                        className=""
                      />
                      <Brands distance={distance} className="" />
                    </div>

                    <TopSellers distance={distance} />
                    {/* <PromotionalDeals distance={distance} /> */}
                    <NewlyLaunched distance={distance} />
                    <TopSelling distance={distance} />
                    {/* <Menus
            menus={menus}
            loading={loading}
            onMenuClick={(m) => {
              appNav.to("/products/buy-from-other-retailer/products/list", {
                menuId: m._id,
                menuName: m._displayName || m.name,
                distance,
              });
            }}
          /> */}
                    {/* Render MenuData for each displayed menu */}
                    {displayedMenus.map((m) => (
                      <div key={m._id} className="tw:mt-4 tw:pb-2">
                        <MenuData
                          menuId={m._id}
                          menuName={m._displayName || m.name}
                          distance={distance}
                        />
                      </div>
                    ))}
                    {displayedMenus.length < menus.length && !loading && (
                      <div className="tw:flex tw:justify-center tw:mt-4">
                        <LoadMoreButton
                          loadMore={loadMore}
                          loading={loadingMore}
                          totalCount={menus.length}
                          loadedCount={displayedMenus.length}
                        />
                      </div>
                    )}
                    {displayedMenus.length >= menus.length && !loading && (
                      <ProductsList distance={distance} title="All Products" />
                    )}
                  </div>

                  {/* Right column — desktop only, and theme-1 only. */}
                  {!isTheme2 && (
                    <aside
                      className={clsx(
                        "tw:hidden tw:lg:block tw:w-64 tw:shrink-0 tw:sticky tw:top-20 tw:self-start tw:max-h-[calc(100vh-11rem)]",
                        {
                          "tw:lg:hidden": open,
                        },
                      )}
                    >
                      <div className="tw:h-full tw:overflow-y-auto tw:pr-1">
                        <TopBrandsCategory distance={distance} />
                      </div>
                    </aside>
                  )}
                </div>
              </AppPaneMain>

              {/* Side column — only rendered while the theme-2 split layout is
                  active (lg+), where the CSS re-homes it as the fixed catalog
                  list pane beside the icon rail. */}
              <AppPaneSide className="app-pane-only">
                <div className="tw:flex tw:flex-col tw:gap-4">
                  <SupplyCatalogPane
                    title="Marketplace"
                    distance={distance}
                    activeKey="home"
                    showPurchaseCart
                    showCatalogOverview
                    catalogOverviewActiveKey="home"
                    catalogOverviewCounts={counts}
                    catalogOverviewCountsLoading={countsLoading}
                    showTrendingSearches
                    showPreviousPurchases
                  />
                </div>
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default BuyFromOtherRetailerProductsMainPage;
