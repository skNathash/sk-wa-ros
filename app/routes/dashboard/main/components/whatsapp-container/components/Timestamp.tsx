import { CheckCheck } from "lucide-react";

/** Stamp under a bubble, with the blue double tick once the turn is read. */
const Timestamp = ({ time, read }: { time: string; read?: boolean }) => (
  <span className="tw:mt-1 tw:flex tw:items-center tw:justify-end tw:gap-1 tw:text-[10px] tw:text-slate-400">
    {time}
    {read && <CheckCheck size={12} className="wa-ticks" />}
  </span>
);

export default Timestamp;
