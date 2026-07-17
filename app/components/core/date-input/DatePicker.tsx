import clsx from "clsx";
import {
  differenceInDays,
  endOfMonth,
  format,
  startOfMonth,
  sub,
} from "date-fns";
import { Calendar, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Calendar as CalendarComponent } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import AppButton from "../button/AppButton";
import { AppSelect } from "../form";

type DatePickerInputProps = {
  value: Date | Date[] | undefined;
  inpChange: (dt: Date | Date[]) => void;
  placeholder: string;
  config: any;
  isSmallInput: boolean;
  disabled?: boolean;
  hideClose?: boolean;
  inputClassName?: string;
  forceClose?: boolean; // New prop to force close the popover
};

type SelectedDate = Date | { from: Date; to: Date } | undefined;

const presets = [
  {
    label: "Choose",
    value: "choose",
  },
  {
    label: "Today",
    value: "today",
  },
  {
    label: "Yesterday",
    value: "yesterday",
  },
  {
    label: "This Month",
    value: "thisMonth",
  },
  {
    label: "Last Month",
    value: "lastMonth",
  },
  {
    label: "Last 7 Days",
    value: "last7Days",
  },
  {
    label: "Last 15 Days",
    value: "last15Days",
  },
  {
    label: "Last 30 Days",
    value: "last30Days",
  },
  {
    label: "Last 90 Days",
    value: "last90Days",
  },
  {
    label: "Last 180 Days",
    value: "last180Days",
  },
];

const getPreset = (
  selectedDate: Date | { from: Date; to: Date } | undefined
): string => {
  const from = selectedDate instanceof Date ? selectedDate : selectedDate?.from;
  const to = selectedDate instanceof Date ? selectedDate : selectedDate?.to;

  if (!from || !to) return "choose";

  const fromDate = new Date(from);
  const toDate = new Date(to);

  const diffDays = differenceInDays(toDate, fromDate);

  // for today
  if (
    fromDate.getDate() === new Date().getDate() &&
    toDate.getDate() === new Date().getDate()
  ) {
    return "today";
  }

  // for yesterday
  if (
    fromDate.getDate() === new Date().getDate() - 1 &&
    toDate.getDate() === new Date().getDate() - 1
  ) {
    return "yesterday";
  }

  // this month
  if (
    fromDate.getMonth() === new Date().getMonth() &&
    toDate.getMonth() === new Date().getMonth() &&
    diffDays >= 27
  ) {
    return "thisMonth";
  }

  // last month
  const lastMonth = new Date().getMonth() - 1;
  if (
    fromDate.getMonth() === lastMonth &&
    toDate.getMonth() === lastMonth &&
    diffDays <= 31
  ) {
    return "lastMonth";
  }

  switch (diffDays) {
    case 7:
      return "last7Days";
    case 15:
      return "last15Days";
    case 30:
      return "last30Days";
    case 90:
      return "last90Days";
    case 180:
      return "last180Days";
  }

  return "choose";
};

