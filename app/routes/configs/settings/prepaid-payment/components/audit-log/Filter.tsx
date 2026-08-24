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
  className = "",
}: {
  callback: (data: { formData: any }) => void;
  className?: string;
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

  // Only the date-range control; spacing/positioning is owned by the parent
  // toolbar in ActivityLog (it places this on the right on desktop and stacks
  // it full-width on mobile).
  return (
    <div className={className}>
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
