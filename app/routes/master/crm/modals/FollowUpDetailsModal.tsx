import { useMemo } from "react";
import {
  Info,
  MessageSquareText,
  PencilLine,
  PhoneCall,
  StickyNote,
  Tags,
  UserRound,
} from "lucide-react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppModal from "~/components/core/modal/AppModal";
import AppPopover from "~/components/core/popover/AppPopover";
import type { VariantColor } from "~/types/CommonTypes";

// A single entry in a follow-up's `remarksLog` history.
export interface FollowUpRemarkLog {
  remarks?: string;
  actualFollowUpDatetime?: string;
  followedUpOn?: string;
  updatedOn?: string;
  updatedBy?: { id?: string; refId?: string; name?: string };
  _id?: string;
}

// The minimal follow-up shape this modal needs to render its details + timeline.
// It intentionally overlaps with the dashboard / retailer row types so a table
// row can be handed straight through.
export interface FollowUpDetail {
  _id?: string;
  referenceId?: string;
  franchiseName?: string;
  franchiseRefId?: string;
  mobileNo?: string;
  type?: string;
  status?: string;
  remarks?: string;
  followUpDateTime?: string;
  actualFollowUpDatetime?: string;
  previousFollowUpDateTime?: string;
  createdAt?: string;
  modifiedAt?: string;
  modifiedBy?: { id?: string; refId?: string; name?: string };
  employee?: { id?: string; refId?: string; name?: string };
  assignedTo?: { employeeId?: string; name?: string };
  remarksLog?: FollowUpRemarkLog[];
  customFields?: Record<string, any> | null;
  _statusLabel?: string;
  _statusColor?: string;
  _typeLabel?: string;
  _typeColor?: string;
  _canClose?: boolean;
  initial?: string;
}

interface FollowUpDetailsModalProps {
  show: boolean;
  followup: FollowUpDetail | null;
  callback: (payload: { action: string; data?: any }) => void;
}

// Small uppercase eyebrow used to label every section of the details slip.
const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="tw:mb-2 tw:flex tw:items-center tw:gap-1 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-gray-400">
    {children}
  </div>
);

// Compact label-over-value cell for the summary grid — keeps each fact on two
// tight lines so the whole slip stays scannable instead of a tall stack.
const Meta = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="tw:min-w-0">
    <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-gray-400">
      {label}
    </div>
    <div className="tw:mt-0.5 tw:text-[13px] tw:font-medium tw:text-gray-900">
      {children}
    </div>
  </div>
);

// Initials for the retailer avatar (first two words, e.g. "Sri Mart" → "SM").
const getInitials = (name?: string) => {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
};

