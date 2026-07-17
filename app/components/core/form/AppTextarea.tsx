import clsx from "clsx";
import type { FieldErrors } from "react-hook-form";
import { type RegisterOptions } from "react-hook-form";
import InpLabel from "./InpLabel";

interface AppTextareaProps {
  label?: string;
  placeholder?: string;
  className?: string;
  error?: string;
  name: string;
  register: any;
  rules?: RegisterOptions;
  rows?: number;
  isRequired?: boolean;
  maxLength?: number;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  inputClassName?: string;
}

const AppTextarea = ({
  label,
  placeholder,
  className,
  error,
  name,
  register,
  rules,
  rows = 3,
  isRequired,
  maxLength,
  onChange,
  inputClassName = "",
}: AppTextareaProps) => {
  const { onChange: registerOnChange, ...registerRest } = register(name, rules);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    registerOnChange(event);
    onChange?.(event);
  };

  return (
    <div className={className}>
      {label && <InpLabel isRequired={isRequired}>{label}</InpLabel>}

      <textarea
        data-slot="textarea"
        placeholder={placeholder}
        className={clsx(
          "tw:w-full tw:outline-none tw:border tw:rounded-md tw:border-gray-300 tw:p-2 tw:placeholder:text-sm tw:text-sm",
          inputClassName
        )}
        onChange={handleChange}
        {...registerRest}
        rows={rows}
        maxLength={maxLength}
      ></textarea>
      {error && (
        <div className="tw:text-red-500 tw:text-sm tw:mt-1">{error}</div>
      )}
    </div>
  );
};

export default AppTextarea;
