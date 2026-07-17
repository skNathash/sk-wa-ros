import { Edit, History } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import KeyValue from "~/components/core/key-value/KeyValue";
import StaticGMap from "~/components/core/map/StaticGMap";
import GMapLocModal from "~/modals/feature/geo-location/GeoLocationModal";
import UpdateStoreLocationModal from "../modals/UpdateStoreLocationModal";
import AddressLogsModal from "../modals/AddressLogsModal";

interface StoreLocationProps {
  addressLine1?: string;
  addressLine2?: string;
  latitude?: number;
  longitude?: number;
  pincode?: string;
  state?: string;
  district?: string;
  city?: string;
  addressLogs?: any[];
  onLocationUpdate?: (locationData: {
    address: string;
    addressLine1: string;
    addressLine2: string;
    pincode: string;
    state: string;
    district: string;
    city: string;
    latitude?: number;
    longitude?: number;
  }) => void;
}

const StoreLocation: React.FC<StoreLocationProps> = ({
  addressLine1,
  addressLine2,
  latitude,
  longitude,
  pincode,
  state,
  district,
  city,
  addressLogs = [],
  onLocationUpdate,
}) => {
  const { t } = useTranslation(["common"]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [addressLogsModal, setAddressLogsModal] = useState<{
    show: boolean;
  }>({ show: false });
  const [storeLocationModalState, setStoreLocationModalState] = useState<{
    show: boolean;
    data?: {
      address?: string;
      addressLine1?: string;
      addressLine2?: string;
      pincode?: string;
      state?: string;
      district?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
    };
  }>({
    show: false,
  });
  const [selectedLocationData, setSelectedLocationData] = useState<any>(null);

  // Construct full address from structured fields
  const fullAddress = [addressLine1, addressLine2].filter(Boolean).join(", ");

  const handleLocationModalCallback = (data: {
    action: string;
    address?: any;
  }) => {
    if (data.action === "submit" && data.address) {
      // Store the selected location data and open the store location modal
      setSelectedLocationData(data.address);
      setShowLocationModal(false);
      setStoreLocationModalState({
        show: true,
        data: {
          address: data.address?.loc || fullAddress,
          // Prefer Google location parts; do not autofill from previous profile data
          addressLine1: data.address?.line1 || "",
          addressLine2: data.address?.line2 || "",
          pincode: data.address?.pincode || "",
          state: data.address?.state || "",
          district: data.address?.district || "",
          city: data.address?.town || "",
          latitude: data.address?.lat || null,
          longitude: data.address?.lng || null,
        },
      });
    } else if (data.action === "close") {
      setShowLocationModal(false);
    }
  };

  const handleStoreLocationModalCallback = (data: {
    action: string;
    data?: any;
  }) => {
    if (data.action === "open_map") {
      // Re-open the map modal for the user to pick location
      setShowLocationModal(true);
      setStoreLocationModalState({ show: false });
      setSelectedLocationData(null);
      return;
    }

    if (data.action === "submit" && data.data && onLocationUpdate) {
      onLocationUpdate(data.data);
    }

    // Some modals may emit a 'success' action instead of 'submit'. The
    // approval-flow success carries no payload, so refresh regardless of data.
    if (data.action === "success") {
      onLocationUpdate?.(data.data);
    }

    setStoreLocationModalState({ show: false });
    setSelectedLocationData(null);
  };

  const titleContent = (
    <div className="tw:flex tw:items-center tw:justify-between tw:w-full">
      <span>{t("storeLocation")}</span>
      <div className="tw:flex tw:gap-2">
        {addressLogs &&
          addressLogs.length > 0 &&
          (() => {
            const pendingAddressCount = Array.isArray(addressLogs)
              ? addressLogs.filter((a) => a && a.status === "Pending").length
              : 0;
            return (
              <AppButton
                fill="outline"
                color="light"
                size="small"
                onClick={() => setAddressLogsModal({ show: true })}
              >
                <History className="tw:w-4 tw:h-4" />
                <span className="tw:text-sm">History</span>
                {pendingAddressCount > 0 && (
                  <span className="tw:ml-1 tw:inline-flex tw:items-center tw:justify-center tw:w-5 tw:h-5 tw:rounded-full tw:text-xs tw:bg-amber-400 tw:text-black">
                    {pendingAddressCount}
                  </span>
                )}
              </AppButton>
            );
          })()}
        <AppButton
          fill="outline"
          color="light"
          size="small"
          onClick={() => setShowLocationModal(true)}
        >
          <Edit className="tw:w-4 tw:h-4" />
          <span className="tw:text-sm">Add Address</span>
        </AppButton>
      </div>
    </div>
  );

  return (
    <div>
      <AppCard
        title={titleContent}
        icon="map-pin"
        iconClassName="tw:text-blue-600"
      >
        <div className="tw:flex tw:flex-col tw:h-80 tw:space-y-2">
          <KeyValue label={t("address")} size="sm">
            {fullAddress || "--"}
          </KeyValue>
          <div className="tw:grid tw:grid-cols-2 tw:gap-2">
            <KeyValue label={t("town")} size="sm">
              {city || "--"}
            </KeyValue>
            <KeyValue label={t("district")} size="sm">
              {district || "--"}
            </KeyValue>
            <KeyValue label={t("state")} size="sm">
              {state || "--"}
            </KeyValue>
            <KeyValue label={t("pincode")} size="sm">
              {pincode || "--"}
            </KeyValue>
          </div>
          <div className="tw:flex-1 tw:flex tw:flex-col">
            <div className="tw:text-xs tw:text-gray-500">{t("map")}</div>
            <div className="tw:flex-1 tw:bg-gray-100 tw:flex tw:items-center tw:justify-center tw:rounded tw:mb-2">
              {typeof latitude === "number" && typeof longitude === "number" ? (
                <StaticGMap
                  lat={latitude}
                  lng={longitude}
                  className="tw:w-full tw:h-full tw:rounded"
                />
              ) : (
                <span className="tw:text-gray-400">
                  {t("locationNotAvailable")}
                </span>
              )}
            </div>
          </div>
        </div>
      </AppCard>

      <GMapLocModal
        show={showLocationModal}
        callback={handleLocationModalCallback}
        enableGeoLoc={true}
        lat={latitude}
        lng={longitude}
        title="Select Store Location"
      />

      <UpdateStoreLocationModal
        show={storeLocationModalState.show}
        callback={handleStoreLocationModalCallback}
        data={storeLocationModalState.data}
      />

      <AddressLogsModal
        show={addressLogsModal.show}
        callback={(args) => {
          if (args.action === "close") {
            setAddressLogsModal({ show: false });
          }
        }}
        addresses={addressLogs}
      />
    </div>
  );
};

export default StoreLocation;
