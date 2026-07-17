import { CircleAlert } from "lucide-react";
import AppPopover from "~/components/core/popover/AppPopover";

const OtpNotVerifiedPopover = () => {
  return (
    <AppPopover
      side="top"
      triggerContent={
        <span className="tw:inline-flex tw:items-center tw:justify-center tw:rounded tw:bg-orange-50 tw:text-orange-700 tw:border tw:border-orange-200 tw:w-5 tw:h-5">
          <CircleAlert size={14} />
        </span>
      }
    >
      <div className="tw:text-sm tw:max-w-[240px]">
        <div className="tw-font-medium tw:text-orange-800">
          OTP not verified
        </div>
        <div className="tw:text-gray-600 tw:text-sm">
          Vendor's mobile OTP is not verified.
        </div>
      </div>
    </AppPopover>
  );
};

export default OtpNotVerifiedPopover;
