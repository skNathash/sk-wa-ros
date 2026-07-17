import React from "react";
import { Apple, MapPin } from "lucide-react";
import AppPopover from "~/components/core/popover/AppPopover";
import AppLink from "~/components/core/link/AppLink";

interface LocationsBlockProps {
  locations?: any[] | null;
  className?: string;
  dealId?: string;
}

const LocationsBlock: React.FC<LocationsBlockProps> = ({
  locations = [],
  className = "",
  dealId,
}) => {
  if (!locations || locations.length === 0) {
    return <span className={className}>--</span>;
  }

  const first = locations[0];

  // Helper function to build URL with dealId query parameter
  const buildLocationUrl = (binId: string) => {
    const baseUrl = `/dashboard/inventory/rack-bin/bin/view/${binId}`;
    if (dealId) {
      return `${baseUrl}?dealId=${dealId}`;
    }
    return baseUrl;
  };

  return (
    <div className={`tw:flex tw:items-center tw:gap-2 ${className}`}>
      <MapPin size={12} className="tw:text-gray-500" />
      <div className="tw:text-xs tw:bg-gray-100 tw:px-2 tw:py-1 tw:rounded-md tw:inline-block">
        {locations.length > 0 ? (
          <>
            <AppLink
              asLink={true}
              href={buildLocationUrl(first?.location?.binId)}
            >
              {first?.location?.name || "--"}/
              {first?.location?.rackName || "--"}/
              {first?.location?.binName || "--"}
            </AppLink>
            {locations.length > 1 && (
              <AppPopover
                triggerContent={
                  <span className="tw:text-gray-500 tw:block">
                    (+{locations.length - 1} more)
                  </span>
                }
              >
                <div className="tw:p-2">
                  <div className="tw:text-sm tw:font-medium tw:mb-2">
                    Locations ({locations.length})
                  </div>
                  {locations.map((location: any) => (
                    <AppLink
                      asLink={true}
                      href={buildLocationUrl(location.location?.binId)}
                      key={
                        location.id ||
                        `${location.location?.id || "loc"}-${Math.random()}`
                      }
                      className="tw:text-xs tw:block tw:mb-1"
                    >
                      {location.location?.name || "--"}/{" "}
                      {location.location?.rackName || "--"}/{" "}
                      {location.location?.binName || "--"}
                    </AppLink>
                  ))}
                </div>
              </AppPopover>
            )}
          </>
        ) : (
          "--"
        )}
      </div>
    </div>
  );
};

export default LocationsBlock;
