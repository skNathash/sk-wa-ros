import DatePicker from "../date-input/DatePicker";
import InpLabel from "./InpLabel";
import type { DayPickerProps } from "react-day-picker";

interface AppDateInputProps {
  label?: string;
  placeholder?: string;
  error?: string;
  className?: string;
  dateConfig?: DayPickerProps;
  callback: (dt: Date | Date[]) => void;
  size?: "sm" | "lg";
  value: Date | Date[] | undefined;
  hideClose?: boolean;
  isRequired?: boolean;
  inputClassName?: string;
  forceClose?: boolean;
  showTime?: boolean;
  disabled?: boolean;
}

const AppDateInput = ({
  label,
  size,
  placeholder,
  error,
  className,
  dateConfig,
  callback,
  value,
  hideClose = false,
  isRequired = false,
  inputClassName = "",
  forceClose = false,
  showTime = false,
  disabled = false,
}: AppDateInputProps) => {
  const handleClear = () => {
    callback([]);
  };

  return (
    <div className={className}>
      {label && (
        <InpLabel isRequired={isRequired} size={size}>
          {label}
        </InpLabel>
      )}
      <div className="tw:relative">
        <DatePicker
          inpChange={callback}
          isSmallInput={size === "sm"}
          placeholder={placeholder || ""}
          config={dateConfig}
          value={value}
          hideClose={hideClose}
          inputClassName={inputClassName}
          forceClose={forceClose}
          showTime={showTime}
          disabled={disabled}
        />
      </div>
      {error && (
        <div className="tw:text-red-500 tw:text-sm tw:mt-1">{error}</div>
      )}
    </div>
  );
};

export default AppDateInput;
