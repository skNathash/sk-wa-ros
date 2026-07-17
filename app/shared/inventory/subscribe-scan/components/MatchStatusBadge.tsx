import React from "react";
import type { MatchStatusBadge as MatchStatusBadgeMeta } from "~/services/BarcodeScanBulkService";

interface MatchStatusBadgeProps {
  badge: MatchStatusBadgeMeta;
  className?: string;
}

const MatchStatusBadge: React.FC<MatchStatusBadgeProps> = ({
  badge,
  className = "",
}) => (
  <span className={`tw:inline-flex tw:flex-col tw:items-start tw:gap-0.5 ${className}`}>
    <span
      className={`tw:inline-flex tw:items-center tw:gap-1 tw:whitespace-nowrap tw:text-[10px] tw:font-semibold tw:rounded-full tw:px-2 tw:py-0.5 ${badge.bg}`}
    >
      <span className={`tw:w-1.5 tw:h-1.5 tw:rounded-full ${badge.dot}`} />
      <span className={badge.text}>{badge.label}</span>
    </span>
    {badge.subLabel ? (
      <span className="tw:pl-2 tw:text-[10px] tw:font-medium tw:leading-tight tw:text-gray-500 tw:whitespace-nowrap">
        {badge.subLabel}
      </span>
    ) : null}
  </span>
);

export default MatchStatusBadge;
