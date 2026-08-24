import { useCallback, useEffect, useState } from "react";
import type { SwiperOptions } from "swiper/types";
import AppCard from "~/components/core/card/AppCard";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import { Skeleton } from "~/components/ui/skeleton";
import DealCard from "./DealCard";
import DealDetailModal from "./DealDetailModal";
import {
  SECTION_META,
  getCount,
  getData,
  prepareParams,
  shareDeal,
  type DealSectionType,
  type SectionDeal,
} from "./helper";

// Module level so the instance is created once — AppSwiper re-inits whenever the
// config identity changes.
const swiperConfig: SwiperOptions = {
  slidesPerView: "auto",
  spaceBetween: 12,
  navigation: false,
  pagination: false,
  freeMode: true,
};

/** One card's track width — same on phones and desktop, so the rail always
    hints at the next card instead of squaring off into a row. */
const SLIDE_WIDTH = "tw:w-40 tw:sm:w-44";

type Props = {
  /** Which recommendation slice the rail reads. */
  type: DealSectionType;
  /** How many deals the rail loads — enough to slide past the first screenful. */
  limit?: number;
  className?: string;
};

const DealSection = ({ type, limit = 10, className = "" }: Props) => {
  const meta = SECTION_META[type];
  const Icon = meta.icon;

  const [deals, setDeals] = useState<SectionDeal[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeDeal, setActiveDeal] = useState<SectionDeal | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = prepareParams(type, limit);
    const [items, count] = await Promise.all([
      getData(params),
      getCount(params),
    ]);
    setDeals(items);
    // The count call is the whole slice; without it the chip still reads the
    // rail rather than showing nothing.
    setTotal(count || items.length);
    setLoading(false);
  }, [type, limit]);

  useEffect(() => {
    load();
  }, [load]);

  // A slice with nothing in it is not worth an empty shelf on the page.
  if (!loading && deals.length === 0) {
    return null;
  }

  return (
    <>
      <AppCard className={`tw:mb-0 tw:border-gray-200 ${className}`}>
        <div className="tw:mb-3 tw:flex tw:items-start tw:justify-between tw:gap-3">
          <div className="tw:flex tw:min-w-0 tw:items-start tw:gap-2">
            <span
              className={`tw:flex tw:h-7 tw:w-7 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg ${meta.iconClassName}`}
            >
              <Icon className="tw:h-3.5 tw:w-3.5" />
            </span>
            <div className="tw:min-w-0">
              <h2
                className={`tw:text-[13px] tw:font-bold tw:leading-tight ${meta.titleClassName}`}
              >
                {meta.title}
              </h2>
              <p className="tw:text-[11px] tw:text-gray-500 tw:line-clamp-1">
                {meta.subtitle}
              </p>
            </div>
          </div>

          {!loading && total > 0 ? (
            <span
              className={`tw:shrink-0 tw:rounded-md tw:px-2 tw:py-1 tw:text-[9px] tw:font-bold tw:uppercase tw:tracking-wide ${meta.chipClassName}`}
            >
              {total} rewards
            </span>
          ) : null}
        </div>

        {loading ? (
          <div className="tw:flex tw:gap-3 tw:overflow-hidden">
            {Array.from({ length: limit }).map((_, idx) => (
              <div
                key={`${type}-skeleton-${idx}`}
                className={`tw:shrink-0 ${SLIDE_WIDTH}`}
              >
                <Skeleton className="tw:mb-2 tw:h-28 tw:w-full tw:rounded-lg" />
                <Skeleton className="tw:mb-1 tw:h-3 tw:w-3/4" />
                <Skeleton className="tw:h-3 tw:w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <AppSwiper config={swiperConfig} className="tw:-mx-1 tw:px-1">
            {deals.map((deal) => (
              <AppSwiper.Slide key={deal.id} isAutoWidth isAutoHeight>
                <div className={SLIDE_WIDTH}>
                  <DealCard
                    deal={deal}
                    onDetail={setActiveDeal}
                    onShare={shareDeal}
                  />
                </div>
              </AppSwiper.Slide>
            ))}
          </AppSwiper>
        )}
      </AppCard>

      <DealDetailModal
        show={!!activeDeal}
        deal={activeDeal}
        callback={() => setActiveDeal(null)}
      />
    </>
  );
};

export default DealSection;
