import type {
  FieldErrors,
  FieldValues,
  Path,
  RegisterOptions,
  UseFormRegister,
} from "react-hook-form";
import InpLabel from "./InpLabel";
import clsx from "clsx";

interface AppSelectOption {
  value: string | number;
  label: string;
}

interface AppSelectOptionGroup {
  label: string;
  options: AppSelectOption[];
}

// Accepts only a group of options
interface AppSelectGroupProps<TFieldValues extends FieldValues = FieldValues> {
  name: Path<TFieldValues>;
  label?: string;
  options: AppSelectOptionGroup[];
  register: UseFormRegister<TFieldValues>;
  rules?: RegisterOptions<TFieldValues>;
  error?: string;
  className?: string;
  size?: "sm" | "lg";
  placeholder?: string;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLSelectElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLSelectElement>) => void;
  isRequired?: boolean;
  disabled?: boolean;
}

export const AppSelectGroup = <TFieldValues extends FieldValues = FieldValues>({
  name,
  label,
  options,
  register,
  rules,
  error,
  className,
  size,
  placeholder,
  onChange,
  onBlur,
  onFocus,
  isRequired,
  disabled,
}: AppSelectGroupProps<TFieldValues>) => {
  const {
    onChange: registerOnChange,
    onBlur: registerOnBlur,
    ...registerRest
  } = register(name, rules);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    registerOnChange(event);
    onChange?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLSelectElement>) => {
    registerOnBlur(event);
    onBlur?.(event);
  };

  return (
    <div className={className}>
      {label && (
        <InpLabel size={size} isRequired={isRequired}>
          {label}
        </InpLabel>
      )}
      <select
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={onFocus}
        {...registerRest}
        className={clsx("app-input", size === "sm" && "app-input-sm")}
        disabled={disabled}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options.map((group, index) => (
          <optgroup key={index} label={group.label}>
            {group.options.map((opt, idx) => (
              <option key={idx} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {error && (
        <div className="tw:text-red-500 tw:text-sm tw:mt-1">{error}</div>
      )}
    </div>
  );
};

export default AppSelectGroup;
