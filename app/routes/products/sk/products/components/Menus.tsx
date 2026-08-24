import AppSwiper from "~/components/core/swiper";
import type { SwiperOptions } from "swiper/types";
import { Skeleton } from "~/components/ui/skeleton";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import MenuItem from "./MenuItem";

type Menu = {
  _id: string;
  name: string;
  displayImg?: string;
  _displayName?: string;
};

type Props = {
  menus?: Menu[];
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

const Menus = ({ menus = [], loading = false }: Props) => {
  const appNav = useAppNav();
  const { isMobile } = useScreenView();

  const handleMenuClick = (menu: Menu) => {
    const name = menu._displayName || menu.name;
    appNav.to("/products/sk/list", {
      menuId: menu._id,
      menuName: name,
      title: name,
    });
  };

  if (loading) {
    return (
      <div className="tw:mb-6">
        <div className="tw:mb-3 tw:flex tw:items-center tw:gap-2">
          <Skeleton className="tw:h-3 tw:w-28" />
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

  // Mobile shows at most 8 menus, desktop at most 16; the rest are reachable via "See all".
  const visibleMenus = isMobile ? menus.slice(0, 8) : menus.slice(0, 16);

  return (
    <div className="tw:mb-6">
      <div className="tw:mb-3 tw:flex tw:items-center tw:justify-between tw:gap-2">
        <h2 className="app-label tw:text-[0.8125rem]! tw:font-semibold tw:uppercase tw:tracking-[0.12em] tw:text-primary/70">
          Shop by Menus
        </h2>
        <button
          type="button"
          onClick={() => appNav.to("/products/sk/category")}
          className="tw:inline-flex tw:items-center tw:gap-0.5 tw:cursor-pointer tw:text-[13px] tw:font-semibold tw:text-primary"
        >
          See all <span aria-hidden>→</span>
        </button>
      </div>

      {/* Mobile: wrapping grid; Desktop: horizontal slider */}
      {isMobile ? (
        <div className="tw:grid tw:grid-cols-4 tw:gap-3">
          {visibleMenus.map((menu) => (
            <MenuItem
              key={menu._id}
              id={menu._id}
              name={menu.name}
              displayImg={menu.displayImg}
              displayName={menu._displayName}
              onClick={() => handleMenuClick(menu)}
              variant="grid"
            />
          ))}
        </div>
      ) : (
        <AppSwiper config={swiperOptions}>
          {visibleMenus.map((menu) => (
            <AppSwiper.Slide key={menu._id}>
              <MenuItem
                id={menu._id}
                name={menu.name}
                displayImg={menu.displayImg}
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
