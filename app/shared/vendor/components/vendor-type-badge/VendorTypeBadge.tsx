import React, { useState } from "react";
import AppPopover from "~/components/core/popover/AppPopover";
import AppBadge from "~/components/core/badge/AppBadge";
import { Info, X } from "lucide-react";

type Props = {
  type: string | React.ReactNode;
  color?: string;
  description?: string | React.ReactNode;
  hideInfo?: boolean;
  className?: string;
};

const VendorTypeBadge: React.FC<Props> = ({
  type,
  color = "light",
  description,
  hideInfo = false,
  className = "",
}) => {
  const [open, setOpen] = useState(false);

  const badge = (
    <span>
      <AppBadge variant={color as any} className={className}>
        <span className="tw:flex tw:items-center">
          <span>{type}</span>
          {!hideInfo && (
            <Info
              size={12}
              className="tw:align-middle tw:inline-block tw:ms-1 tw:cursor-pointer"
            />
          )}
        </span>
      </AppBadge>
    </span>
  );

  if (description && !hideInfo) {
    return (
      <AppPopover triggerContent={badge} open={open} onOpenChange={setOpen}>
        <div className="tw:relative">
          <button onClick={() => setOpen(!open)}>
            <X size={14} className="tw:absolute tw:top-2 tw:right-2" />
          </button>

          <div className="tw:md:text-xs tw:text-sm tw:font-semibold">
            What is {type}?
          </div>
          <div className="tw:max-w-xs tw:md:text-xs tw:text-sm tw:text-gray-700">
            {description}
          </div>
        </div>
      </AppPopover>
    );
  }

  return badge;
};

export default VendorTypeBadge;
