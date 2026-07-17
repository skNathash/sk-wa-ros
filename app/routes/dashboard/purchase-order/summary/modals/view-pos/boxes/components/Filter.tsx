import { debounce } from "lodash";
import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { AppInput } from "~/components/core/form";

const Filter = ({
  callback,
}: {
  callback: ({ formData }: { formData: Record<string, any> }) => void;
}) => {
  const { register, getValues } = useFormContext();

  const handleSearchChange = useCallback(
    debounce(() => {
      callback({ formData: getValues() });
    }, 500),
    [callback, getValues]
  );

  return (
    <div>
      <AppInput
        name="search"
        placeholder="Search by Box No or Vendor Order ID"
        register={register}
        onChange={handleSearchChange}
        size="sm"
      />
    </div>
  );
};

export default Filter;
