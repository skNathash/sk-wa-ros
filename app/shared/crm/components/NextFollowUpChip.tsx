import type React from "react";
import { differenceInCalendarDays } from "date-fns";

interface NextFollowUpChipProps {
  // ISO / parseable date string of the upcoming follow-up.
  date: string;
}

// Urgency pill for an upcoming follow-up date, coloured by how soon it is due.
// Shared between the employee and retailer dashboard tables so both read the
// same way.
const NextFollowUpChip: React.FC<NextFollowUpChipProps> = ({ date }) => {
  const target = new Date(date);
  const now = new Date();
  const days = differenceInCalendarDays(target, now);
  let label: string;
  let cls: string;
  // Past its due date/time counts as overdue even when that time is earlier
  // today, so the chip matches the Overdue tile in the summary cards.
  if (days < 0 || target.getTime() < now.getTime()) {
    label = "Overdue";
    cls = "tw:bg-red-50 tw:text-red-600";
  } else if (days === 0) {
    label = "Today";
    cls = "tw:bg-red-50 tw:text-red-600";
  } else if (days === 1) {
    label = "Tomorrow";
    cls = "tw:bg-amber-50 tw:text-amber-600";
  } else if (days <= 7) {
    label = `in ${days} days`;
    cls = "tw:bg-amber-50 tw:text-amber-600";
  } else {
    label = `in ${days} days`;
    cls = "tw:bg-gray-100 tw:text-gray-500";
  }
  return (
    <span
      className={`tw:inline-flex tw:shrink-0 tw:rounded-full tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-semibold ${cls}`}
    >
      {label}
    </span>
  );
};

export default NextFollowUpChip;
