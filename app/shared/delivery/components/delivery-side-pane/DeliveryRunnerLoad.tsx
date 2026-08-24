import clsx from "clsx";

type RunnerStatus = "online" | "idle";

interface RunnerLoad {
  id: string;
  name: string;
  initials: string;
  status: RunnerStatus;
  /** Orders the runner is carrying right now. */
  load: number;
  /** Orders the runner can carry in total. */
  capacity: number;
  /** Avatar swatch. */
  avatar: string;
  /** Progress bar fill. */
  bar: string;
}

/** Hardcoded for now — replaced by live runner data once the API lands. */
const RUNNERS: RunnerLoad[] = [
  {
    id: "ashok",
    name: "Ashok",
    initials: "AK",
    status: "online",
    load: 5,
    capacity: 6,
    avatar: "tw:bg-amber-500",
    bar: "tw:bg-amber-400",
  },
  {
    id: "ravi",
    name: "Ravi",
    initials: "RB",
    status: "online",
    load: 3,
    capacity: 5,
    avatar: "tw:bg-blue-500",
    bar: "tw:bg-emerald-500",
  },
  {
    id: "manjunath",
    name: "Manjunath",
    initials: "MS",
    status: "idle",
    load: 1,
    capacity: 6,
    avatar: "tw:bg-violet-500",
    bar: "tw:bg-teal-500",
  },
  {
    id: "suresh",
    name: "Suresh",
    initials: "SN",
    status: "online",
    load: 6,
    capacity: 6,
    avatar: "tw:bg-red-500",
    bar: "tw:bg-red-500",
  },
];

const STATUS_STYLES: Record<RunnerStatus, string> = {
  online: "tw:bg-emerald-50 tw:text-emerald-600 tw:ring-emerald-200",
  idle: "tw:bg-slate-100 tw:text-slate-500 tw:ring-slate-200",
};

interface DeliveryRunnerLoadProps {
  className?: string;
}

/**
 * Runner load, live: each delivery runner, whether they are on the road right
 * now, and how full their bag is against what they can carry. A full bar
 * (load = capacity) reads as overloaded. Data is hardcoded until the live
 * runner feed is wired in.
 */
const DeliveryRunnerLoad = ({ className }: DeliveryRunnerLoadProps) => {
  return (
    <div className={clsx("tw:flex tw:flex-col tw:gap-3", className)}>
      <p className="tw:text-[11px] tw:font-semibold tw:tracking-widest tw:text-slate-400">
        RUNNER LOAD · LIVE
      </p>

      <ul className="tw:flex tw:flex-col tw:gap-3.5">
        {RUNNERS.map((runner) => {
          const percent = Math.min(
            100,
            Math.round((runner.load / runner.capacity) * 100),
          );

          return (
            <li key={runner.id} className="tw:flex tw:items-center tw:gap-2.5">
              <span
                aria-hidden
                className={clsx(
                  "tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-xs tw:font-bold tw:text-white",
                  runner.avatar,
                )}
              >
                {runner.initials}
              </span>

              <span className="tw:min-w-0 tw:flex-1">
                <span className="tw:flex tw:items-center tw:gap-1.5">
                  <span className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-800">
                    {runner.name}
                  </span>
                  <span
                    className={clsx(
                      "tw:shrink-0 tw:rounded-full tw:px-1.5 tw:py-px tw:text-[9px] tw:font-bold tw:tracking-wider tw:ring-1 tw:ring-inset",
                      STATUS_STYLES[runner.status],
                    )}
                  >
                    {runner.status.toUpperCase()}
                  </span>
                </span>

                <span className="tw:mt-1.5 tw:block tw:h-1.5 tw:overflow-hidden tw:rounded-full tw:bg-slate-100">
                  <span
                    role="progressbar"
                    aria-valuenow={runner.load}
                    aria-valuemin={0}
                    aria-valuemax={runner.capacity}
                    aria-label={`${runner.name} load`}
                    style={{ width: `${percent}%` }}
                    className={clsx(
                      "tw:block tw:h-full tw:rounded-full tw:transition-[width]",
                      runner.bar,
                    )}
                  />
                </span>
              </span>

              <span className="tw:shrink-0 tw:text-xs tw:font-semibold tw:tabular-nums tw:text-slate-500">
                {runner.load}/{runner.capacity}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default DeliveryRunnerLoad;
