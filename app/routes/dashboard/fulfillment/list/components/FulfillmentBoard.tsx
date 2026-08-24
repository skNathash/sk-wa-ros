import { useCallback, useEffect, useRef } from "react";
import type Swiper from "swiper";
import type { SwiperOptions } from "swiper/types";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import {
  FULFILLMENT_STAGES,
  type FulfillmentStageCounts,
} from "~/shared/fulfillment/components/fulfillment-side-pane/helper";
import FulfillmentBoardColumn from "./FulfillmentBoardColumn";

interface FulfillmentBoardProps {
  /** Search / type / route filters currently applied on the page. */
  filters: Record<string, any>;
  stageCounts?: FulfillmentStageCounts;
  stageCountsLoading?: boolean;
  /** Lane the board is parked on — kept in sync with the side pane. */
  activeStage?: string;
  onStageChange?: (key: string) => void;
}

// Kept at module scope: AppSwiper re-initialises whenever the config identity
// changes, which would tear the board down on every render.
const BOARD_SWIPER_CONFIG: SwiperOptions = {
  slidesPerView: 1.15,
  spaceBetween: 10,
  breakpoints: {
    640: { slidesPerView: 2.2, spaceBetween: 10 },
    1024: { slidesPerView: 3.2, spaceBetween: 12 },
    1280: { slidesPerView: 4.2, spaceBetween: 12 },
    1600: { slidesPerView: 5.2, spaceBetween: 12 },
  },
};

/**
 * Kanban board of the fulfilment pipeline: one swipeable lane per stage, each
 * loading and paging its own orders. Replaces the old single-stage tab view —
 * the whole pipeline is visible at once and the side pane just parks the board
 * on a lane instead of swapping the list underneath it.
 */
const FulfillmentBoard = ({
  filters,
  stageCounts,
  stageCountsLoading,
  activeStage,
  onStageChange,
}: FulfillmentBoardProps) => {
  const swiperRef = useRef<Swiper | null>(null);

  const handleSwiper = useCallback(
    ({ swiper, action }: { swiper: Swiper; action: "init" | "slideChange" }) => {
      swiperRef.current = swiper;
      if (action !== "slideChange" || !onStageChange) return;

      const stage = FULFILLMENT_STAGES[swiper.activeIndex];
      if (stage && stage.key !== activeStage) onStageChange(stage.key);
    },
    [activeStage, onStageChange],
  );

  // Selecting a stage in the side pane slides the board to that lane.
  useEffect(() => {
    const swiper = swiperRef.current;
    if (!swiper || swiper.destroyed) return;

    const index = FULFILLMENT_STAGES.findIndex(
      (stage) => stage.key === activeStage,
    );
    if (index >= 0 && index !== swiper.activeIndex) swiper.slideTo(index);
  }, [activeStage]);

  return (
    <AppSwiper
      config={BOARD_SWIPER_CONFIG}
      callback={handleSwiper}
      className="tw:h-[calc(100dvh-11rem)] tw:max-h-224 tw:min-h-120 tw:w-full"
    >
      {FULFILLMENT_STAGES.map((stage) => (
        <AppSwiper.Slide key={stage.key} className="tw:h-full">
          <FulfillmentBoardColumn
            stage={stage}
            filters={filters}
            count={stageCounts?.[stage.key] || 0}
            countLoading={stageCountsLoading}
          />
        </AppSwiper.Slide>
      ))}
    </AppSwiper>
  );
};

export default FulfillmentBoard;
