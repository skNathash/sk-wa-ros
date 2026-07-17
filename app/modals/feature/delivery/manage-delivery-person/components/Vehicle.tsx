import React from "react";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { AppInput } from "~/components/core/form/AppInput";
import { AppCheckbox } from "~/components/core/form/AppCheckbox";
import AppSelect from "~/components/core/form/AppSelect";

const Vehicle: React.FC = () => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext();

  // Watch the hasOwnVehicle field to conditionally show vehicle details
  const hasOwnVehicle = useWatch({
    control,
    name: "hasOwnVehicle",
  });

  const vehicleTypeOptions = [
    { value: "bike", label: "Bike" },
    { value: "scooter", label: "Scooter" },
    { value: "car", label: "Car" },
    { value: "van", label: "Van" },
    { value: "truck", label: "Truck" },
  ];

  const capacityOptions = [
    { value: "light", label: "Light (Up to 10kg)" },
    { value: "medium", label: "Medium (10-50kg)" },
    { value: "heavy", label: "Heavy (50kg+)" },
  ];

  return (
    <div className="tw:space-y-4">
      {/* Has Own Vehicle Checkbox */}
      <div className="tw:flex tw:items-center tw:gap-2">
        <AppCheckbox name="hasOwnVehicle" register={register} label="" />
        <label htmlFor="hasOwnVehicle" className="tw:ml-2 tw:text-sm">
          Has their own vehicle
        </label>
      </div>

      {/* Conditional Vehicle Details */}
      {hasOwnVehicle && (
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:mt-4">
          {/* Vehicle Number */}
          <AppInput
            name="vehicleNo"
            label="Vehicle Number"
            type="text"
            placeholder="Enter vehicle number"
            register={register}
            rules={{
              required: hasOwnVehicle ? "Vehicle number is required" : false,
            }}
            error={errors.vehicleNo?.message as string}
            isRequired={hasOwnVehicle}
          />

          {/* Vehicle Type */}
          <Controller
            name="vehicleType"
            control={control}
            rules={{
              required: hasOwnVehicle ? "Vehicle type is required" : false,
            }}
            render={({ field }) => (
              <AppSelect
                label="Vehicle Type"
                options={vehicleTypeOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.vehicleType?.message as string}
                isRequired={hasOwnVehicle}
                placeholder="Select vehicle type"
              />
            )}
          />

          {/* Capacity */}
          <Controller
            name="capacity"
            control={control}
            rules={{
              required: hasOwnVehicle ? "Capacity is required" : false,
            }}
            render={({ field }) => (
              <AppSelect
                label="Capacity"
                options={capacityOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.capacity?.message as string}
                isRequired={hasOwnVehicle}
                placeholder="Select capacity"
              />
            )}
          />
        </div>
      )}
    </div>
  );
};

export default Vehicle;
