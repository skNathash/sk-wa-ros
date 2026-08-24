import clsx from "clsx";
import { Search } from "lucide-react";

interface OrderSearchInputProps {
  value?: string;
  /** Fired on every keystroke — the page decides when to apply it. */
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * The order section's search box — one pill-shaped field shared by the
 * fulfilment board, the order directory and the side panes, so searching looks
 * the same wherever it sits.
 */
const OrderSearchInput = ({
  value,
  onChange,
  placeholder = "Order #, customer, product…",
  className,
}: OrderSearchInputProps) => (
  <div className={clsx("tw:relative", className)}>
    <Search className="tw:pointer-events-none tw:absolute tw:top-1/2 tw:left-3 tw:size-4 tw:-translate-y-1/2 tw:text-slate-400" />
    <input
      type="search"
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="tw:w-full tw:rounded-full tw:bg-slate-100 tw:py-2.5 tw:pr-4 tw:pl-9 tw:text-sm tw:text-slate-800 tw:outline-none tw:placeholder:text-slate-400 tw:focus:bg-white tw:focus:ring-1 tw:focus:ring-slate-300"
    />
  </div>
);

export default OrderSearchInput;
