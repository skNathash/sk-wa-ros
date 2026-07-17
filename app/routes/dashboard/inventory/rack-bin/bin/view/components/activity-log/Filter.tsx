import { debounce } from "lodash";
import { useForm, Controller } from "react-hook-form";
import { AppInput } from "~/components/core/form/AppInput";
import AppDateInput from "~/components/core/form/AppDateInput";
import { AppSelect } from "~/components/core/form";
import { useTranslation } from "react-i18next";

const Filter = ({ callback }: { callback: (a: { formData: any }) => void }) => {
  const { t } = useTranslation(["common"]);
  const { register, getValues, control, setValue } = useForm({
    defaultValues: {
      search: "",
      user: "All",
      dateRange: [],
    },
  });

  const handleInput = debounce(() => {
    triggerCallback();
  }, 500);

  const handleDateChange =
    (chngFrn: (value: Date[]) => void) => (value: Date | Date[]) => {
      chngFrn(Array.isArray(value) ? value : [value, value]);
      triggerCallback();
    };

  const triggerCallback = () => {
    callback({ formData: getValues() });
  };

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4 tw:items-end tw:mb-4">
      <AppInput
        name="search"
        placeholder={t("searchByTitle")}
        register={register}
        onChange={handleInput}
        className="tw:w-full"
      />
      <Controller
        control={control}
        name="dateRange"
        render={({ field: { onChange, value } }) => (
          <AppDateInput
            value={value}
            callback={handleDateChange(onChange)}
            className="tw:w-full"
            placeholder={t("selectDateRange")}
          />
        )}
      />
    </div>
  );
};

export default Filter;
