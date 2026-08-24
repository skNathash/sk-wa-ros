import { format } from "date-fns";
import AccountService from "~/services/AccountService";
import { tileDecor, type TileDecor } from "~/components/core/tint/tints";
import type { PaginationState } from "~/types/CommonTypes";

/** Which side of the book the list is read for. */
export type PartyVariant = "payers" | "vendors";

/** Small pill after the name — the relationship the party sits in. */
export type PartyTag =
  | "B2C"
  | "B2B"
  | "PL"
  | "COD"
  | "7-DAY"
  | "15-DAY"
  | "30-DAY"
  | "45-DAY";

/** One line inside an expanded row: a label with either text or an amount. */
export type PartyDetail = {
  label: string;
  value?: string;
  amount?: number;
};

export type PartyRow = {
  id: string;
  name: string;
  /** Line under the name — mobile / vendor code plus the last activity. */
  meta: string;
  /** Mobile number, rendered with a phone icon when present. */
  mobile?: string;
  tags: PartyTag[];
  amount: number;
  /** Trailing status line: "to collect", "in 4d", "overdue", "settled". */
  status: string;
  statusTone: "muted" | "in" | "out";
  /** Party page the row opens; "#" when the type has no page. */
  link: string;
  /** Rows revealed when the party is expanded. */
  details: PartyDetail[];
} & TileDecor;

export const statusToneClass: Record<PartyRow["statusTone"], string> = {
  muted: "tw:text-gray-500",
  in: "tw:text-green-700",
  out: "tw:text-red-600",
};

export const tagClass: Record<PartyTag, string> = {
  B2C: "tw:bg-blue-50 tw:text-blue-700 tw:border-blue-200",
  B2B: "tw:bg-emerald-50 tw:text-emerald-700 tw:border-emerald-200",
  PL: "tw:bg-orange-50 tw:text-orange-700 tw:border-orange-200",
  COD: "tw:bg-amber-50 tw:text-amber-700 tw:border-amber-200",
  "7-DAY": "tw:bg-amber-50 tw:text-amber-700 tw:border-amber-200",
  "15-DAY": "tw:bg-amber-50 tw:text-amber-700 tw:border-amber-200",
  "30-DAY": "tw:bg-amber-50 tw:text-amber-700 tw:border-amber-200",
  "45-DAY": "tw:bg-amber-50 tw:text-amber-700 tw:border-amber-200",
};

/** Parties read per request; the list grows a page at a time. */
export const pageSize = 10;

const dateLabel = (value?: string) => {
  if (!value) return "";
  try {
    return format(new Date(value), "dd MMM");
  } catch {
    return "";
  }
};

/**
 * Both lists ride the same dashboard endpoints the money-in / money-out pages
 * use — `who_owes` for the parties who owe the shop, `vendors` for the bills
 * the shop owes — so the pane never diverges from those pages.
 */
export const prepareParams = (
  variant: PartyVariant,
  pagination: PaginationState,
): Record<string, any> =>
  variant === "payers"
    ? {
        type: "who_owes",
        lane: "all",
        page: pagination.activePage,
        limit: pagination.rowsPerPage,
      }
    : {
        type: "vendors",
        outputType: "list",
        page: pagination.activePage,
        limit: pagination.rowsPerPage,
      };

/**
 * Party who owes the shop — money-in's `who_owes` row folded to a pane row.
 * Row shape: `{ party: { type, id, refId, name, mobile }, lane,
 * partyTransactionId, openInvoices, owes, oldestInvoiceDate, oldestDays,
 * isOverdue, isPaylater, lastTransactionDate }`.
 */
