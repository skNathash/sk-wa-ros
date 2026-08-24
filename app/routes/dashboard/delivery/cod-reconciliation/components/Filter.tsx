import { sub } from "date-fns";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppDateInput from "~/components/core/form/AppDateInput";
import MiscService from "~/services/MiscService";

interface FilterProps {
  callback: (data: any) => void;
}

interface FormData {
  dateRange?: Date[] | null;
}

/**
 * The handed-over date range. The search sits in the page's top strip beside
 * the sub-nav (see the page's PageTopBar), so this is all that is left to
 * filter on — and it only exists on the handed-over tab.
 */
const Filter: React.FC<FilterProps> = ({ callback }) => {
  const { t } = useTranslation(["common"]);
  const { control } = useForm<FormData>({
    defaultValues: { dateRange: null },
  });

  const handleDateChange =
    (chng: (val: Date[] | null) => void) => (value: Date | Date[] | null) => {
      const next = Array.isArray(value) ? value : value ? [value] : null;
      chng(next);
      callback({ formData: { dateRange: next } });
    };

  return (
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
