import { Boxes, Calendar, IndianRupee, MapPin, Tag, Truck } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";

interface MobileViewItemProps {
  data: {
    name: string;
    _id: string;
    _qty: number;
    openPOQty: number;
    _finalSellingPrice: number;
    categoryName: string;
    brandName: string;
    shelfLife: string;
    location: string;
    _location?: {
      locationName?: string;
      locationRackName?: string;
      locationBinName?: string;
    } | null;
    stockMovement: string;
    stockMovementColor: string;
  };
  callback: (a: { action: string; data: any }) => void;
}

const MobileViewItem: React.FC<MobileViewItemProps> = ({ data, callback }) => {
  return (
    <div
      className="tw:bg-white tw:py-4 tw:cursor-pointer"
      onClick={() => callback({ action: "view", data })}
    >
      {/* Top Flex Block */}
      <div className="tw:flex tw:items-center tw:mb-4">
        <div className="tw:w-16 tw:h-16 tw:bg-gray-100 tw:rounded tw:flex tw:items-center tw:justify-center tw:mr-4 tw:self-start">
          <Boxes className="tw:w-8 tw:h-8 tw:text-gray-400" />
        </div>
        <div className="tw:flex tw:flex-col tw:gap-2">
          <span className="tw:font-semibold tw:text-lg tw:text-gray-900 tw:line-clamp-2">
            {data.name}
          </span>
          <div className="tw:flex tw:items-center tw:space-x-2">
            <span className="tw:text-gray-500 tw:text-sm">
              {data.brandName}
            </span>
            <AppBadge variant={data.stockMovementColor as any}>
              {data.stockMovement}
            </AppBadge>
          </div>
          <AppBadge variant="secondary" className="tw:text-xs">
            <code>{data._id}</code>
          </AppBadge>
        </div>
      </div>

      {/* Grid Block */}
      <div className="tw:grid tw:grid-cols-2 tw:gap-4">
        {/* Category */}
        <div className="tw:flex tw:items-center tw:space-x-2">
          <Tag className="tw:text-blue-600 tw:w-4 tw:h-4" />
          <span className="tw:bg-blue-100 tw:text-blue-700 tw:px-2 tw:py-0.5 tw:rounded tw:text-xs tw:font-medium">
            {data.categoryName}
          </span>
        </div>
        {/* Stock */}
        <div className="tw:flex tw:items-center tw:space-x-2">
          <Boxes className="tw:text-gray-600 tw:w-4 tw:h-4" />
          <span className="tw:font-semibold tw:text-gray-900">
            {data._qty} in stock
          </span>
        </div>
        {/* On Order */}
        <div className="tw:flex tw:items-center tw:space-x-2">
          <Truck className="tw:text-gray-400 tw:w-4 tw:h-4" />
          <span className="tw:text-gray-500">
            {data.openPOQty || 0} on order
          </span>
        </div>
        {/* Selling Price */}
        <div className="tw:flex tw:items-center tw:space-x-2">
          <IndianRupee className="tw:text-green-600 tw:w-4 tw:h-4" />
          <span className="tw:text-gray-900">
            <Amount value={data._finalSellingPrice} />
          </span>
        </div>
        {/* Location */}
        <div className="tw:flex tw:items-center tw:space-x-2">
          <MapPin className="tw:text-gray-500 tw:w-4 tw:h-4" />
          {data._location?.locationName &&
          data._location?.locationRackName &&
          data._location?.locationBinName ? (
            <span className="tw:bg-gray-100 tw:text-gray-700 tw:px-2 tw:py-0.5 tw:rounded tw:text-xs tw:font-mono">
              {data._location.locationName} / {data._location.locationRackName}{" "}
              / {data._location.locationBinName}
            </span>
          ) : (
            <span className="tw:text-gray-400 tw:text-xs">No location</span>
          )}
        </div>
        {/* Shelf Life */}
        <div className="tw:flex tw:items-center tw:space-x-2">
          <Calendar className="tw:text-gray-400 tw:w-4 tw:h-4" />
          <span className="tw:text-gray-400">
            {data.shelfLife || "No expiry data"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MobileViewItem;
