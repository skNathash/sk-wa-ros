import clsx from "clsx";
import React from "react";
import { Button } from "~/components/ui/button";
import AppSpinner from "../Spinner/AppSpinner";
import type { ButtonColor } from "~/types/CommonTypes";

interface AppButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  size?: "small" | "large" | "default" | "icon";
  type?: "button" | "submit" | "reset";
  fill?: "solid" | "outline" | "clear";
  color?: ButtonColor;

  className?: string;
  noShadow?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  expand?: "block" | "full";
  noPadding?: boolean;
  title?: string;
  form?: string;
}

const AppButton: React.FC<AppButtonProps> = ({
  children,
  onClick,
  size = "default",
  type = "button",
  fill = "solid",
  color = "primary",
  className,
  noShadow = false,
  isLoading = false,
  disabled,
  expand,
  noPadding = false,
  title,
  form,
}) => {
  const getColorClass = () => {
    if (color === "success" && fill === "solid") {
      return "tw:bg-emerald-600 tw:text-white tw:hover:bg-emerald-700";
    }
    if (color === "danger" && fill === "solid") {
      return "tw:bg-red-600 tw:text-white tw:hover:bg-red-700";
    }
    if (color === "warning" && fill === "solid") {
      return "tw:bg-yellow-500 tw:text-white tw:hover:bg-yellow-600";
    }
    if (color === "primary" && fill === "solid") {
      return "tw:bg-primary tw:text-white tw:hover:bg-primary-dark";
    }
    if (color === "secondary" && fill === "solid") {
      return "tw:bg-gray-500 tw:text-white tw:hover:bg-gray-600";
    }
    if (color === "light" && fill === "solid") {
      return "tw:bg-gray-500 tw:text-white tw:hover:bg-gray-600";
    }

    if (color === "success" && fill === "outline") {
      return "tw:border tw:border-green-500 tw:text-green-500 tw:bg-transparent tw:hover:bg-green-500 tw:hover:text-white";
    }
    if (color === "danger" && fill === "outline") {
      return "tw:border tw:border-red-500 tw:text-red-500 tw:bg-transparent tw:hover:bg-red-500 tw:hover:text-white";
    }
    if (color === "warning" && fill === "outline") {
      return "tw:border tw:border-yellow-500 tw:text-yellow-500 tw:bg-transparent tw:hover:bg-yellow-500 tw:hover:text-white";
    }
    if (color === "primary" && fill === "outline") {
      return "tw:border tw:border-primary tw:text-primary tw:bg-transparent tw:hover:bg-primary tw:hover:text-white";
    }
    if (color === "secondary" && fill === "outline") {
      return "tw:border tw:border-gray-500 tw:text-gray-500 tw:bg-transparent tw:hover:bg-gray-500 tw:hover:text-white";
    }
    if (color === "light" && fill === "outline") {
      return "tw:border tw:border-gray-300 tw:text-gray-900 tw:bg-transparent tw:hover:bg-gray-50 tw:hover:text-gray-900";
    }
  };

  return (
    <Button
      onClick={onClick}
      size={size === "small" ? "sm" : size === "large" ? "lg" : "default"}
      type={type}
      variant={
        fill === "outline" ? "outline" : fill === "clear" ? "ghost" : "default"
      }
      disabled={isLoading || disabled}
      className={clsx(getColorClass(), className, "tw:cursor-pointer", {
        "tw:text-xs": size === "small",
        "tw:text-sm": size === "default",
        "tw:text-base": size === "large",
      })}
      title={title}
      form={form}
    >
      {isLoading && <AppSpinner size="xs" />}
      {children}
    </Button>
  );
};

export default AppButton;
