import { Link2, Mail, MapPin, Phone, User } from "lucide-react";
import { useEffect, useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import DisconnectFromSellerModal from "../modals/DisconnectFromSellerModal";

interface ConnectedSellerDetailsProps {
  fid: string;
  className?: string;
  template?: 1 | 2;
}

const ConnectedSellerDetails: React.FC<ConnectedSellerDetailsProps> = ({
  fid,
  template = 1,
}) => {
  const [, setLoading] = useState<boolean>(true);
  const [, setError] = useState<string>("");
  const [seller, setSeller] = useState<any>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSeller = async () => {
      try {
        setLoading(true);
        setError("");
        if (!fid) {
          setSeller(null);
          setLoading(false);
          return;
        }
        const resp = await FranchiseService.getFranchise(fid);
        const data = resp?.data?.data;
        if (isMounted) {
          setSeller(data || null);
          try {
            const myLatLng = AuthService.getLoggedInUserLatLng();
            const sellerLat = data?.latitude;
            const sellerLng = data?.longitude;

            if (myLatLng && sellerLat != null && sellerLng != null) {
              const km = await CommonService.getGoogleDistance(myLatLng, {
                lat: sellerLat,
                lng: sellerLng,
              });
              setDistanceKm(km.roundedDistance);
            } else {
              setDistanceKm(null);
            }
          } catch (err) {
            // ignore distance calculation errors
            setDistanceKm(null);
          }
        }
      } catch (e) {
        if (isMounted) setError("Failed to load seller details");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchSeller();
    return () => {
      isMounted = false;
    };
  }, [fid]);

  const ownerDetails = seller?.ownerDetails || {};
  const ownerName = ownerDetails?.name || seller?.name || "";
  const mobile = seller?.mobile || "";
  const email = seller?.email || "";
  const addressLine1 = seller?.addressLine1 || "";
  const addressLine2 = seller?.addressLine2 || "";
  const city = seller?.city || "";
  const district = seller?.district || "";
  const state = seller?.state || "";
  const pincode = seller?.pincode || "";
  const photoId =
    ownerDetails?.photoUrl || seller?.shopPhotosDetails?.[0]?.fileUrl;

  const [showDisconnectModal, setShowDisconnectModal] =
    useState<boolean>(false);

  const handleDisconnectModalClose = (r?: { action: string; data?: any }) => {
    setShowDisconnectModal(false);
  };

  return (
    <>
      {template === 1 ? (
        <AppCard title="Connected Seller Details" icon={<Link2 size={18} />}>
          <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
            <div className="tw:flex tw:gap-3 tw:flex-1">
              <div className="tw:w-12 tw:h-12 tw:rounded tw:overflow-hidden tw:flex tw:items-center tw:justify-center tw:bg-gray-50 tw:border tw:border-gray-200">
                {photoId ? (
                  <ImgRender
                    assetId={photoId}
                    alt={ownerName}
                    className="tw:w-full tw:h-full tw:object-cover"
                  />
                ) : (
                  <User size={24} className="tw:text-gray-500" />
                )}
              </div>

              <div className="tw:flex-1">
                {/* Name */}
                <div className="tw:text-base tw:font-semibold tw:leading-5 tw:mb-1">
                  {seller?.name || ""}
                </div>

                {/* Mobile, Email */}
                <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-6 tw:gap-y-1 tw:mt-1 tw:text-sm tw:text-gray-700">
                  <div className="tw:flex tw:items-center tw:gap-1">
                    <Phone size={16} />
                    <span>{mobile || "-"}</span>
                  </div>
                  {email && (
                    <div className="tw:flex tw:items-center tw:gap-1">
                      <Mail size={16} />
                      <span>{email || "-"}</span>
                    </div>
                  )}
                </div>

                {/* Address */}
                <div className="tw:flex tw:items-start tw:gap-2 tw:mt-2 tw:text-sm tw:text-gray-700">
                  <MapPin size={16} className="tw:mt-[2px]" />
                  <div>
                    {addressLine1}
                    {addressLine1 && addressLine2 ? ", " : ""}
                    {addressLine2}
                    {(addressLine1 || addressLine2) &&
                    (city || district || state || pincode)
                      ? ", "
                      : ""}
                    {[city, district, state].filter(Boolean).join(", ")}
                    {pincode ? ` - ${pincode}` : ""}
                    {distanceKm ? (
                      <span className="tw:inline-flex tw:items-center tw:gap-1 tw:bg-gray-100 tw:text-gray-700 tw:text-xs tw:px-2 tw:py-0.5 tw:rounded tw:mt-1 tw:ms-1">
                        <MapPin size={12} className="tw:text-gray-500" />
                        <span>
                          {CommonService.roundedByDecimalPlace(distanceKm, 2)}{" "}
                          km away
                        </span>
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* Disconnect Button */}
            <div>
              {/* <AppButton
                size="small"
                fill="outline"
                color="danger"
                onClick={handleDisconnectClick}
              >
                Disconnect
              </AppButton> */}
            </div>
          </div>
        </AppCard>
      ) : (
        <div className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:flex-wrap">
          <Link2 size={16} className="tw:text-blue-600" />
          <span className="tw:text-blue-800 tw:font-medium">
            Connected SK Seller:
          </span>
          <span className="tw:font-medium">{seller?.name || ""}</span>
          {distanceKm && (
            <span className="tw:inline-flex tw:items-center tw:gap-1 tw:bg-gray-100 tw:text-gray-700 tw:text-xs tw:px-2 tw:py-0.5 tw:rounded">
              <MapPin size={12} className="tw:text-gray-500" />
              <span>
                {CommonService.roundedByDecimalPlace(distanceKm, 2)} km away
              </span>
            </span>
          )}
        </div>
      )}
      <DisconnectFromSellerModal
        show={showDisconnectModal}
        onClose={handleDisconnectModalClose}
      />
    </>
  );
};

export default ConnectedSellerDetails;
