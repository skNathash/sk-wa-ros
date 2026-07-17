import AppSwiper from "~/components/core/swiper";
import type { SwiperOptions } from "swiper/types";
import { Skeleton } from "~/components/ui/skeleton";
import { DEFAULT_BROWSE_DISTANCE } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import MenuItem from "./MenuItem";

type MenuItem = {
  _id: string;
  name: string;
  _displayImg?: string;
  _displayName?: string;
};

type Props = {
  distance?: number | string;
  menus?: MenuItem[];
  loading?: boolean;
};

const swiperOptions: SwiperOptions = {
  slidesPerView: 6,
  spaceBetween: 12,
  pagination: false,
  navigation: false,
  slidesOffsetAfter: 4,
  slidesOffsetBefore: 4,
  breakpoints: {
    768: { slidesPerView: 6 },
    1024: { slidesPerView: 7 },
    1280: { slidesPerView: 8 },
    1536: { slidesPerView: 10 },
  },
};

const Menus = ({
  distance = DEFAULT_BROWSE_DISTANCE,
  menus = [],
  loading = false,
}: Props) => {
  const appNav = useAppNav();
  const { isMobile } = useScreenView();

  const handleMenuClick = (menu: MenuItem) => {
    appNav.to("/products/buy-from-other-retailer/products/list", {
      menuId: menu._id,
      menuName: menu.name,
      distance,
    });
  };

  if (loading) {
    return (
      <div className="tw:mb-6">
        <div className="tw:mb-3 tw:flex tw:items-center tw:gap-2">
          <span className="tw:h-4 tw:w-1 tw:rounded-full tw:bg-primary" />
          <Skeleton className="tw:h-4 tw:w-28" />
        </div>
        <div className="tw:grid tw:grid-cols-4 tw:gap-3 tw:sm:grid-cols-6 tw:lg:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="tw:flex tw:flex-col tw:items-center tw:gap-2">
              <Skeleton className="tw:aspect-square tw:w-full tw:rounded-2xl" />
              <Skeleton className="tw:h-2.5 tw:w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!menus || menus.length === 0) return null;

  return (
    <div className="tw:mb-6">
      <div className="tw:mb-3 tw:flex tw:items-center tw:gap-2">
        <span className="tw:h-4 tw:w-1 tw:rounded-full tw:bg-primary" />
        <h2 className="tw:text-base tw:font-bold tw:text-slate-900">
          Shop by Menus
        </h2>
      </div>

      {/* Mobile: wrapping grid; Desktop: horizontal slider */}
      {isMobile ? (
        <div className="tw:grid tw:grid-cols-4 tw:gap-3">
          {menus.map((menu) => (
            <MenuItem
              key={menu._id}
              id={menu._id}
              name={menu.name}
              displayImg={menu._displayImg}
              displayName={menu._displayName}
              onClick={() => handleMenuClick(menu)}
              variant="grid"
            />
          ))}
        </div>
      ) : (
        <AppSwiper config={swiperOptions}>
          {menus.map((menu) => (
            <AppSwiper.Slide key={menu._id}>
              <MenuItem
                id={menu._id}
                name={menu.name}
                displayImg={menu._displayImg}
                displayName={menu._displayName}
                onClick={() => handleMenuClick(menu)}
                variant="slide"
              />
            </AppSwiper.Slide>
          ))}
        </AppSwiper>
      )}
    </div>
  );
};

export default Menus;
