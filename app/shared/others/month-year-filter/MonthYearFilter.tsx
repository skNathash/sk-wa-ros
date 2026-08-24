import { clsx } from "clsx";
import AppSelect from "~/components/core/form/AppSelect";

export interface MonthYearValue {
  /** Month index as a string, "0" (Jan) … "11" (Dec). */
  month: string;
  /** Full year as a string, e.g. "2026". */
  year: string;
}

interface MonthYearFilterProps {
  month: string;
  year: string;
  onChange: (value: MonthYearValue) => void;
  /** How many years back (in addition to the current year) to list. */
  yearsBack?: number;
  className?: string;
  /** Extra classes for the two select triggers (e.g. to recolor on a dark card). */
  inputClassName?: string;
}

export const MONTH_OPTIONS: { label: string; value: string }[] = [
  { label: "January", value: "0" },
  { label: "February", value: "1" },
  { label: "March", value: "2" },
  { label: "April", value: "3" },
  { label: "May", value: "4" },
  { label: "June", value: "5" },
  { label: "July", value: "6" },
  { label: "August", value: "7" },
  { label: "September", value: "8" },
  { label: "October", value: "9" },
  { label: "November", value: "10" },
  { label: "December", value: "11" },
];

export const MONTH_SHORT_LABELS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

/** Build the year dropdown options from the current year going back `yearsBack` years. */
export const getYearOptions = (
  yearsBack = 5,
): { label: string; value: string }[] => {
  const currentYear = new Date().getFullYear();
  const years: { label: string; value: string }[] = [];
  for (let i = currentYear; i >= currentYear - yearsBack; i--) {
    years.push({ label: `${i}`, value: `${i}` });
  }
  return years;
};

/**
 * Compute the ISO start/end range for a given month/year selection.
 * Start is the first instant of the month, end is the last instant of the month.
 */
export const getMonthRange = (
  month: string,
  year: string,
): { startDate: string; endDate: string } => {
  const start = new Date(Number(year), Number(month), 1, 0, 0, 0, 0);
  // Day 0 of the next month = last day of this month.
  const end = new Date(Number(year), Number(month) + 1, 0, 23, 59, 59, 999);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
};

/** The current month/year as a {@link MonthYearValue}. */
export const getCurrentMonthYear = (): MonthYearValue => {
  const now = new Date();
  return { month: `${now.getMonth()}`, year: `${now.getFullYear()}` };
};

/**
 * Reusable month + year dropdown filter. Controlled via `month`/`year` props;
 * emits the full selection on change so callers can derive a date range with
 * {@link getMonthRange}.
 */
const MonthYearFilter = ({
  month,
  year,
  onChange,
  yearsBack = 5,
  className,
  inputClassName,
}: MonthYearFilterProps) => {
  const years = getYearOptions(yearsBack);
  const triggerClass = clsx(
    "tw:h-7 tw:gap-1 tw:px-2 tw:text-xs",
    inputClassName,
  );

  return (
    <div className={clsx("tw:flex tw:gap-1.5", className)}>
      <AppSelect
        options={MONTH_OPTIONS}
        value={month}
        size="sm"
        inputClassName={triggerClass}
        onChange={(value: string) => onChange({ month: value, year })}
      />
      <AppSelect
        options={years}
        value={year}
        size="sm"
        inputClassName={triggerClass}
        onChange={(value: string) => onChange({ month, year: value })}
      />
    </div>
  );
};

export default MonthYearFilter;
