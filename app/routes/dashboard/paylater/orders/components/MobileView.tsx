import React from "react";
import Divider from "~/components/core/divider/Divider";
import AppButton from "~/components/core/button/AppButton";
import { Download, Eye } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import AppBadge from "~/components/core/badge/AppBadge";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppLink from "~/components/core/link/AppLink";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import NoData from "~/components/core/no-data/NoData";
import PrintReceipt from "~/shared/orders/print-receipt/PrintReceipt";
import AppCard from "~/components/core/card/AppCard";
import KeyValue from "~/components/core/key-value/KeyValue";

interface MobileViewProps {
  data: any[];
  loading: boolean;
  callback?: (args: { action: string; data: any }) => void;
  showLoadMore: boolean;
  loadingMore: boolean;
  loadMore: () => void;
  totalCount: number;
  loadedCount: number;
}

const MobileView: React.FC<MobileViewProps> = ({
  data,
  loading,
  callback,
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount,
}) => {
  if (loading) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
        <AppSpinner />
      </div>
    );
  }

  if (!data.length) {
    return <NoData />;
  }

  if (1) {
    return (
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
        {data.map((order) => (
          <AppCard key={order.orderId} noPadding className="tw:mb-0">
            <div className="tw:flex tw:justify-between tw:items-center tw:px-4 tw:py-3">
              <div>
                <div className="tw:text-sm tw:font-semibold tw:mb-2">
                  <AppLink
                    asLink
                    href={`/dashboard/network/view/${
                      order.orderType === "B2B" ? "b2b" : "b2c"
                    }/${order.customerInfo?.customerId}`}
                    showLinkColor={true}
                    className="tw:flex tw:items-center tw:gap-2"
                  >
                    {order.customerInfo?.name || "-"}
                    <AppBadge variant={order._typeColor}>
                      {order.orderType}
                    </AppBadge>
                  </AppLink>
                </div>

                <div className="tw:text-xs tw:text-gray-500">
                  ID:{" "}
                  <AppLink
                    asLink
                    href={`/dashboard/orders/view/${order.orderId}`}
                  >
                    {order.orderRefNo}
                  </AppLink>
                </div>
              </div>

              <div>
                <AppBadge variant={order._statusColor || "default"}>
                  {order._statusLbl}
                </AppBadge>
              </div>
            </div>

            <Divider className="tw:!my-0" />

            <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:px-4 tw:py-3">
              <div>
                <KeyValue label="Order Date" size="sm">
                  <DateFormat
                    value={order.orderedDate}
                    formatStr="dd MMM yyyy"
                  />
                  <div className="tw:text-xs tw:text-gray-500 tw:mb-0.5 tw:inline-block tw:ml-1">
                    <DateFormat value={order.orderedDate} formatStr="hh:mm a" />
                  </div>
                </KeyValue>
              </div>

              <KeyValue label="Amount" size="sm">
                <Amount
                  value={order._payableAmt || 0}
                  decimalPlaces={2}
                  className="tw:text-red-500 tw:font-semibold"
                />
              </KeyValue>
            </div>

            <Divider className="tw:!my-0" />

            <div className="tw:flex tw:justify-end tw:items-center tw:gap-2 tw:px-4 tw:py-3">
              <AppButton
                size="small"
                color="light"
                fill="outline"
                onClick={() =>
                  callback && callback({ action: "view-order", data: order })
                }
              >
                <Eye />
                View Detail
              </AppButton>

              {order.invoices && order.invoices.length > 0 && (
                <>
                  {order.orderType === "B2C" ? (
                    <PrintReceipt
                      orderId={order.orderId}
                      size="small"
                      color="light"
                      variant="outline"
                    />
                  ) : (
                    <AppButton
                      color="light"
                      fill="outline"
                      size="small"
                      onClick={() =>
                        callback &&
                        callback({ action: "download-invoice", data: order })
                      }
                    >
                      <Download />
                    </AppButton>
                  )}
                </>
              )}
            </div>
          </AppCard>
        ))}
      </div>
    );
  }

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
      {data.map((order) => (
        <div
          key={order.orderId}
          className="tw:border tw:border-gray-200 tw:rounded tw:mb-4 tw:p-4 tw:bg-white"
        >
          {/* First row: type and status */}
          <div className="tw:flex tw:justify-between tw:items-center tw:mb-2">
            <span className="tw:font-medium tw:text-sm tw:text-gray-700">
              <AppBadge variant={order._typeColor || "primary"}>
                {order.orderType}
              </AppBadge>
            </span>
            <AppBadge variant={order._statusColor || "default"}>
              {order._statusLbl}
            </AppBadge>
          </div>

          {/* Name (customer) */}
          <div className="tw:text-base tw:font-semibold tw:mb-1">
            <AppLink
              asLink
              href={`/dashboard/network/view/${
                order.orderType === "B2B" ? "b2b" : "b2c"
              }/${order.customerInfo?.customerId}`}
            >
              {order.customerInfo?.name || "-"}
            </AppLink>
          </div>

          {/* Order Ref No */}
          <div className="tw:text-sm tw:text-blue-500 tw:mb-2">
            <AppLink asLink href={`/dashboard/orders/view/${order.orderId}`}>
              ID: {order.orderRefNo}
            </AppLink>
          </div>

          {/* Divider */}
          <Divider />

          {/* Date and Amount */}
          <div className="tw:mb-2">
            <div className="tw:flex tw:justify-between tw:items-center tw:mb-2 tw:text-sm">
              <span className="tw:text-gray-500">Order Date</span>
              <span className="tw:text-gray-700 tw:flex tw:gap-1 tw:items-end">
                <DateFormat value={order.orderedDate} formatStr="dd MMM yyyy" />
                <div className="tw:text-xs tw:text-gray-500 tw:mb-0.5">
                  <DateFormat value={order.orderedDate} formatStr="hh:mm a" />
                </div>
              </span>
            </div>
            <div className="tw:flex tw:justify-between tw:items-center tw:text-sm">
              <span className="tw:text-gray-500">Amount</span>
              <span className="tw:font-bold tw:text-red-500">
                <Amount value={order._payableAmt || 0} decimalPlaces={2} />
              </span>
            </div>
          </div>

          {/* Divider */}
          <Divider />

          {/* Action Buttons */}
          <div className="tw:mt-2 tw:flex tw:gap-2">
            <AppButton
              size="small"
              fill="outline"
              color="light"
              onClick={() =>
                callback && callback({ action: "view-order", data: order })
              }
            >
              <Eye />
              View Detail
            </AppButton>

            {order.invoices && order.invoices.length > 0 && (
              <>
                {order.orderType === "B2C" ? (
                  <PrintReceipt
                    orderId={order.orderId}
                    size="small"
                    color="light"
                    variant="outline"
                  />
                ) : (
                  <AppButton
                    color="light"
                    fill="outline"
                    size="small"
                    onClick={() =>
                      callback &&
                      callback({ action: "download-invoice", data: order })
                    }
                  >
                    <Download />
                  </AppButton>
                )}
              </>
            )}
          </div>
        </div>
      ))}
      {showLoadMore && !loading && data.length > 0 && (
        <LoadMoreButton
          loadMore={loadMore}
          loading={!!loadingMore}
          totalCount={totalCount}
          loadedCount={loadedCount}
        />
      )}
    </div>
  );
};

export default MobileView;
