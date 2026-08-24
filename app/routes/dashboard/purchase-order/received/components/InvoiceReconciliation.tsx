import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import type { ReceivedSummary } from "../helper";

type Props = {
  poDetails: Record<string, any>;
  summary: ReceivedSummary;
};

type Column = {
  key: string;
  label: string;
  value: ReactNode;
  sub: ReactNode;
  valueClass: string;
};

/**
 * The money side of the receipt: what the vendor billed, what actually landed,
 * what is being claimed back and what is left to pay. The follow-on actions
 * (PO log, next order) live in the page footer.
 */
const InvoiceReconciliation = ({ poDetails, summary }: Props) => {
  const { t } = useTranslation();

  const isSettled = poDetails.paymentStatus === "Paid";

  const paymentSub: ReactNode = poDetails.dueDate ? (
    <>
      {poDetails.paymentStatus || t("pending", { defaultValue: "Pending" })}
      <span className="tw:mx-1 tw:text-slate-300">·</span>
      {t("due", { defaultValue: "due" })}{" "}
      <DateFormat value={poDetails.dueDate} formatStr="dd MMM yyyy" />
    </>
  ) : (
    poDetails.paymentStatus || t("pending", { defaultValue: "Pending" })
  );

  const columns: Column[] = [
    {
      key: "invoice",
      label: t("invoice", { defaultValue: "Invoice" }),
      value: <Amount value={poDetails._invoiceAmount || 0} decimalPlaces={0} />,
      sub: poDetails._invoiceNumber || "-",
      valueClass: "tw:text-slate-900",
    },
    {
      key: "received",
      label: t("received"),
      value: <Amount value={summary.payableAmount} decimalPlaces={0} />,
      sub: t("whatActuallyLanded", { defaultValue: "what actually landed" }),
      valueClass: "tw:text-emerald-700",
    },
    {
      key: "creditNote",
      label: t("creditNote", { defaultValue: "Credit Note" }),
      value: (
        <>
          {summary.creditAmount > 0 && "−"}
          <Amount value={summary.creditAmount} decimalPlaces={0} />
        </>
      ),
      sub:
        poDetails.creditNoteRefNo ||
        (summary.creditAmount > 0
          ? t("toBeClaimed", { defaultValue: "to be claimed" })
          : t("noCredit", { defaultValue: "no credit" })),
      valueClass:
        summary.creditAmount > 0 ? "tw:text-amber-600" : "tw:text-slate-400",
    },
    {
      key: "payable",
      label: t("payable", { defaultValue: "Payable" }),
      value: (
        <Amount
          value={poDetails.payableAmount ?? summary.payableAmount}
          decimalPlaces={0}
        />
      ),
      sub: paymentSub,
      valueClass: "tw:text-emerald-700",
    },
  ];

  return (
    <AppCard className="tw:mt-3 tw:mb-0" noContentPadding>
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:border-b tw:border-slate-100 tw:px-3 tw:py-1.5">
        <h3 className="tw:text-xs tw:font-semibold tw:text-slate-800">
          {t("invoiceReconciliation", {
            defaultValue: "Invoice reconciliation",
          })}
        </h3>
        <AppBadge
          variant={isSettled ? "success" : "warning"}
          size="sm"
          className="tw:uppercase"
        >
          {isSettled
            ? t("settled", { defaultValue: "Settled" })
            : t("unsettled", { defaultValue: "Unsettled" })}
        </AppBadge>
      </div>

      <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-x-3 tw:gap-y-1.5 tw:px-3 tw:py-1.5">
        {columns.map((column) => (
          <div key={column.key} className="tw:min-w-0">
            <div className="tw:text-[9px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-500 tw:leading-tight">
              {column.label}
            </div>
            <div
              className={`tw:text-base tw:font-bold tw:leading-tight ${column.valueClass}`}
            >
              {column.value}
            </div>
            <div className="tw:truncate tw:text-[10px] tw:leading-tight tw:text-slate-500">
              {column.sub}
            </div>
          </div>
        ))}
      </div>
    </AppCard>
  );
};

export default InvoiceReconciliation;
