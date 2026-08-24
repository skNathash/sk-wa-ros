import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import useAppNav from "~/hooks/useAppNav";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import { getCount, getData, prepareParams } from "./helper";
import Summary from "./components/Summary";
import SalesTrend from "./components/SalesTrend";
import CommonService from "~/services/CommonService";

const ProductSalesHistory = () => {
  const { id } = useParams();
  const { to } = useAppNav();
  const { t } = useTranslation(["common"]);

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingTotalRecords, setLoadingTotalRecords] = useState(false);

  const [summary, setSummary] = useState({
    totalOrders: 0,
    totalUnits: 0,
    totalRevenue: 0,
  });

  // Deal state

  // State and refs for filter, pagination, and data
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
      const dealId = filterRef.current.dealId;

      // Fetch total count
      const countResponse = await getCount(dealId, params);
      paginationRef.current.totalRecords = countResponse.count;
      setSummary({
        totalOrders: countResponse.count,
        totalUnits: countResponse.totalUnits,
        totalRevenue: countResponse.totalRevenue,
      });

      const response = await getData(dealId, params);
      setData(response || []);

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
    [loadingMore, hasMoreData]
  );

  const filterCallback = (a: { action: string; formData: any }) => {
    filterRef.current = { ...filterRef.current, ...a.formData };
    applyFilter();
  };

  const mobileCallback = useCallback(
    (args: { action: string; data: any }) => {
      if (args.action === "view-order") {
        to(`/dashboard/orders/view/${args.data._id}`);
      }
    },
    [to]
  );

  return (
    <>
      <Summary
        totalRevenue={summary.totalRevenue}
        totalUnits={summary.totalUnits}
        totalOrders={summary.totalOrders}
      />

      <SalesTrend dealId={id || ""} />

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
        callback={mobileCallback}
      />
    </>
  );
};

export default ProductSalesHistory;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Products Sales History"),
    },
  ];
}
