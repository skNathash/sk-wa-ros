import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { useForm, FormProvider } from "react-hook-form";
import { useParams, useSearchParams } from "react-router";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import type { ViewToggleType } from "~/types/CommonTypes";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import type { PaginationState, SortValue } from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import RoutesSlider from "~/shared/logistics/components/RoutesSlider";
import { defaultFilter, getCount, getData, prepareParams } from "./helper";

const OrdersPage = () => {
  const { isMobile } = useScreenView();
  const appNav = useAppNav();
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [view, setView] = useState<ViewToggleType>("list");

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const filterRef = useRef<any>({
    ...defaultFilter,
  });

  const methods = useForm({ defaultValues: { ...defaultFilter } });

  const sortRef = useRef<{ key: string; value: SortValue }>({
    key: "orderedDate",
    value: "desc",
  });

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
        sortRef.current,
      );
      const result = await getData(params);
      setData(result || []);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Prepare form data and filterRef from route params and query params (single effect)
  useEffect(() => {
    const routeId = searchParams.get("routeId") || defaultFilter.routeId;
    const search = searchParams.get("search") || defaultFilter.search;
    const status = searchParams.get("status") || defaultFilter.status;
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const parsedDateRange =
      dateFrom && dateTo
        ? [new Date(dateFrom), new Date(dateTo)]
        : defaultFilter.dateRange;

    const formObj: Record<string, any> = {
      ...defaultFilter,
      customerId: id,
      routeId: routeId,
      search,
      status,
      dateRange: parsedDateRange,
    };

    // update react-hook-form values so Filter and OrderFilterModal receive correct data
    methods.reset(formObj);

    // update internal filterRef used for API params (routeId handled as undefined when 'all')
    filterRef.current = {
      ...filterRef.current,
      ...formObj,
      routeId: routeId === "all" ? undefined : routeId,
    };

    // reset pagination when customer id changes
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, searchParams]);

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
        sortRef.current,
      );
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
  }, [loadingMore, hasMoreData]);

  const handleFilter = useCallback(
    ({ formData, modalData }: { formData: any; modalData?: any }) => {
      const currentParams = Object.fromEntries(searchParams.entries());

      // map form values to query params
      if (formData.search) currentParams.search = formData.search;
      else delete currentParams.search;

      if (formData.status) currentParams.status = formData.status;
      else delete currentParams.status;

      // routeId may come from modal or form
      const routeId = modalData?.routeId ?? formData.routeId;
      if (routeId) currentParams.routeId = routeId;

      // dateRange may come from modal (OrderFilterModal) or form
      const dateRange = modalData?.dateRange ?? formData.dateRange;
      if (dateRange && Array.isArray(dateRange) && dateRange.length === 2) {
        try {
          currentParams.dateFrom = format(dateRange[0], "yyyy-MM-dd");
          currentParams.dateTo = format(dateRange[1], "yyyy-MM-dd");
        } catch (e) {
          delete currentParams.dateFrom;
          delete currentParams.dateTo;
        }
      } else {
        delete currentParams.dateFrom;
        delete currentParams.dateTo;
      }

      setSearchParams(currentParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  // Callback for item actions (view, download, etc)
  const handleItemCallback = ({
    action,
    data,
  }: {
    action: string;
    data: any;
  }) => {
    if (action === "view-order") {
      appNav.to(`/dashboard/orders/view/${data.orderId}`);
    }
    // Add more actions if needed
  };

  const handleSort = useCallback(
    ({ key, value }: { key: string; value: SortValue }) => {
      sortRef.current = { key, value };
      applyFilter();
    },
    [applyFilter],
  );

  return (
    <>
      <div className="tw:mb-2">
        <RoutesSlider
          selectedId={filterRef.current.routeId || defaultFilter.routeId}
          callback={({ action, data }) => {
            if (action === "select") {
              const currentParams = Object.fromEntries(searchParams.entries());
              currentParams.routeId = data._id || data.id || data.routeId;
              setSearchParams(currentParams);
            }
          }}
        />
      </div>

      <FormProvider {...methods}>
        <Filter callback={handleFilter} />
      </FormProvider>

      <div className="tw:flex tw:items-center tw:mt-2 tw:mb-4">
        <div className="tw:flex-1">
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            loadedCount={data.length}
            fwSize="sm"
          />
        </div>
        <div className="tw:flex tw:items-center tw:space-x-2">
          <ViewToggle viewType={view} callback={setView} />
        </div>
      </div>

      {isMobile || view === "card" ? (
        <MobileView
          data={data}
          loading={loading}
          callback={handleItemCallback}
          showLoadMore={hasMoreData}
          loadingMore={loadingMore}
          loadMore={loadMore}
          totalCount={paginationRef.current.totalRecords}
          loadedCount={data.length}
        />
      ) : (
        <AppCard noPadding>
          <DesktopView
            data={data}
            loading={loading}
            callback={handleItemCallback}
            sortKey={sortRef.current.key}
            sortValue={sortRef.current.value}
            onSort={handleSort}
            showLoadMore={hasMoreData}
            loadingMore={loadingMore}
            loadMore={loadMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={data.length}
          />
        </AppCard>
      )}
    </>
  );
};

export default OrdersPage;
