import {
  differenceInCalendarDays,
  format,
  isToday,
  isValid,
  isYesterday,
  parseISO,
} from "date-fns";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import CustomerService from "~/services/CustomerService";
import FranchiseService from "~/services/FranchiseService";

/** Which side of the network a pane block reads from. */
export type DirectoryNetwork = "b2c" | "b2b";

/** What happened on the customer — decides the chip tint and the detail line. */
export type RecentActivityKind = "bill" | "paylater" | "silent" | "new";

export interface RecentActivityItem {
  id: string;
  /** Customer name, the row title. */
  name: string;
  kind: RecentActivityKind;
  /** Two characters inside the chip — initials, or "!!" when they've gone quiet. */
  code: string;
  /** Second line, e.g. "Bill #4821 · +24 coins". */
  detail: string;
  /** ISO date the activity happened on; drives the trailing timestamp. */
  at: string | null;
}

/** No bill in this many days and the customer reads as silent. */
const SILENT_AFTER_DAYS = 30;

/** Flat chip tints, one per activity kind. */
export const ACTIVITY_TONE: Record<RecentActivityKind, string> = {
  bill: "tw:bg-emerald-600 tw:text-white",
  paylater: "tw:bg-violet-500 tw:text-white",
  silent: "tw:bg-red-500 tw:text-white",
  new: "tw:bg-blue-500 tw:text-white",
};

