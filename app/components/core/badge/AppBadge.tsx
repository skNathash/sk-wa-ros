import React from "react";
import { Badge } from "../../ui/badge";
import { CircleX } from "lucide-react";
import type { VariantColor } from "~/types/CommonTypes";

interface AppBadgeProps {
  children: React.ReactNode;
  variant?: VariantColor;
  className?: string;
  showClose?: boolean;
  onClose?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const variantClassMap: Record<string, string> = {
  default: "tw:bg-gray-50 tw:text-gray-700 tw:border-gray-200",
  secondary: "tw:bg-gray-200 tw:text-gray-800 tw:border-transparent",
  destructive: "tw:bg-red-50 tw:text-red-700 tw:border-red-200",
  outline: "tw:bg-transparent tw:text-gray-800 tw:border-gray-300",
  success: "tw:bg-green-100 tw:text-green-800 tw:border-transparent",
  warning: "tw:bg-orange-100 tw:text-orange-800 tw:border-transparent",
  primary: "tw:bg-blue-100 tw:text-blue-800 tw:border-transparent",
  light: "tw:bg-gray-100 tw:text-gray-800 tw:border-transparent",
  white: "tw:bg-white tw:text-gray-800 tw:border-transparent",
  danger: "tw:bg-red-100 tw:text-red-800 tw:border-transparent",
};

const AppBadge: React.FC<AppBadgeProps> = ({
  children,
  variant = "default",
  className = "",
  showClose = false,
  onClose,
}) => {
  // If custom variant, use secondary's classes
  const customClass =
    variant &&
    ["success", "warning", "primary", "white", "danger"].includes(variant)
      ? variantClassMap[variant]
      : undefined;
  return (
    <Badge
      variant={
        variant === "success" ||
        variant === "warning" ||
        variant === "primary" ||
        variant === "light" ||
        variant === "white" ||
        variant === "danger"
          ? "secondary"
          : variant
      }
      className={customClass ? `${customClass} ${className}` : className}
    >
      {children}
      {showClose ? (
        <span
          className="tw:ml-1 tw:text-xs tw:cursor-pointer tw:align-middle"
          onClick={(e: any) => {
            e.stopPropagation();
            onClose?.(e);
          }}
        >
          <CircleX size={12} />
        </span>
      ) : null}
    </Badge>
  );
};

export default AppBadge;
