import clsx from "clsx";
import ImgRender from "~/components/core/img/ImgRender";
import AppSwiper from "~/components/core/swiper";
import type { SwiperOptions } from "swiper/types";
import { useEffect, useRef } from "react";

type Props = {
  menus: any[];
  // callback will receive { menu, fromMenuClick?: boolean }
  callback: (a: { menu: any; fromMenuClick?: boolean }) => void;
  activeIndex: number;
};

const swiperOptions: SwiperOptions = {
  spaceBetween: 5,
  pagination: false,
  navigation: false,
  mousewheel: {
    forceToAxis: true,
  },
  slidesOffsetAfter: 10,
  slidesOffsetBefore: 10,
  breakpoints: {
    0: {
      slidesPerView: 4.5,
    },
    640: {
      slidesPerView: 5.5,
    },
    768: {
      slidesPerView: 6.5,
    },
    900: {
      slidesPerView: 9.5,
      spaceBetween: 5,
    },
    1024: {
      slidesPerView: 10.5,
    },
    1280: {
      slidesPerView: 12.5,
    },
  },
};

const Menus = ({ menus, callback, activeIndex }: Props) => {
  const swiperRef = useRef<any>(null);

  const onMenuClick = (menu: any) => {
    // notify parent to update selection and load categories
    // include a flag so parent can choose to update URL
    callback({ menu, fromMenuClick: true });
  };

  // receive swiper instance via AppSwiper callback
  const onSwiperCallback = (data: {
    swiper: any;
    action: "init" | "slideChange";
  }) => {
    if (!data) return;
    // always keep latest instance
    if (data.swiper) swiperRef.current = data.swiper;

    // when swiper is initialized, ensure it moves to the currently active index
    if (data.action === "init") {
      if (typeof activeIndex === "number" && swiperRef.current) {
        // defer to next tick so swiper layout settles
        setTimeout(() => {
          try {
            swiperRef.current?.slideTo(activeIndex);
          } catch (e) {
            // swallow errors — this is best-effort
          }
        }, 0);
      }
    }
  };

  // when activeIndex or menus change, slide to the active index so selected menu is visible
  useEffect(() => {
    if (swiperRef.current && typeof activeIndex === "number") {
      try {
        swiperRef.current.slideTo(activeIndex);
      } catch (e) {
        // ignore
      }
    }
  }, [activeIndex, menus]);

  return menus.length > 0 ? (
    <div className="mt-1">
      <AppSwiper config={swiperOptions} callback={onSwiperCallback}>
        {menus.map((menu, index) => (
          <AppSwiper.Slide key={index}>
            <div
              className={clsx(
                "tw:text-center tw:py-2 tw:cursor-pointer",
                activeIndex === index ? "tw:border-b-4 tw:border-primary" : ""
              )}
              onClick={() => onMenuClick(menu)}
            >
              <div className="tw:h-16 tw:inline-block">
                <ImgRender
                  assetId={menu._displayImg || menu.displayImg}
                  className="tw:object-cover tw:w-full tw:h-full"
                />
              </div>
              <div className="tw:h-8 tw:overflow-hidden">
                <div className="tw:text-xs tw:line-clamp-2 tw:font-semibold">
                  {menu._displayName}
                </div>
              </div>
            </div>
          </AppSwiper.Slide>
        ))}
      </AppSwiper>
    </div>
  ) : null;
};

export default Menus;
