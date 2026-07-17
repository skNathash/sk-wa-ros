import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppLink from "~/components/core/link/AppLink";
import useAppNav from "~/hooks/useAppNav";

interface OrderBasicInfoProps {
  order: any;
}

const OrderBasicInfo = ({ order }: OrderBasicInfoProps) => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();

  const viewLinkedOrder = () => {
    appNav.to("/dashboard/sales/view/" + order.linkedSecondaryOrderId);
  };

  return (
    <AppCard className="mb-4">
      <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:lg:grid-cols-3">
        <KeyValue label={t("orderType")} size="sm">
          <AppBadge variant={order._orderTypeColor as any}>
            {order._orderType || order.orderType || t("purchase")}
          </AppBadge>
        </KeyValue>

        <KeyValue label={t("paymentStatus")} size="sm">
          <AppBadge
            variant={order.paymentStatus === "Paid" ? "success" : "warning"}
          >
            {order.paymentStatus}
          </AppBadge>
        </KeyValue>

        <KeyValue label={t("totalAmount")} size="sm">
          <span className="tw:font-bold tw:text-primary">
            <Amount
              value={order.orderAmount || order.subTotal}
              decimalPlaces={2}
            />
          </span>
        </KeyValue>

        {order.linkedSecondaryOrderId && (
          <KeyValue label={t("linkedOrderId")} size="sm">
            <AppLink onClick={viewLinkedOrder}>
              {order.linkedSecondaryOrderId || "-"}
            </AppLink>
          </KeyValue>
        )}
      </div>
    </AppCard>
  );
};

export default OrderBasicInfo;
