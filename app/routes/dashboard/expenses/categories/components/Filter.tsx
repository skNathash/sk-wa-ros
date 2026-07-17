import { useForm } from "react-hook-form";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { debounce } from "lodash";
import { AppInput } from "~/components/core/form/AppInput";
import { AppSelect } from "~/components/core/form/AppSelect";

interface FilterFormData {
  search: string;
  status?: "all" | "active" | "inactive";
}

interface FilterProps {
  callback: (payload: { formData: FilterFormData }) => void;
  className?: string;
}

const statusOptions = [
  { value: "all", label: "All", langKey: "all" },
  { value: "active", label: "Active", langKey: "active" },
  { value: "inactive", label: "Inactive", langKey: "inactive" },
];

const Filter = ({ callback, className = "" }: FilterProps) => {
  const { t } = useTranslation(["common"]);

  const { register, getValues, setValue } = useForm<FilterFormData>({
    defaultValues: { search: "", status: "all" },
  });

  // Trigger callback with current form values
  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const debouncedSearch = useCallback(
    debounce(() => {
      triggerCallback();
    }, 300),
    [triggerCallback]
  );

  // Keep input controlled for external updates (if any)
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value;
    // update react-hook-form value and trigger debounced search
    setValue("search", val);
    debouncedSearch();
  };

  const handleStatusChange = (value: string) => {
    const v = (value || "all") as FilterFormData["status"];
    setValue("status", v);
    // immediately trigger filter when status changes
    triggerCallback();
  };

  return (
    <div className={"tw:mb-4 " + className}>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3">
        <div className="md:tw:col-span-2">
          <AppInput
            name="search"
            placeholder={t("searchCategories")}
            register={register}
            onChange={handleChange}
            inputClassName="tw:w-full"
          />
        </div>

        <div>
          <AppSelect
            options={statusOptions}
            value={getValues().status}
            onChange={handleStatusChange}
            placeholder={t("select")}
            inputClassName="tw:w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default Filter;
