import { format } from "date-fns";
import VendorService from "~/services/VendorService";

/**
 * Types + fetch helper for the vendor Money tab.
 *
 * The whole tab is driven by one endpoint — purchase/report/money/vendor/{id}
 * — whose response shape the interfaces below mirror 1:1, so components bind
 * API keys directly. Only the paylater card stays static until the API covers
 * it.
 */

export interface MoneyAlertReference {
  invoiceNo: string;
  refNo: string;
  dueDate: string | null;
  dueAmount: number;
  overdueDays: number;
}

export interface MoneyAlertItem {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  reference: MoneyAlertReference;
  action: { label: string; code: string };
  snoozed: boolean;
}

export interface MoneyAlerts {
  count: number;
  thresholdDays: number;
  items: MoneyAlertItem[];
}

export interface MoneyPaymentPending {
  direction: string;
  mode: string;
  label: string;
  totalDue: number;
  overdueAmount: number;
  dueSoonAmount: number;
  invoiceCount: number;
}

export interface MoneyInvoice {
  invoiceNo: string;
  refNo: string;
  invoiceDate: string;
  dueDate: string | null;
  amount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  overdueDays: number;
  paymentStatus: string;
  orderStatus: string;
}

export interface MoneySummary {
  partyType: string;
  partyId: string;
  partyName: string;
  partyRefId: string;
  currency: string;
  isRealData: boolean;
  truncated: boolean;
  alerts: MoneyAlerts;
  paymentPending: MoneyPaymentPending;
  invoices: MoneyInvoice[];
  totals: { totalDue: number; payableNow: number };
  actions: {
    payAll: { label: string; amount: number; enabled: boolean };
    exportPdf: { label: string; enabled: boolean };
  };
  outputType: string;
}

export interface PayLaterInfo {
  creditLimit: number;
  used: number;
  available: number;
  terms: string;
}

/**
 * Fetches the money summary for a vendor. Returns null on failure so the page
 * can render its empty state.
 */
export async function fetchMoneySummary(
  vendorId: string,
): Promise<MoneySummary | null> {
  try {
    const resp = await VendorService.getMoneySummary(vendorId);
    return resp.data?.data ?? null;
  } catch (error) {
    console.error("Failed to load vendor money summary", error);
    return null;
  }
}

/**
 * Generates the money summary PDF (same endpoint with outputType=download)
 * and returns its download URL, or null on failure.
 */
export async function fetchMoneySummaryPdfUrl(
  vendorId: string,
): Promise<string | null> {
  try {
    const resp = await VendorService.getMoneySummary(vendorId, {
      outputType: "download",
    });
    const fileName = resp.data?.data?.document?.fileName;
    return fileName ? VendorService.moneyReportDownloadUrl(fileName) : null;
  } catch (error) {
    console.error("Failed to generate vendor money summary PDF", error);
    return null;
  }
}

/** "PO003789 · 30 Dec" secondary line for an invoice row. */
export function invoiceMeta(invoice: MoneyInvoice): string {
  return `${invoice.refNo} · ${format(new Date(invoice.invoiceDate), "dd MMM")}`;
}

/** Due label for an invoice row — "Overdue 235d" or "Due 25 Jul". */
export function invoiceDueLabel(invoice: MoneyInvoice): string {
  if (invoice.status === "Overdue") return `Overdue ${invoice.overdueDays}d`;
  if (invoice.dueDate) return `Due ${format(new Date(invoice.dueDate), "dd MMM")}`;
  return invoice.status;
}

/** Paylater credit stays static until the API exposes it. */
export const payLater: PayLaterInfo = {
  creditLimit: 50000,
  used: 12000,
  available: 38000,
  terms: "Net 30 · 0% interest",
};
