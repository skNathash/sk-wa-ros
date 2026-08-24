import React from "react";
import type { SwiperOptions } from "swiper/types";
import AppSwiper from "~/components/core/swiper";
import EntityThumb from "~/components/core/img/EntityThumb";
import useAppNav from "~/hooks/useAppNav";

interface CategoriesProps {
  menuId: string;
  menuName: string;
  categories?: any[];
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

const Categories: React.FC<CategoriesProps> = ({ categories = [] }) => {
  const appNav = useAppNav();

  const handleCategoryClick = (category: any) => {
    if (!category) return;
    const name = category._displayName || category.name;
    appNav.to("/products/sk/list", {
      categoryId: category._id,
      categoryName: name,
      title: name,
    });
  };

  if (!categories || categories.length === 0) return null;

  return (
    <div className="tw:mb-6">
      <AppSwiper config={swiperOptions}>
        {categories.map((c: any) => {
          const label = c._displayName || c.name;
          return (
            <AppSwiper.Slide key={c._id}>
              <button
                type="button"
                onClick={() => handleCategoryClick(c)}
                title={label}
                aria-label={label}
                className="tw:group tw:flex tw:w-full tw:cursor-pointer tw:flex-col tw:text-center focus:tw:outline-none"
              >
                {/* White category tile with the name inside — soft neutral
                    border and a gentle shadow to match the shared marketplace
                    card look. */}
                <div className="tw:flex tw:aspect-square tw:w-full tw:flex-col tw:overflow-hidden tw:rounded-2xl tw:border tw:border-black/5 tw:bg-white tw:transition-all tw:duration-200 tw:group-hover:-translate-y-0.5 tw:group-hover:border-primary/30 tw:group-hover:shadow-md tw:group-active:scale-95 tw:group-focus-visible:ring-2 tw:group-focus-visible:ring-primary/50">
                  <EntityThumb
                    assetId={c.displayImg}
                    name={label}
                    fit="contain"
                    boxClassName="tw:min-h-0 tw:flex-1 tw:w-full tw:p-2.5"
                    imgClassName="tw:transition-transform tw:duration-200 tw:group-hover:scale-105"
                    initialClassName="tw:text-lg"
                  />
                  <div className="tw:flex tw:h-6 tw:shrink-0 tw:items-center tw:justify-center tw:px-1 tw:pb-2">
                    <span className="tw:line-clamp-1 tw:text-xs tw:font-semibold tw:leading-tight tw:text-gray-800 tw:transition-colors tw:group-hover:text-primary">
                      {label}
                    </span>
                  </div>
                </div>
              </button>
            </AppSwiper.Slide>
          );
        })}
      </AppSwiper>
    </div>
  );
};

export default Categories;
