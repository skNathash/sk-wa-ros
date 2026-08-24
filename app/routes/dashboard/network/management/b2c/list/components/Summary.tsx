import clsx from "clsx";
import type { SwiperOptions } from "swiper/types";
import AppCard from "~/components/core/card/AppCard";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import CommonService from "~/services/CommonService";
import MiscService from "~/services/MiscService";
import type { DirectoryChipKey } from "~/shared/network/components/directory-side-pane/DirectoryPaneChips";

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
  /** Segment the tile filters the table down to when tapped. */
  segment: DirectoryChipKey;
  label: string;
  value: string;
  caption: string;
  valueClassName: string;
  /** Border + ring the tile picks up while its segment is applied — same
   *  active treatment `AppStatsCard` uses for selectable stat cards. */
  activeClassName: string;
  /** Optional filled bar rendered under the caption (0-100). */
  progress?: { percent: number; barClassName: string };
};

const count = (value: any) => (Number(value) || 0).toLocaleString("en-IN");

const money = (value: any) =>
  CommonService.formatCompact(Number(value) || 0, { style: "short" });

/**
 * Tiles for the customer directory, built from the `loyaltySummary` aggregate
 * on `customer/dashboard/customers` — the same endpoint and filters the table
 * runs on. Each tile maps to one entry under `cards`.
 */
const buildCards = (summary: Record<string, any>): SummaryCard[] => {
  const cards = summary.cards || {};
  const { loyal = {}, paylaterActive = {}, silent = {}, coins = {} } = cards;
  const total = Number(summary.total) || 0;
  const loyalCount = Number(loyal.count) || 0;

  return [
    {
      key: "loyal",
      segment: "loyal",
      label: "Loyal",
      value: count(loyalCount),
      caption: loyal.criteria
        ? `${loyal.criteria}${total ? ` · ${Math.round((loyalCount / total) * 100)}% of book` : ""}`
        : "Repeat buyers",
      valueClassName: "tw:text-teal-700",
      activeClassName: "tw:border-teal-500 tw:ring-teal-700",
      progress: {
        percent: total
          ? Math.min(100, Math.round((loyalCount / total) * 100))
          : 0,
        barClassName: "tw:bg-teal-700",
      },
    },
    {
      key: "paylaterActive",
      segment: "paylater",
      label: "Paylater Active",
      value: count(paylaterActive.count),
      caption: `${money(paylaterActive.outstanding)} outstanding · ${money(
        paylaterActive.approvedLimit,
      )} limit`,
      valueClassName: "tw:text-violet-600",
      activeClassName: "tw:border-violet-500 tw:ring-violet-600",
    },
    {
      key: "silent",
      segment: "silent",
      label: "Silent 30d+",
      value: count(silent.count),
      caption: `${money(silent.dormantLtv)} dormant LTV · nudge them`,
      valueClassName: "tw:text-amber-500",
      activeClassName: "tw:border-amber-500 tw:ring-amber-500",
    },
    {
      key: "coins",
      segment: "coins",
      label: "Coins in Circulation",
      value: count(coins.total),
      caption: `${count(coins.holders)} customers holding · avg ${count(
        coins.average,
      )}`,
      valueClassName: "tw:text-amber-500",
      activeClassName: "tw:border-amber-500 tw:ring-amber-500",
    },
  ];
};

type Props = {
  summary?: Record<string, any>;
  /** Segment currently applied to the table — the matching tile reads as on. */
  activeSegment?: DirectoryChipKey;
  /** Fired with the tapped tile's segment; tapping the active tile clears it. */
  onSegmentSelect?: (segment: DirectoryChipKey) => void;
};

const Summary = ({
  summary,
  activeSegment = "all",
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
