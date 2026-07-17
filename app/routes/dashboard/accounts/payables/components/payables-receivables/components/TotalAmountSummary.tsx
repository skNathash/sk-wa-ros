import clsx from "clsx";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import Amount from "~/components/core/amount/Amount";

interface TotalAmountSummaryProps {
  type: "payables" | "receivables";
  totalAmount: number;
  title: string;
}

const TotalAmountSummary = ({
  type,
  totalAmount,
  title,
}: TotalAmountSummaryProps) => {
  return (
    <div>
      <div
        className={clsx(
          "tw:rounded-lg tw:p-4 tw:border tw:border-opacity-20",
          type === "payables" && "tw:bg-red-100 tw:border-red-300",
          type === "receivables" && "tw:bg-green-100 tw:border-green-300"
        )}
      >
        <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:items-center tw:md:justify-between tw:gap-4">
          <div className="tw:flex tw:items-center tw:gap-3">
            <div
              className={clsx(
                "tw:w-10 tw:h-10 tw:rounded-full tw:flex tw:items-center tw:justify-center",
                type === "payables" && "tw:bg-red-200",
                type === "receivables" && "tw:bg-green-200"
              )}
            >
              {type === "payables" ? (
                <ArrowUpRight className="tw:w-5 tw:h-5 tw:text-red-600" />
              ) : (
                <ArrowDownLeft className="tw:w-5 tw:h-5 tw:text-green-600" />
              )}
            </div>
            <div>
              <h3 className="tw:text-sm tw:font-medium tw:text-gray-600 tw:uppercase tw:tracking-wide">
                {title}
              </h3>
              <p className="tw:text-xs tw:text-gray-500 tw:mt-1">
                {type === "payables"
                  ? "Amount owed to vendors"
                  : "Amount to be received"}
              </p>
            </div>
          </div>
          <div className="tw:text-right tw:flex tw:flex-row-reverse tw:md:flex-col tw:justify-between tw:items-center ">
            <Amount
              value={totalAmount}
              decimalPlaces={2}
              className={clsx(
                "tw:text-2xl tw:font-bold tw:tracking-tight",
                type === "payables" && "tw:text-red-700",
                type === "receivables" && "tw:text-green-700"
              )}
            />
            <p className="tw:text-xs tw:text-gray-500 tw:md:mt-1">
              Total Outstanding
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotalAmountSummary;
