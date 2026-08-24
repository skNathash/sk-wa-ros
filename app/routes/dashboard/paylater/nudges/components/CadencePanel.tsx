import clsx from "clsx";
import React from "react";
import AppCard from "~/components/core/card/AppCard";
import { TONE_DOT_CLASS, type CadenceStep } from "../helper";

interface CadencePanelProps {
  title: string;
  source: string;
  steps: CadenceStep[];
  note: string;
}

/**
 * The stage's schedule as a strip of dots — green while the tone is still
 * friendly, red once it turns firm, hollow where the step is switched off.
 */
const CadencePanel: React.FC<CadencePanelProps> = ({
  title,
  source,
  steps,
  note,
}) => {
  return (
    <AppCard className="tw:mb-0 tw:h-full">
      <div className="tw:mb-4 tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-gray-100 tw:pb-3">
        <h4 className="tw:text-sm tw:font-bold tw:text-gray-900">{title}</h4>
        <span className="tw:shrink-0 tw:text-[11px] tw:text-gray-400">
          {source}
        </span>
      </div>

      {/* Scrolls rather than wraps — the cadence only reads correctly in one
          unbroken left-to-right line. */}
      <div className="tw:mb-4 tw:flex tw:items-start tw:justify-center tw:gap-1 tw:overflow-x-auto thin-scrollbar tw:pb-1">
        {steps.map((step) => (
          <div
            key={step.key}
            className="tw:flex tw:w-14 tw:shrink-0 tw:flex-col tw:items-center tw:gap-1.5"
          >
            <span
              className={clsx(
                "tw:flex tw:h-10 tw:w-10 tw:items-center tw:justify-center tw:rounded-full tw:border tw:text-[11px] tw:font-semibold",
                TONE_DOT_CLASS[step.tone],
              )}
            >
              {step.key}
            </span>
            <span
              className={clsx(
                "tw:text-center tw:text-[10px] tw:leading-tight",
                step.tone === "off"
                  ? "tw:text-gray-400"
                  : "tw:font-medium tw:text-gray-700",
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <p className="tw:text-center tw:text-[11px] tw:text-gray-500">{note}</p>
    </AppCard>
  );
};

export default CadencePanel;
