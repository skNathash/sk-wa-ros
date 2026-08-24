import clsx from "clsx";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import AppCard from "~/components/core/card/AppCard";
import { AppInput } from "~/components/core/form/AppInput";
import InpLabel from "~/components/core/form/InpLabel";
import { VEHICLE_DETAIL_FIELDS, VEHICLE_TYPE_OPTIONS } from "../helper";

/** Step two — what the runner rides. */
const VehicleInfo = () => {
  const { control, register, setValue } = useFormContext();
  const vehicleType = useWatch({ control, name: "vehicleType" });

  // Only the detail inputs that apply to the chosen type are shown.
  const fields = VEHICLE_DETAIL_FIELDS[vehicleType] || [];
  const showVehicleNo = fields.includes("vehicleNo");
  const showCapacity = fields.includes("capacity");
  const showLicence = fields.includes("licenceNo");

  /** When the type changes, clear detail fields that no longer apply so stale
      values (e.g. a truck plate left on a walker) don't ride into the payload. */
  const handleTypeChange = (type: string) => {
    const nextFields = VEHICLE_DETAIL_FIELDS[type] || [];
    (["vehicleNo", "capacity", "licenceNo"] as const).forEach((name) => {
      if (!nextFields.includes(name)) setValue(name, "");
    });
  };

  return (
    <>
      <AppCard title="Vehicle" icon="bike">
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
          <div className="tw:md:col-span-2">
            <InpLabel isRequired>Vehicle type</InpLabel>

            <Controller
              control={control}
              name="vehicleType"
              render={({ field }) => (
                <div className="tw:grid tw:grid-cols-3 tw:md:grid-cols-6 tw:gap-2">
                  {VEHICLE_TYPE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const selected = field.value === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          handleTypeChange(option.value);
                          field.onChange(option.value);
                        }}
                        className={clsx(
                          "tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-1.5 tw:rounded-lg tw:border tw:py-3 tw:cursor-pointer tw:transition-colors",
                          selected
                            ? "tw:border-emerald-600 tw:bg-emerald-50 tw:text-emerald-700"
                            : "tw:border-gray-200 tw:bg-white tw:text-gray-600 tw:hover:border-gray-300",
                        )}
                      >
                        <Icon size={22} />
                        <span className="tw:text-xs tw:font-medium">
                          {option.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </div>

          {showVehicleNo && (
            <AppInput
              label="Vehicle number"
              name="vehicleNo"
              register={register}
              placeholder="eg: KA01 HK 4821"
              isRequired
              size="sm"
              maxLength={15}
            />
          )}

          {showCapacity && (
            <AppInput
              label="Capacity"
              name="capacity"
              register={register}
              placeholder="eg: 6 bags"
              isRequired
              size="sm"
            />
          )}

          {showLicence && (
            <AppInput
              label="Licence number"
              name="licenceNo"
              register={register}
              placeholder="eg: KA0120110012345"
              isRequired
              size="sm"
              maxLength={15}
            />
          )}
        </div>
      </AppCard>
    </>
  );
};

export default VehicleInfo;
