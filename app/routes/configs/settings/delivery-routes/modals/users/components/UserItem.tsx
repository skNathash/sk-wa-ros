import React from "react";
import { Phone, MapPin, AlertCircle, CheckCircle } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";

type Props = {
  item: any;
  routeData: any | null;
  userType?: string;
  assigning?: boolean;
  onAssign: (user: any) => void;
};

const UserItem = ({
  item,
  routeData,
  userType,
  onAssign,
  assigning,
}: Props) => {
  const currentRouteName = item.routeName || null;
  const hasRoute = !!(item.routeId || currentRouteName);
  const isSameRoute = !!(
    routeData &&
    item.routeId &&
    routeData._id === item.routeId
  );

  const handleAssign = () => {
    onAssign?.(item);
  };

  return (
    <AppCard noPadding>
      <div
        className={`tw:flex tw:flex-col tw:gap-2 tw:p-3 ${!hasRoute ? "tw:bg-red-50" : ""}`}
      >
        {/* Header with Name and Button */}
        <div className="tw:flex tw:flex-row tw:items-start tw:justify-between tw:gap-2">
          <div className="tw:flex-1 tw:min-w-0">
            <div className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:truncate">
              {item.name}
            </div>
          </div>

          <div className="tw:shrink-0">
            {!isSameRoute ? (
              <AppButton
                size="small"
                onClick={handleAssign}
                isLoading={assigning}
                color={hasRoute ? "secondary" : "primary"}
                className={
                  hasRoute
                    ? "tw:bg-blue-600 hover:tw:bg-blue-700 tw:text-white"
                    : "tw:bg-green-600 hover:tw:bg-green-700 tw:text-white"
                }
              >
                {hasRoute ? "Change" : "Assign"}
              </AppButton>
            ) : null}
          </div>
        </div>

        {/* Contact Info - Compact */}
        <div className="tw:space-y-1">
          {item.mobile ? (
            <div className="tw:flex tw:items-center tw:text-xs tw:text-gray-600">
              <Phone
                size={14}
                className="tw:mr-1.5 tw:text-gray-400 tw:shrink-0"
              />
              <span className="tw:truncate">{item.mobile}</span>
            </div>
          ) : null}

          {item.addressStr ? (
            <div className="tw:flex tw:items-start tw:text-xs tw:text-gray-600">
              <MapPin
                size={14}
                className="tw:mr-1.5 tw:mt-0.5 tw:text-gray-400 tw:shrink-0"
              />
              <span className="tw:truncate tw:line-clamp-1">
                {item.addressStr}
              </span>
            </div>
          ) : null}
        </div>

        {/* Current Route Status */}
        {hasRoute ? (
          <div className="tw:flex tw:items-center tw:gap-2 tw:bg-blue-50 tw:rounded tw:px-2.5 tw:py-2 tw:border tw:border-blue-200">
            <CheckCircle size={14} className="tw:text-blue-600 tw:shrink-0" />
            <div className="tw:flex-1 tw:min-w-0">
              <span className="tw:text-xs tw:text-gray-600 tw:font-medium">
                Route:{" "}
              </span>
              <span className="tw:text-xs tw:font-semibold tw:text-blue-700">
                {currentRouteName}
              </span>
            </div>
          </div>
        ) : (
          <div className="tw:flex tw:items-center tw:gap-2 tw:bg-red-100 tw:rounded tw:px-2.5 tw:py-2 tw:border tw:border-red-300">
            <AlertCircle size={14} className="tw:text-red-600 tw:shrink-0" />
            <span className="tw:text-xs tw:font-semibold tw:text-red-700">
              No route assigned
            </span>
          </div>
        )}
      </div>
    </AppCard>
  );
};

export default UserItem;
