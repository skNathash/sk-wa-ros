import clsx from "clsx";
import type { RegisterOptions } from "react-hook-form";
import { Input } from "~/components/ui/input";
import InpLabel from "./InpLabel";

interface AppInputProps {
  name: string;
  label?: string;
  type?: "text" | "email" | "password" | "number" | "tel";
  placeholder?: string;
  register: any;
  rules?: RegisterOptions;
  error?: string;
  className?: string;
  size?: "sm" | "lg";
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onClick?: (event: React.MouseEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  isRequired?: boolean;
  maxLength?: number;
  readOnly?: boolean;
  inputClassName?: string;
  labelClassName?: string;
  autoFocus?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  note?: React.ReactNode;
  step?: string;
  min?: number;
  autoComplete?: string;
}

export const AppInput = ({
  name,
  label,
  type = "text",
  placeholder,
  register,
  rules,
  error,
  className,
  size,
  onChange,
  onBlur,
  onFocus,
  onClick,
  onKeyDown,
  disabled = false,
  isRequired,
  maxLength,
  readOnly = false,
  inputClassName,
  labelClassName,
  autoFocus = false,
  leftIcon,
  rightIcon,
  note,
  step,
  min,
  autoComplete = "off",
}: AppInputProps) => {
  const {
    onChange: registerOnChange,
    onBlur: registerOnBlur,
    onClick: registerOnClick,
    onFocus: registerOnFocus,
    ...registerRest
  } = register(name, {
    ...rules,
    setValueAs:
      type === "number"
        ? (value: string) => {
            if (value === "" || value === null || value === undefined)
              return "";
            const num = Number(value);
            return isNaN(num) ? "" : num;
          }
        : undefined,
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Handle maxLength for number inputs
    if (type === "number" && maxLength) {
      const value = event.target.value;
      if (value.length > maxLength) {
        event.target.value = value.slice(0, maxLength);
        return;
      }
    }

    registerOnChange(event);
    onChange?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    registerOnBlur(event);
    onBlur?.(event);
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    onFocus?.(event);
  };

  return (
    <div className={className}>
      {label && (
        <InpLabel
          isRequired={isRequired}
          size={size}
          labelClassName={labelClassName}
          note={note}
        >
          {label}
        </InpLabel>
      )}

      <div className="tw:relative">
        {leftIcon && (
          <div className="tw:absolute tw:left-3 tw:top-1/2 tw:-translate-y-1/2 tw:z-10 tw:pointer-events-none">
            {leftIcon}
          </div>
        )}
        <Input
          type={type}
          placeholder={placeholder}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onClick={onClick}
          onKeyDown={onKeyDown}
          readOnly={readOnly}
          disabled={disabled}
          autoComplete={autoComplete}
          maxLength={maxLength}
          autoFocus={autoFocus}
          step={step}
          min={min}
          {...registerRest}
          className={clsx(
            size === "sm" && "tw:lg:h-8 tw:text-sm",
            leftIcon && "tw:pl-10",
            rightIcon && "tw:pr-10",
            inputClassName,
            size === "lg" && "tw:h-10",
          )}
        />
        {rightIcon && (
          <div className="tw:absolute tw:right-3 tw:top-1/2 tw:-translate-y-1/2 tw:z-10">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <div className="tw:text-red-500 tw:text-xs tw:mt-1">{error}</div>
      )}
    </div>
  );
};
