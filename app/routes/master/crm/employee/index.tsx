import { format } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
import AppSimpleHeader from "~/components/core/header/AppSimpleHeader";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import CommonService from "~/services/CommonService";
import type { BreadcrumbItem, PaginationState } from "~/types/CommonTypes";
import TodayOpenChip, {
  TODAY_OPEN_STATUS,
  todayDateParam,
} from "~/shared/crm/components/TodayOpenChip";
import AllRetailersButton from "~/shared/crm/components/AllRetailersButton";
import RetailersDesktopView from "./components/RetailersDesktopView";
import EmployeeBasicInfo from "./components/EmployeeBasicInfo";
import Filter from "./components/Filter";
import AppliedFilters from "./components/AppliedFilters";
import Summary from "./components/Summary";
import {
  defaultFilter,
  defaultSummary,
  getEmployee,
  getRetailers,
  getSummary,
  prepareRetailerParams,
  type EmployeeDetails,
  type EmployeeFilterForm,
  type EmployeeSummary,
  type RetailerSummaryRow,
} from "./helper";

// The retailer-grouped table pages 20 rows at a time via infinite load-more.
const PAGE_SIZE = 20;

// Simple string filters that round-trip through the URL query params as-is.
const FILTER_KEYS: (keyof EmployeeFilterForm)[] = [
  "search",
  "state",
  "district",
  "pincode",
  "status",
];

// The employee id query param drives the whole page and is preserved across
// filter changes.
const EMPLOYEE_PARAM = "id";

// Format a Date as yyyy-MM-dd (local) for compact URL persistence. Uses local
// components — not toISOString() — so a picked date isn't shifted back a day in
// timezones ahead of UTC (e.g. IST).
const toDateParam = (d: Date) => format(d, "yyyy-MM-dd");

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: {
      path: "/auth/master/stores",
    },
    langKey: "dashboard",
  },
  {
    label: "CRM",
    redirect: {
      path: "/master/crm/dashboard",
    },
  },
  { label: "Employee Follow-ups" },
];

