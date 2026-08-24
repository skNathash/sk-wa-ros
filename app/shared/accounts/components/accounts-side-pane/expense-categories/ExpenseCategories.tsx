import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { tintAt } from "~/components/core/tint/tints";
import useAppNav from "~/hooks/useAppNav";
import {
  emptyExpenseCategories,
  entriesText,
  getExpenseCategories,
  type ExpenseCategoriesData,
} from "./helper";

interface ExpenseCategoriesProps {
  range: { startDate: string; endDate: string };
}

/**
 * Category-wise expense block for the accounts side pane — where the money
 * went over the window, biggest first. Tapping a row opens the expense records
 * page filtered to that category.
 */
const ExpenseCategories = ({ range }: ExpenseCategoriesProps) => {
  const appNav = useAppNav();
  const [data, setData] = useState<ExpenseCategoriesData>(
    emptyExpenseCategories,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      let result: ExpenseCategoriesData;
      try {
        result = await getExpenseCategories(range);
      } catch (error) {
        result = emptyExpenseCategories();
      }
      if (!active) return;
      setData(result);
      setLoading(false);
    };

    load();

    return () => {
      active = false;
    };
  }, [range.startDate, range.endDate]);

  return (
    <div>
      <div className="tw:mb-2 tw:flex tw:items-center tw:justify-between tw:px-1">
        <p className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
          Categories
        </p>
        {!loading && data.total > 0 && (
          <Amount
            value={data.total}
            decimalPlaces={0}
            className="tw:text-[11px] tw:font-bold tw:text-slate-700"
          />
        )}
      </div>

      {/* Bled to the pane/screen edges (`app-bleed-x`) so the rows read as one
          continuous list rather than a floating card. */}
      <div className="app-bleed-x tw:divide-y tw:divide-gray-100 tw:border-y tw:border-gray-100 tw:bg-white">
        {loading ? (
          <div className="tw:flex tw:h-32 tw:items-center tw:justify-center">
            <AppSpinner />
          </div>
        ) : data.rows.length === 0 ? (
          <p className="tw:py-8 tw:text-center tw:text-xs tw:text-gray-400">
            No expenses in this period.
          </p>
        ) : (
          // No nested scroll area: the pane itself scrolls (see AppPaneSide).
          data.rows.map((row) => {
            const tint = tintAt(row._tintIndex);
            return (
              <button
                key={row.id}
                type="button"
                onClick={() =>
                  appNav.to("/dashboard/expenses/list", { category: row.id })
                }
                className="tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:px-4 tw:py-3 tw:text-left tw:transition-colors tw:hover:bg-slate-50"
              >
                <span
                  className="tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:text-xs tw:font-bold"
                  style={{ background: tint.background, color: tint.ink }}
                >
                  {row._initial}
                </span>

                <div className="tw:min-w-0 tw:flex-1">
                  <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-800">
                    {row.name}
                  </div>
                  <div className="tw:truncate tw:text-[11px] tw:text-gray-500">
                    {entriesText(row.entries, row.share)}
                  </div>
                </div>

                <Amount
                  value={row.amount}
                  decimalPlaces={0}
                  className="tw:shrink-0 tw:text-sm tw:font-bold tw:text-slate-900"
                />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ExpenseCategories;
