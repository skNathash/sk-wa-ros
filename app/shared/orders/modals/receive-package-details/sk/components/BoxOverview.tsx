import React from "react";
import { Package } from "lucide-react";

interface BoxOverviewProps {
  box: any;
  items: any[];
}

const BoxOverview: React.FC<BoxOverviewProps> = ({ box, items }) => {
  if (!box) {
    return (
      <div className="tw:text-center tw:py-8 tw:text-gray-500">
        <Package className="tw:w-12 tw:h-12 tw:mx-auto tw:mb-4 tw:text-gray-300" />
        <p>No box data available</p>
      </div>
    );
  }

  return (
    <>
      <div className="tw:text-sm tw:text-gray-500 tw:mb-2">
        Items in selected boxes will be automatically allocated to locations.
      </div>
      <div className="tw:bg-white tw:border tw:border-gray-200 tw:rounded-lg tw:shadow-sm tw:p-4">
        {/* Box Header */}
        <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
          <div className="tw:flex tw:items-center tw:gap-3">
            <Package className="tw:w-5 tw:h-5 tw:text-gray-600" />
            <div>
              <div className="tw:font-bold tw:text-gray-900">
                {box.packageId}
              </div>
            </div>
          </div>
          <div className="tw:text-gray-900 tw:px-3 tw:py-1 tw:rounded-full tw:text-sm tw:font-medium tw:border tw:border-gray-200">
            {box._totalUnits || 0} units
          </div>
        </div>

        {/* Items List */}
        <div>
          {items?.map((item: any, index: number) => (
            <div
              key={item._id || index}
              className={`tw:flex tw:items-center tw:justify-between`}
            >
              <div className="tw:flex-1 tw:min-w-0">
                <div className="tw:font-medium tw:text-gray-900 tw:truncate tw:text-sm">
                  {item.dealName}
                </div>
                {item.dealId && (
                  <div className="tw:text-xs tw:text-gray-500">
                    ID: {item.dealId}
                  </div>
                )}
              </div>
              <div className="tw:bg-gray-100 tw:text-gray-900 tw:px-3 tw:py-1 tw:rounded-full tw:text-sm tw:md:text-xs tw:font-medium tw:ml-4">
                {item.packageQuantity || 0} units
              </div>
            </div>
          ))}
        </div>

        {/* No items message */}
        {!items.length ? (
          <div className="tw:p-4 tw:text-center tw:text-gray-500">
            No items in this box
          </div>
        ) : null}
      </div>
    </>
  );
};

export default BoxOverview;
