import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";

import { Package } from "lucide-react";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useScreenView from "~/hooks/useScreenView";
import CommonService from "~/services/CommonService";
import type { BreadcrumbItem, ViewToggleType } from "~/types/CommonTypes";
import InventoryTab from "../../components/tab/InventoryTab";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import { getCount, getData, prepareParams } from "./helper";
import PageDescription from "~/components/core/page-description/PageDescription";
import ViewStockLedgerModal from "~/shared/catalog/modals/view-stock-ledger/ViewStockLedgerModal";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: {
      path: "/dashboard",
    },
  },
  {
    label: "Stock Master",
    langKey: "stockMaster",
  },
];

const StockLedger = () => {
  const { id } = useParams();
  const { isMobile } = useScreenView();
  const { t } = useTranslation(["common"]);

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingTotalRecords, setLoadingTotalRecords] = useState(false);

  const [view, setView] = useState<ViewToggleType>("list");
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
        (response.data || []).length >= paginationRef.current.rowsPerPage
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
          (response.data || []).length >= paginationRef.current.rowsPerPage
        );
      } catch (error) {
        // handle error
      } finally {
        setLoadingMore(false);
      }
    },
    [loadingMore, hasMoreData]
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
      <AppHeader title={t("stockMaster")} />
      <div className="page-bg app-page tw:p-4">
        <div className="app-container">
          <div className="tw:mb-4">
            <AppBreadcrumbs data={breadcrumbs} className="tw:!mb-0" />
            <PageDescription description="stockMaster" />
          </div>

          <InventoryTab activeTab="stock-master" className="tw:mb-4" />

          <div>
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
          </div>
          {isMobile || view === "card" ? (
            <>
              <MobileView data={data} loading={loading} onView={onViewLedger} />
              {hasMoreData && !loading && (
                <div className="tw:flex tw:justify-center tw:my-4">
                  <LoadMoreButton
                    loadMore={loadMore}
                    loading={loadingMore}
                    totalCount={paginationRef.current.totalRecords}
                    loadedCount={data.length}
                  />
                </div>
              )}
            </>
          ) : (
            <AppCard noPadding>
              <DesktopView
                data={data}
                loading={loading}
                hasMoreData={hasMoreData}
                loadMore={loadMore}
                loadingMore={loadingMore}
                totalCount={paginationRef.current.totalRecords}
                onView={onViewLedger}
              />
            </AppCard>
          )}
        </div>
      </div>

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
      title: CommonService.prepareAppDocumentTitle("Products Stock Master"),
    },
  ];
}
