import React, { useCallback, useEffect, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import NextFollowUpChip from "~/shared/crm/components/NextFollowUpChip";
import { getOpenFollowUp } from "./helper";

interface NextFollowUpProps {
  fid: string;
  // Bumping this forces a re-fetch (after a log / update / close upstream).
  reloadKey?: number;
  // Reports the resolved open follow-up (or null) so the parent can decide
  // between the add-lead flow and the update flow without fetching again.
  onLoaded?: (openFollowUp: any | null) => void;
  // Log an update against the open follow-up (append a remark / reschedule).
  onUpdate?: (followup: any) => void;
  // Open the read-only details / remarks history of the open follow-up.
  onDetails?: (followup: any) => void;
  className?: string;
}

// The retailer's single open follow-up thread, surfaced in the right rail. It
// owns its own API call (getOpenFollowUp) and renders the upcoming follow-up
// date with an urgency chip. Update / Details are only shown while a
// follow-up is open — closed retailers have no next follow-up.
const NextFollowUp: React.FC<NextFollowUpProps> = ({
  fid,
  reloadKey = 0,
  onLoaded,
  onUpdate,
  onDetails,
  className,
}) => {
  const [followUp, setFollowUp] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!fid) {
      setFollowUp(null);
      onLoaded?.(null);
      return;
    }
    setLoading(true);
    try {
      const open = await getOpenFollowUp(fid);
      setFollowUp(open);
      onLoaded?.(open);
    } catch (e) {
      setFollowUp(null);
      onLoaded?.(null);
    } finally {
      setLoading(false);
    }
    // onLoaded is intentionally excluded — it's a stable reporter, and adding it
    // would re-run the fetch on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fid, reloadKey]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div
        className={`tw:h-32 tw:animate-pulse tw:rounded-xl tw:bg-amber-50 ${className || ""}`}
      />
    );
  }

  const assignee =
    followUp?.assignedTo?.name || followUp?.employee?.name || "";

  return (
    <div
      className={`tw:rounded-xl tw:border tw:border-amber-200 tw:bg-amber-50/60 tw:p-4 ${className || ""}`}
    >
      <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
        Next follow-up
      </div>

      {!followUp ? (
        <p className="tw:mt-2 tw:text-xs tw:text-gray-500">
          No open follow-up. Use “Log activity” to schedule one.
        </p>
      ) : (
        <>
          <div className="tw:mt-2 tw:flex tw:flex-wrap tw:items-center tw:gap-2">
            {followUp.followUpDateTime ? (
              <>
                <span className="tw:text-sm tw:font-semibold tw:text-amber-700">
                  <DateFormat
                    value={followUp.followUpDateTime}
                    formatStr="dd MMM yyyy"
                  />
                </span>
                <span className="tw:text-amber-500">·</span>
                <NextFollowUpChip date={followUp.followUpDateTime} />
              </>
            ) : (
              <span className="tw:text-sm tw:text-gray-500">
                No follow-up date set
              </span>
            )}
          </div>

          <p className="tw:mt-1.5 tw:text-xs tw:text-gray-600">
            {followUp.remarks ? `"${followUp.remarks}"` : "No remarks"}
            {assignee && (
              <>
                {" "}
                — assigned to{" "}
                <span className="tw:font-medium tw:text-gray-700">
                  {assignee}
                </span>
              </>
            )}
          </p>

          {/* Update / Details are only offered while the follow-up is open. */}
          <div className="tw:mt-3 tw:flex tw:items-center tw:gap-2">
            <AppButton
              size="small"
              color="primary"
              onClick={() => onUpdate?.(followUp)}
            >
              Update
            </AppButton>
            <AppButton
              size="small"
              fill="outline"
              color="light"
              onClick={() => onDetails?.(followUp)}
            >
              Details
            </AppButton>
          </div>
        </>
      )}
    </div>
  );
};

export default NextFollowUp;
