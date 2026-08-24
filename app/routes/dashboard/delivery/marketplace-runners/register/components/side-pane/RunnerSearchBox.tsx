import clsx from "clsx";
import { Search } from "lucide-react";

interface RunnerSearchBoxProps {
  value: string;
  /** Fired on every keystroke; the pane filters the loaded roster itself. */
  onChange: (value: string) => void;
  className?: string;
}

/** Search box over the roster — matches the runner's name or their plate. */
export default function RunnerSearchBox({
  value,
  onChange,
  className,
}: RunnerSearchBoxProps) {
  return (
    <div className={clsx("tw:relative tw:px-1", className)}>
      <Search
        size={16}
        className="tw:pointer-events-none tw:absolute tw:left-4 tw:top-1/2 tw:-translate-y-1/2 tw:text-slate-400"
      />

      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Find runner by name or plate"
        className="tw:w-full tw:rounded-xl tw:border tw:border-slate-200 tw:bg-slate-50 tw:py-2.5 tw:pl-10 tw:pr-3 tw:text-sm tw:text-slate-900 tw:placeholder:text-slate-400 tw:focus:border-slate-300 tw:focus:bg-white tw:focus:outline-none"
      />
    </div>
  );
}
