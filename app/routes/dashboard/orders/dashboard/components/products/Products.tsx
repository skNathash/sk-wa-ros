import React, { useEffect } from "react";
import AppCard from "~/components/core/card/AppCard";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import Filter from "./components/Filter";
import { useRef, useState } from "react";
import { prepareParams, getData } from "./helper";
import type { PaginationState, ViewToggleType } from "~/types/CommonTypes";
import useScreenView from "~/hooks/useScreenView";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import { FormProvider, useForm } from "react-hook-form";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import SortPopover from "./components/SortPopover";

type ProductsProps = {
  mainTab: string;
  search: string;
  dateFrom: string;
  dateTo: string;
  salesEmployeeId?: string;
};

const Products = ({
  mainTab = "",
  search = "",
  dateFrom = "",
  dateTo = "",
  salesEmployeeId = "",
}: ProductsProps) => {
  const formMethods = useForm({
    defaultValues: {
      search,
      dateRange: [] as Date[],
      mainTab,
      salesEmployeeId,
    },
  });

  const { isMobile } = useScreenView();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(false);
  const [viewType, setViewType] = useState<ViewToggleType>(
    isMobile ? "card" : "list",
  );

  const abortRef = useRef<AbortController | null>(null);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const sortRef = useRef<{ key: string; value: "asc" | "desc" }>({
    key: "lastOrder.createdAt",
    value: "desc",
  });

  const handleFilterChange = () => {
    applyFilter();
  };

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
      setData((prev) => [...prev, ...result.data]);
      setHasMoreData(
        (result.data || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    formMethods.setValue("search", search);
    formMethods.setValue("mainTab", mainTab);
    formMethods.setValue("salesEmployeeId", salesEmployeeId);

    if (dateFrom && dateTo) {
      formMethods.setValue("dateRange", [new Date(dateFrom), new Date(dateTo)]);
    } else {
      formMethods.setValue("dateRange", []);
    }

    applyFilter();
  }, [mainTab, search, dateFrom, dateTo, salesEmployeeId]);

  const handleSort = ({
    key,
    value,
  }: {
    key: string;
    value?: "asc" | "desc";
  }) => {
    sortRef.current = {
      key,
      value: value || "desc",
    };
    applyFilter();
  };

  const showDesktopView = !isMobile && viewType === "list";

  return (
    <>
      <div className="tw:flex tw:justify-between tw:items-center tw:gap-4 tw:mb-4">
        <div className="tw:flex-1">
          <FormProvider {...formMethods}>
            <Filter callback={handleFilterChange} />
          </FormProvider>
        </div>
      </div>

      <div className="tw:mb-4 tw:flex tw:justify-between tw:items-center tw:gap-2">
        <div className="tw:flex-1">
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            loadedCount={data.length}
            fwSize="sm"
          />
        </div>
        {!showDesktopView && (
          <SortPopover sortValue={sortRef.current} onSort={handleSort} />
        )}
        <ViewToggle viewType={viewType} callback={setViewType} />
      </div>
      {!showDesktopView ? (
        <MobileView
          data={data}
          loading={loading}
          loadMore={loadMore}
          loadingMore={loadingMore}
          totalCount={paginationRef.current.totalRecords}
          loadedCount={data.length}
          showLoadMore={hasMoreData}
        />
      ) : (
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
      )}
    </>
  );
};

export default Products;
