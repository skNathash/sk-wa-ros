import React from "react";
import { Clock } from "lucide-react";
import DateFormat from "~/components/core/date/DateFormat";

interface DateTimeCellProps {
  value?: string;
  // Style applied to the date portion (e.g. to highlight overdue follow-ups).
  dateClassName?: string;
  // Show a clock icon before the time portion.
  showClockIcon?: boolean;
  // Render only the date — drop the time portion. Useful where the time carries
  // no meaning (e.g. a call-back that's only ever scheduled to a day).
  hideTime?: boolean;
}

// Renders a date and time inline on a single row, e.g. "06 Jul 2026  02:30 PM".
const DateTimeCell: React.FC<DateTimeCellProps> = ({
  value,
  dateClassName,
  showClockIcon,
  hideTime,
}) => {
  if (!value) return <>-</>;
  return (
    <span className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-1.5 tw:gap-y-0.5">
      <DateFormat
        value={value}
        formatStr="dd MMM yyyy"
        className={dateClassName || "tw:text-gray-900"}
      />
      {!hideTime && (
        <span className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500">
          {showClockIcon && (
            <Clock className="tw:w-3 tw:h-3 tw:text-gray-400 tw:shrink-0" />
          )}
          <DateFormat value={value} formatStr="hh:mm a" />
        </span>
      )}
    </span>
  );
};

export default DateTimeCell;
