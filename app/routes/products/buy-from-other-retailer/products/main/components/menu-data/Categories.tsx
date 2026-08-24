import React, { useMemo } from "react";
import type { SwiperOptions } from "swiper/types";
import AppSwiper from "~/components/core/swiper";
import EntityThumb from "~/components/core/img/EntityThumb";
import useAppNav from "~/hooks/useAppNav";
import useTheme from "~/hooks/useTheme";
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
    // desktop (theme-aware — see the config override below)
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
  const theme = useTheme();
  // theme-2 hides the side rails, so the content column is wider — show more
  // category tiles per view on desktop; the default theme keeps 6.5.
  const config = useMemo<SwiperOptions>(
    () => ({
      ...swiperOptions,
      breakpoints: {
        ...swiperOptions.breakpoints,
        1024: { slidesPerView: theme === "theme-2" ? 8 : 6.5 },
      },
    }),
    [theme],
  );

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
      <AppSwiper config={config}>
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
                    assetId={c._displayImg}
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
