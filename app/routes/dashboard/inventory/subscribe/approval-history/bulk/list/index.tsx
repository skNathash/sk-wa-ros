import AppCard from "~/components/core/card/AppCard";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { PaginationState, ViewToggleType } from "~/types/CommonTypes";
import useScreenView from "~/hooks/useScreenView";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import useAppNav from "~/hooks/useAppNav";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import Filter from "./components/Filter";
import { getData, getCount, prepareParams } from "./helper";
import PageAccessService from "~/services/PageAccessService";
import CommonService from "~/services/CommonService";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["CATALOG.SUBSCRIBE"], {
    allowNoSubscribe: true,
  });
}

const rbacRoles = {
  subscribe: ["CATALOG.SUBSCRIBE"],
  addProduct: ["CATALOG.ADD-PRODUCT"],
};

const defaultFilter = {
  search: "",
  dateRange: null,
  status: "",
};

const SubscribeApprovalHistoryBulkList = () => {
  const appNav = useAppNav();
  const { isMobile } = useScreenView();
  const { t } = useTranslation(["common"]);

  const [bulkUploads, setBulkUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewType, setViewType] = useState<ViewToggleType>("list");

  const filterRef = useRef<any>({ ...defaultFilter });
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const sortRef = useRef<{ key: string; value: "asc" | "desc" }>({
    key: "date",
    value: "desc",
  });

  useEffect(() => {
    applyFilter();
  }, []);

  // Apply filter and reset pagination
  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    setLoading(true);
    setBulkUploads([]);
    try {
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current
      );
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      const bulkUploadsData = await getData(params);
      setBulkUploads(bulkUploadsData);
      setHasMoreData(
        bulkUploadsData.length >= paginationRef.current.rowsPerPage
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more data for load more button
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) {
      return;
    }
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
      const bulkUploadsData = await getData(params);
      setBulkUploads((prev) => [...prev, ...bulkUploadsData]);
      setHasMoreData(
        bulkUploadsData.length >= paginationRef.current.rowsPerPage
      );
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  const handleFilterChange = useCallback(
    ({ formData }: any) => {
      filterRef.current = {
        ...filterRef.current,
        ...formData,
      };
      applyFilter();
    },
    [applyFilter]
  );

  const handleItemClick = useCallback(
    ({ action, data }: any) => {
      if (action === "view") {
        appNav.to(
          `/dashboard/inventory/subscribe/approval-history/bulk-upload/view/${data._id}`
        );
      }
    },
    [appNav]
  );

  const handleSort = useCallback(
    ({ key, value }: any) => {
      sortRef.current = { key, value };
      applyFilter();
    },
    [applyFilter]
  );

  return (
    <>
      <div>
        <Filter
          callback={handleFilterChange}
          className="app-filter-band tw:mb-4"
        />

        <div className="tw:mb-4 tw:flex tw:justify-between tw:items-center">
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            loadedCount={bulkUploads.length}
            fwSize="sm"
          />

          <ViewToggle viewType={viewType} callback={setViewType} />
        </div>

        {isMobile || viewType === "card" ? (
          <>
            <MobileView
              data={bulkUploads}
              loading={loading}
              callback={handleItemClick}
            />
            {hasMoreData && !loading && (
              <div className="tw:flex tw:justify-center tw:mt-6">
                <LoadMoreButton
                  loadMore={loadMore}
                  loading={loadingMore}
                  totalCount={paginationRef.current.totalRecords}
                  loadedCount={bulkUploads.length}
                />
              </div>
            )}
          </>
        ) : (
          <AppCard noPadding>
            <DesktopView
              data={bulkUploads}
              loading={loading}
              callback={handleItemClick}
              sortKey={sortRef.current.key}
              sortValue={sortRef.current.value}
              onSort={handleSort}
              showLoadMore={hasMoreData}
              loadingMore={loadingMore}
              loadMore={loadMore}
              totalCount={paginationRef.current.totalRecords}
            />
          </AppCard>
        )}
      </div>
    </>
  );
};

export default SubscribeApprovalHistoryBulkList;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle(
        "Catalog Approval History Bulk List"
      ),
    },
  ];
}