// Read-only view of a follow-up: identity, key dates and the full remarks
// history. Editing (add a remark, reschedule, close) lives in the dedicated
// UpdateFollowUpModal, reached from the row's "Update" action.
const FollowUpDetailsModal = ({
  show,
  followup,
  callback,
}: FollowUpDetailsModalProps) => {
  const close = () => callback({ action: "close" });
  const update = () => callback({ action: "update", data: followup });

  // Timeline is newest-first so the most recent interaction is at the top.
  const timeline = useMemo(() => {
    const log = followup?.remarksLog;
    if (Array.isArray(log) && log.length) {
      return [...log].reverse();
    }
    // Fall back to the top-level remarks when there's no structured history.
    if (followup?.remarks) {
      return [
        {
          remarks: followup.remarks,
          updatedOn: followup.createdAt,
          updatedBy: followup.employee,
        } as FollowUpRemarkLog,
      ];
    }
    return [];
  }, [followup]);

  const employeeName =
    followup?.employee?.name || followup?.assignedTo?.name || "";

  // The date this follow-up was scheduled for before it was rescheduled.
  // Only present once a follow-up has been moved, hence the optional read.
  const previousFollowUpDateTime = followup?.previousFollowUpDateTime;

  // Custom fields are stored as a free-form { name: value } map on the
  // follow-up; render only the entries that carry a non-empty value.
  const customFields = useMemo(() => {
    const fields = followup?.customFields;
    if (!fields || typeof fields !== "object") return [];
    return Object.entries(fields)
      .map(([key, value]) => ({
        key,
        value: value == null ? "" : String(value),
      }))
      .filter((f) => f.key.trim() && f.value.trim());
  }, [followup]);

  return (
    <AppModal show={show} callback={close} className="tw:max-h-[85vh]">
      <AppModal.Title onClose={close}>
        <div className="tw:flex tw:items-center tw:gap-3">
          <div className="tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-emerald-100 tw:text-emerald-700">
            <MessageSquareText className="tw:h-4 tw:w-4" />
          </div>
          <div>
            <div className="tw:text-base tw:font-semibold tw:text-gray-900">
              Follow-up details
            </div>
            <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
              CRM ·{" "}
              {followup?.referenceId
                ? `Ref ${followup.referenceId}`
                : "Call log"}
            </div>
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content>
        {!followup ? (
          <div className="tw:py-10 tw:text-center tw:text-sm tw:text-gray-500">
            No follow-up selected.
          </div>
        ) : (
          <div className="tw:flex tw:flex-col tw:gap-4 tw:pt-1">
            {/* Follow-up case slip — retailer identity + the key facts in a
                tight two-column grid so it stays short. */}
            <div className="tw:rounded-xl tw:border tw:border-gray-200 tw:bg-gray-50/70 tw:p-3">
              <div className="tw:flex tw:items-center tw:gap-3">
                <div className="tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-white tw:text-xs tw:font-bold tw:text-gray-600 tw:ring-1 tw:ring-gray-200">
                  {getInitials(followup.franchiseName || employeeName)}
                </div>
                <div className="tw:min-w-0 tw:flex-1">
                  <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-900">
                    {followup.franchiseName || "Retailer"}
                  </div>
                  <div className="tw:mt-0.5 tw:flex tw:flex-wrap tw:items-center tw:gap-1.5 tw:text-[11px] tw:font-medium tw:text-gray-500">
                    {followup.mobileNo && (
                      <span className="tw:flex tw:items-center tw:gap-1">
                        <PhoneCall className="tw:h-3 tw:w-3 tw:shrink-0 tw:text-gray-400" />
                        {followup.mobileNo}
                      </span>
                    )}
                    {followup.franchiseRefId && (
                      <>
                        <span className="tw:text-gray-300">•</span>
                        <span>ID {followup.franchiseRefId}</span>
                      </>
                    )}
                  </div>
                </div>
                {followup.status && (
                  <AppBadge
                    variant={
                      (followup._statusColor as VariantColor) || "default"
                    }
                  >
                    {followup._statusLabel || followup.status}
                  </AppBadge>
                )}
              </div>

              <div className="tw:mt-3 tw:grid tw:grid-cols-2 tw:gap-x-4 tw:gap-y-3 tw:border-t tw:border-gray-200 tw:pt-3">
                <div className="tw:min-w-0">
                  <div className="tw:flex tw:items-center tw:gap-1 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-gray-400">
                    Follow-up on
                    {previousFollowUpDateTime && (
                      <AppPopover
                        side="top"
                        align="start"
                        triggerContent={
                          <button
                            type="button"
                            aria-label="Show previous follow-up date"
                            className="tw:inline-flex tw:items-center tw:text-gray-400 hover:tw:text-emerald-600"
                          >
                            <Info className="tw:h-3 tw:w-3" />
                          </button>
                        }
                        contentClassName="tw:w-auto"
                      >
                        <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-gray-400">
                          Previous follow-up
                        </div>
                        <div className="tw:mt-0.5 tw:text-[13px] tw:font-medium tw:text-gray-900">
                          <DateFormat
                            value={previousFollowUpDateTime}
                            formatStr="dd MMM yyyy, hh:mm a"
                          />
                        </div>
                      </AppPopover>
                    )}
                  </div>
                  <div className="tw:mt-0.5 tw:text-[13px] tw:font-medium tw:text-gray-900">
                    {followup.followUpDateTime ? (
                      <DateFormat
                        value={followup.followUpDateTime}
                        formatStr="dd MMM yyyy, hh:mm a"
                      />
                    ) : (
                      "-"
                    )}
                  </div>
                </div>
                <Meta label="Created on">
                  {followup.createdAt ? (
                    <DateFormat
                      value={followup.createdAt}
                      formatStr="dd MMM yyyy, hh:mm a"
                    />
                  ) : (
                    "-"
                  )}
                </Meta>
                {employeeName && <Meta label="Employee">{employeeName}</Meta>}
                <Meta label="Last updated">
                  {followup.modifiedAt ? (
                    <DateFormat
                      value={followup.modifiedAt}
                      formatStr="dd MMM yyyy, hh:mm a"
                    />
                  ) : (
                    "-"
                  )}
                  {followup.modifiedBy?.name && (
                    <span className="tw:mt-0.5 tw:block tw:text-[11px] tw:font-normal tw:text-gray-400">
                      by {followup.modifiedBy.name}
                    </span>
                  )}
                </Meta>
              </div>
            </div>

            {/* Custom fields — free-form key/value details captured on the
                follow-up. Only shown when at least one has a value. */}
            {customFields.length > 0 && (
              <div>
                <FieldLabel>
                  <Tags className="tw:h-3 tw:w-3" />
                  Custom fields
                </FieldLabel>
                <div className="tw:grid tw:grid-cols-2 tw:gap-x-4 tw:gap-y-3 tw:rounded-xl tw:border tw:border-gray-200 tw:bg-gray-50/70 tw:p-3">
                  {customFields.map((field) => (
                    <Meta key={field.key} label={field.key}>
                      {field.value}
                    </Meta>
                  ))}
                </div>
              </div>
            )}

            {/* Remarks timeline — the full history, capped so a long log scrolls
                within itself. */}
            <div>
              <FieldLabel>
                <StickyNote className="tw:h-3 tw:w-3" />
                Remarks history
              </FieldLabel>
              {timeline.length === 0 ? (
                <div className="tw:rounded-xl tw:border tw:border-dashed tw:border-gray-200 tw:py-6 tw:text-center tw:text-xs tw:text-gray-400">
                  No remarks logged yet.
                </div>
              ) : (
                <div className="tw:max-h-[320px] tw:overflow-y-auto tw:pl-1.5">
                  <ol className="tw:relative tw:ml-2 tw:border-l tw:border-gray-200">
                    {timeline.map((entry, idx) => (
                      <li
                        key={entry._id || idx}
                        className="tw:mb-2.5 tw:ml-4 last:tw:mb-0"
                      >
                        <span className="tw:absolute tw:-left-[5px] tw:mt-1.5 tw:h-2.5 tw:w-2.5 tw:rounded-full tw:bg-emerald-400 tw:ring-4 tw:ring-white" />
                        <div className="tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white tw:p-2.5">
                          <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
                            <span className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:font-semibold tw:text-gray-700">
                              <UserRound className="tw:h-3 tw:w-3 tw:text-gray-400" />
                              {entry.updatedBy?.name || "—"}
                            </span>
                            {(entry.followedUpOn || entry.updatedOn) && (
                              <span className="tw:text-[11px] tw:text-gray-400">
                                <DateFormat
                                  value={
                                    entry.followedUpOn ||
                                    entry.updatedOn ||
                                    null
                                  }
                                  formatStr="dd MMM yyyy, hh:mm a"
                                />
                              </span>
                            )}
                          </div>
                          <p className="tw:mt-1 tw:whitespace-pre-wrap tw:break-words tw:text-[13px] tw:text-gray-700">
                            {entry.remarks || "-"}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}
      </AppModal.Content>

      {/* Open (still actionable) follow-ups get the Update action, which asks
          the parent to open the UpdateFollowUpModal. Closed ones are done, so
          the modal stays read-only. Mirrors the row's `_canClose` gate. */}
      {followup?._canClose && (
        <AppModal.Footer>
          <AppButton color="success" onClick={update}>
            <PencilLine className="tw:mr-1 tw:h-4 tw:w-4" />
            Update
          </AppButton>
        </AppModal.Footer>
      )}
    </AppModal>
  );
};

export default FollowUpDetailsModal;
