import { LocationEdit, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useRef, useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import { AppPincodeInput, AppInput } from "~/components/core/form";
import SdtLocation from "~/components/core/sdt/SdtLocation";
import StaticGMap from "~/components/core/map/StaticGMap";
import GMapLocModal from "~/modals/feature/geo-location/GeoLocationModal";
import AppButton from "~/components/core/button/AppButton";
import useAppToast from "~/hooks/useAppToast";
import { validateStoreAddress } from "../helper";
import CommonService from "~/services/CommonService";

const StoreAddress = ({
  setActiveStep,
}: {
  setActiveStep: (step: number) => void;
}) => {
  const { t } = useTranslation(["common"]);
  const { register, control, setValue, getValues } = useFormContext();
  const appToast = useAppToast();

  const [watchedState, watchedDistrict, watchedTown, watchedLat, watchedLng] =
    useWatch({
      control,
      name: ["state", "district", "town", "latitude", "longitude"],
    });

  const [showMapModal, setShowMapModal] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);

  const handlePincodeSelect = (data: {
    value: number | null;
    status?: string;
    data?: any;
  }) => {
    if (data.status === "success" && data.data) {
      setValue("pincode", data.value?.toString() || "");
      setValue("pincodeData", {
        city: data.data.town || "",
        state: data.data.state || "",
        district: data.data.district || "",
      });
      setValue("state", data.data.state || "");
      setValue("district", data.data.district || "");
      setValue("town", data.data.town || "");
    } else if (data.status === "error") {
      console.error("Invalid pincode or no data found");
      setValue("pincodeData", { city: "", state: "", district: "" });
      setValue("state", "");
      setValue("district", "");
      setValue("town", "");
    } else {
      setValue("pincode", data.value?.toString() || "");
      if (!data.value || data.value.toString().length < 6) {
        setValue("pincodeData", { city: "", state: "", district: "" });
        setValue("state", "");
        setValue("district", "");
        setValue("town", "");
      }
    }
  };

  const handleLocationChange = ({
    action,
    data: location,
  }: {
    action: string;
    data: any;
  }) => {
    setValue("state", location.state || "");
    setValue("district", location.district || "");
    setValue("town", location.town || "");
    setValue("pincodeData", {
      city: location.town || "",
      state: location.state || "",
      district: location.district || "",
    });
    // If the SdtLocation returns coordinates, update them
    if (location.lat || location.lng) {
      if (location.lat) setValue("latitude", location.lat);
      if (location.lng) setValue("longitude", location.lng);
    }
  };

  const handleBack = () => {
    setActiveStep(1);
  };

  const handleNext = () => {
    const formData = getValues();
    const { msg, status } = validateStoreAddress(formData);
    if (!status) {
      appToast.show({
        msg: t(msg),
        color: "danger",
      });
      return;
    }
    // Move to success step; parent handles creation when step advances
    setActiveStep(3);
  };

  const handleMapModalCallback = (data: { action: string; address?: any }) => {
    if (data.action === "submit" && data.address) {
      const a = data.address;
      if (a.lat) setValue("latitude", a.lat);
      if (a.lng) setValue("longitude", a.lng);
      if (a.town) setValue("town", a.town);
      if (a.state) setValue("state", a.state);
      if (a.district) setValue("district", a.district);
      if (a.pincode) setValue("pincode", a.pincode);
      if (a.line1) setValue("street", a.line1);

      setShowMapModal(false);

      if (mapRef.current) {
        const t = setTimeout(() => {
          CommonService.scrollToView(mapRef.current);
        }, 1000);
        return () => clearTimeout(t);
      }
    }
    setShowMapModal(false);
  };

  return (
    <>
      <AppCard
        title={
          <div className="tw:flex tw:items-center tw:justify-between tw:w-full">
            <div className="tw:flex tw:items-center tw:gap-2">
              <MapPin className="tw:w-5 tw:h-5 tw:text-primary" />
              <span>{t("storeAddress")}</span>
            </div>
            <AppButton
              type="button"
              size="small"
              fill="outline"
              onClick={() => setShowMapModal(true)}
              className="tw:h-8 tw:px-3 tw:text-xs"
            >
              <LocationEdit className="tw:w-3.5 tw:h-3.5 tw:mr-1.5" />
              {t("searchOnMap")}
            </AppButton>
          </div>
        }
        subtitle={
          <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
            {t("provideStoreAddressInformation")}
          </div>
        }
      >
        <div className="tw:grid tw:grid-cols-12 tw:gap-x-4 tw:gap-y-3">
          {/* Row 1: Pincode and Door No */}
          <div className="tw:col-span-12 tw:md:col-span-4">
            <AppPincodeInput
              name="pincode"
              label={t("pincode")}
              placeholder={t("enter6DigitPincode")}
              register={register}
              onPincodeSelect={handlePincodeSelect}
              showMultipleResult={false}
              isRequired={true}
            />
          </div>
          <div className="tw:col-span-12 tw:md:col-span-8">
            <AppInput
              name="door_no"
              register={register}
              label={t("doorNo")}
              placeholder={t("doorNo")}
              isRequired={true}
            />
          </div>

          {/* Row 2: Street Address */}
          <div className="tw:col-span-12">
            <AppInput
              name="street"
              register={register}
              label={t("street")}
              placeholder={t("enterStreetName")}
              isRequired={true}
            />
          </div>

          {/* Row 3: Town, District, State */}
          <div className="tw:col-span-12 tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
            <SdtLocation
              state={watchedState}
              district={watchedDistrict}
              town={watchedTown}
              callback={handleLocationChange}
              isStateRequired={true}
              isDistrictRequired={true}
              isTownRequired={true}
            />
          </div>

          {/* Map Preview */}
          <div ref={mapRef}></div>
          {typeof watchedLat === "number" && typeof watchedLng === "number" && (
            <div className="tw:col-span-12 tw:mt-2">
              <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
                <span className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wider tw:text-gray-400">
                  {t("locationPreview")}
                </span>
                <span className="tw:text-[10px] tw:text-gray-400">
                  {watchedLat.toFixed(4)}, {watchedLng.toFixed(4)}
                </span>
              </div>
              <div className="tw:h-32 tw:bg-gray-50 tw:rounded-lg tw:border tw:border-dashed tw:border-gray-200 tw:overflow-hidden tw:relative">
                <StaticGMap
                  lat={watchedLat}
                  lng={watchedLng}
                  className="tw:w-full tw:h-full tw:grayscale hover:tw:grayscale-0 tw:transition-all"
                />
                <div className="tw:absolute tw:inset-0 tw:pointer-events-none tw:flex tw:items-center tw:justify-center">
                  <div className="tw:w-8 tw:h-8 tw:bg-white/80 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:shadow-sm">
                    <MapPin className="tw:w-4 tw:h-4 tw:text-primary" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <GMapLocModal
          show={showMapModal}
          enableGeoLoc={true}
          lat={typeof watchedLat === "number" ? watchedLat : undefined}
          lng={typeof watchedLng === "number" ? watchedLng : undefined}
          callback={handleMapModalCallback}
          title="Choose Location"
        />

        <div className="tw:flex tw:justify-between tw:gap-2 tw:mt-8">
          <AppButton color="light" fill="outline" onClick={handleBack}>
            <ChevronLeft />
            {t("back")}
          </AppButton>
          <AppButton color="primary" onClick={handleNext}>
            {t("create")}
            <ChevronRight />
          </AppButton>
        </div>
      </AppCard>
    </>
  );
};

export default StoreAddress;
