import { debounce } from "lodash";
import { useForm, Controller } from "react-hook-form";
import { AppInput } from "~/components/core/form/AppInput";
import AppDateInput from "~/components/core/form/AppDateInput";
import { AppSelect } from "~/components/core/form";
import { useTranslation } from "react-i18next";
import { useWatch } from "react-hook-form";
import FilterChip from "~/components/core/filter-chip/FilterChip";
import FilterChipGroup from "~/components/core/filter-chip/FilterChipGroup";
import { ACTION_FILTERS } from "./helper";

const Filter = ({ callback }: { callback: (a: { formData: any }) => void }) => {
  const { t } = useTranslation(["common"]);
  const { register, getValues, control, setValue } = useForm({
    defaultValues: {
      search: "",
      user: "All",
      action: "All",
      dateRange: [],
    },
  });

  const activeAction = useWatch({ control, name: "action" });

  const handleActionChange = (value: string) => {
    if (value === getValues("action")) return;
    setValue("action", value);
    triggerCallback();
  };

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
    <>
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

      {/* Action type — the fastest cut of the timeline, so it sits right above
          the list rather than inside the input grid. */}
      <FilterChipGroup className="tw:mb-4">
        {ACTION_FILTERS.map((option) => (
          <FilterChip
            key={option.value}
            active={activeAction === option.value}
            onClick={() => handleActionChange(option.value)}
          >
            {option.label}
          </FilterChip>
        ))}
      </FilterChipGroup>
    </>
  );
};

export default Filter;
