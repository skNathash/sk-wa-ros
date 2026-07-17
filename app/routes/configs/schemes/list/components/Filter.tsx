import clsx from "clsx";
import { Search } from "lucide-react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import Alpha from "~/components/core/alpha/Alpha";
import { AppInput, AppSelect } from "~/components/core/form";

const statusOptions = [
  { label: "Running Schemes", value: "running" },
  { label: "Upcoming Schemes", value: "upcoming" },
  { label: "Completed Schemes", value: "expired" },
];

const Filter = ({
  callback,
  activeTab,
}: {
  callback: (args: { formData: any }) => void;
  activeTab?: string;
}) => {
  const { register, control, getValues, setValue } = useFormContext();

  const [alpha] = useWatch({ control, name: ["alpha"] });

  const debouncedSearch = useDebouncedCallback(
    () => {
      setValue("alpha", "");
      callback({ formData: getValues() });
    },
    500,
    {
      maxWait: 1000,
    },
  );

  const handleAlphaChange = (value: string) => {
    setValue("search", "");
    callback({ formData: { ...getValues(), alpha: value } });
  };

  const handleStatusChange = (value: string) => {
    setValue("status", value);
    callback({ formData: getValues() });
  };

  const isExcludeTab = activeTab === "exclude";

  return (
    <div className="tw:mb-4">
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-2 tw:mb-2">
        <AppInput
          name="search"
          register={register}
          onChange={debouncedSearch}
          size="sm"
          placeholder="Search"
          leftIcon={<Search size={16} className="tw:text-gray-400" />}
        />

        {!isExcludeTab && (
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <AppSelect
                options={statusOptions}
                value={field.value}
                onChange={handleStatusChange}
                size="sm"
                placeholder="Select Status"
                inputClassName={clsx(
                  "tw:w-full tw:md:w-auto",
                  field.value === "running"
                    ? "tw:border-green-500 tw:border-1 tw:text-green-800"
                    : field.value === "upcoming"
                    ? "tw:border-yellow-500 tw:border-1 tw:text-yellow-800"
                    : field.value === "expired"
                    ? "tw:border-red-500 tw:border-1 tw:text-red-800"
                    : "tw:border-gray-300",
                )}
                className=""
              />
            )}
          />
        )}
      </div>

      <Alpha callback={handleAlphaChange} selected={alpha} />
    </div>
  );
};

export default Filter;
