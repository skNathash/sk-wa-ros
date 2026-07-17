import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { FormProvider, useForm } from "react-hook-form";
import type { PaginationState } from "~/types/CommonTypes";
import { prepareParams, getData, getCount } from "./helper";
import AppCard from "~/components/core/card/AppCard";
import Amount from "~/components/core/amount/Amount";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import useScreenView from "~/hooks/useScreenView";
import { useTranslation } from "react-i18next";
import CommonService from "~/services/CommonService";
import MobileView from "./components/MobileView";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import ActivePlan from "./components/ActivePlan";
import AppPopover from "~/components/core/popover/AppPopover";
import { Info } from "lucide-react";
import InfoBlock from "~/components/core/info-blk/InfoBlock";

const PurchaseCommission = () => {
  const { isMobile } = useScreenView();
  const { t } = useTranslation(["common"]);
  const formMethods = useForm();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);

  const [searchParams] = useSearchParams();
  const fromDate = searchParams.get("dateFrom") || "";
  const toDate = searchParams.get("dateTo") || "";

  // Refs
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const filterRef = useRef<any>({
    dateRange: fromDate && toDate ? [fromDate, toDate] : [],
  });

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
      const params = prepareParams(filterRef.current, paginationRef.current, {
        key: "date",
        value: "desc",
      });
      const result = await getData(params);
      setData(result || []);
      const { count, amount } = await getCount(params);
      paginationRef.current.totalRecords = count;
      setTotalAmount(amount ?? 0);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage
      );
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more handler
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
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
      const result = await getData(params);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage
      );
    } catch (e) {
      // noop
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  useEffect(() => {
    if (fromDate && toDate) {
      formMethods.setValue("dateRange", [new Date(fromDate), new Date(toDate)]);
      filterRef.current = {
        ...filterRef.current,
        dateRange: [new Date(fromDate), new Date(toDate)],
      };
    }
    applyFilter();
  }, [fromDate, toDate]);

  // Optional filter change callback placeholder
  const onFilterChange = useCallback((payload: any) => {
    filterRef.current = { ...filterRef.current, ...(payload?.formData || {}) };
    applyFilter();
  }, []);

  const description = t("feeSupportDescription");

  return (
    <>
      <div className="tw:mb-4 tw:flex tw:items-center tw:gap-2">
        <h2 className="tw:text-lg tw:font-semibold">{t("platformFee")}</h2>
        <AppPopover
          triggerContent={
            <button className="tw:text-gray-500 tw:cursor-pointer hover:tw:text-gray-700">
              <Info size={16} />
            </button>
          }
        >
          <div className="tw:text-xs tw:text-gray-500">{description}</div>
        </AppPopover>
      </div>
      <FormProvider {...formMethods}>
        <Filter callback={onFilterChange} showDateRange={false} />
      </FormProvider>

      {/* Note InfoBlock */}
      <InfoBlock variant="info" size="sm" className="tw:mb-4">
        <div className="tw:flex tw:items-start tw:gap-3">
          <Info
            size={16}
            className="tw:text-blue-600 tw:flex-shrink-0 tw:mt-0.5"
          />
          <p className="tw:text-xs tw:text-blue-800 tw:leading-relaxed tw:m-0">
            You will receive a consolidated receipt at the end of the month.
          </p>
        </div>
      </InfoBlock>

      <ActivePlan />

      <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:items-center tw:justify-between tw:mb-4 tw:gap-3">
        <div>
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            loadedCount={data.length}
            fwSize="sm"
            className="tw:mb-0"
          />
        </div>
        {!!paginationRef.current.totalRecords && (
          <div className="tw:flex tw:items-center tw:gap-2 tw:bg-gray-50 tw:px-3 tw:py-2 tw:rounded-md tw:border tw:border-gray-200 tw:w-full tw:sm:w-auto">
            <span className="tw:text-xs tw:text-gray-600 tw:font-medium">
              {t("totalAmount")}:
            </span>
            <Amount
              value={totalAmount}
              decimalPlaces={2}
              className="wa-amount tw:text-base tw:font-semibold tw:text-[color:var(--wa-domain-out)]"
            />
          </div>
        )}
      </div>

      {isMobile ? (
        <>
          <MobileView items={data} loading={loading} />
          <div className="tw:text-center tw:mt-4">
            <LoadMoreButton
              loadMore={loadMore}
              loading={loadingMore}
              totalCount={paginationRef.current.totalRecords}
              loadedCount={data.length}
            />
          </div>
        </>
      ) : (
        <AppCard noPadding>
          <DesktopView
            data={data as any}
            loading={loading}
            loadMore={loadMore}
            loadingMore={loadingMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={data.length}
            hasMoreData={hasMoreData}
          />
        </AppCard>
      )}
    </>
  );
};

export default PurchaseCommission;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Purchase Commission"),
    },
  ];
}
