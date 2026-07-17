import clsx from "clsx";
import { Progress } from "~/components/ui/progress";

const AppProgress = ({
  value,
  className,
  color = "success",
}: {
  value: number;
  className?: string;
  color?: "success" | "warning" | "danger" | "primary" | "dark";
}) => {
  return (
    <Progress
      value={value}
      className={clsx(
        color === "success" && "tw:[&>div]:bg-emerald-500",
        color === "warning" && "tw:[&>div]:bg-yellow-500",
        color === "danger" && "tw:[&>div]:bg-red-500",
        color === "primary" && "tw:[&>div]:bg-blue-500",
        color === "dark" && "tw:[&>div]:bg-gray-500",
        className
      )}
    />
  );
};

export default AppProgress;
