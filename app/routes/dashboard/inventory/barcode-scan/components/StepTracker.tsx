import { Check, ScanLine, Search, ShoppingCart } from "lucide-react";

import type { ScanPhase } from "../helper";

type StepState = "done" | "active" | "waiting";

const STEPS = [
  { icon: ScanLine, label: "Scan" },
  { icon: Search, label: "Find" },
  { icon: ShoppingCart, label: "Add" },
];

/** Map the scan phase to the state of each of the 3 quest steps. */
const stepStates = (phase: ScanPhase): StepState[] => {
  switch (phase) {
    case "idle":
      return ["active", "waiting", "waiting"];
    case "skSearching":
    case "aiSearching":
      return ["done", "active", "waiting"];
    case "matched":
    case "suggestions":
      return ["done", "done", "active"];
    case "notFound":
      return ["done", "done", "waiting"];
  }
};

const CIRCLE: Record<StepState, string> = {
  done: "tw:bg-emerald-500 tw:text-white tw:border-emerald-500",
  active:
    "tw:bg-blue-600 tw:text-white tw:border-blue-600 tw:ring-4 tw:ring-blue-100",
  waiting: "tw:bg-white tw:text-gray-400 tw:border-gray-300",
};

const LABEL: Record<StepState, string> = {
  done: "tw:text-emerald-700",
  active: "tw:text-blue-700",
  waiting: "tw:text-gray-400",
};

interface Props {
  phase: ScanPhase;
  className?: string;
}

/**
 * Gamified 3-step "quest" tracker: Scan → Find → Add.
 * Completed steps turn green with a check, the current step pulses blue,
 * and the connector line fills up as the user progresses.
 */
const StepTracker: React.FC<Props> = ({ phase, className = "" }) => {
  const states = stepStates(phase);

  return (
    <ol
      className={`tw:flex tw:items-center tw:justify-between tw:gap-1 ${className}`}
      aria-label="Scan progress"
    >
      {STEPS.map((step, i) => {
        const state = states[i];
        const Icon = step.icon;
        const isLast = i === STEPS.length - 1;
        return (
          <li
            key={step.label}
            className={`tw:flex tw:items-center tw:gap-1 ${isLast ? "" : "tw:flex-1"}`}
          >
            <div className="tw:flex tw:flex-col tw:items-center tw:gap-0.5">
              <div
                className={`tw:flex tw:items-center tw:justify-center tw:w-9 tw:h-9 tw:rounded-full tw:border-2 tw:transition-all ${CIRCLE[state]} ${
                  state === "active" ? "tw:animate-pulse" : ""
                }`}
              >
                {state === "done" ? (
                  <Check className="tw:w-4.5 tw:h-4.5" strokeWidth={3} />
                ) : (
                  <Icon className="tw:w-4.5 tw:h-4.5" />
                )}
              </div>
              <span
                className={`tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide ${LABEL[state]}`}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className="tw:flex-1 tw:h-1 tw:rounded-full tw:bg-gray-200 tw:mx-1 tw:mb-4 tw:overflow-hidden">
                <div
                  className={`tw:h-full tw:rounded-full tw:bg-emerald-500 tw:transition-all tw:duration-500 ${
                    state === "done" ? "tw:w-full" : "tw:w-0"
                  }`}
                />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default StepTracker;
