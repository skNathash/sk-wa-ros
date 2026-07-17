import { MapPin } from "lucide-react";
import { Navigation } from "lucide-react";

interface AddressInfoProps {
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  distanceKm: number;
}

const AddressInfo = ({
  address,
  city,
  district,
  state,
  pincode,
  distanceKm,
}: AddressInfoProps) => {
  return (
    <div className="tw:flex tw:flex-col tw:gap-0.5">
      <div className="tw:flex tw:items-start tw:gap-1 tw:mb-2">
        <MapPin size={14} className="tw:text-gray-500 tw:mt-1" />
        <div className="tw:flex-1 tw:md:text-sm">
          {address}
          <div className="tw:text-xs tw:text-gray-500 tw:mb-2">
            {city || "-"}
            {district ? `, ${district}` : ""}
            {state ? `, ${state}` : ""}
          </div>

          <div className="tw:text-xs tw:text-gray-600 tw:flex tw:flex-wrap tw:gap-2">
            {pincode ? (
              <span className="tw:inline-flex tw:items-center tw:px-2 tw:py-0.5 tw:bg-gray-100 tw:border tw:border-gray-200 tw:rounded">
                PIN {pincode}
              </span>
            ) : null}
            {distanceKm !== undefined ? (
              <span className="tw:inline-flex tw:items-center tw:gap-1 tw:px-2 tw:py-1 tw:bg-orange-50 tw:border tw:border-orange-300 tw:rounded-md tw:text-orange-800 tw:font-semibold tw:text-xs">
                <Navigation className="tw:w-3 tw:h-3" />
                {distanceKm?.toFixed(1)} km away
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressInfo;
