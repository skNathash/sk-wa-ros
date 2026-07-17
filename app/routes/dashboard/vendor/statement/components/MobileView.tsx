import clsx from "clsx";
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
      <div className="tw:space-y-4 tw:mx-4">
        {[...Array(5)].map((_, idx) => (
          <div key={idx} className="tw:animate-pulse">
            <div className="tw:bg-gray-200 tw:h-24 tw:rounded-lg"></div>
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
      {data.map((row) => (
        <div
          key={row._id}
          className={clsx(
            "tw:bg-white tw:rounded-lg tw:shadow-sm tw:p-4 tw:flex tw:flex-col tw:gap-2",
            {
              "tw:cursor-pointer": row.sourceType === "PAYMENT",
            }
          )}
          onClick={() => callback({ action: "viewPayment", data: row })}
        >
          <div className="tw:flex tw:items-center tw:justify-between">
            <span className="tw:text-xs tw:text-slate-600">
              <DateFormat
                value={row.transactionDate}
                formatStr="dd MMM yyyy • hh:mm a"
              />
            </span>
            <span
              className="tw:text-[10px] tw:px-2 tw:py-0.5 tw:rounded tw:font-medium"
              style={{
                backgroundColor:
                  row.paymentType === "credit" ? "#ecfdf5" : "#fef2f2",
                color: row.paymentType === "credit" ? "#059669" : "#dc2626",
              }}
            >
              {row.paymentType?.toUpperCase() || "-"}
            </span>
          </div>

          {row._sourceTypeLbl ? (
            <div className="tw:mt-1">
              <AppBadge variant={(row.sourceVariantColor as any) || "primary"}>
                {row._sourceTypeLbl}
              </AppBadge>
            </div>
          ) : null}

          <div className="tw:text-sm tw:text-gray-700">
            {row.description || "-"}
          </div>

          <div className="tw:text-sm tw:text-gray-500">
            Reference ID:{" "}
            {row.sourceRedirectionUrl && row.sourceRedirectionUrl !== "#" ? (
              <AppLink
                href={row.sourceRedirectionUrl}
                asLink={true}
                className="tw:text-blue-600 hover:tw:text-blue-800"
              >
                {row.sourceReference || "-"}
              </AppLink>
            ) : (
              row.sourceReference || "-"
            )}
          </div>

          <div className="tw:grid tw:grid-cols-3 tw:gap-3 tw:mt-2">
            <div className="tw:bg-gray-50 tw:rounded tw:p-2">
              <div className="tw:text-[10px] tw:text-gray-400">Opening</div>
              <div className="tw:text-sm tw:text-gray-600 tw-font-medium">
                <Amount value={row.balanceBefore ?? 0} decimalPlaces={2} />
              </div>
            </div>

            <div className="tw:bg-gray-50 tw:rounded tw:p-2">
              <div className="tw:text-[10px] tw:text-gray-400">Amount</div>
              <div
                className={`tw-text-sm tw-font-medium ${
                  row.paymentType === "credit"
                    ? "tw-text-green-600"
                    : "tw-text-red-600"
                }`}
              >
                <Amount value={row.amount ?? 0} decimalPlaces={2} />
              </div>
            </div>

            <div className="tw:bg-gray-50 tw:rounded tw:p-2">
              <div className="tw:text-[10px] tw:text-gray-400">Closing</div>
              <div className="tw-text-sm tw-text-gray-600 tw-font-medium">
                <Amount value={row.outstandingAmount ?? 0} decimalPlaces={2} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileView;
