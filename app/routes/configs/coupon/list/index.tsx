import React, { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import { Plus } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import useAppNav from "~/hooks/useAppNav";
import type {
  PaginationState,
  SortProps,
  BreadcrumbItem,
} from "~/types/CommonTypes";
import AppliedFilters from "./components/AppliedFilters";
import DesktopView from "./components/DesktopView";
import Filter, { type CouponFilterFields } from "./components/Filter";
import Summary from "./components/Summary";
import {
  type CouponSummary,
  filterToSearchParams,
  getCount,
  getData,
  getSummary,
  prepareParams,
  searchParamsToFilter,
} from "./helper";

const defaultFilterValues: CouponFilterFields = {
  search: "",
  applicableFor: "",
  discountKind: "",
  status: "",
  isActive: "",
  validityRange: [],
};

const defaultPaginationRef: PaginationState = {
  activePage: 1,
  rowsPerPage: 20,
  startSlNo: 1,
  endSlNo: 20,
  totalRecords: 0,
};

const CouponList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const appNav = useAppNav();

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Dashboard", redirect: { path: "/dashboard" } },
    { label: "Coupon Configuration List" },
  ];

  const methods = useForm<CouponFilterFields>({
    defaultValues: defaultFilterValues,
  });

  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState<CouponSummary>({
    totalCoupons: 0,
    upcomingCoupons: 0,
    runningCoupons: 0,
    completedCoupons: 0,
  });
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const paginationRef = useRef<PaginationState>({ ...defaultPaginationRef });
  const sortRef = useRef<SortProps>({ key: "createdAt", value: "desc" });

  const updateItems = useCallback((newItems: any[], isAppending = false) => {
    if (isAppending) {
      setItems((prev) => [...prev, ...newItems]);
    } else {
      setItems(newItems);
    }
  }, []);

  // Apply filter and fetch data using the current form values
  const applyFilter = async () => {
    setIsLoading(true);
    setItems([]);
    paginationRef.current = { ...paginationRef.current, activePage: 1 };

    const formValues = methods.getValues();
    const params = prepareParams(
      formValues,
      paginationRef.current,
      sortRef.current,
    );

    setIsSummaryLoading(true);
    getSummary(formValues)
      .then(setSummary)
      .finally(() => setIsSummaryLoading(false));

    const count = await getCount(params);
    paginationRef.current = { ...paginationRef.current, totalRecords: count };
    setTotalCount(count);

    const result = await getData(params);
    updateItems(result.data, false);

    setHasMore(result.data.length < count);
    setIsLoading(false);
  };

  const loadMore = async () => {
    setIsLoadingMore(true);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };

    const formValues = methods.getValues();
    const params = prepareParams(
      formValues,
      paginationRef.current,
      sortRef.current,
    );

    const result = await getData(params);
    updateItems(result.data, true);

    setHasMore(result.data.length >= paginationRef.current.rowsPerPage);
    setIsLoadingMore(false);
  };

  // When the Filter triggers its callback, push the filter values into the
  // URL query params. The query-param effect below reacts and applies them.
  const handleFilterChange = useCallback(
    (data: { action: string; formData: CouponFilterFields }) => {
      setSearchParams(filterToSearchParams(data.formData));
    },
    [setSearchParams],
  );

  // Clicking a summary stat applies it as a status filter (same `status` key
  // as the Filter modal), preserving any other active filters in the URL.
  const handleStatusSelect = useCallback(
    (status: string) => {
      const next = filterToSearchParams({
        ...searchParamsToFilter(searchParams),
        status,
      });
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  // Listen to query param changes -> sync form + apply filter
  useEffect(() => {
    methods.reset(searchParamsToFilter(searchParams));
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSort = (params: SortProps) => {
    sortRef.current = { ...sortRef.current, ...params };
    applyFilter();
  };

  const handleItemCallback = (params: { action: string; data?: any }) => {
    const id = params.data?._id || params.data?.id;
    if (params.action === "view" && id) {
      appNav.to(`/configs/coupon/view/${id}`);
    } else if (params.action === "edit" && id) {
      appNav.to(`/configs/coupon/manage`, { id });
    }
  };

  return (
    <div>
      <AppHeader title="Coupon Configuration" />
      <div className="tw:p-4">
        <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-center tw:gap-3 tw:mb-4">
          <AppBreadcrumbs data={breadcrumbs} />
          <AppButton
            onClick={() => appNav.to("/configs/coupon/manage")}
            size="small"
            className="tw:flex tw:items-center tw:gap-2"
          >
            <Plus className="tw:w-4 tw:h-4" />
            Create Coupon
          </AppButton>
        </div>

        <Summary
          summary={summary}
          loading={isSummaryLoading}
          onStatusSelect={handleStatusSelect}
        />

        <FormProvider {...methods}>
          <div className="tw:mb-3">
            <Filter callback={handleFilterChange} isLoading={isLoading} />
          </div>
          <AppliedFilters />
        </FormProvider>

        <div className="tw:flex tw:justify-between tw:items-end tw:mb-2">
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={isLoading}
            fwSize="sm"
            loadedCount={items.length}
          />
        </div>

        <DesktopView
          data={items}
          callback={handleItemCallback}
          onSort={handleSort}
          sortKey={sortRef.current?.key}
          sortValue={sortRef.current?.value || "asc"}
          loading={isLoading}
          startSlNo={paginationRef.current.startSlNo}
          showLoadMore={hasMore}
          loadingMore={isLoadingMore}
          loadMore={loadMore}
          totalCount={totalCount}
          loadedCount={items.length}
        />

        {!isLoading && hasMore && items.length > 0 && (
          <div className="tw:mt-3 tw:flex tw:justify-center tw:md:hidden">
            <LoadMoreButton
              loadMore={loadMore}
              loading={isLoadingMore}
              totalCount={totalCount}
              loadedCount={items.length}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CouponList;

export function meta() {
  return [{ title: "Coupon Configuration" }];
}
