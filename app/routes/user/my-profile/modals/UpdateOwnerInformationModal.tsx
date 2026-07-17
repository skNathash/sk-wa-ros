import { MapPin, User } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import { AppInput, AppPincodeInput } from "~/components/core/form";
import AppModal from "~/components/core/modal/AppModal";
import SdtLocation from "~/components/core/sdt/SdtLocation";
import useAppToast from "~/hooks/useAppToast";
import FranchiseService from "~/services/FranchiseService";

interface UpdateOwnerInformationModalProps {
  show: boolean;
  callback: (data: { action: string; data?: any }) => void;
  type?: "main" | "secondary";
  data?: {
    name: string;
    phone: string;
    email: string;
    alternateMobile?: string;
    addressLine1?: string;
    addressLine2?: string;
    pincode?: string;
    state?: string;
    district?: string;
    city?: string;
  };
}

interface FormValues {
  name: string;
  mobile?: string;
  alternateMobile?: string;
  email?: string;
  addressLine1: string;
  addressLine2: string;
  pincode: string;
}

// Validation function that validates each input individually
const validateFormData = (
  formData: FormValues,
  type?: "main" | "secondary",
  t?: any
): string | null => {
  // Validate name
  if (!formData.name || formData.name.trim().length < 2) {
    return t("pleaseProvideVendorName");
  }

  // Validate mobile based on type
  // Validate mobile based on type
  if (type === "secondary") {
    if (!formData.mobile || !/^[0-9]{10}$/.test(formData.mobile)) {
      return t("pleaseProvideValidContactMobileNumber");
    }
  }

  // Alternate mobile is optional for main owner, but if provided validate format
  if (
    formData.alternateMobile &&
    !/^[0-9]{10}$/.test(formData.alternateMobile)
  ) {
    return t("pleaseProvideValidContactMobileNumber");
  }

  // Validate email if provided
  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    return t("pleaseProvideValidContactEmail");
  }

  // Validate address line 1
  if (!formData.addressLine1 || formData.addressLine1.trim().length === 0) {
    return t("pleaseProvideStreetAddress");
  }

  // Validate pincode
  if (!formData.pincode || formData.pincode.trim().length === 0) {
    return t("pleaseProvidePincode");
  }

  return null; // No validation errors
};

const UpdateOwnerInformationModal: React.FC<
  UpdateOwnerInformationModalProps
