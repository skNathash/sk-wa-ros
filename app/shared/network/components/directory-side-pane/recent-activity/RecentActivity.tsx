import clsx from "clsx";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useAppNav from "~/hooks/useAppNav";
import {
  ACTIVITY_TONE,
  formatActivityTime,
  getRecentActivityFor,
  type DirectoryNetwork,
  type RecentActivityItem,
} from "./helper";

interface RecentActivityProps {
  /** How many rows to show. Defaults to 6. */
  limit?: number;
  /** Section heading. Pass null to drop it. */
  title?: string | null;
  /** Which book to read — b2c customers (default) or b2b retailers. */
  network?: DirectoryNetwork;
  /** Intercept a row tap; without it the row opens the customer. */
  onSelect?: (item: RecentActivityItem) => void;
  className?: string;
}

/**
 * What the customer book has been doing lately — bills taken, paylater dues
 * running, customers gone quiet and fresh signups — as a dense flat feed for
 * the directory side pane. Fetches from the b2c network API itself so the pane
 * can drop it in without wiring up data.
 */
const RecentActivity = ({
  limit = 6,
  title = "Recent Activity",
  network = "b2c",
  onSelect,
  className,
}: RecentActivityProps) => {
  const { t } = useTranslation(["common"]);
  const { to } = useAppNav();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<RecentActivityItem[]>([]);

  useEffect(() => {
    let alive = true;

    const fetchActivity = async () => {
      setLoading(true);
      try {
        const result = await getRecentActivityFor(network, limit);
        if (alive) setItems(result);
      } catch (error) {
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchActivity();

    return () => {
      alive = false;
    };
  }, [limit, network]);

  const handleSelect = (item: RecentActivityItem) => {
    if (onSelect) {
      onSelect(item);
      return;
    }
    if (item.id) to(`/dashboard/network/view/${network}/${item.id}`);
  };

  return (
    <div className={className}>
      {title ? (
        <p
          className="tw:px-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {title}
        </p>
      ) : null}

      <div className={clsx(title && "tw:mt-2")}>
        {loading ? (
          // Placeholders at the real row height so the pane doesn't jump.
          [0, 1, 2].map((index) => (
            <div
              key={index}
              className="tw:flex tw:items-center tw:gap-3 tw:border-b tw:border-slate-100 tw:px-1 tw:py-2.5 tw:last:border-b-0"
            >
              <span className="tw:size-10 tw:shrink-0 tw:animate-pulse tw:rounded-lg tw:bg-slate-100" />
              <span className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-1.5">
                <span className="tw:h-3 tw:w-2/3 tw:animate-pulse tw:rounded tw:bg-slate-100" />
                <span className="tw:h-2.5 tw:w-1/2 tw:animate-pulse tw:rounded tw:bg-slate-100" />
              </span>
              <span className="tw:h-2.5 tw:w-14 tw:shrink-0 tw:animate-pulse tw:rounded tw:bg-slate-100" />
            </div>
          ))
        ) : items.length === 0 ? (
          <p className="tw:px-1 tw:py-4 tw:text-center tw:text-xs tw:text-slate-500">
            {t("noActivityFound")}
          </p>
        ) : (
          items.map((item, index) => (
            <button
              key={item.id || `${item.name}-${index}`}
              type="button"
              onClick={() => handleSelect(item)}
              className="tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:border-b tw:border-slate-100 tw:px-1 tw:py-2.5 tw:text-left tw:transition-colors tw:last:border-b-0 tw:hover:bg-slate-50"
            >
              <span
                className={clsx(
                  "tw:flex tw:size-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:text-xs tw:font-bold",
                  ACTIVITY_TONE[item.kind],
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

              <span className="tw:shrink-0 tw:text-[11px] tw:text-slate-400">
                {formatActivityTime(item.at)}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
