import { debounce } from "lodash";
import { useCallback } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import Alpha from "~/components/core/alpha/Alpha";
import { AppInput, AppSelect } from "~/components/core/form";

type Props = {
  callback: (a: { formData: any }) => void;
};

const statusOptions = [
  { label: "All", value: "All" },
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
  { label: "Suspended", value: "Suspended" },
];

const vehicleOptions = [
  { label: "All", value: "All" },
  { label: "Bike", value: "Bike" },
  { label: "Car", value: "Car" },
  { label: "Scooter", value: "Scooter" },
];

const Filter = ({ callback }: Props) => {
  const { register, getValues, control, setValue } = useForm({
    defaultValues: {
      search: "",
      status: "",
      vehicle: "",
      alpha: "",
    },
  });

  const [alpha] = useWatch({ control, name: ["alpha"] });

  const handleInput = debounce(() => {
    setValue("alpha", "");
    triggerCallback();
  }, 500);

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const handleStatusChange =
    (chngFrn: (value: string) => void) => (value: string) => {
      chngFrn(value);
      triggerCallback();
    };

  const handleVehicleChange =
    (chngFrn: (value: string) => void) => (value: string) => {
      chngFrn(value);
      triggerCallback();
    };

  const handleAlphaChange = (value: string) => {
    setValue("alpha", value);
    setValue("search", "");
    setValue("status", "");
    setValue("vehicle", "");
    triggerCallback();
  };

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4 tw:mb-4">
        <AppInput
          name="search"
          register={register}
          onChange={handleInput}
          size="sm"
          placeholder="Search by name"
        />
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <AppSelect
              options={statusOptions}
              value={field.value}
              onChange={handleStatusChange(field.onChange)}
              size="sm"
              placeholder="Select status"
              inputClassName="tw:w-full"
            />
          )}
        />
        <Controller
          control={control}
          name="vehicle"
          render={({ field }) => (
            <AppSelect
              options={vehicleOptions}
              value={field.value}
              onChange={handleVehicleChange(field.onChange)}
              size="sm"
              placeholder="Select vehicle"
              inputClassName="tw:w-full"
            />
          )}
        />
      </div>
      <Alpha
        callback={handleAlphaChange}
        selected={alpha}
        className="tw:my-4"
      />
    </>
  );
};

export default Filter;
