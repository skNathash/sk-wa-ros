import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import WhatsAppGlyph from "~/components/core/icons/WhatsAppGlyph";
import { Phone, Mail, MapPin, User } from "lucide-react";
import CustomerService from "~/services/CustomerService";
import FranchiseService from "~/services/FranchiseService";
import AppLink from "~/components/core/link/AppLink";
import CommonService from "~/services/CommonService";
import AuthService from "~/services/AuthService";
import DateFormat from "~/components/core/date/DateFormat";

type Props = {
  customerInfo?: {
    name?: string;
    mobile?: string;
    customerId?: string;
    customerType?: string;
    isGuestCustomer?: boolean;
  };
  deliveryAddress?: {
    name?: string;
    street?: string;
    state?: string;
    landmark?: string;
    doorNo?: string;
    district?: string;
    city?: string;
    pincode?: string;
    mobile?: string;
    contact?: string;
    phone?: string;
    geoLocation?: { coordinates?: number[] };
  };
  deliveryDistance?: number | null;
};

// Common data structure for both customer and franchise
interface NormalizedCustomerData {
  name: string;
  mobile: string;
  email?: string;
  address: {
    town?: string;
    district?: string;
    state?: string;
    pincode?: string;
  };
  customerType?: string;
  franchiseId?: string;
  type?: string;
  subType?: string;
}

// Function to normalize customer data
const normalizeCustomerData = (rawData: any): NormalizedCustomerData => {
  return {
    name: rawData.name || rawData.fName || rawData.ownerDetails?.name || "N/A",
    mobile: rawData.mobile || "N/A",
    email: rawData.email || undefined,
    address: {
      town: rawData.address?.town || rawData.city || rawData.town,
      district: rawData.address?.district || rawData.district,
      state: rawData.address?.state || rawData.state,
      pincode: rawData.address?.pincode || rawData.pincode,
    },
    customerType: "Customer",
  };
};

// Function to normalize franchise data
const normalizeFranchiseData = (rawData: any): NormalizedCustomerData => {
  return {
    name: rawData.name || rawData.ownerDetails?.name || "N/A",
    mobile: rawData.mobile || "N/A",
    email: rawData.email || undefined,
    address: {
      town: rawData.city || rawData.town,
      district: rawData.district,
      state: rawData.state,
      pincode: rawData.pincode,
    },
    customerType: "Retailer",
    franchiseId: rawData.franchiseId,
    type: rawData.type,
    subType: rawData.subType,
  };
};

