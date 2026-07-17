import { sub } from "date-fns";
import { debounce } from "lodash";
import { useCallback } from "react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppDateInput from "~/components/core/form/AppDateInput";
import { AppInput } from "~/components/core/form/AppInput";
import MiscService from "~/services/MiscService";
import ExpenseCategorySearch from "~/shared/expense/components/category-search/ExpenseCategorySearch";

type FormData = {
  search?: string;
  dateRange?: Date[];
  category?: Array<{ value: string; label: string }>;
};

type FilterProps = {
  callback: (payload: { formData: FormData }) => void;
};

const expenseCategoryFilter = {
  filter: {
    isActive: true,
  },
};

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
  numberOfMonths: MiscService.isMobile() ? 1 : 2,
};

const Filter = ({ callback }: FilterProps) => {
  const { t } = useTranslation(["common"]);

  const { control, register, getValues, setValue } = useForm<FormData>({
    defaultValues: {
      search: "",
      dateRange: [],
      category: [],
    },
  });

  const [category] = useWatch({
    control,
    name: ["category"],
  });

  // Trigger callback with current form values
  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(() => {
      triggerCallback();
    }, 300),
    [triggerCallback]
  );

  const onDateChange =
    (chngFn: (value: Date | Date[]) => void) => (value: Date | Date[]) => {
      chngFn(value);
      triggerCallback();
    };

  const handleCategoryChange = (data: {
    action: "add" | "remove";
    data: { value: string; label: string };
  }) => {
    if (data.action === "add") {
      setValue("category", [data.data]);
    } else {
      setValue(
        "category",
        category?.filter((item) => item.value !== data.data.value) || []
      );
    }
    triggerCallback();
  };

  return (
    <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:md:grid-cols-3 tw:mb-3">
      <AppInput
        name="search"
        register={register}
        placeholder="Search by Title"
        onChange={debouncedSearch}
      />
      <Controller
        control={control}
        name="dateRange"
        render={({ field }) => (
          <AppDateInput
            value={field.value}
            callback={onDateChange(field.onChange)}
            placeholder={t("selectDateRange")}
            size="sm"
            dateConfig={dateConfig}
          />
        )}
      />
      <ExpenseCategorySearch
        value={category}
        callback={handleCategoryChange}
        label=""
        placeholder="Search Category"
        filters={expenseCategoryFilter}
      />
    </div>
  );
};

export default Filter;
