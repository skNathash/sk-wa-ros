import type {
  UseFormRegister,
  FieldValues,
  FieldErrors,
  RegisterOptions,
} from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { useTranslation } from "react-i18next";

interface AppRadioProps {
  defaultValue?: string | number;
  name: string;
  options: Array<{
    value: string | number;
    label: string;
    langKey?: string;
  }>;
  errors?: FieldErrors;
  className?: string;
  inline?: boolean;
  onChange?: (value: string) => void;
}

export const AppRadio = ({
  defaultValue,
  name,
  options,
  className,
  inline = false,
  onChange,
}: AppRadioProps) => {
  const { t } = useTranslation(["common"]);
  return (
    <RadioGroup
      defaultValue={defaultValue?.toString()}
      onValueChange={onChange}
      name={name}
      className={`${inline ? "tw:flex tw:flex-row tw:gap-6" : ""} ${className ?? ""}`}
    >
      {options.map((option) => (
        <div className="tw:flex tw:items-center tw:gap-3">
          <RadioGroupItem value={option.value.toString()} />
          <span className="tw:text-sm tw:font-medium">
            {option.langKey ? t(option.langKey) : option.label}
          </span>
        </div>
      ))}
    </RadioGroup>
  );
};
