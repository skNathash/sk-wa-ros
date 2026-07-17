import clsx from "clsx";
import AppPopover from "../popover/AppPopover";
import { Info } from "lucide-react";

interface InpLabelProps {
  children: React.ReactNode;
  size?: "sm" | "lg";
  isRequired?: boolean;
  labelClassName?: string;
  note?: React.ReactNode;
}

const InpLabel = ({
  children,
  size = "sm",
  isRequired = false,
  labelClassName,
  note,
}: InpLabelProps) => {
  return (
    <label
      className={clsx(
        "tw:mb-2 tw:font-medium tw:text-gray-800 tw:flex tw:items-center tw:gap-1",
        size === "sm" ? "tw:text-xs" : "tw:text-sm",
        labelClassName
      )}
    >
      {children}
      {isRequired && <span className="tw:text-xs tw:text-red-500">*</span>}
      {note ? (
        <AppPopover
          triggerContent={
            <button className="tw:cursor-pointer tw:text-gray-500 tw:w-auto">
              <Info size={12} />
            </button>
          }
        >
          {note}
        </AppPopover>
      ) : null}
    </label>
  );
};

export default InpLabel;
