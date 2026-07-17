type SpinnerSize = "xs" | "sm" | "lg";

interface AppSpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const AppSpinner = ({ size, className }: AppSpinnerProps) => {
  const sizeClass =
    size === "xs"
      ? "tw:w-3 tw:h-3"
      : size === "sm"
      ? "tw:w-4 tw:h-4"
      : size === "lg"
      ? "tw:w-8 tw:h-8"
      : "tw:w-6 tw:h-6";

  return (
    <div
      className={`tw:animate-spin tw:rounded-full tw:border-4 tw:border-gray-200 tw:border-t-blue-600 ${sizeClass} ${
        className ?? ""
      }`}
    ></div>
  );
};

export default AppSpinner;