const DatePickerInput = ({
  value,
  inpChange,
  placeholder,
  config = {},
  isSmallInput,
  disabled = false,
  hideClose = false,
  inputClassName = "",
  forceClose = false,
}: DatePickerInputProps) => {
  const [open, setOpen] = useState(false);
  // Local state for selection inside popover
  const [selectedDate, setSelectedDate] = useState<SelectedDate>();
  const [selectedPreset, setSelectedPreset] = useState<string | undefined>(
    undefined
  );

  // Sync selectedDate with value when popover opens or value changes externally
  useEffect(() => {
    if (open) {
      let dt: SelectedDate = value as SelectedDate;
      if (
        config.mode === "range" &&
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        "from" in value &&
        "to" in value
      ) {
        const from =
          (value as any).from instanceof Date ? (value as any).from : null;
        const to = (value as any).to instanceof Date ? (value as any).to : null;
        if (from && to) {
          dt = { from, to };
        } else if (from) {
          dt = from;
        } else {
          dt = undefined;
        }
      } else {
        if (Array.isArray(value) && value.length === 2) {
          dt = { from: value[0], to: value[1] };
        } else if (Array.isArray(value) && value.length === 1) {
          dt = value[0];
        }
      }
      setSelectedDate(dt);

      setSelectedPreset(getPreset(dt));
    }
  }, [open, value]);

  // Handle force close from parent (e.g., when modal is closed)
  useEffect(() => {
    if (forceClose && open) {
      setOpen(false);
    }
  }, [forceClose, open]);

  // Helper function to ensure we have a proper Date object
  const ensureDate = (date: any): Date | null => {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (typeof date === "string" || typeof date === "number") {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  };

  // Helper function to get normalized dates array
  const getNormalizedDates = (): Date[] => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map(ensureDate).filter(Boolean) as Date[];
    }
    const singleDate = ensureDate(value);
    return singleDate ? [singleDate] : [];
  };

  const clearDate = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    inpChange([]);
  };

  // Format display value
  const formatDisplayValue = () => {
    const normalizedDates = getNormalizedDates();

    if (normalizedDates.length === 0) return "";

    if (normalizedDates.length === 1) {
      return format(normalizedDates[0], "d MMM yyyy");
    }

    // Display date range for multiple dates
    const sortedDates = [...normalizedDates].sort(
      (a, b) => a.getTime() - b.getTime()
    );
    const startDate = format(sortedDates[0], "d MMM yyyy");
    const endDate = format(sortedDates[sortedDates.length - 1], "d MMM yyyy");

    return `${startDate} - ${endDate}`;
  };

  // Calendar onSelect updates only selectedDate
  const onCalendarSelect = (date: any) => {
    setSelectedDate(date);

    if (config.mode !== "range") {
      handleApply(date);
    }
  };

  // Apply and Cancel handlers
  const handleApply = (date?: Date | Date[] | { from: Date; to: Date }) => {
    let dt = date || selectedDate;
    let outValue = dt;
    if (
      config.mode === "range" &&
      dt &&
      typeof dt === "object" &&
      !Array.isArray(dt) &&
      "from" in dt &&
      "to" in dt
    ) {
      const from = (dt as any).from instanceof Date ? (dt as any).from : null;
      const to = (dt as any).to instanceof Date ? (dt as any).to : null;
      if (from && to) {
        outValue = [from, to];
      } else if (from) {
        outValue = [from, from];
      } else {
        outValue = [];
      }
    }

    if (config.mode === "range" && outValue instanceof Date) {
      outValue = [outValue, outValue];
    }

    inpChange(outValue as Date | Date[]);
    setOpen(false);
  };

  const handleCancel = () => {
    setSelectedDate(value as SelectedDate);
    setOpen(false);
  };

  const handlePresetChange = (value: string) => {
    if (value === "choose") {
      setSelectedPreset(value);
      return;
    }

    let dt = undefined;

    switch (value) {
      case "today":
        dt = new Date();
        break;
      case "yesterday":
        dt = sub(new Date(), { days: 1 });
        break;
      case "thisMonth":
        dt = {
          from: startOfMonth(new Date()),
          to: endOfMonth(new Date()),
        };
        break;
      case "lastMonth":
        dt = {
          from: startOfMonth(sub(new Date(), { months: 1 })),
          to: endOfMonth(sub(new Date(), { months: 1 })),
        };
        break;
      case "last7Days":
        dt = { from: sub(new Date(), { days: 7 }), to: new Date() };
        break;
      case "last15Days":
        dt = {
          from: sub(new Date(), { days: 15 }),
          to: new Date(),
        };
        break;
      case "last30Days":
        dt = {
          from: sub(new Date(), { days: 30 }),
          to: new Date(),
        };
        break;
      case "last90Days":
        dt = {
          from: sub(new Date(), { days: 90 }),
          to: new Date(),
        };
        break;
      case "last180Days":
        dt = {
          from: sub(new Date(), { days: 180 }),
          to: new Date(),
        };
        break;
      default:
        dt = undefined;
        break;
    }
    setSelectedDate(dt);
    setSelectedPreset(value);
    const t = setTimeout(() => {
      clearTimeout(t);
      handleApply(dt);
    }, 400);
  };

  return (
    <div className="tw:relative">
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={clsx(
              "tw:w-full tw:justify-start tw:text-left tw:font-normal tw:bg-white",
              inputClassName,
              isSmallInput ? "tw:h-8" : ""
            )}
            disabled={disabled}
          >
            <Calendar className="tw:h-4 tw:w-4" />
            {formatDisplayValue() || placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="tw:w-auto tw:p-0 tw:max-w-2xl" align="start">
          <div className="tw:flex tw:flex-col tw:p-2 tw:w-full compact-calendar">
            {config.mode === "range" ? (
              <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:border-b tw:border-gray-200 tw:pb-2 tw:px-2">
                <span className="tw:text-xs tw:font-medium tw:text-gray-500">
                  Custom Date Range
                </span>
                <AppSelect
                  options={presets}
                  value={selectedPreset}
                  onChange={handlePresetChange}
                  size="sm"
                />
              </div>
            ) : null}

            <CalendarComponent
              mode={config.mode || "single"}
              selected={selectedDate as Date | Date[]}
              onSelect={onCalendarSelect}
              disabled={config.disabled}
              captionLayout={
                config?.numberOfMonths === 2 ? "label" : "dropdown"
              }
              {...config}
            />

            {config.mode === "range" ? (
              <div className="tw:flex tw:justify-end tw:gap-3 tw:px-2 tw:border-t tw:border-gray-200 tw:pt-0.5">
                <AppButton
                  fill="clear"
                  size="small"
                  onClick={handleCancel}
                  type="button"
                >
                  Cancel
                </AppButton>
                <AppButton
                  fill="clear"
                  size="small"
                  onClick={() => handleApply()}
                  type="button"
                >
                  Apply
                </AppButton>
              </div>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>

      {!hideClose && value && Array.isArray(value) && value.length > 0 ? (
        <button
          type="button"
          className="tw:absolute tw:top-1/2 tw:right-2 tw:p-2 tw:text-lg tw:text-gray-500 tw:-translate-y-1/2"
          onClick={clearDate}
        >
          <X className="tw:size-4" />
        </button>
      ) : null}
    </div>
  );
};

DatePickerInput.defaultProps = {
  config: {},
};

export default DatePickerInput;
