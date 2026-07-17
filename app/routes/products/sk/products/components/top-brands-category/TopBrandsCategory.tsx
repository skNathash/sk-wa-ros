import clsx from "clsx";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type Swiper from "swiper";
import type { SwiperOptions } from "swiper/types";
import ImgRender from "~/components/core/img/ImgRender";
import AppSwiper from "~/components/core/swiper";
import { Skeleton } from "~/components/ui/skeleton";
import useAppNav from "~/hooks/useAppNav";
import { getTopBrandsAndCategories, type TopSellingItem } from "./helper";

const LIST_PATH = "/products/sk/list";
const BRANDS_PATH = "/products/sk/brands";
const CATEGORY_PATH = "/products/sk/category";

// Brands render as a 2-row grid that scrolls sideways (vertical pairs).
const brandSwiperConfig: SwiperOptions = {
  spaceBetween: 10,
  navigation: false,
  pagination: false,
  breakpoints: {
    0: { slidesPerView: 3 },
    1024: { slidesPerView: 4 },
  },
};

const categorySwiperConfig: SwiperOptions = {
  spaceBetween: 12,
  navigation: false,
  pagination: false,
  breakpoints: {
    0: { slidesPerView: 3.2 },
    1024: { slidesPerView: 3.4 },
  },
};

const chunkPairs = <T,>(arr: T[]): T[][] => {
  const pairs: T[][] = [];
  for (let i = 0; i < arr.length; i += 2) {
    pairs.push(arr.slice(i, i + 2));
  }
  return pairs;
};

