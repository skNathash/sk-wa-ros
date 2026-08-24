import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
import AppSimpleHeader from "~/components/core/header/AppSimpleHeader";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useScreenView from "~/hooks/useScreenView";
import CommonService from "~/services/CommonService";
import type {
  BreadcrumbItem,
  PaginationState,
  SortValue,
  ViewToggleType,
} from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import {
  defaultFilter,
  getCount,
  getData,
  prepareParams,
  type RetailerFilterForm,
} from "./helper";

const FILTER_KEYS: (keyof RetailerFilterForm)[] = [
  "search",
  "state",
  "district",
  "town",
  "pincode",
];

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: {
      path: "/dashboard",
    },
    langKey: "dashboard",
  },
  { label: "CRM" },
  { label: "Retailers" },
];

const Retailers = () => {
  const { isMobile } = useScreenView();
  const [searchParams, setSearchParams] = useSearchParams();

  const formMethods = useForm<RetailerFilterForm>({
    defaultValues: defaultFilter,
  });

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [view, setView] = useState<ViewToggleType>("list");

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 20,
    startSlNo: 1,
    endSlNo: 20,
    totalRecords: 0,
  });

  const sortRef = useRef<{ key: string; value: SortValue }>({
    key: "name",
    value: "asc",
  });

  // Fetch page 1 for the current form values and refresh the total count.
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
        formMethods.getValues(),
        paginationRef.current,
        sortRef.current,
      );
      const result = await getData(params);
      setData(result || []);
      const total = await getCount(params);
      paginationRef.current.totalRecords = total || 0;
      setHasMoreData((result || []).length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, [formMethods]);

  const loadMore = useCallback(async () => {
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
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData((result || []).length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      // keep existing data on a failed page fetch
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, formMethods]);

  const handleSort = useCallback(
    ({ key, value }: { key: string; value: SortValue }) => {
      sortRef.current = { key, value };
      applyFilter();
    },
    [applyFilter],
  );

  // Filter changes flow through the URL: sync form state to query params,
  // and let the searchParams effect below drive the actual reload.
  const handleFilterChange = useCallback(
    (formData: RetailerFilterForm) => {
      const params = new URLSearchParams();
      FILTER_KEYS.forEach((key) => {
        const value = formData[key]?.trim();
        if (value && value !== "All") {
          params.set(key, value);
        }
      });
      setSearchParams(params);
    },
    [setSearchParams],
  );

  // Single source of truth: whenever query params change, reset the form to
  // match and reload the list.
  useEffect(() => {
    const next = { ...defaultFilter };
    FILTER_KEYS.forEach((key) => {
      const value = searchParams.get(key);
      if (value) next[key] = value;
    });
    formMethods.reset(next);
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <>
      <AppSimpleHeader title="Retailers" />
      <div className="app-page tw:p-4">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} />
          <div className="tw:mt-1 tw:text-xs tw:text-gray-500 tw:mb-4">
            Browse and search retailers across regions by state, district, town,
            and pincode.
          </div>

          <FormProvider {...formMethods}>
            <Filter callback={handleFilterChange} className="tw:mb-4" />
          </FormProvider>

          <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:mb-3">
            <PaginationSummary
              paginationConfig={paginationRef.current}
              loadingTotalRecords={loading}
              loadedCount={data?.length || 0}
              fwSize="sm"
            />
            {!isMobile && <ViewToggle viewType={view} callback={setView} />}
          </div>

          {isMobile || view === "card" ? (
            <MobileView
              data={data}
              loading={loading}
              loadMore={loadMore}
              loadingMore={loadingMore}
              totalCount={paginationRef.current.totalRecords}
              loadedCount={data.length}
              hasMoreData={hasMoreData && !loading}
            />
          ) : (
            <AppCard noPadding>
              <DesktopView
                data={data}
                loading={loading}
                sortKey={sortRef.current.key}
                sortValue={sortRef.current.value}
                onSort={handleSort}
                loadMore={loadMore}
                loadingMore={loadingMore}
                totalCount={paginationRef.current.totalRecords}
                loadedCount={data.length}
                hasMoreData={hasMoreData && !loading}
              />
            </AppCard>
          )}
        </div>
      </div>
    </>
  );
};

export default Retailers;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Retailers"),
    },
  ];
}