> = ({ show, callback, type, data }) => {
  const { t } = useTranslation(["common"]);
  const { register, handleSubmit, reset, getValues } = useForm();

  const [submitting, setSubmitting] = useState(false);
  const toast = useAppToast();

  // State for location data
  const [locationData, setLocationData] = useState({
    state: "",
    district: "",
    town: "",
  });

  useEffect(() => {
    if (show && data) {
      reset({
        name: data.name || "",
        mobile: data.phone || "",
        alternateMobile: data.alternateMobile || "",
        email: data.email || "",
        addressLine1: data.addressLine1 || "",
        addressLine2: data.addressLine2 || "",
        pincode: data.pincode || "",
      });

      // Set location data if available
      setLocationData({
        state: data.state || "",
        district: data.district || "",
        town: data.city || "",
      });
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
        town: data.data.town || "",
      });
    } else if (data.status === "error") {
      // Clear location data if pincode is invalid
      setLocationData({
        state: "",
        district: "",
        town: "",
      });
    }
  };

  const onSubmit = async (values: any) => {
    // Validate form data before submission
    const validationError = validateFormData(values, type, t);
    if (validationError) {
      toast.show({
        msg: validationError,
        color: "danger",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        [type === "main" ? "ownerDetails" : "secondaryOwnerDetails"]: {
          name: values.name,
          alternateMobile:
            type === "main"
              ? values.alternateMobile || ""
              : values.mobile || "",
          email: values.email || "",
          addressLine1: values.addressLine1,
          addressLine2: values.addressLine2,
          city: locationData.town,
          district: locationData.district,
          state: locationData.state,
          pincode: values.pincode,
        },
      };

      const response = await FranchiseService.updateFranchise(payload);

      if (response && response.statusCode === 200) {
        toast.show({
          msg: t("ownerInformationUpdatedSuccessfully"),
          color: "success",
        });
        callback({ action: "submit", data: values });
      } else {
        toast.show({
          msg: response?.data?.message || t("failedToUpdateOwnerInformation"),
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error updating owner information:", error);
      toast.show({
        msg: t("failedToUpdateOwnerInformationTryAgain"),
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppModal show={show} callback={callback} className="tw:h-[90vh]">
      <AppModal.Title onClose={() => callback({ action: "close" })}>
        <div className="tw:font-semibold">
          {type === "main"
            ? t("updateMainOwnerInformation")
            : type === "secondary"
            ? t("updateSecondaryOwnerInformation")
            : t("updateOwnerInformation")}
        </div>
        <p className="tw:md:text-xs tw:text-xs tw:text-gray-600 tw:mt-1 tw:font-normal">
          {type === "main"
            ? t("updateMainOwnerDescription")
            : type === "secondary"
            ? t("updateSecondaryOwnerDescription")
            : t("updateOwnerDescription")}
        </p>
      </AppModal.Title>
      <AppModal.Content className="tw:max-h-[80vh]">
        <form onSubmit={handleSubmit(onSubmit)} className="tw:p-0.5">
          {/* Personal Information Section */}
          <div className="tw:mb-6">
            <h3 className="tw:text-sm tw:font-medium tw:text-gray-700 tw:mb-4 tw:flex tw:items-center tw:gap-2">
              <User className="tw:w-4 tw:h-4" />
              {t("personalInformation")}
            </h3>
            <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
              <AppInput
                label={t("name")}
                name="name"
                type="text"
                register={register}
                className="tw:mb-0 tw:col-span-2"
                isRequired
                placeholder={t("enterOwnerName")}
              />

              {/* {type === "main" ? (
                <AppInput
                  label={t("alternateMobileNumber")}
                  name="alternateMobile"
                  type="tel"
                  register={register}
                  className="tw:mb-0"
                  placeholder={t("enterMobileNumber")}
                  maxLength={10}
                />
              ) : (
                <AppInput
                  label={t("mobileNumber")}
                  name="mobile"
                  type="tel"
                  register={register}
                  className="tw:mb-0"
                  isRequired
                  placeholder={t("enterMobileNumber")}
                  maxLength={10}
                />
              )} */}
            </div>

            <div className="tw:mt-4">
              <AppInput
                label={t("email")}
                name="email"
                type="email"
                register={register}
                className="tw:mb-0"
                placeholder={t("enterEmailAddress")}
              />
            </div>
          </div>

          {/* Address Information Section */}
          <div className="tw:mb-6">
            <h3 className="tw:text-sm tw:font-medium tw:text-gray-700 tw:mb-4 tw:flex tw:items-center tw:gap-2">
              <MapPin className="tw:w-4 tw:h-4" />
              {t("residenceAddress")}
            </h3>
            <div className="tw:space-y-4">
              <AppInput
                label={t("addressLine1")}
                name="addressLine1"
                type="text"
                register={register}
                className="tw:mb-4"
                isRequired
                placeholder={t("enterAddressLine1")}
              />

              <AppInput
                label={t("addressLine2")}
                name="addressLine2"
                type="text"
                register={register}
                className="tw:mb-4"
                placeholder={t("enterAddressLine2Optional")}
              />

              <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
                <AppPincodeInput
                  label={t("pincode")}
                  name="pincode"
                  register={register}
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
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton
            type="button"
            color="light"
            fill="outline"
            onClick={() => callback({ action: "close" })}
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
      </AppModal.Footer>
    </AppModal>
  );
};

export default UpdateOwnerInformationModal;
