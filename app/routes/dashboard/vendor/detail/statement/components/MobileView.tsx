import clsx from "clsx";
import { ArrowDownLeft, ArrowUpRight, ChevronRight } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";

interface StatementData {
  _id: string;
  paymentDate: string | Date;
  notes?: string;
  sourceReference?: string;
  statementType?: "credit" | "debit";
  amount?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  sourceType?: string;
  sourceRedirectionUrl?: string;
  sourceVariantColor?: string;
  _sourceTypeLbl?: string;
  [key: string]: any;
}

interface MobileViewProps {
  data: StatementData[];
  loading?: boolean;
  callback: (data: { action: string; data?: any }) => void;
}

const MobileView: React.FC<MobileViewProps> = ({ data, loading, callback }) => {
  if (loading) {
    return (
      <div className="tw:space-y-3">
        {[...Array(5)].map((_, idx) => (
          <div key={idx} className="tw:animate-pulse">
            <div className="tw:bg-gray-200 tw:h-28 tw:rounded-2xl"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <NoData />;
  }

  return (
    <div className="tw:space-y-3">
      {data.map((row) => {
        const isCredit = row.paymentType === "credit";
        const isPayment = row.sourceType === "PAYMENT";
        const transactionDirection = isCredit ? "Credit" : "Debit";

        const openPayment = () => {
          if (isPayment) {
            callback({ action: "viewPayment", data: row });
          }
        };

        return (
          <div
            key={row._id}
            className={clsx(
              "tw:overflow-hidden tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:transition-colors",
              {
                "tw:cursor-pointer tw:active:tw:bg-slate-50 sm:hover:tw:bg-slate-50":
                  isPayment,
              },
            )}
            onClick={openPayment}
            onKeyDown={(event) => {
              if (isPayment && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                openPayment();
              }
            }}
            role={isPayment ? "button" : undefined}
            tabIndex={isPayment ? 0 : undefined}
          >
            <div className="tw:p-4">
              <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
                <div className="tw:min-w-0 tw:space-y-1.5">
                  <div className="tw:flex tw:items-center tw:gap-2 tw:text-xs tw:text-slate-500">
                    <span className="tw:font-medium tw:text-slate-700">
                      <DateFormat
                        value={row.transactionDate}
                        formatStr="dd MMM yyyy"
                      />
                    </span>
                    <span aria-hidden="true" className="tw:text-slate-300">
                      •
                    </span>
                    <DateFormat value={row.transactionDate} formatStr="hh:mm a" />
                  </div>
                  {row._sourceTypeLbl ? (
                    <AppBadge variant={(row.sourceVariantColor as any) || "primary"}>
                      {row._sourceTypeLbl}
                    </AppBadge>
                  ) : null}
                </div>

                <div className="tw:flex tw:items-center tw:gap-2 tw:shrink-0">
                  <div
                    className={clsx(
                      "tw:flex tw:items-center tw:gap-1.5 tw:text-right",
                      isCredit ? "tw:text-green-700" : "tw:text-rose-700",
                    )}
                  >
                    <span
                      className={clsx(
                        "tw:flex tw:size-7 tw:items-center tw:justify-center tw:rounded-full",
                        isCredit ? "tw:bg-green-100" : "tw:bg-rose-100",
                      )}
                      aria-label={transactionDirection}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="tw:size-3.5" />
                      ) : (
                        <ArrowUpRight className="tw:size-3.5" />
                      )}
                    </span>
                    <div>
                      <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide">
                        {transactionDirection}
                      </div>
                      <div className="tw:text-sm tw:font-bold tw:tabular-nums">
                        {isCredit ? "+" : "-"}
                        <Amount value={row.amount ?? 0} decimalPlaces={2} />
                      </div>
                    </div>
                  </div>
                  {isPayment ? (
                    <ChevronRight
                      className="tw:size-4 tw:text-slate-400"
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
              </div>

              <div className="tw:mt-3 tw:text-sm tw:font-semibold tw:leading-5 tw:text-slate-800">
                {row.description || "-"}
              </div>

              <div className="tw:mt-2 tw:flex tw:items-center tw:gap-2 tw:text-xs tw:min-w-0">
                <span className="tw:shrink-0 tw:text-slate-500">Reference</span>
                {row.sourceRedirectionUrl && row.sourceRedirectionUrl !== "#" ? (
                  <AppLink
                    href={row.sourceRedirectionUrl}
                    asLink={true}
                    className="tw:min-w-0 tw:truncate tw:font-mono tw:text-slate-700 tw:underline tw:decoration-slate-300 tw:underline-offset-2"
                    onClick={(event: React.MouseEvent) => event.stopPropagation()}
                  >
                    {row.sourceReference || "-"}
                  </AppLink>
                ) : (
                  <span className="tw:min-w-0 tw:truncate tw:font-mono tw:text-slate-700">
                    {row.sourceReference || "-"}
                  </span>
                )}
              </div>
            </div>

            <div className="tw:grid tw:grid-cols-2 tw:divide-x tw:divide-slate-200 tw:border-t tw:border-slate-200 tw:bg-slate-50/70">
              <div className="tw:px-4 tw:py-2.5">
                <div className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-slate-500">
                  Opening balance
                </div>
                <div className="tw:mt-0.5 tw:text-sm tw:font-semibold tw:tabular-nums tw:text-slate-700">
                  <Amount value={row.balanceBefore ?? 0} decimalPlaces={2} />
                </div>
              </div>
              <div className="tw:px-4 tw:py-2.5">
                <div className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-slate-500">
                  Closing balance
                </div>
                <div className="tw:mt-0.5 tw:text-sm tw:font-bold tw:tabular-nums tw:text-slate-900">
                  <Amount value={row.outstandingAmount ?? 0} decimalPlaces={2} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MobileView;
