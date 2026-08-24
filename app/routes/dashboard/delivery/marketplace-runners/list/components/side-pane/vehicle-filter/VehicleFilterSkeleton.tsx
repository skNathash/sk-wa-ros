import { VEHICLE_OPTIONS } from "./helper";

interface VehicleFilterSkeletonProps {
  className?: string;
}

/**
 * Placeholder vehicle rail, shaped like `VehicleFilterList` — one row per
 * vehicle with the icon bubble, the label line and the count on the right —
 * so the pane does not resize once the nearby runners land.
 */
export default function VehicleFilterSkeleton({
  className,
}: VehicleFilterSkeletonProps) {
  return (
    <div className={className}>
      <p className="app-pane-label">
        Vehicle
      </p>

      <div className="tw:mt-1.5 tw:flex tw:flex-col tw:gap-2">
        {VEHICLE_OPTIONS.map((option) => (
          <div
            key={option.key}
            className="tw:flex tw:w-full tw:items-center tw:gap-3 tw:rounded-xl tw:bg-slate-50 tw:px-3 tw:py-2.5"
          >
            <div className="skeleton-loader tw:size-8 tw:shrink-0 tw:rounded-full" />

            <div className="skeleton-loader tw:h-3 tw:w-24" />

            <div className="skeleton-loader tw:ms-auto tw:h-3 tw:w-5" />
          </div>
        ))}
      </div>
    </div>
  );
}
