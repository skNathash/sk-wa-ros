import clsx from "clsx";
import { ChevronRight, Phone } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import {
  getInitial,
  getTint,
  TYPE_META,
  type PortfolioRow,
  type PortfolioType,
} from "../helper";

type Props = {
  data: PortfolioRow[];
  loading: boolean;
  type: PortfolioType;
  callback?: (payload: { action: string; data: PortfolioRow }) => void;
};

const MobileView = ({ data, loading, type, callback }: Props) => {
  if (loading) {
    return (
      <div className="tw:text-center tw:py-4">
        <AppSpinner />
      </div>
    );
  }

  if (!data.length) return <NoData />;

  return (
    /* `app-bleed-x` pulls the list out of the page gutter on theme-2 mobile so
       the rows run edge to edge as one flush block — no gaps, no corners. The
       card grid comes back from md up. */
    <div className="app-bleed-x tw:bg-card tw:divide-y tw:divide-border tw:md:grid tw:md:grid-cols-2 tw:md:gap-3 tw:md:divide-y-0 tw:md:bg-transparent">
      {data.map((row) => (
        <div
          key={row._id}
          className="tw:bg-card tw:md:rounded-xl tw:md:border tw:md:border-border tw:md:shadow-sm"
        >
          <div className="tw:flex tw:items-center tw:gap-3 tw:px-4 tw:py-3">
            <div
              className={clsx(
                "tw:shrink-0 tw:w-11 tw:h-11 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:text-white tw:text-base tw:font-semibold",
                getTint(row.name),
              )}
            >
              {getInitial(row.name)}
            </div>

            <div className="tw:flex-1 tw:min-w-0">
              <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
                <AppLink
                  asLink
                  href={row.userRedirectionLink}
                  className="tw:text-base tw:font-semibold tw:truncate"
                  showLinkColor
                >
                  {row.name}
                </AppLink>
                <AppBadge
                  variant={row.userCategory === "B2C" ? "primary" : "secondary"}
                >
                  {row.userCategory}
                </AppBadge>
              </div>

              {row.mobile && (
                <AppLink
                  asLink
                  href={`tel:${row.mobile}`}
                  className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500 tw:mt-0.5"
                >
                  <Phone size={12} />
                  {row.mobile}
                </AppLink>
              )}

              <div className="tw:flex tw:items-end tw:justify-between tw:gap-2 tw:mt-2">
                <div className="tw:min-w-0">
                  <div className="tw:text-[11px] tw:uppercase tw:tracking-wider tw:text-slate-400">
                    {TYPE_META[type].amountLabel}
                  </div>
                  <Amount
                    value={row.amount}
                    decimalPlaces={2}
                    className={clsx(
                      "tw:font-semibold",
                      TYPE_META[type].amountClassName,
                    )}
                  />
                </div>

                {row.dueLabel && (
                  <span
                    className={clsx(
                      "tw:text-xs",
                      row.isOverdue ? "tw:text-rose-500" : "tw:text-gray-500",
                    )}
                  >
                    {row.dueLabel}
                  </span>
                )}
              </div>

              <div className="tw:mt-2">
                <div className="tw:flex tw:justify-between tw:text-[11px] tw:text-gray-500 tw:mb-1">
                  <span>
                    <Amount value={row.used} decimalPlaces={0} /> of{" "}
                    <Amount value={row.limit} decimalPlaces={0} />
                  </span>
                  <span>{row.usagePercent}%</span>
                </div>
                <div className="tw:h-1.5 tw:overflow-hidden tw:rounded-full tw:bg-slate-100">
                  <div
                    className={clsx(
                      "tw:h-full tw:rounded-full",
                      row.isOverdue ? "tw:bg-rose-500" : "tw:bg-violet-600",
                    )}
                    style={{ width: `${Math.min(row.usagePercent, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              className="tw:shrink-0 tw:text-gray-400"
              onClick={() => callback?.({ action: "view", data: row })}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileView;
