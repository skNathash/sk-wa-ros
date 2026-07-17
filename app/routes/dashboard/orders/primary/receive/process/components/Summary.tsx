import { Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import type { VariantColor } from "~/types/CommonTypes";

const Summary = ({
  orderId,
  orderDate,
  status,
  shippedBy,
  statusColor,
}: {
  orderId: string;
  orderDate: string;
  status: string;
  shippedBy: string;
  statusColor: string;
}) => {
  const { t } = useTranslation();

  return (
    <AppCard title={t("summary")} icon={<Package />}>
      <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-4">
        <KeyValue label={t("orderId")} size="sm">
          {orderId}
        </KeyValue>
        <KeyValue label={t("orderDate")} size="sm">
          <DateFormat value={orderDate} />
        </KeyValue>
        <KeyValue label={t("status")} size="sm">
          <AppBadge variant={statusColor as VariantColor}>{status}</AppBadge>
        </KeyValue>
        <KeyValue label={t("shippedBy")} size="sm">
          {shippedBy}
        </KeyValue>
      </div>
    </AppCard>
  );
};

export default Summary;
