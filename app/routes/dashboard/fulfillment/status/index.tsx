import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import type { PaginationState } from "~/types/CommonTypes";
import { DeliveredItem, Filter, GeneralItem, ShippedItem } from "./components";
import { defaultFilter, getCount, getData, prepareFilters } from "./helper";

const FulfillmentStatus = () => {
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get("status") || "approval-pending";

  // States for data management
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const filterRef = useRef<Record<string, any>>({
    status: statusParam,
    ...defaultFilter,
  });

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    endSlNo: 10,
    startSlNo: 1,
    totalRecords: 0,
  });

  // Get status display information
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { title: string; color: string }> = {
      "approval-pending": {
        title: "New Orders",
        color: "blue-500",
      },
      picked: { title: "Picked Orders", color: "orange-500" },
      "packing-invoiced": { title: "Packing Orders", color: "yellow-500" },
      "pending-shipment": {
        title: "Awaiting Shipment",
        color: "blue-500",
      },
      shipped: { title: "Shipped Orders", color: "blue-500" },
      delivered: { title: "Delivered Orders", color: "green-500" },
    };
    return statusMap[status] || { title: "Orders", color: "gray-500" };
  };

  const statusInfo = getStatusInfo(statusParam);

  // Initialize data on component mount and when status changes
  useEffect(() => {
    filterRef.current = {
      status: statusParam,
      ...defaultFilter,
    };
    paginationRef.current = {
      activePage: 1,
      rowsPerPage: 10,
      endSlNo: 10,
      startSlNo: 1,
      totalRecords: 0,
    };
    applyFilter();
  }, [statusParam]);

  // Apply filter function
  const applyFilter = async () => {
    setLoading(true);
    try {
      const params = prepareFilters(filterRef.current, paginationRef.current);
      const response = await getData(params);

      const countResponse = await getCount(params);
      paginationRef.current.totalRecords = countResponse || 0;

      setHasMoreData(paginationRef.current.rowsPerPage === response.length);
      setData(response);
    } catch (error) {
      console.error("Error applying filter:", error);
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  };

  // Filter callback function
  const handleFilterChange = ({ formData }: { formData: any }) => {
    filterRef.current = {
      ...filterRef.current,
      ...formData,
    };
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    applyFilter();
  };

  // Load more function for pagination
  const loadMore = async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };

    setLoadingMore(true);
    try {
      const params = prepareFilters(filterRef.current, paginationRef.current);
      const response = await getData(params);

      setHasMoreData(paginationRef.current.rowsPerPage === response.length);
      setData([...data, ...response]);
    } catch (error) {
      setHasMoreData(false);
    } finally {
      setLoadingMore(false);
    }
  };

  // Render appropriate item component based on status
  const renderItem = (item: any) => {
    switch (statusParam) {
      case "shipped":
        return <ShippedItem key={item.orderId} item={item} />;
      case "delivered":
        return <DeliveredItem key={item.orderId} item={item} />;
      default:
        return (
          <GeneralItem key={item.orderId} item={item} status={statusParam} />
        );
    }
  };

  return (
    <>
      <AppHeader title={statusInfo.title} />
      <div className="app-page tw:p-4 page-bg">
        <div className="app-container">
          <div className="tw:mb-6 tw:text-gray-500 tw:text-xs">
            View and manage {statusInfo.title.toLowerCase()}.
          </div>

          {/* Filter Component */}
          <AppCard>
            <Filter callback={handleFilterChange} />
          </AppCard>

          {/* Orders List */}

          {loading ? (
            <div className="tw:flex tw:justify-center tw:items-center tw:py-8">
              <AppSpinner />
            </div>
          ) : data.length === 0 ? (
            <div className="tw:text-center tw:py-8 tw:text-gray-500">
              No orders found for this status.
            </div>
          ) : (
            <AppCard
              title={`${statusInfo.title} (${paginationRef.current.totalRecords})`}
              icon="package"
              iconClassName={`tw:text-${statusInfo.color}`}
            >
              <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-4">
                {data.map(renderItem)}
              </div>
            </AppCard>
          )}

          {/* Load More Button */}
          {hasMoreData && data.length > 0 && (
            <div className="tw:flex tw:justify-center tw:items-center tw:p-4 tw:border-t">
              <AppButton
                size="small"
                fill="outline"
                onClick={loadMore}
                isLoading={loadingMore}
                color="dark"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </AppButton>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FulfillmentStatus;
