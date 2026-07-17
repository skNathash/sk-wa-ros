import { AppPincodeInput } from "~/components/core/form";
import AppTextarea from "~/components/core/form/AppTextarea";
import InpBlock from "./InpBlock";
import AppButton from "~/components/core/button/AppButton";
import SdtLocation from "~/components/core/sdt/SdtLocation";
import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFormContext, useWatch } from "react-hook-form";

type StoreLocationAndTimingsProps = {
  onOpenLocationModal?: () => void;
};

const StoreLocationAndTimings = ({
  onOpenLocationModal,
}: StoreLocationAndTimingsProps) => {
  const { control, setValue, register } = useFormContext();
  const { t } = useTranslation(["signup"]);

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

  const blockTitle = t("register.store.storeLocation.title", {
    defaultValue: "Store Location",
  });

  return (
    <InpBlock
      className="tw:h-full"
      title={blockTitle}
      icon={<MapPin size={20} />}
    >
      <div className="tw:flex tw:flex-col tw:gap-2">

        <div className="tw:mb-2">
          <div className="tw:flex tw:flex-col tw:sm:flex-row tw:items-center tw:justify-between tw:gap-4">
            <div className="tw:flex-1 tw:w-full">
              <AppPincodeInput
                name="pincode"
                label={t("register.store.pincode.label")}
                placeholder={t("register.store.pincode.placeholder")}
                register={register}
                onPincodeSelect={handlePincodeSelect}
                showMultipleResult={false}
                isRequired={true}
              />
            </div>
            <div className="tw:flex tw:w-full tw:sm:w-auto tw:justify-end">
              <AppButton
                expand="block"
                noShadow={true}
                className="tw:h-10 tw:sm:mt-6 tw:w-full"
                onClick={onOpenLocationModal}
              >
                <MapPin className="tw:mr-2" size={16} />
                {t("register.store.useLocation")}
              </AppButton>
            </div>
          </div>
        </div>
        <AppTextarea
          name="address1"
          register={register}
          label={t("register.store.address.label")}
          placeholder={t("register.store.address.placeholder")}
          isRequired={true}
          rows={2}
        />
      </div>
      <div className="tw:flex tw:flex-col tw:gap-6">
        {/* State / District / Town */}
        <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:mb-4 tw:md:grid-cols-2 tw:[&>*:first-child]:col-span-1 tw:md:[&>*:first-child]:col-span-2">
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
      </div>
    </InpBlock>
  );
};

export default StoreLocationAndTimings;

