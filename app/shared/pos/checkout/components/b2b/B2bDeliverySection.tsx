import { useCallback, useEffect, useState } from "react";
import { nextDay, type Day } from "date-fns";
import clsx from "clsx";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MapPin,
  Truck,
} from "lucide-react";
import DateFormat from "~/components/core/date/DateFormat";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import DeliveryRoutesService from "~/services/DeliveryRoutesService";
import RoutesSlider from "~/shared/logistics/components/RoutesSlider";

const WEEK = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const DELIVERY_DAYS: Record<string, Day> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/** The link/unlink calls answer 200 or 201 — both mean the change went through. */
const isOk = (resp: any) => resp?.statusCode >= 200 && resp?.statusCode < 300;

/** The next date the route actually runs, from the days it serves. */
const withDeliveryDate = (route: any) => {
  const nextDeliveryDay = route?.deliveryDays?.length
    ? CommonService.getNextDay(route.deliveryDays, WEEK[new Date().getDay()])
    : null;

  return {
    ...route,
    deliveryDate:
      nextDeliveryDay && DELIVERY_DAYS[nextDeliveryDay] !== undefined
        ? nextDay(new Date(), DELIVERY_DAYS[nextDeliveryDay])
        : null,
  };
};

type Props = {
  /** The retailer the route is linked to. */
  franchiseId: string;
  /**
   * Fires `{ action: "fetched" | "changed", data: route | null }` — the order
   * payload carries whichever route is current.
   */
  callback: (payload: { action: string; data?: any }) => void;
  className?: string;
};

/**
 * The delivery step of the B2B flow: the route already linked to the retailer,
 * with a way to move them onto another one. Picking a different route relinks
 * the retailer for real before the order is raised, so the delivery date on the
 * order and the route the retailer sits on can never disagree.
 */
const B2bDeliverySection = ({ franchiseId, callback, className }: Props) => {
  const appToast = useAppToast();
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [linking, setLinking] = useState(false);

  const loadRoute = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await DeliveryRoutesService.getRoutesList({
        page: 1,
        limit: 1,
        filter: { isActive: true, "usersLinked.id": franchiseId },
      });

      const linked = resp?.statusCode === 200 ? resp.data.data || [] : [];
      const next = linked.length ? withDeliveryDate(linked[0]) : null;
      setRoute(next);
      callback({ action: "fetched", data: next });
    } catch (e) {
      console.error("Error loading delivery route", e);
      setRoute(null);
      callback({ action: "fetched", data: null });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [franchiseId]);

  useEffect(() => {
    if (!franchiseId) return;
    loadRoute();
  }, [franchiseId, loadRoute]);

  const handlePick = async (payload: { action: string; data: any }) => {
    if (payload.action !== "select" || !payload.data || !franchiseId) return;

    const picked = payload.data;
    if (route?._id === picked._id) {
      setShowPicker(false);
      return;
    }

    setLinking(true);
    try {
      const referenceType = "Franchise";

      // A retailer sits on one route, so the old link has to go before the new
      // one is made.
      if (route?._id) {
        const unlink: any = await DeliveryRoutesService.unlinkRoute({
          referenceType,
          referenceId: franchiseId,
          routeId: route._id,
        });
        if (!isOk(unlink)) {
          appToast.show({
            msg: unlink?.data?.message || "Failed to unlink current route",
            color: "error",
          });
          return;
        }
      }

      const link: any = await DeliveryRoutesService.linkRoute({
        referenceType,
        referenceId: franchiseId,
        routeId: picked._id,
      });
      if (!isOk(link)) {
        appToast.show({
          msg: link?.data?.message || "Failed to assign route",
          color: "error",
        });
        return;
      }

      const next = withDeliveryDate(picked);
      setRoute(next);
      callback({ action: "changed", data: next });
      appToast.show({ msg: "Route assigned", color: "success" });
      setShowPicker(false);
    } catch (e) {
      console.error("Error changing delivery route", e);
      appToast.show({ msg: "Failed to change route", color: "error" });
    } finally {
      setLinking(false);
    }
  };

  if (loading) {
    return (
      <div
        className={clsx(
          "tw:flex tw:items-center tw:justify-center tw:gap-2 tw:rounded-xl tw:bg-slate-50 tw:p-4 tw:text-xs tw:text-slate-500",
          className,
        )}
      >
        <Loader2 className="tw:size-3.5 tw:animate-spin" />
        Loading delivery routes…
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "tw:divide-y tw:divide-slate-100 tw:rounded-xl tw:border tw:border-slate-200",
        className,
      )}
    >
      {route ? (
        <div className="tw:flex tw:items-center tw:gap-2 tw:px-2.5 tw:py-2">
          <CheckCircle2 className="tw:size-4 tw:shrink-0 tw:text-emerald-600" />
          <div className="tw:min-w-0 tw:flex-1">
            <div className="tw:truncate tw:text-[13px] tw:font-semibold tw:text-slate-800">
              {route.description || route.routeCode || "Route"}
            </div>
            <div className="tw:flex tw:items-center tw:gap-1 tw:text-[11px] tw:text-slate-500">
              <Truck size={11} className="tw:shrink-0" />
              {route.deliveryDate ? (
                <DateFormat value={route.deliveryDate} formatStr="EEE, dd MMM" />
              ) : (
                "Date not scheduled"
              )}
            </div>
          </div>
          <button
            type="button"
            disabled={linking}
            onClick={() => setShowPicker((open) => !open)}
            className="tw:shrink-0 tw:cursor-pointer tw:text-[11px] tw:font-semibold tw:text-emerald-700 hover:tw:underline tw:disabled:opacity-50"
          >
            {linking ? "Assigning…" : showPicker ? "Cancel" : "Change"}
          </button>
        </div>
      ) : (
        <div className="tw:flex tw:items-center tw:gap-2 tw:px-2.5 tw:py-2">
          <AlertCircle className="tw:size-4 tw:shrink-0 tw:text-amber-600" />
          <div className="tw:min-w-0 tw:flex-1 tw:text-[13px] tw:font-semibold tw:text-slate-800">
            No route assigned
            <div className="tw:text-[11px] tw:font-normal tw:text-slate-500">
              Pick the route this retailer is delivered on.
            </div>
          </div>
        </div>
      )}

      {(!route || showPicker) && (
        <div className="tw:flex tw:items-center tw:gap-2 tw:px-2.5 tw:py-1.5">
          <MapPin className="tw:size-3.5 tw:shrink-0 tw:text-slate-400" />
          <RoutesSlider
            selectedId={route?._id}
            callback={handlePick}
            hideAllOption
            className="tw:flex-1"
          />
        </div>
      )}
    </div>
  );
};

export default B2bDeliverySection;
