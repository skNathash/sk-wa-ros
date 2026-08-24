import { format, isValid, parseISO } from "date-fns";
import { X } from "lucide-react";

interface AppliedFiltersProps {
  // The page's current query params — the single source of truth for what's
  // applied. The employee id param is intentionally ignored (it's page scope,
  // not a filter).
  searchParams: URLSearchParams;
  // Remove one filter: clears the given query param key(s). Date ranges pass
  // both their start and end keys so they drop together.
  onRemove: (keys: string[]) => void;
  // Clear every filter back to defaults.
  onClearAll: () => void;
  className?: string;
}

// One removable pill: what to show and which query params it owns.
interface Chip {
  key: string;
  label: string;
  value: string;
  params: string[];
}

// Friendly labels for the status sentinels the summary tiles / presets set.
const STATUS_LABELS: Record<string, string> = {
  Open: "Pending",
  Overdue: "Overdue",
  InProgress: "In Progress",
  Completed: "Completed",
  Escalated: "Escalated",
};

// Format a yyyy-MM-dd param as "5 Jul"; collapse an identical start/end to a
// single date so a one-day range doesn't read as "5 Jul – 5 Jul".
const formatRange = (from: string, to: string): string => {
  const fromDate = parseISO(from);
  const toDate = parseISO(to);
  if (!isValid(fromDate) || !isValid(toDate)) return "";
  const left = format(fromDate, "d MMM");
  const right = format(toDate, "d MMM");
  return left === right ? left : `${left} – ${right}`;
};

// Derive the active chips from the query params, in a stable, readable order.
const buildChips = (params: URLSearchParams): Chip[] => {
  const chips: Chip[] = [];

  const search = params.get("search");
  if (search) {
    chips.push({ key: "search", label: "Search", value: search, params: ["search"] });
  }

  const status = params.get("status");
  if (status) {
    chips.push({
      key: "status",
      label: "Status",
      value: STATUS_LABELS[status] || status,
      params: ["status"],
    });
  }

  const state = params.get("state");
  if (state) {
    chips.push({ key: "state", label: "State", value: state, params: ["state"] });
  }

  const district = params.get("district");
  if (district) {
    chips.push({
      key: "district",
      label: "District",
      value: district,
      params: ["district"],
    });
  }

  const pincode = params.get("pincode");
  if (pincode) {
    chips.push({ key: "pincode", label: "Pincode", value: pincode, params: ["pincode"] });
  }

  const startDate = params.get("startDate");
  const endDate = params.get("endDate");
  if (startDate && endDate) {
    const value = formatRange(startDate, endDate);
    if (value) {
      chips.push({
        key: "followUp",
        label: "Follow-up",
        value,
        params: ["startDate", "endDate"],
      });
    }
  }

  const createdStart = params.get("createdStartDate");
  const createdEnd = params.get("createdEndDate");
  if (createdStart && createdEnd) {
    const value = formatRange(createdStart, createdEnd);
    if (value) {
      chips.push({
        key: "created",
        label: "Created",
        value,
        params: ["createdStartDate", "createdEndDate"],
      });
    }
  }

  return chips;
};

// A compact summary of every filter currently applied, rendered as removable
// pills. Each pill shows its field name and value; the ✕ clears just that
// filter, and "Clear all" resets them together. Renders nothing when no filter
// is active, so the page stays clean by default.
const AppliedFilters = ({
  searchParams,
  onRemove,
  onClearAll,
  className,
}: AppliedFiltersProps) => {
  const chips = buildChips(searchParams);
  if (!chips.length) return null;

  return (
    <div
      className={`tw:flex tw:flex-wrap tw:items-center tw:gap-2 ${className || ""}`}
    >
      <span className="tw:text-xs tw:font-medium tw:text-gray-500">
        Applied filters
      </span>

      {chips.map((chip) => (
        <span
          key={chip.key}
          className="tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:border tw:border-gray-200 tw:bg-gray-50 tw:py-1 tw:pl-3 tw:pr-1.5 tw:text-xs tw:text-gray-700"
        >
          <span className="tw:text-gray-500">{chip.label}:</span>
          <span className="tw:font-semibold tw:text-gray-800">{chip.value}</span>
          <button
            type="button"
            onClick={() => onRemove(chip.params)}
            aria-label={`Remove ${chip.label} filter`}
            className="tw:flex tw:h-4 tw:w-4 tw:items-center tw:justify-center tw:rounded-full tw:text-gray-400 tw:transition-colors tw:hover:bg-gray-200 tw:hover:text-gray-600"
          >
            <X className="tw:h-3 tw:w-3" />
          </button>
        </span>
      ))}

      <button
        type="button"
        onClick={onClearAll}
        className="tw:text-xs tw:font-semibold tw:text-primary tw:transition-colors tw:hover:underline"
      >
        Clear all
      </button>
    </div>
  );
};

export default AppliedFilters;
