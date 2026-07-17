import { orderBy } from "lodash";
import { MapPin, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import { AppInput, AppPincodeInput, AppSelect } from "~/components/core/form";
import SdtLocation from "~/components/core/sdt/SdtLocation";
import FranchiseService from "~/services/FranchiseService";

type Props = {
  onOpenLocationModal?: () => void;
};

interface BusinessTypeOption {
  value: string;
  label: string;
}

const StoreInfo = ({ onOpenLocationModal }: Props) => {
  const { t } = useTranslation(["common"]);
  const { register, control, setValue, getValues } = useFormContext();
  const [loadingBusinessTypes, setLoadingBusinessTypes] = useState(false);
  const [businessTypeOptions, setBusinessTypeOptions] = useState<
    BusinessTypeOption[]
  >([]);

  // Load business type data from API
  useEffect(() => {
    const loadBusinessTypes = async () => {
      setLoadingBusinessTypes(true);
      try {
        const response = await FranchiseService.getDocs("businessType");
        if (response && response.statusCode === 200 && response.data) {
          const options = orderBy(response.data, "name", "asc").map(
            (item: any) => ({
              value: item.name,
              label: item.name,
              // include langKey so components can translate if a key is added for this business type
              langKey: item.name,
            })
          );
          setBusinessTypeOptions(options);
        } else {
          console.error("Failed to load business types:", response);
        }
      } catch (error) {
        console.error("Error loading business types:", error);
      } finally {
        setLoadingBusinessTypes(false);
      }
    };

    loadBusinessTypes();
  }, []);

  const [address, address1] = useWatch({
    control: control,
    name: ["address", "address1"],
  });

  const [watchedState, watchedDistrict, watchedTown] = useWatch({
    control,
    name: ["state", "district", "town"],
  });

  const handlePincodeSelect = (data: {
    value: number | null;
    status?: string;
    data?: any;
  }) => {
    if (data.status === "success" && data.data) {
      // Update form values with selected pincode data
      setValue("pincode", data.value?.toString() || "");

      // Update local state for display
      setValue("pincodeData", {
        city: data.data.town || "",
        state: data.data.state || "",
        district: data.data.district || "",
      });

      // Set SDT form fields
      setValue("state", data.data.state || "");
      setValue("district", data.data.district || "");
      setValue("town", data.data.town || "");
    } else if (data.status === "error") {
      // Handle error case - show toast or handle validation
      console.error("Invalid pincode or no data found");
      setValue("pincodeData", { city: "", state: "", district: "" });
      setValue("state", "");
      setValue("district", "");
      setValue("town", "");
    } else {
      // Handle partial input (less than 6 digits)
      setValue("pincode", data.value?.toString() || "");
      if (!data.value || data.value.toString().length < 6) {
        setValue("pincodeData", { city: "", state: "", district: "" });
        setValue("state", "");
        setValue("district", "");
        setValue("town", "");
      }
    }
  };

  const handleStoreNameChange = () => {
    const value = getValues("storeName");
    setValue("storeName", value.replace(/[^A-z\.\s]/g, ""));
  };

  return (
    <AppCard
      title={t("storeInformation")}
      subtitle={t("provideStoreInformation")}
      icon={<Store />}
    >
      {/* Store Name and Mobile Number - Grid Layout */}
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
        <AppInput
          name="storeName"
          register={register}
          label={t("storeName")}
          placeholder={t("enterStoreName")}
          isRequired={true}
          onChange={handleStoreNameChange}
        />

        <AppInput
          name="mobileNumber"
          register={register}
          label={t("mobileNumber")}
          placeholder={t("enterMobile")}
          isRequired={true}
          type="tel"
        />

        <AppInput
          name="doorNo"
          register={register}
          label={t("doorNo")}
          placeholder={t("enterDoorNumber")}
          isRequired={true}
        />

        <AppInput
          name="address1"
          register={register}
          label={t("addressLine1")}
          placeholder={t("enterAddressLine1")}
          isRequired={true}
        />

        <Controller
          name="primaryBusiness"
          control={control}
          render={({ field }) => (
            <AppSelect
              label={t("primaryBusiness")}
              options={businessTypeOptions}
              placeholder={
                loadingBusinessTypes ? t("loading") : t("selectPrimaryBusiness")
              }
              onChange={field.onChange}
              value={field.value}
              isRequired={true}
              inputClassName="tw:w-full"
            />
          )}
        />

        <Controller
          name="secondaryBusiness"
          control={control}
          render={({ field }) => (
            <AppSelect
              label={t("secondaryBusiness")}
              options={businessTypeOptions}
              placeholder={
                loadingBusinessTypes
                  ? t("loading")
                  : t("selectSecondaryBusiness")
              }
              onChange={field.onChange}
              value={field.value}
              inputClassName="tw:w-full"
            />
          )}
        />

        {/* GST Number - Full Width */}
        <AppInput
          name="gstNumber"
          register={register}
          label={t("gstNumber") + " (Optional)"}
          placeholder={t("enterGstNumber")}
        />

        {/* Store Size - Full Width */}
        <AppInput
          name="storeSize"
          register={register}
          label={t("storeSize") + " (sq ft)"}
          placeholder={t("enterStoreSize")}
          type="number"
        />

        <AppPincodeInput
          name="pincode"
          label={t("pincode")}
          placeholder={t("enter6DigitPincode")}
          register={register}
          onPincodeSelect={handlePincodeSelect}
          showMultipleResult={false}
          isRequired={true}
        />

        <SdtLocation
          state={watchedState}
          district={watchedDistrict}
          town={watchedTown}
          callback={({ data }) => {
            setValue("state", data.state || "");
            setValue("district", data.district || "");
            setValue("town", data.town || "");
            setValue("pincodeData", {
              city: data.town || "",
              state: data.state || "",
              district: data.district || "",
            });
          }}
        />
      </div>

      <div className="tw:flex tw:items-center tw:mt-4 tw:text-app-gray-7">
        <MapPin className="tw:mr-2 tw:text-lg tw:text-app-primary" size={18} />
        <div>
          <div className="tw:font-semibold">{t("storeLocation")}</div>
          <div className="tw:text-xs">
            {address1 || address || t("selectLocationUsingMap")}
          </div>
        </div>
      </div>
    </AppCard>
  );
};

export default StoreInfo;
