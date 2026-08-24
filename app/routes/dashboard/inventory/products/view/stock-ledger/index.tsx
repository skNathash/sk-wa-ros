import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";

import InventoryProductAuditTab from "../components/inventory-audit-tab/InventoryAuditTab";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import { getCount, getData, prepareParams } from "./helper";
import CommonService from "~/services/CommonService";
import ViewStockLedgerModal from "~/shared/catalog/modals/view-stock-ledger/ViewStockLedgerModal";

const StockLedger = () => {
  const { id } = useParams();
  const { t } = useTranslation(["common"]);

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingTotalRecords, setLoadingTotalRecords] = useState(false);

  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [selectedLedgerId, setSelectedLedgerId] = useState("");
  // State and refs for filter, pagination, and data
  const filterRef = useRef<Record<string, any>>({ productId: id });
  const paginationRef = useRef({
    activePage: 1,
    rowsPerPage: 20,
    totalRecords: 0,
    startSlNo: 1,
    endSlNo: 20,
  });

  // Apply filter and fetch data
  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    setLoading(true);
    setLoadingTotalRecords(true);
    setData([]);
    try {
      const params = prepareParams(filterRef.current, paginationRef.current);
      // Fetch total count
      const total = await getCount(params);
      paginationRef.current.totalRecords = total;
      const response = await getData(params);
      setData(response.data || []);
      setHasMoreData(
        (response.data || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (error) {
      setData([]);
      setHasMoreData(false);
      paginationRef.current.totalRecords = 0;
    } finally {
      setLoading(false);
      setLoadingTotalRecords(false);
    }
  }, []);

  // Call applyFilter on mount and when id changes
  useEffect(() => {
    filterRef.current = { productId: id };
    applyFilter();
  }, [id]);

  // Load more data for pagination
  const loadMore = useCallback(
    async (event?: any) => {
      if (loadingMore || !hasMoreData) {
        if (event?.target) event.target.complete();
        return;
      }
      setLoadingMore(true);
      try {
        paginationRef.current = {
          ...paginationRef.current,
          activePage: paginationRef.current.activePage + 1,
        };
        const params = prepareParams(filterRef.current, paginationRef.current);
        const response = await getData(params);
        setData((prev) => [...prev, ...(response.data || [])]);
        setHasMoreData(
          (response.data || []).length >= paginationRef.current.rowsPerPage,
        );
      } catch (error) {
        // handle error
      } finally {
        setLoadingMore(false);
      }
    },
    [loadingMore, hasMoreData],
  );

  const filterCallback = (a: { action: string; formData: any }) => {
    filterRef.current = { ...filterRef.current, ...a.formData };
    applyFilter();
  };

  const onViewLedger = (item: Record<string, any>) => {
    setSelectedLedgerId(item.stockLedgerId || "");
    setShowLedgerModal(true);
  };

  const ledgerModalCallback = (data: { action: string; data?: any }) => {
    setShowLedgerModal(false);
    setSelectedLedgerId("");
  };

  return (
    <>
      <InventoryProductAuditTab
        activeTab="stock-ledger"
        className="tw:mb-4"
        dealId={id || ""}
      />

      <div className="tw:mt-2">
        <Filter callback={filterCallback} />

        <div className="tw:flex tw:justify-between tw:items-end tw:mb-4">
          <div>
            <PaginationSummary
              paginationConfig={paginationRef.current}
              loadingTotalRecords={loadingTotalRecords}
              loadedCount={data.length}
              fwSize="sm"
            />
          </div>
        </div>
      </div>

      <MobileView
        data={data}
        loading={loading}
        showLoadMore={hasMoreData && !loading}
        loadingMore={loadingMore}
        loadMore={loadMore}
        totalCount={paginationRef.current.totalRecords}
        loadedCount={data.length}
        onView={onViewLedger}
      />

      <ViewStockLedgerModal
        show={showLedgerModal}
        callback={ledgerModalCallback}
        ledgerId={selectedLedgerId}
      />
    </>
  );
};

export default StockLedger;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Products Stock Ledger"),
    },
  ];
}
