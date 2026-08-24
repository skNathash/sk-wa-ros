import clsx from "clsx";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import {
  emptyProfitWaterfall,
  getProfitWaterfall,
  type ProfitWaterfallData,
  type WaterfallKind,
} from "./helper";

/* Subtotals are the shop's money and stay green; goods bought are amber, the
   running costs under them are red — so the ladder reads as one big cost and a
   handful of small ones. */
const labelClass: Record<WaterfallKind, string> = {
  total: "tw:font-bold tw:text-emerald-700",
  cogs: "tw:text-gray-600",
  cost: "tw:text-gray-600",
};

const amountClass: Record<WaterfallKind, string> = {
  total: "tw:font-bold tw:text-emerald-700",
  cogs: "tw:font-semibold tw:text-amber-600",
  cost: "tw:font-semibold tw:text-red-500",
};

const barClass: Record<WaterfallKind, string> = {
  total: "tw:bg-emerald-700",
  cogs: "tw:bg-amber-400",
  cost: "tw:bg-red-400",
};

// Revenue stepped down to net profit, one deduction at a time — the block that
// answers "where did the rest of it go".
const ProfitWaterfall = () => {
  const { t } = useTranslation(["common"]);

  const [data, setData] = useState<ProfitWaterfallData>(emptyProfitWaterfall);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: ProfitWaterfallData;
      try {
        result = await getProfitWaterfall();
      } catch (e) {
        result = emptyProfitWaterfall();
      }
      if (cancelled) return;
      setData(result);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="tw:overflow-hidden tw:rounded-2xl tw:bg-white tw:shadow-sm">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-gray-100 tw:px-4 tw:py-3">
        <div className="tw:text-sm tw:font-bold tw:text-gray-800">
          {t("pnlHowProfitMade", { defaultValue: "How the profit was made" })}
        </div>
        <div className="tw:text-[11px] tw:text-gray-400">{data.note}</div>
      </div>

      {loading ? (
        <div className="tw:p-6 tw:text-center">
          <AppSpinner />
        </div>
      ) : (
        <div className="tw:px-4 tw:py-3">
          {data.steps.map((step) => (
            <div
              key={step.key}
              className="tw:flex tw:items-center tw:gap-3 tw:py-1.5"
            >
              <div
                className={clsx(
                  "tw:w-28 tw:shrink-0 tw:truncate tw:text-xs",
                  labelClass[step.kind],
                )}
              >
                {step.label}
              </div>

              <div className="tw:h-2 tw:flex-1 tw:overflow-hidden tw:rounded-full tw:bg-gray-200">
                <div
                  className={clsx(
                    "tw:h-full tw:rounded-full",
                    barClass[step.kind],
                  )}
                  style={{
                    width: `${Math.min(100, Math.max(0, step.percent))}%`,
                  }}
                />
              </div>

              <div
                className={clsx(
                  "tw:w-24 tw:shrink-0 tw:text-right tw:text-xs",
                  amountClass[step.kind],
                )}
              >
                <Amount value={step.amount} decimalPlaces={0} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfitWaterfall;
