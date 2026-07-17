import clsx from "clsx";
import type { FieldErrors } from "react-hook-form";
import { Checkbox } from "~/components/ui/checkbox";

interface AppCheckboxProps {
  name?: string;
  label: string | React.ReactNode;
  errors?: FieldErrors;
  className?: string;
  size?: "xs" | "sm" | "lg";
  onChange?: (checked: boolean) => void;
  value?: boolean;
}

export const AppCheckbox = ({
  label,
  errors,
  className,
  size = "sm",
  onChange,
  value,
}: AppCheckboxProps) => {
  const labelTextClass =
    size === "xs" ? "tw:text-xs" : size === "lg" ? "tw:text-lg" : "tw:text-sm";

  return (
    <div className={className}>
      <div className="tw:flex tw:items-center tw:gap-2">
        <Checkbox
          onCheckedChange={onChange}
          checked={value == true}
          className={clsx("tw:border-gray-400", {
            "tw:size-3.5": size === "sm",
          })}
        />
        <div className={labelTextClass}>{label}</div>
      </div>
      {/* {error && (
        <div className="tw:text-red-500 tw:text-sm tw:mt-1">
          {error.message as string}
        </div>
      )} */}
    </div>
  );
};
