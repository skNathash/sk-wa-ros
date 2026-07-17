import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import type {
  PaginationState,
  TabItem,
  SortValue,
  BreadcrumbItem,
} from "~/types/CommonTypes";
import useAppNav from "~/hooks/useAppNav";
import { useSearchParams } from "react-router";
import useScreenView from "~/hooks/useScreenView";
import { useCallback, useEffect, useRef, useState } from "react";
import { prepareParams, getData, getCount } from "./helper";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import AppButton from "~/components/core/button/AppButton";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import Filter from "./components/Filter";
import { Box } from "lucide-react";
import OrderListTab from "~/shared/orders/order-list-tab/OrderListTab";
import { useTranslation } from "react-i18next";

const SKPrimaryReceiveList = () => {
  const { t } = useTranslation(["common"]);

  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: t("dashboard"),
      redirect: {
        path: "/dashboard",
      },
    },
    {
      label: t("orders"),
      redirect: {
        path: "/dashboard/orders/list",
      },
    },
    {
      label: t("receiveOrder"),
    },
  ];

  const defaultFilter = {
    search: "",
    dateRange: null,
    status: "",
    feature: "receive",
    activeTab: "all-orders",
  };

  const appNav = useAppNav();
  const { isMobile } = useScreenView();
  const [searchParams] = useSearchParams();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const activeTab = searchParams.get("tab") || "yet-to-receive";

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const filterRef = useRef<any>({
    ...defaultFilter,
    activeTab: activeTab,
    type: activeTab,
  });

  const sortRef = useRef<{ key: string; value: SortValue }>({
    key: "orderedDate",
    value: "desc",
  });

  const applyFilter = useCallback(async () => {
    setLoading(true);
    setData([]);

    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    try {
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current
      );

      const result = await getData(params);
      setData(result || []);

      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;

      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage
      );
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more handler
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current
      );
      const result = await getData(params);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage
      );
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  // Initial load
  useEffect(() => {
    filterRef.current = {
      ...filterRef.current,
      activeTab: activeTab,
      type: activeTab,
    };
    applyFilter();
  }, [activeTab]);

  const handleFilter = useCallback(
    ({ formData }: { formData: any }) => {
      filterRef.current = {
        ...filterRef.current,
        ...formData,
      };
      applyFilter();
    },
    [applyFilter]
  );

  // Callback for item actions (view, download, etc)
  const handleItemCallback = ({
    action,
    data,
  }: {
    action: string;
    data: any;
  }) => {
    if (action === "view-order") {
      appNav.to(`/dashboard/orders/view/${data.orderId}`);
    } else if (action === "view") {
      appNav.to(`/dashboard/orders/view/${data.orderId}`);
    } else if (action === "receive") {
      appNav.to(`/dashboard/orders/primary/receive/process/${data.orderId}`);
    }
    // Add more actions if needed
  };

  const handleSort = useCallback(
    ({ key, value }: { key: string; value: SortValue }) => {
      sortRef.current = { key, value };
      applyFilter();
    },
    [applyFilter]
  );

  return (
    <>
      <AppHeader title="Order Shipped from SK" showCart={true} />
      <div className="tw:p-4 app-page page-bg">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} />
          <div className="tw:mt-2 tw:text-sm tw:text-gray-500 tw:mb-4">
            Track all orders shipped from SK
          </div>

          <OrderListTab activeTab="orders-from-sk" className="tw:mb-4" />

          <AppCard>
            <Filter callback={handleFilter} />
          </AppCard>

          <AppCard
            title={t("shipmentBoxes")}
            subtitle={t("shipmentBoxesSubtitle")}
            icon={<Box />}
          >
            <PaginationSummary
              paginationConfig={paginationRef.current}
              loadingTotalRecords={loading}
              loadedCount={data.length}
              fwSize="sm"
              className="tw:mb-4"
            />

            {isMobile ? (
              <MobileView
                data={data}
                loading={loading}
                callback={handleItemCallback}
              />
            ) : (
              <DesktopView
                data={data}
                loading={loading}
                callback={handleItemCallback}
                sortKey={sortRef.current.key}
                sortValue={sortRef.current.value}
                onSort={handleSort}
              />
            )}

            {hasMoreData && !loading && (
              <div className="tw:text-center tw:mt-4">
                <AppButton
                  onClick={loadMore}
                  disabled={loadingMore}
                  size="small"
                  color="light"
                  fill="outline"
                >
                  {loadingMore ? t("loading") : t("loadMore")}
                </AppButton>
              </div>
            )}
          </AppCard>
        </div>
      </div>
    </>
  );
};

export default SKPrimaryReceiveList;
