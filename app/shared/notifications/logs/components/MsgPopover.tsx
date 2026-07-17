import { ArrowRight } from "lucide-react";
import AppPopover from "~/components/core/popover/AppPopover";

const MsgPopover = ({
  message,
  label = "View Message",
}: {
  message: string;
  label?: string;
}) => {
  return (
    <AppPopover
      triggerContent={
        <span className="tw:text-xs tw:text-primary tw:cursor-pointer tw:flex tw:items-center tw:gap-1">
          {label}
          <ArrowRight size={12} />
        </span>
      }
    >
      <div className="tw:text-xs tw:font-semibold tw:mb-1">Message</div>
      <div className="tw:text-xs tw:text-gray-700 tw:whitespace-pre-wrap">
        {message}
      </div>
    </AppPopover>
  );
};

export default MsgPopover;
