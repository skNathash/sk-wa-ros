import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import InventoryProductAuditTab from "../components/inventory-audit-tab/InventoryAuditTab";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import { getCount, getData, prepareParams } from "./helper";
import CommonService from "~/services/CommonService";

const ProductSalesHistory = () => {
  const { t } = useTranslation(["common"]);
  const { id } = useParams();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingTotalRecords, setLoadingTotalRecords] = useState(false);

  const filterRef = useRef<Record<string, any>>({ dealId: id });
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
      const params = prepareParams(filterRef.current, paginationRef.current, {
        key: "date",
        value: "desc",
      });
      // Fetch total count
      const total = await getCount(id || "", params);
      paginationRef.current.totalRecords = total;

      const dealId = filterRef.current.dealId;
      const response = await getData(dealId, params);
      setData(response);

      setHasMoreData(response.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      setData([]);
      setHasMoreData(false);
      paginationRef.current.totalRecords = 0;
    } finally {
      setLoading(false);
      setLoadingTotalRecords(false);
    }
  }, []);

  // Call applyFilter on mount
  useEffect(() => {
    filterRef.current = { dealId: id };
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
        const params = prepareParams(filterRef.current, paginationRef.current, {
          key: "date",
          value: "desc",
        });
        const dealId = filterRef.current.dealId;
        const response = await getData(dealId, params);
        setData((prev) => [...prev, ...(response || [])]);
        setHasMoreData(response.length >= paginationRef.current.rowsPerPage);
      } catch (error) {
        // handle error
      } finally {
        setLoadingMore(false);
        if (event?.target) event.target.complete();
      }
    },
    [loadingMore, hasMoreData],
  );

  const filterCallback = (a: { action: string; formData: any }) => {
    filterRef.current = { ...filterRef.current, ...a.formData };
    applyFilter();
  };

  return (
    <>
      <InventoryProductAuditTab
        activeTab="purchase"
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
      />
    </>
  );
};

export default ProductSalesHistory;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Products Purchase History"),
    },
  ];
}
