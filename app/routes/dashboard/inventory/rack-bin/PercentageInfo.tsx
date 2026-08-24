import React from "react";
import AppCard from "~/components/core/card/AppCard";
import AppSwiper from "~/components/core/swiper";
import type { SwiperOptions } from "swiper/types";
import "~/styles/rack-bin.css";
import { BIN_STATUSES } from "./helper";
import { useTranslation } from "react-i18next";

const swiperConfig: SwiperOptions = {
  spaceBetween: 12,
  freeMode: true,
  slidesPerView: "auto",
};

const PercentageInfo: React.FC = () => {
  const { t } = useTranslation();

  return (
    <AppCard className="percentage-info-blk tw:py-2 tw:px-3">
      <div className="tw:flex tw:items-center tw:gap-3">
        <span className="tw:font-medium tw:text-sm tw:shrink-0">
          {t("binCapacityStatus")}:
        </span>
        <AppSwiper config={swiperConfig} className="tw:flex-1 tw:min-w-0">
          {BIN_STATUSES.map((status) => (
            <AppSwiper.Slide
              key={status.label}
              isAutoWidth
              className={`${status.colorClass} tw:rounded-full tw:px-2.5 tw:py-1`}
            >
              <span className="tw:flex tw:items-center tw:gap-1.5">
                <span
                  className="tw:w-2.5 tw:h-2.5 tw:inline-block tw:rounded-full"
                  style={{ backgroundColor: "var(--bin-accent)" }}
                />
                <span
                  className="tw:text-xs tw:font-medium tw:whitespace-nowrap"
                  style={{ color: "var(--bin-accent)" }}
                >
                  {t(status.langKey)}
                </span>
              </span>
            </AppSwiper.Slide>
          ))}
        </AppSwiper>
      </div>
    </AppCard>
  );
};

export default PercentageInfo;
