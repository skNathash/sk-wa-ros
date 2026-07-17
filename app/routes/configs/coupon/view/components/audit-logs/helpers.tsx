import React from "react";
import DateFormat from "~/components/core/date/DateFormat";
import Amount from "~/components/core/amount/Amount";
import CouponService from "~/services/CouponService";
import type { TableHeaderItem } from "~/types/CommonTypes";

/** Format a coupon's raw logs into the shape consumed by the audit log views. */
export const getCouponLogs = (coupon: any) =>
  CouponService.formatCouponLogs(coupon?.logs);

/**
 * Render a single change value based on its detected type, using DateFormat
 * for dates and Amount for money fields, falling back to the plain string.
 */
export const renderChangeValue = (
  type: string,
  raw: any,
  formatted: string
) => {
  if (raw === null || raw === undefined || raw === "") return "—";
  if (type === "date") return <DateFormat value={raw} />;
  if (type === "amount") return <Amount value={Number(raw)} />;
  return formatted;
};

/** Number of change rows shown before collapsing behind a "show more" toggle. */
export const VISIBLE_CHANGES_LIMIT = 3;

export const ShowMoreToggle: React.FC<{
  expanded: boolean;
  hiddenCount: number;
  onToggle: () => void;
}> = ({ expanded, hiddenCount, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className="tw:text-xs tw:font-medium tw:text-blue-600 hover:tw:underline tw:text-left tw:w-fit"
  >
    {expanded ? "Show less" : `Show ${hiddenCount} more`}
  </button>
);

export const headers: TableHeaderItem[] = [
  { label: "SL", key: "sl", width: "4%", isCentered: true },
  { label: "Status", key: "status", width: "9%" },
  { label: "Logged By", key: "loggedBy", width: "13%" },
  { label: "Logged On", key: "loggedOn", width: "13%" },
  { label: "Remarks", key: "remarks", width: "16%" },
  { label: "Field", key: "field", width: "15%" },
  { label: "Old Data", key: "oldData", width: "15%" },
  { label: "New Data", key: "newData", width: "15%" },
];
