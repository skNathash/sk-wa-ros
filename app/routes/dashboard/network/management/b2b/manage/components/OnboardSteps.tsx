import clsx from "clsx";
import { Check } from "lucide-react";

interface OnboardStepsProps {
  steps: { key: string; title: string; description: string }[];
  /** Index of the step the form is on. */
  activeStep: number;
  /** Jump back to an already-completed step; forward jumps are blocked so the
   *  form can't skip its own validation. */
  onStepSelect?: (step: number) => void;
  className?: string;
}

/**
 * The create-retailer flow as a side-pane checklist — the pane's answer to
 * "how much is left". Mirrors the stepper in the main column so the theme-2
 * split layout has something scoped to this page beside the section jumps.
 */
const OnboardSteps = ({
  steps,
  activeStep,
  onStepSelect,
  className,
}: OnboardStepsProps) => {
  return (
    <div className={className}>
      <p
        className="tw:px-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        Onboarding steps
      </p>

      <div className="tw:mt-2 tw:flex tw:flex-col tw:gap-2 tw:rounded-xl tw:bg-white tw:p-2 tw:ring-1 tw:ring-slate-100">
        {steps.map((step, index) => {
          const done = index < activeStep;
          const active = index === activeStep;
          const canJump = done && !!onStepSelect;

          return (
            <button
              key={step.key}
              type="button"
              disabled={!canJump}
              onClick={() => canJump && onStepSelect(index)}
              className={clsx(
                "tw:flex tw:w-full tw:items-center tw:gap-3 tw:rounded-lg tw:p-2.5 tw:text-left tw:transition-colors",
                active ? "tw:bg-slate-100" : "tw:bg-slate-50",
                canJump && "tw:cursor-pointer tw:hover:bg-slate-100",
              )}
            >
              <span
                className={clsx(
                  "tw:flex tw:size-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:text-sm tw:font-semibold",
                  done
                    ? "tw:bg-emerald-600 tw:text-white"
                    : active
                      ? "tw:bg-slate-900 tw:text-white"
                      : "tw:bg-white tw:text-slate-500",
                )}
              >
                {done ? <Check size={16} /> : index + 1}
              </span>
              <span className="tw:min-w-0 tw:flex-1">
                <span className="tw:block tw:truncate tw:text-sm tw:font-semibold tw:text-slate-800">
                  {step.title}
                </span>
                <span className="tw:block tw:truncate tw:text-xs tw:text-slate-500">
                  {step.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default OnboardSteps;
