import { useFormContext, Controller, useWatch } from "react-hook-form";
import AppCard from "~/components/core/card/AppCard";
import { AppInput, AppSelect } from "~/components/core/form";
import { useTranslation } from "react-i18next";

const getVehicleTypeOptions = (t: any) => [
  { label: t("bike"), value: "Bike" },
  { label: t("scooter"), value: "Scooter" },
  { label: t("car"), value: "Car" },
  { label: t("van"), value: "Van" },
  { label: t("truck"), value: "Truck" },
  { label: t("autoRickshaw"), value: "Auto Rickshaw" },
];

const VehicleInfo = () => {
  const { t } = useTranslation(["common"]);
  const { control, register } = useFormContext();

  // Watch the position field to conditionally show this component
  const position = useWatch({
    control,
    name: "position",
  });

  // Only show vehicle info for Delivery Agent position
  if (position !== "Delivery Agent") {
    return null;
  }

  return (
    <AppCard title={t("vehicleInformation")} icon="truck">
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
        <AppInput
          name="vehicleDetails.vehicleNo"
          label={t("vehicleNumber")}
          placeholder={t("enterVehicleNumber")}
          register={register}
          size="sm"
          isRequired
        />

        <Controller
          control={control}
          name="vehicleDetails.type"
          render={({ field }) => (
            <AppSelect
              label={t("vehicleType")}
              value={field.value || ""}
              onChange={field.onChange}
              placeholder={t("selectVehicleType")}
              options={getVehicleTypeOptions(t)}
              size="sm"
              inputClassName="tw:w-full"
              isRequired
            />
          )}
        />

        <AppInput
          name="vehicleDetails.capacity"
          label={t("capacity")}
          placeholder={t("enterCapacityInKg")}
          register={control.register}
          size="sm"
          isRequired
        />
      </div>
    </AppCard>
  );
};

export default VehicleInfo;
