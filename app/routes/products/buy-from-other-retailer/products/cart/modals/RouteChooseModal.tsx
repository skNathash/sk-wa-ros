import React, { useEffect, useMemo, useState } from "react";
import AppModal from "~/components/core/modal/AppModal";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import AppButton from "~/components/core/button/AppButton";
import { MapPin, Calendar, Truck, Info } from "lucide-react";
import DateFormat from "~/components/core/date/DateFormat";

type NextDelivery = {
  day?: string;
  nextDate?: string;
};

type RouteInfo = {
  routeId?: string;
  routeRefId?: string;
  routeCode?: string;
  description?: string;
  deliveryDay?: string;
  deliveryDate?: string;
  isRoutePlanned?: boolean;
  nextDeliveryDates?: NextDelivery[];
  isParentRoute?: boolean;
  parentRoutes?: any[];
  areas?: string[];
  _id?: string;
};

type Props = {
  show: boolean;
  callback: (p: { action: string; data?: any }) => void;
  data?: any;
  // optional initial selection: route id/ref and nextDate string
  initialRouteRefId?: string | null;
  initialSelectedNextDate?: string | null;
};

const RouteChooseModal: React.FC<Props> = ({
  show,
  callback,
  data,
  initialRouteRefId,
  initialSelectedNextDate,
}) => {
  const routes: RouteInfo[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data as RouteInfo[];
    if (Array.isArray(data.routeInfo)) return data.routeInfo as RouteInfo[];
    if (data.routeInfo && typeof data.routeInfo === "object")
      return [data.routeInfo as RouteInfo];
    // fallback: maybe data itself is a single route
    if (typeof data === "object") return [data as RouteInfo];
    return [];
  }, [data]);

  const [activeRouteIdx, setActiveRouteIdx] = useState<number>(0);
  const activeRoute = routes[activeRouteIdx] ?? null;

  // selected next delivery (one only)
  const [selectedNextDelivery, setSelectedNextDelivery] =
    useState<NextDelivery | null>(null);

  // prepare default selection when modal is opened
  useEffect(() => {
    if (!show) return;
    if (routes && routes.length > 0) {
      // find index using initialRouteRefId if provided
      let idx = 0;
      if (initialRouteRefId) {
        const found = routes.findIndex(
          (r) =>
            r.routeRefId === initialRouteRefId ||
            r.routeId === initialRouteRefId ||
            r._id === initialRouteRefId,
        );
        if (found >= 0) idx = found;
      }

      setActiveRouteIdx(idx);
      const chosen = routes[idx];

      // determine selected next delivery: prefer provided initialSelectedNextDate, then route.deliveryDate, then first nextDeliveryDates
      if (
        initialSelectedNextDate &&
        chosen &&
        Array.isArray(chosen.nextDeliveryDates)
      ) {
        const match = chosen.nextDeliveryDates.find((nd: any) => {
          const d = nd.nextDate || nd.deliveryDate || nd.date;
          return d === initialSelectedNextDate;
        });
        if (match) {
          setSelectedNextDelivery(match);
          return;
        }
      }

      if (chosen && chosen.deliveryDate) {
        setSelectedNextDelivery({
          nextDate: chosen.deliveryDate,
          day: chosen.deliveryDay,
        });
      } else if (
        chosen &&
        Array.isArray(chosen.nextDeliveryDates) &&
        chosen.nextDeliveryDates.length > 0
      ) {
        setSelectedNextDelivery(chosen.nextDeliveryDates[0]);
      } else {
        setSelectedNextDelivery(null);
      }
    } else {
      setActiveRouteIdx(0);
      setSelectedNextDelivery(null);
    }
  }, [show, routes, initialRouteRefId, initialSelectedNextDate]);

  // handle route selection: prepare default next delivery and request details
  const handleSelectRoute = (idx: number) => {
    setActiveRouteIdx(idx);
    const r = routes[idx];
    if (
      r &&
      Array.isArray(r.nextDeliveryDates) &&
      r.nextDeliveryDates.length > 0
    ) {
      setSelectedNextDelivery(r.nextDeliveryDates[0]);
    } else {
      setSelectedNextDelivery(null);
    }
  };

  const handleClose = () => {
    callback({ action: "close" });
  };

  const handleContinue = () => {
    if (!activeRoute) return;
    callback({
      action: "confirm",
      data: {
        routeInfo: activeRoute,
        selectedNextDelivery,
      },
    });
  };

  return (
    <AppModal show={show} callback={callback} className="tw:max-w-md tw:w-full">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-center tw:gap-2">
          <Truck className="tw:w-5 tw:h-5 tw:text-primary" />
          <span className="tw:font-bold tw:text-lg tw:tracking-tight">
            Select Delivery Route
          </span>
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:flex tw:flex-col tw:gap-3">
          {/* Routes swiper */}
          {routes && routes.length > 0 ? (
            <div className="tw:space-y-1.5">
              <label className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-gray-400 tw:px-1">
                Available Routes
              </label>
              <AppSwiper
                config={{ slidesPerView: "auto", spaceBetween: 6 }}
                className="tw:pb-1"
              >
                {routes.map((r, idx) => (
                  <AppSwiper.Slide
                    key={r._id ?? idx}
                    className="tw:px-0.5"
                    isAutoWidth
                  >
                    <button
                      onClick={() => handleSelectRoute(idx)}
                      className={`tw:px-3 tw:py-1.5 tw:rounded-md tw:text-xs tw:font-semibold tw:cursor-pointer tw:whitespace-nowrap tw:border tw:transition-all tw:duration-200 ${
                        activeRouteIdx === idx
                          ? "tw:bg-primary tw:text-white tw:border-primary tw:shadow-sm"
                          : "tw:bg-white tw:border-gray-200 tw:text-gray-500 hover:tw:border-gray-300"
                      }`}
                    >
                      {r.description || `Route ${idx + 1}`}
                    </button>
                  </AppSwiper.Slide>
                ))}
              </AppSwiper>
            </div>
          ) : (
            <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-6 tw:bg-gray-50 tw:rounded-lg tw:border tw:border-dashed tw:border-gray-200">
              <Info className="tw:w-6 tw:h-6 tw:text-gray-300 tw:mb-1" />
              <span className="tw:text-xs tw:font-medium tw:text-gray-400">
                No routes available
              </span>
            </div>
          )}

          {/* Details for selected route */}
          {activeRoute ? (
            <div className="tw:flex tw:flex-col tw:gap-3">
              {/* Route Summary Card */}
              <div className="tw:bg-gray-50 tw:p-3 tw:rounded-lg tw:border tw:border-gray-200 tw:flex tw:items-start tw:gap-3">
                <div className="tw:bg-white tw:p-1.5 tw:rounded-md tw:border tw:border-gray-200 tw:shadow-xs">
                  <Truck className="tw:w-4 tw:h-4 tw:text-gray-600" />
                </div>
                <div className="tw:flex-1">
                  <div className="tw:flex tw:justify-between tw:items-start">
                    <h3 className="tw:text-sm tw:font-bold tw:text-gray-800 tw:leading-none">
                      {activeRoute.description || activeRoute.routeCode}
                    </h3>
                  </div>
                  <p className="tw:text-[10px] tw:font-medium tw:text-gray-400 tw:mt-1">
                    ID:{" "}
                    <span className="tw:font-mono">
                      {activeRoute.routeRefId ?? activeRoute.routeId}
                    </span>
                  </p>

                  {/* Areas Chips in Card */}
                  {(activeRoute.parentRoutes?.[0]?.areas || activeRoute.areas)
                    ?.length > 0 && (
                    <div className="tw:mt-2 tw:flex tw:flex-wrap tw:gap-1">
                      {(
                        activeRoute.parentRoutes?.[0]?.areas ||
                        activeRoute.areas
                      ).map((area: string, i: number) => (
                        <span
                          key={i}
                          className="tw:text-[10px] tw:font-medium tw:bg-white tw:text-gray-600 tw:px-1.5 tw:py-0.5 tw:rounded-sm tw:border tw:border-gray-200"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Next delivery dates - choose one */}
              {activeRoute.nextDeliveryDates &&
                activeRoute.nextDeliveryDates.length > 0 && (
                  <div className="tw:space-y-2">
                    <div className="tw:flex tw:items-center tw:justify-between tw:px-1">
                      <label className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-gray-400">
                        Select Delivery Day
                      </label>
                    </div>
                    <div className="tw:grid tw:grid-cols-2 tw:gap-2">
                      {activeRoute.nextDeliveryDates!.map((nd, i) => {
                        const ndDay = nd.day || (nd as any).deliveryDay;
                        const ndDate =
                          nd.nextDate ||
                          (nd as any).deliveryDate ||
                          (nd as any).date;
                        const selDay =
                          selectedNextDelivery?.day ||
                          (selectedNextDelivery as any)?.deliveryDay;
                        const selDate =
                          selectedNextDelivery?.nextDate ||
                          (selectedNextDelivery as any)?.deliveryDate ||
                          (selectedNextDelivery as any)?.date;

                        const isSelected =
                          selDay === ndDay && selDate === ndDate;
                        return (
                          <button
                            key={`${nd.day}-${i}`}
                            onClick={() => setSelectedNextDelivery(nd)}
                            className={`tw:group tw:p-2 tw:px-3 tw:rounded-lg tw:border tw:text-left tw:transition-all tw:duration-200 ${
                              isSelected
                                ? "tw:bg-white tw:border-primary tw:ring-1 tw:ring-primary/20"
                                : "tw:bg-gray-50/50 tw:border-gray-200 hover:tw:border-gray-300"
                            }`}
                          >
                            <div className="tw:flex tw:items-center tw:justify-between">
                              <div
                                className={`tw:font-bold tw:text-xs ${
                                  isSelected
                                    ? "tw:text-primary"
                                    : "tw:text-gray-700"
                                }`}
                              >
                                {nd.day || (nd as any).deliveryDay}
                              </div>
                              <Calendar
                                className={`tw:w-3 tw:h-3 ${
                                  isSelected
                                    ? "tw:text-primary/60"
                                    : "tw:text-gray-300"
                                }`}
                              />
                            </div>
                            <div
                              className={`tw:text-[10px] tw:font-medium tw:mt-0.5 ${
                                isSelected
                                  ? "tw:text-primary/70"
                                  : "tw:text-gray-400"
                              }`}
                            >
                              <DateFormat
                                value={
                                  nd.nextDate ||
                                  (nd as any).deliveryDate ||
                                  (nd as any).date ||
                                  ""
                                }
                                formatStr="dd MMM, yyyy"
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>
          ) : null}
        </div>
      </AppModal.Content>

      <AppModal.Footer className="tw:bg-gray-50/50 tw:border-t tw:border-gray-100 tw:p-3">
        <div className="tw:w-full tw:grid tw:grid-cols-2 tw:gap-2">
          <AppButton
            onClick={handleClose}
            size="small"
            fill="outline"
            color="secondary"
            className="tw:font-bold tw:h-9"
          >
            Cancel
          </AppButton>
          <AppButton
            onClick={handleContinue}
            size="small"
            fill="solid"
            color="primary"
            disabled={!activeRoute}
            className="tw:font-bold tw:h-9"
          >
            Confirm Route
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default RouteChooseModal;
