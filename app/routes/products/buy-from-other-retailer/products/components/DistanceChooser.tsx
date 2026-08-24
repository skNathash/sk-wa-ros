import { ChevronDown, Map, MapPin } from "lucide-react";
import { useCallback, useState } from "react";
import AppPopover from "~/components/core/popover/AppPopover";
import { useSearchParams } from "react-router";
import { DEFAULT_BROWSE_DISTANCE } from "~/constants";

type Props = {
  selectedDistance?: string;
  /** `inline` sits inside the unified search bar (All areas label + map icon). */
  variant?: "default" | "inline";
};

const KM = DEFAULT_BROWSE_DISTANCE;

const DistanceChooser = ({
  selectedDistance = KM,
  variant = "default",
}: Props) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [distancePopoverOpen, setDistancePopoverOpen] = useState(false);

  const distanceOptions = [2, 4, 6, 8, 10, 25, 30, 50, 100];
  const currentDistance = searchParams.get("distance") || selectedDistance;
  const isIgnoringDistance = currentDistance === "all";
  const isInline = variant === "inline";

  const handleDistanceSelect = useCallback(
    async (distance: number | string) => {
      setDistancePopoverOpen(false);

      await new Promise((resolve) => setTimeout(resolve, 300));

      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev.toString());
          newParams.set("distance", distance.toString());
          return newParams;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const label = isIgnoringDistance
    ? isInline
      ? "All areas"
      : "All"
    : isInline
      ? `${currentDistance} km`
      : currentDistance;

  return (
    <AppPopover
      open={distancePopoverOpen}
      onOpenChange={setDistancePopoverOpen}
      triggerContent={
        <button
          aria-label={
            isIgnoringDistance
              ? "All areas"
              : `Selected distance ${currentDistance} kilometers`
          }
          aria-expanded={distancePopoverOpen}
          className={`tw:h-9 tw:inline-flex tw:items-center tw:justify-center tw:gap-1.5 tw:px-2.5 tw:sm:px-3 tw:rounded-xl tw:border tw:text-sm tw:font-medium tw:transition-colors tw:shrink-0 ${
            isIgnoringDistance
              ? "tw:border-gray-200 tw:bg-white tw:text-gray-700 tw:hover:border-gray-300 tw:hover:bg-gray-50"
              : "tw:border-primary/30 tw:bg-primary/5 tw:text-primary tw:hover:bg-primary/10"
          }`}
          type="button"
        >
          {isInline ? (
            <Map
              size={15}
              className={`tw:shrink-0 ${isIgnoringDistance ? "tw:text-gray-500" : "tw:text-primary"}`}
            />
          ) : (
            <MapPin size={15} className="tw:text-primary tw:shrink-0" />
          )}
          {/* Always show the current radius so the active filter is never hidden. */}
          <span className="tw:whitespace-nowrap tw:tabular-nums tw:hidden tw:sm:inline">
            {label}
          </span>
          <ChevronDown
            size={13}
            className={`tw:shrink-0 tw:transition-transform tw:duration-200 ${
              isIgnoringDistance ? "tw:text-gray-400" : "tw:text-primary/60"
            } ${distancePopoverOpen ? "tw:rotate-180" : ""}`}
          />
        </button>
      }
      side="bottom"
      align="end"
      sideOffset={8}
      contentClassName="tw:w-[280px] tw:p-0"
    >
      <div className="tw:flex tw:flex-col">
        <div className="tw:px-4 tw:py-3 tw:border-b tw:border-gray-100 tw:bg-gray-50/50">
          <h3 className="tw:text-xs tw:font-semibold tw:text-gray-500 tw:uppercase tw:tracking-wider">
            Search Radius
          </h3>
        </div>
        <div className="tw:p-3">
          <div className="tw:grid tw:grid-cols-4 tw:gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                handleDistanceSelect("all");
              }}
              type="button"
              aria-pressed={isIgnoringDistance}
              className={`tw:relative tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-2 tw:rounded-lg tw:text-sm tw:font-medium tw:transition-all tw:duration-200 ${
                isIgnoringDistance
                  ? "tw:bg-primary tw:text-white tw:shadow-md tw:shadow-primary/20 tw:scale-105"
                  : "tw:bg-white tw:text-gray-700 tw:border tw:border-gray-200 hover:tw:border-primary/40 hover:tw:bg-primary/5 hover:tw:text-primary"
              }`}
            >
              <span>All</span>
              <span
                className={`tw:text-[10px] tw:leading-none ${isIgnoringDistance ? "tw:text-white/70" : "tw:text-gray-400"}`}
              >
                Sellers
              </span>
            </button>
            {distanceOptions.map((distance) => {
              const selected = currentDistance === distance.toString();
              return (
                <button
                  key={distance}
                  onClick={(e) => {
                    e.preventDefault();
                    handleDistanceSelect(distance);
                  }}
                  type="button"
                  aria-pressed={selected}
                  className={`tw:relative tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-2 tw:rounded-lg tw:text-sm tw:font-medium tw:transition-all tw:duration-200 ${
                    selected
                      ? "tw:bg-primary tw:text-white tw:shadow-md tw:shadow-primary/20 tw:scale-105"
                      : "tw:bg-white tw:text-gray-700 tw:border tw:border-gray-200 hover:tw:border-primary/40 hover:tw:bg-primary/5 hover:tw:text-primary"
                  }`}
                >
                  <span>{distance}</span>
                  <span
                    className={`tw:text-[10px] tw:leading-none ${selected ? "tw:text-white/70" : "tw:text-gray-400"}`}
                  >
                    km
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </AppPopover>
  );
};

export default DistanceChooser;
