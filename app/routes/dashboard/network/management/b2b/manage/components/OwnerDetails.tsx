import { MapPin, User } from "lucide-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import { AppInput, AppPincodeInput } from "~/components/core/form";
import SdtLocation from "~/components/core/sdt/SdtLocation";

const OwnerDetails = () => {
  const { t } = useTranslation(["common"]);
  const { register } = useFormContext();

  // State for location data
  const [locationData, setLocationData] = useState({
    state: "",
    district: "",
    town: "",
  });

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

  return (
    <AppCard
      title={t("ownerInformation")}
      subtitle={t("provideOwnerContactDetails")}
      icon={<User />}
    >
      <div className="tw:space-y-6">
        {/* Personal Information Section */}
        <div className="tw:mb-6">
          <h3 className="tw:text-sm tw:font-medium tw:text-gray-700 tw:mb-4 tw:flex tw:items-center tw:gap-2">
            <User className="tw:w-4 tw:h-4" />
            {t("personalInformation")}
          </h3>
          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
            <AppInput
              name="ownerName"
              register={register}
              label={t("ownerName")}
              placeholder={t("enterOwnerName")}
              isRequired={true}
            />

            <AppInput
              name="email"
              register={register}
              label={t("emailAddress")}
              placeholder={t("enterEmailAddress")}
              type="email"
            />

            <AppInput
              name="alternateMobile"
              register={register}
              label={t("alternateMobileNumber") + " (Optional)"}
              placeholder={t("enterAlternateMobileNumber")}
              type="tel"
              maxLength={10}
            />
          </div>
        </div>

        {/* Address Information Section */}
        <div className="tw:mb-6">
          <h3 className="tw:text-sm tw:font-medium tw:text-gray-700 tw:mb-4 tw:flex tw:items-center tw:gap-2">
            <MapPin className="tw:w-4 tw:h-4" />
            {t("addressInformation")}
          </h3>
          <div className="tw:space-y-4">
            <AppInput
              name="ownerAddressLine1"
              register={register}
              label={t("addressLine1")}
              placeholder={t("enterAddressLine1")}
              isRequired={true}
            />

            <AppInput
              name="ownerAddressLine2"
              register={register}
              label={t("addressLine2") + " (Optional)"}
              placeholder={t("enterAddressLine2Optional")}
            />

            <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
              <AppPincodeInput
                name="ownerPincode"
                label="Pincode"
                register={register}
                isRequired={true}
                placeholder="Enter 6-digit pincode"
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
      </div>
    </AppCard>
  );
};

export default OwnerDetails;
