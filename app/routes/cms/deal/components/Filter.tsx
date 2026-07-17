import { debounce } from "lodash";
import { useCallback } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { AppInput } from "~/components/core/form/AppInput";
import { AppSelect } from "~/components/core/form/AppSelect";

const typeOptions = [
  { label: "All", value: "All" },
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
];

interface Props {
  callback: (a: { formData: any }) => void;
}

const Filter = ({ callback }: Props) => {
  const { register, getValues, control, setValue } = useForm({
    defaultValues: {
      search: "",
      type: "All",
    },
  });

  const [type] = useWatch({ control, name: ["type"] });

  const handleInput = debounce(() => {
    setValue("type", "All");
    triggerCallback();
  }, 500);

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const handleTypeChange =
    (chngFrn: (value: string) => void) => (value: string) => {
      chngFrn(value);
      triggerCallback();
    };

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:mb-4">
      <AppInput
        name="search"
        placeholder="Search"
        register={register}
        onChange={handleInput}
        size="sm"
        className="tw:w-full"
      />
      <Controller
        control={control}
        name="type"
        render={({ field }) => (
          <AppSelect
            options={typeOptions}
            value={field.value}
            onChange={field.onChange}
            size="sm"
            placeholder="Type"
            className="tw:w-full"
          />
        )}
      />
    </div>
  );
};

export default Filter;
