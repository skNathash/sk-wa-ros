import { useFormContext, useWatch } from "react-hook-form";
import AppCard from "~/components/core/card/AppCard";
import { AppPincodeInput, AppInput } from "~/components/core/form";
import AppTextarea from "~/components/core/form/AppTextarea";
import SdtLocation from "~/components/core/sdt/SdtLocation";
import { useTranslation } from "react-i18next";

const AddressInfo = () => {
  const { t } = useTranslation(["common"]);
  const { register, control, setValue } = useFormContext();
  const [watchedState, watchedDistrict, watchedTown] = useWatch({
    control,
    name: ["state", "district", "town"],
  });

  const onPincodeChange = (data: {
    value: number | null;
    status?: string;
    data?: any;
  }) => {
    if (data.status === "success") {
      setValue("state", data.data.state);
      setValue("town", data.data.town);
      setValue("district", data.data.district);
      setValue("city", data.data.town); // Set city same as town
    } else {
      setValue("state", "");
      setValue("town", "");
      setValue("district", "");
      setValue("city", "");
    }
  };

  return (
    <AppCard title={t("addressInformation")} icon="map-pin">
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:lg:grid-cols-3 tw:gap-4 tw:mb-4">
        <AppInput
          label={t("doorNo")}
          register={register}
          name="doorNo"
          placeholder={t("enterDoorNumber")}
          size="sm"
        />
        <AppInput
          label={t("street")}
          register={register}
          name="street"
          placeholder={t("enterStreetName")}
          size="sm"
        />
      </div>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:lg:grid-cols-3 tw:gap-4 tw:mb-4">
        <div>
          <AppPincodeInput
            label={t("pincode")}
            register={register}
            name="pincode"
            isRequired
            placeholder={t("enterPincode")}
            onPincodeSelect={onPincodeChange}
            size="sm"
          />
          {watchedState && watchedTown && watchedDistrict && (
            <div className="tw:text-xs tw:text-gray-500">
              {watchedDistrict} / {watchedTown} / {watchedState}
            </div>
          )}
        </div>

        <AppInput
          label={t("landmark")}
          register={register}
          name="landmark"
          placeholder={t("enterLandmark")}
          size="sm"
        />
        {/* State, District, Town Selection */}

        <SdtLocation
          state={watchedState}
          district={watchedDistrict}
          town={watchedTown}
          isStateRequired={false}
          isDistrictRequired={false}
          isTownRequired={false}
          callback={({ data }) => {
            setValue("state", data.state || "");
            setValue("district", data.district || "");
            setValue("town", data.town || "");
            setValue("city", data.town || ""); // Set city same as town
          }}
        />

        <AppInput
          label={t("city")}
          register={register}
          name="city"
          placeholder={t("enterCity")}
          size="sm"
        />
      </div>
    </AppCard>
  );
};

export default AddressInfo;
