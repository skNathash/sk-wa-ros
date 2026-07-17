import React from "react";
import clsx from "clsx";

interface KeyValueProps {
  label: string | React.ReactNode;
  children: React.ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  horizontal?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  icon?: React.ComponentType<any>;
}

const KeyValue: React.FC<KeyValueProps> = ({
  label,
  children,
  className = "",
  labelClassName = "",
  valueClassName = "",
  horizontal = false,
  size = "md",
  icon,
}) => {
  return (
    <div className={clsx(className, horizontal && "tw:flex tw:items-center")}>
      <div
        className={clsx(
          "tw:text-gray-500",
          labelClassName,
          horizontal ? "tw:mr-2" : "tw:mb-1",
          {
            "tw:text-[11px]": size === "xs" && !horizontal,
            "tw:text-xs":
              (size === "xs" && horizontal) || (size === "sm" && !horizontal),
            "tw:text-sm":
              (size === "sm" && horizontal) || (size === "md" && !horizontal),
            "tw:text-base":
              (size === "md" && horizontal) || (size === "lg" && !horizontal),
            "tw:text-lg": size === "lg" && horizontal,
          }
        )}
      >
        {icon ? (
          <div className="tw:flex tw:items-center tw:gap-1">
            {React.createElement(icon, { size: 12 })}
            {label}
          </div>
        ) : (
          label
        )}
      </div>
      <div
        className={clsx("tw:text-gray-900 tw:font-medium", valueClassName, {
          "tw:text-xs": size === "xs",
          "tw:text-sm": size === "sm",
          "tw:text-base": size === "md",
          "tw:text-lg": size === "lg",
        })}
      >
        {children}
      </div>
    </div>
  );
};

export default KeyValue;
