import { useEffect, useState } from "react";
import AppSwiper from "~/components/core/swiper";
import type { SwiperOptions } from "swiper/types";
import { Skeleton } from "~/components/ui/skeleton";
import useAppNav from "~/hooks/useAppNav";
import ProductService from "~/services/ProductService";
import MenuItem from "./MenuItem";

type Brand = {
  _id: string;
  name: string;
  displayImg?: string;
  _displayName?: string;
};

const swiperOptions: SwiperOptions = {
  slidesPerView: 4,
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

const Brands = () => {
  const appNav = useAppNav();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setBrands([]);

    const fetchBrands = async () => {
      try {
        const response = await ProductService.getSpcBrands({
          page: 1,
          count: 20,
          brandFilter: {},
          sort: { name: 1 },
        });
        const data = Array.isArray(response.data) ? response.data : [];
        setBrands(
          data.map((brand: any) => ({
            _id: brand._id,
            name: brand.name,
            _displayName: brand._displayName || brand.name,
            displayImg:
              brand.image || brand._displayImg || brand.images?.[0] || "",
          })),
        );
      } catch (error) {
        console.error("Error fetching SK brands:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, []);

  const handleBrandClick = (brand: Brand) => {
    const name = brand._displayName || brand.name;
    appNav.to("/products/sk/list", {
      brandId: brand._id,
      brandName: brand.name,
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

  if (!brands || brands.length === 0) return null;

  // Show at most 20 brands on both mobile and desktop; the rest are reachable via "See all".
  const visibleBrands = brands.slice(0, 20);

  return (
    <div className="tw:mb-6">
      <div className="tw:mb-3 tw:flex tw:items-center tw:justify-between tw:gap-2">
        <h2 className="app-label tw:text-[0.8125rem]! tw:font-semibold tw:uppercase tw:tracking-[0.12em] tw:text-primary/70">
          Shop by Brands
        </h2>
        <button
          type="button"
          onClick={() => appNav.to("/products/sk/brands")}
          className="tw:inline-flex tw:items-center tw:gap-0.5 tw:cursor-pointer tw:text-[13px] tw:font-semibold tw:text-primary"
        >
          See all <span aria-hidden>→</span>
        </button>
      </div>

      {/* Always a horizontal slider — no grid view. */}
      <AppSwiper config={swiperOptions}>
        {visibleBrands.map((brand) => (
          <AppSwiper.Slide key={brand._id}>
            <MenuItem
              id={brand._id}
              name={brand.name}
              displayImg={brand.displayImg}
              displayName={brand._displayName}
              onClick={() => handleBrandClick(brand)}
              variant="slide"
            />
          </AppSwiper.Slide>
        ))}
      </AppSwiper>
    </div>
  );
};

export default Brands;
