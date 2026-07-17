import { Controller, useForm } from "react-hook-form";
import { AppInput, AppSelect } from "~/components/core/form";
import { debounce } from "lodash";
import { defaultFilter } from "../helper";

const statusOptions = [
  { label: "All Status", value: "All" },
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "High Priority", value: "high_priority" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
];

const priorityOptions = [
  { label: "All Priority", value: "All" },
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

const Filter = ({
  callback,
}: {
  callback: (args: { formData: any; action: string }) => void;
}) => {
  const { register, control, getValues } = useForm({
    defaultValues: {
      ...defaultFilter,
    },
  });

  const triggerCallback = (action: string) => {
    callback({ formData: getValues(), action });
  };

  const handleSearch = debounce((e: any) => {
    triggerCallback("search");
  }, 500);

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-4">
      <AppInput
        type="text"
        placeholder="Search"
        name="search"
        register={register}
        onChange={handleSearch}
      />

      <Controller
        control={control}
        name="status"
        render={({ field }) => (
          <AppSelect
            options={statusOptions}
            value={field.value}
            onChange={(e) => {
              field.onChange(e.target.value);
              triggerCallback("status");
            }}
            inputClassName="tw:w-full"
          />
        )}
      />

      <Controller
        control={control}
        name="priority"
        render={({ field }) => (
          <AppSelect
            options={priorityOptions}
            value={field.value}
            onChange={(e) => {
              field.onChange(e.target.value);
              triggerCallback("priority");
            }}
            inputClassName="tw:w-full"
          />
        )}
      />
    </div>
  );
};

export default Filter;
