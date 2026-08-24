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
  /** "sm" renders a tighter, lower-profile badge; "xs" is smaller still. */
  size?: "default" | "sm" | "xs";
};

/** Info glyph tracks the badge's text size so it never dominates the label. */
const infoIconSize: Record<NonNullable<Props["size"]>, number> = {
  default: 12,
  sm: 10,
  xs: 9,
};

const VendorTypeBadge: React.FC<Props> = ({
  type,
  color = "light",
  description,
  hideInfo = false,
  className = "",
  size = "default",
}) => {
  const [open, setOpen] = useState(false);

  const badge = (
    <span>
      <AppBadge variant={color as any} size={size} className={className}>
        <span className="tw:flex tw:items-center">
          <span>{type}</span>
          {!hideInfo && (
            <Info
              size={infoIconSize[size]}
              className={`tw:align-middle tw:inline-block tw:cursor-pointer ${
                size === "xs" ? "tw:ms-0.5" : "tw:ms-1"
              }`}
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
