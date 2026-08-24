import AppPopover from "~/components/core/popover/AppPopover";
import React, { useState } from "react";
import type { FC } from "react";

type Props = {
  areas: string[];
  className?: string;
};

const LocationsListPopover: FC<Props> = ({ areas = [], className = "" }) => {
  const [open, setOpen] = useState(false);

  if (!areas || areas.length === 0) return null;

  const visible = areas.slice(0, 2);
  const remaining = areas.length - visible.length;

  return (
    <div className={`tw:flex tw:items-center tw:gap-1 ${className}`}>
      {visible.map((a, i) => (
        <span
          key={i}
          className="tw:inline-flex tw:px-1.5 tw:rounded tw:bg-blue-50 tw:text-blue-600 tw:text-[11px] tw:font-semibold tw:leading-5 tw:truncate tw:max-w-[110px]"
        >
          {a}
        </span>
      ))}

      {remaining > 0 ? (
        <AppPopover
          open={open}
          onOpenChange={(v) => setOpen(v)}
          align="start"
          side="top"
          sideOffset={8}
          contentClassName="tw:max-h-48 tw:overflow-auto tw:p-2"
          triggerContent={
            <button
              type="button"
              className="tw:inline-flex tw:px-1.5 tw:rounded tw:bg-gray-100 tw:text-gray-700 tw:text-[11px] tw:font-semibold tw:leading-5 tw:cursor-pointer"
              onClick={() => setOpen((s) => !s)}
            >
              +{remaining} more
            </button>
          }
        >
          <div className="tw:flex tw:flex-col tw:space-y-1">
            {areas.map((area, idx) => (
              <div
                key={idx}
                className="tw:inline-flex tw:px-2 tw:py-1 tw:rounded tw:bg-white tw:text-gray-700 tw:text-[13px] tw:font-medium tw:border tw:border-gray-100"
              >
                {area}
              </div>
            ))}
          </div>
        </AppPopover>
      ) : null}
    </div>
  );
};

export default LocationsListPopover;
