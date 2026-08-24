import React from "react";
import { useTranslation } from "react-i18next";
import type { SwiperOptions } from "swiper/types";
import AppCard from "~/components/core/card/AppCard";
import AppSwiper from "~/components/core/swiper";
import { BIN_STATUSES } from "../helper";

export interface BinSummaryStats {
  totalBins: number;
  filledBins: number;
  totalItems: number;
  statusCounts: Record<string, number>;
}

interface BinSummaryProps {
  stats: BinSummaryStats;
  activeStatus: string;
  callback: (r: { action: string; data: string }) => void;
  className?: string;
}

const swiperConfig: SwiperOptions = {
  spaceBetween: 8,
  slidesPerView: "auto",
};

const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="tw:flex tw:flex-col">
    <span className="app-amount tw:text-lg tw:font-bold tw:leading-none">
      {value}
    </span>
    <span className="app-label tw:mt-1 tw:text-[11px] tw:opacity-60">
      {label}
    </span>
  </div>
);

/**
 * Rack/bin overview strip: headline stats (total bins, filled bins, total
 * items) plus one chip per fill status with its bin count. Chips reuse the
 * `bin-*` classes from app.css so they always match the BinItem card colors;
 * tapping a chip fires `status-change` so the page can filter the grid. The
 * active chip fills solid with the status accent (--bin-accent).
 */
const BinSummary: React.FC<BinSummaryProps> = ({
  stats,
  activeStatus,
  callback,
  className = "",
}) => {
  const { t } = useTranslation();

  const chips = [
    {
      value: "all",
      label: t("all"),
      count: stats.totalBins,
      colorClass: "bin-empty",
    },
    {
      value: "allocated",
      label: t("filled"),
      count: stats.filledBins,
      colorClass: "",
    },
    ...BIN_STATUSES.map((s) => {
      const key = s.value.toLowerCase();
      return {
        value: key,
        label: t(s.langKey),
        count: stats.statusCounts[key] ?? 0,
        colorClass: s.colorClass,
      };
    }),
  ];

  return (
    <AppCard className={`tw:py-3 ${className}`} bodyClassName="tw:px-3">
      <div className="tw:flex tw:items-center tw:gap-6 tw:mb-3">
        <Stat label={t("totalBins")} value={stats.totalBins} />
        <Stat label={t("filledBins")} value={stats.filledBins} />
        <Stat label={t("totalItems")} value={stats.totalItems} />
      </div>

      <AppSwiper config={swiperConfig}>
        {chips.map((chip) => {
          const active = activeStatus === chip.value;
          return (
            <AppSwiper.Slide
              key={chip.value}
              isAutoWidth
              className={chip.colorClass}
            >
              <button
                type="button"
                onClick={() =>
                  callback({ action: "status-change", data: chip.value })
                }
                className={`tw:flex tw:items-center tw:gap-1.5 tw:rounded-full tw:px-2.5 tw:py-1 tw:transition-colors ${
                  active ? "" : "tw:bg-black/5"
                }`}
                style={
                  active
                    ? { backgroundColor: "var(--bin-accent, var(--primary))" }
                    : undefined
                }
              >
                <span
                  className="tw:w-2 tw:h-2 tw:inline-block tw:rounded-full"
                  style={{
                    backgroundColor: active
                      ? "#fff"
                      : "var(--bin-accent, var(--primary))",
                  }}
                />
                <span
                  className={`tw:text-xs tw:font-medium tw:whitespace-nowrap ${
                    active ? "tw:text-white" : ""
                  }`}
                  style={
                    active
                      ? undefined
                      : { color: "var(--bin-accent, var(--primary))" }
                  }
                >
                  {chip.label}
                </span>
                <span
                  className={`tw:text-xs tw:font-bold tw:tabular-nums ${
                    active ? "tw:text-white" : ""
                  }`}
                  style={
                    active
                      ? undefined
                      : { color: "var(--bin-accent, var(--primary))" }
                  }
                >
                  {chip.count}
                </span>
              </button>
            </AppSwiper.Slide>
          );
        })}
      </AppSwiper>
    </AppCard>
  );
};

export default BinSummary;
