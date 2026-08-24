import { MoveRight } from "lucide-react";
import React from "react";
import { format } from "date-fns";
import Amount from "~/components/core/amount/Amount";
import { Skeleton } from "~/components/ui/skeleton";
import type { StatementSummaryData } from "../helper";

// Pastel tint per data point — purchases / paylater share violet, payments
// mint, late fees rose — matching the khata ledger mock.
const CHIPS = [
  {
    key: "purchases",
    label: "Purchases",
    tile: "tw:bg-violet-50",
    labelColor: "tw:text-violet-600",
    amount: "tw:text-violet-900",
  },
  {
    key: "paylaterUsed",
    label: "Paylater Used",
    tile: "tw:bg-violet-50",
    labelColor: "tw:text-violet-600",
    amount: "tw:text-violet-900",
  },
  {
    key: "paid",
    label: "Payments Made",
    tile: "tw:bg-emerald-50",
    labelColor: "tw:text-emerald-600",
    amount: "tw:text-emerald-800",
  },
  {
    key: "notes",
    label: "Late Fees & Notes",
    tile: "tw:bg-rose-50",
    labelColor: "tw:text-rose-500",
    amount: "tw:text-rose-600",
  },
] as const;

type Props = {
  summary: StatementSummaryData;
  /** Counterparty display name shown in the statement header. */
  partyName?: string;
};

const StatementSummary: React.FC<Props> = ({ summary, partyName }) => {
  if (summary.loading) {
    return <Skeleton className="tw:h-48 tw:rounded-2xl tw:mb-4" />;
  }

  const closing = summary.closing;
  const owes = closing > 0;
  const displayName = partyName?.trim() || "";

  return (
    <div className="tw:mb-4 tw:overflow-hidden tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-white">
      {/* Opening → Closing header — brand-green ledger block */}
      <div className="tw:px-4 tw:py-4 tw:border-b tw:border-gray-200">
        <p className="tw:mb-3 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-[0.12em]">
          {displayName ? `Statement · ${displayName}` : "Statement"}
        </p>

        <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
          <div>
            <p className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide">
              Opening · {format(summary.periodStart, "d MMM")}
            </p>
            <Amount
              value={summary.opening}
              decimalPlaces={0}
              className="tw:mt-0.5 tw:block tw:text-2xl tw:font-bold"
            />
          </div>

          <MoveRight size={18} className="tw:shrink-0" />

          <div className="tw:text-right">
            <p className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide">
              Closing · Today
            </p>
            <Amount
              value={closing}
              decimalPlaces={0}
              className="tw:mt-0.5 tw:block tw:text-2xl tw:font-bold"
            />
            {displayName && closing !== 0 ? (
              <p className="tw:mt-1 tw:text-xs">
                {owes ? `You owe ${displayName}` : `${displayName} owes you`}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Summary tiles — white footer of the same card */}
      <div className="tw:grid tw:grid-cols-2 tw:gap-2 tw:p-3 tw:sm:grid-cols-4">
        {CHIPS.map((chip) => (
          <div
            key={chip.key}
            className={`tw:rounded-xl tw:px-3 tw:py-2.5 ${chip.tile}`}
          >
            <span
              className={`tw:block tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide ${chip.labelColor}`}
            >
              {chip.label}
            </span>
            <Amount
              value={summary[chip.key]}
              decimalPlaces={0}
              className={`tw:mt-1 tw:block tw:text-base tw:font-bold ${chip.amount}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatementSummary;
