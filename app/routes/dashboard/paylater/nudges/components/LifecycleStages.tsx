import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import React, { useMemo } from "react";
import type { SwiperOptions } from "swiper/types";
import AppCard from "~/components/core/card/AppCard";
import AppSwiper from "~/components/core/swiper";
import {
  STAGE_TONES,
  type NudgeStage,
  type NudgeStageKey,
} from "../helper";

interface LifecycleStagesProps {
  stages: NudgeStage[];
  activeKey: NudgeStageKey;
  callback?: (payload: { action: string; data: NudgeStageKey }) => void;
}

/**
 * The six-stage rail across the top of the page. Each card is a button — the
 * whole page below focuses on whichever stage is picked — so the rail doubles
 * as this week's counts and as the page's navigation.
 */
const LifecycleStages: React.FC<LifecycleStagesProps> = ({
  stages,
  activeKey,
  callback,
}) => {
  // The stages are a fixed flow, so on large screens every stage shares the
  // row; on phones the rail shows 1.8 cards so the next stage peeks in and
  // reads as swipeable.
  const swiperConfig = useMemo<SwiperOptions>(
    () => ({
      slidesPerView: 1.8,
      spaceBetween: 8,
      pagination: false,
      navigation: false,
      breakpoints: {
        1024: {
          slidesPerView: stages.length,
          spaceBetween: 20,
        },
      },
    }),
    [stages.length],
  );

  return (
    <AppCard className="tw:mb-4">
      <div className="tw:mb-3 tw:flex tw:items-start tw:justify-between tw:gap-3">
        <div className="tw:min-w-0">
          <h2 className="tw:text-sm tw:font-bold tw:text-gray-900">
            Paylater lifecycle · this week
          </h2>
          <p className="tw:text-xs tw:text-gray-500">
            Click any stage to focus. B2B and B2C flow through the same 6 stages
            with different tone.
          </p>
        </div>

        <div className="tw:hidden tw:sm:flex tw:shrink-0 tw:items-center tw:gap-3 tw:text-[11px] tw:text-gray-500">
          <span className="tw:flex tw:items-center tw:gap-1">
            <span className="tw:h-2 tw:w-2 tw:rounded-full tw:bg-emerald-600" />
            B2B
          </span>
          <span className="tw:flex tw:items-center tw:gap-1">
            <span className="tw:h-2 tw:w-2 tw:rounded-full tw:bg-fuchsia-500" />
            B2C
          </span>
        </div>
      </div>

      {/* One row that swipes on small screens — the stages are an ordered
          flow, so wrapping them into a grid would break the reading order. */}
      <AppSwiper config={swiperConfig} className="tw:pt-1 tw:pb-2">
        {stages.map((stage, idx) => {
          const tone = STAGE_TONES[stage.key];
          const Icon = stage.icon;
          const isActive = stage.key === activeKey;

          return (
            <AppSwiper.Slide
              key={stage.key}
              className="tw:relative"
              isAutoHeight
            >
              {idx > 0 && (
                <span className="tw:hidden tw:lg:flex tw:absolute tw:-left-4 tw:top-1/2 tw:-translate-y-1/2 tw:items-center tw:text-gray-300">
                  <ChevronRight className="tw:h-4 tw:w-4" />
                </span>
              )}

              <button
                type="button"
                onClick={() =>
                  callback?.({ action: "select", data: stage.key })
                }
                className={clsx(
                  "tw:relative tw:h-full tw:w-full tw:cursor-pointer",
                  "tw:overflow-hidden tw:rounded-lg tw:border tw:bg-white tw:p-3 tw:pt-4 tw:text-left",
                  isActive
                    ? "tw:border-gray-900"
                    : "tw:border-gray-200 tw:hover:border-gray-300",
                )}
              >
                {/* The colour bar marks the stage on the resting cards; the
                    active card says it with its own border instead. */}
                {!isActive && (
                  <span
                    className={clsx(
                      "tw:absolute tw:inset-x-0 tw:top-0 tw:h-1",
                      tone.bar,
                    )}
                  />
                )}

                <div className="tw:mb-1 tw:flex tw:items-center tw:justify-between tw:gap-2">
                  <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-2">
                    <span
                      className={clsx(
                        "tw:flex tw:h-5 tw:w-5 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-[10px] tw:font-bold tw:text-white",
                        tone.badge,
                      )}
                    >
                      {stage.step}
                    </span>
                    <span
                      className={clsx(
                        "tw:truncate tw:text-sm tw:font-bold",
                        tone.text,
                      )}
                    >
                      {stage.name}
                    </span>
                  </div>

                  <Icon className={clsx("tw:h-3.5 tw:w-3.5", tone.text)} />
                </div>

                <p className="tw:mb-2 tw:text-[11px] tw:text-gray-500 tw:line-clamp-1">
                  {stage.caption}
                </p>

                <p className="tw:mb-2">
                  <span
                    className={clsx("tw:text-2xl tw:font-bold", tone.text)}
                  >
                    {stage.count}
                  </span>
                  <span className="tw:ml-1 tw:text-xs tw:text-gray-500">
                    people
                  </span>
                </p>

                <span
                  className={clsx(
                    "tw:block tw:truncate tw:rounded tw:px-2 tw:py-1 tw:text-[11px] tw:font-medium",
                    tone.chip,
                  )}
                >
                  {stage.metric}
                </span>
              </button>
            </AppSwiper.Slide>
          );
        })}
      </AppSwiper>
    </AppCard>
  );
};

export default LifecycleStages;
