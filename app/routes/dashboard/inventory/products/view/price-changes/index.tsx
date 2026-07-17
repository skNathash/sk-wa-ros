import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useScreenView from "~/hooks/useScreenView";
import CommonService from "~/services/CommonService";
import type { SortValue } from "~/types/CommonTypes";
import InventoryProductAuditTab from "../components/inventory-audit-tab/InventoryAuditTab";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import { getCount, getData, prepareParams } from "./helper";

const ProductPriceChanges = () => {
  const { t } = useTranslation(["common"]);
  const { id } = useParams();
  const { isMobile } = useScreenView();

  const [view, setView] = useState<"list" | "card">("list");

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingTotalRecords, setLoadingTotalRecords] = useState(false);
  const [sortKey, setSortKey] = useState<string>("createdAt");
  const [sortValue, setSortValue] = useState<"asc" | "desc">("desc");

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
  const applyFilter = async () => {
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
        key: sortKey,
        value: sortValue,
      });
      // Fetch total count
      const total = await getCount(params);
      paginationRef.current.totalRecords = total;
      const response = await getData(params);
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
  };

  // Call applyFilter on mount and when id changes
  useEffect(() => {
    filterRef.current = { productId: id };
    applyFilter();
  }, [id, sortKey, sortValue]);

  // Load more data for pagination
  const loadMore = async () => {
    if (loadingMore || !hasMoreData) {
      return;
    }
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(filterRef.current, paginationRef.current, {
        key: sortKey,
        value: sortValue,
      });
      const response = await getData(params);
      setData((prev) => [...prev, ...response]);
      setHasMoreData(response.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  };

  const filterCallback = (a: { formData: any }) => {
    filterRef.current = { ...filterRef.current, ...a.formData };
    applyFilter();
  };

  const handleSort = (sortData: { key: string; value: SortValue }) => {
    if (sortData.value) {
      setSortKey(sortData.key);
      setSortValue(sortData.value);
    }
  };

  return (
    <>
      <InventoryProductAuditTab
        activeTab="price-changes"
        className="tw:mb-4"
        dealId={id || ""}
      />

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
        <ViewToggle viewType={view} callback={setView} />
      </div>
      {isMobile || view === "card" ? (
        <MobileView
          data={data}
          showLoadMore={hasMoreData && !loading}
          loadingMore={loadingMore}
          loadMore={loadMore}
          totalCount={paginationRef.current.totalRecords}
          loadedCount={data.length}
        />
      ) : (
        <AppCard noPadding>
          <DesktopView
            data={data}
            loading={loading}
            emptyText={t("noPriceChangesFound")}
            onSort={handleSort}
            sortKey={sortKey}
            sortValue={sortValue}
            showLoadMore={hasMoreData && !loading}
            loadingMore={loadingMore}
            loadMore={loadMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={data.length}
          />
        </AppCard>
      )}
    </>
  );
};

export default ProductPriceChanges;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Products Price Changes"),
    },
  ];
}
