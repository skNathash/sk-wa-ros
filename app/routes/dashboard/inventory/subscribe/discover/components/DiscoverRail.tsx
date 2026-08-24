import React, { useEffect, useRef, useState } from "react";
import type { SwiperOptions } from "swiper/types";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import useAppNav from "~/hooks/useAppNav";
import DiscoverProductCard, {
  type DiscoverDeal,
} from "./DiscoverProductCard";
import SeeAllLink from "./SeeAllLink";
import SectionHeading from "./SectionHeading";

const swiperConfig: SwiperOptions = {
  slidesPerView: "auto",
  spaceBetween: 12,
  navigation: false,
  pagination: false,
  freeMode: true,
};

interface Props {
  /** Section eyebrow, e.g. "Trending in HSR". */
  title: string;
  /** Small caption under the title. */
  subtitle?: string;
  /** "See all" deep-link target. */
  seeAllTo?: string;
  /** Loads the deals for this rail. */
  fetcher: (signal?: AbortSignal) => Promise<DiscoverDeal[]>;
}

const isAbortError = (error: any) =>
  error?.name === "CanceledError" ||
  error?.name === "AbortError" ||
  error?.code === "ERR_CANCELED";

const DiscoverRail: React.FC<Props> = ({
  title,
  subtitle,
  seeAllTo,
  fetcher,
}) => {
  const appNav = useAppNav();

  const [items, setItems] = useState<DiscoverDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    fetcherRef
      .current(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setItems(data);
      })
      .catch((error) => {
        if (isAbortError(error)) return;
        console.error(`Failed to load "${title}" rail`, error);
        setItems([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [title]);

  const handleProductTap = (id: string) => {
    appNav.to(`/dashboard/inventory/subscribe/product-detail/${id}`);
  };

  // Hide the whole rail once loaded with nothing to show.
  if (!isLoading && items.length === 0) return null;

  return (
    // The swiper carries tw:pb-2 for card-shadow clearance, so the margin is
    // 8px short of the page rhythm to land on the same visual gap.
    <section className="tw:mb-3 tw:md:mb-5">
      <SectionHeading
        title={title}
        subtitle={subtitle}
        action={seeAllTo ? <SeeAllLink to={seeAllTo} /> : null}
      />

      {isLoading ? (
        <div className="tw:flex tw:gap-3 tw:overflow-x-auto tw:pb-2 tw:-mx-1 tw:px-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="tw:w-44 tw:shrink-0 tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-2 tw:animate-pulse"
            >
              <div className="tw:h-32 tw:w-full tw:rounded-xl tw:bg-slate-200" />
              <div className="tw:mt-3 tw:h-3 tw:rounded tw:bg-slate-200" />
              <div className="tw:mt-2 tw:h-3 tw:w-2/3 tw:rounded tw:bg-slate-200" />
              <div className="tw:mt-3 tw:flex tw:items-end tw:justify-between">
                <div className="tw:h-6 tw:w-12 tw:rounded tw:bg-slate-200" />
                <div className="tw:h-7 tw:w-12 tw:rounded-full tw:bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <AppSwiper config={swiperConfig} className="tw:pb-2 tw:-mx-1 tw:px-1">
          {items.map((item) => (
            <AppSwiper.Slide key={item._id} isAutoWidth>
              <DiscoverProductCard data={item} onTap={handleProductTap} />
            </AppSwiper.Slide>
          ))}
        </AppSwiper>
      )}
    </section>
  );
};

export default DiscoverRail;
