import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAccountsDateRange from "~/shared/accounts/hooks/useAccountsDateRange";
import {
  emptyCollectionLanes,
  getCollectionLanes,
  type CollectionLanesData,
  type LaneKey,
} from "./helper";

type CollectionLanesProps = {
  /** Lane the page is currently filtered to; the card is outlined. */
  activeLane?: LaneKey;
  /** Tapping a card switches the lane the lists below are read for. */
  onLaneChange?: (lane: LaneKey) => void;
};

// The two lanes money arrives through, with their mode-wise split — tapping a
// card scopes the lists below it to that lane.
const CollectionLanes = ({ activeLane, onLaneChange }: CollectionLanesProps) => {
  const range = useAccountsDateRange();

  const [data, setData] = useState<CollectionLanesData>(emptyCollectionLanes);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: CollectionLanesData;
      try {
        result = await getCollectionLanes(range);
      } catch (e) {
        result = emptyCollectionLanes();
      }
      if (cancelled) return;
      setData(result);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [range]);

  if (loading) {
    return (
      <div className="tw:mb-3 tw:rounded-2xl tw:bg-white tw:p-6 tw:text-center tw:shadow-sm">
        <AppSpinner />
      </div>
    );
  }

  return (
    <div className="tw:mb-3 tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-3">
      {data.lanes.map((lane) => {
        const selected = lane.key === activeLane;
        return (
          <button
            key={lane.key}
            type="button"
            onClick={() => onLaneChange?.(lane.key)}
            className="tw:cursor-pointer tw:overflow-hidden tw:rounded-2xl tw:border-2 tw:bg-white tw:text-left tw:shadow-sm tw:transition-colors"
            style={{ borderColor: selected ? lane.accent : "transparent" }}
          >
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-gray-100 tw:px-4 tw:py-3">
              <div
                className="tw:text-sm tw:font-bold"
                style={{ color: lane.accent }}
              >
                {lane.label}
              </div>
              <div className="tw:text-[11px] tw:text-gray-500">
                {lane.periodLabel}
              </div>
            </div>

            <div className="tw:px-4 tw:py-3">
              <div className="tw:text-2xl tw:font-bold tw:text-gray-900">
                <Amount value={lane.amount} decimalPlaces={0} />
              </div>
              <div className="tw:text-[11px] tw:text-gray-500">{lane.meta}</div>

              {/* Mode split — the same money, cut by how it reached the shop. */}
              <div className="tw:mt-3 tw:flex tw:flex-wrap tw:gap-x-6 tw:gap-y-2">
                {lane.modes.map((mode) => (
                  <div key={mode.key}>
                    <div className="tw:text-[11px] tw:text-gray-500">
                      {mode.label}
                    </div>
                    <div className="tw:text-sm tw:font-bold tw:text-gray-800">
                      <Amount value={mode.amount} decimalPlaces={0} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default CollectionLanes;
