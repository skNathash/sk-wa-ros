import { ChevronRight } from "lucide-react";

type Props = {
  vendor: any;
  callback: (a: { action: string; data: any }) => void;
};

const MobileItem = ({ vendor, callback }: Props) => {
  return (
    <div
      className="tw:bg-white tw:border tw:border-gray-100 tw:p-4 app-bleed-x tw:mb-0"
      onClick={() => callback({ action: "viewVendor", data: vendor })}
    >
      <div className="tw:flex tw:items-center tw:gap-2">
        <div
          className="tw:w-10 tw:h-10 tw:rounded-full tw:bg-gray-100 tw:flex tw:items-center tw:justify-center"
          style={{ backgroundColor: vendor.initialColor.backgroundColor }}
        >
          <span style={{ color: vendor.initialColor.color }}>
            {vendor.initial}
          </span>
        </div>
        <div className="tw:flex tw:flex-col tw:flex-1">
          <div className="tw:text-base tw:font-medium tw:mb-2">
            {vendor.name}
          </div>
          <div className="tw:flex tw:items-center tw:gap-2">
            {/* id */}
            <div className="tw:text-xs tw:text-gray-500">{vendor.vendorId}</div>

            <span className="tw:text-gray-500 tw:text-xs">•</span>

            {/* town */}
            <div className="tw:text-xs tw:text-gray-500">
              {vendor.address.city}
            </div>
          </div>
        </div>
        <div>
          <ChevronRight className="tw:w-4 tw:h-4 tw:text-gray-500" />
        </div>
      </div>
    </div>
  );
};

export default MobileItem;
