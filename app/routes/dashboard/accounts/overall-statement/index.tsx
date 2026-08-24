import { Download, FilterIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppButton from "~/components/core/button/AppButton";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppCard from "~/components/core/card/AppCard";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import useTheme from "~/hooks/useTheme";
import AccountService from "~/services/AccountService";
import CommonService from "~/services/CommonService";
import RecordPaymentViewModal from "~/shared/accounts/modals/record-payment/view/RecordPaymentViewModal";
import type { PaginationState, TabItem } from "~/types/CommonTypes";
import AppliedFilters from "./components/AppliedFilters";
import BalanceDisplay from "./components/BalanceDisplay";
import ChatView from "./components/ChatView";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import MoneyFlow from "./components/money-flow/MoneyFlow";
import NetCash from "./components/net-cash/NetCash";
import PnlOverview from "./components/PnlOverview";
import SummaryOverview from "./components/SummaryOverview";
import ThreePipes from "./components/three-pipes/ThreePipes";
import TopParties from "./components/top-parties/TopParties";
import UpcomingDues from "./components/upcoming-dues/UpcomingDues";
import FilterModal from "./modals/FilterModal";
import {
  defaultFilter,
  getCount,
  getData,
  getSummaryData,
  baseSummaryData,
  prepareParams,
  prepareFilterQueryParams,
  type FilterFormData,
} from "./helper";

const defaultPagination: PaginationState = {
  activePage: 1,
  rowsPerPage: 10,
  startSlNo: 1,
  endSlNo: 10,
  totalRecords: 0,
};

type ViewMode = "summary" | "details";

const viewTabs: TabItem[] = [
  { key: "summary", name: "Summary", langKey: "summary", icon: "layout-grid" },
  { key: "details", name: "Details", langKey: "details", icon: "list" },
];

const OverallStatement = () => {
  const appToast = useAppToast();
  const appNav = useAppNav();
  const { t } = useTranslation();
  const { isMobile } = useScreenView();
  const theme = useTheme();
  const isTheme2 = theme === "theme-2";
  const formMethods = useForm({
    defaultValues: defaultFilter,
  });

  const [searchParams, setSearchParams] = useSearchParams();

  const [viewMode, setViewMode] = useState<ViewMode>("summary");

  const [filterModal, setFilterModal] = useState<{
    show: boolean;
    data: Record<string, any>;
  }>({
    show: false,
    data: {},
  });

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);

  const [summaryData, setSummaryData] = useState<any[]>(
    baseSummaryData.map((item) => ({ ...item, loading: true })),
  );

  const [busyloader, setBusyloader] = useState({
    show: false,
    message: "",
  });

  /* Theme-2 collapses this page's toolbar row into the accounts header row:
     the only actions left are Deposit Money (owned by the layout) and Download,
     which we portal up into the layout's action slot. */
  const [headerActionSlot, setHeaderActionSlot] = useState<HTMLElement | null>(
    null,
  );

  const [recordPaymentViewModal, setRecordPaymentViewModal] = useState<{
    show: boolean;
    data: any;
  }>({
    show: false,
    data: null,
  });

  // Refs
  const paginationRef = useRef<PaginationState>(defaultPagination);

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
      const filterData = formMethods.getValues();

      // First, get opening balance from earliest transaction
      const openingParams = prepareParams(filterData, paginationRef.current, {
        key: "paymentDate",
        value: "asc",
      });
      const openingResult = await getData(openingParams);

      setOpeningBalance(openingResult?.[0]?.balanceBefore || 0);

      // Then, get data with desc sort
      const params = prepareParams(filterData, paginationRef.current, {
        key: "paymentDate",
        value: "desc",
      });
      const result = await getData(params);
      setData(result || []);
      setClosingBalance(result?.[0]?.balanceAfter || 0);

      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );

      // Fetch summary data
      const summaryValues = await getSummaryData(filterData);
      setSummaryData(
        baseSummaryData.map((item, index) => ({
          ...item,
          value: summaryValues[index],
          loading: false,
        })),
      );
    } catch (e) {
      setData([]);
      setHasMoreData(false);
      setOpeningBalance(0);
      setClosingBalance(0);
      setSummaryData(
        baseSummaryData.map((item) => ({ ...item, value: 0, loading: false })),
      );
    } finally {
      setLoading(false);
    }
  }, [formMethods]);

  // Load more handler
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const filterData = formMethods.getValues();
      const params = prepareParams(filterData, paginationRef.current, {
        key: "paymentDate",
        value: "desc",
      });
      const result = await getData(params);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, formMethods]);

  useEffect(() => {
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const type = searchParams.get("type") || "All";
    const sourceType = searchParams.get("sourceType") || "All";

    formMethods.setValue("search", search);
    if (dateFrom && dateTo) {
      formMethods.setValue("dateRange", [
        new Date(dateFrom),
        new Date(dateTo),
      ] as Date[]);
    }
    formMethods.setValue("type", type || defaultFilter.type);
    formMethods.setValue("sourceType", sourceType || defaultFilter.sourceType);

    applyFilter();
  }, [searchParams, formMethods, applyFilter]);

  useEffect(() => {
    if (!isTheme2) return;
    setHeaderActionSlot(document.getElementById("accounts-header-actions"));
  }, [isTheme2]);

  const handleDownload = useCallback(async () => {
    setBusyloader({ show: true, message: "Downloading data..." });
    const filterData = formMethods.getValues();
    const params = prepareParams(filterData, defaultPagination, {
      key: "paymentDate",
      value: "desc",
    });
    const result = await getData({ ...params, outputType: "download" }, true);

    const fileName = result?.data?.fileName;
    if (fileName) {
      CommonService.windowOpenHandler(
        AccountService.downloadStatementUrl(fileName),
        () => {},
      );
    } else {
      appToast.show({
        msg: "Failed to download data",
        color: "danger",
      });
    }
    setBusyloader({ show: false, message: "" });
  }, [formMethods, appToast]);

  const handleFilterChange = useCallback(() => {
    const formData = formMethods.getValues();
    const params: Record<string, any> = prepareFilterQueryParams(
      formData as FilterFormData,
    );

    // Preserve existing URL parameters that should not be removed
    const tab = searchParams.get("tab");
    if (tab) {
      params.tab = tab;
    }
    params.dateFrom = searchParams.get("dateFrom");
    params.dateTo = searchParams.get("dateTo");

    setSearchParams(params);
  }, [formMethods, searchParams, setSearchParams]);

  const openFilterModal = useCallback(() => {
    setFilterModal({ show: true, data: formMethods.getValues() });
  }, [formMethods]);

  const handleFilterModalCallback = useCallback(
    (result: { action: string; data?: any }) => {
      if (result.action === "apply" || result.action === "reset") {
        formMethods.setValue("dateRange", result.data.dateRange);
        formMethods.setValue("type", result.data.type);
        formMethods.setValue("sourceType", result.data.sourceType);
        handleFilterChange();
      }
      setFilterModal({ show: false, data: defaultFilter });
    },
    [formMethods, handleFilterChange],
  );

  const handleItemCallback = (payload: { action: string; data?: any }) => {
    if (
      payload.action === "viewPayment" &&
      payload.data.sourceType === "PAYMENT"
    ) {
      setRecordPaymentViewModal({ show: true, data: payload.data });
    }
  };

  const handleRecordPaymentViewModalCallback = () => {
    setRecordPaymentViewModal({ show: false, data: null });
  };

  const downloadButton = (
    <AppButton
      fill="outline"
      color="light"
      size="small"
      className="statement-toolbar-btn"
      onClick={handleDownload}
    >
      <Download size={16} />
      <span className="tw:hidden tw:md:inline">{t("download")}</span>
    </AppButton>
  );

  return (
    <>
      {isTheme2 ? (
        // Only Download survives here — it rides beside Deposit Money in the
        // accounts header row. Subtitle, view tabs and filter are dropped.
        headerActionSlot && createPortal(downloadButton, headerActionSlot)
      ) : (
        <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-x-4 tw:gap-y-2 tw:mb-3">
          <p className="overall-statement-subtitle hide-in-theme-2 tw:text-xs tw:text-gray-500 tw:leading-relaxed">
            {t("overallStatementDetails.consolidatedFinancialStatementSubtitle")}
          </p>

          <div className="tw:flex tw:flex-1 tw:items-center tw:justify-between tw:gap-2">
            <AppTab
              tabs={viewTabs}
              activeTab={viewMode}
              onTabChange={(tab) => setViewMode(tab.key as ViewMode)}
              compact
            />

            {/* Filter/download actions sit on the tab row in both views. */}
            <div className="tw:flex tw:items-center tw:gap-2">
              <AppButton
                fill="outline"
                color="light"
                size="small"
                className="statement-toolbar-btn"
                onClick={openFilterModal}
              >
                <FilterIcon size={16} />
              </AppButton>
              {downloadButton}
            </div>
          </div>
        </div>
      )}

      {viewMode === "summary" ? (
        <>
          <FormProvider {...formMethods}>
            <div className="tw:mb-3 statement-toolbar">
              <AppliedFilters />
            </div>
          </FormProvider>

          {isTheme2 ? (
            /* Theme-2 gets the cash-flow overview: one headline number, the
               in/out/waiting split, the three lanes money moves through, the
               top counter-parties and what falls due next. */
            <>
              <NetCash />
              <MoneyFlow />
              <ThreePipes />
              <TopParties />
              <UpcomingDues />
            </>
          ) : (
            <>
              <BalanceDisplay
                opening={openingBalance}
                closing={closingBalance}
              />
              <PnlOverview />
              <SummaryOverview summaryData={summaryData} />
            </>
          )}
        </>
      ) : (
        <>
          <FormProvider {...formMethods}>
            <div className="tw:mb-3 tw:space-y-2 statement-toolbar">
              <Filter onFilterChange={handleFilterChange} />
              <AppliedFilters />
            </div>
          </FormProvider>

          <div className="tw:hidden tw:md:flex tw:items-center tw:justify-between tw:gap-2 tw:mb-3">
            <div>
              <PaginationSummary
                paginationConfig={paginationRef.current}
                loadingTotalRecords={loading}
                loadedCount={data.length}
                fwSize="sm"
              />
            </div>
          </div>

          {isMobile ? (
            <>
              {isTheme2 ? (
                <ChatView
                  data={data}
                  loading={loading}
                  callback={handleItemCallback}
                />
              ) : (
                <MobileView
                  data={data}
                  loading={loading}
                  callback={handleItemCallback}
                />
              )}
              {hasMoreData && !loading && (
                <div className="tw:text-center tw:mt-4">
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
                loadMore={loadMore}
                loadingMore={loadingMore}
                totalCount={paginationRef.current.totalRecords}
                loadedCount={data.length}
                hasMoreData={hasMoreData}
                callback={handleItemCallback}
              />
            </AppCard>
          )}
        </>
      )}

      <FilterModal
        show={filterModal.show}
        callback={handleFilterModalCallback}
        data={filterModal.data}
      />

      <BusyLoader show={busyloader.show} message={busyloader.message} />

      <RecordPaymentViewModal
        show={recordPaymentViewModal.show}
        callback={handleRecordPaymentViewModalCallback}
        transactionId={recordPaymentViewModal.data?.transactionId}
      />
    </>
  );
};

export default OverallStatement;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Overall Statement"),
    },
  ];
}
