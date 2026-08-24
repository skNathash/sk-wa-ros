import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { endOfMonth, format, startOfMonth, sub } from "date-fns";
import { Download, Plus, TrendingDown, TrendingUp } from "lucide-react";
import clsx from "clsx";
import AppButton from "~/components/core/button/AppButton";
import Amount from "~/components/core/amount/Amount";
import useAppNav from "~/hooks/useAppNav";
import ExpenseService from "~/services/ExpenseService";
import MonthYearFilter, {
  type MonthYearValue,
} from "~/shared/others/month-year-filter/MonthYearFilter";

/**
 * Category palette for the breakdown bar + legend. Categories are user-defined
 * so colors are assigned by rank (biggest spend first); the rolled-up "Other"
 * bucket always takes the trailing slate.
 */
const CATEGORY_COLORS = [
  "#f97316", // orange
  "#8b5cf6", // violet
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red
];
const OTHER_COLOR = "#94a3b8"; // slate — the grouped "Other" tail

/** Categories shown individually; everything past this rolls into "Other". */
const MAX_SEGMENTS = 6;

interface CategoryStat {
  name: string;
  amount: number;
  color: string;
  /** Share of the period total, already rounded for display. */
  percent: number;
  /** Bar segment width, e.g. "22.4%". */
  width: string;
}

interface ExpenseOverviewProps {
  /**
   * Narrow rendering for the desktop side pane — drops the Export / Add
   * expense actions and stacks the legend into a single column.
   */
  compact?: boolean;
  /** Hide the "Add expense" CTA when the host page already carries one. */
  hideAddCta?: boolean;
  className?: string;
}

const monthRange = (base: Date) => ({
  $gte: startOfMonth(base).toISOString(),
  $lte: endOfMonth(base).toISOString(),
});

const sumAmount = (rows: { amount: number }[]) =>
  rows.reduce((acc, r) => acc + r.amount, 0);

/** Normalise an analytics row set into `{ name, amount }`, biggest first. */
const toCategoryRows = (rows: any[]) =>
  (rows || [])
    .map((r) => ({
      name: r?.categoryName || "Uncategorised",
      amount: r?.totalAmount || 0,
    }))
    .filter((r) => r.amount > 0)
    .sort((a, b) => b.amount - a.amount);

/**
 * Expenses hero — period total, month-over-month delta, a stacked category
 * breakdown bar with legend, and the period / export / add actions.
 *
 * Owns its own data: it reads the `month` (0-11) and `year` query params,
 * fetches the selected and previous month's analytics, and writes the params
 * back when the period changes — so sibling lists on the page filter off the
 * same URL state.
 */
