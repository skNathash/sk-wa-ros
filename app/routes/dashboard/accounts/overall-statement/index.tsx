import { Download } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import AccountService from "~/services/AccountService";
import CommonService from "~/services/CommonService";
import RecordPaymentViewModal from "~/shared/accounts/modals/record-payment/view/RecordPaymentViewModal";
import type { PaginationState } from "~/types/CommonTypes";
import AppliedFilters from "./components/AppliedFilters";
import BalanceDisplay from "./components/BalanceDisplay";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import SummaryOverview from "./components/SummaryOverview";
import {
  defaultFilter,
  getCount,
  getData,
  getSummaryData,
  baseSummaryData,
  prepareParams,
} from "./helper";

const defaultPagination: PaginationState = {
  activePage: 1,
  rowsPerPage: 10,
  startSlNo: 1,
  endSlNo: 10,
  totalRecords: 0,
};

const OverallStatement = () => {
  const appToast = useAppToast();
  const { t } = useTranslation();
  const { isMobile } = useScreenView();
  const formMethods = useForm({
    defaultValues: defaultFilter,
  });

  const [searchParams] = useSearchParams();

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

  return (
    <>
      <div className="tw:text-xs tw:text-gray-500 tw:mb-2">
        {t("overallStatementDetails.consolidatedFinancialStatementSubtitle")}
      </div>
      <BalanceDisplay opening={openingBalance} closing={closingBalance} />

      <SummaryOverview summaryData={summaryData} />

      {/* <Categories fromDate={fromDate} toDate={toDate} /> */}

      <FormProvider {...formMethods}>
        <Filter />
        <AppliedFilters />
      </FormProvider>

      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:mb-4">
        <div>
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            loadedCount={data.length}
            fwSize="sm"
          />
        </div>
        <div>
          <AppButton
            size="small"
            color="light"
            fill="outline"
            onClick={handleDownload}
          >
            <Download />
            <span className="tw:hidden tw:md:inline">{t("download")}</span>
          </AppButton>
        </div>
      </div>

      {isMobile ? (
        <>
          <MobileView
            data={data}
            loading={loading}
            callback={handleItemCallback}
          />
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
