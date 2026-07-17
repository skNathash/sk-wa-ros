import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import type { ButtonColor, PaginationState } from "~/types/CommonTypes";
import { getCount, getData, prepareFilters } from "../helper";

interface FulfillmentOrderCardProps {
  title: string;
  status: string | string[];
  statusKey: string;
  color: string;
}

// Map fulfillment status keys (tab keys from fulfillment index.tsx) to button text and color
const ACTION_MAP: Record<string, { text: string; color: ButtonColor }> = {
  "approval-pending": { text: "Start", color: "primary" },
  picked: { text: "Start Picking", color: "success" },
  "packing-invoiced": { text: "Start Packing", color: "secondary" },
  "pending-shipment": { text: "Ship", color: "primary" },
  shipped: { text: "Mark Delivered", color: "primary" },
  delivered: { text: "View", color: "primary" },
};

const FulfillmentOrderCard = ({
  title,
  status,
  statusKey,
  color,
}: FulfillmentOrderCardProps) => {
  const { t } = useTranslation(["common"]);
  // States for data management
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const filterRef = useRef<Record<string, any>>({
    status: status,
  });

  const [searchParams] = useSearchParams();

  // initialize filterRef from URL params
  useEffect(() => {
    const s = searchParams.get("search") || "";
    const t = searchParams.get("type") || "all";
    const r = searchParams.get("routeId") || "all";
    filterRef.current = {
      status: status,
      search: s,
      type: t,
      routeId: r,
    };
    // apply filter whenever URL params or status change
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString(), status]);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    endSlNo: 10,
    startSlNo: 1,
    totalRecords: 0,
  });

  // Resolve action for the provided fulfillment `statusKey` once (avoid IIFE in render)
  const actionForType = ACTION_MAP[String(statusKey)] || {
    text: "Start",
    color: "primary",
  };

  // Apply filter function
  const applyFilter = async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    setLoading(true);
    try {
      const params = prepareFilters(
        filterRef.current,
        paginationRef.current,
        statusKey,
      );
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

  return (
    <>
      {/* <div className="tw:flex tw:items-center tw:gap-2 tw:mb-4">
        <span className={`tw:w-4 tw:h-4 tw:bg-${color} tw:rounded-full`}></span>
        <AppLink
          asLink={true}
          href={`/dashboard/fulfillment/status?status=${statusKey}`}
          className="tw:font-semibold"
        >
          {title}
        </AppLink>
        <span className="tw:text-xs tw:text-gray-500">
          {paginationRef.current.totalRecords} items
        </span>
      </div> */}

      <div className="tw:mb-4">
        <div className="tw:bg-green-50 tw:rounded-md tw:px-4 tw:py-2 tw:text-green-800 tw:text-xs tw:font-semibold tw:shadow">
          Total {paginationRef.current.totalRecords} Orders
        </div>
      </div>

      {loading ? (
        <div className="tw:flex tw:justify-center tw:items-center">
          <AppSpinner />
        </div>
      ) : null}

      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
        {data.map((item) => (
          <AppCard key={item.orderId} className="tw:mb-0" noPadding>
            <div className="tw:block tw:w-full tw:p-4">
              <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
                {item.customerInfo?.isGuestCustomer ? (
                  <AppBadge
                    variant="secondary"
                    className="tw:text-xs tw:px-2 tw:py-0.5 tw:ml-1"
                  >
                    Walkin Customer
                  </AppBadge>
                ) : (
                  <AppLink
                    asLink={true}
                    href={
                      item.orderType === "B2B"
                        ? `/dashboard/network/view/b2b/${item.customerInfo?.customerId}`
                        : `/dashboard/network/view/b2c/${item.customerInfo?.customerId}/purchase-history`
                    }
                    className="tw:text-sm tw:font-semibold tw:hover:underline"
                    onClick={(e: any) => {
                      // prevent parent AppLink from handling click
                      e.stopPropagation?.();
                    }}
                  >
                    {item.customerInfo?.name || item.orderRefNo}
                  </AppLink>
                )}
                <AppBadge
                  variant={item.orderType === "B2B" ? "primary" : "success"}
                  className="tw:text-xs tw:px-2 tw:py-0.5 tw:ml-1"
                >
                  {item.orderType}
                </AppBadge>
              </div>

              <div className="tw:flex">
                <div className="tw:flex-1">
                  <div className="tw:text-xs tw:mt-1">
                    <span className="tw:font-medium">ID:</span>{" "}
                    {item.orderRefNo}
                  </div>

                  <div className="tw:text-xs tw:text-gray-500 tw:mt-2">
                    <DateFormat value={item.orderedDate} />
                  </div>

                  {/* Shipment / Delivery info (show only for delivered tab) */}
                  {statusKey === "delivered" && (
                    <div className="tw:text-xs tw:text-gray-500 tw:mt-2">
                      {item.invoices?.[0]?.shippingDetails?.shipmentType ? (
                        <div className="tw:flex tw:items-center tw:gap-2 tw:mt-2">
                          <span className="tw:text-xs tw:font-medium">
                            {item.invoices?.[0]?.shippingDetails
                              ?.shipmentType === "selfship"
                              ? t("selfShipment")
                              : t("deliveredBy")}
                          </span>
                          <span>:- </span>
                          <span className="tw:text-xs tw:text-gray-700 tw:ml-1">
                            {item.invoices?.[0]?.shippingDetails?.name || "--"}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
                <AppLink
                  asLink={true}
                  href={`/dashboard/orders/process/${item.orderId}`}
                  noUnderline={true}
                >
                  <AppButton
                    size="small"
                    color={actionForType.color || "primary"}
                  >
                    {actionForType.text}
                  </AppButton>
                </AppLink>
              </div>
            </div>
          </AppCard>
        ))}
      </div>

      {hasMoreData && (
        <LoadMoreButton
          loadMore={loadMore}
          loading={loadingMore}
          totalCount={paginationRef.current.totalRecords}
          loadedCount={data.length}
          noMargin={true}
        />
      )}
    </>
  );
};

export default FulfillmentOrderCard;