const formatPayer = (party: any): PartyRow => {
  const info = party.party;
  const overdue = Boolean(party.isOverdue);
  /* Parties carrying a balance with nothing open — an advance or an
     adjustment — have no age to print. */
  const ageLabel = party.oldestInvoiceDate
    ? `${party.oldestDays}d ${overdue ? "overdue" : "ago"}`
    : "";

  const tags: PartyTag[] = [party.lane === "B2B" ? "B2B" : "B2C"];
  if (party.isPaylater) tags.push("PL");

  const details: PartyDetail[] = [
    { label: "Open invoices", value: String(party.openInvoices) },
    { label: "Type", value: AccountService.getPartyTypeLabel(info.type) },
  ];
  if (ageLabel) details.push({ label: "Oldest invoice", value: ageLabel });
  if (party.lastTransactionDate)
    details.push({
      label: "Last transaction",
      value: dateLabel(party.lastTransactionDate),
    });

  return {
    id: party.partyTransactionId,
    name: info.name,
    mobile: info.mobile,
    meta: ageLabel,
    tags,
    amount: party.owes,
    status: overdue ? "overdue" : "to collect",
    statusTone: overdue ? "out" : "in",
    link: AccountService.preparePartyTypeRedirectionUrl(info.type, info.id),
    details,
    ...tileDecor(info.name),
  };
};

/**
 * Nearest-due line for a vendor, same reading as the money-out list.
 * `daysToDue` / `nextDueDate` are null for terms with no schedule (COD).
 */
const vendorDueLabel = (vendor: any): string => {
  if (vendor.daysToDue === null)
    return vendor.isOverdue
      ? "overdue"
      : vendor.nextDueDate
        ? `due ${dateLabel(vendor.nextDueDate)}`
        : "";
  if (vendor.isOverdue) return `${Math.abs(vendor.daysToDue)}d overdue`;
  return vendor.daysToDue === 0 ? "due today" : `in ${vendor.daysToDue}d`;
};

/**
 * Vendor the shop owes — money-out's `vendors` row folded to a pane row.
 * Row shape: `{ vendorId, vendorRefId, vendorName, vendorType, vendorMobile,
 * partyTransactionId, paymentMode, term, amount, entryCount,
 * lastTransactionDate, daysSinceLastTransaction, nextDueDate, daysToDue,
 * isOverdue }`.
 */
const formatVendor = (vendor: any): PartyRow => {
  const overdue = Boolean(vendor.isOverdue);
  const due = vendorDueLabel(vendor);
  const settled = vendor.amount <= 0;

  const details: PartyDetail[] = [
    { label: "Open bills", value: String(vendor.entryCount) },
  ];
  if (vendor.nextDueDate)
    details.push({ label: "Next due", value: dateLabel(vendor.nextDueDate) });
  if (vendor.lastTransactionDate)
    details.push({
      label: "Last transaction",
      value: `${dateLabel(vendor.lastTransactionDate)} · ${vendor.daysSinceLastTransaction}d ago`,
    });

  return {
    id: vendor.partyTransactionId,
    name: vendor.vendorName,
    mobile: vendor.vendorMobile,
    meta: [`#${vendor.vendorRefId}`, `${vendor.entryCount} open`].join(" · "),
    tags: [vendor.term as PartyTag],
    amount: vendor.amount,
    status: settled ? "settled" : due || "to pay",
    statusTone: overdue ? "out" : settled ? "muted" : "in",
    link: AccountService.preparePartyTypeRedirectionUrl(
      vendor.vendorType,
      vendor.vendorId,
    ),
    details,
    ...tileDecor(vendor.vendorName),
  };
};

export const getParties = async (
  variant: PartyVariant,
  params: Record<string, any>,
): Promise<PartyRow[]> => {
  if (variant === "payers") {
    const response = await AccountService.getMoneyInDashboard(params);
    const parties = response?.data?.data?.who_owes?.parties || [];
    return parties.map(formatPayer);
  }

  const response = await AccountService.getMoneyOutDashboard(params);
  const vendors = Array.isArray(response?.data)
    ? response.data
    : response?.data?.data || [];

  return Array.isArray(vendors) ? vendors.map(formatVendor) : [];
};

export const getCount = async (
  variant: PartyVariant,
  params: Record<string, any>,
): Promise<number> => {
  if (variant === "payers") {
    const response = await AccountService.getMoneyInDashboard({
      ...params,
      outputType: "count",
    });
    return response?.data?.data?.count || 0;
  }

  const response = await AccountService.getMoneyOutDashboard({
    ...params,
    outputType: "count",
  });

  return response?.data?.data?.count || 0;
};
