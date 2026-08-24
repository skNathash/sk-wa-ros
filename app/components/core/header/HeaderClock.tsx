import clsx from "clsx";
import { format } from "date-fns";
import { useEffect, useState } from "react";

/**
 * Live date + time shown on the header's subtitle line (theme-2 desktop only —
 * see `showHeaderClock` in AppHeader).
 *
 * The first paint has no clock (`now` starts null) so the server/first-render
 * markup can't disagree with the client's current time.
 */
const HeaderClock = ({ className }: { className?: string }) => {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!now) return null;

  return (
    <span
      className={clsx(
        "header-clock tw:inline-flex tw:items-center tw:gap-1.5 tw:whitespace-nowrap tw:text-gray-500",
        className,
      )}
    >
      <span>{format(now, "EEE, dd MMM yyyy")}</span>
      <span className="tw:opacity-40">•</span>
      <span className="tw:tabular-nums tw:font-medium">
        {format(now, "hh:mm:ss a")}
      </span>
    </span>
  );
};

export default HeaderClock;
