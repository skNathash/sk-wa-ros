import AuthService from "~/services/AuthService";
import RackBinService from "~/services/RackBinService";
import { startOfDay, endOfDay, format, isToday, isYesterday } from "date-fns";

export type ActionTone =
  | "in"
  | "out"
  | "move"
  | "price"
  | "audit"
  | "neutral"
  | "warn";

/**
 * Every action the log endpoint emits, in the order the filter chips show them.
 * `filterLabel` names the action in the chip row, `label` is the short tag the
 * timeline row wears, and `tone` colours it. This is the only place an action
 * is interpreted — no guessing from quantities or free text elsewhere.
 */
export const ACTION_META: Record<
  string,
  { filterLabel: string; label: string; tone: ActionTone }
> = {
  ITEM_ADD: { filterLabel: "Item added", label: "IN", tone: "in" },
  ITEM_REMOVE: { filterLabel: "Item removed", label: "OUT", tone: "out" },
  ITEM_UPDATE: { filterLabel: "Item updated", label: "UPDATE", tone: "neutral" },
  STOCK_MOVEMENT: {
    filterLabel: "Stock movement",
    label: "MOVE",
    tone: "move",
  },
  STOCK_ADJUSTMENT: {
    filterLabel: "Stock adjustment",
    label: "AUDIT",
    tone: "audit",
  },
  PRICE_CHANGE: { filterLabel: "Price change", label: "PRICE", tone: "price" },
  STATUS_CHANGE: {
    filterLabel: "Status change",
    label: "STATUS",
    tone: "neutral",
  },
  CAPACITY_CHANGE: {
    filterLabel: "Capacity change",
    label: "CAPACITY",
    tone: "neutral",
  },
  MAINTENANCE_START: {
    filterLabel: "Maintenance start",
    label: "MAINTENANCE",
    tone: "warn",
  },
  MAINTENANCE_END: {
    filterLabel: "Maintenance end",
    label: "MAINTENANCE",
    tone: "warn",
  },
  CREATE: { filterLabel: "Created", label: "CREATED", tone: "neutral" },
  UPDATE: { filterLabel: "Updated", label: "UPDATED", tone: "neutral" },
  DELETE: { filterLabel: "Deleted", label: "DELETED", tone: "out" },
};

/** Chip row options — derived so the filters and the row tags stay in step. */
export const ACTION_FILTERS: { value: string; label: string }[] = [
  { value: "All", label: "All" },
  ...Object.entries(ACTION_META).map(([value, meta]) => ({
    value,
    label: meta.filterLabel,
  })),
];

/** Short tag + tone for a log row. Unknown actions fall back to the raw value. */
export const actionMeta = (action: string) =>
  ACTION_META[String(action || "").toUpperCase()] || {
    filterLabel: action || "",
    label: String(action || "").replace(/_/g, " ") || "—",
    tone: "neutral" as ActionTone,
  };

/** One `{ date, logs }` bucket as the API returns it. */
export interface ActivityGroup {
  date: string;
  logs: any[];
}

// Prepare params for API/data filtering
export const prepareParams = (
  filter: Record<string, any>,
  pagination: { activePage: number; rowsPerPage: number },
  sort: { key: string; value: "asc" | "desc" }
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    // The API buckets the logs by day for us, so the timeline renders the
    // response as-is instead of regrouping it client side.
    groupBy: "date",
    filter: {},
  };

  const search = filter.search?.trim();
  if (search) {
    // Pass title search as top-level `search` param
    params.search = search;
  }

  if (filter.action && filter.action !== "All") {
    params.action = filter.action;
  }

  if (filter.user && filter.user !== "All") {
    params.filter.user = filter.user;
  }

  if (filter.dateRange && filter.dateRange.length > 0) {
    // Expose date range as top-level startDate/endDate (ISO strings)
    params.startDate = startOfDay(new Date(filter.dateRange[0])).toISOString();
    params.endDate = endOfDay(new Date(filter.dateRange[1])).toISOString();
  }

  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  return params;
};

// Returns a promise that resolves to the day buckets for the current page
export async function getData(
  params: Record<string, any>,
  binId: string
): Promise<ActivityGroup[]> {
  const response = await RackBinService.getBinLogs(
    AuthService.getLoggedInUserId() || "",
    binId,
    params
  );
  return response.data?.data || [];
}

// Returns a promise that resolves to the count of filtered activity logs
export async function getCount(
  params: Record<string, any>,
  binId: string
): Promise<number> {
  // Use the same API as getData, but request count output and remove pagination
  const countParams: Record<string, any> = { ...params };
  delete countParams.page;
  delete countParams.count;
  delete countParams.groupBy;
  countParams.outputType = "count";

  const response = await RackBinService.getBinLogs(
    AuthService.getLoggedInUserId() || "",
    binId,
    countParams
  );
  return response?.data?.data || 0;
}

/** Day heading for a bucket — `Today · Wed 17 Jul`. */
export const groupLabel = (value: string) => {
  const day = value ? new Date(value) : null;
  if (!day || Number.isNaN(day.getTime())) return "Earlier";
  const prefix = isToday(day) ? "Today · " : isYesterday(day) ? "Yesterday · " : "";
  return `${prefix}${format(day, "EEE d MMM")}`;
};

/** Total rows across every day bucket — what pagination counts. */
export const countLogs = (groups: ActivityGroup[]) =>
  groups.reduce((sum, group) => sum + (group.logs?.length || 0), 0);
