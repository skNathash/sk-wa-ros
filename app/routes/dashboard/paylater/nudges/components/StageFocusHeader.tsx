import clsx from "clsx";
import React from "react";
import { STAGE_TONES, type NudgeStage } from "../helper";

interface StageFocusHeaderProps {
  stage: NudgeStage;
}

/** The band that names the stage the three panels below are showing. */
const StageFocusHeader: React.FC<StageFocusHeaderProps> = ({ stage }) => {
  const tone = STAGE_TONES[stage.key];

  return (
    <div className="tw:mb-3 tw:flex tw:items-start tw:gap-2 tw:sm:items-center">
      <span
        className={clsx(
          "tw:flex tw:h-7 tw:w-7 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-xs tw:font-bold tw:text-white",
          tone.badge,
        )}
      >
        {stage.step}
      </span>

      <div className="tw:flex tw:min-w-0 tw:flex-col tw:gap-y-0.5 tw:sm:flex-row tw:sm:items-center tw:sm:gap-x-2">
        <h3 className="tw:text-base tw:font-bold tw:text-gray-900">
          {stage.name}
        </h3>

        <p className="tw:min-w-0 tw:text-xs tw:text-gray-500">
          <span className="tw:hidden tw:sm:inline">· </span>
          {stage.focusNote}
        </p>
      </div>
    </div>
  );
};

export default StageFocusHeader;
