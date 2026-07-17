import AppPopover from "~/components/core/popover/AppPopover";
import { CircleQuestionMark } from "lucide-react";

const AllowUnitDescPopover = () => {
  return (
    <AppPopover
      triggerContent={
        <CircleQuestionMark className="tw:text-gray-400" size={12} />
      }
    >
      <div className="tw:text-xs tw:text-gray-500">
        Override to units allows selling in unit quantity even when stock is
        low.
      </div>
    </AppPopover>
  );
};

export default AllowUnitDescPopover;
