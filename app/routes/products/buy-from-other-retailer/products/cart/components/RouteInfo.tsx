import { format, parseISO } from "date-fns";
import { RefreshCw, Truck, Calendar, X } from "lucide-react";
import React, { useState } from "react";
import AppPopover from "~/components/core/popover/AppPopover";
import RouteChooseModal from "../modals/RouteChooseModal";
import type { RouteInfo as IRouteInfo } from "../types";

interface RouteInfoProps {
  routeInfo: IRouteInfo;
  selectedRoute?: {
    routeId?: string;
    routeRefId?: string;
    deliveryDate?: string;
    routeCode?: string;
    description?: string;
  };
  cartId: string;
  onUpdateRoute: (data: {
    cartId: string;
    routeId?: string;
    routeRefId?: string;
    deliveryDate?: string;
    routeCode?: string;
    description?: string;
  }) => void;
}

const RouteInfo: React.FC<RouteInfoProps> = ({
  routeInfo,
  selectedRoute,
  cartId,
  onUpdateRoute,
}) => {
  const [showChooseModal, setShowChooseModal] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  if (!routeInfo) return null;

  // Use values only from selectedRoute when present — do not fallback to routeInfo
  const currentRouteId = selectedRoute?.routeId;
  const currentRouteRefId = selectedRoute?.routeRefId;
  const currentDescription = selectedRoute?.description;
  const currentDeliveryDate = selectedRoute?.deliveryDate;
  const currentRouteCode = selectedRoute?.routeCode;

  const parentRoutes =
    routeInfo.isParentRoute && Array.isArray(routeInfo.parentRoutes)
      ? routeInfo.parentRoutes
      : [];

  const handleModalCallback = (p: { action: string; data?: any }) => {
    if (p.action === "close") {
      setShowChooseModal(false);
      return;
    }
    if (p.action === "confirm") {
      const data = p.data || {};
      const pickedRoute = data.routeInfo;
      const nextDelivery = data.selectedNextDelivery;

      onUpdateRoute({
        cartId,
        routeId: pickedRoute?._id,
        routeRefId: pickedRoute?.routeRefId || pickedRoute?.routeId,
        deliveryDate: nextDelivery?.nextDate || pickedRoute?.deliveryDate,
        routeCode: pickedRoute?.routeCode,
        description: pickedRoute?.description,
      });
      setShowChooseModal(false);
    }
  };

  const handleSelectDate = (date: string) => {
    onUpdateRoute({
      cartId,
      routeId: currentRouteId,
      routeRefId: currentRouteRefId,
      deliveryDate: date,
      routeCode: currentRouteCode,
      description: currentDescription,
    });
    setIsPopoverOpen(false);
  };

  // Find next delivery dates from the current route if it's in parentRoutes
  // Or just from routeInfo if it's the current one
  // Only expose next delivery dates when a selectedRoute exists.
  let availableNextDates: any[] = [];
  if (selectedRoute) {
    availableNextDates = routeInfo.nextDeliveryDates || [];
    if (parentRoutes.length > 0) {
      const activeParent = parentRoutes.find(
        (r) => (r.routeId || r._id) === currentRouteId,
      );
      if (activeParent && activeParent.nextDeliveryDates) {
        availableNextDates = activeParent.nextDeliveryDates;
      }
    }
  }

  return (
    <div className="tw:bg-gray-50 tw:px-3 tw:py-1.5 tw:border-b tw:border-gray-200">
      {/* Row 1: route label+code (left) | date picker (right) */}
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
        <div className="tw:flex tw:items-center tw:gap-1 tw:min-w-0">
          <span className="tw:text-[8px] tw:text-gray-400 tw:uppercase tw:font-semibold tw:tracking-wide tw:shrink-0">
            Delivery Route
          </span>
          <Truck className="tw:w-3 tw:h-3 tw:text-gray-400 tw:shrink-0" />
          {currentRouteRefId ? (
            <span className="tw:text-[10px] tw:text-gray-700 tw:font-bold tw:shrink-0">
              {currentRouteRefId}
            </span>
          ) : parentRoutes.length > 0 ? (
            <span className="tw:text-[10px] tw:text-gray-500 tw:font-semibold tw:shrink-0">
              No route selected
            </span>
          ) : (
            <span className="tw:text-[10px] tw:text-gray-700 tw:font-bold tw:shrink-0">
              {currentRouteRefId}
            </span>
          )}
        </div>

        {Array.isArray(availableNextDates) && availableNextDates.length > 0 && (
          <AppPopover
            open={isPopoverOpen}
            onOpenChange={setIsPopoverOpen}
            align="end"
            triggerContent={
              <button
                type="button"
                className="tw:flex tw:items-center tw:gap-1 tw:text-[10px] tw:border tw:border-gray-300 tw:px-2 tw:py-1 tw:rounded-md tw:bg-white tw:font-bold hover:tw:border-gray-400 tw:shadow-sm tw:shrink-0"
              >
                <Calendar className="tw:w-3 tw:h-3 tw:text-gray-400" />
                <span>
                  {currentDeliveryDate
                    ? format(parseISO(currentDeliveryDate), "EEE dd MMM")
                    : "Select date"}
                </span>
                <span className="tw:text-[8px] tw:text-gray-400">▼</span>
              </button>
            }
          >
            <div className="tw:max-h-60 tw:overflow-y-auto tw:py-1 tw:w-48">
              <div>
                <span className="tw:text-xs tw:text-gray-500 tw:uppercase tw:font-bold tw:mb-1 tw:block">
                  Available Delivery Dates
                </span>
              </div>
              {availableNextDates.map((d: any) => {
                const date = d.nextDate || d.deliveryDate || d.date;
                const dayShort = date
                  ? format(parseISO(date), "EEE")
                  : d.day || d.deliveryDay;
                const isSelected = currentDeliveryDate === date;
                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => handleSelectDate(date)}
                    className={`tw:w-full tw:text-left tw:px-3 tw:py-2.5 hover:tw:bg-gray-50 tw:transition-colors ${
                      isSelected ? "tw:bg-primary/5 tw:text-primary" : ""
                    }`}
                  >
                    <div className="tw:text-xs tw:font-bold">{dayShort}</div>
                    <div
                      className={`tw:text-[11px] ${isSelected ? "tw:text-primary/70" : "tw:text-gray-500"}`}
                    >
                      {format(parseISO(date), "dd MMM yyyy")}
                    </div>
                  </button>
                );
              })}
            </div>
          </AppPopover>
        )}
      </div>

      {/* Row 2: description (left) | Change + Remove (right) */}
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:mt-1.5">
        <div className="tw:text-[11px] tw:text-gray-900 tw:font-semibold tw:truncate tw:leading-tight tw:flex-1 tw:min-w-0">
          {currentDescription ??
            (parentRoutes.length > 0 && !currentRouteId
              ? "No route selected"
              : "")}
        </div>

        {parentRoutes.length > 0 && (
          <div className="tw:shrink-0 tw:flex tw:items-center tw:gap-2">
            <button
              type="button"
              onClick={() => setShowChooseModal(true)}
              className="tw:flex tw:items-center tw:gap-1 tw:text-[10px] tw:text-primary tw:font-semibold hover:tw:text-primary/80 tw:transition-colors tw:border tw:border-primary/20 tw:rounded tw:px-1.5 tw:py-0.5 tw:bg-white"
            >
              <RefreshCw className="tw:w-2.5 tw:h-2.5" />
              <span>{currentRouteId ? "Change" : "Choose"}</span>
            </button>
            {currentRouteId && (
              <button
                type="button"
                onClick={() =>
                  onUpdateRoute({
                    cartId,
                    routeId: undefined,
                    routeRefId: undefined,
                    deliveryDate: undefined,
                    routeCode: undefined,
                    description: undefined,
                  })
                }
                className="tw:flex tw:items-center tw:gap-1 tw:text-[10px] tw:text-red-500 tw:font-semibold hover:tw:text-red-600 tw:transition-colors tw:border tw:border-red-200 tw:rounded tw:px-1.5 tw:py-0.5 tw:bg-white"
              >
                <X className="tw:w-2.5 tw:h-2.5" />
                <span>Remove</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Route choose modal */}
      {parentRoutes.length > 0 && (
        <RouteChooseModal
          show={showChooseModal}
          callback={handleModalCallback}
          data={parentRoutes}
          initialRouteRefId={selectedRoute?.routeId ?? null}
          initialSelectedNextDate={selectedRoute?.deliveryDate ?? null}
        />
      )}
    </div>
  );
};

export default RouteInfo;
