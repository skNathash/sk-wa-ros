import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { MapPin, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import { AppInput, AppPincodeInput } from "~/components/core/form";
import AppModal from "~/components/core/modal/AppModal";
import SdtLocation from "~/components/core/sdt/SdtLocation";
import useAppToast from "~/hooks/useAppToast";
import FranchiseService from "~/services/FranchiseService";
import InfoBlock from "~/components/core/info-blk/InfoBlock";

interface UpdateStoreLocationModalProps {
  show: boolean;
  callback: (data: { action: string; data?: any }) => void;
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
}

interface FormValues {
  addressLine1: string;
  addressLine2: string;
  pincode: string;
}

const createValidationSchema = (t: any) =>
  yup.object({
    addressLine1: yup.string().required(t("pleaseProvideStreetAddress")),
    addressLine2: yup.string().default(""),
    pincode: yup
      .string()
      .required(t("pleaseProvidePincode"))
      .matches(/^[0-9]{6}$/, t("pleaseProvidePincode")),
  });

const UpdateStoreLocationModal: React.FC<UpdateStoreLocationModalProps> = ({
  show,
  callback,
  data,
}) => {
  const { t } = useTranslation(["common"]);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(createValidationSchema(t)),
    mode: "all",
  });

  const [submitting, setSubmitting] = useState(false);
  const [display, setDisplay] = useState<"form" | "success">("form");
  const toast = useAppToast();

  // State for location data
  const [locationData, setLocationData] = useState({
    state: "",
    district: "",
    city: "",
    town: "",
  });

  useEffect(() => {
    if (show && data) {
      // Parse address into addressLine1 and addressLine2 if provided
      const addressParts = data.address?.split(",") || [];
      const addressLine1 = data.addressLine1 || addressParts[0]?.trim() || "";
      const addressLine2 =
        data.addressLine2 || addressParts.slice(1).join(",").trim() || "";

      // Populate form with captured map values so fields are autofilled
      reset({
        addressLine1,
        addressLine2,
        pincode: data.pincode || "",
      });

      // Set location data if available
      setLocationData({
        state: data.state || "",
        district: data.district || "",
        city: data.city || data.town || "",
        town: data.city || data.town || "",
      });

      // Also ensure individual fields are set in case components rely on setValue
      try {
        setValue("addressLine1", addressLine1);
        setValue("addressLine2", addressLine2);
        setValue("pincode", data.pincode || "");
      } catch (e) {
        // ignore if setValue isn't available in some contexts
      }
      setDisplay("form");
    }
  }, [show, data, reset]);

  // Handle location changes from SdtLocation component
  const handleLocationChange = ({
    action,
    data: location,
  }: {
    action: string;
    data: any;
  }) => {
    setLocationData(location);
  };

  // Handle pincode selection and auto-fill location data
  const handlePincodeSelect = (data: {
    value: number | null;
    status?: string;
    data?: any;
  }) => {
    if (data.status === "success" && data.data) {
      // Auto-fill location data from pincode
      setLocationData({
        state: data.data.state || "",
        district: data.data.district || "",
        city: data.data.town || "",
        town: data.data.town || "",
      });
    } else if (data.status === "error") {
      // Clear location data if pincode is invalid
      setLocationData({
        state: "",
        district: "",
        city: "",
        town: "",
      });
    }
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      // Prepare the complete address
      const fullAddress = [values.addressLine1, values.addressLine2]
        .filter(Boolean)
        .join(", ");

      // Prepare location data for submission (wrapped under profileRequest)
      const valuePayload: Record<string, any> = {
        addressLine1: values.addressLine1,
        pincode: values.pincode,
        state: locationData.state,
        district: locationData.district,
        city: locationData.city,
        town: locationData.town || locationData.city,
        latitude: data?.latitude,
        longitude: data?.longitude,
        geoLocation: {
          type: "Point",
          coordinates: [data?.longitude, data?.latitude],
        },
      };

      if (values.addressLine2 && values.addressLine2.trim()) {
        valuePayload.addressLine2 = values.addressLine2;
      }

      const payload = {
        profileRequest: {
          type: "ADDRESS_UPDATE",
          value: valuePayload,
        },
      };

      // Call FranchiseService.updateFranchise to update the store location
      const response = await FranchiseService.updateFranchise(payload);

      if (response.statusCode === 200 || response.statusCode === 201) {
        toast.show({
          msg: t("storeLocationUpdatedSuccessfully"),
          color: "success",
        });
        // show success block; parent will refresh once user acknowledges
        setDisplay("success");
      } else {
        throw new Error("Failed to update store location");
      }
    } catch (error) {
      console.error("Error updating store location:", error);
      toast.show({
        msg: t("errorUpdatingStoreLocation"),
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppModal show={show} callback={callback} className="tw:h-[90vh]">
      <AppModal.Title onClose={() => callback({ action: "close" })}>
        <div className="tw:font-semibold">{t("updateStoreLocation")}</div>
        <p className="tw:md:text-xs tw:text-xs tw:text-gray-600 tw:mt-1 tw:font-normal">
          {t("updateStoreLocationDescription")}
        </p>
      </AppModal.Title>
      <AppModal.Content className="tw:max-h-[80vh]">
        {display === "form" && (
          <form onSubmit={handleSubmit(onSubmit)} className="tw:p-0.5">
            {/* Approval note: sent for StoreKing approval */}
            <InfoBlock className="tw:mb-4" variant="info" size="sm" bordered>
              <span className="tw:font-semibold">Note:</span> This change will
              be sent for approval to StoreKing.
            </InfoBlock>
            {/* Address Information Section */}
            <div className="tw:mb-6">
              <h3 className="tw:text-sm tw:font-medium tw:text-gray-700 tw:mb-4 tw:flex tw:items-center tw:gap-2">
                <MapPin className="tw:w-4 tw:h-4" />
                {t("addressInformation")}
              </h3>
              <div className="tw:space-y-4">
                <AppInput
                  label={t("addressLine1")}
                  name="addressLine1"
                  type="text"
                  register={register}
                  error={errors.addressLine1?.message}
                  className="tw:mb-4"
                  isRequired
                  placeholder={t("enterAddressLine1")}
                />

                <AppInput
                  label={t("addressLine2")}
                  name="addressLine2"
                  type="text"
                  register={register}
                  error={errors.addressLine2?.message}
                  className="tw:mb-4"
                  placeholder={t("enterAddressLine2Optional")}
                />

                <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
                  <AppPincodeInput
                    label={t("pincode")}
                    name="pincode"
                    register={register}
                    error={errors.pincode?.message}
                    isRequired
                    placeholder={t("enter6DigitPincode")}
                    onPincodeSelect={handlePincodeSelect}
                  />
                  <SdtLocation
                    state={locationData.state}
                    district={locationData.district}
                    town={locationData.town}
                    callback={handleLocationChange}
                  />
                </div>
              </div>
            </div>
          </form>
        )}

        {display === "success" && (
          <div className="tw:py-16 tw:px-8 tw:text-center">
            <div className="tw:flex tw:justify-center tw:mb-8">
              <div className="tw:w-20 tw:h-20 tw:rounded-full tw:bg-green-100 tw:flex tw:items-center tw:justify-center tw:shadow-md">
                <CheckCircle2 className="tw:w-10 tw:h-10 tw:text-green-600" />
              </div>
            </div>

            <h2 className="tw:text-2xl tw:font-bold tw:text-gray-900 tw:mb-4">
              Sent for Approval
            </h2>

            <div className="tw:bg-blue-50 tw:border tw:border-blue-200 tw:rounded-lg tw:p-4 tw:mb-2">
              <p className="tw:text-sm tw:text-gray-700 tw:leading-relaxed tw:font-medium">
                Your store location update has been submitted and is awaiting
                StoreKing's review.
              </p>
            </div>

            <p className="tw:text-xs tw:text-gray-500 tw:leading-relaxed">
              Once approved, the changes will be automatically updated in your
              profile.
            </p>
          </div>
        )}
      </AppModal.Content>
      <AppModal.Footer>
        {display === "form" && (
          <div className="tw:flex tw:justify-end tw:gap-2">
            <AppButton
              type="button"
              color="light"
              fill="outline"
              onClick={() => callback({ action: "open_map" })}
              disabled={submitting}
            >
              {t("cancel")}
            </AppButton>
            <AppButton
              type="submit"
              color="dark"
              onClick={handleSubmit(onSubmit)}
              isLoading={submitting}
              disabled={submitting}
            >
              {t("update")}
            </AppButton>
          </div>
        )}

        {display === "success" && (
          <AppButton
            type="button"
            color="dark"
            onClick={() => callback({ action: "success" })}
          >
            Got it
          </AppButton>
        )}
      </AppModal.Footer>
    </AppModal>
  );
};

export default UpdateStoreLocationModal;
