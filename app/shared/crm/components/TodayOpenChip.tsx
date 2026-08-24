import { CalendarClock, X } from "lucide-react";

// Today's date as a local yyyy-MM-dd string. Used both to set the preset's
// follow-up date params and to detect whether the preset is currently active, so
// the two always agree regardless of timezone.
export const todayDateParam = () => {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

// The status value the preset filters by.
export const TODAY_OPEN_STATUS = "Open";

interface TodayOpenChipProps {
  // Current status filter value (from the page's query params).
  status?: string;
  // Current follow-up date-range params (from/to, yyyy-MM-dd strings).
  fromDate?: string;
  toDate?: string;
  // Fired on tap with the current active state so the parent can either clear
  // the preset (active) or apply it (inactive).
  onToggle: (active: boolean) => void;
  className?: string;
}

// A quick-filter chip that jumps straight to today's open follow-ups. Tapping it
// clears every other filter and applies status=Open + follow-up date = today.
// Tapping it again (or the ✕) clears the preset back to defaults. Reused across
// all three CRM pages (dashboard, employee, retailer). The chip owns the "active"
// detection: it is active when the passed status/from/to already equal the
// preset (Open + today → today).
const TodayOpenChip = ({
  status,
  fromDate,
  toDate,
  onToggle,
  className,
}: TodayOpenChipProps) => {
  const today = todayDateParam();
  const active =
    status === TODAY_OPEN_STATUS && fromDate === today && toDate === today;

  return (
    <div className={`tw:flex tw:items-center ${className || ""}`}>
      <button
        type="button"
        onClick={() => onToggle(active)}
        aria-pressed={active}
        className={`tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:border tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold tw:transition-colors ${
          active
            ? "tw:border-primary tw:bg-primary tw:text-white tw:shadow-sm"
            : "tw:border-primary/40 tw:bg-primary/5 tw:text-primary tw:hover:bg-primary/10"
        }`}
      >
        <CalendarClock className="tw:h-3.5 tw:w-3.5" />
        Today's Open Follow-ups
        {active && <X className="tw:ml-0.5 tw:h-3.5 tw:w-3.5" />}
      </button>
    </div>
  );
};

export default TodayOpenChip;
