import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppNav from "~/hooks/useAppNav";
import {
  buildSummaryCards,
  emptyAccountsSummary,
  getAccountsSummary,
  toneClass,
  type AccountsSummaryData,
} from "./helper";

interface AccountsPaneSummaryProps {
  /** Which pair of numbers to show — set by the active pane chip. */
  view: "overview" | "in" | "out";
  /** Window the totals are read over. */
  range: { startDate: string; endDate: string; periodLabel: string };
}

/**
 * Summary row at the top of the accounts side pane — two tinted cards built
 * from the payables/receivables aggregate. Tapping a card opens the matching
 * side of the payables page.
 */
const AccountsPaneSummary = ({ view, range }: AccountsPaneSummaryProps) => {
  const appNav = useAppNav();
  const [data, setData] = useState<AccountsSummaryData>(emptyAccountsSummary);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      const result = await getAccountsSummary(range);
      if (!active) return;
      setData(result);
      setLoading(false);
    };

    load();

    return () => {
      active = false;
    };
  }, [range.startDate, range.endDate]);

  const cards = buildSummaryCards(data, view, range.periodLabel);

  return (
    <div>
      <p className="tw:mb-2 tw:px-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
        Summary
      </p>

      <div className="tw:grid tw:grid-cols-2 tw:gap-3">
        {cards.map((card) => {
          const tone = toneClass[card.tone];
          return (
            <button
              key={card.key}
              type="button"
              onClick={() =>
                appNav.to("/dashboard/accounts/payables", { view: card.view })
              }
              className={`tw:cursor-pointer tw:rounded-xl tw:px-3.5 tw:py-2 tw:text-left tw:transition-shadow tw:hover:shadow-sm tw:focus-visible:outline-none ${tone.card}`}
            >
              <div
                className={`tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-wide ${tone.label}`}
              >
                {card.label}
              </div>

              {loading ? (
                <div className="tw:flex tw:min-h-[24px] tw:items-center">
                  <AppSpinner className="tw:w-5 tw:h-5" />
                </div>
              ) : (
                <Amount
                  value={card.amount}
                  decimalPlaces={0}
                  className={`tw:mt-1 tw:block tw:text-xl tw:font-bold ${tone.value}`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AccountsPaneSummary;
