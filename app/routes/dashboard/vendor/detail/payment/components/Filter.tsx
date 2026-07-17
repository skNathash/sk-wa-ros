import debounce from "lodash/debounce";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppInput, AppSelect } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import AccountService from "~/services/AccountService";

interface FilterProps {
  callback: (params: { formData: any; action: string }) => void;
}

const dateConfig: DayPickerProps = {
  mode: "range",
};

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "done", label: "Paid" },
  { value: "partial", label: "Partial" },
  { value: "pending", label: "Unpaid" },
];

const typeOptions = AccountService.getSourceTypeOptions();
typeOptions.sort((a, b) => a.label.localeCompare(b.label));
typeOptions.unshift({ value: "all", label: "All Types" });

const Filter = ({ callback }: FilterProps) => {
  const { t } = useTranslation(["common"]);

  const options = [
    { value: "all", label: t("allStatus") },
    { value: "paid", label: t("paid") },
    { value: "partial", label: t("partial") },
    { value: "pending", label: t("unpaid") },
  ];

  const { register, control, getValues } = useForm({
    defaultValues: {
      dateRange: [],
      search: "",
      status: "",
      type: "",
    },
  });

  // Debounced search
  const debouncedSearch = debounce(() => {
    triggerCallback();
  }, 500);

  const handleSearchChange = () => {
    debouncedSearch();
  };

  const triggerCallback = (action: string = "apply") => {
    const vals = getValues();
    callback({ formData: { ...vals }, action });
  };

  const onDateChange =
    (chngField: (value: any) => void) => (dt: Date | Date[]) => {
      chngField(dt);
      triggerCallback();
    };

  const onStatusChange = (value: any, chngField: (value: any) => void) => {
    chngField(value);
    triggerCallback();
  };

  const onSelectChange = (value: any, chngField: (value: any) => void) => {
    chngField(value);
    triggerCallback();
  };

  return (
    <div className="tw:flex tw:flex-col tw:gap-4 tw:mb-4">
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-3">
        <AppInput
          name="search"
          placeholder={t("searchByPOId")}
          register={register}
          onChange={handleSearchChange}
          size="sm"
        />
        <Controller
          control={control}
          name="dateRange"
          render={({ field }) => (
            <AppDateInput
              callback={onDateChange(field.onChange)}
              value={field.value}
              size="sm"
              dateConfig={dateConfig}
              placeholder={t("filterByDateRange")}
              className="tw:w-full"
            />
          )}
        />
        {/* Status select */}
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <AppSelect
              options={statusOptions}
              value={field.value}
              onChange={(val: any) => onStatusChange(val, field.onChange)}
              size="sm"
              placeholder="All Status"
              inputClassName="tw:w-full"
            />
          )}
        />
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <AppSelect
              options={typeOptions}
              value={field.value}
              onChange={(val: any) => onSelectChange(val, field.onChange)}
              size="sm"
              placeholder="All Types"
              inputClassName="tw:w-full"
            />
          )}
        />
      </div>
    </div>
  );
};

export default Filter;
