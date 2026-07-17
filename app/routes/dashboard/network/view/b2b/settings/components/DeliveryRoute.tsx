import { MapPin, PencilIcon } from "lucide-react";
import { useEffect, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import NoData from "~/components/core/no-data/NoData";
import RouteInfo from "~/routes/configs/settings/delivery-routes/components/RouteInfo";
import DeliveryRoutesService from "~/services/DeliveryRoutesService";
import FranchiseService from "~/services/FranchiseService";
import AssignRouteModal from "~/shared/logistics/modals/assign-route/AssignRouteModal";

interface DeliveryRouteProps {
  userId: string;
}

const DeliveryRoute = ({ userId }: DeliveryRouteProps) => {
  const [routeData, setRouteData] = useState<any>(null);
  const [expanded, setExpanded] = useState<boolean>(true);
  const [showAssignRoute, setShowAssignRoute] = useState<boolean>(false);

  useEffect(() => {
    if (!userId) return;
    loadRoute();
  }, [userId]);

  const loadRoute = async () => {
    try {
      const params: Record<string, any> = {
        page: 1,
        limit: 1,
        franchiseId: userId,
        includeRoutes: true,
      };

      const r = await DeliveryRoutesService.getRoutesList({
        page: 1,
        limit: 1,
        filter: {
          "usersLinked.id": userId,
        },
      });

      const data = r?.data?.data || [];
      if (Array.isArray(data) && data.length) {
        const route = Array.isArray(data) && data.length ? data[0] : undefined;
        setRouteData(route || null);
      } else {
        setRouteData(null);
      }
    } catch (err) {
      console.error("Error loading route info:", err);
      setRouteData(null);
    }
  };

  return (
    <>
      {routeData ? (
        <div>
          <RouteInfo
            routeData={routeData}
            expanded={expanded}
            onToggle={() => setExpanded((s) => !s)}
          />
          <div className="tw:flex tw:justify-end">
            <AppButton
              color="primary"
              className="tw:mb-4"
              onClick={() => setShowAssignRoute(true)}
            >
              <PencilIcon className="tw:mr-2" size={16} />
              Change Route
            </AppButton>
          </div>
        </div>
      ) : (
        <AppCard title="Route details" className="tw:mb-4">
          <NoData
            title="No route assigned"
            description="Assign a delivery route to optimize order fulfillment and logistics planning for this franchise."
            icon={
              <div className="tw:p-4 tw:bg-blue-50 tw:rounded-full tw:border tw:border-blue-200">
                <MapPin className="tw:text-blue-500" size={32} />
              </div>
            }
          >
            <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-8">
              <div className="tw:mb-4">
                <div className="tw:p-4 tw:bg-blue-50 tw:rounded-full tw:border tw:border-blue-200">
                  <MapPin className="tw:text-blue-500" size={32} />
                </div>
              </div>
              <h3 className="tw:text-sm tw:font-semibold tw:text-slate-700 tw:mb-2">
                No route assigned
              </h3>
              <p className="tw:text-sm tw:text-slate-500 tw:leading-relaxed tw:mb-6 tw:max-w-sm tw:text-center">
                Assign a delivery route to optimize order fulfillment and
                logistics planning for this franchise.
              </p>
              <AppButton
                size="small"
                color="primary"
                className="tw:h-9"
                onClick={() => setShowAssignRoute(true)}
              >
                Assign Route
              </AppButton>
            </div>
          </NoData>
        </AppCard>
      )}

      <AssignRouteModal
        show={showAssignRoute}
        userId={userId}
        userType="B2B"
        currentRouteId={routeData?._id || null}
        feature="default"
        callback={({ action }) => {
          setShowAssignRoute(false);
          if (action === "success") {
            loadRoute();
          }
        }}
      />
    </>
  );
};

export default DeliveryRoute;
