import { useEffect, useRef, useState } from "react";
import ImgRender from "~/components/core/img/ImgRender";
import ProductService from "~/services/ProductService";
import SellerCatalogService from "~/services/SellerCatalogService";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import type { SwiperOptions } from "swiper/types";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { ShoppingCart } from "lucide-react";

interface MenuItem {
  _id: string;
  name: string;
  displayImg?: string;
}

type CategorySliderProps = {
  callback: (category: { id: string; name: string }) => void;
  selectedCategory: string;
  type?: "buyer" | "normal";
};

const CategorySlider = ({
  callback,
  selectedCategory,
  type = "normal",
}: CategorySliderProps) => {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const swiperRef = useRef<any>(null);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        if (type === "buyer") {
          // SellerCatalogService returns grouped response, format it
          const response = await SellerCatalogService.getMenus({
            page: 1,
            count: 100,
            parent: true,
            filter: { status: "Active", availableQuantity: { $gt: 0 } },
          });
          const formatted = SellerCatalogService.formatMenuResponse(
            response.data.data,
          ).map((m: any) => ({
            _id: m._id,
            name: m.name,
            displayImg: m._displayImg || m._displayImg,
            _displayName: m._displayName,
          }));
          setMenus(formatted);
        } else {
          const { data } = await ProductService.getMenus();
          // ProductService returns menus already shaped with displayImg
          const formatted = Array.isArray(data)
            ? data.map((m: any) => ({
                _id: m._id,
                name: m.menuName || m.name,
                displayImg: m.displayImg || m._displayImg,
                _displayName: m._displayName,
              }))
            : [];
          setMenus(formatted);
        }
      } catch (error) {
        console.error("Error fetching menus:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, []);

  // receive swiper instance via AppSwiper callback and keep it in ref
  const onSwiperCallback = (data: {
    swiper: any;
    action: "init" | "slideChange";
  }) => {
    if (!data) return;
    if (data.swiper) swiperRef.current = data.swiper;

    if (data.action === "init") {
      // when swiper initializes, move to the selected category if present
      if (swiperRef.current && selectedCategory) {
        const activeIndex = menus.findIndex((m) => m._id === selectedCategory);
        if (activeIndex >= 0) {
          // defer so swiper layout settles
          setTimeout(() => {
            try {
              swiperRef.current?.slideTo(activeIndex);
            } catch (e) {
              // best-effort, ignore
            }
          }, 0);
        }
      }
    }
  };

  // when selectedCategory or menus change after init, ensure swiper shows the selected item
  useEffect(() => {
    if (!swiperRef.current) return;
    if (!selectedCategory) return;
    const activeIndex = menus.findIndex((m) => m._id === selectedCategory);
    if (activeIndex >= 0) {
      try {
        swiperRef.current.slideTo(activeIndex);
      } catch (e) {
        // ignore
      }
    }
  }, [selectedCategory, menus]);

  if (loading) {
    return (
      <div className="tw:text-center tw:py-2">
        <AppSpinner />
      </div>
    );
  }

  return (
    <div className="category-slider tw:h-full tw:bg-white tw:py-4 tw:relative tw:border-none tw:shadow-none">
      <AppSwiper
        className="tw:h-full"
        config={swiperConfig}
        callback={onSwiperCallback}
      >
        {menus.map((menu) => (
          <AppSwiper.Slide
            key={menu._id}
            isAutoWidth={false}
            isAutoHeight={true}
          >
            <div
              className="category-item tw:flex tw:flex-col tw:items-center tw:cursor-pointer tw:text-center tw:py-3 tw:px-2 tw:rounded-2xl tw:transition-all tw:duration-200 tw:hover:shadow-lg tw:hover:bg-gray-50 tw:relative"
              onClick={() => callback({ id: menu._id, name: menu.name })}
            >
              <div
                className={`tw:mb-2 tw:rounded-full tw:w-12 tw:h-12 md:tw:w-16 md:tw:h-16 tw:overflow-hidden tw:flex tw:items-center tw:justify-center tw:transition-all tw:duration-200 ${
                  selectedCategory === menu._id
                    ? "tw:bg-white tw:border-2 tw:border-blue-300"
                    : "tw:bg-gray-200"
                }`}
              >
                {menu.displayImg ? (
                  <ImgRender
                    assetId={menu.displayImg}
                    alt={menu.name}
                    className="tw:w-8 tw:h-8 md:tw:w-12 md:tw:h-12 tw:object-contain"
                  />
                ) : (
                  <div className="tw:text-muted tw:flex tw:items-center tw:justify-center tw:w-full tw:h-full">
                    <ShoppingCart className="tw:w-6 tw:h-6 md:tw:w-10 md:tw:h-10 tw:mx-auto" />
                  </div>
                )}
              </div>
              <div
                className={`tw:text-sm tw:font-semibold tw:line-clamp-2 tw:max-w-[90px] tw:px-2 tw:mb-1 tw:transition-colors tw:duration-200 ${
                  selectedCategory === menu._id
                    ? "tw:text-blue-700"
                    : "tw:text-gray-700"
                }`}
              >
                {menu._displayName}
              </div>
            </div>
          </AppSwiper.Slide>
        ))}
      </AppSwiper>
    </div>
  );
};

const swiperConfig: SwiperOptions = {
  direction: "vertical",
  slidesPerView: "auto",
  spaceBetween: 12,
  mousewheel: { enabled: true, forceToAxis: true },
  navigation: false,
  pagination: false,
};

export default CategorySlider;
