import { File } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import KeyValue from "~/components/core/key-value/KeyValue";

interface OrderSummaryProps {
  order: any;
}

const OrderSummary = ({ order }: OrderSummaryProps) => {
  const { t } = useTranslation(["common"]);
  const totalProducts = order.subOrders?.length || 0;
  // Sum all items in all invoices for correct invoiced products count
  const invoicedProducts = Array.isArray(order.invoices)
    ? order.invoices.reduce(
      (sum: number, inv: any) => sum + (inv.items?.length || 0),
      0
    )
    : 0;
  const notInvoicedProducts = totalProducts - invoicedProducts;

  return (
    <AppCard title={t("invoiceSummary")} icon={<File />}>
      <div className="tw:grid tw:grid-cols-3 tw:gap-3">
        <KeyValue label={t("total")} size="sm">
          {totalProducts}{" "}
          <span className="tw:text-xs tw:text-gray-500">{t("products")}</span>
        </KeyValue>
        <KeyValue label={t("invoiced")} size="sm">
          {invoicedProducts}{" "}
          <span className="tw:text-xs tw:text-gray-500">{t("products")}</span>
        </KeyValue>
        <KeyValue label={t("notInvoiced")} size="sm">
          {notInvoicedProducts}{" "}
          <span className="tw:text-xs tw:text-gray-500">{t("products")}</span>
        </KeyValue>
      </div>
    </AppCard>
  );
};

export default OrderSummary;
