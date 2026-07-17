import React, { useEffect, useRef, useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import type { PaginationState, ViewToggleType } from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useScreenView from "~/hooks/useScreenView";
import { getData, prepareParams } from "./helper";
import { useForm, FormProvider } from "react-hook-form";
import Filter from "./components/Filter";
import SortPopover from "./components/SortPopover";

interface AllOrdersProps {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  mainTab?: string;
  salesEmployeeId?: string;
}

const AllOrders: React.FC<AllOrdersProps> = ({
  search = "",
  dateFrom = "",
  dateTo = "",
  mainTab = "",
  salesEmployeeId = "",
}) => {
  const formMethods = useForm({
    defaultValues: {
      search,
      status: "All",
      mainTab,
      dateRange: [] as Date[],
      salesEmployeeId,
    },
  });

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(false);
  const { isMobile } = useScreenView();

  const [view, setView] = useState<ViewToggleType>(isMobile ? "card" : "list");

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const sortRef = useRef<{ key: string; value: "asc" | "desc" }>({
    key: "orderedDate",
    value: "desc",
  });

  const abortRef = useRef<AbortController | null>(null);

  const applyFilter = async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    setLoading(true);
    setData([]);

    let isAborted = false;

    try {
      const params = prepareParams(
        formMethods.getValues(),
        paginationRef.current,
        sortRef.current,
      );
      const result = await getData(params, {
        signal: abortRef.current?.signal,
      });

      if (result.isClientError) {
        isAborted = true;
      }

      setData(result.data || []);
      const totalRecords = result.total || 0;
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(
        (result.data || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      if (!isAborted) {
        setLoading(false);
      }
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(
        formMethods.getValues(),
        paginationRef.current,
        sortRef.current,
      );
      const result = await getData(params);
      setData((prev) => [...prev, ...(result.data || [])]);
      setHasMoreData(
        (result.data || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  };

  // when parent props change, update form and reapply filter
  useEffect(() => {
    formMethods.setValue("search", search);
    formMethods.setValue("dateRange", [new Date(dateFrom), new Date(dateTo)]);
    formMethods.setValue("mainTab", mainTab);
    formMethods.setValue("salesEmployeeId", salesEmployeeId);

    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, dateFrom, dateTo, mainTab, salesEmployeeId]);

  const handleSort = (sort: { key: string; value?: "asc" | "desc" }) => {
    sortRef.current = { key: sort.key, value: sort.value || "desc" };
    applyFilter();
  };

  const showDesktopView = !isMobile && view === "list";

  return (
    <>
      <FormProvider {...formMethods}>
        <Filter
          callback={() => {
            applyFilter();
          }}
        />
      </FormProvider>

      <div className="tw:flex tw:items-center tw:justify-between tw:mb-3 tw:gap-2">
        <div className="tw:flex-1">
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            fwSize="sm"
            loadedCount={data.length}
          />
        </div>

        {!showDesktopView && (
          <SortPopover sortValue={sortRef.current} onSort={handleSort} />
        )}

        <ViewToggle viewType={view} callback={setView} />
      </div>
      {showDesktopView ? (
        <AppCard noPadding>
          <DesktopView
            data={data}
            loading={loading}
            loadMore={loadMore}
            loadingMore={loadingMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={data.length}
            showLoadMore={hasMoreData}
            sortKey={sortRef.current.key}
            sortValue={sortRef.current.value}
            onSort={handleSort}
          />
        </AppCard>
      ) : (
        <MobileView
          data={data}
          loading={loading}
          loadMore={loadMore}
          loadingMore={loadingMore}
          totalCount={paginationRef.current.totalRecords}
          loadedCount={data.length}
          showLoadMore={hasMoreData}
        />
      )}
    </>
  );
};

export default AllOrders;
