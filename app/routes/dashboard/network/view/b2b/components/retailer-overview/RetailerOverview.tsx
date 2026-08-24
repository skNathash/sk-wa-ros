import clsx from "clsx";
import { differenceInCalendarMonths, format, isValid, parseISO } from "date-fns";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";

interface RetailerOverviewProps {
  franchise: Record<string, any>;
  className?: string;
}

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
 * The retailer's numbers at a glance — what they have bought, how often, what
 * is still owed and how reliably they repay. Reads straight off the franchise
 * record; fields the API does not send yet fall back to zero rather than
 * disappearing, so the card keeps its shape.
 */
const RetailerOverview = ({ franchise, className }: RetailerOverviewProps) => {
  const joinedRaw = franchise.createdAt;
  const joined = joinedRaw ? parseISO(String(joinedRaw)) : null;
  const months =
    joined && isValid(joined)
      ? Math.max(differenceInCalendarMonths(new Date(), joined), 1)
      : 0;

  const orders = franchise.orders || franchise.totalOrders || 0;
  const business = franchise.ltv || franchise.totalBusiness || 0;
  const outstanding = franchise.outstanding || franchise.totalDue || 0;
  const onTime = franchise.onTimePercent || 0;
  const onTimeOrders = Math.round((orders * onTime) / 100);

  const shopName = (franchise.name || "").split(" ")[0] || "Retailer";
  const avgOrder = orders ? Math.round(business / orders) : 0;
  const perMonth = months ? (orders / months).toFixed(1) : "-";

  return (
    <AppCard
      noPadding
      title={`${shopName}'s numbers`}
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
        <Stat
          label="Business"
          value={<Amount value={business} decimalPlaces={0} />}
          hint="lifetime value"
        />

        <Stat
          label="Orders"
          value={orders}
          hint={
            <>
              avg <Amount value={avgOrder} decimalPlaces={0} /> · {perMonth} / mo
            </>
          }
        />

        <Stat
          label="Outstanding"
          value={<Amount value={outstanding} decimalPlaces={0} />}
          hint="due to collect"
          valueClassName={
            outstanding ? "tw:text-red-600" : "tw:text-slate-900"
          }
        />

        <Stat
          label="On-time"
          value={`${onTime}%`}
          hint={`${onTimeOrders} of ${orders} paylater`}
          valueClassName="tw:text-emerald-600"
        />
      </div>
    </AppCard>
  );
};

export default RetailerOverview;
