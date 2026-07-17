import { FileDown } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import useScreenView from "~/hooks/useScreenView";
import CommonService from "~/services/CommonService";
import PrintReceipt from "~/shared/orders/print-receipt/PrintReceipt";

const Invoices = ({
  invoices,
  className,
  orderType,
  orderId,
}: {
  invoices: any[];
  className?: string;
  orderType?: string;
  orderId?: string;
}) => {
  const { t } = useTranslation(["common"]);

  const { isMobile } = useScreenView();

  const [busyloader, setBusyloader] = useState(false);

  const handleDownloadInvoice = (invoice: any) => {
    const invoiceDocumentId = invoice.invoiceDocumentId;
    if (invoiceDocumentId) {
      // Use common service to download/open the asset similar to pick list download
      CommonService.assetDownload(invoiceDocumentId);
    }
  };

  const handlePrintInvoice = () => {};

  return (
    <>
      <div
        className={`tw:border tw:green-blue-500 tw:rounded-lg tw:p-4 tw:mb-4 tw:bg-green-50 ${className}`}
      >
        <div className="tw:font-semibold tw:text-base tw:text-green-900 tw:mb-2">
          {t("invoiceGenerated")}
        </div>

        {invoices.map((invoice) => (
          <div
            key={invoice._id}
            className="tw:flex tw:justify-between tw:gap-4 tw:mb-2 tw:flex-wrap"
          >
            <div className="tw:flex tw:gap-4 tw:flex-wrap">
              <KeyValue label={t("invoiceNo")} size="sm" horizontal={!isMobile}>
                : {invoice.invoiceNumber}
              </KeyValue>
              <KeyValue
                label={t("invoiceValue")}
                size="sm"
                horizontal={!isMobile}
              >
                : <Amount value={invoice.invoiceAmount} decimalPlaces={2} />
              </KeyValue>
              <KeyValue
                label={t("invoiceDate")}
                size="sm"
                horizontal={!isMobile}
              >
                : <DateFormat value={invoice.invoicedDate} />
              </KeyValue>
            </div>

            <div>
              {orderType === "B2C" ? (
                <PrintReceipt orderId={orderId || ""} />
              ) : (
                <AppButton
                  size="small"
                  color="success"
                  fill="outline"
                  onClick={() => handleDownloadInvoice(invoice)}
                >
                  <FileDown className="tw-text-lg" />
                  {t("downloadInvoice")}
                </AppButton>
              )}
            </div>
          </div>
        ))}
      </div>

      <BusyLoader show={busyloader} />
    </>
  );
};

export default Invoices;
