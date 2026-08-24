import { ArrowRight, Navigation } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import type { LiveRunner, TrackerMarker } from "./helper";

interface DispatchTrackerMapProps {
  liveCount: number;
  runnerCount: number;
  markers: TrackerMarker[];
  runners: LiveRunner[];
  className?: string;
  onOpenTracker?: () => void;
}

const markerToneClasses: Record<string, string> = {
  cod: "tw:bg-emerald-600 tw:text-white hover:tw:bg-emerald-700",
  prepaid: "tw:bg-blue-700 tw:text-white hover:tw:bg-blue-800",
  shop: "tw:bg-orange-500 tw:text-white hover:tw:bg-orange-600",
};

const legendToneClasses: Record<string, string> = {
  cod: "tw:bg-emerald-600",
  prepaid: "tw:bg-blue-700",
  shop: "tw:bg-orange-500",
};

const legendLabels: Record<string, string> = {
  cod: "COD",
  prepaid: "Prepaid",
  shop: "Shop",
};

/**
 * Theme-2 live dispatch tracker map.
 *
 * Renders a stylised, lightweight map surface (SVG road traces + CSS) so it
 * works without adding a map-library dependency. Live order markers sit on
 * percentage-based positions so they stay relative as the card resizes.
 */
const DispatchTrackerMap = ({
  liveCount,
  runnerCount,
  markers,
  runners,
  className = "",
  onOpenTracker,
}: DispatchTrackerMapProps) => {
  const hasRunners = runnerCount > 0;

  return (
    <AppCard className={className} noPadding>
      <div className="tw:relative tw:h-80 tw:overflow-hidden tw:rounded-2xl tw:bg-slate-50 sm:tw:h-96">
        {/* Abstract road grid — intentionally simple so it reads as a map
            surface without pulling in a real mapping library. */}
        <svg
          className="tw:absolute tw:inset-0 tw:h-full tw:w-full tw:opacity-40"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern
              id="roadGrid"
              width="120"
              height="120"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M0 60 H120 M60 0 V120"
                stroke="#cbd5e1"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M0 0 Q60 30 120 60 T240 120"
                stroke="#cbd5e1"
                strokeWidth="1"
                fill="none"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#roadGrid)" />
          <path
            d="M-20 120 Q180 80 320 160 T520 140"
            stroke="#94a3b8"
            strokeWidth="4"
            fill="none"
            opacity="0.35"
          />
          <path
            d="M80 -20 Q120 140 200 220 T360 420"
            stroke="#94a3b8"
            strokeWidth="4"
            fill="none"
            opacity="0.35"
          />
          <path
            d="M-40 240 Q140 200 280 260 T520 240"
            stroke="#94a3b8"
            strokeWidth="3"
            fill="none"
            opacity="0.25"
          />
        </svg>

        {/* Live badge */}
        <div className="tw:absolute tw:left-3 tw:top-3 tw:flex tw:items-center tw:gap-2 tw:rounded-full tw:border tw:border-emerald-100 tw:bg-white tw:px-3 tw:py-1.5 tw:shadow-sm">
          <span className="tw:relative tw:flex tw:h-2 tw:w-2">
            <span className="tw:absolute tw:inline-flex tw:h-full tw:w-full tw:animate-ping tw:rounded-full tw:bg-emerald-500 tw:opacity-75" />
            <span className="tw:relative tw:inline-flex tw:h-2 tw:w-2 tw:rounded-full tw:bg-emerald-600" />
          </span>
          <span className="tw:text-xs tw:font-semibold tw:text-gray-800">
            {liveCount} live
          </span>
          <span className="tw:text-xs tw:text-gray-400">·</span>
          <span className="tw:text-xs tw:text-gray-600">
            {runnerCount} runner{runnerCount === 1 ? "" : "s"}
          </span>
        </div>

        {/* Runner avatars — small orange dots on the map. */}
        {hasRunners &&
          runners.map((runner) => (
            <div
              key={runner.id}
              className="tw:absolute tw:flex tw:h-6 tw:w-6 tw:-translate-x-1/2 tw:-translate-y-1/2 tw:items-center tw:justify-center tw:rounded-full tw:border-2 tw:border-white tw:bg-orange-500 tw:text-[10px] tw:font-bold tw:text-white tw:shadow-md"
              style={{ left: runner.x, top: runner.y }}
              title={runner.name}
            >
              {runner.initials}
            </div>
          ))}

        {/* Order markers */}
        {markers.map((marker) => (
          <div
            key={marker.id}
            className={`tw:absolute tw:-translate-x-1/2 tw:-translate-y-1/2 tw:cursor-pointer tw:whitespace-nowrap tw:rounded-full tw:px-2 tw:py-1 tw:text-[11px] tw:font-semibold tw:shadow-md tw:transition-transform hover:tw:scale-105 hover:tw:shadow-lg ${
              markerToneClasses[marker.type] || markerToneClasses.cod
            }`}
            style={{ left: marker.x, top: marker.y }}
          >
            <span>#{marker.orderRef}</span>
            <span className="tw:mx-1 tw:opacity-60">·</span>
            <span>{marker.eta} min</span>
          </div>
        ))}

        {/* Legend + action */}
        <div className="tw:absolute tw:bottom-3 tw:left-3 tw:right-3 tw:flex tw:items-end tw:justify-between tw:gap-3">
          <div className="tw:flex tw:items-center tw:gap-3 tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:px-3 tw:py-2 tw:shadow-sm">
            {(Object.keys(legendLabels) as Array<keyof typeof legendLabels>).map(
              (key) => (
                <div key={key} className="tw:flex tw:items-center tw:gap-1.5">
                  <span
                    className={`tw:h-2.5 tw:w-2.5 tw:rounded-full ${legendToneClasses[key]}`}
                  />
                  <span className="tw:text-xs tw:text-gray-600">
                    {legendLabels[key]}
                  </span>
                </div>
              )
            )}
          </div>

          <button
            type="button"
            onClick={onOpenTracker}
            className="tw:flex tw:items-center tw:gap-1 tw:rounded-xl tw:bg-white tw:px-3 tw:py-2 tw:text-xs tw:font-semibold tw:text-emerald-700 tw:shadow-sm tw:ring-1 tw:ring-emerald-100 tw:transition-colors hover:tw:bg-emerald-50 hover:tw:text-emerald-800"
          >
            <Navigation size={12} />
            Open tracker
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </AppCard>
  );
};

export default DispatchTrackerMap;
