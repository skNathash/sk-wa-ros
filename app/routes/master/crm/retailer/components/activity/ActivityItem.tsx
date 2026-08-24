import { Check, PhoneCall, StickyNote, TriangleAlert } from "lucide-react";
import React from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import type { VariantColor } from "~/types/CommonTypes";

interface ActivityItemProps {
  row: any;
  isLast: boolean;
  // Open the follow-up's read-only remarks history / details.
  onViewHistory: (row: any) => void;
  // Log an update against an open follow-up row.
  onUpdate: (row: any) => void;
}

// Marker styling per row. The colour follows the row's meaning: overdue open
// follow-ups are red, other open follow-ups amber, closed follow-ups a green
// check, notes / other activity a neutral sky dot. `line` tints the connector
// stub under the marker so the rail reads as one coloured thread per entry.
const markerFor = (row: any) => {
  if (row._isFollowUp) {
    if (row.status === "Completed") {
      return {
        ring: "tw:bg-green-50 tw:text-green-600 tw:ring-green-200",
        icon: <Check size={15} strokeWidth={2.5} />,
      };
    }
    if (row._isFolloupDue) {
      return {
        ring: "tw:bg-red-50 tw:text-red-600 tw:ring-red-200",
        icon: <TriangleAlert size={14} />,
      };
    }
    return {
      ring: "tw:bg-amber-50 tw:text-amber-600 tw:ring-amber-200",
      icon: <PhoneCall size={14} />,
    };
  }
  return {
    ring: "tw:bg-sky-50 tw:text-sky-600 tw:ring-sky-200",
    icon: <StickyNote size={14} />,
  };
};

// Compact "modified · author" metadata line, shared by both row layouts.
const Meta: React.FC<{ loggedOn?: string; author: string }> = ({
  loggedOn,
  author,
}) => (
  <span className="tw:flex tw:shrink-0 tw:items-center tw:gap-1.5 tw:text-[11px] tw:text-gray-400">
    {loggedOn && <DateFormat value={loggedOn} formatStr="dd MMM, hh:mm a" />}
    {author !== "—" && (
      <>
        <span className="tw:text-gray-300">·</span>
        <span className="tw:font-medium tw:text-gray-500">{author}</span>
      </>
    )}
  </span>
);

// One entry in the retailer's unified activity timeline. Open follow-ups render
// a boxed card with Update / Details actions; closed follow-ups render as
// "Follow-up closed"; every other row (notes / logged activity) renders as a
// plain entry tagged with its type.
const ActivityItem: React.FC<ActivityItemProps> = ({
  row,
  isLast,
  onViewHistory,
  onUpdate,
}) => {
  const isFollowUp = row._isFollowUp;
  const isOpenFollowUp = isFollowUp && row._canClose;
  const isOverdue = isOpenFollowUp && row._isFolloupDue;
  const author =
    row.modifiedBy?.name || row.employee?.name || row.assignedTo?.name || "—";
  const loggedOn = row.modifiedAt || row.createdAt || row.loggedOn;
  const marker = markerFor(row);

  return (
    <li className="tw:flex tw:gap-3.5">
      {/* Marker + connector. */}
      <div className="tw:flex tw:flex-col tw:items-center">
        <span
          className={`tw:z-10 tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:shadow-sm tw:ring-1 ${marker.ring}`}
        >
          {marker.icon}
        </span>
        {!isLast && (
          <span className="tw:mt-1 tw:w-0.5 tw:flex-1 tw:rounded-full tw:bg-gray-200" />
        )}
      </div>

      {/* Content */}
      <div className={`tw:min-w-0 tw:flex-1 ${isLast ? "tw:pb-1" : "tw:pb-6"}`}>
        {isOpenFollowUp ? (
          // Distinct boxed card for the open follow-up — the row that still
          // needs action. Overdue shifts the whole card to a red register.
          <div
            className={`tw:rounded-xl tw:border tw:px-3.5 tw:py-4 tw:shadow-sm tw:transition-shadow tw:hover:shadow ${
              isOverdue
                ? "tw:border-red-200 tw:bg-red-50/50"
                : "tw:border-amber-200 tw:bg-amber-50/50"
            }`}
          >
            <div className="tw:flex tw:flex-wrap tw:items-start tw:justify-between tw:gap-x-2 tw:gap-y-1">
              <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                <span className="tw:text-sm tw:font-semibold tw:text-gray-900">
                  Follow-up
                  {row.followUpDateTime && (
                    <>
                      {" "}
                      due{" "}
                      <span
                        className={
                          isOverdue ? "tw:text-red-700" : "tw:text-amber-700"
                        }
                      >
                        <DateFormat
                          value={row.followUpDateTime}
                          formatStr="dd MMM"
                        />
                      </span>
                    </>
                  )}
                </span>
                {isOverdue ? (
                  <AppBadge variant="danger">Overdue</AppBadge>
                ) : row.status ? (
                  <AppBadge
                    variant={(row._statusColor as VariantColor) || "default"}
                  >
                    {row._statusLabel || row.status}
                  </AppBadge>
                ) : null}
              </div>
              {loggedOn && <Meta loggedOn={loggedOn} author={author} />}
            </div>

            <p className="tw:mt-1.5 tw:whitespace-pre-wrap tw:text-xs tw:leading-relaxed tw:text-gray-700">
              {row.remarks || "—"}
            </p>

            <div className="tw:mt-3 tw:flex tw:items-center tw:gap-2">
              <AppButton
                size="small"
                color="primary"
                onClick={() => onUpdate(row)}
              >
                Update
              </AppButton>
              <AppButton
                size="small"
                fill="outline"
                color="light"
                onClick={() => onViewHistory(row)}
              >
                Details
              </AppButton>
            </div>
          </div>
        ) : (
          // Plain entry — closed follow-ups and notes / logged activity. A
          // subtle hover surface ties the marker to its content on interaction.
          <div className="tw:group tw:-mx-2 tw:rounded-lg tw:px-2 tw:py-3 tw:transition-colors tw:hover:bg-gray-50">
            <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-x-2 tw:gap-y-1">
              <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                <span className="tw:text-sm tw:font-semibold tw:text-gray-900">
                  {isFollowUp ? "Follow-up closed" : "Notes added"}
                </span>
              </div>
              <Meta loggedOn={loggedOn} author={author} />
            </div>

            <p className="tw:mt-1 tw:whitespace-pre-wrap tw:text-xs tw:leading-relaxed tw:text-gray-700">
              {row.remarks || "—"}
            </p>

            {isFollowUp && (
              <button
                type="button"
                onClick={() => onViewHistory(row)}
                className="tw:mt-1.5 tw:rounded tw:text-[11px] tw:font-semibold tw:text-indigo-600 tw:transition-colors tw:hover:text-indigo-700 tw:hover:underline tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-indigo-500/40"
              >
                View details
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
};

export default ActivityItem;
