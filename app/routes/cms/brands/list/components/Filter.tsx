import { debounce } from "lodash";
import { useCallback } from "react";
import { useForm, useFormContext, useWatch } from "react-hook-form";
import Alpha from "~/components/core/alpha/Alpha";

import { AppInput } from "~/components/core/form/AppInput";

interface Props {
  callback: (a: { formData: any }) => void;
}

const Filter = ({ callback }: Props) => {
  const { register, getValues, control, setValue } = useForm();

  const [alpha] = useWatch({
    control,
    name: ["alpha"],
  });

  const handleSearch = debounce(() => {
    triggerCallback();
  }, 500);

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const handleAlphaChange = (value: string) => {
    setValue("alpha", value);
    triggerCallback();
  };

  return (
    <div className="tw:mb-4">
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:mb-4">
        <AppInput
          name="search"
          placeholder="Search"
          register={register}
          onChange={handleSearch}
          size="sm"
          className="tw:w-full"
        />
      </div>
      <Alpha
        selected={alpha || ""}
        callback={handleAlphaChange}
        className="tw:w-full"
      />
    </div>
  );
};

export default Filter;
