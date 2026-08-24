import React from "react";
import { format } from "date-fns";
import Amount from "~/components/core/amount/Amount";
import { Skeleton } from "~/components/ui/skeleton";
import type { StatementSummaryData } from "../helper";

/**
 * Statement summary block.
 *
 * `closing` is the real current outstanding balance (sourced from the accounts
 * summary). Purchases / paid are month-to-date totals from the statements
 * aggregation, and opening is derived by walking the closing balance back over
 * that movement. Notes stays a placeholder until its data point is defined.
 */
interface SummaryProps {
  summary: any[];
  statementSummary: StatementSummaryData;
  recordPaymentAction?: React.ReactNode;
}

const Summary: React.FC<SummaryProps> = ({
  summary,
  statementSummary,
  recordPaymentAction,
}) => {
  const closing = summary?.[2]?.value ?? 0;

  if (statementSummary.loading) {
    return <Skeleton className="tw:h-36 tw:rounded-2xl" />;
  }

  return (
    <div>
      <div className="tw:relative tw:overflow-hidden tw:rounded-2xl tw:border-t-4 tw:border-red-400 tw:bg-white tw:shadow-sm tw:p-4">
        {/* Opening → Closing header */}
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
          <div className="tw:flex tw:flex-col">
            <span className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
              Opening · {format(statementSummary.periodStart, "d MMM")}
            </span>
            <span className="tw:text-lg tw:font-bold tw:text-slate-700">
              <Amount value={statementSummary.opening} decimalPlaces={0} />
            </span>
          </div>

          <span className="tw:text-slate-300">→</span>

          <div className="tw:flex tw:flex-col tw:items-end">
            <span className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
              Closing · Today
            </span>
            <span className="tw:text-2xl tw:font-bold">
              <Amount
                value={closing}
                decimalPlaces={0}
                className={
                  closing > 0 ? "tw:text-red-500" : "tw:text-green-600"
                }
              />
            </span>
          </div>
        </div>

        {/* Purchases / Paid / Notes tiles */}
        <div className="tw:grid tw:grid-cols-3 tw:gap-2 tw:mt-4">
          <div className="tw:rounded-xl tw:bg-violet-50 tw:px-3 tw:py-2">
            <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-violet-500">
              Purchases
            </div>
            <div className="tw:text-sm tw:font-bold tw:text-violet-700">
              <Amount value={statementSummary.purchases} decimalPlaces={0} />
            </div>
          </div>

          <div className="tw:rounded-xl tw:bg-emerald-50 tw:px-3 tw:py-2">
            <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-emerald-500">
              Paid
            </div>
            <div className="tw:text-sm tw:font-bold tw:text-emerald-700">
              <Amount value={statementSummary.paid} decimalPlaces={0} />
            </div>
          </div>

          <div className="tw:rounded-xl tw:bg-rose-50 tw:px-3 tw:py-2">
            <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-rose-500">
              Notes
            </div>
            <div className="tw:text-sm tw:font-bold tw:text-rose-600">
              <Amount value={statementSummary.notes} decimalPlaces={0} />
            </div>
          </div>
        </div>

        {recordPaymentAction && (
          <div className="tw:mt-3 tw:flex tw:justify-end tw:border-t tw:border-border/70 tw:pt-3">
            {recordPaymentAction}
          </div>
        )}
      </div>
    </div>
  );
};

export default Summary;
