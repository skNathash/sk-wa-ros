import clsx from "clsx";

type DividerProps = {
  className?: string;
  variant?: "solid" | "dashed";
};

const Divider = ({ className, variant = "solid" }: DividerProps) => {
  return (
    <div
      className={clsx(
        "tw:my-4",
        variant === "dashed"
          ? "tw:border-t-2 tw:border-dashed tw:border-gray-200"
          : "tw:border-t tw:border-gray-200",
        className
      )}
    ></div>
  );
};

export default Divider;
