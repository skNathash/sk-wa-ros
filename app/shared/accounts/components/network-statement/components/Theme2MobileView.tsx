import clsx from "clsx";
import { format, isValid, parseISO } from "date-fns";
import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import { Skeleton } from "~/components/ui/skeleton";

interface StatementData {
  _id: string;
  paymentDate: string | Date;
  transactionDate?: string | Date;
  notes?: string;
  description?: string;
  sourceReference?: string;
  statementType?: "credit" | "debit";
  paymentType?: "credit" | "debit";
  amount?: number;
  balanceAfter?: number;
  outstandingAmount?: number;
  sourceType?: string;
  _sourceTypeLbl?: string;
  _sourceTypeShortLbl?: string;
  sourceVariantColor?: string;
  sourceRedirectionUrl?: string;
  [key: string]: any;
}

interface Theme2MobileViewProps {
  loading?: boolean;
  data: StatementData[];
  callback?: (payload: { action: string; data?: any }) => void;
}

// Soft pastel chip tints per source variant colour, echoing the ledger mock
// (violet PO/paylater, amber payment, teal credit).
const CHIP_TINTS: Record<string, string> = {
  primary: "tw:bg-violet-100 tw:text-violet-700",
  success: "tw:bg-emerald-100 tw:text-emerald-700",
  warning: "tw:bg-orange-100 tw:text-orange-600",
  danger: "tw:bg-rose-100 tw:text-rose-700",
  destructive: "tw:bg-rose-100 tw:text-rose-700",
  default: "tw:bg-violet-100 tw:text-violet-700",
};

const toDate = (value?: string | Date) =>
  typeof value === "string" ? parseISO(value) : value;

const Theme2MobileView: React.FC<Theme2MobileViewProps> = ({
  loading,
  data,
  callback,
}) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="app-bleed-x tw:divide-y tw:divide-border/60 tw:bg-white">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={`skeleton-${idx}`} className="tw:px-4 tw:py-3.5">
            <Skeleton className="tw:h-20 tw:w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <NoData />;
  }

  return (
    <div className="app-bleed-x tw:divide-y tw:divide-border/60 tw:bg-white">
      {data.map((row, idx) => {
        const rowId = row._id || `row-${idx}`;
        const date = toDate(row.transactionDate || row.paymentDate);
        const paymentType = row.paymentType || row.statementType;
        const isCredit = paymentType === "credit";
        const description = row.description || row.notes || "-";
        const balance = row.outstandingAmount ?? row.balanceAfter ?? 0;
        const chipLabel = (
          row._sourceTypeLbl ||
          row._sourceTypeShortLbl ||
          row.sourceType ||
          ""
        ).toUpperCase();
        const chipTint =
          CHIP_TINTS[row.sourceVariantColor || "default"] ||
          CHIP_TINTS.default;

        return (
          <AppLink
            key={rowId}
            className="tw:block"
            noUnderline
            asLink
            href={row.sourceRedirectionUrl}
          >
            <div
              onClick={(e) => {
                if (row.sourceType === "PAYMENT") {
                  e.preventDefault();
                  callback && callback({ action: "viewPayment", data: row });
                }
              }}
              className="tw:flex tw:items-start tw:gap-3 tw:bg-white tw:px-4 tw:py-3.5"
            >
              {/* Date rail — day / month / time */}
              <div className="tw:flex tw:w-12 tw:shrink-0 tw:flex-col tw:items-center tw:pt-0.5">
                <span className="tw:text-xl tw:font-bold tw:leading-none tw:text-gray-800">
                  {date && isValid(date) ? format(date, "dd") : "--"}
                </span>
                <span className="tw:mt-0.5 tw:text-xs tw:font-medium tw:text-gray-400">
                  {date && isValid(date) ? format(date, "MMM") : ""}
                </span>
                {date && isValid(date) ? (
                  <span className="tw:mt-1 tw:text-[10px] tw:leading-tight tw:text-gray-400">
                    {format(date, "h:mm a")}
                  </span>
                ) : null}
              </div>

              {/* Middle — type chip, description, reference */}
              <div className="tw:min-w-0 tw:flex-1">
                {chipLabel ? (
                  <span
                    className={clsx(
                      "tw:inline-block tw:rounded tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:tracking-wide",
                      chipTint,
                    )}
                  >
                    {chipLabel}
                  </span>
                ) : null}

                <div className="tw:mt-1.5 tw:text-sm tw:leading-snug tw:text-gray-800">
                  {description}
                </div>

                {row.sourceReference ? (
                  <div className="tw:mt-1.5 tw:text-xs tw:text-gray-400">
                    {row.sourceReference}
                  </div>
                ) : null}
              </div>

              {/* Right — signed amount over running balance */}
              <div className="tw:flex tw:shrink-0 tw:flex-col tw:items-end tw:gap-1.5 tw:pt-0.5">
                {row.amount ? (
                  <div
                    className={clsx(
                      "tw:flex tw:items-baseline tw:gap-0.5 tw:text-sm tw:font-bold",
                      isCredit
                        ? "tw:text-teal-700 wa-amt-in"
                        : "tw:text-red-600 wa-amt-out",
                    )}
                  >
                    <span>{isCredit ? "+" : "-"}</span>
                    <Amount value={row.amount} decimalPlaces={0} />
                  </div>
                ) : (
                  <span className="tw:text-sm tw:text-gray-400">–</span>
                )}
                <div className="tw:flex tw:items-baseline tw:gap-1 tw:text-xs tw:text-gray-400">
                  <span>{t("bal", "bal")}</span>
                  <Amount value={balance} decimalPlaces={0} />
                </div>
              </div>
            </div>
          </AppLink>
        );
      })}
    </div>
  );
};

export default Theme2MobileView;
