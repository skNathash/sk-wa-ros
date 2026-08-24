import clsx from "clsx";
import { ChevronRight, Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import useAppNav from "~/hooks/useAppNav";
import {
  ATTENTION_TASKS,
  ATTENTION_TONE,
  EMPTY_ATTENTION_COUNTS,
  getAttentionCounts,
  type AttentionCounts,
  type AttentionKey,
  type AttentionTask,
} from "./helper";

/** Diagonal stripes behind the banner — a caution tape, not a solid alert. */
const STRIPES = {
  backgroundImage:
    "repeating-linear-gradient(135deg, rgba(245,158,11,0.14) 0 10px, rgba(245,158,11,0.04) 10px 20px)",
};

const TaskCard: React.FC<{
  task: AttentionTask;
  value: number;
  onSelect: () => void;
}> = ({ task, value, onSelect }) => {
  const tone = ATTENTION_TONE[task.tone];
  const Icon = task.icon;
  // Nothing pending on this gap — keep the card in place so the strip stays a
  // stable five, but drain the colour so the ones with work read first.
  const clear = value === 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={clsx(
        "tw:group tw:relative tw:flex tw:flex-1 tw:cursor-pointer tw:flex-col tw:border-b tw:border-gray-200 tw:px-4 tw:py-3 tw:transition-colors tw:last:border-b-0 tw:odd:border-r tw:md:min-w-[190px] tw:md:border-r tw:md:border-b-0 tw:md:last:border-r-0",
        clear ? "tw:hover:bg-gray-50" : tone.hover,
      )}
    >
      <div className="tw:flex tw:items-start tw:justify-between">
        <span
          className={clsx(
            "tw:flex tw:size-5 tw:items-center tw:justify-center tw:rounded-md",
            clear ? "tw:bg-gray-200 tw:text-gray-500" : tone.badge,
          )}
        >
          <Icon size={12} />
        </span>
        <ChevronRight
          size={14}
          className="tw:mt-0.5 tw:shrink-0 tw:text-gray-300 tw:transition-colors tw:group-hover:text-gray-500"
        />
      </div>

      <div
        className={clsx(
          "tw:mt-1.5 tw:text-xl tw:font-bold",
          clear ? "tw:text-gray-300" : tone.value,
        )}
      >
        {value}
      </div>

      <div
        className={clsx(
          "tw:mt-0.5 tw:text-xs tw:font-semibold",
          clear ? "tw:text-gray-500" : "tw:text-gray-800",
        )}
      >
        {task.title}
      </div>
      <div
        className={clsx(
          "tw:mt-0.5 tw:text-[11px]",
          clear ? "tw:text-gray-400" : "tw:text-gray-500",
        )}
      >
        {task.hint}
      </div>

      {/* mt-auto on the wrapper, not the pill, so every card's action sits on
          the same baseline however tall the hint above it runs. */}
      <div className="tw:mt-auto tw:pt-2">
        <span
          className={clsx(
            "tw:inline-flex tw:items-center tw:gap-1 tw:rounded-md tw:px-2 tw:py-1 tw:text-[11px] tw:font-semibold tw:ring-1 tw:transition-colors",
            clear
              ? "tw:bg-gray-50 tw:text-gray-500 tw:ring-gray-200 tw:hover:bg-gray-100"
              : tone.action,
          )}
        >
          {task.actionLabel} →
        </span>
      </div>
    </div>
  );
};

const CardSkeleton = () => (
  <div className="tw:flex tw:flex-1 tw:flex-col tw:border-b tw:border-gray-200 tw:px-4 tw:py-3 tw:last:border-b-0 tw:odd:border-r tw:md:min-w-[190px] tw:md:border-r tw:md:border-b-0 tw:md:last:border-r-0">
    <span className="tw:block tw:size-5 tw:animate-pulse tw:rounded-md tw:bg-gray-100" />
    <span className="tw:mt-2 tw:block tw:h-6 tw:w-10 tw:animate-pulse tw:rounded tw:bg-gray-100" />
    <span className="tw:mt-2 tw:block tw:h-3 tw:w-2/3 tw:animate-pulse tw:rounded tw:bg-gray-100" />
    <span className="tw:mt-1.5 tw:block tw:h-2.5 tw:w-4/5 tw:animate-pulse tw:rounded tw:bg-gray-100" />
    <div className="tw:mt-auto tw:pt-2">
      <span className="tw:block tw:h-6 tw:w-20 tw:animate-pulse tw:rounded-md tw:bg-gray-100" />
    </div>
  </div>
);

