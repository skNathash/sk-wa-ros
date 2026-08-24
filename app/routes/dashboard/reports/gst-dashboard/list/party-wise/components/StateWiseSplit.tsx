import clsx from "clsx";
import React from "react";
import AppCard from "~/components/core/card/AppCard";
import Amount from "~/components/core/amount/Amount";
import type { PartyRow, StateSplit } from "../helper";
import { buildStateSplit } from "../helper";

interface StateWiseProps {
  data: PartyRow[];
  loading?: boolean;
}

/**
 * Intra-state supplies split into CGST + SGST, inter-state charged as IGST —
 * the check that place-of-supply was picked correctly.
 */
export const StateWiseSplit: React.FC<StateWiseProps> = ({
  data,
  loading = false,
}) => {
  if (loading || data.length === 0) return null;

  const splits: StateSplit[] = buildStateSplit(data);
  if (splits.length === 0) return null;

  const maxTax = Math.max(...splits.map((s) => s.tax), 1);

  return (
    <AppCard noPadding className="tw:mb-4">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:px-4 tw:py-3 tw:border-b tw:border-gray-100">
        <h3 className="tw:text-base tw:font-bold tw:text-gray-900">
          State-wise · CGST/SGST vs IGST
        </h3>
        <span className="tw:text-xs tw:text-gray-400 tw:shrink-0">
          for correct place-of-supply
        </span>
      </div>

      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-x-6 tw:gap-y-4 tw:px-4 tw:py-4">
        {splits.map((split) => (
          <div key={`${split.code}-${split.intra}`}>
            <div className="tw:flex tw:items-center tw:gap-2">
              <span
                className={clsx(
                  "tw:inline-flex tw:items-center tw:rounded tw:text-[10px] tw:font-bold tw:tracking-wide tw:px-1.5 tw:py-0.5",
                  split.intra
                    ? "tw:bg-amber-100 tw:text-amber-700"
                    : "tw:bg-red-100 tw:text-red-700",
                )}
              >
                {split.name} · {split.intra ? "INTRA-STATE" : "INTER-STATE"}
              </span>

              <span className="tw:text-xs tw:text-gray-500 tw:truncate">
                {split.invoices.toLocaleString("en-IN")} invoices
              </span>

              <span className="tw:ml-auto tw:text-sm tw:font-bold tw:text-gray-900 tw:tabular-nums tw:shrink-0">
                <Amount value={split.tax} decimalPlaces={0} />
              </span>
            </div>

            <div className="tw:mt-1.5 tw:h-1.5 tw:rounded-full tw:bg-gray-200 tw:overflow-hidden">
              <div
                className={clsx(
                  "tw:h-full tw:rounded-full",
                  split.intra ? "tw:bg-emerald-700" : "tw:bg-red-500",
                )}
                style={{
                  width: split.tax
                    ? `${Math.max((split.tax / maxTax) * 100, 4)}%`
                    : 0,
                }}
              />
            </div>

            <div className="tw:text-[11px] tw:text-gray-400 tw:mt-1">
              {split.intra ? (
                <>
                  CGST <Amount value={split.tax / 2} decimalPlaces={0} /> + SGST{" "}
                  <Amount value={split.tax / 2} decimalPlaces={0} /> · retained
                  by state &amp; centre 50/50
                </>
              ) : (
                <>
                  IGST full · centre collects, apportions to destination state
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </AppCard>
  );
};

export default StateWiseSplit;
