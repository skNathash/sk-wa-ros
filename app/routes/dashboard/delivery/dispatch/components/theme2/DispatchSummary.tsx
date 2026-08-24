import type { SwiperOptions } from "swiper/types";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import MiscService from "~/services/MiscService";
import type { DispatchSummaryTile } from "./helper";
import { toneClasses } from "./helper";

interface DispatchSummaryProps {
  data: DispatchSummaryTile[];
  loading?: boolean;
  className?: string;
}

/** Tiles ride a rail instead of a grid — a peeking 1.8 on mobile, five in
 *  view on desktop. */
const swiperConfig: SwiperOptions = {
  spaceBetween: 12,
  breakpoints: {
    0: { slidesPerView: 1.8 },
    1024: { slidesPerView: 5 },
  },
  slidesOffsetBefore: MiscService.isMobile() ? 16 : 0,
  slidesOffsetAfter: MiscService.isMobile() ? 16 : 0,
};

/* Mobile lifts the strip onto its own white band that runs edge to edge via
 * `app-bleed-x`; on desktop the tiles sit straight on the page. */
const bandClasses =
  "app-bleed-x tw:max-lg:border-t tw:max-lg:border-gray-200 tw:max-lg:bg-white tw:max-lg:py-4";

const tileClasses =
  "tw:h-full tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-white tw:p-4";

/**
 * Theme-2 dispatch KPI strip — the tile row that opens the page: mono eyebrow,
 * one large figure, and a line of context under it.
 */
const DispatchSummary = ({
  data,
  loading = false,
  className = "",
}: DispatchSummaryProps) => {
  // Skeleton keeps the strip's height while the counters load, so the page
  // below it doesn't jump once they land.
  if (loading) {
    return (
      <div className={`${bandClasses} ${className}`}>
        <AppSwiper config={swiperConfig} className="tw:animate-pulse">
          {Array.from({ length: 5 }).map((_, index) => (
            <AppSwiper.Slide key={index} isAutoHeight>
              <div className={tileClasses}>
                <div className="tw:h-2.5 tw:w-16 tw:rounded tw:bg-gray-200" />
                <div className="tw:mt-3 tw:h-6 tw:w-12 tw:rounded tw:bg-gray-200" />
                <div className="tw:mt-3 tw:h-2.5 tw:w-20 tw:rounded tw:bg-gray-100" />
              </div>
            </AppSwiper.Slide>
          ))}
        </AppSwiper>
      </div>
    );
  }

  if (!data?.length) return null;

  return (
    <div className={`${bandClasses} ${className}`}>
      <AppSwiper config={swiperConfig}>
        {data.map((tile) => (
          <AppSwiper.Slide key={tile.key} isAutoHeight>
            <div className={tileClasses}>
              <div className="tw:font-mono tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-gray-500">
                {tile.label}
              </div>
              <div
                className={`tw:mt-2 tw:text-2xl tw:font-bold tw:leading-none app-amount ${
                  toneClasses[tile.tone || "neutral"]
                }`}
              >
                {tile.value}
              </div>
              {tile.caption && (
                <div className="tw:mt-2 tw:text-xs tw:text-gray-500">
                  {tile.caption}
                </div>
              )}
            </div>
          </AppSwiper.Slide>
        ))}
      </AppSwiper>
    </div>
  );
};

export default DispatchSummary;
