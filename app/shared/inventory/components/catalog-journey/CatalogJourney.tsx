import { ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import useAppNav from "~/hooks/useAppNav";
import {
  JOURNEY_STEPS,
  defaultJourneyCounts,
  getJourneyCounts,
  type JourneyCounts,
  type JourneyStep,
} from "./helper";

/**
 * Catalogue journey strip — how many subscribed SKUs have made it through each
 * stage (Subscribed → Priced → Stocked), with the next action for each stage.
 *
 * Each count is its own request (see `helper.ts`), so the strip renders as soon
 * as the slowest one lands and a single failing stage shows 0 rather than
 * taking the row down.
 */
const StepCard: React.FC<{
  step: JourneyStep;
  value: number;
  loading: boolean;
  isLast: boolean;
  onNext: () => void;
}> = ({ step, value, loading, isLast, onNext }) => (
  <div className="tw:relative tw:flex-1 tw:border-r tw:border-gray-200 tw:px-3 tw:py-2 tw:last:border-r-0">
    <div className="tw:flex tw:items-center tw:gap-1.5">
      {/* <span
        className={`tw:flex tw:h-4 tw:w-4 tw:items-center tw:justify-center tw:rounded-full tw:text-[10px] tw:font-bold ${step.chipClass}`}
      >
        {step.step}
      </span> */}
      <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
        {step.label}
      </span>
    </div>

    {loading ? (
      <Skeleton className="tw:mt-1 tw:h-5 tw:w-16" />
    ) : (
      <div className="tw:mt-1 tw:flex tw:items-baseline tw:gap-1">
        <span
          className={`tw:text-lg tw:font-bold tw:leading-tight ${step.valueClass}`}
        >
          {value}
        </span>
        <span className="tw:text-[11px] tw:text-gray-500">SKUs</span>
      </div>
    )}

    <div className="tw:mt-0.5 tw:text-[11px] tw:text-gray-500">
      Next:{" "}
      <button
        type="button"
        onClick={onNext}
        className={`tw:cursor-pointer tw:font-semibold tw:underline-offset-2 tw:hover:underline ${step.linkClass}`}
      >
        {step.nextLabel}
      </button>
    </div>

    {/* Flow arrow between cards — desktop only, where the cards sit in a row. */}
    {!isLast && (
      <span className="tw:absolute tw:top-1/2 tw:-right-2 tw:z-10 tw:hidden tw:h-4 tw:w-4 tw:-translate-y-1/2 tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-gray-200 tw:bg-white tw:text-gray-400 tw:md:flex">
        <ChevronRight size={10} />
      </span>
    )}
  </div>
);

const CatalogJourney: React.FC<{
  className?: string;
  /** Extra seller-deal filter params applied to every stage count. */
  params?: Record<string, any>;
  /** Channel the priced count is read for — B2C by default. */
  type?: "network" | "customer";
  /** Handles the "Next:" links itself when not given. */
  onStepClick?: (step: JourneyStep) => void;
}> = ({ className = "", params, type = "customer", onStepClick }) => {
  const appNav = useAppNav();

  const [counts, setCounts] = useState<JourneyCounts>(defaultJourneyCounts);
  const [loading, setLoading] = useState(true);

  // The params object is rebuilt on every render by most callers, so the
  // effect keys off its serialised form instead of the reference.
  const paramsKey = JSON.stringify(params || {});
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useEffect(() => {
    let active = true;

    setLoading(true);
    getJourneyCounts(paramsRef.current || {}, type).then((result) => {
      if (!active) return;
      setCounts(result);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [paramsKey, type]);

  const handleNext = (step: JourneyStep) => {
    if (onStepClick) {
      onStepClick(step);
      return;
    }
    appNav.to(step.nextPath);
  };

  return (
    <div className={className}>
      <p className="tw:mb-1.5 tw:text-xs tw:text-gray-500">
        The SKUs you subscribed from <b>SK Library</b>. Each SKU moves through{" "}
        <b>Subscribed → Priced → Stocked</b>.
      </p>

      <div className="tw:grid tw:grid-cols-3 tw:overflow-hidden tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white">
        {JOURNEY_STEPS.map((step, index) => (
          <StepCard
            key={step.key}
            step={step}
            value={counts[step.key]}
            loading={loading}
            isLast={index === JOURNEY_STEPS.length - 1}
            onNext={() => handleNext(step)}
          />
        ))}
      </div>
    </div>
  );
};

export default CatalogJourney;
