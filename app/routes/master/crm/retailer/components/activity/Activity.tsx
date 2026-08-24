import { MessageSquarePlus, Plus, X } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppSelect from "~/components/core/form/AppSelect";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import LeadFollowUpModal from "~/shared/crm/modals/LeadFollowUpModal";
import type { PaginationState, SortValue } from "~/types/CommonTypes";
import CreateNoteModal from "../../../modals/CreateNoteModal";
import ActivityItem from "./ActivityItem";
import LeadFollowupService from "~/services/LeadFollowupService";
import {
  ACTIVITY_TYPE_OPTIONS,
  type ActivityType,
  getCount,
  getData,
  OVERDUE_STATUS,
  prepareParams,
} from "./helper";

interface ActivityProps {
  fid: string;
  // Optional follow-up status the timeline should open pre-filtered to, carried
  // from a deep link (e.g. the employee page's Pending / Overdue counts). While
  // set, the feed shows only follow-ups in that status and the type selector is
  // replaced by a dismissible filter chip.
  initialStatus?: string;
  // Optional employee scope (from the same deep link): while set, the feed shows
  // only this employee's follow-ups. `employeeRefId` filters the feed;
  // `employeeName` only labels the filter chip.
  employeeRefId?: string;
  employeeName?: string;
  // The retailer's current open follow-up (owned by the parent's rail). Drives
  // "Log activity": update the open follow-up when there is one, add a lead when
  // there isn't. `undefined` while it's still resolving.
  openFollowUp?: any | null;
  // Bumped by the parent after any mutation (from the timeline or the rail) to
  // force the timeline to re-fetch.
  reloadKey?: number;
  // Open the shared update / details modals (owned by the parent), from a
  // timeline row or the "Log activity" button.
  onOpenUpdate: (followup: any) => void;
  onOpenDetails: (followup: any) => void;
  // Notify the parent whenever this component mutates the activity set (add note
  // / add lead) so it can refresh the timeline, the rail, and any dependent
  // counts.
  onMutated?: () => void;
  className?: string;
}

// Human label for the active status chip. "Overdue" is a sentinel; the rest map
// through the service's status labels (e.g. "InProgress" -> "In Progress").
const statusLabel = (status: string) =>
  status === OVERDUE_STATUS
    ? "Overdue"
    : LeadFollowupService.getStatusLabel(status);

