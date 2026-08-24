import { Plus } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import LeadFollowUpModal from "~/shared/crm/modals/LeadFollowUpModal";
import type { PaginationState, SortValue } from "~/types/CommonTypes";
import Summary from "../../../dashboard/components/followups/Summary";
import FollowUpDetailsModal from "../../../modals/FollowUpDetailsModal";
import UpdateFollowUpModal from "../../../modals/UpdateFollowUpModal";
import DesktopView from "./DesktopView";
import Filter from "./Filter";
import {
  defaultFilter,
  defaultSummary,
  getActiveCount,
  getCount,
  getData,
  getSummary,
  prepareParams,
  type RetailerFilterForm,
  type RetailerSummary,
} from "./helper";

// Simple string filters that round-trip through the URL query params as-is.
const FILTER_KEYS: (keyof RetailerFilterForm)[] = ["search", "type", "status"];

// Format a Date as yyyy-MM-dd for compact URL persistence.
const toDateParam = (d: Date) => d.toISOString().slice(0, 10);

interface FollowUpsProps {
  fid: string;
  // Notify the parent whenever the follow-up set changes so it can refresh the
  // open-count badge on the tab.
  onChange?: () => void;
}

const FollowUps: React.FC<FollowUpsProps> = ({ fid, onChange }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const formMethods = useForm<RetailerFilterForm>({
    defaultValues: defaultFilter,
  });

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const [summary, setSummary] = useState<RetailerSummary>(defaultSummary);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Whether this retailer still has an open follow-up thread. Only one open
  // follow-up is allowed at a time, so a new one can be started only when this
  // is false (all closed, or none logged yet). Computed filter-independently so
  // the current search / status filter can't unlock the button incorrectly.
  const [hasActiveFollowup, setHasActiveFollowup] = useState(false);

  // Only master users may start, update or close a follow-up; everyone else is
  // told why on click.
  const canCreateFollowUp = AuthService.isMasterLogin();
  const canUpdateFollowUp = canCreateFollowUp;
  const appToast = useAppToast();

  // Lead follow-up modal — used only for logging a brand new follow-up.
  const [followUpModal, setFollowUpModal] = useState<{
    show: boolean;
    mode: "create" | "close";
    leadId: string | null;
  }>({ show: false, mode: "create", leadId: null });

  // Details modal — read-only view of a closed follow-up's remarks timeline.
  const [detailsModal, setDetailsModal] = useState<{
    show: boolean;
    followup: any | null;
  }>({ show: false, followup: null });

  // Update modal — add a remark, reschedule or close an open follow-up.
  const [updateModal, setUpdateModal] = useState<{
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
    if (!fid) return;
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
        fid,
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
  }, [fid, formMethods]);

  // Refresh whether an open follow-up thread exists (gates the New button).
  const loadActiveState = useCallback(async () => {
    if (!fid) return;
    try {
      const count = await getActiveCount(fid);
      setHasActiveFollowup(count > 0);
    } catch (e) {
      setHasActiveFollowup(false);
    }
  }, [fid]);

  // Summary tiles honour the location / search filters but aggregate per-status.
  const loadSummary = useCallback(async () => {
    if (!fid) return;
    setSummaryLoading(true);
    try {
      const result = await getSummary(fid, formMethods.getValues());
      setSummary(result);
    } catch (e) {
      setSummary(defaultSummary);
    } finally {
      setSummaryLoading(false);
    }
  }, [fid, formMethods]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData || !fid) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(
        fid,
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
  }, [loadingMore, hasMoreData, fid, formMethods]);

  const handleSort = useCallback(
    ({ key, value }: { key: string; value: SortValue }) => {
      sortRef.current = { key, value };
      applyFilter();
    },
    [applyFilter],
  );

  // Filter changes flow through the URL: sync form state to query params, and
  // let the searchParams effect below drive the actual reload. The retailer id
  // is always preserved.
  const handleFilterChange = useCallback(
    (formData: RetailerFilterForm) => {
      const params = new URLSearchParams();
      if (fid) params.set("id", fid);
      FILTER_KEYS.forEach((key) => {
        const value = (formData[key] as string)?.trim();
        if (value && value !== "All") {
          params.set(key, value);
        }
      });
      if (
        Array.isArray(formData.dateRange) &&
        formData.dateRange.length === 2
      ) {
        params.set("startDate", toDateParam(formData.dateRange[0]));
        params.set("endDate", toDateParam(formData.dateRange[1]));
      }
      if (
        Array.isArray(formData.followUpRange) &&
        formData.followUpRange.length === 2
      ) {
        params.set("followUpStart", toDateParam(formData.followUpRange[0]));
        params.set("followUpEnd", toDateParam(formData.followUpRange[1]));
      }
      setSearchParams(params);
    },
    [fid, setSearchParams],
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

  const openLogFollowUp = useCallback(() => {
    if (!canCreateFollowUp) {
      appToast.show({
        msg: "Only master users can log a follow-up",
        color: "danger",
      });
      return;
    }
    setFollowUpModal({ show: true, mode: "create", leadId: null });
  }, [canCreateFollowUp, appToast]);

  const openDetails = useCallback((row: any) => {
    setDetailsModal({ show: true, followup: row });
  }, []);

  const openUpdate = useCallback(
    (row: any) => {
      if (!canUpdateFollowUp) {
        appToast.show({
          msg: "Only master users can update or close a follow-up",
          color: "danger",
        });
        return;
      }
      setUpdateModal({ show: true, followup: row });
    },
    [canUpdateFollowUp, appToast],
  );

  // On a successful create, refresh the list + summary; always close.
  const handleFollowUpModal = useCallback(
    (payload: { action: string; data?: any }) => {
      setFollowUpModal((prev) => ({ ...prev, show: false }));
      if (payload.action === "created") {
        applyFilter();
        loadSummary();
        loadActiveState();
        onChange?.();
      }
    },
    [applyFilter, loadSummary, loadActiveState, onChange],
  );

  // The details modal is read-only apart from its "Update" action, which hands
  // the follow-up back so we can close details and open the update modal on it.
  const handleDetailsModal = useCallback(
    (payload: { action: string; data?: any }) => {
      setDetailsModal((prev) => ({ ...prev, show: false }));
      if (payload.action === "update") {
        openUpdate(payload.data ?? null);
      }
    },
    [openUpdate],
  );

  // The update modal edits a follow-up in place. Both "updated" and "closed"
  // dismiss the modal and refresh the list, summary and open-thread state.
  const handleUpdateModal = useCallback(
    (payload: { action: string; data?: any }) => {
      setUpdateModal((prev) => ({ ...prev, show: false }));
      if (payload.action === "updated" || payload.action === "closed") {
        applyFilter();
        loadSummary();
        loadActiveState();
        onChange?.();
      }
    },
    [applyFilter, loadSummary, loadActiveState, onChange],
  );

  // Single source of truth: whenever query params change, reset the form to
  // match and reload the list + summary.
  useEffect(() => {
    const next: RetailerFilterForm = { ...defaultFilter };
    FILTER_KEYS.forEach((key) => {
      const value = searchParams.get(key);
      if (value) (next[key] as string) = value;
    });
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    if (startDate && endDate) {
      next.dateRange = [new Date(startDate), new Date(endDate)];
    }
    const followUpStart = searchParams.get("followUpStart");
    const followUpEnd = searchParams.get("followUpEnd");
    if (followUpStart && followUpEnd) {
      next.followUpRange = [new Date(followUpStart), new Date(followUpEnd)];
    }
    formMethods.reset(next);
    applyFilter();
    loadSummary();
    loadActiveState();
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
        {!hasActiveFollowup && (
          <AppButton
            size="small"
            color="success"
            className="tw:ml-auto"
            onClick={openLogFollowUp}
          >
            <Plus size={16} className="tw:mr-1" />
            New follow-up
          </AppButton>
        )}
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
          onUpdate={openUpdate}
        />
      </AppCard>

      <LeadFollowUpModal
        show={followUpModal.show}
        franchiseId={fid}
        mode={followUpModal.mode}
        leadId={followUpModal.leadId}
        callback={handleFollowUpModal}
      />

      <FollowUpDetailsModal
        show={detailsModal.show}
        followup={detailsModal.followup}
        callback={handleDetailsModal}
      />

      <UpdateFollowUpModal
        show={updateModal.show}
        followup={updateModal.followup}
        callback={handleUpdateModal}
      />
    </>
  );
};

export default FollowUps;