const DeliveryTo = ({
  customerInfo,
  deliveryAddress,
  deliveryDistance,
}: Props) => {
  const { t } = useTranslation(["common"]);
  const [data, setData] = useState<NormalizedCustomerData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Precompute origin and destination coords for view on map button
  const origin = AuthService.getLoggedInUserLatLng();
  const coords = deliveryAddress?.geoLocation?.coordinates || [];
  const dest =
    Array.isArray(coords) && coords.length >= 2
      ? { lat: coords[1], lng: coords[0] }
      : null;
  const canViewOnMap = !!(origin && dest);

  useEffect(() => {
    const fetchCustomer = async () => {
      // If the passed customer is a guest (walkin) customer, show as walkin and skip fetching
      if (customerInfo?.isGuestCustomer) {
        setData({
          name: t("walkin-customer"),
          mobile: "",
          email: undefined,
          address: {},
          customerType: "Customer",
        });
        return;
      }

      if (customerInfo?.customerId) {
        setLoading(true);
        try {
          let res;
          let normalizedData: NormalizedCustomerData;

          // Check if customer type is Retailer, then call FranchiseService
          if (customerInfo?.customerType === "Retailer") {
            res = await FranchiseService.getFranchise(customerInfo.customerId);
            normalizedData = normalizeFranchiseData(res.data?.data);
          } else {
            // Regular customer, use CustomerService
            res = await CustomerService.getCustomer(customerInfo.customerId);
            normalizedData = normalizeCustomerData(res.data?.data || res.data);
          }

          setData(normalizedData);
        } catch (e) {
          console.error("Error fetching customer/franchise data:", e);
          setData(null);
        }
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [customerInfo?.customerId, customerInfo?.customerType]);

  const redirectLink =
    data?.customerType === "Retailer"
      ? `/dashboard/network/view/b2b/${customerInfo?.customerId}`
      : `/dashboard/network/view/b2c/${customerInfo?.customerId}`;

  const initials =
    (data?.name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join("") || "?";

  return (
    <>
      <AppCard className="mb-4" noPadding>
        {/* Customer identity band */}
        <div className="app-seller-header tw:bg-primary/5 tw:px-4 tw:py-3 tw:border-b tw:border-primary/15">
          <div className="tw:flex tw:items-center tw:gap-3">
            <div className="tw:shrink-0 tw:w-10 tw:h-10 tw:rounded-full tw:bg-primary tw:text-white tw:flex tw:items-center tw:justify-center tw:text-sm tw:font-bold">
              {initials}
            </div>
            <div className="tw:flex-1 tw:min-w-0">
              <div className="tw:flex tw:items-center tw:gap-2 tw:flex-wrap">
                <span className="tw:font-semibold tw:text-gray-900 tw:truncate">
                  <AppLink href={redirectLink} asLink>
                    {data?.name || "N/A"}
                  </AppLink>
                </span>
                <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-primary tw:bg-primary/10 tw:rounded tw:px-1.5 tw:py-0.5">
                  {data?.customerType === "Retailer" ? "Buyer" : t("customer")}
                </span>
              </div>
              {(data?.mobile || data?.email) && (
                <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-1 tw:text-xs tw:text-gray-600 tw:mt-0.5">
                  {data?.mobile && (
                    <div className="tw:flex tw:items-center tw:gap-1">
                      <Phone size={11} className="tw:text-gray-400" />
                      <span>{data.mobile}</span>
                    </div>
                  )}
                  {data?.email && (
                    <div className="tw:flex tw:items-center tw:gap-1">
                      <Mail size={11} className="tw:text-gray-400" />
                      <span className="tw:truncate">{data.email}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Reach the customer the two ways the shop floor actually uses —
                same round chat/call pair the process page carries. */}
            {data?.mobile && data.mobile !== "N/A" ? (
              <div className="tw:flex tw:items-center tw:gap-2 tw:shrink-0">
                <button
                  type="button"
                  className="op-wa-btn"
                  aria-label="Chat on WhatsApp"
                  onClick={() =>
                    CommonService.windowOpenHandler(
                      `https://wa.me/${String(data.mobile).replace(/\D/g, "")}`,
                      () => {},
                    )
                  }
                >
                  <WhatsAppGlyph />
                </button>
                <a
                  href={`tel:${data.mobile}`}
                  className="op-call-btn"
                  aria-label="Call customer"
                >
                  <Phone size={17} />
                </a>
              </div>
            ) : null}
          </div>
        </div>

        <div className="tw:px-4 tw:py-4">
          {/* Receiver Details Section - if different */}
          {deliveryAddress?.name &&
            data?.name &&
            deliveryAddress.name.trim() !== data.name.trim() && (
              <div className="tw:mt-4 tw:pt-3 tw:border-t tw:border-gray-200 tw:first:mt-0 tw:first:pt-0 tw:first:border-t-0">
                <div className="tw:text-xs tw:font-semibold tw:text-gray-700 tw:uppercase tw:tracking-wide tw:mb-2 tw:text-green-700 tw:flex tw:items-center tw:gap-1.5">
                  <User size={13} className="tw:text-green-600" />
                  {t("receiver")} Details
                </div>
                <div className="tw:font-medium tw:mb-1.5 tw:text-gray-900">
                  {deliveryAddress.name}
                </div>
                {(deliveryAddress.mobile ||
                  deliveryAddress.contact ||
                  deliveryAddress.phone) && (
                  <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-600">
                    <Phone size={11} className="tw:text-gray-400" />
                    <span>
                      {deliveryAddress.mobile ||
                        deliveryAddress.contact ||
                        deliveryAddress.phone}
                    </span>
                  </div>
                )}
              </div>
            )}

          {/* Delivery Address Section */}
          {deliveryAddress &&
            (deliveryAddress.street ||
              deliveryAddress.doorNo ||
              deliveryAddress.landmark ||
              deliveryAddress.city ||
              deliveryAddress.district ||
              deliveryAddress.state) && (
              <div className="tw:mt-4 tw:pt-3 tw:border-t tw:border-gray-200 tw:first:mt-0 tw:first:pt-0 tw:first:border-t-0">
                <div className="tw:text-xs tw:font-semibold tw:text-gray-700 tw:uppercase tw:tracking-wide tw:mb-2 tw:text-amber-700">
                  Delivery Address
                </div>
                <div className="tw:flex tw:gap-1.5 tw:text-xs tw:text-gray-600">
                  <MapPin
                    size={12}
                    className="tw:text-gray-400 tw:mt-0.5 tw:flex-shrink-0"
                  />
                  <div className="tw:flex-1 tw:min-w-0">
                    <div className="tw:leading-relaxed tw:text-gray-800">
                      {[
                        deliveryAddress.doorNo,
                        deliveryAddress.street,
                        deliveryAddress.landmark,
                        deliveryAddress.city,
                        deliveryAddress.district,
                        deliveryAddress.state,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                      {deliveryAddress.pincode
                        ? ` - ${deliveryAddress.pincode}`
                        : ""}
                    </div>
                    {(typeof deliveryDistance === "number" || canViewOnMap) && (
                      <div className="tw:flex tw:items-center tw:gap-2 tw:mt-2">
                        {typeof deliveryDistance === "number" && (
                          <span className="tw:text-xs tw:text-orange-600 tw:font-medium">
                            {CommonService.roundedByDecimalPlace(
                              deliveryDistance,
                              2,
                            )}{" "}
                            km
                          </span>
                        )}
                        {canViewOnMap && (
                          <AppButton
                            size="small"
                            color="light"
                            fill="outline"
                            className="tw:h-6 tw:text-xs tw:px-2"
                            onClick={() =>
                              CommonService.viewOnMap(origin, dest)
                            }
                          >
                            View Map
                          </AppButton>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          {/* Franchise Info - Compact */}
          {data?.customerType === "Retailer" &&
            (data?.franchiseId || data?.type || data?.subType) && (
              <div className="tw:mt-4 tw:pt-3 tw:border-t tw:border-gray-200 tw:first:mt-0 tw:first:pt-0 tw:first:border-t-0 tw:flex tw:flex-wrap tw:gap-x-4 tw:gap-y-1">
                {data?.franchiseId && (
                  <div className="tw:text-xs tw:text-gray-600">
                    <span className="tw:text-gray-500 tw:font-medium">
                      Franchise ID:
                    </span>{" "}
                    <span className="tw:font-semibold tw:text-gray-800">
                      {data.franchiseId}
                    </span>
                  </div>
                )}
                {(data?.type || data?.subType) && (
                  <div className="tw:text-xs tw:text-gray-600">
                    <span className="tw:text-gray-500 tw:font-medium">
                      Type:
                    </span>{" "}
                    <span className="tw:font-semibold tw:text-gray-800">
                      {data.type || "N/A"}
                      {data.subType ? ` (${data.subType})` : ""}
                    </span>
                  </div>
                )}
              </div>
            )}

          {loading && (
            <div className="tw:text-xs tw:text-gray-400 tw:italic">
              {t("loadingCustomerInfo")}
            </div>
          )}
        </div>
      </AppCard>
    </>
  );
};

export default DeliveryTo;
