import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import CommonService from "~/services/CommonService";
import type {
  PaginationState,
  SortProps,
  SortValue,
} from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import { getCount, getData, prepareParams } from "./helper";

const Orders = () => {
  const { t } = useTranslation(["common"]);
  const { isMobile } = useScreenView();
  const appNav = useAppNav();
  const { show: appToast } = useAppToast();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [view, setView] = useState<any>("list");

  // Refs
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const filterRef = useRef<any>({});

  const sortRef = useRef<SortProps>({
    key: "orderedDate",
    value: "desc",
  });

  // Apply filter (initial load or filter change)
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
      paginationRef.current.totalRecords = totalRecords.totalOrders;
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
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
      setData((prev) => [...prev, ...result]);
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  // Initial load
  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  // Filter change handler
  const onFilterChange = useCallback(
    (data: any) => {
      filterRef.current = {
        ...filterRef.current,
        ...data.formData,
      };
      applyFilter();
    },
    [applyFilter]
  );

  const onSort = useCallback(
    (data: { key: string; value: SortValue }) => {
      const { key, value } = data;
      sortRef.current = { key, value };
      applyFilter();
    },
    [applyFilter]
  );

  const handleItemCb = async ({
    action,
    data,
  }: {
    action: string;
    data: any;
  }) => {
    if (action === "view-order") {
      appNav.to(`/dashboard/orders/view/${data.orderId}`);
    } else if (action === "download-invoice") {
      if (!data.invoices || data.invoices.length === 0) {
        appToast({
          msg: t("noInvoicesAvailable"),
          color: "danger",
        });
        return;
      }

      // Download the first invoice (you can modify this logic if you want to download all invoices)
      const firstInvoice = data.invoices[0];
      const invoiceDocumentId = firstInvoice.invoiceDocumentId;

      if (invoiceDocumentId) {
        // Use common service to download/open the asset similar to pick list download
        CommonService.assetDownload(invoiceDocumentId);
        appToast({
          msg: t("downloadingInvoice"),
          color: "success",
        });
      } else {
        appToast({
          msg: t("invoiceDocumentNotFound"),
          color: "danger",
        });
      }
    }
  };

  return (
    <>
      <Filter callback={onFilterChange} />
      <div className="tw:mb-2 tw:flex tw:justify-between tw:items-center">
        <div>
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            loadedCount={data.length}
            fwSize="sm"
          />
        </div>

        <ViewToggle viewType={view} callback={setView} />
      </div>

      {isMobile || view === "card" ? (
        <MobileView
          data={data}
          loading={loading}
          showLoadMore={hasMoreData}
          loadingMore={loadingMore}
          loadMore={loadMore}
          totalCount={paginationRef.current.totalRecords}
          loadedCount={data.length}
          callback={handleItemCb}
        />
      ) : (
        <AppCard noPadding>
          <DesktopView
            data={data}
            loading={loading}
            sortKey={sortRef.current.key}
            sortValue={sortRef.current.value}
            onSort={onSort}
            showLoadMore={hasMoreData && !loading}
            loadingMore={loadingMore}
            loadMore={loadMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={data.length}
            callback={handleItemCb}
          />
        </AppCard>
      )}
    </>
  );
};

export default Orders;