const CrmEmployeeView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const employeeId = searchParams.get(EMPLOYEE_PARAM) || "";

  const formMethods = useForm<EmployeeFilterForm>({
    defaultValues: defaultFilter,
  });

  const [employee, setEmployee] = useState<EmployeeDetails | null>(null);
  const [employeeLoading, setEmployeeLoading] = useState(true);

  // The follow-up list/count/summary are scoped by the employee record's own
  // id, which is only known once the employee details have loaded.
  const filterId = employee?.id || "";

  const [data, setData] = useState<RetailerSummaryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const [summary, setSummary] = useState<EmployeeSummary>(defaultSummary);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: PAGE_SIZE,
    startSlNo: 1,
    endSlNo: PAGE_SIZE,
    totalRecords: 0,
  });

  // Fetch page 1 of the retailer-grouped summary for the current form values.
  const applyFilter = useCallback(async () => {
    if (!filterId) return;
    setLoading(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    try {
      const params = prepareRetailerParams(
        filterId,
        formMethods.getValues(),
        1,
        PAGE_SIZE,
      );
      const { data: rows, total } = await getRetailers(params, employee?.name);
      setData(rows);
      paginationRef.current.totalRecords = total;
      setHasMoreData(rows.length >= PAGE_SIZE);
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, [filterId, formMethods, employee?.name]);

  const loadSummary = useCallback(async () => {
    if (!filterId) return;
    setSummaryLoading(true);
    try {
      const result = await getSummary(filterId, formMethods.getValues());
      setSummary(result);
    } catch (e) {
      setSummary(defaultSummary);
    } finally {
      setSummaryLoading(false);
    }
  }, [filterId, formMethods]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData || !filterId) return;
    setLoadingMore(true);
    try {
      const nextPage = paginationRef.current.activePage + 1;
      paginationRef.current = {
        ...paginationRef.current,
        activePage: nextPage,
      };
      const params = prepareRetailerParams(
        filterId,
        formMethods.getValues(),
        nextPage,
        PAGE_SIZE,
      );
      const { data: rows } = await getRetailers(params, employee?.name);
      setData((prev) => [...prev, ...rows]);
      setHasMoreData(rows.length >= PAGE_SIZE);
    } catch (e) {
      // keep existing data on a failed page fetch
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, filterId, formMethods, employee?.name]);

  // Filter changes flow through the URL: sync form state to query params,
  // and let the searchParams effect below drive the actual reload. The employee
  // id is always preserved.
  const handleFilterChange = useCallback(
    (formData: EmployeeFilterForm) => {
      const params = new URLSearchParams();
      if (employeeId) params.set(EMPLOYEE_PARAM, employeeId);
      FILTER_KEYS.forEach((key) => {
        const value = (formData[key] as string)?.trim();
        if (value && value !== "All") {
          params.set(key, value);
        }
      });
      if (
        Array.isArray(formData.followUpDateRange) &&
        formData.followUpDateRange.length === 2
      ) {
        params.set("startDate", toDateParam(formData.followUpDateRange[0]));
        params.set("endDate", toDateParam(formData.followUpDateRange[1]));
      }
      if (
        Array.isArray(formData.createdDateRange) &&
        formData.createdDateRange.length === 2
      ) {
        params.set(
          "createdStartDate",
          toDateParam(formData.createdDateRange[0]),
        );
        params.set("createdEndDate", toDateParam(formData.createdDateRange[1]));
      }
      setSearchParams(params);
    },
    [employeeId, setSearchParams],
  );

  // Summary cards act as a status filter: clicking a card sets the status query
  // param (Total clears it); clicking the active card again toggles it off. The
  // employee id is always preserved.
  const activeStatus = searchParams.get("status") || "";
  const handleSummarySelect = useCallback(
    (status: string) => {
      const params = new URLSearchParams(searchParams);
      if (!status || params.get("status") === status) {
        params.delete("status");
      } else {
        params.set("status", status);
      }
      setSearchParams(params);
    },
    [searchParams, setSearchParams],
  );

  // Remove a single applied filter: drop its query param(s), preserving the
  // employee id. The searchParams effect then reloads the list + summary.
  const handleRemoveFilter = useCallback(
    (keys: string[]) => {
      const params = new URLSearchParams(searchParams);
      keys.forEach((key) => params.delete(key));
      setSearchParams(params);
    },
    [searchParams, setSearchParams],
  );

  // Clear every filter back to defaults, keeping only the employee id.
  const handleClearAllFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (employeeId) params.set(EMPLOYEE_PARAM, employeeId);
    setSearchParams(params);
  }, [employeeId, setSearchParams]);

  // Quick filter: jump to today's open follow-ups. The chip owns the active
  // detection and reports it back; tapping it while active clears all filters
  // back to defaults (the employee id is preserved), otherwise it applies
  // status=Open + follow-up date = today.
  const handleTodayOpenToggle = useCallback(
    (active: boolean) => {
      const params = new URLSearchParams();
      if (employeeId) params.set(EMPLOYEE_PARAM, employeeId);
      if (!active) {
        const today = todayDateParam();
        params.set("status", TODAY_OPEN_STATUS);
        params.set("startDate", today);
        params.set("endDate", today);
      }
      setSearchParams(params);
    },
    [employeeId, setSearchParams],
  );

  // Load the employee details from the id whenever it changes.
  useEffect(() => {
    let active = true;
    const fetchEmployee = async () => {
      setEmployeeLoading(true);
      try {
        const details = employeeId ? await getEmployee(employeeId) : null;
        if (active) setEmployee(details);
      } catch (e) {
        if (active) setEmployee(null);
      } finally {
        if (active) setEmployeeLoading(false);
      }
    };
    fetchEmployee();
    return () => {
      active = false;
    };
  }, [employeeId]);

  // Single source of truth: whenever query params change, reset the form to
  // match and reload the list + summary.
  useEffect(() => {
    const next: EmployeeFilterForm = { ...defaultFilter };
    FILTER_KEYS.forEach((key) => {
      const value = searchParams.get(key);
      if (value) (next[key] as string) = value;
    });
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    if (startDate && endDate) {
      next.followUpDateRange = [new Date(startDate), new Date(endDate)];
    }
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
    // Re-run once the employee resolves: applyFilter/loadSummary early-return
    // while filterId (employee.id) is still empty, so we must retrigger them
    // when it becomes available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, filterId]);

  const showNoEmployee = !employeeLoading && !employee;

  return (
    <>
      <AppSimpleHeader title="Employee Follow-ups" />
      <div className="app-page tw:p-4">
        <div className="app-container">
          <div className="tw:flex tw:items-start tw:justify-between tw:gap-2">
            <AppBreadcrumbs data={breadcrumbs} />
            <div className="tw:flex tw:items-center tw:gap-2">
              <TodayOpenChip
                status={searchParams.get("status") || ""}
                fromDate={searchParams.get("startDate") || ""}
                toDate={searchParams.get("endDate") || ""}
                onToggle={handleTodayOpenToggle}
              />
              <AllRetailersButton />
            </div>
          </div>
          <div className="tw:mt-1 tw:text-xs tw:text-gray-500 tw:mb-3">
            View the retailers this employee is following up with and their
            status breakdown.
          </div>

          {employeeLoading ? (
            <div className="tw:flex tw:items-center tw:justify-center tw:py-16">
              <AppSpinner />
            </div>
          ) : showNoEmployee ? (
            <NoData
              title="No employee found"
              description="We couldn't find any details for this employee."
            />
          ) : (
            <>
              <EmployeeBasicInfo employee={employee!} className="tw:mb-3!" />

              <Summary
                summary={summary}
                loading={summaryLoading}
                className="tw:mb-3"
                activeStatus={activeStatus}
                onSelect={handleSummarySelect}
              />

              <FormProvider {...formMethods}>
                <Filter callback={handleFilterChange} className="tw:mb-3!" />
              </FormProvider>

              <AppliedFilters
                searchParams={searchParams}
                onRemove={handleRemoveFilter}
                onClearAll={handleClearAllFilters}
                className="tw:mb-3"
              />

              <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:mb-3">
                <PaginationSummary
                  paginationConfig={paginationRef.current}
                  loadingTotalRecords={loading}
                  loadedCount={data?.length || 0}
                  fwSize="sm"
                />
              </div>

              <AppCard noPadding>
                <RetailersDesktopView
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
          )}
        </div>
      </div>
    </>
  );
};

export default CrmEmployeeView;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Employee Follow-ups"),
    },
  ];
}
