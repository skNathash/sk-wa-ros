import { MapPin } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
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

  return (
    <div className="tw:mt-3 tw:pt-3 tw:border-t tw:border-gray-200">
      <div className="tw:text-xs tw:font-semibold tw:text-amber-700 tw:uppercase tw:tracking-wide tw:mb-1">
        Delivery Address
      </div>
      <div className="tw:flex tw:gap-1.5 tw:text-xs tw:text-gray-700">
        <MapPin size={12} className="tw:text-gray-400 tw:mt-0.5 tw:shrink-0" />
        <div className="tw:flex-1">
          <div className="tw:leading-relaxed">
            {addrText}
            {shippingAddress.pincode ? ` - ${shippingAddress.pincode}` : ""}
          </div>
          <div className="tw:flex tw:items-center tw:gap-2 tw:mt-2">
            {typeof deliveryDistance === "number" && (
              <span className="tw:text-xs tw:text-orange-600 tw:font-medium">
                {CommonService.roundedByDecimalPlace(deliveryDistance, 2)} km
              </span>
            )}
            {canViewOnMap && (
              <AppButton
                size="small"
                color="light"
                fill="outline"
                className="tw:h-6 tw:text-xs tw:px-2"
                onClick={() => CommonService.viewOnMap(origin, dest)}
              >
                View Map
              </AppButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryAddress;
