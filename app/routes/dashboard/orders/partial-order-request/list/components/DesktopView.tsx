import { Clock, Eye, Phone } from "lucide-react";
import React from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import {
  AppTable,
  TableHeader,
  TableSkeletonLoader,
} from "~/components/core/table";

interface Props {
  data: any[];
  loading: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  showLoadMore: boolean;
}

const headers = [
  { label: "Request ID", width: "25%" },
  { label: "Order ID", width: "15%" },
  { label: "Ordered On", width: "15%" },
  { label: "Customer", width: "25%" },
  { label: "Seller", width: "25%" },
  { label: "Requested At", width: "15%" },
  { label: "Status", width: "20%" },
  { label: "Action", width: "10%" },
];

const DesktopView: React.FC<Props> = ({
  data,
  loading,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  showLoadMore,
}) => {
  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <div>
      <AppTable>
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {loading ? (
            <TableSkeletonLoader cols={headers.length} rows={8} />
          ) : (
            <>
              {data.map((item: any) => (
                <AppTable.Row key={item.requestId || item._id}>
                  <AppTable.Cell>{item.requestCode || item._id}</AppTable.Cell>
                  <AppTable.Cell>
                    <AppLink
                      asLink
                      href={`/dashboard/orders/view/${item.orderId}`}
                      showLinkColor
                    >
                      {item.orderRefNo || "-"}
                    </AppLink>
                    <div className="tw:flex tw:gap-2">
                      <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1">
                        {item.splitItems?.length || "-"} items
                      </div>
                    </div>
                  </AppTable.Cell>
                  <AppTable.Cell>
                    <DateFormat
                      value={item.orderedOn}
                      formatStr="dd MMM yyyy"
                    />
                    <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1">
                      <Clock className="tw:text-gray-500" size={12} />
                      <DateFormat value={item.orderedOn} formatStr="hh:mm a" />
                    </div>
                  </AppTable.Cell>
                  <AppTable.Cell>
                    <AppLink
                      asLink
                      href={`/dashboard/network/view/b2c/${item.customerInfo?.customerId}`}
                      showLinkColor
                    >
                      <div className="tw:line-clamp-1">
                        {item.customerInfo?.name || "-"}
                      </div>
                    </AppLink>

                    <div className="tw:flex tw:gap-2">
                      <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1">
                        ID: {item.customerInfo?.refId || "-"}
                      </div>
                      <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500">
                        <Phone className="tw:text-gray-500" size={12} />
                        {item.customerInfo?.mobile || "-"}
                      </div>
                    </div>
                  </AppTable.Cell>

                  <AppTable.Cell>
                    <AppLink
                      asLink
                      href={`/dashboard/network/view/b2c/${item.sellerInfo?.sellerId}`}
                      showLinkColor
                    >
                      <div className="tw:line-clamp-1">
                        {item.sellerInfo?.franchiseName || "-"}
                      </div>
                    </AppLink>

                    <div className="tw:flex tw:gap-2">
                      <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1">
                        ID: {item.sellerInfo?.refId || "-"}
                      </div>
                      <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500">
                        <Phone className="tw:text-gray-500" size={12} />
                        {item.sellerInfo?.mobile || "-"}
                      </div>
                    </div>
                  </AppTable.Cell>

                  <AppTable.Cell>
                    <DateFormat
                      value={item.createdAt}
                      formatStr="dd MMM yyyy"
                    />
                    <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1">
                      <Clock className="tw:text-gray-500" size={12} />
                      <DateFormat value={item.createdAt} formatStr="hh:mm a" />
                    </div>
                  </AppTable.Cell>
                  <AppTable.Cell>
                    <AppBadge variant={item.statusColor}>
                      {item.status || "-"}
                    </AppBadge>
                  </AppTable.Cell>
                  <AppTable.Cell>
                    <AppLink
                      asLink
                      href={`/dashboard/orders/partial-order-request/view?id=${item.requestId || item._id}`}
                    >
                      <AppButton color="light" fill="outline" size="small">
                        <Eye size={16} />
                        View
                      </AppButton>
                    </AppLink>
                  </AppTable.Cell>
                </AppTable.Row>
              ))}

              {showLoadMore && !loading && data.length > 0 && (
                <AppTable.Row>
                  <AppTable.Cell colSpan={headers.length}>
                    <LoadMoreButton
                      loadMore={loadMore}
                      loading={loadingMore}
                      totalCount={totalCount}
                      loadedCount={loadedCount}
                    />
                  </AppTable.Cell>
                </AppTable.Row>
              )}
            </>
          )}
        </AppTable.Body>
      </AppTable>
    </div>
  );
};

export default DesktopView;
