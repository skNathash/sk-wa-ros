import clsx from "clsx";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useAppNav from "~/hooks/useAppNav";
import {
  getNewlyAdded,
  toneAt,
  type NewlyAddedItem,
} from "~/shared/network/components/directory-side-pane/newly-added/helper";

interface OnboardedTodayProps {
  /** How many rows to show. Defaults to 4, matching the pane design. */
  limit?: number;
  /**
   * Bump this after a successful onboarding to pull the list again — the
   * customer just created should appear at the top.
   */
  refreshKey?: number;
  className?: string;
}

/**
 * The customers put into the book most recently, shown beside every onboarding
 * route so the retailer sees each add land. Reads the same b2c network endpoint
 * the directory list uses, so the four tabs share one source of truth.
 */
const OnboardedToday = ({
  limit = 4,
  refreshKey = 0,
  className,
}: OnboardedTodayProps) => {
  const { t } = useTranslation(["common"]);
  const { to } = useAppNav();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<NewlyAddedItem[]>([]);

  useEffect(() => {
    let alive = true;

    const fetchItems = async () => {
      setLoading(true);
      try {
        const result = await getNewlyAdded(limit);
        if (alive) setItems(result);
      } catch (error) {
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchItems();

    return () => {
      alive = false;
    };
  }, [limit, refreshKey]);

  return (
    <div
      className={clsx(
        "tw:overflow-hidden tw:rounded-xl tw:bg-white tw:ring-1 tw:ring-slate-100",
        className,
      )}
    >
      <div className="tw:flex tw:items-center tw:justify-between tw:border-b tw:border-slate-100 tw:px-4 tw:py-3">
        <span className="tw:text-sm tw:font-semibold tw:text-slate-800">
          Onboarded today
        </span>
        {!loading && items.length > 0 ? (
          <span className="tw:text-xs tw:text-slate-400">
            {items.length} new
          </span>
        ) : null}
      </div>

      {loading ? (
        // Placeholders at the real row height so the rail doesn't jump.
        [0, 1, 2].map((index) => (
          <div
            key={index}
            className="tw:flex tw:items-center tw:gap-3 tw:border-b tw:border-slate-100 tw:px-4 tw:py-3 tw:last:border-b-0"
          >
            <span className="tw:size-9 tw:shrink-0 tw:animate-pulse tw:rounded-full tw:bg-slate-100" />
            <span className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-1.5">
              <span className="tw:h-3 tw:w-2/3 tw:animate-pulse tw:rounded tw:bg-slate-100" />
              <span className="tw:h-2.5 tw:w-1/2 tw:animate-pulse tw:rounded tw:bg-slate-100" />
            </span>
          </div>
        ))
      ) : items.length === 0 ? (
        <p className="tw:px-4 tw:py-6 tw:text-center tw:text-xs tw:text-slate-500">
          {t("noDataFound")}
        </p>
      ) : (
        items.map((item, index) => (
          <button
            key={item.id || `${item.name}-${index}`}
            type="button"
            onClick={() => item.id && to(`/dashboard/network/view/b2c/${item.id}`)}
            className="tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:border-b tw:border-slate-100 tw:px-4 tw:py-3 tw:text-left tw:transition-colors tw:last:border-b-0 tw:hover:bg-slate-50"
          >
            <span
              className={clsx(
                "tw:flex tw:size-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-xs tw:font-bold",
                toneAt(index),
              )}
            >
              {item.code}
            </span>

            <span className="tw:min-w-0 tw:flex-1">
              <span className="tw:block tw:truncate tw:text-sm tw:font-semibold tw:leading-tight tw:text-slate-800">
                {item.name}
              </span>
              <span className="tw:mt-0.5 tw:block tw:truncate tw:text-xs tw:leading-tight tw:text-slate-500">
                {item.detail}
              </span>
            </span>

            <span className="tw:shrink-0 tw:rounded tw:bg-emerald-50 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:tracking-wide tw:text-emerald-700">
              NEW
            </span>
          </button>
        ))
      )}
    </div>
  );
};

export default OnboardedToday;
