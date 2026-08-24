import React from "react";
import { Search } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { AppInput, AppSelect } from "~/components/core/form";

interface FilterCallbackArgs {
  data: Record<string, any>;
  action?: string;
}

interface FilterProps {
  callback: (args: FilterCallbackArgs) => void;
}

const statusOptions = [
  { value: "all", label: "All" },
  { value: "active", label: "Enabled" },
  { value: "inactive", label: "Disabled" },
];

const Filter: React.FC<FilterProps> = ({ callback }) => {
  const { register, getValues, control } = useForm({
    defaultValues: { search: "", status: "all" },
  });

  const debounced = useDebouncedCallback(() => {
    const data = { ...getValues() };
    callback({ data, action: "search" });
  }, 500);

  const handleSearchChange = () => {
    debounced();
  };

  const handleStatusChange = () => {
    const data = { ...getValues() };
    callback({ data, action: "status" });
  };

  return (
    <div className="tw:flex tw:gap-2 tw:items-center tw:mb-3 tw:w-full tw:bg-white tw:p-4 tw:md:bg-transparent tw:md:p-0 app-bleed-x tw:-mt-4 tw:md:mt-0">
      <div className="tw:w-full">
        <AppInput
          name="search"
          label={undefined}
          placeholder="Search by route name"
          register={register}
          onChange={handleSearchChange}
          className="tw:w-full"
          inputClassName="tw:w-full"
          size="sm"
          leftIcon={<Search className="tw:w-4 tw:h-4 tw:text-gray-400" />}
        />
      </div>

      <div>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <AppSelect
              options={statusOptions}
              placeholder="Status"
              onChange={(val) => {
                field.onChange(val);
                handleStatusChange();
              }}
              value={field.value}
              size="sm"
            />
          )}
        />
      </div>
    </div>
  );
};

export default Filter;
