import debounce from "lodash/debounce";
import { Controller, useFormContext } from "react-hook-form";
import { useCallback } from "react";
import { Search } from "lucide-react";
import { AppInput, AppSelect } from "~/components/core/form";

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "Pending", label: "Pending" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
  { value: "Completed", label: "Completed" },
];

type Props = {
  callback: (payload: { formData: any }) => void;
};

const Filter = ({ callback }: Props) => {
  const { register, getValues, setValue, control } = useFormContext();

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const handleSearchChange = useCallback(
    debounce(() => {
      triggerCallback();
    }, 500),
    [triggerCallback],
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      setValue("status", value);
      triggerCallback();
    },
    [setValue, triggerCallback],
  );

  return (
    <div className="tw:flex tw:flex-col tw:md:flex-row tw:gap-2 tw:mb-4">
      <div className="tw:flex-1">
        <AppInput
          name="search"
          register={register}
          onChange={handleSearchChange}
          size="sm"
          placeholder="Search by remarks or request id"
          className="tw:bg-white"
          leftIcon={<Search size={16} className="tw:text-gray-400" />}
        />
      </div>
      <div className="tw:grid tw:grid-cols-1 tw:md:flex tw:gap-2">
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <AppSelect
              options={statusOptions}
              value={field.value || "all"}
              onChange={handleStatusChange}
              placeholder="All Status"
              size="sm"
              inputClassName="tw:w-full"
            />
          )}
        />
      </div>
    </div>
  );
};

export default Filter;
