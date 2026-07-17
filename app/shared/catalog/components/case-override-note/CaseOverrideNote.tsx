import AppPopover from "~/components/core/popover/AppPopover";
import { CircleQuestionMark } from "lucide-react";

const CaseOverrideNote = () => {
  return (
    <AppPopover
      triggerContent={
        <CircleQuestionMark className="tw:w-4 tw:h-4 tw:text-gray-500" />
      }
    >
      <div className="tw:text-xs tw:text-gray-500">
        Override to units allows selling in unit quantity even when stock is
        low.
      </div>
    </AppPopover>
  );
};

export default CaseOverrideNote;
