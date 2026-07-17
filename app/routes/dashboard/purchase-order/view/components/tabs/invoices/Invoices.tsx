import { FileText } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import NoData from "~/components/core/no-data/NoData";
import InvoiceDownload from "~/shared/orders/invoice-download/InvoiceDownload";

const Invoices = ({ invoices }: { invoices: any[] }) => {
  if (!invoices?.length) {
    return <NoData />;
  }

  return (
    <div className="tw:space-y-4">
      {invoices.map((invoice, index) => {
        const invoiceId = invoice.invoiceId;
        const invoiceDocumentId = invoice.invoiceDocumentId;

        return (
          <AppCard key={invoiceId || index} className="tw:p-4">
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-4">
              <div className="tw:flex tw:items-center tw:gap-3 tw:flex-1">
                <div className="tw:flex tw:items-center tw:justify-center tw:w-10 tw:h-10 tw:bg-blue-50 tw:rounded-lg">
                  <FileText className="tw:w-5 tw:h-5 tw:text-blue-600" />
                </div>
                <div className="tw:flex-1">
                  <div className="tw:font-semibold tw:text-gray-900">
                    {invoiceId || `Invoice ${index + 1}`}
                  </div>
                </div>
              </div>
              <div className="tw:flex tw:items-center tw:gap-2">
                <InvoiceDownload
                  invoiceNo={invoiceId}
                  invoiceDocumentId={invoiceDocumentId}
                />
              </div>
            </div>
          </AppCard>
        );
      })}
    </div>
  );
};

export default Invoices;
