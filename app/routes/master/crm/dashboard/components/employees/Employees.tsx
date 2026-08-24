import { format } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import type { PaginationState } from "~/types/CommonTypes";
import DesktopView from "./DesktopView";
import Filter from "./Filter";
import Summary from "./Summary";
import {
  defaultFilter,
  defaultSummary,
  getData,
  getSummary,
  prepareParams,
  type DashboardSummary,
  type EmployeeSummaryFilterForm,
  type EmployeeSummaryRow,
} from "./helper";

// Simple string filters that round-trip through the URL query params as-is.
const FILTER_KEYS: (keyof EmployeeSummaryFilterForm)[] = ["search", "status"];

// The dashboard tab is preserved across every filter change so deep links stay
// on the Employees tab.
const TAB_PARAM = "tab";
const TAB_KEY = "employees";

const PAGE_SIZE = 20;

const Employees = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const formMethods = useForm<EmployeeSummaryFilterForm>({
    defaultValues: defaultFilter,
  });

  const [data, setData] = useState<EmployeeSummaryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const [summary, setSummary] = useState<DashboardSummary>(defaultSummary);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: PAGE_SIZE,
    startSlNo: 1,
    endSlNo: PAGE_SIZE,
    totalRecords: 0,
  });

  const applyFilter = useCallback(async () => {
    setLoading(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: PAGE_SIZE,
    };
    try {
      const values = formMethods.getValues();
      const params = prepareParams(values, 1, PAGE_SIZE);
      const { data: rows, total } = await getData(params, values);
      setData(rows);
      paginationRef.current.totalRecords = total;
      setHasMoreData(rows.length >= PAGE_SIZE);
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, [formMethods]);

  // The header tiles aggregate across every employee, honouring only the search
  // + follow-up date filters (not pagination).
  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const result = await getSummary(formMethods.getValues());
      setSummary(result);
    } catch (e) {
      setSummary(defaultSummary);
    } finally {
      setSummaryLoading(false);
    }
  }, [formMethods]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      const nextPage = paginationRef.current.activePage + 1;
      paginationRef.current = {
        ...paginationRef.current,
        activePage: nextPage,
      };
      const values = formMethods.getValues();
      const params = prepareParams(values, nextPage, PAGE_SIZE);
      const { data: rows } = await getData(params, values);
      setData((prev) => [...prev, ...rows]);
      setHasMoreData(rows.length >= PAGE_SIZE);
    } catch (e) {
      // keep existing data on a failed page fetch
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, formMethods]);

  // Filter changes flow through the URL: sync form state to query params,
  // and let the searchParams effect below drive the actual reload. The active
  // tab is always preserved.
  const handleFilterChange = useCallback(
    (formData: EmployeeSummaryFilterForm) => {
      const params = new URLSearchParams();
      params.set(TAB_PARAM, TAB_KEY);
      FILTER_KEYS.forEach((key) => {
        const value = (formData[key] as string)?.trim();
        if (value && value !== "All") {
          params.set(key, value);
        }
      });
      if (
        Array.isArray(formData.createdDateRange) &&
        formData.createdDateRange.length === 2
      ) {
        params.set(
          "createdStartDate",
          format(formData.createdDateRange[0], "yyyy-MM-dd"),
        );
        params.set(
          "createdEndDate",
          format(formData.createdDateRange[1], "yyyy-MM-dd"),
        );
      }
      setSearchParams(params);
    },
    [setSearchParams],
  );

  // Selecting a summary tile applies its status filter through the same URL
  // round-trip as the rest of the filters.
  const handleStatusSelect = useCallback(
    (status: string) => {
      formMethods.setValue("status", status);
      handleFilterChange(formMethods.getValues());
    },
    [formMethods, handleFilterChange],
  );

  // Reflects the status filter currently in the URL so the active tile stays
  // highlighted across reloads and deep links.
  const activeStatus = searchParams.get("status") || "";

  // Single source of truth: whenever query params change, reset the form to
  // match and reload the list.
  useEffect(() => {
    const next: EmployeeSummaryFilterForm = { ...defaultFilter };
    FILTER_KEYS.forEach((key) => {
      const value = searchParams.get(key);
      if (value) (next[key] as string) = value;
    });
    const createdStartDate = searchParams.get("createdStartDate");
    const createdEndDate = searchParams.get("createdEndDate");
    if (createdStartDate && createdEndDate) {
      next.createdDateRange = [
        new Date(createdStartDate),
        new Date(createdEndDate),
      ];
    }
    formMethods.reset(next);
    applyFilter();
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <>
      <Summary
        summary={summary}
        loading={summaryLoading}
        className="tw:mb-4"
        activeStatus={activeStatus}
        onSelect={handleStatusSelect}
      />

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
      </div>

      <AppCard noPadding>
        <DesktopView
          data={data}
          loading={loading}
          loadMore={loadMore}
          loadingMore={loadingMore}
          totalCount={paginationRef.current.totalRecords}
          loadedCount={data.length}
          hasMoreData={hasMoreData && !loading}
        />
      </AppCard>
    </>
  );
};

export default Employees;
