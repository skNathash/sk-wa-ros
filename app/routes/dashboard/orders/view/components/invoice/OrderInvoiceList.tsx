import { Download, MapPin } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppLink from "~/components/core/link/AppLink";
import { ASSET } from "~/constants";
import CommonService from "~/services/CommonService";
import InvoiceProductModal from "../../modals/invoice-products/InvoiceProductModal";

interface InvoiceItem {
  _id: string;
  createdAt: string;
  deliveredOn?: string;
  subTotal: number;
  status: string;
  items: any[];
  deals: any[];
  invoiceDocument?: string;
  trackingId?: string;
}

type Props = {
  invoices: InvoiceItem[];
  callback: (a: { action: string; data?: any }) => void;
};

const OrderInvoiceList = ({ invoices, callback }: Props) => {
  const { t } = useTranslation(["common"]);
  const [invoicePrdModal, setInvoicePrdModal] = useState<{
    show: boolean;
    products: any[];
    invoiceId: string;
  }>({
    show: false,
    products: [],
    invoiceId: "",
  });

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "success";
      case "pending":
        return "warning";
      case "in_transit":
        return "info";
      default:
        return "primary";
    }
  };

  const handleTrackShipment = (trackingId?: string) => {
    if (!trackingId) {
      return;
    }
    // Implement tracking logic here
  };

  const handleDownloadInvoice = (invoiceDocument?: string) => {
    if (!invoiceDocument) {
      return;
    }
    const invoiceUrl = `${ASSET}/${invoiceDocument}?preview=1`;
    CommonService.windowOpenHandler(invoiceUrl, () => {});
  };

  if (invoices.length === 0) {
    return null;
  }

  const viewInvoice = (invoice: InvoiceItem) => {
    callback({ action: "viewInvoice", data: invoice });
  };

  const viewProductModalCallback = (response: {
    action: string;
    data?: any;
  }) => {
    setInvoicePrdModal((prev) => ({
      ...prev,
      show: false,
      products: [],
      invoiceId: "",
    }));
  };

  return (
    <>
      <AppCard
        title={t("invoices")}
        icon="file-text"
        iconClassName="tw:text-indigo-500"
      >
        {invoices.map((invoice) => (
          <div
            key={invoice._id}
            className="tw:last:border-b-0 tw:border-b tw:border-gray-200 tw:p-4 tw:last:mb-0 tw:mb-4"
          >
            <div className="tw:grid tw:grid-cols-2 tw:lg:grid-cols-3 tw:gap-4 tw:mb-4">
              <KeyValue label={t("invoiceNo")} size="sm">
                <div className="tw:flex tw:items-center tw:gap-2">
                  <AppLink onClick={() => viewInvoice(invoice)}>
                    {invoice._id}
                  </AppLink>
                </div>
              </KeyValue>
              <KeyValue label={t("invoicedDate")} size="sm">
                <span>
                  <DateFormat
                    value={invoice.createdAt}
                    formatStr="dd MMM yyyy"
                  />
                </span>
                <span className="tw:text-xs tw:text-gray-500 tw:ml-2">
                  <DateFormat value={invoice.createdAt} formatStr="hh:mm a" />
                </span>
              </KeyValue>
              <KeyValue label={t("invoiceAmount")} size="sm">
                <Amount value={invoice.subTotal} decimalPlaces={2} />
              </KeyValue>
              <KeyValue label={t("invoiceStatus")} size="sm">
                <AppBadge variant={getStatusVariant(invoice.status)}>
                  {invoice.status}
                </AppBadge>
              </KeyValue>
              <KeyValue label={t("items")} size="sm">
                {invoice.items.length}
                {/* <button
                className="tw:!text-xs tw:text-primary tw:underline tw:ml-2"
                onClick={() => handleTrackShipment(invoice.trackingId)}
              >
                View
              </button> */}
              </KeyValue>
              <div className="tw:flex tw:flex-row tw:gap-2 tw:self-center tw:flex-wrap">
                {invoice.invoiceDocument && (
                  <AppButton
                    size="small"
                    color="light"
                    fill="outline"
                    className="tw:w-full tw:lg:w-auto"
                    onClick={() =>
                      handleDownloadInvoice(invoice.invoiceDocument)
                    }
                  >
                    <Download size={16} />
                    {t("download")}
                  </AppButton>
                )}
                {invoice.trackingId && (
                  <AppButton
                    size="small"
                    color="light"
                    fill="outline"
                    className="tw:w-full tw:lg:w-auto"
                    onClick={() => handleTrackShipment(invoice.trackingId)}
                  >
                    <MapPin size={16} />
                    {t("track")}
                  </AppButton>
                )}
              </div>
            </div>
          </div>
        ))}
      </AppCard>
      <InvoiceProductModal
        show={invoicePrdModal.show}
        products={invoicePrdModal.products}
        callback={viewProductModalCallback}
        invoiceId={invoicePrdModal.invoiceId}
      />
    </>
  );
};

export default OrderInvoiceList;
