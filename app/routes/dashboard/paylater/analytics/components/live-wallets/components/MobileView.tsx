import clsx from "clsx";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import {
  avatarToneAt,
  initialsOf,
  tierToneOf,
  type LiveWalletRow,
} from "../helper";

interface MobileViewProps {
  data: LiveWalletRow[];
  loading: boolean;
}

/**
 * Live wallets, mobile — one stacked card per wallet: avatar and name with the
 * loyalty tier beside it, a hot/available flag, the drawn share of the limit as
 * a full-width bar, then the amounts, billing activity and the due state.
 */
const MobileView = ({ data, loading }: MobileViewProps) => {
  if (loading)
    return (
      <div className="tw:flex tw:justify-center tw:py-10">
        <AppSpinner className="tw:h-6 tw:w-6" />
      </div>
    );

  if (!data.length) return <NoData />;

  return (
    <div className="tw:divide-y tw:divide-slate-100">
      {data.map((row, index) => (
        <div key={row.id} className="tw:flex tw:items-start tw:gap-3 tw:px-4 tw:py-3.5">
          {/* Avatar */}
          <div
            className={clsx(
              "tw:flex tw:h-11 tw:w-11 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-sm tw:font-bold tw:text-white",
              avatarToneAt(index),
            )}
          >
            {initialsOf(row.name)}
          </div>

          <div className="tw:min-w-0 tw:flex-1">
            {/* Name + tier + hot/available flag */}
            <div className="tw:flex tw:items-center tw:gap-2">
              <AppLink
                asLink
                href={row.href}
                className="tw:truncate tw:text-base tw:font-semibold tw:text-slate-800"
              >
                {row.name}
              </AppLink>

              {row.tier && (
                <span
                  className={clsx(
                    "tw:shrink-0 tw:rounded tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide",
                    tierToneOf(row.tier),
                  )}
                >
                  {row.tier}
                </span>
              )}

              {row.isOverdue ? (
                <span className="tw:shrink-0 tw:rounded tw:bg-rose-100 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-rose-600">
                  Hot
                </span>
              ) : row.isAvailable ? (
                <span className="tw:shrink-0 tw:rounded tw:bg-emerald-100 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-emerald-700">
                  Avail
                </span>
              ) : null}
            </div>

            {/* Drawn share of the limit */}
            <div className="tw:mt-2 tw:h-1.5 tw:w-full tw:overflow-hidden tw:rounded-full tw:bg-slate-100">
              <div
                className={clsx(
                  "tw:h-full tw:rounded-full",
                  row.isOverdue ? "tw:bg-rose-500" : "tw:bg-violet-600",
                )}
                style={{ width: `${row.usage}%` }}
              />
            </div>

            {/* Amounts beside the due state */}
            <div className="tw:mt-1.5 tw:flex tw:items-center tw:justify-between tw:gap-2">
              <div className="tw:text-xs tw:text-slate-500">
                <Amount
                  value={row.used}
                  decimalPlaces={0}
                  className="tw:font-medium tw:text-slate-700"
                />
                <span className="tw:mx-1">/</span>
                <Amount value={row.limit} decimalPlaces={0} />
              </div>

              <div className="tw:shrink-0 tw:text-xs">
                {row.isOverdue ? (
                  <span className="tw:text-rose-500">
                    Overdue ·{" "}
                    <span className="tw:font-semibold">{row.overdueDays}d</span>
                  </span>
                ) : row.isDueToday ? (
                  <span className="tw:font-semibold tw:text-amber-600">
                    Due today
                  </span>
                ) : row.dueDate ? (
                  <span className="tw:text-slate-500">
                    Due{" "}
                    <DateFormat
                      value={row.dueDate}
                      formatStr="dd MMM"
                      className="tw:font-semibold tw:text-slate-700"
                    />
                  </span>
                ) : (
                  <span className="tw:text-slate-400">
                    {row.isAvailable ? "Available" : "--"}
                  </span>
                )}
              </div>
            </div>

            {/* Billing activity */}
            {row.bills !== null && (
              <div className="tw:mt-1 tw:text-[11px] tw:text-slate-400">
                {row.bills} bills · last{" "}
                {row.lastBillDate ? (
                  <DateFormat value={row.lastBillDate} formatStr="dd MMM" />
                ) : (
                  "—"
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileView;
