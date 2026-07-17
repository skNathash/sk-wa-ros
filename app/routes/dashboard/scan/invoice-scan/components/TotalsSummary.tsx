import { Wallet } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import type { InvoiceTotals } from "../types";

interface TotalsSummaryProps {
  totals?: InvoiceTotals;
}

const TotalsSummary = ({ totals }: TotalsSummaryProps) => {
  const rows = [
    { label: "Subtotal", value: totals?.subtotal ?? 0 },
    { label: "Tax", value: totals?.tax ?? 0 },
    { label: "Round Off", value: totals?.roundOff ?? 0 },
  ];

  return (
    <div className="tw:flex tw:flex-col tw:overflow-hidden tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white">
      <div className="tw:flex tw:items-center tw:gap-2.5 tw:p-3">
        <div className="tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-slate-100 tw:text-slate-700">
          <Wallet size={16} />
        </div>
        <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-gray-400">
          Payment Summary
        </div>
      </div>

      <div className="tw:space-y-2 tw:border-t tw:border-gray-100 tw:px-3 tw:py-3 tw:text-xs">
        {rows.map((row) => (
          <div
            key={row.label}
            className="tw:flex tw:items-center tw:justify-between"
          >
            <span className="tw:text-gray-500">{row.label}</span>
            <span className="tw:font-medium tw:text-gray-800 tw:tabular-nums">
              <Amount value={row.value} />
            </span>
          </div>
        ))}
      </div>

      {/* Grand Total — the amount being committed */}
      <div className="tw:mt-auto tw:flex tw:items-center tw:justify-between tw:border-t tw:border-emerald-100 tw:bg-emerald-50 tw:px-3 tw:py-3">
        <span className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-emerald-700">
          Grand Total
        </span>
        <span className="tw:text-lg tw:font-bold tw:text-emerald-900 tw:tabular-nums">
          <Amount value={totals?.grandTotal ?? 0} />
        </span>
      </div>
    </div>
  );
};

export default TotalsSummary;
