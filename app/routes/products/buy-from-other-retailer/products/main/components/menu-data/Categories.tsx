import React from "react";
import type { SwiperOptions } from "swiper/types";
import AppSwiper from "~/components/core/swiper";
import ImgRender from "~/components/core/img/ImgRender";
import useAppNav from "~/hooks/useAppNav";
import { DEFAULT_BROWSE_DISTANCE } from "~/constants";

interface CategoriesProps {
  menuId: string;
  menuName: string;
  categories?: any[];
  distance?: number | string;
}

const swiperOptions: SwiperOptions = {
  spaceBetween: 12,
  pagination: false,
  navigation: false,
  breakpoints: {
    // mobile
    0: {
      slidesPerView: 3.2,
    },
    640: {
      slidesPerView: 4.2,
    },
    // tablet
    768: {
      slidesPerView: 5.2,
    },
    // desktop
    1024: {
      slidesPerView: 6.5,
    },
  },
};

const Categories: React.FC<CategoriesProps> = ({
  menuId,
  menuName,
  categories = [],
  distance = DEFAULT_BROWSE_DISTANCE,
}) => {
  const appNav = useAppNav();

  const handleCategoryClick = (category: any) => {
    if (!category) return;
    const params: any = {
      categoryId: category._id,
      categoryName: category.name,
      menuId,
      menuName,
      distance,
    };
    appNav.to("/products/buy-from-other-retailer/products/list", params);
  };

  if (!categories || categories.length === 0) return null;

  return (
    <div className="tw:mb-6">
      <AppSwiper config={swiperOptions}>
        {categories.map((c: any) => (
          <AppSwiper.Slide key={c._id}>
            <button
              type="button"
              onClick={() => handleCategoryClick(c)}
              className="tw:group tw:flex tw:w-full tw:flex-col tw:items-center tw:gap-2 tw:cursor-pointer tw:bg-transparent tw:border-0 tw:p-0"
            >
              <div className="tw:aspect-square tw:w-full tw:overflow-hidden tw:rounded-2xl tw:bg-slate-50 tw:transition tw:duration-200 tw:group-hover:ring-2 tw:group-hover:ring-primary/40 tw:group-hover:shadow-sm">
                <ImgRender
                  assetId={c._displayImg}
                  alt={c.name}
                  className="tw:h-full tw:w-full tw:object-cover tw:transition-transform tw:duration-200 tw:group-hover:scale-105"
                  width={300}
                />
              </div>
              <div className="tw:line-clamp-2 tw:text-center tw:text-xs tw:font-medium tw:leading-tight tw:text-slate-600 tw:group-hover:text-primary">
                {c.name}
              </div>
            </button>
          </AppSwiper.Slide>
        ))}
      </AppSwiper>
    </div>
  );
};

export default Categories;
