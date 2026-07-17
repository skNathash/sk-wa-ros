import React, { useState } from "react";
import { useFormContext, useWatch, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { User, Phone, Car, MapPin, Camera, X } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import { AppInput, AppPincodeInput, AppSelect } from "~/components/core/form";
import SdtLocation from "~/components/core/sdt/SdtLocation";
import StaticGMap from "~/components/core/map/StaticGMap";
import GMapLocModal from "~/modals/feature/geo-location/GeoLocationModal";
import FileUpload from "~/components/core/file-upload/FileUpload";
import ImgRender from "~/components/core/img/ImgRender";
import AppButton from "~/components/core/button/AppButton";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import type { CustomerType } from "../customers/helper";

const genderOptions = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];

interface KycProps {
  type?: CustomerType;
  storePhotos?: { id: string; url: string }[];
}

const Kyc: React.FC<KycProps> = ({ type = "b2b", storePhotos = [] }) => {
  const { t } = useTranslation();
  const { register, control, setValue, getValues } = useFormContext();
  const [showMapModal, setShowMapModal] = useState(false);

  const [
    watchedState,
    watchedDistrict,
    watchedTown,
    watchedLat,
    watchedLng,
    watchedAddress,
    watchedPincode,
  ] = useWatch({
    control,
    name: [
      "kyc.state",
      "kyc.district",
      "kyc.town",
      "kyc.latitude",
      "kyc.longitude",
      "kyc.address",
      "kyc.pincode",
    ],
  });

  const watchedPhoto = useWatch({ control, name: "kyc.photo" });

  const handlePincodeSelect = (data: {
    value: number | null;
    status?: string;
    data?: any;
  }) => {
    if (data.status === "success" && data.data) {
      setValue("kyc.pincode", data.value?.toString() || "");
      setValue("kyc.state", data.data.state || "");
      setValue("kyc.district", data.data.district || "");
      setValue("kyc.town", data.data.town || "");
    } else if (data.status === "error") {
      setValue("kyc.state", "");
      setValue("kyc.district", "");
      setValue("kyc.town", "");
    } else {
      setValue("kyc.pincode", data.value?.toString() || "");
      if (!data.value || data.value.toString().length < 6) {
        setValue("kyc.state", "");
        setValue("kyc.district", "");
        setValue("kyc.town", "");
      }
    }
  };

  const handleLocationChange = ({
    data: location,
  }: {
    action: string;
    data: any;
  }) => {
    setValue("kyc.state", location.state || "");
    setValue("kyc.district", location.district || "");
    setValue("kyc.town", location.town || "");
    if (location.lat) setValue("kyc.latitude", location.lat);
    if (location.lng) setValue("kyc.longitude", location.lng);
  };

  const handleMapModalCallback = (data: { action: string; address?: any }) => {
    if (data.action === "submit" && data.address) {
      const a = data.address;
      if (a.lat) setValue("kyc.latitude", a.lat);
      if (a.lng) setValue("kyc.longitude", a.lng);
      if (a.town) setValue("kyc.town", a.town);
      if (a.state) setValue("kyc.state", a.state);
      if (a.district) setValue("kyc.district", a.district);
      if (a.pincode) setValue("kyc.pincode", a.pincode);
      if (a.line1) setValue("kyc.address", a.line1);
    }
    setShowMapModal(false);
  };

  const handlePhotoUpload = (response: any) => {
    const assetId =
      response?.id ||
      response?._id ||
      response?.data?.id ||
      response?.data?._id ||
      "";
    if (assetId) {
      setValue("kyc.photo", assetId, { shouldDirty: true });
    }
  };

  return (
    <div className="tw:space-y-4">
      {/* Intro banner */}
      <div className="tw:bg-linear-to-r tw:from-blue-50 tw:to-indigo-50 tw:border tw:border-blue-100 tw:rounded-lg tw:px-3 tw:py-2.5 tw:flex tw:items-start tw:gap-2">
        <div className="tw:w-7 tw:h-7 tw:bg-blue-500 tw:text-white tw:rounded-lg tw:flex tw:items-center tw:justify-center tw:shrink-0">
          <User size={14} />
        </div>
        <div>
          <div className="tw:text-xs tw:font-bold tw:text-blue-900">
            KYC Verification
          </div>
          <div className="tw:text-[11px] tw:text-blue-700 tw:mt-0.5">
            Verify identity, contact, and address details. Name is required.
          </div>
        </div>
      </div>

      {/* Personal Details */}
      <AppCard>
        <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3 tw:pb-2 tw:border-b tw:border-gray-100">
          <div className="tw:w-7 tw:h-7 tw:bg-blue-100 tw:text-blue-600 tw:rounded-lg tw:flex tw:items-center tw:justify-center tw:shrink-0">
            <User size={14} />
          </div>
          <div className="tw:flex-1">
            <h3 className="tw:text-sm tw:font-bold tw:text-gray-800">
              Personal Details
            </h3>
            <p className="tw:text-[10px] tw:text-gray-500">
              Basic identity info
            </p>
          </div>
          <span className="tw:text-[10px] tw:text-red-500 tw:font-semibold">* Required</span>
        </div>

        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-3">
          <AppInput
            label={t("name", "Name")}
            name="kyc.name"
            register={register}
            placeholder="Enter name"
            size="sm"
            isRequired
            disabled={type === "b2b"}
            readOnly={type === "b2b"}
            onChange={(e) => {
              if (type === "b2b") return;
              const filtered = e.target.value.replace(/[^a-zA-Z\s]/g, "");
              setValue("kyc.name", filtered);
            }}
          />
          <AppInput
            label={t("alternatePhoneNumber", "Alternate Phone Number")}
            name="kyc.alternatePhone"
            register={register}
            placeholder="Enter alternate phone number"
            type="number"
            maxLength={10}
            size="sm"
          />
          <Controller
            control={control}
            name="kyc.gender"
            render={({ field }) => (
              <AppSelect
                label={t("gender", "Gender")}
                options={genderOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Select gender"
                inputClassName="tw:w-full"
                size="sm"
              />
            )}
          />
          <AppInput
            label={t("age", "Age")}
            name="kyc.age"
            register={register}
            placeholder="Enter age"
            type="number"
            maxLength={3}
            size="sm"
            onChange={(e) => {
              let val = e.target.value.replace(/[^0-9]/g, "");
              if (val && Number(val) > 120) val = "120";
              setValue("kyc.age", val);
            }}
          />
        </div>
      </AppCard>

      {/* Photo Upload */}
      <AppCard>
        <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3 tw:pb-2 tw:border-b tw:border-gray-100">
          <div className="tw:w-7 tw:h-7 tw:bg-purple-100 tw:text-purple-600 tw:rounded-lg tw:flex tw:items-center tw:justify-center tw:shrink-0">
            <Camera size={14} />
          </div>
          <div className="tw:flex-1">
            <h3 className="tw:text-sm tw:font-bold tw:text-gray-800">
              Customer Photo
            </h3>
            <p className="tw:text-[10px] tw:text-gray-500">
              Clear face photo for identification
            </p>
          </div>
        </div>

        <div className="tw:flex tw:items-center tw:gap-4">
          {watchedPhoto ? (
            <div className="tw:relative tw:w-20 tw:h-20 tw:rounded-lg tw:overflow-hidden tw:border tw:border-gray-200">
              <ImgRender
                assetId={watchedPhoto}
                alt="KYC Photo"
                className="tw:w-full tw:h-full tw:object-cover"
              />
              <button
                type="button"
                onClick={() => setValue("kyc.photo", "", { shouldDirty: true })}
                className="tw:absolute tw:top-0.5 tw:right-0.5 tw:w-5 tw:h-5 tw:bg-red-100 tw:text-red-500 tw:rounded-full tw:flex tw:items-center tw:justify-center hover:tw:bg-red-200 tw:transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <div className="tw:w-20 tw:h-20 tw:rounded-lg tw:border-2 tw:border-dashed tw:border-gray-300 tw:flex tw:items-center tw:justify-center">
              <Camera className="tw:text-gray-400" size={24} />
            </div>
          )}
          <div className="tw:flex tw:flex-col tw:gap-1">
            <FileUpload onFileUpload={handlePhotoUpload}>
              <AppButton
                type="button"
                color="primary"
                fill="outline"
                size="small"
                className="tw:h-8"
              >
                <Camera size={14} className="tw:mr-1" />
                {watchedPhoto ? "Change Photo" : "Upload Photo"}
              </AppButton>
            </FileUpload>
            <p className="tw:text-[10px] tw:text-gray-500">
              Max 10MB · JPG, JPEG, PNG, WEBP
            </p>
          </div>
        </div>
      </AppCard>

      {/* Vehicle Details */}
      <AppCard>
        <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3 tw:pb-2 tw:border-b tw:border-gray-100">
          <div className="tw:w-7 tw:h-7 tw:bg-amber-100 tw:text-amber-600 tw:rounded-lg tw:flex tw:items-center tw:justify-center tw:shrink-0">
            <Car size={14} />
          </div>
          <div className="tw:flex-1">
            <h3 className="tw:text-sm tw:font-bold tw:text-gray-800">
              Vehicle Details
            </h3>
            <p className="tw:text-[10px] tw:text-gray-500">
              Optional — delivery or transport vehicle
            </p>
          </div>
        </div>

        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-3">
          <AppInput
            label={t("vehicleNumber", "Vehicle Number")}
            name="kyc.vehicleNumber"
            register={register}
            placeholder="Enter vehicle number"
            size="sm"
          />
          <AppInput
            label={t("vehicleName", "Vehicle Name")}
            name="kyc.vehicleName"
            register={register}
            placeholder="Enter vehicle name"
            size="sm"
          />
        </div>
      </AppCard>

      {/* Store Photos - B2B only */}
      {type === "b2b" && storePhotos.length > 0 && (
        <AppCard>
          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3 tw:pb-2 tw:border-b tw:border-gray-100">
            <div className="tw:w-7 tw:h-7 tw:bg-teal-100 tw:text-teal-600 tw:rounded-lg tw:flex tw:items-center tw:justify-center tw:shrink-0">
              <Camera size={14} />
            </div>
            <div className="tw:flex-1">
              <h3 className="tw:text-sm tw:font-bold tw:text-gray-800">
                Store Photos
              </h3>
              <p className="tw:text-[10px] tw:text-gray-500">
                Approved shop photos on file
              </p>
            </div>
            <span className="tw:text-[10px] tw:font-semibold tw:text-teal-700 tw:bg-teal-50 tw:px-2 tw:py-0.5 tw:rounded-full">
              {storePhotos.length} photo{storePhotos.length > 1 ? "s" : ""}
            </span>
          </div>
          <AppSwiper
            config={{
              slidesPerView: 2.5,
              spaceBetween: 8,
              breakpoints: {
                768: { slidesPerView: 5, spaceBetween: 12 },
                1024: { slidesPerView: 6, spaceBetween: 12 },
              },
            }}
          >
            {storePhotos.map((photo, idx) => (
              <AppSwiper.Slide key={idx}>
                <div className="tw:aspect-square tw:rounded-lg tw:overflow-hidden tw:border tw:border-gray-200 tw:bg-gray-50">
                  <ImgRender
                    assetId={photo.id}
                    alt={`Store photo ${idx + 1}`}
                    className="tw:w-full tw:h-full tw:object-cover"
                  />
                </div>
              </AppSwiper.Slide>
            ))}
          </AppSwiper>
        </AppCard>
      )}

      {/* Address & Geolocation */}
      <AppCard>
        <div className="tw:flex tw:items-center tw:justify-between tw:mb-3 tw:pb-2 tw:border-b tw:border-gray-100 tw:gap-2">
          <div className="tw:flex tw:items-center tw:gap-2 tw:min-w-0">
            <div className="tw:w-7 tw:h-7 tw:bg-rose-100 tw:text-rose-600 tw:rounded-lg tw:flex tw:items-center tw:justify-center tw:shrink-0">
              <MapPin size={14} />
            </div>
            <div className="tw:min-w-0">
              <h3 className="tw:text-sm tw:font-bold tw:text-gray-800">
                Address & Location
              </h3>
              <p className="tw:text-[10px] tw:text-gray-500 tw:truncate">
                {type === "b2b" ? "Verified from franchise profile" : "Where the customer resides"}
              </p>
            </div>
          </div>
          {type !== "b2b" && (
            <AppButton
              type="button"
              size="small"
              fill="outline"
              onClick={() => setShowMapModal(true)}
              className="tw:h-8 tw:px-3 tw:text-xs"
            >
              <MapPin className="tw:w-3.5 tw:h-3.5 tw:mr-1.5" />
              {t("searchOnMap", "Search on Map")}
            </AppButton>
          )}
        </div>

        {type === "b2b" ? (
          <div className="tw:space-y-3">
            <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-3">
              {[
                { label: t("address", "Address"), value: watchedAddress },
                { label: t("pincode", "Pincode"), value: watchedPincode },
                { label: t("state", "State"), value: watchedState },
                { label: t("district", "District"), value: watchedDistrict },
                { label: t("town", "Town"), value: watchedTown },
              ].map((item) => (
                <div key={item.label}>
                  <span className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wider tw:text-gray-400">
                    {item.label}
                  </span>
                  <p className="tw:text-sm tw:text-gray-800 tw:mt-0.5">
                    {item.value || "-"}
                  </p>
                </div>
              ))}
            </div>

            {typeof watchedLat === "number" &&
              typeof watchedLng === "number" && (
                <div className="tw:mt-2">
                  <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
                    <span className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wider tw:text-gray-400">
                      Location Preview
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
        ) : (
          <>
            <div className="tw:grid tw:grid-cols-12 tw:gap-x-4 tw:gap-y-3">
              <div className="tw:col-span-12">
                <AppInput
                  label={t("address", "Address")}
                  name="kyc.address"
                  register={register}
                  placeholder="Enter address"
                  size="sm"
                />
              </div>

              <div className="tw:col-span-12 tw:md:col-span-4">
                <AppPincodeInput
                  name="kyc.pincode"
                  label={t("pincode", "Pincode")}
                  placeholder="Enter 6 digit pincode"
                  register={register}
                  onPincodeSelect={handlePincodeSelect}
                  showMultipleResult={false}
                />
              </div>

              <div className="tw:col-span-12 tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
                <SdtLocation
                  state={watchedState || ""}
                  district={watchedDistrict || ""}
                  town={watchedTown || ""}
                  callback={handleLocationChange}
                />
              </div>

              {typeof watchedLat === "number" &&
                typeof watchedLng === "number" && (
                  <div className="tw:col-span-12 tw:mt-2">
                    <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
                      <span className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wider tw:text-gray-400">
                        Location Preview
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
          </>
        )}
      </AppCard>
    </div>
  );
};

export default Kyc;
