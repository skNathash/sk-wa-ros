import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Swiper } from "swiper/types";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import AppSwiper from "~/components/core/swiper";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import type { ViewToggleType } from "~/types/CommonTypes";
import CommonService from "~/services/CommonService";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import InventoryTab from "../components/tab/InventoryTab";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import CatalogSidePane from "~/shared/inventory/components/catalog-side-pane/CatalogSidePane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import Brands from "../components/brands/Brands";
import BrowseBrands from "~/shared/catalog/components/browse/brands/BrowseBrands";
import BrowseCategories from "~/shared/catalog/components/browse/categories/BrowseCategories";
import BrowseProducts from "../components/browse-products/BrowseProducts";

const swiperConfig = {
  spaceBetween: 12,
  breakpoints: {
    0: { slidesPerView: 1.3 },
    768: { slidesPerView: 2.9 },
  },
};

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Inventory",
    langKey: "inventory",
    redirect: { path: "/dashboard/inventory/products/list" },
  },
  { label: "Browse", langKey: "browseByBrand" },
];

const categoryDependsOn = ["brand"];

const InventoryBrowse: React.FC = () => {
  const { t } = useTranslation(["common"]);

  const [brand, setBrand] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);

  const swiperRef = useRef<Swiper | null>(null);
  const [view, setView] = useState<ViewToggleType>("card");
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  const slideTo = (swiper: any, index: number) => {
    try {
      if (swiper && typeof swiper.slideTo === "function") {
        swiper.slideTo(index, 1000);
      }
    } catch (e) {
      // noop
    }
  };

  const onBrandCallback = (params: { action: string; data?: any }) => {
    if (params.action === "view") {
      setBrand(params.data);
      setCategory(null);
      if (swiperRef.current) slideTo(swiperRef.current, 2);
    }
  };

  const onCategoryCallback = (params: { action: string; data?: any }) => {
    if (params.action === "view") {
      setCategory(params.data);
      if (swiperRef.current) slideTo(swiperRef.current, 2);
    }
  };

  return (
    <>
      <AppHeader
        title={t("browseByBrand")}
        showCart={true}
        sectionKey="catalog"
        mobileLead="menu"
        showRecordPayment={false}
      />
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
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start theme-2-mobile-gap-top">
              {/* Main column — spans the full grid (the side pane only exists
                  in theme-2 desktop, where the CSS lifts it out of the grid
                  into the fixed list pane; see AppPane / theme-2.css). */}
              <AppPaneMain className="tw:lg:col-span-12">
                <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:items-start tw:md:items-center hide-in-theme-2">
                  <div>
                    <AppBreadcrumbs data={breadcrumbs} className="tw:!mb-0" />
                    <div className="tw:text-gray-500 tw:text-xs hide-in-theme-2">
                      {t("selectBrandOrCategory")}
                    </div>
                  </div>
                </div>

                <InventoryTab
                  activeTab="browse-by-brand"
                  className="hide-in-theme-2"
                />

                <div className="tw:relative tw:z-10">
                  <div className="tw:flex tw:justify-between tw:mb-3 tw:items-center hide-in-theme-2">
                    <div className="tw:text-gray-500 tw:text-xs tw:mr-4">
                      Select a brand to view its products.
                    </div>
                    <ViewToggle
                      viewType={view}
                      callback={setView}
                      hideInMobile={false}
                    />
                  </div>

                  {view === "list" ? (
                    <AppSwiper
                      config={swiperConfig}
                      callback={(a) => {
                        if (a.swiper) {
                          swiperRef.current = a.swiper;
                          setCurrentSlide(a.swiper.activeIndex || 0);
                        }
                        if (a.action === "slideChange" && a.swiper) {
                          setCurrentSlide(a.swiper.activeIndex || 0);
                        }
                      }}
                    >
                      <AppSwiper.Slide>
                        <BrowseBrands
                          callback={onBrandCallback}
                          type="inventory"
                          selectedId={brand?._id}
                          title={t("brands")}
                        />
                      </AppSwiper.Slide>

                      <AppSwiper.Slide>
                        <BrowseCategories
                          callback={onCategoryCallback}
                          type="inventory"
                          dependsOn={categoryDependsOn}
                          title={brand?.name || t("categories")}
                          brandId={brand?._id}
                          selectedId={category?._id}
                        />
                      </AppSwiper.Slide>

                      <AppSwiper.Slide>
                        <BrowseProducts
                          categoryId={category?._id}
                          brandId={brand?._id}
                          categoryName={category?.name}
                          brandName={brand?.name}
                        />
                      </AppSwiper.Slide>
                    </AppSwiper>
                  ) : (
                    <Brands />
                  )}
                </div>
              </AppPaneMain>

              {/* Side column — only rendered while the theme-2 split layout is
                  active (lg+), where the CSS re-homes it as the fixed catalog
                  list pane beside the icon rail. */}
              <AppPaneSide className="app-pane-only">
                <CatalogSidePane
                  scopeLabel={t("brands")}
                  showInventoryValue={false}
                />
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InventoryBrowse;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Inventory Browse"),
    },
  ];
}
