import { ArrowRight } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import {
  invoiceDueLabel,
  invoiceMeta,
  type MoneyInvoice,
  type MoneyPaymentPending,
} from "../helper";

interface PaymentPendingProps {
  pending: MoneyPaymentPending;
  invoices: MoneyInvoice[];
  onPayAll?: () => void;
  onPay?: (invoice: MoneyInvoice) => void;
}

/**
 * Payables the retailer owes the vendor (YOU → VENDOR). A total-due header
 * with a "Pay all" action, followed by a per-invoice list each with its own
 * "Pay" button. Overdue rows flag the amount in red. Bound directly to the
 * money summary API's paymentPending block and invoice list.
 */
const PaymentPending: React.FC<PaymentPendingProps> = ({
  pending,
  invoices,
  onPayAll,
  onPay,
}) => {
  return (
    <div>
      <div className="tw:mb-2 tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
        <span>💸</span>
        <span>
          Payment pending · You <ArrowRight className="tw:inline tw:size-3" />{" "}
          Vendor
        </span>
      </div>

      <div className="tw:overflow-hidden tw:rounded-2xl tw:border-t-4 tw:border-red-400 tw:bg-white tw:shadow-sm">
        {/* Total due header */}
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:p-4">
          <div className="tw:flex tw:flex-col">
            <span className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
              Total due
            </span>
            <span className="tw:text-2xl tw:font-bold tw:text-red-500">
              <Amount value={pending.totalDue} decimalPlaces={0} />
            </span>
          </div>
          {/* <AppButton color="primary" size="small" onClick={onPayAll}>
            Pay all
          </AppButton> */}
        </div>

        {/* Per-invoice list — 2-col on desktop, stacked on mobile */}
        <ul className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:border-t tw:border-slate-100">
          {invoices.map((invoice) => (
            <li
              key={invoice.invoiceNo}
              className="tw:flex tw:items-center tw:gap-3 tw:border-b tw:border-slate-100 tw:px-4 tw:py-3 tw:md:odd:border-r"
            >
              <div className="tw:min-w-0 tw:flex-1">
                <div className="tw:text-sm tw:font-semibold tw:text-slate-800">
                  {invoice.invoiceNo}
                </div>
                <div className="tw:mt-0.5 tw:text-xs tw:text-slate-400">
                  {invoiceMeta(invoice)}
                </div>
              </div>

              <div className="tw:flex tw:flex-col tw:items-end">
                <span className="tw:text-sm tw:font-bold tw:text-slate-800">
                  <Amount value={invoice.dueAmount} decimalPlaces={0} />
                </span>
                <span
                  className={`tw:text-[11px] tw:font-medium ${
                    invoice.status === "Overdue"
                      ? "tw:text-red-500"
                      : "tw:text-slate-400"
                  }`}
                >
                  {invoiceDueLabel(invoice)}
                </span>
              </div>

              {/* <AppButton
                color="primary"
                fill="outline"
                size="small"
                onClick={() => onPay?.(invoice)}
              >
                Pay
              </AppButton> */}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PaymentPending;
