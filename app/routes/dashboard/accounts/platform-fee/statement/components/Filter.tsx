import { Search } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useCallback } from "react";
import { debounce } from "lodash";
import { Controller } from "react-hook-form";
import { AppInput, AppSelect } from "~/components/core/form";

interface FilterProps {
  callback: (data: any) => void;
  plans?: any[];
}

const Filter = ({ callback, plans = [] }: FilterProps) => {
  const { t } = useTranslation(["common"]);
  const { register, getValues, control } = useFormContext();

  // trigger stable callback
  const triggerCallback = useCallback(() => {
    callback({ ...getValues() });
  }, [callback, getValues]);

  // debounced search to avoid frequent calls
  const handleSearchChange = useCallback(
    debounce(() => {
      triggerCallback();
    }, 500),
    [triggerCallback]
  );

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:mb-4">
      <AppInput
        name="search"
        register={register}
        placeholder={t("searchByReferenceId")}
        onChange={handleSearchChange}
        leftIcon={<Search size={16} className="tw:text-gray-400" />}
      />

      <Controller
        control={control}
        name="planId"
        render={({ field }) => (
          <AppSelect
            options={plans}
            value={field.value}
            onChange={(v: string) => {
              field.onChange(v);
              triggerCallback();
            }}
            placeholder={t("select")}
            inputClassName="tw:w-full"
            className="tw:bg-white"
          />
        )}
      />
    </div>
  );
};

export default Filter;
