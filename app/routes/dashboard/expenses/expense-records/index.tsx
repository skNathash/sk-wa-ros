import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import CommonService from "~/services/CommonService";
import type { PaginationState, ViewToggleType } from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import { getCount, getData, prepareParams } from "./helper";
import Filter from "./components/Filter";

const defaultFilter = {
  search: "",
  dateRange: null,
  category: null,
  subcategory: null,
  status: "all",
  type: "all",
};

const ExpenseRecords = () => {
  const { t } = useTranslation(["expense"]);
  const appNav = useAppNav();
  const appToast = useAppToast();
  const { isMobile } = useScreenView();

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [view, setView] = useState<ViewToggleType>("list");

  const filterRef = useRef<Record<string, any>>({ ...defaultFilter });
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
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
    setRecords([]);
    try {
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        undefined
      );
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      const data = await getData(params);
      setRecords(data);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      console.error(e);
      appToast.show({ msg: t("errorOccured") || "Error", color: "danger" });
    } finally {
      setLoading(false);
    }
  }, [appToast, t]);

  // Load more
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
        undefined
      );
      const data = await getData(params);
      setRecords((prev) => [...prev, ...data]);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      console.error(e);
      appToast.show({ msg: t("errorOccured") || "Error", color: "danger" });
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, appToast, t]);

  const handleFilterChange = useCallback(
    ({ formData }: any) => {
      filterRef.current = { ...filterRef.current, ...formData };
      applyFilter();
    },
    [applyFilter]
  );

  const handleItemAction = useCallback(
    ({ action, data }: any) => {
      if (action === "view") {
        appNav.to(`/dashboard/expenses/view/${data._id}`);
      } else if (action === "receipt") {
        // open receipt in new tab or modal - placeholder
        if (data?.receiptUrl) window.open(data.receiptUrl, "_blank");
      }
    },
    [appNav]
  );

  return (
    <>
      <Filter callback={handleFilterChange} />

      <div className="tw:flex tw:justify-between tw:mb-3 tw:items-center">
        <div>
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            loadedCount={records.length}
            fwSize="sm"
          />
        </div>
        <ViewToggle viewType={view} callback={setView} />
      </div>

      {isMobile || view === "card" ? (
        <MobileView
          data={records}
          callback={handleItemAction}
          showLoadMore={hasMoreData}
          loadingMore={loadingMore}
          loadMore={loadMore}
          totalCount={paginationRef.current.totalRecords}
          loadedCount={records.length}
          loading={loading}
        />
      ) : (
        <AppCard noPadding>
          <DesktopView
            data={records}
            loading={loading}
            callback={handleItemAction}
            loadedCount={records.length}
            showLoadMore={hasMoreData && !loading}
            loadingMore={loadingMore}
            loadMore={loadMore}
            totalCount={paginationRef.current.totalRecords}
          />
        </AppCard>
      )}
    </>
  );
};

export default ExpenseRecords;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Expense Records"),
    },
  ];
}