const ExpenseOverview: React.FC<ExpenseOverviewProps> = ({
  compact = false,
  hideAddCta = false,
  className,
}) => {
  const appNav = useAppNav();
  const now = new Date();

  const [searchParams, setSearchParams] = useSearchParams();
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");

  const selectedMonth =
    monthParam !== null &&
    Number.isInteger(Number(monthParam)) &&
    Number(monthParam) >= 0 &&
    Number(monthParam) <= 11
      ? monthParam
      : `${now.getMonth()}`;
  const selectedYear =
    yearParam !== null && /^\d{4}$/.test(yearParam)
      ? yearParam
      : `${now.getFullYear()}`;

  const [loading, setLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);
  const [previousTotal, setPreviousTotal] = useState<number>(0);
  const [categories, setCategories] = useState<CategoryStat[]>([]);

  const selectedDate = useMemo(
    () => new Date(Number(selectedYear), Number(selectedMonth), 1),
    [selectedMonth, selectedYear],
  );
  const previousDate = useMemo(
    () => sub(selectedDate, { months: 1 }),
    [selectedDate],
  );

  // The selects only move the query params; the effect below owns fetching.
  const handlePeriodChange = useCallback(
    (value: MonthYearValue) => {
      const next = new URLSearchParams(searchParams);
      next.set("month", value.month);
      next.set("year", value.year);
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [currentRes, previousRes] = await Promise.all([
          ExpenseService.getAnalytics({
            groupByCondition: "category",
            filter: { createdAt: monthRange(selectedDate) },
          }),
          ExpenseService.getAnalytics({
            groupByCondition: "category",
            filter: { createdAt: monthRange(previousDate) },
          }),
        ]);

        if (!active) return;

        const currentRows = toCategoryRows(currentRes?.data?.data);
        const previousRows = toCategoryRows(previousRes?.data?.data);

        const periodTotal = sumAmount(currentRows);
        setTotal(periodTotal);
        setPreviousTotal(sumAmount(previousRows));

        // Top categories keep their own segment; the tail rolls into "Other".
        const head = currentRows.slice(0, MAX_SEGMENTS);
        const tail = currentRows.slice(MAX_SEGMENTS);
        const segments = [...head];
        if (tail.length) {
          segments.push({ name: "Other", amount: sumAmount(tail) });
        }

        setCategories(
          segments.map((row, index) => {
            const share = periodTotal ? (row.amount / periodTotal) * 100 : 0;
            return {
              ...row,
              color:
                row.name === "Other" && tail.length
                  ? OTHER_COLOR
                  : CATEGORY_COLORS[index % CATEGORY_COLORS.length],
              percent: Math.round(share),
              width: `${share.toFixed(2)}%`,
            };
          }),
        );
      } catch (error) {
        if (!active) return;
        setTotal(0);
        setPreviousTotal(0);
        setCategories([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, [selectedDate, previousDate]);

  const isCurrentMonth =
    selectedDate.getMonth() === now.getMonth() &&
    selectedDate.getFullYear() === now.getFullYear();

  const periodLabel = useMemo(
    () => `EXPENSES · ${format(selectedDate, "MMM yyyy").toUpperCase()}`,
    [selectedDate],
  );
  const previousLabel = useMemo(
    () => format(previousDate, "MMM").toUpperCase(),
    [previousDate],
  );

  // Month-over-month change. Null when there's no previous month to compare
  // against — a bare "+100%" against zero says nothing useful.
  const delta = useMemo(() => {
    if (!previousTotal) return null;
    const percent = ((total - previousTotal) / previousTotal) * 100;
    return {
      up: percent >= 0,
      label: `${percent >= 0 ? "+" : "−"}${Math.abs(percent).toFixed(0)}% VS ${previousLabel}`,
    };
  }, [total, previousTotal, previousLabel]);

  const showActions = !compact;

  const handleExport = () => {
    // Client-side CSV of what's on screen — the analytics endpoint returns the
    // full breakdown already, so there's nothing extra to fetch.
    const rows = [
      ["Category", "Amount", "Share %"],
      ...categories.map((c) => [
        c.name,
        `${c.amount}`,
        `${c.percent}`,
      ]),
      ["Total", `${total}`, "100"],
    ];
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${`${cell}`.replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `expenses-${format(selectedDate, "MMM-yyyy").toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={clsx("expense-overview", className)}>
      {/* Header — total + delta on the left, period/actions on the right.
          Stacks on mobile, sits side by side from md up. */}
      <div className="tw:flex tw:flex-col tw:gap-3 tw:md:flex-row tw:md:items-start tw:md:justify-between tw:gap-x-4">
        <div className="tw:min-w-0">
          <div className="expense-overview-label">{periodLabel}</div>

          <div className="tw:mt-1 tw:flex tw:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-1.5">
            {loading ? (
              <div className="expense-overview-amount tw:opacity-30">₹—</div>
            ) : (
              <Amount
                value={total}
                decimalPlaces={0}
                className="expense-overview-amount"
              />
            )}

            {!loading && delta && (
              <span
                className={clsx(
                  "expense-overview-delta",
                  delta.up ? "is-up" : "is-down",
                )}
              >
                {delta.up ? (
                  <TrendingUp size={13} />
                ) : (
                  <TrendingDown size={13} />
                )}
                {delta.label}
              </span>
            )}
          </div>
        </div>

        {/* Actions — wrap on mobile, right-aligned from md up. The month/year
            selects are always available; export/add only in the full variant. */}
        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2 tw:md:justify-end tw:md:shrink-0">
          <MonthYearFilter
            month={selectedMonth}
            year={selectedYear}
            onChange={handlePeriodChange}
          />

          {showActions && (
            <>
              <AppButton
                size="small"
                fill="outline"
                color="light"
                onClick={handleExport}
                disabled={loading || categories.length === 0}
                className="tw:gap-1.5"
              >
                <Download size={15} />
                Export
              </AppButton>

              {!hideAddCta && (
                <AppButton
                  size="small"
                  color="primary"
                  onClick={() => appNav.to("/dashboard/expenses/manage")}
                  className="tw:gap-1.5"
                >
                  <Plus size={15} />
                  Add expense
                </AppButton>
              )}
            </>
          )}
        </div>
      </div>

      {/* Breakdown bar + legend. Hidden while loading and when the period has
          no spend — an empty grey rail reads as a broken chart. */}
      {loading ? (
        <div className="expense-overview-bar tw:mt-4 tw:animate-pulse" />
      ) : categories.length === 0 ? (
        <div className="expense-overview-empty tw:mt-4">
          No expenses recorded {isCurrentMonth ? "this month" : "in this period"}
        </div>
      ) : (
        <>
          <div className="expense-overview-bar tw:mt-4">
            {categories.map((category) => (
              <span
                key={category.name}
                title={`${category.name} · ${category.percent}%`}
                style={{
                  width: category.width,
                  backgroundColor: category.color,
                }}
              />
            ))}
          </div>

          {/* Legend — one column in the pane, two on mobile, up to four on
              wide screens so it reads as a single row like the reference. */}
          <div
            className={clsx(
              "tw:mt-3 tw:grid tw:gap-x-6 tw:gap-y-3",
              compact
                ? "tw:grid-cols-1"
                : "tw:grid-cols-2 tw:lg:grid-cols-4",
            )}
          >
            {categories.map((category) => (
              <div key={category.name} className="tw:min-w-0">
                <div className="tw:flex tw:items-center tw:gap-1.5">
                  <span
                    className="tw:inline-block tw:h-2 tw:w-2 tw:shrink-0 tw:rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="tw:truncate tw:text-xs tw:font-semibold tw:text-gray-700">
                    {category.name}
                  </span>
                  <span className="tw:shrink-0 tw:text-xs tw:text-gray-400">
                    · {category.percent}%
                  </span>
                </div>
                <Amount
                  value={category.amount}
                  decimalPlaces={0}
                  className="tw:mt-0.5 tw:block tw:text-sm tw:font-bold tw:text-gray-900"
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ExpenseOverview;
