import { Info } from "lucide-react";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppPopover from "~/components/core/popover/AppPopover";
import { Button } from "~/components/ui/button";
import AppBadge from "~/components/core/badge/AppBadge";
import type { VariantColor } from "~/types/CommonTypes";

const SchemePopover = ({
  discount,
  offerStartDate,
  offerEndDate,
  status,
  statusColor,
}: {
  discount: number;
  offerStartDate: string;
  offerEndDate: string;
  status: string;
  statusColor: VariantColor;
}) => {
  return (
    <AppPopover triggerContent={<Info size={12} />}>
      <div className="tw:text-xs tw:font-semibold tw:text-gray-900 tw:mb-2">
        B2B Scheme Details
      </div>
      <KeyValue
        label="Status"
        horizontal
        size="xs"
        labelClassName="tw:w-1/2"
        className="tw:mb-1"
      >
        : <AppBadge variant={statusColor}>{status}</AppBadge>
      </KeyValue>

      <KeyValue
        label="Discount"
        horizontal
        size="xs"
        labelClassName="tw:w-1/2"
        className="tw:mb-1"
      >
        : {discount}%
      </KeyValue>

      <KeyValue
        label="Start Date"
        horizontal
        size="xs"
        labelClassName="tw:w-1/2"
        className="tw:mb-1"
      >
        : <DateFormat value={offerStartDate} formatStr="dd MMM yyyy" />
      </KeyValue>

      <KeyValue
        label="End Date"
        horizontal
        size="xs"
        labelClassName="tw:w-1/2"
        className="tw:mb-1"
      >
        : <DateFormat value={offerEndDate} formatStr="dd MMM yyyy" />
      </KeyValue>
    </AppPopover>
  );
};

export default SchemePopover;
