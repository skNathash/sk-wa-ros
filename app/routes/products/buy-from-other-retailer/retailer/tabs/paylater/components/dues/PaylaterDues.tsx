import clsx from "clsx";
import { differenceInCalendarDays } from "date-fns";
import { CalendarClock } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import AppProgress from "~/components/core/progress/AppProgress";
import DateFormat from "~/components/core/date/DateFormat";
import { utilisationTone, type PaylaterWallet } from "../../helper";

type PaylaterDuesProps = {
  wallet: PaylaterWallet;
  className?: string;
};

/**
 * What is owed back to this seller and when.
 *
 * The wallet feed carries one due date for the whole balance
 * (`validityEndDate`) — there is no per-order repayment schedule on the
 * endpoint, so the card states the balance, its date and how far past it we
 * are, and leaves the order-by-order detail to the statement below.
 */
const PaylaterDues = ({ wallet, className }: PaylaterDuesProps) => {
  const dueDate = wallet.validityEndDate
    ? new Date(wallet.validityEndDate)
    : null;

  const daysLate =
    wallet.isOverdue && dueDate
      ? Math.max(0, differenceInCalendarDays(new Date(), dueDate))
      : 0;

  const tone = wallet.isOverdue
    ? {
        chip: "tw:bg-rose-100 tw:text-rose-700",
        icon: "tw:bg-rose-100 tw:text-rose-600",
        amount: "tw:text-rose-600",
        label: "OVERDUE",
      }
    : wallet.isDueToday
      ? {
          chip: "tw:bg-amber-100 tw:text-amber-700",
          icon: "tw:bg-amber-100 tw:text-amber-600",
          amount: "tw:text-slate-900",
          label: "DUE TODAY",
        }
      : {
          chip: "tw:bg-emerald-100 tw:text-emerald-700",
          icon: "tw:bg-emerald-100 tw:text-emerald-600",
          amount: "tw:text-slate-900",
          label: "ON TRACK",
        };

  return (
    <AppCard className={clsx("tw:h-full", className)} noOverflow>
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
        <h3 className="tw:text-base tw:font-bold tw:text-slate-900">
          Amount payable
        </h3>
        <span
          className={clsx(
            "tw:rounded-full tw:px-2 tw:py-0.5 tw:text-[9px] tw:font-bold tw:uppercase tw:tracking-wider",
            tone.chip,
          )}
        >
          {tone.label}
        </span>
      </div>

      <div className="tw:mt-4 tw:flex tw:items-center tw:gap-3">
        <div
          className={clsx(
            "tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl",
            tone.icon,
          )}
        >
          <CalendarClock className="tw:h-5 tw:w-5" />
        </div>

        <div className="tw:min-w-0">
          <Amount
            value={wallet.creditUsed}
            decimalPlaces={0}
            className={clsx(
              "tw:text-2xl tw:font-bold tw:whitespace-nowrap",
              tone.amount,
            )}
          />
          <div className="tw:mt-0.5 tw:text-xs tw:text-slate-500">
            {dueDate ? (
              <>
                Due <DateFormat value={dueDate} formatStr="dd MMM yyyy" />
                {daysLate > 0 ? (
                  <span className="tw:text-rose-600">
                    {" "}
                    · {daysLate} {daysLate === 1 ? "day" : "days"} late
                  </span>
                ) : wallet.expiryStatus ? (
                  <> · {wallet.expiryStatus}</>
                ) : null}
              </>
            ) : (
              "No due date on the wallet"
            )}
          </div>
        </div>
      </div>

      <div className="tw:mt-4">
        <AppProgress
          value={wallet.utilisedPercentage}
          color={utilisationTone(wallet.utilisedPercentage)}
        />
        <div className="tw:mt-2 tw:flex tw:items-center tw:justify-between tw:text-xs tw:text-slate-500">
          <span>
            Used{" "}
            <Amount
              value={wallet.creditUsed}
              decimalPlaces={0}
              className="tw:font-semibold tw:text-slate-700"
            />{" "}
            of{" "}
            <Amount
              value={wallet.creditLimit}
              decimalPlaces={0}
              className="tw:font-semibold tw:text-slate-700"
            />
          </span>
          <span className="tw:font-semibold tw:text-slate-700">
            <Amount value={wallet.creditAvailable} decimalPlaces={0} /> left
          </span>
        </div>
      </div>
    </AppCard>
  );
};

export default PaylaterDues;
