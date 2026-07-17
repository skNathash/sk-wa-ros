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
          "tw:rounded-lg tw:border tw:p-4",
          type === "payables" &&
            "tw:border-[color:var(--wa-domain-out)]/25 tw:bg-[color:var(--wa-domain-out-bg)]",
          type === "receivables" &&
            "tw:border-[color:var(--wa-domain-in)]/25 tw:bg-[color:var(--wa-domain-in-bg)]"
        )}
      >
        <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:items-center tw:md:justify-between tw:gap-4">
          <div className="tw:flex tw:items-center tw:gap-3">
            <div
              className={clsx(
                "tw:flex tw:h-10 tw:w-10 tw:items-center tw:justify-center tw:rounded-full tw:bg-white/70"
              )}
            >
              {type === "payables" ? (
                <ArrowUpRight className="tw:h-5 tw:w-5 tw:text-[color:var(--wa-domain-out)]" />
              ) : (
                <ArrowDownLeft className="tw:h-5 tw:w-5 tw:text-[color:var(--wa-domain-in)]" />
              )}
            </div>
            <div>
              <h3 className="wa-section-label">{title}</h3>
              <p className="tw:mt-1 tw:text-xs tw:text-gray-500">
                {type === "payables"
                  ? "Amount owed to vendors"
                  : "Amount to be received"}
              </p>
            </div>
          </div>
          <div className="tw:flex tw:flex-row-reverse tw:items-center tw:justify-between tw:text-right tw:md:flex-col ">
            <Amount
              value={totalAmount}
              decimalPlaces={2}
              className={clsx(
                "wa-amount tw:text-2xl tw:font-bold tw:tracking-tight",
                type === "payables" && "tw:text-[color:var(--wa-domain-out)]",
                type === "receivables" && "tw:text-[color:var(--wa-domain-in)]"
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
