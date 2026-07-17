import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import { useSidebar } from "~/components/ui/sidebar";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import { DEFAULT_BROWSE_DISTANCE } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import BuyFromNetworkTab from "../../components/BuyFromNetworkTab";
import Footer from "../components/Footer";
import Menus from "../components/Menus";
import SearchWithVoice from "../components/SearchWithVoice";
import MenuData from "./components/menu-data/MenuData";
import NewlyLaunched from "./components/newly-launched/NewlyLaunched";
import PromotionalDeals from "./components/promotional-deals/PromotionalDeals";
import ProductsList from "./components/products-list/ProductsList";
import TopSelling from "./components/top-selling/TopSelling";
import MenuList from "../components/menu-list/MenuList";
import TopBrandsCategory from "../components/top-brands-category/TopBrandsCategory";
import clsx from "clsx";

type Menu = {
  name: string;
  _id: string;
  _displayImg: string;
  _displayName: string;
};

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
        const formattedMenus = SellerCatalogService.formatMenuResponse(
          response.data?.data || [],
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

  return (
    <>
      <AppHeader
        title="Browse Products"
        showAudioNote={true}
        audioNoteTitle="Buy from Other Retailer"
        audioFeature="buyFromOtherRetailer"
        showCart={true}
        showRecordPayment={false}
      />
      <div className="page-bg app-page tw:p-4">
        {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css).
            `sticky` pins them under the header and breaks out of the page
            padding so the underline runs edge to edge. */}
        <SectionTabs
          sectionKey="supply"
          activeTab="buy-from-network"
          noShadow
          sticky
        />

        <div className="section-layout section-layout--tight">
          {/* Desktop-only left rail — section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="supply"
                activeTab="buy-from-network"
                title={t("manageSupply", { ns: "menu" })}
              />
            </div>
          </aside>

          <div className="section-content">
            <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />
            <BuyFromNetworkTab activeTab="products" className="tw:mb-3" />
            <div className="tw:flex tw:gap-4">
              {/* Left column — placeholder (desktop only) */}
              <aside className="tw:hidden tw:lg:block tw:w-56 tw:shrink-0 tw:sticky tw:top-20 tw:self-start tw:max-h-[calc(100vh-11rem)]">
                <MenuList
                  menus={allMenus}
                  loading={loading}
                  distance={distance}
                />
              </aside>

              {/* Center column — main content (always visible, wider) */}
              <div className="tw:flex-1 tw:min-w-0">
                <div className="tw:mb-4 tw:sticky tw:top-16 tw:z-10 tw:py-2 tw:bg-[var(--page-bg,white)]">
                  <SearchWithVoice onDiscoverSellers={handleDiscoverSellers} />
                </div>
                <div className="tw:lg:hidden">
                  <Menus
                    menus={allMenus}
                    loading={loading}
                    distance={distance}
                  />
                </div>
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

              {/* Right column — placeholder (desktop only) */}
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
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default BuyFromOtherRetailerProductsMainPage;
