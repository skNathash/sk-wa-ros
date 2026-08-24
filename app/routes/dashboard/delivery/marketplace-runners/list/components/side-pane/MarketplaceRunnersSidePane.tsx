import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useDebouncedCallback } from "use-debounce";
import OpenOrdersList from "./open-orders/OpenOrdersList";
import OpenOrdersSkeleton from "./open-orders/OpenOrdersSkeleton";
import {
  filterOpenOrders,
  getOpenOrders,
  type OpenOrder,
} from "./open-orders/helper";
import RunnerPaneChips from "./RunnerPaneChips";
import RunnerPaneHeader from "./RunnerPaneHeader";
import RunnerPaneSearch from "./RunnerPaneSearch";
import VehicleFilterList from "./vehicle-filter/VehicleFilterList";
import VehicleFilterSkeleton from "./vehicle-filter/VehicleFilterSkeleton";
import {
  VEHICLE_OPTIONS,
  getVehicleCounts,
  type VehicleOption,
} from "./vehicle-filter/helper";
import {
  DEFAULT_VIEW,
  RUNNER_SEARCH_PARAM,
  RUNNER_VEHICLE_PARAM,
  RUNNER_VIEW_PARAM,
  getNearbyRunners,
  getRunnerPaneCounts,
  type NearbyRunner,
  type RunnerViewKey,
} from "./helper";
import DeliveryNavChips from "~/shared/delivery/components/delivery-side-pane/DeliveryNavChips";

interface MarketplaceRunnersSidePaneProps {
  className?: string;
}

/**
 * The marketplace's filter rail: how the grid beside it is ranked, which
 * vehicles are working around the store, and the store's own orders still
 * waiting on a runner.
 *
 * Every control writes into the current URL rather than into pane state, so
 * the grid reads its filter off the address bar and the view survives a
 * reload or a shared link. The nearby set is loaded once, unfiltered, so the
 * vehicle rows can carry their counts.
 */
export default function MarketplaceRunnersSidePane({
  className,
}: MarketplaceRunnersSidePaneProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [runners, setRunners] = useState<NearbyRunner[]>();
  const [orders, setOrders] = useState<OpenOrder[]>();
  const [search, setSearch] = useState(
    searchParams.get(RUNNER_SEARCH_PARAM) || "",
  );

  const activeView = (searchParams.get(RUNNER_VIEW_PARAM) ||
    DEFAULT_VIEW) as RunnerViewKey;
  const activeVehicle = searchParams.get(RUNNER_VEHICLE_PARAM) || "all";

  useEffect(() => {
    let cancelled = false;

    getNearbyRunners()
      .then((result) => {
        if (!cancelled) setRunners(result);
      })
      .catch(() => {
        if (!cancelled) setRunners([]);
      });

    getOpenOrders()
      .then((result) => {
        if (!cancelled) setOrders(result);
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => getRunnerPaneCounts(runners || []), [runners]);

  const vehicleCounts = useMemo(
    () => getVehicleCounts(runners || [], VEHICLE_OPTIONS),
    [runners],
  );

  const visibleOrders = useMemo(
    () => filterOpenOrders(orders || [], search),
    [orders, search],
  );

  /** Patch one key of the current query string, leaving the rest alone. */
  const setParam = (key: string, value: string) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true, preventScrollReset: true },
    );

  const writeSearch = useDebouncedCallback(
    (value: string) => setParam(RUNNER_SEARCH_PARAM, value),
    500,
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    writeSearch(value);
  };

  const handleViewSelect = (key: RunnerViewKey) =>
    setParam(RUNNER_VIEW_PARAM, key);

  /** The unrestricted row clears the param rather than writing "all". */
  const handleVehicleSelect = (option: VehicleOption) =>
    setParam(RUNNER_VEHICLE_PARAM, option.value);

  return (
    <div className={clsx("tw:flex tw:flex-col tw:gap-4", className)}>
      <RunnerPaneHeader availableCount={counts.available} />

      <DeliveryNavChips activeKey="runners" />

      {/* <RunnerPaneSearch value={search} onChange={handleSearchChange} /> */}

      {/* <RunnerPaneChips
        activeKey={activeView}
        counts={counts}
        onSelect={handleViewSelect}
        className="tw:px-1"
      /> */}

      {!runners ? (
        <VehicleFilterSkeleton />
      ) : (
        <VehicleFilterList
          activeKey={activeVehicle}
          counts={vehicleCounts}
          onSelect={handleVehicleSelect}
        />
      )}

      {!orders ? (
        <OpenOrdersSkeleton />
      ) : (
        <OpenOrdersList
          orders={visibleOrders}
          onSelect={(order) => console.log("open order picked", order)}
        />
      )}
    </div>
  );
}
