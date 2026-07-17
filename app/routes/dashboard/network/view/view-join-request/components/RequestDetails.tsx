import React, { useMemo } from "react";
import AppCard from "~/components/core/card/AppCard";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import type { VariantColor } from "~/types/CommonTypes";
import KeyValue from "~/components/core/key-value/KeyValue";

interface RequestDetailsProps {
  data: {
    requestedOn?: string | Date;
    lastUpdated?: string | Date;
    status?: string;
    _statusLabel?: string;
    _statusColor?: string;
    requestMessage?: string;
    responseMessage?: string;
    requestId?: string;
  } | null;
}

const RequestDetails: React.FC<RequestDetailsProps> = ({ data }) => {
  if (!data) return null;

  const borderColorClass = useMemo(() => {
    const color = (data._statusColor || "warning").toLowerCase();
    if (color === "success") return "tw:border-green-500";
    if (color === "danger") return "tw:border-red-500";
    if (color === "warning") return "tw:border-yellow-500";
    return "tw:border-gray-300";
  }, [data?._statusColor]);

  const statusVariant = useMemo(() => {
    const raw = (data._statusColor ||
      (data.status === "approved" ? "success" : "warning")) as string;
    const mapped: VariantColor =
      raw === "success" || raw === "warning" || raw === "danger"
        ? (raw as VariantColor)
        : "warning";
    return mapped;
  }, [data?._statusColor, data?.status]);

  return (
    <AppCard title="Request Details">
      <div className="tw:space-y-4">
        <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-3 tw:gap-6">
          <KeyValue
            label="Requested on"
            size="sm"
            valueClassName="tw:text-gray-900 tw:font-medium"
          >
            {data.requestedOn ? (
              <DateFormat
                value={data.requestedOn as any}
                formatStr="dd MMM yyyy, hh:mm a"
              />
            ) : (
              "-"
            )}
          </KeyValue>

          <KeyValue label="Status" size="sm">
            <div className="tw:mt-1">
              <AppBadge variant={statusVariant}>
                {data._statusLabel || data.status || "Pending"}
              </AppBadge>
            </div>
          </KeyValue>

          <KeyValue
            label="Last updated"
            size="sm"
            valueClassName="tw:text-gray-900 tw:font-medium"
          >
            {data.lastUpdated ? <DateFormat value={data.lastUpdated} /> : "-"}
          </KeyValue>
        </div>

        <KeyValue
          label="Buyer remarks"
          size="sm"
          valueClassName="tw:text-gray-800"
        >
          {data.requestMessage?.trim() ? (
            data.requestMessage
          ) : (
            <span className="tw:text-gray-400">No remarks</span>
          )}
        </KeyValue>

        {data.responseMessage?.trim() ? (
          <KeyValue
            label="Response message"
            size="sm"
            valueClassName="tw:text-gray-800"
          >
            {data.responseMessage}
          </KeyValue>
        ) : null}
      </div>
    </AppCard>
  );
};

export default RequestDetails;
