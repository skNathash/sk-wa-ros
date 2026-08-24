import { isToday, isValid } from "date-fns";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import TimelineService from "~/services/TimelineService";
import type { PaginationState } from "~/types/CommonTypes";

/** The slices the timeline can be filtered down to. */
export type TimelineFilter =
  | "All"
  | "Bills"
  | "Coins"
  | "Paylater"
  | "Notifications";

/** What happened — decides the row's icon and tint. */
export type TimelineKind =
  | "bill"
  | "coins"
  | "paylater"
  | "notification"
  | "offer";

export interface TimelineEvent {
  id: string;
  /** Raw event timestamp — the rail renders it through `<DateFormat>`. */
  when: string | null;
  /** date-fns pattern for `when`: "TODAY · 9:41 AM" on the day, else "12 Jul". */
  whenFormat: string;
  kind: TimelineKind;
  title: string;
  subtitle: string;
  /**
   * Money rows carry the raw signed figure so the row can render `<Amount>`;
   * it is undefined on coin and status rows, which use `value` instead.
   */
  amount?: number;
  /** Right-hand figure for non-money rows — coins or a status word. */
  value: string;
  isNegative?: boolean;
}

/** `transaction.transactionType` (or `referenceType`) → the row's kind. */
const KIND_BY_TYPE: Record<string, TimelineKind> = {
  order: "bill",
  bill: "bill",
  sale: "bill",
  invoice: "bill",
  return: "bill",
  payment: "paylater",
  paylater: "paylater",
  credit: "paylater",
  cn: "paylater",
  dn: "paylater",
  loyalty: "coins",
  coin: "coins",
  coins: "coins",
  points: "coins",
  notification: "notification",
  reminder: "notification",
  offer: "offer",
  coupon: "offer",
};

/** Which `transaction.transactionType` values each chip asks for. */
const TYPES_BY_FILTER: Record<Exclude<TimelineFilter, "All">, string[]> = {
  Bills: ["ORDER", "RETURN"],
  Coins: ["LOYALTY", "COIN"],
  Paylater: ["PAYMENT", "PAYLATER", "CREDIT"],
  Notifications: ["NOTIFICATION"],
};

/** Sub-types that take value *out* of the customer's pocket-facing figure. */
const NEGATIVE_SUB_TYPES = ["REDEEM", "REFUND", "RETURN", "EXPIRED", "DEBIT"];

/** The row's headline word, before the reference number is appended. */
const LABEL_BY_KIND: Record<TimelineKind, string> = {
  bill: "Bill",
  coins: "Coins",
  paylater: "Paylater",
  notification: "Notification",
  offer: "Offer",
};

const kindOf = (type: string): TimelineKind =>
  KIND_BY_TYPE[String(type || "").toLowerCase()] || "bill";

/** "TODAY · 9:41 AM" on the day itself, then just the date. */
const whenFormatFor = (date: Date | null) =>
  date && isValid(date) && isToday(date) ? "'TODAY ·' h:mm a" : "dd MMM";

const mapEvents = (items: any[]): TimelineEvent[] =>
  (items ?? []).map((item: any, index: number) => {
    const txn = item?.transaction ?? {};
    const amount = Number(txn?.amount) || 0;
    const coins = Number(txn?.coins) || 0;
    const eventDate = item?.createdAt ? new Date(item.createdAt) : null;
    const kind = kindOf(txn?.transactionType || item?.referenceType);
    const refNo = txn?.transactionReference?.refNo;
    const isNegative =
      amount < 0 ||
      coins < 0 ||
      NEGATIVE_SUB_TYPES.includes(String(txn?.subType || "").toUpperCase());

    // Coins rows read as coin movement; money rows hand the raw figure to
    // `<Amount>`. A row with neither (a notification, say) falls back to its
    // status word.
    const isMoney = !(kind === "coins" && coins) && !!amount;
    const value =
      kind === "coins" && coins
        ? `${isNegative ? "-" : "+"}${CommonService.commaSeparated(Math.abs(coins))} c`
        : isMoney
          ? ""
          : (txn?.status ?? item?.status ?? "");

    return {
      id: String(item?._id ?? index),
      when: item?.createdAt ?? null,
      whenFormat: whenFormatFor(eventDate),
      kind,
      title: refNo ? `${LABEL_BY_KIND[kind]} · ${refNo}` : LABEL_BY_KIND[kind],
      subtitle: item?.description || item?.remarks || txn?.instrument || "",
      // Unsigned — `isNegative` carries the sign so `<Amount>` keeps "₹" first.
      amount: isMoney ? Math.abs(amount) : undefined,
      value,
      isNegative,
    };
  });

export const prepareParams = (
  filters: Record<string, any>,
  pagination: PaginationState,
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    sort: { createdAt: -1 },
    filter: {
      // The store side of the feed is the same id every franchise-scoped list
      // filters by (`franchiseInfo.id`), not `user.franchiseId`.
      "fromUserInfo.userId": AuthService.getLoggedInUserId(),
      "fromUserInfo.userType": "Franchise",
      "toUserInfo.userId": filters?.customerId,
      "toUserInfo.userType": "Customer",
    },
  };

  if (filters?.eventFilter && filters.eventFilter !== "All") {
    params.filter["transaction.transactionType"] = {
      $in: TYPES_BY_FILTER[filters.eventFilter as Exclude<TimelineFilter, "All">],
    };
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  const response = await TimelineService.getList(params);
  const payload: any = response?.data?.data;
  const items = Array.isArray(payload) ? payload : (payload?.list ?? []);

  if (response?.statusCode !== 200) {
    console.error("Timeline list failed:", response?.statusCode, response?.data);
  }

  return mapEvents(items);
};

export const getCount = async (params: Record<string, any>) =>
  TimelineService.getCount(params);
