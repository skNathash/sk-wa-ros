import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { format, isValid, parseISO } from "date-fns";
import { ArrowRight, Receipt } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppLink from "~/components/core/link/AppLink";
import { Skeleton } from "~/components/ui/skeleton";
import ExpenseService from "~/services/ExpenseService";

interface RecentExpense {
  _id: string;
  title?: string;
  amount?: number;
  expenseDate?: string;
  categoryName?: string;
  subCategoryName?: string;
}

interface RecentExpensesProps {
  /** Maximum number of recent expenses to fetch and display. Defaults to 5. */
  limit?: number;
  className?: string;
  /** Optional refresh signal to re-fetch. */
  refreshSignal?: number;
  /** Show a "View all" link to the expense list. Off by default — on the list
   *  page itself the link would point back at the current page. */
  showViewAll?: boolean;
}

/** Splits a date into the two lines of the leading rail: "24" / "JUL". */
const dateParts = (value?: string | null) => {
  if (!value) return null;
  const parsed = parseISO(value);
  if (!isValid(parsed)) return null;
  return {
    day: format(parsed, "dd"),
    month: format(parsed, "MMM"),
    full: format(parsed, "dd MMM yyyy"),
  };
};

/**
 * Shared recent-expenses card. Fetches the latest expense transactions and
 * renders them as a compact ledger list — date rail, title + category,
 * amount — with each row linking to the expense detail view.
 */
const RecentExpenses: React.FC<RecentExpensesProps> = ({
  limit = 5,
  className = "",
  refreshSignal = 0,
  showViewAll = false,
}) => {
  const { t } = useTranslation(["expense", "common"]);
  const [data, setData] = useState<RecentExpense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await ExpenseService.getTransactions({
          page: 1,
          limit: limit,
          sort: { createdAt: -1 },
          filter: {},
        });
        if (!active) return;
        setData(response?.data?.data || []);
      } catch (error) {
        console.error("Recent expenses error:", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, [limit, refreshSignal]);

  return (
    <div className={className}>
      <div className="tw:mb-1 tw:flex tw:items-center tw:justify-between tw:gap-2">
        <h3 className="tw:text-sm tw:font-semibold tw:text-slate-900">
          {t("recentExpenses")}
        </h3>
        {showViewAll && (
          <AppLink
            asLink
            href="/dashboard/expenses/list"
            className="tw:inline-flex tw:items-center tw:gap-0.5 tw:text-xs tw:font-medium tw:text-primary"
            noUnderline
          >
            {t("viewAll", { ns: "common" })}
            <ArrowRight size={12} />
          </AppLink>
        )}
      </div>

      {loading ? (
        /* Skeleton rows rather than a spinner, so the card keeps its
           height and the list doesn't jump when data lands. */
        <ul className="expense-recent-list" aria-busy="true">
          {Array.from({ length: Math.min(limit, 4) }).map((_, i) => (
            <li key={i}>
              <div className="expense-recent-row">
                <Skeleton className="tw:w-8 tw:h-8 tw:rounded-md" />
                <div className="tw:flex-1 tw:space-y-1.5">
                  <Skeleton className="tw:h-3 tw:w-2/3" />
                  <Skeleton className="tw:h-2.5 tw:w-1/3" />
                </div>
                <Skeleton className="tw:h-3 tw:w-12" />
              </div>
            </li>
          ))}
        </ul>
      ) : data.length === 0 ? (
        <div className="tw:py-6 tw:flex tw:flex-col tw:items-center tw:text-center">
          <Receipt size={20} className="tw:text-gray-400" aria-hidden />
          <p className="tw:mt-2 tw:text-sm tw:text-gray-600">
            {t("noRecentExpenses")}
          </p>
          <AppLink
            asLink
            href="/dashboard/expenses/manage"
            className="tw:mt-2 tw:text-xs tw:font-medium tw:text-primary"
            noUnderline
          >
            {t("addExpense")}
          </AppLink>
        </div>
      ) : (
        <ul className="expense-recent-list">
          {data.map((item) => {
            const title = item?.title || t("expense");
            const category = item?.categoryName || item?.subCategoryName;
            const date = dateParts(item?.expenseDate);

            return (
              <li key={item._id}>
                <AppLink
                  asLink
                  href={`/dashboard/expenses/view/${item._id}`}
                  className="expense-recent-row"
                  noUnderline
                >
                  {/* aria-label carries the full date — the rail only shows
                      day + month, and the year matters to a screen reader. */}
                  <span
                    className="expense-recent-date"
                    title={date?.full}
                    aria-label={date?.full}
                  >
                    {date ? (
                      <>
                        <span className="expense-recent-day">{date.day}</span>
                        <span className="expense-recent-month">
                          {date.month}
                        </span>
                      </>
                    ) : (
                      <span className="expense-recent-day">—</span>
                    )}
                  </span>

                  <span className="tw:min-w-0 tw:flex-1">
                    <span className="expense-recent-title tw:block tw:truncate">
                      {title}
                    </span>
                    {category && (
                      <span className="expense-recent-meta tw:block tw:truncate">
                        {category}
                      </span>
                    )}
                  </span>

                  <Amount
                    value={Number(item?.amount) || 0}
                    decimalPlaces={0}
                    className="expense-recent-amount"
                  />
                </AppLink>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default RecentExpenses;
