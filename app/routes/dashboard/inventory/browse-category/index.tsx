import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Swiper } from "swiper/types";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import AppSwiper from "~/components/core/swiper";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import type { ViewToggleType } from "~/types/CommonTypes";
import Categories from "../components/categories/Categories";
import CommonService from "~/services/CommonService";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import InventoryTab from "../components/tab/InventoryTab";
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
  { label: "Browse", langKey: "browseByCategory" },
];

const brandDependsOn = ["category"];

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
      if (swiperRef.current) slideTo(swiperRef.current, 2);
    }
  };

  const onCategoryCallback = (params: { action: string; data?: any }) => {
    if (params.action === "view") {
      setCategory(params.data);
      setBrand(null);
      if (swiperRef.current) slideTo(swiperRef.current, 1);
    }
  };

  return (
    <>
      <AppHeader title={t("browseByCategory")} showCart={true} />
      <div className="page-bg app-page tw:p-4">
        <div className="app-container">
          <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:items-start tw:md:items-center tw:mb-4">
            <div>
              <AppBreadcrumbs data={breadcrumbs} className="tw:!mb-0" />
              <div className="tw:text-gray-500 tw:text-xs">
                {t("selectBrandOrCategory")}
              </div>
            </div>
          </div>

          <InventoryTab activeTab="browse-category" className="tw:mb-4" />

          <div className="tw:mb-4 tw:relative tw:z-10">
            <div className="tw:flex tw:justify-between tw:mb-3 tw:items-center">
              <div className="tw:text-gray-500 tw:text-xs">
                Select a category to view its products.
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
                  <BrowseCategories
                    callback={onCategoryCallback}
                    type="inventory"
                    title={t("categories")}
                    selectedId={category?._id}
                  />
                </AppSwiper.Slide>

                <AppSwiper.Slide>
                  <BrowseBrands
                    callback={onBrandCallback}
                    type="inventory"
                    dependsOn={brandDependsOn}
                    title={category?.name || t("brands")}
                    categoryId={category?._id}
                    selectedId={brand?._id}
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
              <Categories />
            )}
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
