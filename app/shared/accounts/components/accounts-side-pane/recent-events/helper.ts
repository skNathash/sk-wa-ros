import { format, isToday, isYesterday } from "date-fns";
import AccountService from "~/services/AccountService";
import type { PaginationState } from "~/types/CommonTypes";

/** Direction chips the list filters by, client-side. */
export type EventDirection = "all" | "in" | "out";

/** Badge tones — the fill colour of the square code chip on each row. */
export type EventTone = "in" | "out" | "note" | "expense" | "neutral";

export type RecentEventRow = {
  id: string;
  /** Document the event sits against, e.g. "PO007397". */
  reference: string;
  /** Magnitude only; the sign is printed separately as `sign`. */
  amount: number;
  /** "+" for money in, "−" (minus sign, not a hyphen) for money out. */
  sign: string;
  direction: Exclude<EventDirection, "all">;
  /** Party page the row opens; "#" when the party can't be resolved. */
  link: string;
  /** Two-letter code in the badge — IN / OUT / CN / EX … */
  code: string;
  tone: EventTone;
  /** Second line: party and what the event was. */
  meta: string;
  /** Right-hand line, e.g. "Today · 12:05 PM" or "05 Jul · 09:00 AM". */
  when: string;
};

export const directionChips: { key: EventDirection; label: string }[] = [
  { key: "all", label: "All" },
  { key: "in", label: "Money in" },
  { key: "out", label: "Money out" },
];

/**
 * Badge code + tone for an event. Document-flavoured sources name themselves
 * (CN, DN, EX); payments and anything else lead with the direction, which is
 * the only thing that distinguishes two payments against the same PO.
 */
const badgeFor = (
  sourceType: string,
  direction: Exclude<EventDirection, "all">,
): { code: string; tone: EventTone } => {
  switch (sourceType) {
    case "CREDIT_NOTE":
    case "CN":
      return { code: "CN", tone: "note" };
    case "DEBIT_NOTE":
    case "DN":
      return { code: "DN", tone: "note" };
    case "EXPENSE":
      return { code: "EX", tone: "expense" };
    case "PLATFORM_FEE":
      return { code: "FEE", tone: "expense" };
    case "ADJUSTMENT":
      return { code: "ADJ", tone: "neutral" };
    default:
      return direction === "in"
        ? { code: "IN", tone: "in" }
        : { code: "OUT", tone: "out" };
  }
};

/** "Today · 12:05 PM", "Yesterday · 04:34 PM", "05 Jul · 09:00 AM". */
const whenText = (date: Date) => {
  const day = isToday(date)
    ? "Today"
    : isYesterday(date)
      ? "Yesterday"
      : format(date, "dd MMM");
  return `${day} · ${format(date, "hh:mm a")}`;
};

const metaText = (item: any, sourceLabel: string) =>
  [item?.party?.name, sourceLabel, item?.paymentMethod]
    .filter(Boolean)
    .join(" · ");

const normalise = (item: any): RecentEventRow => {
  const direction =
    String(item?.direction || item?.kind) === "OUT" ? "out" : "in";
  const date = new Date(item?.date);
  const sourceLabel = AccountService.getSourceTypeLabel(item?.sourceType);
  // signedAmount already carries the sign the API intends; `amount` is the
  // magnitude, so it is only the fallback.
  const signed =
    Number(
      item?.signedAmount ??
        (direction === "out" ? -(Number(item?.amount) || 0) : item?.amount),
    ) || 0;

  return {
    id: String(item?.id),
    reference: item?.reference || sourceLabel,
    amount: Math.abs(signed),
    sign: signed < 0 ? "−" : "+",
    direction,
    link: AccountService.preparePartyTypeRedirectionUrl(
      item?.party?.type,
      item?.party?.id,
    ),
    ...badgeFor(String(item?.sourceType || ""), direction),
    meta: metaText(item, sourceLabel),
    when: whenText(date),
  };
};

/**
 * Query for one page of events.
 *
 * The window comes from the header date picker as `startDate` / `endDate`.
 * `direction` is sent along for the endpoint to honour; {@link getData} also
 * enforces it on the returned page, since the chip must hold either way.
 */
export const prepareParams = (
  filters: Record<string, any>,
  pagination: PaginationState,
) => {
  const params: Record<string, any> = {
    type: "recentEvent",
    startDate: filters?.startDate,
    endDate: filters?.endDate,
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    eventLimit: pagination.rowsPerPage,
  };

  if (filters?.direction && filters.direction !== "all") {
    params.direction = String(filters.direction).toUpperCase();
  }

  return params;
};

/** One page of events, newest first. */
export const getData = async (
  params: Record<string, any>,
): Promise<RecentEventRow[]> => {
  const response = await AccountService.getDashboardOverview(params);
  const items: any[] = response?.data?.data || [];
  const rows = items.map(normalise);

  return params?.direction
    ? filterByDirection(
        rows,
        String(params.direction).toLowerCase() as EventDirection,
      )
    : rows;
};

export const getCount = async (params: Record<string, any>) => {
  const { page, count, eventLimit, ...rest } = params || {};
  const response = await AccountService.getDashboardOverview({
    ...rest,
    outputType: "count",
  });
  return (
    Number(response?.data?.data?.count) ||
    Number(response?.data?.data?.total) ||
    Number(response?.data?.count) ||
    0
  );
};

export const filterByDirection = (
  rows: RecentEventRow[],
  direction: EventDirection,
) =>
  direction === "all"
    ? rows
    : rows.filter((row) => row.direction === direction);

/** Header totals over the rows loaded so far, not over the whole window. */
export const sumByDirection = (rows: RecentEventRow[]) => ({
  totalIn: rows
    .filter((row) => row.direction === "in")
    .reduce((sum, row) => sum + row.amount, 0),
  totalOut: rows
    .filter((row) => row.direction === "out")
    .reduce((sum, row) => sum + row.amount, 0),
});

/** Solid badge fill per tone. */
export const toneBadgeClass: Record<EventTone, string> = {
  in: "tw:bg-teal-600",
  out: "tw:bg-red-500",
  note: "tw:bg-violet-500",
  expense: "tw:bg-amber-500",
  neutral: "tw:bg-slate-500",
};

/** Amount colour — money in reads green, everything leaving reads red. */
export const amountClass = (direction: Exclude<EventDirection, "all">) =>
  direction === "in" ? "tw:text-emerald-600" : "tw:text-red-500";
