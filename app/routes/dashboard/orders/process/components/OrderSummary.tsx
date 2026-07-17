import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import Divider from "~/components/core/divider/Divider";
import type { VariantColor } from "~/types/CommonTypes";

type Props = {
  order: {
    status?: string;
    _statusLbl?: string;
    _statusColor?: VariantColor;
    createdAt?: string;
    items?: any[];
    _payableAmt?: number;
    routeInfo?: {
      deliveryDate?: string | Date;
      description?: string;
      plannedDeliveryDay?: string;
      routeCode?: string;
      routeId?: string;
    };
    customerInfo?: {
      customerId?: string;
      customerType?: string;
      isGuestCustomer?: boolean;
    };
    orderType?: string;
  };
  onRefresh?: () => void;
};

const OrderSummary: React.FC<Props> = ({ order, onRefresh }) => {
  const { t } = useTranslation();

  const { createdAt, items, _payableAmt } = order;

  const itemsCount = items?.length || 0;

  return (
    <AppCard title={t("orderSummary")} className="tw:mb-4">
      {/* Status */}
      <div className="tw:flex tw:items-center tw:justify-between tw:mb-2 tw:text-sm">
        <span className="tw:text-gray-500">{t("status")}</span>
        <AppBadge variant={order._statusColor}>
          {order._statusLbl || "N/A"}
        </AppBadge>
      </div>

      {/* Order Date */}
      <div className="tw:flex tw:items-center tw:justify-between tw:mb-2 tw:text-sm">
        <span className="tw:text-gray-500">{t("orderDate")}</span>
        <span className="tw:font-medium tw:text-gray-900">
          <DateFormat value={createdAt || null} />
        </span>
      </div>

      <div className="tw:flex tw:items-center tw:justify-between tw:text-sm tw:mb-2">
        <span className="tw:text-gray-500">{t("items")}</span>
        <span className="tw:font-medium tw:text-gray-900">
          {itemsCount} {t("items")}
        </span>
      </div>

      <Divider variant="dashed" className="tw:!my-2" />

      {/* Total Value */}
      <div className="tw:flex tw:items-center tw:justify-between">
        <span className="tw:text-sm tw:text-gray-500">{t("totalValue")}</span>
        <span className="tw:font-bold tw:text-lg tw:text-gray-900">
          <Amount value={_payableAmt || 0} decimalPlaces={2} />
        </span>
      </div>
    </AppCard>
  );
};

export default OrderSummary;