interface NeedsAttentionProps {
  className?: string;
  /** Extra seller-deal filter params applied to every count. */
  params?: Record<string, any>;
  /** Channel the "no price set" count is read for — B2C by default. */
  type?: "network" | "customer";
  /**
   * Fired on card tap. Handles the navigation itself when not given — useful
   * when the host page already renders the destination view (the analytics
   * dashboard switches tabs instead of navigating away).
   */
  onTaskClick?: (task: AttentionTask, count: number) => void;
  /** Drop the whole strip once every count is zero. */
  hideWhenClear?: boolean;
}

/**
 * "Needs attention" strip — the SKUs stuck at a gap the seller has to clear:
 * no price set, no stock added, near expiry, slow movers and out of stock.
 *
 * Each count comes from the endpoint that already owns it (pricing from the
 * price-comparison summary, stock entry from the seller-deal list, the rest
 * from the inventory dashboard — see `helper.ts`), settled independently so a
 * single failing endpoint shows 0 rather than taking the strip down. All five
 * cards stay on screen whatever the counts — the ones at zero are greyed out so
 * the layout never shifts and a cleared gap is still visible as cleared.
 */
const NeedsAttention: React.FC<NeedsAttentionProps> = ({
  className = "",
  params,
  type = "customer",
  onTaskClick,
  hideWhenClear = true,
}) => {
  const appNav = useAppNav();

  const [counts, setCounts] = useState<AttentionCounts>(EMPTY_ATTENTION_COUNTS);
  const [loading, setLoading] = useState(true);

  // Most callers rebuild `params` on every render, so the effect keys off its
  // serialised form instead of the object reference.
  const paramsKey = JSON.stringify(params || {});
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setLoading(true);
    getAttentionCounts(paramsRef.current || {}, type, controller.signal).then(
      (result) => {
        if (!active) return;
        setCounts(result);
        setLoading(false);
      },
    );

    return () => {
      active = false;
      controller.abort();
    };
  }, [paramsKey, type]);

  const handleSelect = (task: AttentionTask) => {
    if (onTaskClick) {
      onTaskClick(task, counts[task.key]);
      return;
    }
    appNav.to(task.path, task.query);
  };

  const total = ATTENTION_TASKS.reduce(
    (sum, task) => sum + counts[task.key],
    0,
  );

  if (!loading && total === 0 && hideWhenClear) return null;

  return (
    <div
      className={clsx(
        "tw:overflow-hidden tw:rounded-xl tw:border tw:border-amber-200 tw:bg-white",
        className,
      )}
    >
      <div
        className="tw:flex tw:items-center tw:gap-3 tw:border-b tw:border-amber-200 tw:px-4 tw:py-3"
        style={STRIPES}
      >
        <span className="tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-amber-500 tw:text-white">
          <Info size={16} />
        </span>
        <div className="tw:min-w-0">
          <p className="tw:text-xs tw:font-semibold tw:text-gray-900">
            Needs attention
            {!loading && total > 0 ? (
              <>
                {" · "}
                {total} {total === 1 ? "SKU" : "SKUs"} waiting on you
              </>
            ) : null}
          </p>
          <p className="tw:text-[11px] tw:text-gray-600">
            Clear these to keep the subscribed pipeline moving.
          </p>
        </div>
      </div>

      <div className="tw:grid tw:grid-cols-2 tw:md:flex tw:md:flex-row tw:md:overflow-x-auto">
        {loading
          ? [0, 1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)
          : ATTENTION_TASKS.map((task) => (
              <TaskCard
                key={task.key}
                task={task}
                value={counts[task.key]}
                onSelect={() => handleSelect(task)}
              />
            ))}
      </div>
    </div>
  );
};

export default NeedsAttention;
export type { AttentionTask, AttentionKey };
