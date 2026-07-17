import { debounce } from "lodash";
import { Search } from "lucide-react";
import React, { useEffect, useMemo } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { AppInput } from "~/components/core/form/AppInput";
import AppSelect from "~/components/core/form/AppSelect";
import OmsService from "~/services/OmsService";

interface FilterProps {
  callback: (params: { data: string; action: string }) => void;
}

const statusOptions = OmsService.getOrderStatuses().map((status) => ({
  value: status.value,
  label: status.name,
}));
statusOptions.unshift({ value: "All", label: "All Statuses" });

const Filter: React.FC<FilterProps> = ({ callback }) => {
  const { register, getValues } = useFormContext<{
    search: string;
    status: string;
  }>();

  const debouncedCallback = useMemo(
    () =>
      debounce((value: string) => {
        callback({ data: value, action: "search" });
      }, 500),
    [callback],
  );

  useEffect(() => {
    return () => debouncedCallback.cancel();
  }, [debouncedCallback]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedCallback(event.target.value);
  };

  const handleStatusChange = () => {
    callback({ data: getValues("status"), action: "status" });
  };

  return (
    <div className="tw:flex tw:flex-col tw:md:flex-row tw:gap-2 tw:row tw:md:items-center">
      <AppInput
        name="search"
        placeholder="Search products..."
        register={register}
        onChange={handleInputChange}
        leftIcon={<Search className="tw:w-4 tw:h-4 tw:text-gray-400" />}
        size="sm"
        className="tw:w-full"
      />

      <Controller
        name="status"
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
  );
};

export default Filter;
