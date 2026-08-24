import { format } from "date-fns";
import AccountService from "~/services/AccountService";
import type { PaginationState } from "~/types/CommonTypes";
import { vendorDecor, type VendorDecor, type VendorTerm } from "../../helper";

/** One open bill, revealed when the vendor row is expanded. */
export type OpenBill = {
  id: string;
  /** Bill / invoice number printed in the expanded row. */
  ref: string;
  /** Purchase order the bill was raised against. */
  poRef: string;
  dateLabel: string;
  amount: number;
  /** Due line, e.g. "due in 4d" or "12d overdue". */
  dueLabel: string;
  overdue: boolean;
};

export type OwedVendor = {
  id: string;
  vendorId?: string;
  vendorRefId?: string;
  vendorName?: string;
  vendorType?: string;
  partyTransactionId?: string;
  paymentMode?: string;
  name: string;
  /** Vendor code shown under the name. */
  code: string;
  phone?: string;
  term: VendorTerm;
  amount: number;
  owes: number;
  entryCount: number;
  billCount: number;
  lastTransactionDate?: string;
  daysSinceLastTransaction?: number;
  nextDueDate?: string;
  daysToDue?: number;
  isOverdue: boolean;
  overdue: boolean;
  /** When the nearest bill falls due, e.g. "in 4d" or "overdue". */
  dueLabel: string;
  link: string;
  bills: OpenBill[];
} & VendorDecor;

export const pageSize = 10;

export const prepareParams = (
  filter: Record<string, any> = {},
  pagination?: PaginationState,
) => {
  const params: Record<string, any> = {
    type: "vendors",
    outputType: "list",
    page: pagination?.activePage || 1,
    limit: pagination?.rowsPerPage || pageSize,
  };

  if (filter.search?.trim()) {
    params.search = filter.search.trim();
  }

  if (filter.startDate) {
    params.startDate = filter.startDate;
  }

  if (filter.endDate) {
    params.endDate = filter.endDate;
  }

  return params;
};

export const prepareparParams = prepareParams;

const getDueLabel = (vendor: any): string => {
  if (vendor.isOverdue) {
    return vendor.daysToDue !== undefined && vendor.daysToDue !== null
      ? `${Math.abs(vendor.daysToDue)}d overdue`
      : "overdue";
  }
  if (vendor.daysToDue !== undefined && vendor.daysToDue !== null) {
    if (vendor.daysToDue === 0) return "due today";
    return `in ${vendor.daysToDue}d`;
  }
  if (vendor.nextDueDate) {
    try {
      return `due ${format(new Date(vendor.nextDueDate), "dd MMM")}`;
    } catch {
      return vendor.nextDueDate;
    }
  }
  return "-";
};

export const formatVendor = (vendor: any): OwedVendor => {
  const name = vendor.vendorName || vendor.name || "";
  const code = vendor.vendorRefId ? `#${vendor.vendorRefId}` : vendor.code || "";
  const amount = vendor.amount ?? vendor.owes ?? 0;
  const isOverdue = Boolean(vendor.isOverdue);
  const term = (vendor.term as VendorTerm) || "COD";
  const vendorId = vendor.vendorId || vendor._id || vendor.id || "";
  const entryCount = vendor.entryCount ?? vendor.billCount ?? 0;

  return {
    id: vendor.partyTransactionId || vendorId || vendor.vendorRefId || String(Math.random()),
    vendorId,
    vendorRefId: vendor.vendorRefId,
    vendorName: name,
    vendorType: vendor.vendorType || "vendor",
    partyTransactionId: vendor.partyTransactionId,
    paymentMode: vendor.paymentMode,
    name,
    code,
    phone:
      vendor.phone ||
      (vendor.daysSinceLastTransaction !== undefined
        ? `${vendor.daysSinceLastTransaction}d ago`
        : ""),
    term,
    amount,
    owes: amount,
    entryCount,
    billCount: entryCount,
    lastTransactionDate: vendor.lastTransactionDate,
    daysSinceLastTransaction: vendor.daysSinceLastTransaction,
    nextDueDate: vendor.nextDueDate,
    daysToDue: vendor.daysToDue,
    isOverdue,
    overdue: isOverdue,
    dueLabel: getDueLabel(vendor),
    link: AccountService.preparePartyTypeRedirectionUrl(
      vendor.vendorType || "vendor",
      vendorId,
    ),
    bills: Array.isArray(vendor.bills) ? vendor.bills : [],
    ...vendorDecor(name),
  };
};

export const getData = async (
  params: Record<string, any>,
): Promise<OwedVendor[]> => {
  const response = await AccountService.getMoneyOutDashboard({
    ...params,
    type: "vendors",
    outputType: "list",
  });

  const data = Array.isArray(response?.data)
    ? response.data
    : response?.data?.data || [];

  return Array.isArray(data) ? data.map(formatVendor) : [];
};

export const getCount = async (
  params: Record<string, any>,
): Promise<number> => {
  const response = await AccountService.getMoneyOutDashboard({
    ...params,
    type: "vendors",
    outputType: "count",
  });

  const total =
    response?.data?.data?.pagination?.total ??
    response?.data?.pagination?.total ??
    response?.data?.total ??
    response?.data?.count ??
    (typeof response?.data?.data === "number" ? response.data.data : 0);

  return total || 0;
};
