import clsx from "clsx";

interface InfoBlockProps {
  children: React.ReactNode;
  className?: string;
  variant?: "info" | "warning" | "success" | "danger";
  size?: "sm" | "md" | "lg";
  bordered?: boolean;
  shadow?: boolean;
}

const InfoBlock = ({
  children,
  className,
  variant = "info",
  size = "md",
  bordered = false,
  shadow = false,
}: InfoBlockProps) => {
  return (
    <div
      className={clsx(
        "tw:p-4 tw:rounded-lg",
        {
          "tw:text-sm tw:py-2": size === "sm",
          "tw:text-base tw:py-3": size === "md",
          "tw:text-lg tw:py-4": size === "lg",
          "tw:text-blue-800 tw:bg-blue-50": variant === "info",
          "tw:bg-yellow-50 tw:text-yellow-800": variant === "warning",
          "tw:bg-green-50 tw:text-green-800": variant === "success",
          "tw:bg-red-50 tw:text-red-800": variant === "danger",
          "tw:border tw:border-blue-500": bordered && variant === "info",
          "tw:border tw:border-yellow-500": bordered && variant === "warning",
          "tw:border tw:border-green-500": bordered && variant === "success",
          "tw:border tw:border-red-500": bordered && variant === "danger",
          "tw:shadow-sm": shadow,
        },
        className
      )}
    >
      {children}
    </div>
  );
};

export default InfoBlock;
