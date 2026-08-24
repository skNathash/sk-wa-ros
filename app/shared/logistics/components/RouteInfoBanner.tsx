import clsx from "clsx";
import { MapPin, Calendar } from "lucide-react";
import { isBefore, startOfDay } from "date-fns";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import { useTranslation } from "react-i18next";
import AssignRouteModal from "~/shared/logistics/modals/assign-route/AssignRouteModal";
import { useState, useEffect } from "react";
import useAppNav from "~/hooks/useAppNav";
import DeliveryRoutesService from "~/services/DeliveryRoutesService";

interface RouteInfoProps {
  routeInfo?: {
    deliveryDate?: string | Date;
    description?: string;
    plannedDeliveryDay?: string;
    routeCode?: string;
    routeId?: string;
  };
  customerInfo?: {
    customerId?: string;
    customerType?: string;
    isGuestCustomer?: boolean;
  };
  orderType?: string;
  orderStatus?: string;
  onRefresh?: () => void;
  orderId?: string;
  feature?: "default" | "order";
  showViewAll?: boolean;
  isMyOrder?: boolean;
  /** Keep the column layout at every breakpoint — for narrow hosts (e.g. the
      order-process side rail) where the desktop row squeezes both halves. */
  stacked?: boolean;
}

const RouteInfoBanner = ({
  routeInfo,
  customerInfo,
  isMyOrder,
  orderType,
  orderStatus,
  onRefresh,
  orderId,
  feature,
  showViewAll,
  stacked = false,
}: RouteInfoProps) => {
  const { t } = useTranslation(["common"]);
  const [showAssignRoute, setShowAssignRoute] = useState(false);
  const [routeDetails, setRouteDetails] = useState<any | null>(null);
  const [loadingRouteDetails, setLoadingRouteDetails] = useState(false);
  const appNav = useAppNav();

  const actionAllowedStatuses = ["Created", "Pending", "Approved"];
  const showActionButton = !!(
    orderStatus && actionAllowedStatuses.includes(orderStatus)
  );

  // hide if b2c order
  if (orderType === "B2C") {
    return null;
  }

  useEffect(() => {
    let mounted = true;

    const fetchRouteDetails = async () => {
      if (!routeInfo?.routeId) {
        setRouteDetails(null);
        return;
      }
      try {
        setLoadingRouteDetails(true);
        const params = { filter: { _id: routeInfo.routeId } };
        const resp: any = await DeliveryRoutesService.getRoutesList(params);
        const list = resp?.data?.data ?? [];
        if (!mounted) return;
        setRouteDetails(Array.isArray(list) && list.length ? list[0] : null);
      } catch (e) {
        setRouteDetails(null);
      } finally {
        if (mounted) setLoadingRouteDetails(false);
      }
    };

    void fetchRouteDetails();

    return () => {
      mounted = false;
    };
  }, [routeInfo?.routeId]);

  const isDeliveryExpired = Boolean(
    routeInfo?.deliveryDate &&
    isBefore(
      startOfDay(new Date(routeInfo.deliveryDate)),
      startOfDay(new Date()),
    ),
  );

  return (
    <AppCard noPadding>
      <div
        className={clsx(
          "tw:p-3 tw:flex tw:flex-col tw:justify-between tw:gap-4",
          !stacked && "tw:md:flex-row tw:md:items-center",
        )}
      >
        <div className="tw:flex tw:items-center tw:gap-3 tw:overflow-hidden">
          <div className="tw:bg-blue-50 tw:p-2 tw:rounded-full tw:text-blue-600 tw:shrink-0">
            <MapPin size={20} />
          </div>
          <div className="tw:overflow-hidden">
            <div className="tw:text-[10px] tw:text-gray-500 tw:font-bold tw:uppercase tw:tracking-wider">
              {t("deliveryRoute")}
            </div>
            {routeInfo?.routeId ? (
              <div className="tw:flex tw:items-center tw:gap-2 tw:mt-0.5">
                <span className="tw:font-bold tw:text-gray-900 tw:truncate">
                  {routeInfo.description || routeInfo.routeCode}
                </span>
                {routeInfo.plannedDeliveryDay && (
                  <AppBadge
                    variant="secondary"
                    className="tw:text-[10px] tw:px-1.5 tw:py-0"
                  >
                    {routeInfo.plannedDeliveryDay}
                  </AppBadge>
                )}
                {routeDetails && routeDetails.isActive === false && (
                  <AppBadge
                    variant="danger"
                    className="tw:text-[10px] tw:px-1.5 tw:py-0 tw:ml-1"
                  >
                    Route Disabled
                  </AppBadge>
                )}
              </div>
            ) : (
              <div className="tw:text-sm tw:text-gray-400 tw:italic tw:mt-0.5">
                {customerInfo?.isGuestCustomer
                  ? t("notApplicableForWalkin")
                  : t("noRouteAssigned")}
              </div>
            )}
          </div>
        </div>

        <div
          className={clsx(
            "tw:flex tw:flex-wrap tw:items-center tw:gap-4",
            !stacked && "tw:md:gap-8",
          )}
        >
          {routeInfo?.deliveryDate && (
            <div className="tw:flex tw:items-center tw:gap-2">
              <div className="tw:bg-orange-50 tw:p-2 tw:rounded-full tw:text-orange-600 tw:shrink-0">
                <Calendar size={18} />
              </div>
              <div>
                <div className="tw:text-[10px] tw:text-gray-500 tw:font-bold tw:uppercase tw:tracking-wider">
                  {t("deliveryDate")}
                </div>
                <div className="tw:text-sm tw:font-bold tw:text-gray-900">
                  <DateFormat
                    value={routeInfo.deliveryDate}
                    formatStr="dd MMM, yyyy"
                  />
                </div>
                {isDeliveryExpired &&
                  !["Cancelled", "Delivered", "Partially Delivered"].includes(
                    orderStatus || "",
                  ) && (
                    <div className="tw:text-xs tw:text-red-600 tw:mt-1">
                      Delivery date expired
                    </div>
                  )}
              </div>
            </div>
          )}

          {!customerInfo?.isGuestCustomer && showActionButton && isMyOrder ? (
            <AppButton
              size="small"
              color="primary"
              fill="outline"
              className="tw:h-8"
              onClick={() => setShowAssignRoute(true)}
            >
              {routeInfo?.routeId ? t("changeRoute") : t("assignRoute")}
            </AppButton>
          ) : null}
          {showViewAll && (
            <AppButton
              size="small"
              color="primary"
              fill="outline"
              className="tw:h-8"
              onClick={() => appNav.to("/configs/settings/delivery-routes")}
            >
              Go to Routes
            </AppButton>
          )}
        </div>
      </div>

      {showAssignRoute && (
        <AssignRouteModal
          show={showAssignRoute}
          userId={customerInfo?.customerId || ""}
          userType={customerInfo?.customerType === "Retailer" ? "B2B" : "B2C"}
          currentRouteId={routeInfo?.routeId || null}
          feature={feature}
          orderIds={orderId ? [orderId] : []}
          callback={({ action }) => {
            setShowAssignRoute(false);
            if (action === "success") {
              onRefresh && onRefresh();
            }
          }}
        />
      )}
    </AppCard>
  );
};

export default RouteInfoBanner;
