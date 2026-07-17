import { Phone } from "lucide-react";
import React from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import Divider from "~/components/core/divider/Divider";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppLink from "~/components/core/link/AppLink";

interface Props {
  data: any[];
  loading: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  showLoadMore: boolean;
}

const MobileView: React.FC<Props> = ({
  data,
  loading,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  showLoadMore,
}) => {
  if (loading && !data.length) return <div>Loading...</div>;

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
        {data.map((item: any) => (
          <AppCard key={item._id} className="tw:mb-0" noPadding>
            <div className="tw:flex tw:justify-between tw:items-center tw:px-4 tw:py-3">
              <KeyValue label="Request ID" size="sm">
                {item.requestCode || item._id}
              </KeyValue>

              {/* status */}
              <AppBadge variant={item.statusColor}>{item.status}</AppBadge>
            </div>

            <Divider className="tw:!my-0" />

            <div className="tw:flex tw:justify-between tw:items-center tw:px-4 tw:py-3">
              <KeyValue label="Order ID" size="sm">
                <AppLink
                  asLink
                  href={`/dashboard/orders/view/${item.orderId}`}
                  showLinkColor
                >
                  {item.orderRefNo || "-"}
                </AppLink>
              </KeyValue>

              <KeyValue label="Items" size="sm">
                {item.splitItems?.length || "-"}{" "}
                <span className="tw:text-xs tw:text-gray-500">items</span>
              </KeyValue>
            </div>

            <Divider className="tw:!my-0" />

            <div className="tw:flex tw:justify-between tw:items-center tw:px-4 tw:py-3">
              <KeyValue label="Customer" size="sm">
                <AppLink
                  asLink
                  href={`/dashboard/network/view/b2c/${item.customerInfo?.customerId}`}
                  showLinkColor
                >
                  <div className="tw:line-clamp-1">
                    {item.customerInfo?.name || "-"}{" "}
                  </div>
                </AppLink>

                <div className="tw:flex tw:gap-2">
                  <span className="tw:text-xs tw:text-gray-500">
                    ID: {item.customerInfo?.refId || "-"}
                  </span>
                  <span className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500">
                    <Phone className="tw:text-gray-500" size={12} />
                    {item.customerInfo?.mobile || "-"}
                  </span>
                </div>
              </KeyValue>
            </div>

            <Divider className="tw:!my-0" />

            <div className="tw:flex tw:justify-between tw:items-center tw:px-4 tw:py-3">
              <KeyValue label="Seller" size="sm">
                <AppLink
                  asLink
                  href={`/dashboard/network/view/b2c/${item.sellerInfo?.sellerId}`}
                  showLinkColor
                >
                  <div className="tw:line-clamp-1">
                    {item.sellerInfo?.franchiseName || "-"}{" "}
                  </div>
                </AppLink>

                <div className="tw:flex tw:gap-2">
                  <span className="tw:text-xs tw:text-gray-500">
                    ID: {item.sellerInfo?.refId || "-"}
                  </span>
                  <span className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500">
                    <Phone className="tw:text-gray-500" size={12} />
                    {item.sellerInfo?.mobile || "-"}
                  </span>
                </div>
              </KeyValue>
            </div>

            <Divider className="tw:!my-0" />

            <div className="tw:flex tw:justify-between tw:items-center tw:px-4 tw:py-3">
              {/* ordered on */}
              <KeyValue label="Ordered On" size="sm">
                <DateFormat value={item.orderedOn} formatStr="dd MMM yyyy" />
                <div className="tw:text-xs tw:text-gray-500">
                  <DateFormat value={item.orderedOn} formatStr="hh:mm a" />
                </div>
              </KeyValue>

              <KeyValue label="Requested At" size="sm">
                <DateFormat value={item.createdAt} formatStr="dd MMM yyyy" />
                <div className="tw:text-xs tw:text-gray-500">
                  <DateFormat value={item.createdAt} formatStr="hh:mm a" />
                </div>
              </KeyValue>
            </div>

            <Divider className="tw:!my-0" />

            {/* action */}
            <div className="tw:flex tw:justify-end tw:items-center tw:px-4 tw:py-3">
              <AppLink
                asLink
                href={`/dashboard/orders/partial-order-request/view?id=${item.requestId || item._id}`}
                showLinkColor
              >
                <AppButton size="small" fill="outline" color="light">
                  View
                </AppButton>
              </AppLink>
            </div>
          </AppCard>
        ))}
      </div>
    </>
  );
};

export default MobileView;
