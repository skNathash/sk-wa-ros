import React, { useState } from "react";
import { Info } from "lucide-react";
import AppPopover from "~/components/core/popover/AppPopover";
import { cn } from "~/lib/utils";

interface RoutePopoverProps {
  route: any;
  isActive?: boolean;
}

const RoutePopover = ({ route, isActive }: RoutePopoverProps) => {
  const [open, setOpen] = useState(false);

  if (!route) return null;

  return (
    <AppPopover
      open={open}
      onOpenChange={(open) => setOpen(open)}
      triggerContent={
        <div
          role="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((prev) => !prev);
          }}
          className="tw:flex tw:items-center tw:justify-center"
        >
          <Info
            size={14}
            className={cn(
              "hover:tw:opacity-80 tw:transition-opacity",
              isActive ? "tw:text-white/80" : "tw:text-gray-400",
            )}
          />
        </div>
      }
    >
      <div className="tw:p-2 tw:max-w-xs tw:text-left">
        <div className="tw:font-medium tw:text-sm tw:mb-2">
          {route.description || route.routeCode}
        </div>
        <div className="tw:flex tw:flex-col tw:gap-2">
          <div>
            <span className="tw:text-xs tw:text-gray-500">Delivery Days:</span>
            <div className="tw:flex tw:flex-wrap tw:gap-1 tw:mt-1">
              {route.deliveryDays && route.deliveryDays.length > 0 ? (
                route.deliveryDays.map((day: string, idx: number) => (
                  <span
                    key={idx}
                    className="tw:inline-flex tw:px-2 tw:py-0.5 tw:rounded tw:bg-gray-100 tw:text-gray-700 tw:text-[10px] tw:font-bold tw:border tw:border-gray-200/50"
                  >
                    {day.substring(0, 3)}
                  </span>
                ))
              ) : (
                <span className="tw:text-xs tw:text-gray-400">Not set</span>
              )}
            </div>
          </div>
          <div>
            <span className="tw:text-xs tw:text-gray-500">Areas:</span>
            <div className="tw:flex tw:flex-wrap tw:gap-1 tw:mt-1">
              {route.areas && route.areas.length > 0 ? (
                route.areas.map((area: string, idx: number) => (
                  <span
                    key={idx}
                    className="tw:inline-flex tw:px-2 tw:py-0.5 tw:rounded tw:bg-blue-50 tw:text-blue-600 tw:text-[10px] tw:font-medium tw:border tw:border-blue-100/50"
                  >
                    {area}
                  </span>
                ))
              ) : (
                <span className="tw:text-xs tw:text-gray-400">No areas</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppPopover>
  );
};

export default RoutePopover;
