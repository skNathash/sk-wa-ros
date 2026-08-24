import { format, startOfMonth } from "date-fns";
import AccountService from "~/services/AccountService";
import type { PaginationState } from "~/types/CommonTypes";

export type Payment = {
  id: string;
  /** Left column, e.g. "09 Aug · 11:02 AM". */
  dateLabel: string;
  /** Who the money went to. */
  vendor: string;
  /** What the payee is to the shop — Vendor, Retailer, Customer. */
  vendorTypeLabel: string;
  /** Payee's party page — vendor, b2b or b2c, resolved from the type. */
  link: string;
  /** The payment's own note, printed under the vendor. */
  description: string;
  /** Document the payment was raised against, e.g. the PO / voucher number. */
  reference: string;
  /** How the money went out — CASH, UPI, BANK TRANSFER. */
  mode: string;
  amount: number;
  /** Ledger id for the entry, shown when the row opens. */
  transactionId: string;
  /** Gateway / instrument reference, shown when the row opens. */
  paymentReference: string;
  /** Channel the payment went through, e.g. PAYLATER. */
  paymentMode: string;
  /** Outlet or staff the money was paid by. */
  paidBy: string;
};

/** Payments read per request; the feed grows a page at a time. */
export const pageSize = 10;

/** Range the feed opens on — this month to date, in the API's date format. */
export const defaultRange = {
  startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
) => ({
  type: "payments",
  outputType: "list",
  startDate: filter.startDate,
  endDate: filter.endDate,
  page: pagination.activePage,
  limit: pagination.rowsPerPage,
});

const formatPayment = (payment: any): Payment => ({
  id: payment.transactionId,
  dateLabel: format(
    new Date(payment.paidAt || payment.transactionDate),
    "dd MMM · hh:mm a",
  ),
  vendor: payment.vendor?.name || "",
  vendorTypeLabel: AccountService.getPartyTypeLabel(payment.vendor?.type || ""),
  link: AccountService.preparePartyTypeRedirectionUrl(
    payment.vendor?.type || "",
    payment.vendor?.id || "",
  ),
  description: payment.description || "",
  reference: payment.sourceReference || "",
  mode: (payment.paymentMethod || "").replace(/_/g, " ").toUpperCase(),
  amount: payment.amount || 0,
  transactionId: payment.transactionId,
  paymentReference: payment.paymentReference || "-",
  paymentMode: payment.paymentMode || "-",
  paidBy: payment.paidBy?.name || "-",
});

/**
 * The list lands either straight on `data` or wrapped a level deeper, so both
 * shapes are unwrapped before the rows are formatted.
 */
const readList = (response: any): any[] => {
  const data = response?.data?.data ?? response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.payments)) return data.payments;
  if (Array.isArray(data?.payments?.payments)) return data.payments.payments;

  return [];
};

export const getData = async (
  params: Record<string, any>,
): Promise<Payment[]> => {
  const response = await AccountService.getMoneyOutDashboard(params);

  return readList(response).map(formatPayment);
};

export const getCount = async (
  params: Record<string, any>,
): Promise<number> => {
  const response = await AccountService.getMoneyOutDashboard({
    ...params,
    outputType: "count",
  });

  const data = response?.data?.data ?? response?.data;

  return (
    (typeof data === "number" ? data : 0) ||
    data?.pagination?.total ||
    data?.total ||
    data?.count ||
    0
  );
};
