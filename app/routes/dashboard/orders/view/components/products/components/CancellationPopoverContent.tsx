import DateFormat from "~/components/core/date/DateFormat";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

const CancellationPopoverContent = ({
  reasons,
  isLooseQty,
  uom,
}: {
  reasons: any[];
  isLooseQty?: boolean;
  uom?: string;
}) => {
  return (
    <div>
      <div className="tw:font-semibold tw:text-gray-900 tw:mb-2 tw:text-sm">
        Cancelled Reasons
      </div>
      {reasons?.map((reason, index) => (
        <div
          key={index}
          className="tw:mb-2 tw:border tw:border-border-500 tw:rounded-md tw:p-2"
        >
          <div className="tw:md:text-xs tw:text-sm tw:flex tw:justify-between tw:mb-2">
            <div className="tw:text-gray-600">User:</div>
            <div className="tw:font-medium">{reason.cancelledBy?.name}</div>
          </div>

          <div className="tw:md:text-xs tw:text-sm tw:flex tw:justify-between tw:mb-2">
            <div className="tw:text-gray-600">Date:</div>
            <div className="tw:font-medium">
              <DateFormat value={reason.cancelledAt} />
            </div>
          </div>

          {/* quantity */}
          <div className="tw:md:text-xs tw:text-sm tw:flex tw:justify-between">
            <div className="tw:text-gray-600">Cancelled Qty:</div>
            <div className="tw:font-medium">
              <DisplayQty
                qty={reason.cancelledQty}
                isLooseQty={isLooseQty}
                uom={uom}
              />
            </div>
          </div>

          <div className="tw:md:text-xs tw:text-sm tw:text-red-600 tw:mt-2">
            &quot;{reason.reason}&quot;
          </div>
        </div>
      ))}
    </div>
  );
};

export default CancellationPopoverContent;
