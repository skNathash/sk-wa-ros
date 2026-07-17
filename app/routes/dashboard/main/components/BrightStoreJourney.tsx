import { ChevronRight, Headphones } from "lucide-react";
import { journey } from "../data";

/**
 * Onboarding progress card ("Your Bright Store Journey").
 * Dark green gradient with a circular progress ring and a segmented bar.
 */
const BrightStoreJourney = () => {
  const { title, step, totalSteps, headline, nextLabel, meta, reward } = journey;
  const pct = Math.round((step / totalSteps) * 100);
  const ringStyle = {
    background: `conic-gradient(var(--color-emerald-400) ${pct}%, rgba(255,255,255,0.15) ${pct}% 100%)`,
  };

  return (
    <button
      type="button"
      className="tw:group tw:relative tw:w-full tw:overflow-hidden tw:rounded-2xl tw:bg-linear-to-br tw:from-emerald-900 tw:via-emerald-800 tw:to-teal-800 tw:p-4 tw:md:p-5 tw:text-left tw:shadow-sm"
    >
      <div className="tw:absolute tw:-right-10 tw:-top-10 tw:h-40 tw:w-40 tw:rounded-full tw:bg-white/10 tw:blur-2xl" />

      <div className="tw:relative tw:flex tw:items-center tw:justify-between">
        <span className="tw:inline-flex tw:items-center tw:rounded-full tw:bg-white/10 tw:px-2.5 tw:py-1 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-emerald-100">
          {title}
        </span>
        <span className="tw:inline-flex tw:items-center tw:gap-0.5 tw:text-xs tw:font-medium tw:text-emerald-100/80">
          Tap to open
          <ChevronRight className="tw:h-3.5 tw:w-3.5 tw:transition-transform tw:group-hover:translate-x-0.5" />
        </span>
      </div>

      <div className="tw:relative tw:mt-3 tw:flex tw:items-start tw:gap-4">
        <div
          className="tw:flex tw:h-16 tw:w-16 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full"
          style={ringStyle}
        >
          <div className="tw:flex tw:h-12 tw:w-12 tw:items-center tw:justify-center tw:rounded-full tw:bg-emerald-950 tw:text-sm tw:font-bold tw:text-white">
            {step}/{totalSteps}
          </div>
        </div>

        <div className="tw:min-w-0 tw:flex-1">
          <p className="tw:text-base tw:font-bold tw:leading-snug tw:text-white">
            {headline}
          </p>
          <p className="tw:mt-1 tw:text-xs tw:font-medium tw:text-emerald-200/70">
            Next
          </p>
          <p className="tw:text-sm tw:font-medium tw:leading-snug tw:text-emerald-50">
            {nextLabel}
          </p>
        </div>
      </div>

      <div className="tw:relative tw:mt-4 tw:flex tw:items-center tw:gap-3">
        <div className="tw:flex tw:flex-1 tw:gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={`tw:h-1.5 tw:flex-1 tw:rounded-full ${
                i < step
                  ? "tw:bg-amber-400"
                  : i === step
                    ? "tw:bg-emerald-400"
                    : "tw:bg-white/15"
              }`}
            />
          ))}
        </div>
        <span className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:bg-amber-400/20 tw:px-2 tw:py-0.5 tw:text-[11px] tw:font-semibold tw:text-amber-300">
          <Headphones className="tw:h-3 tw:w-3" />+{reward}
        </span>
      </div>

      <p className="tw:relative tw:mt-2 tw:text-[11px] tw:text-emerald-200/70">
        {meta}
      </p>
    </button>
  );
};

export default BrightStoreJourney;
