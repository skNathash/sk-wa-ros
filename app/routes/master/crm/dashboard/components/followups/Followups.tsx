import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import type { PaginationState, SortValue } from "~/types/CommonTypes";
import FollowUpDetailsModal from "../../../modals/FollowUpDetailsModal";
import DesktopView from "./DesktopView";
import Filter from "./Filter";
import Summary from "./Summary";
import {
  defaultFilter,
  defaultSummary,
  getCount,
  getData,
  getSummary,
  prepareParams,
  type DashboardFilterForm,
  type DashboardSummary,
} from "./helper";

// Simple string filters that round-trip through the URL query params as-is.
const FILTER_KEYS: (keyof DashboardFilterForm)[] = [
  "search",
  "state",
  "district",
  "pincode",
  "employeeId",
  "employeeName",
  "status",
];

// The dashboard tab is preserved across every filter change so deep links stay
// on the Follow-ups tab.
const TAB_PARAM = "tab";
const TAB_KEY = "followups";

// Format a Date as yyyy-MM-dd for compact URL persistence.
const toDateParam = (d: Date) => d.toISOString().slice(0, 10);

const Followups = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const formMethods = useForm<DashboardFilterForm>({
    defaultValues: defaultFilter,
  });

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const [summary, setSummary] = useState<DashboardSummary>(defaultSummary);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Details modal — shows a follow-up's remarks timeline and hosts the
  // "mark as closed" action.
  const [detailsModal, setDetailsModal] = useState<{
    show: boolean;
    followup: any | null;
  }>({ show: false, followup: null });

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 20,
    startSlNo: 1,
    endSlNo: 20,
    totalRecords: 0,
  });

  const sortRef = useRef<{ key: string; value: SortValue }>({
    key: "createdAt",
    value: "desc",
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
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, [formMethods]);

  // The summary tiles ignore the status filter (they aggregate per-status), but
  // still honour the location / search filters.
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
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
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

  const openDetails = useCallback((row: any) => {
    setDetailsModal({ show: true, followup: row });
  }, []);

  // The details modal closes a follow-up in place; refresh on "closed".
  const handleDetailsModal = useCallback(
    (payload: { action: string; data?: any }) => {
      setDetailsModal((prev) => ({ ...prev, show: false }));
      if (payload.action === "closed") {
        applyFilter();
        loadSummary();
      }
    },
    [applyFilter, loadSummary],
  );

  // Filter changes flow through the URL: sync form state to query params,
  // and let the searchParams effect below drive the actual reload. The active
  // tab is always preserved.
  const handleFilterChange = useCallback(
    (formData: DashboardFilterForm) => {
      const params = new URLSearchParams();
      params.set(TAB_PARAM, TAB_KEY);
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
    [setSearchParams],
  );

  // Summary cards act as a status filter: clicking a card sets the status query
  // param (Total clears it); clicking the active card again toggles it off.
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

  // Single source of truth: whenever query params change, reset the form to
  // match and reload the list + summary.
  useEffect(() => {
    const next: DashboardFilterForm = { ...defaultFilter };
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <>
      <Summary
        summary={summary}
        loading={summaryLoading}
        className="tw:mb-4"
        activeStatus={activeStatus}
        onSelect={handleSummarySelect}
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
          sortKey={sortRef.current.key}
          sortValue={sortRef.current.value}
          onSort={handleSort}
          loadMore={loadMore}
          loadingMore={loadingMore}
          totalCount={paginationRef.current.totalRecords}
          loadedCount={data.length}
          hasMoreData={hasMoreData && !loading}
          onView={openDetails}
        />
      </AppCard>

      <FollowUpDetailsModal
        show={detailsModal.show}
        followup={detailsModal.followup}
        callback={handleDetailsModal}
      />
    </>
  );
};

export default Followups;
