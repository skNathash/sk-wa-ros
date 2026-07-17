import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppCard from "~/components/core/card/AppCard";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useScreenView from "~/hooks/useScreenView";
import CommonService from "~/services/CommonService";
import type {
  PaginationState,
  SortProps,
  ViewToggleType,
} from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import { getCount, getData, prepareParams } from "./helper";

const defaultSort: SortProps = {
  key: "transactionDate",
  value: "desc",
};

type FormValues = {
  search: string;
  dateRange: Date[];
  status: string;
  type: string;
};

const Transactions = () => {
  const { isMobile } = useScreenView();
  const { t } = useTranslation(["common"]);

  const [searchParams] = useSearchParams();
  const fromDate = searchParams.get("from") || "";
  const toDate = searchParams.get("to") || "";

  const formMethods = useForm<FormValues>({
    defaultValues: {
      search: "",
      dateRange: [] as Date[],
      status: "",
      type: "",
    },
  });

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const [viewType, setViewType] = useState<ViewToggleType>("list");

  // Refs
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });
  const filterRef = useRef<any>({});

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
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        defaultSort
      );
      const result = await getData(params);
      setData(result || []);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
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

  // Handle filter changes
  const handleFilterChange = useCallback(
    ({ formData, action }: { formData: any; action: string }) => {
      if (action === "apply") {
        filterRef.current = { ...filterRef.current, ...formData };
        applyFilter();
      }
    },
    [applyFilter]
  );

  // Load more handler
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
        defaultSort
      );
      const result = await getData(params);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(result?.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      // handle error
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

  return (
    <AppCard title={t("allTransactions")} icon="file-text">
      <FormProvider {...formMethods}>
        <Filter callback={handleFilterChange} />
      </FormProvider>
      <div className="tw:flex tw:items-center tw:justify-between tw:mb-4">
        <div>
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            loadedCount={data.length}
            fwSize="sm"
          />
        </div>
        <ViewToggle viewType={viewType} callback={setViewType} />
      </div>
      {isMobile || viewType === "card" ? (
        <>
          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
            <MobileView data={data} loading={loading} />
          </div>
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
        <DesktopView
          data={data}
          loading={loading}
          loadMore={loadMore}
          loadingMore={loadingMore}
          totalCount={paginationRef.current.totalRecords}
          loadedCount={data.length}
          hasMoreData={hasMoreData}
        />
      )}
    </AppCard>
  );
};

export default Transactions;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Transactions"),
    },
  ];
}
