import { Map, MapPin } from "lucide-react";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";

type Props = {
  shippingAddress?: {
    doorNo?: string;
    street?: string;
    landmark?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
    geoLocation?: { coordinates?: number[] };
  };
  deliveryDistance?: number | null;
};

const DeliveryAddress = ({ shippingAddress, deliveryDistance }: Props) => {
  if (!shippingAddress) return null;

  const origin = AuthService.getLoggedInUserLatLng();
  const coords = shippingAddress.geoLocation?.coordinates || [];
  const dest =
    Array.isArray(coords) && coords.length >= 2
      ? { lat: coords[1], lng: coords[0] }
      : null;
  const canViewOnMap = !!(origin && dest);

  const addrText = [
    shippingAddress.doorNo,
    shippingAddress.street,
    shippingAddress.landmark,
    shippingAddress.city,
    shippingAddress.district,
    shippingAddress.state,
  ]
    .filter(Boolean)
    .join(", ");

  if (!addrText && !canViewOnMap) return null;

  const areaTag = shippingAddress.landmark || shippingAddress.city;

  return (
    <div className="tw:flex tw:gap-2.5">
      <div className="tw:w-8 tw:h-8 tw:rounded-lg tw:bg-slate-100 tw:text-slate-500 tw:flex tw:items-center tw:justify-center tw:shrink-0">
        <Map size={16} />
      </div>
      <div className="tw:flex-1 tw:min-w-0">
        <div className="op-eyebrow tw:text-gray-400!">Deliver To</div>
        <div className="tw:text-sm tw:text-gray-800 tw:leading-snug tw:mt-0.5">
          {addrText}
          {shippingAddress.pincode ? ` ${shippingAddress.pincode}` : ""}
        </div>
        <div className="tw:flex tw:items-center tw:flex-wrap tw:gap-1.5 tw:mt-1.5">
          {typeof deliveryDistance === "number" && (
            <span className="op-chip">
              {CommonService.roundedByDecimalPlace(deliveryDistance, 2)} km
            </span>
          )}
          {areaTag && (
            <span className="op-chip op-chip-neutral">
              <MapPin size={10} />
              {areaTag}
            </span>
          )}
          {canViewOnMap && (
            <button
              type="button"
              className="op-chip op-chip-neutral tw:cursor-pointer hover:tw:bg-slate-200"
              onClick={() => CommonService.viewOnMap(origin, dest)}
            >
              View Map
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryAddress;
