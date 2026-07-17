import { useCallback, useEffect, useRef, useState } from "react";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppCard from "~/components/core/card/AppCard";
import useScreenView from "~/hooks/useScreenView";
import type { PaginationState, SortProps } from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import Filter from "./components/Filter";
import AppliedFilters from "./components/AppliedFilters";
import WalletBalance from "./components/WalletBalance";
import { getCount, getData, prepareParams, defaultFilter } from "./helper";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import { useSearchParams } from "react-router";
import { FormProvider, useForm } from "react-hook-form";
import CommonService from "~/services/CommonService";
import type { FilterFormData } from "./helper";
import { useTranslation } from "react-i18next";

const defaultSort: SortProps = {
  key: "transactionDate",
  value: "desc",
};

const SKStatement = () => {
  const { t } = useTranslation(["common"]);
  const { isMobile } = useScreenView();
  const formMethods = useForm<FilterFormData>({
    defaultValues: defaultFilter,
  });

  const [searchParams] = useSearchParams();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  // Refs
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
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
      const filterData = formMethods.getValues();
      const params = prepareParams(
        filterData,
        paginationRef.current,
        defaultSort
      );
      const result = await getData(params);
      setData(result || []);
      const totalRecords = await getCount(params);

      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(result?.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      setData([]);
      setHasMoreData(false);
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
      const params = prepareParams(
        filterData,
        paginationRef.current,
        defaultSort
      );
      const result = await getData(params);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage
      );
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, formMethods]);

  // Sync form with URL search params
  useEffect(() => {
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const payoutType = searchParams.get("payoutType") || "all";

    formMethods.setValue("search", search);
    if (dateFrom && dateTo) {
      formMethods.setValue("dateRange", [
        new Date(dateFrom),
        new Date(dateTo),
      ] as Date[]);
    } else {
      formMethods.setValue("dateRange", defaultFilter.dateRange);
    }
    formMethods.setValue("payoutType", payoutType || defaultFilter.payoutType);

    applyFilter();
  }, [searchParams, formMethods, applyFilter]);

  return (
    <div className="tw:space-y-4">
      {/* Short Description */}
      <div className="tw:text-xs tw:text-gray-500 tw:mb-2">
        {t("skWalletStatementDescription")}
      </div>

      {/* Wallet Balance Component */}
      <WalletBalance />

      {/* Filter, AppliedFilters, and PaginationSummary - Common for both views */}
      <FormProvider {...formMethods}>
        <Filter />
        <AppliedFilters />
      </FormProvider>
      <PaginationSummary
        paginationConfig={paginationRef.current}
        loadingTotalRecords={loading}
        loadedCount={data.length}
        fwSize="sm"
        className="tw:mb-4"
      />

      {/* Mobile View */}
      {isMobile ? (
        <>
          <MobileView data={data} loading={loading} />
          {hasMoreData && !loading && (
            <LoadMoreButton
              loadMore={loadMore}
              loading={loadingMore}
              totalCount={paginationRef.current.totalRecords}
              loadedCount={data.length}
              noMargin={true}
            />
          )}
        </>
      ) : (
        <AppCard noPadding>
          <DesktopView
            data={data}
            loading={loading}
            loadmore={loadMore}
            loadingMore={loadingMore}
            totalCount={paginationRef.current.totalRecords}
            hasMore={hasMoreData}
          />
        </AppCard>
      )}
    </div>
  );
};

export default SKStatement;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("SK Statement History"),
    },
  ];
}
