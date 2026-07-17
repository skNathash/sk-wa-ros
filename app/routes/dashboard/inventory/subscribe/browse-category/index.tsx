import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Swiper } from "swiper/types";
import AppSwiper from "~/components/core/swiper";
import useScreenView from "~/hooks/useScreenView";
// Brand removed
import Category from "./components/category/Category";
import ParentCategory from "./components/parent-category/ParentCategory";
import Menus from "./components/menus/Menus";
import BrowseProducts from "../components/browse/products/Products";
import PageAccessService from "~/services/PageAccessService";

export async function clientLoader() {
  return PageAccessService.canAccessPage([], { allowNoSubscribe: true });
}

const swiperConfig = {
  spaceBetween: 12,
  breakpoints: {
    0: { slidesPerView: 1.2 },
    768: { slidesPerView: 2.9 },
  },
};

// productRestrictOn removed (no brand filter)

const BrowseCategory: React.FC = () => {
  const { t } = useTranslation(["inventorySubscribe"]);
  const { isMobile } = useScreenView();

  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedParentCategory, setSelectedParentCategory] =
    useState<any>(null);
  // selectedBrand removed
  const [selectedMenu, setSelectedMenu] = useState<any[]>([]);

  const [sortKey, setSortKey] = useState<Record<string, any>>({
    menu: "popular",
    category: "popular",
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

  // named handlers to avoid inline functions
  const onMenusSelect = (p: {
    action: string;
    data?: any;
    sortType?: string;
  }) => {
    if (p.action === "select") {
      setSortKey({ ...sortKey, menu: p.sortType });
      setSelectedMenu([
        {
          label: p.data._displayName || p.data.name,
          value: { id: p.data._id, name: p.data._displayName || p.data.name },
        },
      ]);
      setSelectedCategory(null);
      setSelectedParentCategory(null);

      // slide to Category (index 1) after 1s
      if (swiperRef.current) slideTo(swiperRef.current, 1);
    } else if (p.action === "clear") {
      setSelectedMenu([]);
      setSelectedParentCategory(null);
      setSelectedCategory(null);
      setSortKey({
        menu: "popular",
        category: "popular",
        product: "popular",
      });
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

  const onParentCategoryCallback = (params: {
    action: string;
    data?: any;
    sortType?: string;
  }) => {
    if (params.action === "back") {
      if (swiperRef.current) slideTo(swiperRef.current, 0);
      return;
    }

    if (params.action === "view") {
      // set parent category and reset downstream selections
      setSelectedParentCategory(params.data);
      setSelectedCategory(null);
      setSortKey({
        ...sortKey,
        category: params.sortType,
        product: params.sortType,
      });

      // move to Category (index 2)
      if (swiperRef.current) slideTo(swiperRef.current, 2);
    }

    if (params.action === "clear") {
      // clear parent and downstream selections so UI stays consistent
      setSelectedParentCategory(null);
      setSelectedCategory(null);
      setSortKey({
        ...sortKey,
        category: "popular",
        product: "popular",
      });
    }
  };

  const handleProductsCallback = (params: { action: string; data?: any }) => {
    if (params.action === "back") {
      // move back to Category (index 2)
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

  return (
    <>
      {/* <div className="tw:mb-4">
        <div className="tw:text-2xl tw:font-bold tw:mb-1">
          {t("browseCategory.title")}
        </div>
        <div className="tw:text-xs tw:text-gray-500">
          {t("browseCategory.subtitle")}
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
            <Menus
              selectedMenu={
                selectedMenu?.[0]
                  ? {
                      _id: selectedMenu[0].value?.id || selectedMenu[0]._id,
                      name: selectedMenu[0].value?.name || selectedMenu[0].name,
                    }
                  : undefined
              }
              callback={onMenusSelect}
            />
          </AppSwiper.Slide>

          <AppSwiper.Slide>
            <ParentCategory
              callback={onParentCategoryCallback}
              selectedMenu={selectedMenu?.[0]}
              selectedParentCategory={selectedParentCategory}
              sortKey={sortKey.menu}
            />
          </AppSwiper.Slide>

          <AppSwiper.Slide>
            <Category
              callback={onCategoryCallback}
              selectedCategory={selectedCategory}
              selectedParentCategory={selectedParentCategory}
              selectedMenu={selectedMenu?.[0]}
              sortKey={sortKey.menu}
            />
          </AppSwiper.Slide>

          <AppSwiper.Slide>
            <BrowseProducts
              callback={handleProductsCallback}
              selectedBrand={null}
              selectedCategory={selectedCategory}
              selectedParentCategory={selectedParentCategory}
              selectedMenu={selectedMenu?.[0]}
              restrictOn={[]}
              type="byCategory"
              sortKey={sortKey.product}
            />
          </AppSwiper.Slide>
        </AppSwiper>
      </div>
    </>
  );
};

export default BrowseCategory;
