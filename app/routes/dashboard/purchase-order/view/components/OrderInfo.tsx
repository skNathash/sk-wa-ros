import { Info } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";

interface OrderInfoProps {
  orderInfo: any;
  showMoreInfo: boolean;
}

const InfoRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="tw:flex tw:justify-between tw:items-center tw:gap-3 tw:py-2.5">
    <span className="tw:text-sm tw:text-gray-500 tw:shrink-0">{label}</span>
    <div className="tw:text-sm tw:font-medium tw:text-gray-900 tw:text-right tw:min-w-0">
      {children}
    </div>
  </div>
);

const OrderInfo: React.FC<OrderInfoProps> = ({ orderInfo, showMoreInfo }) => {
  const po = orderInfo?.purchaseOrder;
  if (!po) return null;

  const isDelivered = po.actualDeliveryDate || po.receiptConfirmedAt;

  return (
    <AppCard
      title="Order Status"
      icon={<Info size={16} className="tw:text-gray-500" />}
      className="tw:h-full tw:mb-0!"
      headerClassName="tw:border-b tw:border-gray-100 tw:pb-3"
      iconClassName="tw:mr-0!"
    >
      <div className="tw:divide-y tw:divide-gray-100">
        <InfoRow label="Current Status">
          <AppBadge variant={po._statusColor as any} className="tw:uppercase">
            <span className="tw:font-medium">
              {po._statusLabel || po.status}
            </span>
          </AppBadge>
        </InfoRow>

        {po._sourceType && (
          <InfoRow label="Source">
            <AppBadge variant={po._sourceType.color as any} size="sm">
              <span className="tw:text-xs tw:uppercase">
                {po._sourceType.name}
              </span>
            </AppBadge>
          </InfoRow>
        )}

        {po._isFromSk && (
          <InfoRow label="SK Order ID">
            {po.skOrderId || "-"}
          </InfoRow>
        )}

        <InfoRow label="Order Date">
          <DateFormat value={po.createdAt} />
        </InfoRow>

        {showMoreInfo && (
          <>
            <InfoRow label="Expected Delivery">
              <DateFormat
                value={po.expectedDeliveryDate}
                formatStr="dd MMM yyyy"
              />
            </InfoRow>

            {po.actualDeliveryDate && (
              <InfoRow label="Actual Delivery">
                <DateFormat value={po.actualDeliveryDate} />
              </InfoRow>
            )}
          </>
        )}

        <div className="tw:md:hidden">
          <InfoRow label="Order Value">
            <span className="tw:text-emerald-600 tw:font-semibold">
              <Amount value={po.totalAmount} />
            </span>
          </InfoRow>
        </div>

        {showMoreInfo && isDelivered && (
          <>
            <InfoRow label="Received By">
              {po.receiptConfirmedBy?.userName ||
                po.actualDeliveryReceivedBy ||
                "-"}
            </InfoRow>

            <InfoRow label="Received At">
              <DateFormat
                value={po.receiptConfirmedAt || po.actualDeliveryDate}
              />
            </InfoRow>

            {po.expectedDeliveryDate && po.actualDeliveryDate && (
              <div
                className={`tw:pt-2.5 tw:text-xs tw:font-medium ${
                  po.isLateDelivery
                    ? "tw:text-red-600"
                    : "tw:text-emerald-600"
                }`}
              >
                {po.isLateDelivery ? "Delivered late" : "Delivered on time"}
              </div>
            )}
          </>
        )}
      </div>
    </AppCard>
  );
};

export default OrderInfo;
