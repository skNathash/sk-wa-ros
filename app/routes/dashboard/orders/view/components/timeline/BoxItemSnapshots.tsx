import { Info } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppPopover from "~/components/core/popover/AppPopover";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

const BoxItemSnapshots = ({
  snapshots,
  uom,
}: {
  snapshots: any[];
  uom?: string;
}) => {
  return (
    <AppPopover
      triggerContent={
        <button className="tw:cursor-pointer tw:text-gray-500 tw:flex tw:items-center tw:gap-1 tw:text-xs">
          Snapshots
          <Info size={14} />
        </button>
      }
    >
      <div className="tw:text-xs tw:mb-2">
        <div className="tw:font-semibold tw:text-gray-900">
          Picked Sanpshots
        </div>
      </div>
      {snapshots?.map((snapshot) => (
        <div
          key={snapshot._id}
          className="tw:gap-2 tw:text-xs tw:border tw:border-gray-200 tw:p-2 tw:rounded-md tw:mb-2 tw:grid tw:grid-cols-2"
        >
          <KeyValue label="MRP" size="xs">
            <Amount value={snapshot.mrp} />
          </KeyValue>
          <KeyValue label="Barcode" size="xs">
            {snapshot.barcode}
          </KeyValue>
          <KeyValue label="Stock" size="xs">
            <DisplayQty
              qty={Number(snapshot.quantity) || 0}
              isLooseQty={false}
              uom={uom}
            />
          </KeyValue>
          <KeyValue label="Expiry Date" size="xs">
            {snapshot.expiry ? (
              <DateFormat value={snapshot.expiry} formatStr="dd MMM yyyy" />
            ) : (
              "--"
            )}
          </KeyValue>
        </div>
      ))}
    </AppPopover>
  );
};

export default BoxItemSnapshots;
