import { format, startOfMonth } from "date-fns";
import AccountService from "~/services/AccountService";
import type { PaginationState } from "~/types/CommonTypes";

export type Collection = {
  id: string;
  /** Left column, e.g. "13 Aug · 02:30 PM". */
  dateLabel: string;
  /** Who the money came from. */
  party: string;
  /** What the payer is to the shop — Customer, Retailer, Vendor. */
  partyTypeLabel: string;
  /** Payer's party page — b2b, b2c or vendor, resolved from the type. */
  link: string;
  /** The receipt's own note, printed under the party. */
  description: string;
  /** Document the receipt was raised against, e.g. the order id. */
  reference: string;
  /** How the money was taken — CASH, UPI, BANK TRANSFER. */
  mode: string;
  amount: number;
  /** Ledger id for the entry, shown when the row opens. */
  transactionId: string;
  /** Gateway / instrument reference, shown when the row opens. */
  paymentReference: string;
  /** Channel the receipt arrived through, e.g. COD. */
  paymentMode: string;
  /** Counter or staff the money was taken at. */
  receivedBy: string;
};

/** Receipts read per request; the feed grows a page at a time. */
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
  type: "receipts",
  startDate: filter.startDate,
  endDate: filter.endDate,
  page: pagination.activePage,
  limit: pagination.rowsPerPage,
});

const formatReceipt = (receipt: any): Collection => ({
  id: receipt.transactionId,
  dateLabel: format(new Date(receipt.receivedAt), "dd MMM · hh:mm a"),
  party: receipt.payer.name,
  partyTypeLabel: AccountService.getPartyTypeLabel(receipt.payer.type),
  link: AccountService.preparePartyTypeRedirectionUrl(
    receipt.payer.type,
    receipt.payer.id,
  ),
  description: receipt.description,
  reference: receipt.sourceReference,
  mode: receipt.paymentMethod.replace(/_/g, " ").toUpperCase(),
  amount: receipt.amount,
  transactionId: receipt.transactionId,
  paymentReference: receipt.paymentReference,
  paymentMode: receipt.paymentMode,
  receivedBy: receipt.receivedBy.name,
});

export const getData = async (
  params: Record<string, any>,
): Promise<Collection[]> => {
  const response = await AccountService.getMoneyInDashboard(params);
  const receipts = response?.data?.data?.receipts?.receipts || [];

  return receipts.map(formatReceipt);
};

/**
 * The endpoint carries the count in the same payload as the list, so the count
 * is read from a single-row page rather than a dedicated count call.
 */
export const getCount = async (
  params: Record<string, any>,
): Promise<number> => {
  const response = await AccountService.getMoneyInDashboard({
    ...params,
    page: 1,
    limit: 1,
  });

  return response?.data?.data?.receipts?.pagination?.total || 0;
};