const initialsOf = (name?: string) =>
  (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "??";

/**
 * "Today · 9:41 AM" for the same day, then progressively coarser — the row is
 * narrow, so the label only carries what the date itself doesn't imply.
 */
export const formatActivityTime = (value: string | null | undefined) => {
  if (!value) return "";

  const date = parseISO(value);
  if (!isValid(date)) return "";

  if (isToday(date)) return `Today · ${format(date, "h:mm a")}`;
  if (isYesterday(date)) return "Yesterday";
  return format(date, "dd MMM");
};

const toTime = (value?: string | null) => {
  if (!value) return 0;
  const date = parseISO(value);
  return isValid(date) ? date.getTime() : 0;
};

/**
 * Pull the last order this seller took from the customer. The network payload
 * carries one entry per connected franchise, so we only trust our own.
 */
const lastOrderOf = (customer: any, sellerId?: string | null) => {
  const connected = (customer?.connectedFranchisesList || []).find(
    (franchise: any) => franchise?.id === sellerId,
  );
  return connected?.lastOrderDate || null;
};

/**
 * Turn one customer record into the activity that best describes them right
 * now — an outstanding paylater due wins, then a bill (recent, or old enough to
 * read as silence), and a customer who has never billed shows up as new.
 *
 * Bill numbers and coin deltas only render when the network payload happens to
 * carry them; the b2c endpoint doesn't return them for every seller yet.
 */
export const toActivityItem = (
  customer: any,
  sellerId?: string | null,
): RecentActivityItem => {
  const name = customer?.name || "Unknown";
  const lastOrderDate = lastOrderOf(customer, sellerId);
  const registeredAt =
    customer?.dateOfRegistration || customer?.createdAt || null;
  const due = Number(customer?.payLater?.dueAmount ?? customer?.dueAmount ?? 0);

  if (due > 0) {
    return {
      id: customer?._id,
      name,
      kind: "paylater",
      code: initialsOf(name),
      detail: `Paylater · ${CommonService.formatCompact(due, { style: "short" })} due`,
      at: lastOrderDate || registeredAt,
    };
  }

  if (lastOrderDate) {
    const days = differenceInCalendarDays(new Date(), parseISO(lastOrderDate));

    if (days > SILENT_AFTER_DAYS) {
      return {
        id: customer?._id,
        name,
        kind: "silent",
        code: "!!",
        detail: `Silent · ${days}d`,
        at: lastOrderDate,
      };
    }

    const billNo = customer?.lastOrderId || customer?.lastBillNo;
    const coins = Number(customer?.loyaltyPoints ?? 0);
    return {
      id: customer?._id,
      name,
      kind: "bill",
      code: initialsOf(name),
      detail: [
        `Bill${billNo ? ` #${billNo}` : ""}`,
        coins ? `+${coins} coins` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      at: lastOrderDate,
    };
  }

  return {
    id: customer?._id,
    name,
    kind: "new",
    code: initialsOf(name),
    detail: "New · yet to bill",
    at: registeredAt,
  };
};

/**
 * Latest customer movement for the logged-in seller, newest first. Reads the
 * same b2c network endpoint the directory list uses — there is no dedicated
 * activity feed on the network side — and over-fetches a little so the sort by
 * real activity date still has something to choose from.
 */
export const getRecentActivity = async (limit = 6) => {
  const response = await CustomerService.getCustomerNetwork({
    page: 1,
    limit: Math.max(limit * 3, 20),
    sort: "createdAt",
    order: "desc",
  });

  const sellerId = AuthService.getLoggedInUserId();

  return ((response?.data?.data || []) as any[])
    .map((customer) => toActivityItem(customer, sellerId))
    .sort((a, b) => toTime(b.at) - toTime(a.at))
    .slice(0, limit);
};

/**
 * Same reading of "what happened last" for a retailer. The franchise dashboard
 * row already carries the seller's own order metrics and paylater wallet, so
 * there is no connected-franchise list to pick through.
 */
export const toRetailerActivityItem = (franchise: any): RecentActivityItem => {
  const name = franchise?.name || "Unknown";
  const lastOrderDate = franchise?.lastOrderDate || null;
  const registeredAt = franchise?.createdAt || null;
  const due = Number(
    franchise?.paylater?.totalPayableAmount ??
      franchise?.paylater?.totalAmountUsed ??
      0,
  );

  if (due > 0) {
    return {
      id: franchise?._id,
      name,
      kind: "paylater",
      code: initialsOf(name),
      detail: `Paylater · ${CommonService.formatCompact(due, { style: "short" })} due`,
      at: lastOrderDate || registeredAt,
    };
  }

  if (lastOrderDate) {
    const days = differenceInCalendarDays(new Date(), parseISO(lastOrderDate));

    if (days > SILENT_AFTER_DAYS) {
      return {
        id: franchise?._id,
        name,
        kind: "silent",
        code: "!!",
        detail: `Silent · ${days}d`,
        at: lastOrderDate,
      };
    }

    const orders = Number(
      franchise?.bills ?? franchise?.orderCount ?? franchise?.totalOrders ?? 0,
    );
    return {
      id: franchise?._id,
      name,
      kind: "bill",
      code: initialsOf(name),
      detail: orders ? `Ordered · ${orders} total` : "Ordered",
      at: lastOrderDate,
    };
  }

  return {
    id: franchise?._id,
    name,
    kind: "new",
    code: initialsOf(name),
    detail: "New · yet to order",
    at: registeredAt,
  };
};

/**
 * Latest retailer movement, newest first — the B2B counterpart of
 * {@link getRecentActivity}, on the `franchise/dashboard/franchises` endpoint.
 */
export const getRetailerRecentActivity = async (limit = 6) => {
  const response = await FranchiseService.getFranchiseDashboardList({
    page: 1,
    limit: Math.max(limit * 3, 20),
    sort: "lastOrderDate",
    order: "desc",
    outputType: "list",
  });

  return ((response?.data?.data || []) as any[])
    .map(toRetailerActivityItem)
    .sort((a, b) => toTime(b.at) - toTime(a.at))
    .slice(0, limit);
};

/** Activity feed for whichever side of the network the pane is showing. */
export const getRecentActivityFor = (network: DirectoryNetwork, limit = 6) =>
  network === "b2b"
    ? getRetailerRecentActivity(limit)
    : getRecentActivity(limit);
