import type { FieldValues } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import InpLabel from "./InpLabel";
import { useTranslation } from "react-i18next";
import AppSpinner from "../Spinner/AppSpinner";

interface AppSelectProps {
  label?: string;
  options: Array<{
    value: string | number;
    label: string;
    langKey?: string;
  }>;
  error?: string;
  className?: string;
  size?: "sm" | "lg";
  placeholder?: string;
  onChange?: (event: any) => void;
  isRequired?: boolean;
  disabled?: boolean;
  inputClassName?: string;
  value?: string | undefined;
  loading?: boolean;
}

export const AppSelect = ({
  label,
  options,
  error,
  className,
  size,
  placeholder,
  onChange,
  isRequired,
  disabled,
  inputClassName,
  value,
  loading,
}: AppSelectProps) => {
  const { t } = useTranslation(["common"]);

  const handleChange = (event: any) => {
    onChange?.(event);
  };

  if (loading) {
    return (
      <div className={className}>
        {label && (
          <InpLabel size={size} isRequired={isRequired}>
            {label}
          </InpLabel>
        )}
        <div>
          <AppSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {label && (
        <InpLabel size={size} isRequired={isRequired}>
          {label}
        </InpLabel>
      )}
      <Select onValueChange={handleChange} disabled={disabled} value={value}>
        <SelectTrigger
          className={inputClassName}
          size={size === "sm" ? "sm" : "default"}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option, index) => (
            <SelectItem key={index} value={option.value?.toString()}>
              {option.langKey ? t(option.langKey) : option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <div className="tw:text-red-500 tw:text-xs tw:mt-1">{error}</div>
      )}
    </div>
  );
};

export default AppSelect;
