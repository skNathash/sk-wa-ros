import { MapPin, PhoneCall, Store } from "lucide-react";
import React from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";

interface RetailerBasicInfoProps {
  franchise: any;
  loading?: boolean;
  className?: string;
}

// Initials for the retailer avatar (first two words, e.g. "Sri Mart" → "SM").
const getInitials = (name?: string) => {
  if (!name) return "?";
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
};

const InfoItem = ({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-gray-600">
    <span className="tw:text-gray-400 tw:shrink-0">{icon}</span>
    <span className="tw:truncate">{children}</span>
  </div>
);

const RetailerBasicInfo: React.FC<RetailerBasicInfoProps> = ({
  franchise,
  loading,
  className,
}) => {
  if (loading) {
    return (
      <AppCard className={className}>
        <div className="tw:flex tw:items-center tw:gap-3">
          <div className="tw:h-12 tw:w-12 tw:shrink-0 tw:animate-pulse tw:rounded-full tw:bg-gray-200" />
          <div className="tw:flex tw:flex-col tw:gap-2">
            <span className="tw:h-4 tw:w-40 tw:animate-pulse tw:rounded tw:bg-gray-200" />
            <span className="tw:h-3 tw:w-56 tw:animate-pulse tw:rounded tw:bg-gray-200" />
          </div>
        </div>
      </AppCard>
    );
  }

  const name = franchise?.name || franchise?.franchiseName || "Retailer";
  const refId = franchise?.franchiseId;
  const mobile = franchise?.mobileNo || franchise?.mobile || "";
  const displayType = franchise?.displayType?.name;
  const location =
    [
      franchise?.town || franchise?.city,
      franchise?.district,
      franchise?.state,
      franchise?.pincode,
    ]
      .filter(Boolean)
      .join(", ") || "Location unavailable";

  return (
    <AppCard className={className}>
      <div className="tw:mb-3 tw:flex tw:items-center tw:gap-1.5 tw:border-b tw:border-gray-100 tw:pb-2 tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
        <Store size={14} className="tw:text-gray-400" />
        Retailer Details
      </div>
      <div className="tw:flex tw:flex-col tw:gap-3 tw:md:flex-row tw:md:items-center tw:md:justify-between">
        <div className="tw:flex tw:items-center tw:gap-3">
          <div className="tw:flex tw:h-12 tw:w-12 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-emerald-50 tw:text-sm tw:font-bold tw:text-emerald-700 tw:ring-1 tw:ring-emerald-200">
            {getInitials(name)}
          </div>
          <div className="tw:min-w-0">
            <div className="tw:flex tw:items-center tw:gap-2">
              <span className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-900">
                {name}
              </span>
              {displayType && (
                <AppBadge variant="primary">{displayType}</AppBadge>
              )}
            </div>
            <div className="tw:mt-1 tw:flex tw:flex-wrap tw:items-center tw:gap-x-4 tw:gap-y-1">
              {refId && (
                <InfoItem icon={<Store size={13} />}>ID {refId}</InfoItem>
              )}
              <InfoItem icon={<MapPin size={13} />}>{location}</InfoItem>
              <InfoItem icon={<PhoneCall size={13} />}>
                {mobile || "No number on file"}
              </InfoItem>
            </div>
          </div>
        </div>
      </div>
    </AppCard>
  );
};

export default RetailerBasicInfo;
