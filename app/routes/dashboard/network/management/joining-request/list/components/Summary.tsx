import clsx from "clsx";
import type { SwiperOptions } from "swiper/types";
import AppCard from "~/components/core/card/AppCard";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import MiscService from "~/services/MiscService";

/** Status segments the tiles (and mobile pill strip) filter the list down to. */
export type JoiningSegment = "all" | "Pending" | "Approved" | "Rejected";

/** Tiles ride a rail instead of a grid — a peeking 1.8 on mobile, all four
 *  in view on desktop. */
const swiperConfig: SwiperOptions = {
  spaceBetween: 8,
  breakpoints: {
    0: { slidesPerView: 1.8 },
    1024: { slidesPerView: 4 },
  },
  slidesOffsetBefore: MiscService.isMobile() ? 16 : 0,
  slidesOffsetAfter: MiscService.isMobile() ? 16 : 0,
};

type SummaryCard = {
  key: string;
  segment: JoiningSegment;
  label: string;
  value: string;
  caption: string;
  valueClassName: string;
  activeClassName: string;
  progress?: { percent: number; barClassName: string };
};

const count = (value: any) => (Number(value) || 0).toLocaleString("en-IN");

/**
 * Tiles for the joining-request list — total / pending / approved / rejected
 * from the page's own count aggregate. Each tile maps to a status segment.
 */
const buildCards = (summary: Record<string, any>): SummaryCard[] => {
  const total = Number(summary.total) || 0;
  const pending = Number(summary.notApproved) || 0;
  const approved = Number(summary.approved) || 0;
  const rejected = Number(summary.rejected) || 0;
  const pct = (n: number) =>
    total ? Math.min(100, Math.round((n / total) * 100)) : 0;

  return [
    {
      key: "pending",
      segment: "Pending",
      label: "Pending",
      value: count(pending),
      caption: total
        ? `${pct(pending)}% of requests · needs review`
        : "Awaiting your decision",
      valueClassName: "tw:text-amber-500",
      activeClassName: "tw:border-amber-500 tw:ring-amber-500",
      progress: {
        percent: pct(pending),
        barClassName: "tw:bg-amber-500",
      },
    },
    {
      key: "approved",
      segment: "Approved",
      label: "Approved",
      value: count(approved),
      caption: total
        ? `${pct(approved)}% of requests · onboarded`
        : "Joined your network",
      valueClassName: "tw:text-teal-700",
      activeClassName: "tw:border-teal-500 tw:ring-teal-700",
      progress: {
        percent: pct(approved),
        barClassName: "tw:bg-teal-700",
      },
    },
    {
      key: "rejected",
      segment: "Rejected",
      label: "Rejected",
      value: count(rejected),
      caption: total
        ? `${pct(rejected)}% of requests · declined`
        : "Declined requests",
      valueClassName: "tw:text-rose-600",
      activeClassName: "tw:border-rose-500 tw:ring-rose-600",
    },
    {
      key: "total",
      segment: "all",
      label: "All Requests",
      value: count(total),
      caption: "Every status in one view",
      valueClassName: "tw:text-sky-600",
      activeClassName: "tw:border-sky-500 tw:ring-sky-600",
    },
  ];
};

type Props = {
  summary?: Record<string, any>;
  /** Segment currently applied to the table — the matching tile reads as on. */
  activeSegment?: JoiningSegment;
  /** Fired with the tapped tile's segment; tapping the active tile clears to all. */
  onSegmentSelect?: (segment: JoiningSegment) => void;
};

const Summary = ({
  summary,
  activeSegment = "Pending",
  onSegmentSelect,
}: Props) => {
  const summaryCards = buildCards(summary || {});

  return (
    <div className="app-bleed-x">
      <AppSwiper config={swiperConfig} className="tw:mb-3">
        {summaryCards.map((card) => {
          const isActive = activeSegment === card.segment;

          return (
            <AppSwiper.Slide key={card.key} isAutoHeight>
              <button
                type="button"
                aria-pressed={isActive}
                onClick={() =>
                  onSegmentSelect?.(isActive ? "all" : card.segment)
                }
                className="tw:w-full tw:h-full tw:text-left tw:cursor-pointer"
              >
                <AppCard
                  className={clsx(
                    "tw:mb-0 tw:h-full tw:transition tw:hover:shadow-sm",
                    isActive
                      ? clsx(
                          "tw:shadow-sm tw:ring-1 tw:ring-opacity-20",
                          card.activeClassName,
                        )
                      : "",
                  )}
                  noPadding
                  bodyClassName="tw:px-2.5 tw:py-2"
                >
                  <span className="tw:block tw:text-[9px] tw:uppercase tw:tracking-wide tw:font-semibold tw:text-gray-500 tw:line-clamp-1">
                    {card.label}
                  </span>

                  <span
                    className={clsx(
                      "tw:block tw:text-xl tw:font-bold tw:leading-tight",
                      card.valueClassName,
                    )}
                  >
                    {card.value}
                  </span>

                  <span className="tw:block tw:text-[10px] tw:text-gray-500 tw:mt-1 tw:line-clamp-1">
                    {card.caption}
                  </span>

                  {card.progress && (
                    <div className="tw:h-1 tw:w-full tw:rounded-full tw:bg-gray-200 tw:mt-1.5">
                      <div
                        className={clsx(
                          "tw:h-1 tw:rounded-full",
                          card.progress.barClassName,
                        )}
                        style={{ width: `${card.progress.percent}%` }}
                      />
                    </div>
                  )}
                </AppCard>
              </button>
            </AppSwiper.Slide>
          );
        })}
      </AppSwiper>
    </div>
  );
};

export default Summary;
