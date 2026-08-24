import { Search } from "lucide-react";
import React, { useMemo } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { AppInput, AppSelect } from "~/components/core/form";
import OmsService from "~/services/OmsService";

interface FilterCallbackArgs {
  data: Record<string, any>;
  action?: string;
}

const statusOptions = OmsService.getOrderStatuses() || [];
const opts = statusOptions.map((st: any) => ({
  value: st.value,
  label: st.name,
}));
opts.unshift({ value: "All", label: "All" });

interface FilterProps {
  callback: (args: FilterCallbackArgs) => void;
}

const Filter: React.FC<FilterProps> = ({ callback }) => {
  const { register, getValues, setValue } = useFormContext();

  const debounced = useDebouncedCallback((value: string) => {
    const data = { ...getValues(), search: value };
    callback({ data, action: "search" });
  }, 500);

  const handleSearchChange = () => {
    debounced(getValues("search"));
  };

  const handleStatusChange = () => {
    const data = { ...getValues() };
    callback({ data, action: "status" });
  };

  return (
    // One row at every width: the search box takes whatever is left, the
    // status select shrinks to its own content instead of a fixed 12rem —
    // which on a phone left the search too narrow to read its placeholder.
    <div className="tw:mb-3 tw:flex tw:items-center tw:gap-2">
      <div className="tw:min-w-0 tw:flex-1">
        <AppInput
          name="search"
          label={undefined}
          placeholder="Search by Order ID, Customer Name"
          register={register}
          onChange={handleSearchChange}
          inputClassName="tw:w-full"
          size="sm"
          leftIcon={<Search className="tw:w-4 tw:h-4 tw:text-gray-400" />}
        />
      </div>

      <div className="tw:w-auto tw:shrink-0">
        <Controller
          name="status"
          render={({ field }) => (
            <AppSelect
              options={opts}
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