// A labeled, dismissible filter pill (e.g. "Employee: Chandrabhag ✕"). The field
// name is muted and the value emphasized so the chip reads as a self-explanatory
// applied filter rather than a bare tag. Mirrors the employee page's applied
// filters for a consistent CRM look.
const ScopeChip = ({
  label,
  value,
  onRemove,
}: {
  label: string;
  value: string;
  onRemove: () => void;
}) => (
  <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:border tw:border-gray-200 tw:bg-gray-50 tw:py-1 tw:pl-3 tw:pr-1.5 tw:text-xs tw:text-gray-700">
    <span className="tw:text-gray-500">{label}:</span>
    <span className="tw:font-semibold tw:text-gray-800">{value}</span>
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove ${label} filter`}
      className="tw:flex tw:h-4 tw:w-4 tw:items-center tw:justify-center tw:rounded-full tw:text-gray-400 tw:transition-colors tw:hover:bg-gray-200 tw:hover:text-gray-600"
    >
      <X className="tw:h-3 tw:w-3" />
    </button>
  </span>
);

// The retailer's activity timeline: a unified feed of notes + follow-ups
// (fetched with no followType filter by default), with a type selector /
// deep-link scope chip and load-more. The open follow-up + follow-up history
// rail lives in the parent (retailer index); this component reports mutations
// up via `onMutated` and defers the shared update / details modals to it.
// Coding mirrors the Store Notes component — timeline list + load-more, driven
// by the same pagination refs.
const Activity: React.FC<ActivityProps> = ({
  fid,
  initialStatus,
  employeeRefId,
  employeeName,
  openFollowUp,
  reloadKey = 0,
  onOpenUpdate,
  onOpenDetails,
  onMutated,
  className,
}) => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  // A deep link lands on the follow-ups view (the scope it carries is follow-up
  // only); otherwise the unified feed. The user can still switch the view freely.
  const [activityType, setActivityType] = useState<ActivityType>(
    initialStatus || employeeRefId ? "followups" : "all",
  );
  // The active deep-link scope (status and/or employee). While either is set the
  // follow-ups view is narrowed to matching follow-ups; clearing returns to the
  // unified list. Only follow-ups carry a status/employee, so the scope applies
  // to the "followups" view only — it is ignored on the notes / all views.
  const [statusFilter, setStatusFilter] = useState(initialStatus || "");
  const [employeeFilter, setEmployeeFilter] = useState(employeeRefId || "");
  const scoped = !!(statusFilter || employeeFilter);

  const [showAddNote, setShowAddNote] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);

  // Notes and follow-ups can only be logged by master users; everyone else is
  // told why on click. (Updating / closing is gated by the parent's onOpenUpdate.)
  const canLogActivity = AuthService.isMasterLogin();
  const appToast = useAppToast();

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 20,
    startSlNo: 1,
    endSlNo: 20,
    totalRecords: 0,
  });

  const sortRef = useRef<{ key: string; value: SortValue } | undefined>(
    undefined,
  );

  // Fetch page 1 for the selected activity type and refresh the total count.
  const applyFilter = useCallback(async () => {
    if (!fid) return;
    setLoading(true);
    setRows([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    try {
      // The deep-link scope (status/employee) stays applied across every view.
      const params = prepareParams(
        fid,
        paginationRef.current,
        sortRef.current,
        statusFilter,
        employeeFilter,
      );
      const result = await getData(params, activityType);
      setRows(result || []);
      const total = await getCount(params, activityType);
      paginationRef.current.totalRecords = total || 0;
      setHasMoreData((result || []).length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      setRows([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
    // reloadKey forces a re-fetch after a mutation upstream (rail or timeline).
  }, [fid, activityType, statusFilter, employeeFilter, reloadKey]);

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
        paginationRef.current,
        sortRef.current,
        statusFilter,
        employeeFilter,
      );
      const result = await getData(params, activityType);
      setRows((prev) => [...prev, ...(result || [])]);
      setHasMoreData((result || []).length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      // keep existing rows on a failed page fetch
    } finally {
      setLoadingMore(false);
    }
  }, [
    loadingMore,
    hasMoreData,
    fid,
    activityType,
    statusFilter,
    employeeFilter,
  ]);

  // Reload whenever the retailer, the selected type, or the reload key changes.
  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  // "Log activity": add-lead only when there's no open follow-up; when one is
  // open, jump straight to the update modal on it instead.
  const handleLogActivity = useCallback(() => {
    if (openFollowUp) {
      onOpenUpdate(openFollowUp);
      return;
    }
    if (!canLogActivity) {
      appToast.show({
        msg: "Only master users can log a follow-up",
        color: "danger",
      });
      return;
    }
    setShowAddLead(true);
  }, [openFollowUp, onOpenUpdate, canLogActivity, appToast]);

  const handleOpenAddNote = useCallback(() => {
    if (!canLogActivity) {
      appToast.show({
        msg: "Only master users can add a note",
        color: "danger",
      });
      return;
    }
    setShowAddNote(true);
  }, [canLogActivity, appToast]);

  const handleAddNote = useCallback(
    (payload: { action: string }) => {
      setShowAddNote(false);
      if (payload.action === "created") onMutated?.();
    },
    [onMutated],
  );

  const handleAddLead = useCallback(
    (payload: { action: string }) => {
      setShowAddLead(false);
      if (payload.action === "created") onMutated?.();
    },
    [onMutated],
  );

  return (
    <div className={className}>
      {/* Action bar. Add Note is always available; Log activity adapts to the
          open-follow-up state (add-lead vs update). */}
      <div className="tw:mb-4 tw:flex tw:items-center tw:justify-end tw:gap-2">
        <AppButton
          size="small"
          fill="outline"
          color="primary"
          onClick={handleOpenAddNote}
        >
          <MessageSquarePlus size={16} className="tw:mr-1" />
          Add Note
        </AppButton>
        <AppButton size="small" color="primary" onClick={handleLogActivity}>
          <Plus size={16} className="tw:mr-1" />
          Log Followup
        </AppButton>
      </div>

      {/* Timeline */}
      <div className="tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:p-4">
          <div className="tw:mb-4 tw:flex tw:items-start tw:justify-between tw:gap-2">
            <div>
              <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
                Activity timeline
              </div>
              <div className="tw:text-xs tw:text-gray-500">
                {scoped
                  ? "Showing filtered activity only."
                  : "Notes and follow-ups, newest first."}
              </div>
            </div>
            {/* The type selector stays visible even when scoped so the user can
                still switch views; the applied filters below sit alongside it. */}
            <AppSelect
              size="sm"
              value={activityType}
              options={ACTIVITY_TYPE_OPTIONS}
              onChange={(v) => setActivityType(v as ActivityType)}
              inputClassName="tw:min-w-[140px]"
            />
          </div>

          {/* Applied filters: a labeled bar of dismissible chips sitting directly
              above the list (mirrors the employee page's applied filters). One
              chip per active deep-link filter (employee / status); each ✕ clears
              just that filter, and clearing the last returns to the unified
              timeline. */}
          {scoped && (
            <div className="tw:mb-4 tw:flex tw:flex-wrap tw:items-center tw:gap-2 tw:border-b tw:border-gray-100 tw:pb-4">
              <span className="tw:text-xs tw:font-medium tw:text-gray-500">
                Applied filters
              </span>
              {employeeFilter && (
                <ScopeChip
                  label="Employee"
                  value={employeeName || "This employee"}
                  onRemove={() => setEmployeeFilter("")}
                />
              )}
              {statusFilter && (
                <ScopeChip
                  label="Status"
                  value={statusLabel(statusFilter)}
                  onRemove={() => setStatusFilter("")}
                />
              )}
            </div>
          )}

          {loading ? (
            <div className="tw:flex tw:items-center tw:justify-center tw:py-10">
              <AppSpinner />
            </div>
          ) : rows.length === 0 ? (
            <NoData
              title="No activity yet"
              description="Add a note or log a follow-up after contacting this retailer."
            />
          ) : (
            <>
              <ol className="tw:relative">
                {rows.map((row, idx) => (
                  <ActivityItem
                    key={row._id || idx}
                    row={row}
                    isLast={idx === rows.length - 1}
                    onViewHistory={onOpenDetails}
                    onUpdate={onOpenUpdate}
                  />
                ))}
              </ol>

              {hasMoreData && (
                <div className="tw:mt-3 tw:flex tw:justify-center">
                  <AppButton
                    size="small"
                    color="light"
                    onClick={loadMore}
                    isLoading={loadingMore}
                    disabled={loadingMore}
                  >
                    Show older activities
                  </AppButton>
                </div>
              )}
            </>
          )}
      </div>

      <CreateNoteModal
        show={showAddNote}
        franchiseId={fid}
        callback={handleAddNote}
      />

      <LeadFollowUpModal
        show={showAddLead}
        franchiseId={fid}
        mode="create"
        leadId={null}
        callback={handleAddLead}
      />
    </div>
  );
};

export default Activity;
