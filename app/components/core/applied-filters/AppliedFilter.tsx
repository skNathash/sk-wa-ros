import type { SwiperOptions } from "swiper/types";
import { X } from "lucide-react";
import React, { useEffect, useRef } from "react";
import type SwiperClass from "swiper";
import AppSwiper from "~/components/core/swiper";
import CommonService from "~/services/CommonService";
import type { AppliedFilterLabel } from "~/types/CommonTypes";
import { cn } from "~/lib/utils";
import { useTranslation } from "react-i18next";

type Props = {
  filter: Record<string, any>;
  callback: (a: { action: string; data?: any }) => void;
  className?: string;
  mapping: Record<string, AppliedFilterLabel>;
};

const AppliedFilter = ({ filter, callback, className, mapping }: Props) => {
  const { t } = useTranslation(["common"]);

  const appliedFilters = CommonService.prepareAppliedFilterLabels(
    mapping,
    filter
  );

  const swiperRef = useRef<SwiperClass | null>(null);

  const onSwiperCallback = (data: {
    swiper: SwiperClass;
    action: "init" | "slideChange";
  }) => {
    if (data && data.swiper) {
      swiperRef.current = data.swiper;
      // ensure it's up-to-date on init/slideChange
      try {
        swiperRef.current.update();
      } catch (e) {
        // ignore update errors
      }
    }
  };

  useEffect(() => {
    // when applied filters change, update swiper to recalculate slides after a short delay
    let id: ReturnType<typeof setTimeout> | null = null;
    if (swiperRef.current) {
      id = setTimeout(() => {
        try {
          swiperRef.current?.update();
        } catch (e) {
          // ignore
        }
      }, 50);
    }

    return () => {
      if (id) {
        clearTimeout(id);
      }
    };
  }, [appliedFilters.length]);

  if (!appliedFilters || appliedFilters.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "tw:flex tw:items-center tw:gap-2 tw:overflow-x-hidden",
        className
      )}
    >
      <span className="tw:text-xs tw:font-medium tw:text-gray-600 tw:dark:text-gray-400 tw:whitespace-nowrap">
        {t("appliedFilters")}
      </span>
      <div className="tw:flex tw:flex-wrap tw:gap-2 tw:min-w-0">
        <AppSwiper config={swiperConfig} callback={onSwiperCallback}>
          {appliedFilters.map((filter) => {
            // Determine if close icon should be shown for this specific filter
            // Based on mapping config, default to true if not specified
            const shouldShowCloseIcon =
              filter.config?.showCloseIcon !== undefined
                ? filter.config.showCloseIcon
                : true;

            return (
              <AppSwiper.Slide key={filter.key} isAutoWidth={true}>
                <div className="tw:group tw:inline-flex tw:items-center tw:gap-1.5 tw:px-2 tw:py-1 tw:h-6 tw:bg-gray-100 tw:dark:bg-gray-800 tw:border tw:border-gray-200 tw:dark:border-gray-700 tw:rounded-md tw:text-xs tw:font-medium tw:text-gray-700 tw:dark:text-gray-200 tw:transition-colors tw:hover:bg-gray-200 tw:dark:hover:bg-gray-700">
                  <span className="tw:flex tw:items-center tw:gap-1.5 tw:leading-none">
                    <span className="tw:text-gray-500 tw:dark:text-gray-400 tw:font-normal tw:leading-none">
                      {filter.label}:
                    </span>
                    <span className="tw:font-medium tw:text-gray-900 tw:dark:text-gray-100 tw:leading-none">
                      {filter.value}
                    </span>
                  </span>
                  {shouldShowCloseIcon && (
                    <button
                      onClick={() =>
                        callback({ action: "remove", data: filter })
                      }
                      aria-label={`Remove ${filter.label} filter`}
                      className="tw:ml-0.5 tw:inline-flex tw:items-center tw:justify-center tw:rounded-sm tw:p-0 tw:w-3.5 tw:h-3.5 tw:text-gray-400 tw:dark:text-gray-500 tw:transition-colors tw:hover:bg-gray-300 tw:dark:hover:bg-gray-600 tw:hover:text-gray-600 tw:dark:hover:text-gray-300 tw:focus:outline-none tw:focus:ring-2 tw:focus:ring-gray-400 tw:focus:ring-offset-1 tw:flex-shrink-0"
                    >
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </AppSwiper.Slide>
            );
          })}
        </AppSwiper>
      </div>
    </div>
  );
};

const swiperConfig: SwiperOptions = {
  slidesPerView: "auto",
  spaceBetween: 10,
  pagination: false,
  navigation: false,
};

export default AppliedFilter;
