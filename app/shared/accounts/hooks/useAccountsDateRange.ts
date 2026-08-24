import { endOfMonth, format, startOfMonth } from "date-fns";
import { useMemo } from "react";
import { useSearchParams } from "react-router";

/** Window the accounts APIs filter by — both ends as `yyyy-MM-dd`. */
export type AccountsDateRange = {
  startDate: string;
  endDate: string;
};

/**
 * Range the accounts screens read over: the header date picker (`dateFrom` /
 * `dateTo` in the URL), falling back to the current month.
 */
export const resolveAccountsDateRange = (
  dateFrom?: string | null,
  dateTo?: string | null,
): AccountsDateRange => {
  const now = new Date();
  return {
    startDate: format(
      dateFrom ? new Date(dateFrom) : startOfMonth(now),
      "yyyy-MM-dd",
    ),
    endDate: format(dateTo ? new Date(dateTo) : endOfMonth(now), "yyyy-MM-dd"),
  };
};

/**
 * The header's date window, ready to spread into an API filter. Stable across
 * renders while the picker doesn't move, so blocks can key their fetches off it.
 */
const useAccountsDateRange = (): AccountsDateRange => {
  const [searchParams] = useSearchParams();
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  return useMemo(
    () => resolveAccountsDateRange(dateFrom, dateTo),
    [dateFrom, dateTo],
  );
};

export default useAccountsDateRange;
