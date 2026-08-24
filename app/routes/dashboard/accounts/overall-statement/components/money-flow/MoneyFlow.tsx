import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAccountsDateRange from "~/shared/accounts/hooks/useAccountsDateRange";
import {
  emptyMoneyFlow,
  getMoneyFlow,
  type MoneyFlowCard,
  type MoneyFlowData,
} from "./helper";

// Money-in / money-out reuse the shared theme-2 domain tokens so the pair reads
// in the same language as the rest of the Accounts thread.
const tones: Record<MoneyFlowCard["key"], string> = {
  in: "var(--accent-in, #1f8a4f)",
  out: "var(--accent-out, #c85a1d)",
};

const MoneyFlow = () => {
  const range = useAccountsDateRange();

  const [data, setData] = useState<MoneyFlowData>(emptyMoneyFlow);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: MoneyFlowData;
      try {
        result = await getMoneyFlow(range);
      } catch (e) {
        result = emptyMoneyFlow();
      }
      if (cancelled) return;
      setData(result);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [range]);

  if (loading) {
    return (
      <div className="tw:mb-3 tw:rounded-2xl tw:bg-white tw:p-6 tw:text-center tw:shadow-sm">
        <AppSpinner />
      </div>
    );
  }

  return (
    <div className="tw:mb-3 tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-3">
      {data.cards.map((card) => {
        const accent = tones[card.key];
        return (
          <div
            key={card.key}
            className="tw:rounded-2xl tw:bg-white tw:p-3.5 tw:shadow-sm"
            /* Money going out is the card that carries risk, so it is the one
               outlined in its own tone. */
            style={
              card.key === "out" ? { border: `1px solid ${accent}` } : undefined
            }
          >
            <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
              {card.label}
            </div>

            <div className="tw:mt-1 tw:text-2xl tw:font-bold">
              <span style={{ color: accent }}>
                <Amount value={card.amount} decimalPlaces={0} />
              </span>
            </div>

            <div className="tw:mt-1 tw:text-[11px] tw:leading-snug tw:text-gray-500">
              {card.lanes.map((lane, index) => (
                <span key={lane.key}>
                  {index > 0 && " · "}
                  {lane.label} <Amount value={lane.amount} decimalPlaces={0} />
                </span>
              ))}
              {card.lanes.length === 0 && card.note}
            </div>

            {card.lanes.length > 0 && (
              <div className="tw:mt-2 tw:flex tw:h-1.5 tw:overflow-hidden tw:rounded-full tw:bg-gray-200">
                {card.lanes.map((lane) => (
                  <div
                    key={lane.key}
                    style={{
                      width: lane.width,
                      backgroundColor: accent,
                      opacity: lane.opacity,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MoneyFlow;
