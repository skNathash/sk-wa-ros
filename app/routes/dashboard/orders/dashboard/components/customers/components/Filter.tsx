import React from "react";
import { useFormContext } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { AppInput } from "~/components/core/form";
import { Search } from "lucide-react";

interface FilterCallbackArgs {
  data: Record<string, any>;
  action?: string;
}

interface FilterProps {
  callback: (args: FilterCallbackArgs) => void;
}

const Filter: React.FC<FilterProps> = ({ callback }) => {
  const { register, getValues } = useFormContext();

  const debounced = useDebouncedCallback((value: string) => {
    const data = { ...getValues(), search: value };
    callback({ data, action: "search" });
  }, 500);

  const handleSearchChange = () => {
    debounced(getValues("search"));
  };

  return (
    <div className="tw:flex tw:gap-2 tw:items-center tw:mb-3">
      <div className="tw:flex-1">
        <AppInput
          name="search"
          label={undefined}
          placeholder="Search Customer Name"
          register={register}
          onChange={handleSearchChange}
          inputClassName="tw:w-full"
          size="sm"
          leftIcon={<Search className="tw:w-4 tw:h-4 tw:text-gray-400" />}
        />
      </div>
    </div>
  );
};

export default Filter;
