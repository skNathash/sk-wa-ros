import { useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { AppInput } from "~/components/core/form/AppInput";
import AppDateInput from "~/components/core/form/AppDateInput";
import { debounce } from "lodash";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import MiscService from "~/services/MiscService";
import { sub } from "date-fns";

interface FilterProps {
  callback: (data: any) => void;
  tab?: string;
}

interface FormData {
  search: string;
  dateRange?: Date[] | null;
}

const Filter: React.FC<FilterProps> = ({ callback, tab }) => {
  const { t } = useTranslation(["common"]);
  const { register, control, getValues } = useForm<FormData>({
    defaultValues: { search: "", dateRange: null },
  });

  // Debounced handler, stable reference
  const triggerCallback = useCallback(
    debounce(() => {
      callback({ formData: getValues() });
    }, 500),
    [callback, getValues]
  );

  // Only call debounce on change
  const handleInput = () => {
    triggerCallback();
  };

  const handleDateChange =
    (chng: (val: Date[] | null) => void) => (value: Date | Date[] | null) => {
      chng(Array.isArray(value) ? value : value ? [value] : null);
      triggerCallback();
    };

  return (
    <div style={{ marginBottom: 16 }}>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
        <AppInput
          name="search"
          placeholder={
            t("searchByOrderNumber") || "Search by Order Ref ID or PersonName"
          }
          register={register}
          size="sm"
          onChange={handleInput}
          leftIcon={<Search size={16} />}
        />

        {tab === "handedover" && (
          <Controller
            control={control}
            name="dateRange"
            render={({ field }) => (
              <AppDateInput
                callback={handleDateChange(field.onChange)}
                // AppDateInput expects Date | Date[] | undefined
                value={(field.value as Date[] | undefined) ?? undefined}
                dateConfig={dateConfig}
                size="sm"
                placeholder={t("selectDate")}
                hideClose={true}
              />
            )}
          />
        )}
      </div>
    </div>
  );
};

export default Filter;

const dateConfig: any = {
  mode: "range",
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
  numberOfMonths: MiscService.isMobile() ? 1 : 2,
};
