import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Swiper } from "swiper/types";
import AppSwiper from "~/components/core/swiper";
import AppHeader from "~/components/core/header/AppHeader";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import Brand from "./components/brand/Brand";
import Category from "./components/category/Category";
import BrowseProducts from "../components/products/Products";
import CommonService from "~/services/CommonService";
import type { BreadcrumbItem } from "~/types/CommonTypes";

const swiperConfig = {
  spaceBetween: 12,
  breakpoints: {
    0: { slidesPerView: 1.3 },
    768: { slidesPerView: 2.9 },
  },
};

const productRestrictOn = ["brand"];

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Products",
    langKey: "products",
    redirect: { path: "/products/sk" },
  },
  { label: "Browse by Brand", langKey: "browseByBrandCategory" },
];

const BrowseBrands: React.FC = () => {
  const { t } = useTranslation(["common"]);

  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);

  const swiperRef = useRef<Swiper | null>(null);

  // common slide helper (in-file) — slides to the given index after 1 second
  const slideTo = (swiper: any, index: number) => {
    try {
      if (swiper && typeof swiper.slideTo === "function") {
        swiper.slideTo(index, 1000);
      }
    } catch (e) {
      // noop - prevent errors from bubbling
    }
  };

  const onCategoryCallback = (params: { action: string; data?: any }) => {
    if (params.action === "back") {
      if (swiperRef.current) slideTo(swiperRef.current, 0);
      return;
    }

    handleCategoryCallback(params);

    if (params.action === "view" && swiperRef.current) {
      slideTo(swiperRef.current, 2);
    }
  };

  const onBrandCallback = (params: { action: string; data?: any }) => {
    if (params.action === "back") {
      // move back to Category (index 1)
      if (swiperRef.current) slideTo(swiperRef.current, 1);
      return;
    }

    handleBrandCallback(params);

    if (params.action === "view" && swiperRef.current) {
      slideTo(swiperRef.current, 2);
    }
  };

  const handleProductsCallback = (params: { action: string; data?: any }) => {
    if (params.action === "back") {
      // move back to Category (index 1)
      if (swiperRef.current) slideTo(swiperRef.current, 1);
    }
  };

  const handleCategoryCallback = (params: { action: string; data?: any }) => {
    if (params.action === "view") {
      setSelectedCategory(params.data);
    }
  };

  const handleBrandCallback = (params: { action: string; data?: any }) => {
    if (params.action === "view") {
      setSelectedBrand(params.data);
      setSelectedCategory(null);
    }
  };

  return (
    <>
      <AppHeader title={t("browseByBrandCategory")} showCart={true} />
      <div className="page-bg app-page tw:p-4">
        <div className="app-container">
          <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:items-start tw:md:items-center tw:mb-4 tw:gap-4">
            <div>
              <AppBreadcrumbs data={breadcrumbs} />
              <div className="tw:text-gray-500 tw:text-xs">
                {t("selectBrandOrCategory")}
              </div>
            </div>
          </div>

          {/* Replace grid columns with AppSwiper slides */}
          <div className="tw:mb-4 tw:relative tw:z-10">
            <AppSwiper
              config={swiperConfig}
              callback={(a) => {
                if (a.swiper) {
                  swiperRef.current = a.swiper;
                }
              }}
            >
              <AppSwiper.Slide>
                <Brand
                  callback={onBrandCallback}
                  selectedBrand={selectedBrand}
                />
              </AppSwiper.Slide>

              <AppSwiper.Slide>
                <Category
                  callback={onCategoryCallback}
                  selectedCategory={selectedCategory}
                  selectedBrand={selectedBrand}
                />
              </AppSwiper.Slide>

              <AppSwiper.Slide>
                <BrowseProducts
                  callback={handleProductsCallback}
                  selectedBrand={selectedBrand}
                  selectedCategory={selectedCategory}
                  restrictOn={productRestrictOn}
                />
              </AppSwiper.Slide>
            </AppSwiper>
          </div>
        </div>
      </div>
    </>
  );
};

export default BrowseBrands;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Browse by Brand"),
    },
  ];
}
