import PaylaterService from "~/services/PaylaterService";
import type { PaginationState } from "~/types/CommonTypes";

/** The three slices the portfolio dashboard endpoint answers for. */
export type PortfolioType = "outstanding" | "overdue" | "recovered";

export const PORTFOLIO_TYPES: PortfolioType[] = [
  "outstanding",
  "overdue",
  "recovered",
];

export const DEFAULT_TYPE: PortfolioType = "outstanding";

/** URL `type` values are user-editable — fall back rather than query garbage. */
export const normalizeType = (value?: string | null): PortfolioType =>
  PORTFOLIO_TYPES.includes(value as PortfolioType)
    ? (value as PortfolioType)
    : DEFAULT_TYPE;

export const defaultFilter = {
  search: "",
  userType: "All",
};

/** One row of the portfolio list, as the three slices all carry it. */
export interface PortfolioRow {
  _id: string;
  refId: string;
  customerId: string;
  name: string;
  mobile: string;
  /** Raw feed value: "franchise" | "customer". */
  userType: string;
  /** "B2B" / "B2C" — what the badge shows. */
  userCategory: string;
  used: number;
  limit: number;
  available: number;
  usagePercent: number;
  balance: number;
  paid: number;
  dueLabel: string;
  isOverdue: boolean;
  daysPastDue: number;
  daysToDue: number;
  dueDate: string;
  lastActivityAt: string;
  /** The money the active slice is about — what the amount column renders. */
  amount: number;
  /** Network profile of the customer behind the row. */
  userRedirectionLink: string;
}

/** Per-slice labelling, shared by the cards and the list columns. */
export const TYPE_META: Record<
  PortfolioType,
  { label: string; amountLabel: string; amountClassName: string }
> = {
  outstanding: {
    label: "Outstanding",
    amountLabel: "Outstanding",
    amountClassName: "tw:text-violet-600",
  },
  overdue: {
    label: "Overdue",
    amountLabel: "Overdue",
    amountClassName: "tw:text-rose-500",
  },
  recovered: {
    label: "Recovered",
    amountLabel: "Recovered",
    amountClassName: "tw:text-primary",
  },
};

/**
 * Filter + pagination -> the query the portfolio dashboard endpoint takes.
 * `type` drives which slice comes back; `page`/`limit` paginate inside it.
 *
 * Everything else rides in `filter`, keyed the way the endpoint expects:
 * `{"userInfo.name": {"$regex": "^Pra"}, "userInfo.mobile": {"$regex": "^63"},
 * "userInfo.type": "customer"}`. B2C is `customer`, B2B is `franchise`.
 */
export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  type: PortfolioType,
) => {
  const params: Record<string, any> = {
    type,
    page: pagination?.activePage || 1,
    limit: pagination?.rowsPerPage || 10,
    filter: {} as Record<string, any>,
  };

  // One search box, two fields — digits read as a mobile number, the rest as a name.
  // Both go out as anchored regexes, e.g. {"userInfo.name":{"$regex":"^Pranati"}}.
  const search = filter?.search?.trim();
  if (search) {
    const key = /^\d+$/.test(search) ? "userInfo.mobile" : "userInfo.name";
    params.filter[key] = { $regex: `^${search}`, $options: "i" };
  }

  // The feed speaks in user types, the filter in B2B/B2C.
  if (filter?.userType && filter.userType !== "All") {
    params.filter["userInfo.type"] =
      filter.userType === "B2C" ? "customer" : "franchise";
  }

  return params;
};

const toNumber = (value: any) => Number(value) || 0;

/** Which money column the row is listed for — one per slice. */
const amountFor = (raw: Record<string, any>, type: PortfolioType) => {
  if (type === "recovered") return toNumber(raw?.paid);
  return toNumber(raw?.balance ?? raw?.used);
};

