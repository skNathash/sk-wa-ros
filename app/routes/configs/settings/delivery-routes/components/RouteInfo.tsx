import { Calendar, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppBadge from "~/components/core/badge/AppBadge";

type Props = {
  routeData: any | null;
  expanded: boolean;
  onToggle: () => void;
};

const RouteInfo = ({ routeData, expanded, onToggle }: Props) => {
  if (!routeData) return null;

  return (
    <AppCard
      title="Route details"
      icon={<MapPin size={18} className="tw:text-blue-600" />}
      className="tw:mb-4"
    >
      <div className="tw:space-y-3">
        <div className="tw:flex tw:items-center tw:justify-between">
          <div className="tw:flex-1">
            <div className="tw:flex tw:items-center tw:gap-2 tw:mb-1">
              <div className="tw:text-gray-900 tw:font-bold tw:leading-snug">
                {routeData.description || "--"}
              </div>
              {routeData.isActive === false && (
                <AppBadge variant="danger">Disabled</AppBadge>
              )}
            </div>

            {routeData.routeCode ? (
              <div className="tw:text-xs tw:text-gray-500">
                ID:{" "}
                <span className="tw-font-medium tw:text-gray-700">
                  {routeData.routeId}
                </span>
              </div>
            ) : null}
          </div>

          <button
            onClick={onToggle}
            className="tw:flex tw:items-center tw:justify-center tw:w-8 tw:h-8 hover:tw:bg-gray-100 tw:rounded tw:transition-colors tw:shrink-0"
            title="Toggle route details"
          >
            {expanded ? (
              <ChevronUp size={18} className="tw:text-gray-600" />
            ) : (
              <ChevronDown size={18} className="tw:text-gray-600" />
            )}
          </button>
        </div>

        {expanded && (
          <div className="tw:pt-3 tw:border-t tw:border-gray-200 tw:space-y-3">
            {Array.isArray(routeData.areas) && routeData.areas.length > 0 ? (
              <div>
                <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:font-semibold tw:text-gray-700 tw:mb-2">
                  <MapPin size={14} className="tw:text-blue-600" />
                  <span>Coverage Areas</span>
                </div>
                <div className="tw:flex tw:flex-wrap tw:gap-1.5 tw:ml-5">
                  {routeData.areas.map((area: string, idx: number) => (
                    <AppBadge
                      key={idx}
                      variant="secondary"
                      className="tw:text-xs tw:px-2 tw:py-1"
                    >
                      {area}
                    </AppBadge>
                  ))}
                </div>
              </div>
            ) : null}

            {Array.isArray(routeData.deliveryDays) &&
            routeData.deliveryDays.length > 0 ? (
              <div>
                <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:font-semibold tw:text-gray-700 tw:mb-2">
                  <Calendar size={14} className="tw:text-orange-600" />
                  <span>Delivery Days</span>
                </div>
                <div className="tw:flex tw:flex-wrap tw:gap-1.5 tw:ml-5">
                  {routeData.deliveryDays.map((day: string, idx: number) => (
                    <AppBadge
                      key={idx}
                      variant="outline"
                      className="tw:text-xs tw:px-2 tw:py-1"
                    >
                      {day}
                    </AppBadge>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </AppCard>
  );
};

export default RouteInfo;
