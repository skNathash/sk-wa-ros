import { useCallback, useEffect, useState } from "react";
import { Info } from "lucide-react";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import RoutePopover from "./RoutePopover";
import DeliveryRoutesService from "~/services/DeliveryRoutesService";
import AuthService from "~/services/AuthService";
import { cn } from "~/lib/utils";
import type { SwiperOptions } from "swiper/types";

/**
 * RoutesSlider Component
 * Displays a horizontal slider of available delivery routes.
 *
 * @param selectedId - The ID of the currently selected route to highlight it.
 * @param callback - Callback function triggered when a route is selected.
 */
interface RoutesSliderProps {
  selectedId?: string;
  callback: (payload: { action: string; data: any }) => void;
  className?: string;
  hideAllOption?: boolean;
}

const swiperOptions: SwiperOptions = {
  slidesPerView: "auto",
  spaceBetween: 8,
  freeMode: true,
  watchSlidesProgress: true,
  nested: true,
  mousewheel: {
    forceToAxis: true,
  },
};

const RoutesSlider = ({
  selectedId,
  callback,
  className,
  hideAllOption = false,
}: RoutesSliderProps) => {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Fetches the list of active delivery routes from the API.
   */
  const fetchRoutes = useCallback(async () => {
    try {
      setLoading(true);
      const isSalesEmp = AuthService.isSalesEmployeeLoggedIn();
      const filter: Record<string, any> = { isActive: true };
      if (isSalesEmp) {
        const manpower = AuthService.getManpower<{
          linkedRoutes?: Array<{ routeId: string }>;
        }>();
        const routeIds = (manpower?.linkedRoutes || [])
          .map((r) => r.routeId)
          .filter(Boolean);
        filter._id = { $in: routeIds };
      }
      const resp: any = await DeliveryRoutesService.getRoutesList({
        filter,
        page: 1,
        limit: 100,
      });
      const list = resp?.data?.data ?? [];
      if (list.length > 0 && !hideAllOption) {
        setRoutes([{ _id: "all", description: "All Routes" }, ...list]);
      } else {
        setRoutes(list);
      }
    } catch (e) {
      console.error("Failed to fetch routes", e);
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRoutes();
  }, [fetchRoutes]);

  /**
   * Handles the selection of a route and triggers the callback.
   */
  const handleSelect = useCallback(
    (route: any) => {
      callback({ action: "select", data: route });
    },
    [callback],
  );

  // Return skeletons while loading the initial set of routes
  if (loading && routes.length === 0) {
    return (
      <div className="tw:flex tw:gap-2 tw:p-2 tw:overflow-hidden tw:w-full">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="tw:h-8 tw:w-24 tw:bg-gray-100 tw:rounded-full tw:animate-pulse tw:shrink-0"
          />
        ))}
      </div>
    );
  }

  // Gracefully handle empty routes
  if (!loading && routes.length === 0) {
    return null;
  }

  return (
    <div className={`tw:min-w-0 tw:relative tw:overflow-hidden ${className}`}>
      <AppSwiper config={swiperOptions} className="tw:py-1.5">
        {routes.map((route) => {
          const isActive =
            selectedId === route._id?.toString() ||
            (route._id === "all" && !selectedId);
          return (
            <AppSwiper.Slide key={route._id} isAutoWidth={true}>
              <div
                id={`route-slide-${route._id}`}
                onClick={() => handleSelect(route)}
                className={cn(
                  "tw:px-4 tw:py-1 tw:rounded-full tw:border tw:text-xs tw:font-medium tw:cursor-pointer tw:transition-all tw:duration-200 tw:whitespace-nowrap tw:select-none tw:flex tw:items-center tw:gap-1.5",
                  isActive
                    ? "tw:bg-primary tw:text-white tw:border-primary tw:shadow-sm tw:z-10"
                    : "tw:bg-white tw:text-gray-600 tw:border-gray-200 hover:tw:border-primary/40 hover:tw:bg-gray-50/50",
                )}
              >
                <span>{route.description}</span>
                {route._id !== "all" && (
                  <RoutePopover route={route} isActive={isActive} />
                )}
              </div>
            </AppSwiper.Slide>
          );
        })}
      </AppSwiper>
    </div>
  );
};

export default RoutesSlider;
