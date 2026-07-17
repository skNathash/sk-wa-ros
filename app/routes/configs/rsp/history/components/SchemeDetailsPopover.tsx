import React from "react";
import { ArrowRight } from "lucide-react";
import AppPopover from "~/components/core/popover/AppPopover";
import DateFormat from "~/components/core/date/DateFormat";

interface SchemeDetailsPopoverProps {
  oldData: any;
  newData: any;
  triggerText?: string;
}

const SchemeDetailsPopover: React.FC<SchemeDetailsPopoverProps> = ({
  oldData,
  newData,
  triggerText = "View Scheme Details",
}) => {
  if (!newData?.isOfferOfTheDay && !newData?.offerDiscount) {
    return null;
  }

  return (
    <AppPopover
      triggerContent={
        <div className="tw:text-blue-600 tw:text-[11px] tw:font-medium tw:cursor-pointer hover:tw:underline tw:mt-1 tw:flex tw:items-center tw:gap-1">
          <span>{triggerText}</span>
        </div>
      }
      noPadding
      contentClassName="tw:shadow-xl tw:border-gray-200"
    >
      <div className="tw:min-w-[280px]">
        <div className="tw:bg-gray-50/80 tw:px-3 tw:py-2 tw:border-b tw:flex tw:justify-between tw:items-center">
          <span className="tw:text-xs tw:font-bold tw:text-gray-800">
            Scheme Details
          </span>
          <span className="tw:text-[10px] tw:px-1.5 tw:py-0.5 tw:bg-green-100 tw:text-green-700 tw:rounded-full tw:font-bold">
            {newData?.offerDiscount || 0}% Off
          </span>
        </div>

        <div className="tw:p-2">
          <table className="tw:w-full tw:text-[11px] tw:border-separate tw:border-spacing-y-1.5">
            <thead>
              <tr className="tw:text-gray-400">
                <th className="tw:font-medium tw:text-left tw:px-2 tw:pb-1">
                  Field
                </th>
                <th className="tw:font-medium tw:text-right tw:px-2 tw:pb-1">
                  Old
                </th>
                <th className="tw:w-6 tw:text-center tw:pb-1"></th>
                <th className="tw:font-medium tw:text-right tw:px-2 tw:pb-1">
                  New
                </th>
              </tr>
            </thead>
            <tbody className="tw:divide-y tw:divide-gray-50">
              {/* Discount Row */}
              <tr className="hover:tw:bg-gray-50/50">
                <td className="tw:px-2 tw:py-1 tw:text-gray-500">Discount</td>
                <td className="tw:px-2 tw:py-1 tw:text-right tw:text-gray-400">
                  {oldData?.offerDiscount || 0}%
                </td>
                <td className="tw:text-center">
                  <ArrowRight size={10} className="tw:text-gray-300" />
                </td>
                <td className="tw:px-2 tw:py-1 tw:text-right tw:text-green-600 tw:font-bold">
                  {newData?.offerDiscount || 0}%
                </td>
              </tr>

              {/* Valid From Row */}
              <tr className="hover:tw:bg-gray-50/50">
                <td className="tw:px-2 tw:py-1 tw:text-gray-500">From</td>
                <td className="tw:px-2 tw:py-1 tw:text-right tw:text-gray-400">
                  <DateFormat
                    value={oldData?.offerValidFrom}
                    formatStr="dd MMM yy"
                  />
                </td>
                <td className="tw:text-center">
                  <ArrowRight size={10} className="tw:text-gray-300" />
                </td>
                <td className="tw:px-2 tw:py-1 tw:text-right tw:text-gray-700 tw:font-medium">
                  <DateFormat
                    value={newData?.offerValidFrom}
                    formatStr="dd MMM yy"
                  />
                </td>
              </tr>

              {/* Valid To Row */}
              <tr className="hover:tw:bg-gray-50/50">
                <td className="tw:px-2 tw:py-1 tw:text-gray-500">To</td>
                <td className="tw:px-2 tw:py-1 tw:text-right tw:text-gray-400">
                  <DateFormat
                    value={oldData?.offerValidTo}
                    formatStr="dd MMM yy"
                  />
                </td>
                <td className="tw:text-center">
                  <ArrowRight size={10} className="tw:text-gray-300" />
                </td>
                <td className="tw:px-2 tw:py-1 tw:text-right tw:text-gray-700 tw:font-medium">
                  <DateFormat
                    value={newData?.offerValidTo}
                    formatStr="dd MMM yy"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action Type Footer (Optional but good for context) */}
        {newData?.discountType && (
          <div className="tw:bg-blue-50/30 tw:px-3 tw:py-1.5 tw:border-t tw:mt-1">
            <span className="tw:text-[10px] tw:text-blue-500 tw:font-medium">
              Type: {newData.discountType}
            </span>
          </div>
        )}
      </div>
    </AppPopover>
  );
};

export default SchemeDetailsPopover;
