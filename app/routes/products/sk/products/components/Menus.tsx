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
  spaceBetween: 10,
  pagination: false,
  navigation: false,
  slidesOffsetAfter: 10,
  slidesOffsetBefore: 10,
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
      <div className="tw:py-2 tw:mb-2 tw:bg-white tw:rounded-lg">
        <div className="tw:px-3 tw:mb-1.5">
          <Skeleton className="tw:h-3.5 tw:w-24" />
        </div>
        <div className="tw:grid tw:grid-cols-4 tw:gap-2 tw:px-3 tw:pb-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="tw:h-20 tw:rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!menus || menus.length === 0) return null;

  return (
    <div className="tw:py-2 tw:mb-2 tw:bg-white tw:rounded-lg">
      <h2 className="tw:text-lg tw:font-bold tw:text-slate-900 tw:mb-2">
        Shop by Menus
      </h2>

      {/* Mobile: grid view; Desktop: slider */}
      {isMobile ? (
        <div className="tw:grid tw:grid-cols-4 tw:gap-2 tw:px-3 tw:pb-2">
          {menus.map((menu) => (
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
        <div className="tw:px-1">
          <AppSwiper config={swiperOptions}>
            {menus.map((menu) => (
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
        </div>
      )}
    </div>
  );
};

export default Menus;
