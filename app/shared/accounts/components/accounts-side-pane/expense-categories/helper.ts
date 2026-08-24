import { endOfDay, startOfDay } from "date-fns";
import { tileDecor, type TileDecor } from "~/components/core/tint/tints";
import ExpenseService from "~/services/ExpenseService";

export type ExpenseCategoryRow = {
  id: string;
  name: string;
  amount: number;
  /** Number of expense entries booked against the category in the window. */
  entries: number;
  /** Share of the window's total spend, rounded to a whole percent. */
  share: number;
} & TileDecor;

export type ExpenseCategoriesData = {
  rows: ExpenseCategoryRow[];
  total: number;
};

export const emptyExpenseCategories = (): ExpenseCategoriesData => ({
  rows: [],
  total: 0,
});

const UNCATEGORISED = "Uncategorised";

/**
 * Category-wise spend for the window.
 *
 * There is no category-summary endpoint, so this reads the expense transaction
 * list for the window and rolls it up by category — the same list the expense
 * records page renders. `count` is deliberately high: the pane shows totals,
 * so a truncated page would understate them.
 */
export const getExpenseCategories = async (range: {
  startDate: string;
  endDate: string;
}): Promise<ExpenseCategoriesData> => {
  const response = await ExpenseService.getTransactions({
    page: 1,
    count: 500,
    filter: {
      expenseDate: {
        $gte: startOfDay(new Date(range.startDate)).toISOString(),
        $lte: endOfDay(new Date(range.endDate)).toISOString(),
      },
    },
  });

  const items: any[] = response?.data?.data || [];

  const buckets = new Map<
    string,
    { name: string; amount: number; entries: number }
  >();
  let total = 0;

  items.forEach((item) => {
    const id = String(item?.categoryId || item?.category?._id || UNCATEGORISED);
    const name = item?.categoryName || item?.category?.name || UNCATEGORISED;
    const amount = Number(item?.amount) || 0;
    total += amount;

    const bucket = buckets.get(id) || { name, amount: 0, entries: 0 };
    bucket.amount += amount;
    bucket.entries += 1;
    buckets.set(id, bucket);
  });

  const rows = Array.from(buckets.entries())
    .map(([id, bucket]) => ({
      id,
      name: bucket.name,
      amount: bucket.amount,
      entries: bucket.entries,
      share: total > 0 ? Math.round((bucket.amount / total) * 100) : 0,
      ...tileDecor(bucket.name),
    }))
    .sort((a, b) => b.amount - a.amount);

  return { rows, total };
};

export const entriesText = (entries: number, share: number) =>
  `${entries} ${entries === 1 ? "entry" : "entries"} · ${share}% of spend`;
