import { Pencil, Receipt } from "lucide-react";
import type { InvoiceInfo } from "../types";

interface InvoiceDetailsProps {
  invoice: InvoiceInfo;
  onEdit?: () => void;
}

const InvoiceDetails = ({ invoice, onEdit }: InvoiceDetailsProps) => {
  const rows: { label: string; value: string; mono?: boolean }[] = [
    { label: "Invoice Date", value: invoice.invoiceDate || "-" },
    { label: "PO No.", value: invoice.poNumber || "-", mono: true },
    { label: "Place of Supply", value: invoice.placeOfSupply || "-" },
    { label: "Reference No.", value: invoice.referenceNumber || "-", mono: true },
  ];

  return (
    <div className="tw:flex tw:flex-col tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white">
      <div className="tw:flex tw:items-center tw:gap-2.5 tw:p-3">
        <div className="tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-amber-50 tw:text-amber-600">
          <Receipt size={16} />
        </div>
        <div className="tw:min-w-0 tw:flex-1">
          <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-gray-400">
            Invoice No.
          </div>
          <div className="tw:text-sm tw:font-semibold tw:leading-snug tw:text-gray-900 tw:wrap-break-word">
            {invoice.invoiceNumber || "-"}
          </div>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="tw:inline-flex tw:shrink-0 tw:items-center tw:gap-1 tw:rounded-md tw:px-2 tw:py-1 tw:text-[11px] tw:font-medium tw:text-gray-500 tw:transition-colors tw:hover:bg-blue-50 tw:hover:text-blue-600"
          >
            <Pencil size={12} />
            Edit
          </button>
        )}
      </div>

      <div className="tw:space-y-1.5 tw:border-t tw:border-gray-100 tw:px-3 tw:py-2.5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="tw:flex tw:items-baseline tw:justify-between tw:gap-3 tw:text-xs"
          >
            <span className="tw:shrink-0 tw:text-gray-500">{row.label}</span>
            <span
              className={`tw:min-w-0 tw:text-right tw:font-medium tw:text-gray-800 tw:break-all ${
                row.mono ? "tw:font-mono" : ""
              }`}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InvoiceDetails;
