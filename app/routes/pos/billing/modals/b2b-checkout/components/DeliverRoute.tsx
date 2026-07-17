import { nextDay, type Day } from "date-fns";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MapPin,
  Package,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import DateFormat from "~/components/core/date/DateFormat";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import DeliveryRoutesService from "~/services/DeliveryRoutesService";
import RoutesSlider from "~/shared/logistics/components/RoutesSlider";

const DELIVERY_DAYS: Record<string, Day> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const DeliverRoute = ({
  franchiseId,
  callback,
}: {
  franchiseId: string;
  callback: (params: { action: string; data?: any }) => void;
}) => {
  const [routeData, setRouteData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [processing, setProcessing] = useState(false);
  const appToast = useAppToast();

  const loadRoute = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await DeliveryRoutesService.getRoutesList({
        page: 1,
        limit: 1,
        filter: {
          isActive: true,
          "usersLinked.id": franchiseId,
        },
      });
      if (resp?.statusCode === 200) {
        const data = resp.data.data || [];
        if (data.length > 0) {
          const route = data[0];
          const week = [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
          ];
          const nextDeliveryDay = route?.deliveryDays?.length
            ? CommonService.getNextDay(
                route.deliveryDays,
                week[new Date().getDay()],
              )
            : null;

          const finalRoute = {
            ...route,
            deliveryDate:
              nextDeliveryDay && DELIVERY_DAYS[nextDeliveryDay] !== undefined
                ? nextDay(new Date(), DELIVERY_DAYS[nextDeliveryDay])
                : null,
          };

          setRouteData(finalRoute);

          callback({
            action: "fetched",
            data: {
              ...finalRoute,
            },
          });
        } else {
          setRouteData(null);
          callback && callback({ action: "fetched", data: null });
        }
      }
    } catch (e) {
      console.error("Error loading route:", e);
    } finally {
      setLoading(false);
    }
  }, [franchiseId]);

  useEffect(() => {
    if (!franchiseId) return;
    loadRoute();
  }, [franchiseId, loadRoute]);

  const handleRouteChange = async (payload: { action: string; data: any }) => {
    if (payload.action !== "select" || !payload.data) return;
    const route = payload.data;

    // If user selects same route, ignore
    if (routeData?._id === route._id) {
      setShowSelector(false);
      return;
    }

    if (!franchiseId) return;
    setProcessing(true);
    try {
      const referenceType = "Franchise";

      // If there's an existing route, unlink first
      if (routeData?._id) {
        const unlinkPayload = {
          referenceType,
          referenceId: franchiseId,
          routeId: routeData._id,
        };

        const unlinkResp: any =
          await DeliveryRoutesService.unlinkRoute(unlinkPayload);

        if (
          !unlinkResp ||
          unlinkResp.statusCode < 200 ||
          unlinkResp.statusCode >= 300
        ) {
          const errMsg =
            unlinkResp?.data?.message || "Failed to unlink current route";
          appToast.show({ msg: errMsg, color: "danger" });
          setProcessing(false);
          return;
        }
      }

      const linkPayload = {
        referenceType,
        referenceId: franchiseId,
        routeId: route._id,
      };

      const resp: any = await DeliveryRoutesService.linkRoute(linkPayload);

      if (!resp || resp.statusCode < 200 || resp.statusCode >= 300) {
        const errMsg = resp?.data?.message || "Failed to assign route";
        appToast.show({ msg: errMsg, color: "danger" });
        setProcessing(false);
        return;
      }

      const week = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      const nextDeliveryDay = route?.deliveryDays?.length
        ? CommonService.getNextDay(
            route.deliveryDays,
            week[new Date().getDay()],
          )
        : null;

      const finalRoute = {
        ...route,
        deliveryDate:
          nextDeliveryDay && DELIVERY_DAYS[nextDeliveryDay] !== undefined
            ? nextDay(new Date(), DELIVERY_DAYS[nextDeliveryDay])
            : null,
      };

      setRouteData(finalRoute);

      // inform parent that route changed/selected
      callback({
        action: "changed",
        data: {
          ...finalRoute,
        },
      });

      appToast.show({ msg: "Route assigned successfully", color: "success" });
      setShowSelector(false);
    } catch (error: any) {
      console.error("Error changing route:", error);
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to change route";
      appToast.show({ msg: errMsg, color: "danger" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="tw:space-y-4">
      {/* Loading State */}
      {loading && (
        <div className="tw:flex tw:flex-col tw:justify-center tw:items-center tw:h-32 tw:bg-primary/5 tw:rounded-xl tw:border tw:border-primary/20">
          <Loader2 className="tw:w-6 tw:h-6 tw:text-primary tw:animate-spin tw:mb-2" />
          <p className="tw:text-sm tw:text-primary tw:font-medium">
            Loading delivery routes...
          </p>
        </div>
      )}

      {/* Route Selected State */}
      {!loading && routeData?.deliveryDate && (
        <div className="wa-incart tw:border-2 tw:border-transparent tw:rounded-xl tw:p-4 tw:space-y-3">
          <div className="tw:flex tw:items-center tw:gap-2">
            <CheckCircle2 className="tw:w-5 tw:h-5 tw:shrink-0" />
            <h3 className="tw:text-sm tw:font-semibold">
              Delivery Route Selected
            </h3>
          </div>

          <div className="tw:space-y-2 tw:ml-7">
            <div className="tw:flex tw:items-start tw:gap-2">
              <MapPin className="tw:w-4 tw:h-4 tw:mt-0.5 tw:shrink-0" />
              <div>
                <p className="tw:text-xs tw:opacity-80">Route</p>
                <p className="tw:text-sm tw:font-semibold">
                  {routeData.description ||
                    routeData.routeCode ||
                    "Not specified"}
                </p>
              </div>
            </div>

            <div className="tw:flex tw:items-start tw:gap-2">
              <Package className="tw:w-4 tw:h-4 tw:mt-0.5 tw:shrink-0" />
              <div>
                <p className="tw:text-xs tw:opacity-80">Expected Delivery</p>
                <p className="wa-mono tw:text-sm tw:font-semibold">
                  <DateFormat
                    value={routeData.deliveryDate}
                    formatStr="EEEE, dd MMM yyyy"
                  />
                </p>
              </div>
            </div>
          </div>
          <div className="tw:flex tw:justify-end">
            <button
              type="button"
              className="tw:text-xs tw:font-medium tw:underline tw:cursor-pointer tw:hover:opacity-70"
              onClick={() => setShowSelector(true)}
              disabled={processing}
            >
              {processing ? "Processing..." : "Change Route"}
            </button>
          </div>
        </div>
      )}

      {/* No Route Found State */}
      {!loading && !routeData && (
        <div className="tw:bg-amber-50 tw:border-2 tw:border-amber-300 tw:rounded-xl tw:p-4 tw:space-y-2 tw:flex tw:items-start tw:gap-3">
          <AlertCircle className="tw:w-5 tw:h-5 tw:text-amber-600 tw:shrink-0 tw:mt-0.5" />
          <div>
            <p className="tw:text-sm tw:font-semibold tw:text-amber-900">
              No Delivery Route Assigned
            </p>
            <p className="tw:text-xs tw:text-amber-800 tw:mt-1">
              This retailer doesn't have an active delivery route. Please select
              one below to continue with the order.
            </p>
          </div>
        </div>
      )}

      {/* Route Selection Area - shown only when no route OR when explicitly changing */}
      {!loading && (!routeData || showSelector) && (
        <div className="tw:space-y-3 tw:border tw:border-border tw:rounded-xl tw:p-4 tw:bg-muted">
          <div className="tw:flex tw:items-center tw:gap-2">
            <MapPin className="tw:w-5 tw:h-5 tw:text-primary" />
            <h3 className="tw:text-sm tw:font-semibold tw:text-foreground">
              Select a Delivery Route
            </h3>
          </div>

          <p className="tw:text-xs tw:text-muted-foreground tw:ml-7">
            Choose from available routes to set the estimated delivery date for
            this order.
          </p>

          <div className="tw:ml-7">
            <RoutesSlider
              selectedId={routeData?._id}
              callback={handleRouteChange}
              hideAllOption={true}
              className="tw:px-1"
            />
          </div>

          {routeData && (
            <div className="tw:flex tw:justify-end">
              <button
                type="button"
                className="tw:text-xs tw:text-muted-foreground tw:cursor-pointer tw:hover:text-foreground"
                onClick={() => setShowSelector(false)}
                disabled={processing}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliverRoute;
