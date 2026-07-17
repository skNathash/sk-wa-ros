import type { Options } from "flatpickr/dist/types/options";
import { debounce, orderBy } from "lodash";
import { Search } from "lucide-react";
import { useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppInput, AppSelect } from "~/components/core/form";
import OmsService from "~/services/OmsService";

type Props = {
  callback: (a: { formData: any }) => void;
};

const typeOptions = [
  { label: "All", value: "All" },
  { label: "B2B", value: "B2B" },
  { label: "B2C", value: "B2C" },
];

const statusOptions = orderBy(OmsService.getOrderStatuses(), "name", "asc").map(
  (e) => ({
    label: e.name,
    value: e.value,
    langKey: e.name,
  })
);
statusOptions.unshift({
  label: "All Statuses",
  value: "All",
  langKey: "allStatuses",
});

const Filter = ({ callback }: Props) => {
  const { t } = useTranslation(["common"]);

  const { register, getValues, control } = useForm({
    defaultValues: {
      search: "",
      type: "",
      status: "",
    },
  });

  const handleInput = debounce(() => {
    triggerCallback();
  }, 500);

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const handleTypeChange =
    (chngFrn: (value: string) => void) => (value: string) => {
      chngFrn(value);
      triggerCallback();
    };

  const handleStatusChange =
    (chngFrn: (value: string) => void) => (value: string) => {
      chngFrn(value);
      triggerCallback();
    };

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-2 tw:mb-4">
        <AppInput
          name="search"
          register={register}
          onChange={handleInput}
          size="sm"
          placeholder={t("searchByNameId")}
          leftIcon={<Search size={16} className="tw:text-gray-500" />}
        />
        <div className="tw:grid tw:grid-cols-2 tw:gap-2">
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <AppSelect
                options={typeOptions}
                value={field.value}
                onChange={handleTypeChange(field.onChange)}
                placeholder={t("selectType")}
                inputClassName="tw:w-full"
                size="sm"
              />
            )}
          />
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <AppSelect
                options={statusOptions}
                value={field.value}
                onChange={handleStatusChange(field.onChange)}
                placeholder={t("selectStatus")}
                inputClassName="tw:w-full"
                size="sm"
              />
            )}
          />
        </div>
      </div>
    </>
  );
};

export default Filter;
