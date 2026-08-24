import clsx from "clsx";
import { Check } from "lucide-react";

export type ReviewStepKey = 1 | 2 | 3;

export const REVIEW_STEPS: Array<{ key: ReviewStepKey; title: string }> = [
  { key: 1, title: "Review request" },
  { key: 2, title: "KYC & trust" },
  { key: 3, title: "Set limit + decide" },
];

type Props = {
  activeStep: ReviewStepKey;
  /** Steps already visited can be jumped back to; forward moves stay on the footer. */
  onStepClick?: (step: ReviewStepKey) => void;
};

/**
 * The three-stage rail. On wide screens every stage keeps its label and the
 * connectors between them; on phones the labels would wrap into an unreadable
 * stack, so it collapses to the active title plus a progress bar.
 */
const ReviewSteps = ({ activeStep, onStepClick }: Props) => {
  const active = REVIEW_STEPS.find((s) => s.key === activeStep);

  return (
    <div className="tw:border-b tw:border-gray-200 tw:bg-gray-50">
      {/* Mobile: title + progress */}
      <div className="tw:px-4 tw:py-2.5 tw:md:hidden">
        <div className="tw:flex tw:items-center tw:justify-between tw:mb-1.5">
          <span className="tw:text-sm tw:font-semibold tw:text-gray-900">
            {active?.title}
          </span>
          <span className="tw:text-[11px] tw:text-gray-500">
            Step {activeStep} of {REVIEW_STEPS.length}
          </span>
        </div>
        <div className="tw:flex tw:gap-1">
          {REVIEW_STEPS.map((step) => (
            <span
              key={step.key}
              className={clsx(
                "tw:h-1 tw:flex-1 tw:rounded-full tw:transition-colors",
                step.key <= activeStep ? "tw:bg-emerald-600" : "tw:bg-gray-200",
              )}
            />
          ))}
        </div>
      </div>

      {/* Desktop: full rail */}
      <div className="tw:hidden tw:md:flex tw:items-center tw:gap-3 tw:px-5 tw:py-3">
        {REVIEW_STEPS.map((step, idx) => {
          const isDone = step.key < activeStep;
          const isActive = step.key === activeStep;
          const canJump = isDone && !!onStepClick;

          return (
            <div key={step.key} className="tw:flex tw:items-center tw:gap-3">
              {idx > 0 && (
                <span
                  className={clsx(
                    "tw:h-px tw:w-10 tw:lg:w-16",
                    step.key <= activeStep
                      ? "tw:bg-emerald-600"
                      : "tw:bg-gray-300",
                  )}
                />
              )}
              <button
                type="button"
                disabled={!canJump}
                onClick={() => canJump && onStepClick?.(step.key)}
                className={clsx(
                  "tw:flex tw:items-center tw:gap-2",
                  canJump ? "tw:cursor-pointer" : "tw:cursor-default",
                )}
              >
                <span
                  className={clsx(
                    "tw:inline-flex tw:h-6 tw:w-6 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-[11px] tw:font-bold",
                    isDone && "tw:bg-emerald-600 tw:text-white",
                    isActive && "tw:bg-gray-900 tw:text-white",
                    !isDone &&
                      !isActive &&
                      "tw:bg-gray-100 tw:text-gray-500 tw:border tw:border-gray-300",
                  )}
                >
                  {isDone ? <Check size={13} /> : step.key}
                </span>
                <span
                  className={clsx(
                    "tw:text-sm tw:whitespace-nowrap",
                    isDone && "tw:text-emerald-700 tw:font-medium",
                    isActive && "tw:text-gray-900 tw:font-semibold",
                    !isDone && !isActive && "tw:text-gray-500",
                  )}
                >
                  {step.title}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReviewSteps;