const formatRow = (
  raw: Record<string, any>,
  type: PortfolioType,
): PortfolioRow => {
  const userType = raw?.userType || "";
  const userCategory = userType === "customer" ? "B2C" : "B2B";
  const customerId = raw?.customerId || "";

  return {
    _id: raw?._id || raw?.refId || customerId,
    refId: raw?.refId || "",
    customerId,
    name: raw?.name || "-",
    mobile: raw?.mobile || "",
    userType,
    userCategory,
    used: toNumber(raw?.used),
    limit: toNumber(raw?.limit),
    available: toNumber(raw?.available),
    usagePercent: toNumber(raw?.usagePercent),
    balance: toNumber(raw?.balance),
    paid: toNumber(raw?.paid),
    dueLabel: raw?.dueLabel || "",
    isOverdue: Boolean(raw?.isOverdue),
    daysPastDue: toNumber(raw?.daysPastDue),
    daysToDue: toNumber(raw?.daysToDue),
    dueDate: raw?.dueDate || "",
    lastActivityAt: raw?.lastActivityAt || "",
    amount: amountFor(raw, type),
    userRedirectionLink: customerId
      ? `/dashboard/network/view/${userCategory.toLowerCase()}/${customerId}`
      : "",
  };
};

/** One page of the selected slice. */
export const getData = async (
  params: Record<string, any>,
): Promise<PortfolioRow[]> => {
  const response: any = await PaylaterService.getPortfolioDashboard(params);
  const payload = response?.data?.data ?? {};
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  const type = normalizeType(payload?.type || params?.type);
  return rows.map((row: Record<string, any>) => formatRow(row, type));
};

/**
 * Total rows in the slice, for the pagination summary. The list response
 * already carries `total`, so this asks for the cheapest possible page.
 */
export const getCount = async (
  params: Record<string, any>,
): Promise<number> => {
  const response: any = await PaylaterService.getPortfolioDashboard({
    ...params,
    page: 1,
    limit: 1,
  });
  return toNumber(response?.data?.data?.total);
};

/** Money + counts behind the three summary cards. */
export interface PortfolioSummary {
  outstanding: { amount: number; limitIssued: number; utilisationPercent: number };
  overdue: { amount: number; customers: number; avgDaysPastDue: number };
  recovered: { amount: number; wallets: number; period: string };
}

export const EMPTY_SUMMARY: PortfolioSummary = {
  outstanding: { amount: 0, limitIssued: 0, utilisationPercent: 0 },
  overdue: { amount: 0, customers: 0, avgDaysPastDue: 0 },
  recovered: { amount: 0, wallets: 0, period: "" },
};

/**
 * The book-level snapshot — the same untyped portfolio dashboard call the
 * analytics summary tiles read, so both surfaces show the same numbers.
 */
export const getSummary = async (): Promise<PortfolioSummary> => {
  const response: any = await PaylaterService.getPortfolioDashboard();
  const payload = response?.data?.data ?? {};

  return {
    outstanding: {
      amount: toNumber(payload?.outstanding?.amount),
      limitIssued: toNumber(payload?.outstanding?.limitIssued),
      utilisationPercent: toNumber(payload?.outstanding?.utilisationPercent),
    },
    overdue: {
      amount: toNumber(payload?.overdue?.amount),
      customers: toNumber(payload?.overdue?.customers),
      avgDaysPastDue: toNumber(payload?.overdue?.avgDaysPastDue),
    },
    recovered: {
      amount: toNumber(payload?.recovered?.amount),
      wallets: toNumber(payload?.recovered?.wallets),
      period: payload?.recovered?.period || "",
    },
  };
};

/** "LIFETIME" -> "Lifetime" — the period suffix on the recovered card. */
export const formatPeriod = (period: string) =>
  period ? period.charAt(0) + period.slice(1).toLowerCase() : "";

/** First letter of the customer name, for the avatar disc. */
export const getInitial = (name?: string) =>
  (name || "").trim().charAt(0).toUpperCase() || "?";

const AVATAR_TINTS = [
  "tw:bg-violet-500",
  "tw:bg-rose-500",
  "tw:bg-amber-600",
  "tw:bg-sky-600",
  "tw:bg-emerald-600",
  "tw:bg-indigo-500",
];

export const getTint = (name?: string) => {
  const key = (name || "?").charCodeAt(0) || 0;
  return AVATAR_TINTS[key % AVATAR_TINTS.length];
};
