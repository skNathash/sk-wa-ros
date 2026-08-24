import { Minus, Plus } from "lucide-react";

interface Props {
  value: number;
  onChange: (value: number) => void;
  /** Mobile cards get a bigger tap target than the desktop table row. */
  size?: "sm" | "md";
}

/** Minus / number / plus control used before a deal goes into the cart. */
const QtyStepper: React.FC<Props> = ({ value, onChange, size = "sm" }) => {
  const pad = size === "md" ? "tw:px-2.5 tw:py-1.5" : "tw:px-2 tw:py-1";
  const icon = size === "md" ? "tw:w-4 tw:h-4" : "tw:w-3.5 tw:h-3.5";
  const field = size === "md" ? "tw:w-10" : "tw:w-9";

  return (
    <div className="tw:flex tw:items-stretch tw:border tw:border-gray-300 tw:rounded-md tw:overflow-hidden tw:bg-white">
      <button
        type="button"
        aria-label="Decrease"
        onClick={() => onChange(Math.max(0, value - 1))}
        className={`${pad} tw:text-gray-700 hover:tw:bg-gray-100 active:tw:bg-gray-200 disabled:tw:opacity-40 tw:cursor-pointer`}
        disabled={value <= 0}
      >
        <Minus className={icon} />
      </button>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          onChange(Number.isNaN(n) || n < 0 ? 0 : n);
        }}
        className={`${field} tw:text-center tw:text-sm tw:font-bold tw:bg-white focus:tw:outline-none`}
      />
      <button
        type="button"
        aria-label="Increase"
        onClick={() => onChange(value + 1)}
        className={`${pad} tw:text-gray-700 hover:tw:bg-gray-100 active:tw:bg-gray-200 tw:cursor-pointer`}
      >
        <Plus className={icon} />
      </button>
    </div>
  );
};

export default QtyStepper;
