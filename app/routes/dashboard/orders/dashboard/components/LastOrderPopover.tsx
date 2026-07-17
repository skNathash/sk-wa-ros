import React from "react";
import AppPopover from "~/components/core/popover/AppPopover";
import AppBadge from "~/components/core/badge/AppBadge";
import OmsService from "~/services/OmsService";
import DateFormat from "~/components/core/date/DateFormat";
import Amount from "~/components/core/amount/Amount";
import type { VariantColor } from "~/types/CommonTypes";
import AppLink from "~/components/core/link/AppLink";

type Props = {
  triggerContent: React.ReactNode;
  date?: string;
  orderId?: string | number;
  value?: number;
  status?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  orderObjId?: string;
};

const LastOrderPopover = ({
  triggerContent,
  date,
  orderId,
  value,
  status,
  open,
  onOpenChange,
  orderObjId,
}: Props) => {
  const statusColor = status ? OmsService.getStatusColor(status) : "default";
  const statusLabel = status ? OmsService.getStatusLabel(status) : status;

  return (
    <AppPopover
      triggerContent={triggerContent}
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="tw:w-full tw:max-w-xs tw:space-y-2">
        {/* Date and Order ID Row */}
        <div className="tw:flex tw:flex-col tw:gap-2">
          {date ? (
            <div className="tw:flex tw:items-center tw:justify-between">
              <span className="tw:text-xs tw:font-semibold tw:text-gray-500">
                Last Order Date:
              </span>
              <span className="tw:text-xs tw:text-gray-700">
                <DateFormat value={date} />
              </span>
            </div>
          ) : null}

          {orderId ? (
            <div className="tw:flex tw:items-center tw:justify-between">
              <span className="tw:text-xs tw:font-semibold tw:text-gray-500">
                Order:
              </span>
              <AppLink
                asLink
                href={`/dashboard/orders/view/${orderObjId}`}
                showLinkColor
                className="tw:text-xs tw:text-gray-700"
              >
                #{orderId}
              </AppLink>
            </div>
          ) : null}
        </div>

        {/* Amount and Status Row */}
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:pt-1">
          {value ? (
            <div className="tw:flex tw:flex-col">
              <span className="tw:text-xs tw:font-semibold tw:text-gray-500">
                Amount:
              </span>
              <span className="tw:text-sm tw:font-bold tw:text-gray-900">
                <Amount value={value || 0} />
              </span>
            </div>
          ) : null}

          {status ? (
            <AppBadge
              variant={statusColor as VariantColor}
              className="tw:font-semibold tw:px-2 tw:py-1 tw:text-xs tw:whitespace-nowrap"
            >
              {statusLabel}
            </AppBadge>
          ) : null}
        </div>
      </div>
    </AppPopover>
  );
};

export default LastOrderPopover;
