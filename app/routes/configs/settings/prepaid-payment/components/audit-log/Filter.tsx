import { Controller, useForm } from "react-hook-form";
import AppDateInput from "~/components/core/form/AppDateInput";
import type { DayPickerProps } from "react-day-picker";
import MiscService from "~/services/MiscService";
import { sub } from "date-fns";

const dateConfig: DayPickerProps = {
  mode: "range",
  numberOfMonths: MiscService.isMobile() ? 1 : 2,
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
};

const Filter = ({
  callback,
}: {
  callback: (data: { formData: any }) => void;
}) => {
  const { control, getValues } = useForm({
    defaultValues: {
      dateRange: [],
    },
  });

  const handleDateChange =
    (chngFn: (value: Date[]) => void) => (value: Date | Date[]) => {
      chngFn(value as Date[]);
      callback({ formData: getValues() });
    };

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4 tw:mb-4">
      <Controller
        control={control}
        name="dateRange"
        render={({ field }) => (
          <AppDateInput
            callback={handleDateChange(field.onChange)}
            value={field.value}
            dateConfig={dateConfig}
            placeholder="Select date range"
          />
        )}
      />
    </div>
  );
};

export default Filter;