const TopBrandsCategory = () => {
  const appNav = useAppNav();
  const [brands, setBrands] = useState<TopSellingItem[]>([]);
  const [categories, setCategories] = useState<TopSellingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getTopBrandsAndCategories()
      .then((data) => {
        if (!active) return;
        setBrands(data.brands);
        setCategories(data.categories);
      })
      .catch((error) => {
        console.error("Error fetching top brands/categories:", error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const goToBrand = (item: TopSellingItem) =>
    appNav.to(LIST_PATH, {
      brandId: item._id,
      brandName: item._displayName || item.name,
      title: item._displayName || item.name,
    });

  const goToCategory = (item: TopSellingItem) =>
    appNav.to(LIST_PATH, {
      categoryId: item._id,
      categoryName: item._displayName || item.name,
      title: item._displayName || item.name,
    });

  // Hide entirely once we know there is nothing to show.
  if (!loading && brands.length === 0 && categories.length === 0) return null;

  const brandSlides = chunkPairs(brands).map((pair) => (
    <div className="tw:flex tw:flex-col tw:gap-2.5">
      {pair.map((item) => (
        <button
          key={item._id}
          type="button"
          onClick={() => goToBrand(item)}
          title={item._displayName || item.name}
          className="tw:flex tw:aspect-square tw:w-full tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:p-2 tw:transition hover:tw:border-blue-300 hover:tw:shadow-sm"
        >
          <ImgRender
            assetId={item.image}
            alt={item.name}
            width={120}
            className="tw:max-h-full tw:max-w-full tw:object-contain"
          />
        </button>
      ))}
    </div>
  ));

  const categorySlides = categories.map((item) => (
    <button
      key={item._id}
      type="button"
      onClick={() => goToCategory(item)}
      title={item._displayName || item.name}
      className="tw:group tw:flex tw:w-full tw:flex-col tw:items-center tw:gap-2"
    >
      <div className="tw:aspect-square tw:w-full tw:overflow-hidden tw:rounded-2xl tw:bg-slate-50 tw:transition tw:duration-200 group-hover:tw:ring-2 group-hover:tw:ring-blue-300">
        <ImgRender
          assetId={item.image}
          alt={item.name}
          width={300}
          className="tw:h-full tw:w-full tw:object-cover tw:transition-transform tw:duration-200 group-hover:tw:scale-105"
        />
      </div>
      <div className="tw:line-clamp-2 tw:text-center tw:text-xs tw:font-medium tw:leading-tight tw:text-slate-700 group-hover:tw:text-blue-700">
        {item._displayName || item.name}
      </div>
    </button>
  ));

  return (
    <div className="tw:flex tw:flex-col tw:gap-4">
      <SwiperCard
        title="Top Brands"
        loading={loading}
        slides={brandSlides}
        config={brandSwiperConfig}
        viewAllLabel="View all brands"
        onViewAll={() => appNav.to(BRANDS_PATH)}
        renderSkeleton={(i) => (
          <Skeleton key={i} className="tw:aspect-square tw:w-full tw:rounded-xl" />
        )}
      />

      <SwiperCard
        title="Categories"
        loading={loading}
        slides={categorySlides}
        config={categorySwiperConfig}
        viewAllLabel="View all categories"
        onViewAll={() => appNav.to(CATEGORY_PATH)}
        renderSkeleton={(i) => (
          <div key={i} className="tw:flex tw:flex-col tw:items-center tw:gap-2">
            <Skeleton className="tw:aspect-square tw:w-full tw:rounded-2xl" />
            <Skeleton className="tw:h-3 tw:w-3/5" />
          </div>
        )}
      />
    </div>
  );
};

type SwiperCardProps = {
  title: string;
  loading: boolean;
  slides: React.ReactNode[];
  config: SwiperOptions;
  viewAllLabel: string;
  onViewAll: () => void;
  renderSkeleton: (key: number) => React.ReactNode;
};

const SwiperCard = ({
  title,
  loading,
  slides,
  config,
  viewAllLabel,
  onViewAll,
  renderSkeleton,
}: SwiperCardProps) => {
  const swiperRef = useRef<Swiper | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  const handleSwiper = useCallback(({ swiper }: { swiper: Swiper }) => {
    swiperRef.current = swiper;
    setIsBeginning(swiper.isBeginning);
    setIsEnd(swiper.isEnd);
  }, []);

  if (!loading && slides.length === 0) return null;

  const canNavigate = !loading && slides.length > 0;

  return (
    <div className="tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-white tw:p-4 tw:shadow-sm">
      <div className="tw:mb-3 tw:flex tw:items-center tw:justify-between">
        <h3 className="tw:text-lg tw:font-bold tw:text-slate-900">{title}</h3>
        <div className="tw:flex tw:items-center tw:gap-2">
          <NavButton
            dir="prev"
            disabled={!canNavigate || isBeginning}
            onClick={() => swiperRef.current?.slidePrev()}
          />
          <NavButton
            dir="next"
            disabled={!canNavigate || isEnd}
            onClick={() => swiperRef.current?.slideNext()}
          />
        </div>
      </div>

      {loading ? (
        <div className="tw:grid tw:grid-cols-3 tw:gap-3 tw:lg:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => renderSkeleton(i))}
        </div>
      ) : (
        <AppSwiper config={config} callback={handleSwiper}>
          {slides.map((slide, idx) => (
            <AppSwiper.Slide key={idx} className="tw:h-auto!">
              {slide}
            </AppSwiper.Slide>
          ))}
        </AppSwiper>
      )}

      <div className="tw:mt-4 tw:flex tw:justify-center">
        <button
          type="button"
          onClick={onViewAll}
          className="tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:border tw:border-gray-200 tw:px-4 tw:py-2 tw:text-xs tw:font-medium tw:text-slate-700 tw:transition hover:tw:border-blue-300 hover:tw:text-blue-700"
        >
          {viewAllLabel}
          <ArrowUpRight className="tw:h-3.5 tw:w-3.5" />
        </button>
      </div>
    </div>
  );
};

const NavButton = ({
  dir,
  disabled,
  onClick,
}: {
  dir: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    aria-label={dir === "prev" ? "Previous" : "Next"}
    className={clsx(
      "tw:flex tw:h-8 tw:w-8 tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-gray-200 tw:text-slate-600 tw:transition",
      disabled
        ? "tw:cursor-not-allowed tw:opacity-40"
        : "hover:tw:border-blue-300 hover:tw:text-blue-600",
    )}
  >
    {dir === "prev" ? (
      <ArrowLeft className="tw:h-4 tw:w-4" />
    ) : (
      <ArrowRight className="tw:h-4 tw:w-4" />
    )}
  </button>
);

export default TopBrandsCategory;
