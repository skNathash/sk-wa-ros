import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useScreenView from "~/hooks/useScreenView";
import type { BreadcrumbItem, PaginationState } from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import { getCount, getData, prepareParams } from "./helper";

export async function clientLoader() {
  return true;
}

const defaultFilter = {
  search: "",
  dateRange: null,
  type: "",
};

const defaultPagination: PaginationState = {
  activePage: 1,
  rowsPerPage: 10,
  startSlNo: 1,
  endSlNo: 10,
  totalRecords: 0,
};

const DepositMoneyList = () => {
  const { t } = useTranslation(["common"]);
  const { isMobile } = useScreenView();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [view, setView] = useState<"list" | "card">("list");

  const filterRef = useRef<any>({ ...defaultFilter });
  const paginationRef = useRef<PaginationState>({ ...defaultPagination });
  const sortRef = useRef<any>(undefined);

  useEffect(() => {
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    setLoading(true);
    setItems([]);
    try {
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current,
      );
      const total = await getCount(params);
      paginationRef.current.totalRecords = total;
      const data = await getData(params);
      setItems(data);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoading(false);
    }
  }, []);

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
        sortRef.current,
      );
      const data = await getData(params);
      setItems((prev) => [...prev, ...data]);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  const handleItemClick = (item: any) => {
    // navigate or show details - placeholder
  };

  const filterCallback = (data: { formData: any }) => {
    filterRef.current = { ...filterRef.current, ...data.formData };
    applyFilter();
  };

  return (
    <>
      <AppHeader title={t("depositMoney") || "Deposit Money"} />
      <div className="page-bg app-page tw:p-4">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbsData} className="tw:mb-4" />

          {/* <DepositMoneyTab activeTab="transactions" className="tw:mb-4" /> */}

          <Filter callback={filterCallback} className="tw:mt-2" />

          <div className="tw:mb-4 tw:flex tw:md:flex-row tw:flex-col tw:md:justify-between tw:md:items-end tw:gap-2">
            <div className="tw:flex-1 tw:flex tw:flex-row tw:md:flex-col tw:gap-2 tw:justify-between tw:items-center tw:md:items-start">
              <PaginationSummary
                paginationConfig={paginationRef.current}
                loadingTotalRecords={loading}
                loadedCount={items.length}
                fwSize="sm"
              />
            </div>

            <div className="tw:flex tw:gap-2">
              <ViewToggle viewType={view} callback={setView} />
            </div>
          </div>

          {isMobile || view === "card" ? (
            <MobileView
              items={items}
              loading={loading}
              onItemClick={handleItemClick}
            />
          ) : (
            <DesktopView
              items={items}
              loading={loading}
              onItemClick={handleItemClick}
            />
          )}

          {hasMoreData && (
            <LoadMoreButton
              loadMore={loadMore}
              loading={loadingMore}
              totalCount={paginationRef.current.totalRecords}
              loadedCount={items.length}
            />
          )}
        </div>
      </div>
    </>
  );
};

const breadcrumbsData: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: {
      path: "/dashboard",
    },
  },
  {
    label: "Deposit Money",
    redirect: {
      path: "/dashboard/deposit-money/options",
    },
  },
  {
    label: "Transactions",
  },
];

export default DepositMoneyList;
