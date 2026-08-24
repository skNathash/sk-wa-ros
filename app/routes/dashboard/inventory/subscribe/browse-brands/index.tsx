import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Swiper } from "swiper/types";
import AppSwiper from "~/components/core/swiper";
import Brand from "./components/brand/Brand";
import Category from "./components/category/Category";
import BrandsGrid from "./components/brands-grid/BrandsGrid";
import BrowseProducts from "../components/browse/products/Products";
import PageAccessService from "~/services/PageAccessService";
import useTheme from "~/hooks/useTheme";

export async function clientLoader() {
  return PageAccessService.canAccessPage([], { allowNoSubscribe: true });
}

const swiperConfig = {
  spaceBetween: 12,
  breakpoints: {
    0: { slidesPerView: 1.3 },
    768: { slidesPerView: 2.9 },
  },
};

const productRestrictOn = ["brand"];

const BrowseBrands: React.FC = () => {
  const { t } = useTranslation(["inventorySubscribe"]);
  const isTheme2 = useTheme() === "theme-2";

  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);

  const [sortKey, setSortKey] = useState<Record<string, any>>({
    category: "popular",
    brand: "popular",
    product: "popular",
  });

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

  const onCategoryCallback = (params: {
    action: string;
    data?: any;
    sortType?: string;
  }) => {
    if (params.action === "back") {
      if (swiperRef.current) slideTo(swiperRef.current, 0);
      return;
    }

    handleCategoryCallback(params);

    if (params.action === "view" && swiperRef.current) {
      slideTo(swiperRef.current, 2);
    }
  };

  const onBrandCallback = (params: {
    action: string;
    data?: any;
    sortType?: string;
  }) => {
    if (params.action === "back") {
      // move back to Category (index 1)
      if (swiperRef.current) slideTo(swiperRef.current, 1);
      return;
    }

    handleBrandCallback(params);

    if (params.action === "view" && swiperRef.current) {
      slideTo(swiperRef.current, 3);
    }
  };

  const handleProductsCallback = (params: { action: string; data?: any }) => {
    if (params.action === "back") {
      // move back to Brand (index 2)
      if (swiperRef.current) slideTo(swiperRef.current, 2);
    }
  };

  const handleCategoryCallback = (params: {
    action: string;
    data?: any;
    sortType?: string;
  }) => {
    if (params.action === "view") {
      setSortKey({
        ...sortKey,
        category: params.sortType,
        product: params.sortType,
      });
      setSelectedCategory(params.data);
    }
  };

  const handleBrandCallback = (params: {
    action: string;
    data?: any;
    sortType?: string;
  }) => {
    if (params.action === "view") {
      setSortKey({
        ...sortKey,
        brand: params.sortType,
        product: params.sortType,
      });
      setSelectedBrand(params.data);
      setSelectedCategory(null);
    }
  };

  // Theme-2 gets the card-grid brand wall; the legacy swiper stays as the
  // fallback for the classic theme.
  if (isTheme2) {
    return <BrandsGrid />;
  }

  return (
    <>
      {/* <div className="tw:mb-4">
        <div className="tw:text-2xl tw:font-bold tw:mb-1">Browse by Brands</div>
        <div className="tw:text-xs tw:text-gray-500">
          Select a brand or category to explore products.
        </div>
      </div> */}

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
            <Brand callback={onBrandCallback} selectedBrand={selectedBrand} />
          </AppSwiper.Slide>

          <AppSwiper.Slide>
            <Category
              callback={onCategoryCallback}
              selectedCategory={selectedCategory}
              selectedBrand={selectedBrand}
              sortKey={sortKey.brand}
            />
          </AppSwiper.Slide>

          <AppSwiper.Slide>
            <BrowseProducts
              callback={handleProductsCallback}
              selectedBrand={selectedBrand}
              selectedCategory={selectedCategory}
              restrictOn={productRestrictOn}
              type="byBrand"
              sortKey={sortKey.product}
            />
          </AppSwiper.Slide>
        </AppSwiper>
      </div>
    </>
  );
};

export default BrowseBrands;
