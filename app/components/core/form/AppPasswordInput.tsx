import clsx from "clsx";
import type { RegisterOptions } from "react-hook-form";
import InpLabel from "./InpLabel";
import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

interface AppPasswordInputProps {
  name: string;
  label?: string;
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
  disabled?: boolean;
  isRequired?: boolean;
  maxLength?: number;
  readOnly?: boolean;
}

export const AppPasswordInput = ({
  name,
  label,
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
  disabled,
  isRequired,
  maxLength,
  readOnly,
}: AppPasswordInputProps) => {
  const [show, setShow] = useState(false);
  const {
    onChange: registerOnChange,
    onBlur: registerOnBlur,
    onClick: registerOnClick,
    onFocus: registerOnFocus,
    ...registerRest
  } = register(name, rules);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    <div className={clsx(className, "tw:relative")}>
      {label && (
        <InpLabel isRequired={isRequired} size={size}>
          {label}
        </InpLabel>
      )}
      <input
        type={show ? "text" : "password"}
        size={size}
        placeholder={placeholder}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onClick={onClick}
        readOnly={readOnly}
        disabled={disabled}
        autoComplete="off"
        maxLength={maxLength}
        {...registerRest}
        className={clsx(
          "app-input",
          size === "sm" && "app-input-sm",
          "tw:pr-10"
        )}
      />
      <button
        type="button"
        tabIndex={-1}
        className="tw:absolute tw:top-1/2 tw:right-2 -tw:translate-y-1/2 tw:bg-transparent tw:border-none tw:p-0 tw:cursor-pointer"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? (
          <EyeIcon className="tw:size-4" />
        ) : (
          <EyeOffIcon className="tw:size-4" />
        )}
      </button>
      {error && (
        <div className="tw:text-red-500 tw:text-xs tw:mt-1">{error}</div>
      )}
    </div>
  );
};
