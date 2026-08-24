import clsx from "clsx";
import { differenceInCalendarMonths, format, isValid, parseISO } from "date-fns";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import { useIsMobile } from "~/hooks/use-mobile";
import type { Customer } from "../Overview";

interface CustomerOverviewProps {
  customer: Customer;
  className?: string;
}

/** One number the card shows, rendered by either template. */
type OverviewStat = {
  key: string;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  /** Colour the value carries on the desktop card. */
  valueClassName: string;
  /** Value colour on the phone tile, when it reads stronger than the card's. */
  tileValueClassName?: string;
  /** Accent border the phone tile picks up — the rail reads as a colour strip. */
  tileClassName: string;
};

const Stat = ({
  label,
  value,
  hint,
  valueClassName = "tw:text-slate-900",
  hintClassName = "tw:text-slate-500",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  valueClassName?: string;
  hintClassName?: string;
}) => (
  <div className="tw:min-w-0">
    <p className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400">
      {label}
    </p>
    <p
      className={`tw:mt-0.5 tw:truncate tw:text-xl tw:font-bold tw:leading-tight ${valueClassName}`}
    >
      {value}
    </p>
    {hint ? (
      <p className={`tw:mt-0.5 tw:truncate tw:text-[11px] ${hintClassName}`}>
        {hint}
      </p>
    ) : null}
  </div>
);

/**
 * The customer's numbers at a glance — what they're worth, how often they buy,
 * what they can redeem and how reliably they repay. Coins come from the loyalty
 * API; the rest read from the customer record once those endpoints send them.
 *
 * Two templates off the same stats: desktop keeps the titled card with the
 * four-up grid, phones swap it for a 2x2 grid of accent-bordered tiles.
 */
const CustomerOverview = ({ customer, className }: CustomerOverviewProps) => {
  const isMobile = useIsMobile();

  const joined = customer.dateOfRegistration
    ? parseISO(customer.dateOfRegistration)
    : null;
  const months =
    joined && isValid(joined)
      ? Math.max(differenceInCalendarMonths(new Date(), joined), 1)
      : 0;

  const record = customer as Record<string, any>;
  const bills = record.bills || 0;
  const ltv = record.ltv || 0;
  const onTime = record.onTimePercent || 0;
  const onTimeBills = Math.round((bills * onTime) / 100);

  const firstName = (customer.name || "").split(" ")[0] || "Customer";
  const avgBill = bills ? Math.round(ltv / bills) : 0;
  const perMonth = months ? (bills / months).toFixed(1) : "-";

  const stats: OverviewStat[] = [
    {
      key: "ltv",
      label: "LTV",
      value: <Amount value={ltv} decimalPlaces={0} />,
      hint: "lifetime value",
      valueClassName: "tw:text-slate-900",
      tileValueClassName: "tw:text-teal-700",
      tileClassName: "tw:border-teal-500",
    },
    {
      key: "bills",
      label: "Bills",
      value: bills,
      hint: (
        <>
          avg <Amount value={avgBill} decimalPlaces={0} /> · {perMonth} / mo
        </>
      ),
      valueClassName: "tw:text-slate-900",
      tileClassName: "tw:border-slate-200",
    },
    {
      key: "coins",
      label: "Coins",
      value: customer.points ?? 0,
      hint: "avail to redeem",
      valueClassName: "tw:text-amber-500",
      tileClassName: "tw:border-amber-400",
    },
    {
      key: "onTime",
      label: "On-time",
      value: `${onTime}%`,
      hint: `${onTimeBills} of ${bills} paylater`,
      valueClassName: "tw:text-emerald-600",
      tileClassName: "tw:border-slate-200",
    },
  ];

  if (isMobile) {
    return (
      <div className={clsx("tw:grid tw:grid-cols-2 tw:gap-2.5", className)}>
        {stats.map((stat) => (
          <AppCard
            key={stat.key}
            noPadding
            bodyClassName="tw:px-3 tw:py-2.5"
            className={clsx("tw:mb-0 tw:h-full tw:border", stat.tileClassName)}
          >
            <span className="tw:block tw:text-[9px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500 tw:line-clamp-1">
              {stat.label}
            </span>

            <span
              className={clsx(
                "tw:mt-0.5 tw:block tw:text-xl tw:font-bold tw:leading-tight",
                stat.tileValueClassName || stat.valueClassName,
              )}
            >
              {stat.value}
            </span>

            {stat.hint ? (
              <span className="tw:mt-1 tw:block tw:text-[10px] tw:text-gray-500 tw:line-clamp-1">
                {stat.hint}
              </span>
            ) : null}
          </AppCard>
        ))}
      </div>
    );
  }

  return (
    <AppCard
      noPadding
      title={`${firstName}'s numbers`}
      subtitle={
        joined && isValid(joined)
          ? `since ${format(joined, "MMM yyyy")} · ${months} months`
          : undefined
      }
      headerClassName="tw:flex tw:flex-row tw:items-center tw:justify-between tw:gap-2 tw:border-b tw:border-slate-100 tw:px-4 tw:py-2.5"
      bodyClassName="tw:px-4 tw:py-3"
      className={clsx("tw:gap-0", className)}
    >
      <div className="tw:grid tw:grid-cols-2 tw:gap-x-3 tw:gap-y-3 tw:sm:grid-cols-4">
        {stats.map((stat) => (
          <Stat
            key={stat.key}
            label={stat.label}
            value={stat.value}
            hint={stat.hint}
            valueClassName={stat.valueClassName}
          />
        ))}
      </div>
    </AppCard>
  );
};

export default CustomerOverview;
