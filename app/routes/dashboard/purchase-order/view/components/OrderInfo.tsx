import { Clock } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import Divider from "~/components/core/divider/Divider";

interface OrderInfoProps {
  orderInfo: any;
  showMoreInfo: boolean;
}

const OrderInfo: React.FC<OrderInfoProps> = ({ orderInfo, showMoreInfo }) => {
  const po = orderInfo?.purchaseOrder;
  if (!po) return null;

  return (
    <AppCard title="Order Status" icon={<Clock size={16} />}>
      <div className="tw:space-y-4 tw:text-sm">
        <div className="tw:text-sm tw:space-y-4">
          {po._isFromSk && (
            <div className="tw:flex tw:justify-between tw:items-center">
              <div className="tw:text-gray-500">SK Order ID</div>
              <div className="tw:font-medium">{po.skOrderId || "-"}</div>
            </div>
          )}

          <div className="tw:flex tw:justify-between tw:items-center">
            <div className="tw:text-gray-500">Current Status</div>
            <div>
              <AppBadge variant={po._statusColor as any}>
                {po._statusLabel || po.status}
              </AppBadge>
            </div>
          </div>

          {po._sourceType && (
            <div className="tw:flex tw:justify-between tw:items-center">
              <div className="tw:text-gray-500">Source</div>
              <div>
                <AppBadge variant={po._sourceType.color as any}>
                  <span className="tw:text-xs">{po._sourceType.name}</span>
                </AppBadge>
              </div>
            </div>
          )}

          <div className="tw:flex tw:justify-between tw:items-center">
            <div className="tw:text-gray-500">Order Date</div>
            <div className="tw:font-medium">
              {<DateFormat value={po.createdAt} />}
            </div>
          </div>

          <div className="tw:md:hidden tw:flex tw:justify-between tw:items-center">
            <div className="tw:text-gray-500">Order Value</div>
            <div className="tw:font-medium tw:text-red-600">
              <Amount value={po.totalAmount} />
            </div>
          </div>

          {showMoreInfo && (
            <>
              <div className="tw:flex tw:justify-between tw:items-center">
                <div className="tw:text-gray-500">Expected Delivery</div>
                <div className="tw:font-medium">
                  {
                    <DateFormat
                      value={po.expectedDeliveryDate}
                      formatStr="dd MMM yyyy"
                    />
                  }
                </div>
              </div>

              {/* Only show actual delivery date if order has been delivered */}
              {po.actualDeliveryDate && (
                <div className="tw:flex tw:justify-between tw:items-center">
                  <div className="tw:text-gray-500">Actual Delivery</div>
                  <div className="tw:font-medium">
                    {<DateFormat value={po.actualDeliveryDate} />}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        {showMoreInfo && (
          <>
            {/* Only show received information if there is an actual delivery date or receipt confirmation */}
            {(po.actualDeliveryDate || po.receiptConfirmedAt) && (
              <>
                <Divider className="tw:!my-2" />

                <div className="tw:flex tw:justify-between tw:items-center">
                  <div className="tw:text-gray-500">Received By</div>
                  <div className="tw:font-bold">
                    {po.receiptConfirmedBy?.userName ||
                      po.actualDeliveryReceivedBy ||
                      "-"}
                  </div>
                </div>

                <div className="tw:flex tw:justify-between tw:items-center">
                  <div className="tw:text-gray-500">Received At</div>
                  <div className="tw:font-medium">
                    {
                      <DateFormat
                        value={po.receiptConfirmedAt || po.actualDeliveryDate}
                      />
                    }
                  </div>
                </div>
                <Divider className="tw:!my-2" />

                {/* Show delivery status message */}
                {po.expectedDeliveryDate && po.actualDeliveryDate && (
                  <div
                    className={`tw:font-medium tw:text-sm tw:mt-4 ${
                      po.isLateDelivery
                        ? "tw:text-red-600"
                        : "tw:text-green-600"
                    }`}
                  >
                    {po.isLateDelivery ? "Delivered late" : "Delivered on time"}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </AppCard>
  );
};

export default OrderInfo;
