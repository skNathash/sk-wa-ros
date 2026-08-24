import MarketplaceRunnerService from "~/services/MarketplaceRunnerService";
import AuthService from "~/services/AuthService";

/** How far around the store the pane counts marketplace runners, in km. */
const NEARBY_DISTANCE_KM = 1;

/** Runners pulled in one page — the pane only counts and lists nearby ones. */
const NEARBY_LIMIT = 100;

/** A runner is only offered by the marketplace once the sign-up is through. */
const ACTIVE_STATUS = "Active";

/** Rating from which a runner counts as top rated on the chip badge. */
const TOP_RATED_FROM = 4.5;

/**
 * Query params the pane owns. Every chip, vehicle row and search keystroke
 * writes into the current URL, so the marketplace grid beside the pane reads
 * its filter off the address bar and the view survives a reload or a share.
 */
export const RUNNER_VIEW_PARAM = "view";
export const RUNNER_VEHICLE_PARAM = "vehicle";
export const RUNNER_SEARCH_PARAM = "search";

/** How the marketplace is ranked; the chip strip is the switch. */
export type RunnerViewKey = "now" | "top-rated" | "cheapest" | "nearest";

export const DEFAULT_VIEW: RunnerViewKey = "now";

export const RUNNER_VIEWS: Array<{ key: RunnerViewKey; label: string }> = [
  { key: "now", label: "Now" },
  { key: "top-rated", label: "Top rated" },
  { key: "cheapest", label: "Cheapest" },
  { key: "nearest", label: "Nearest" },
];

/** One runner as `franchise/runner/nearby` returns it. */
export interface NearbyRunner extends Record<string, any> {
  _id: string;
  name: string;
  status: string;
  isAvailable: boolean;
  vehicleType: string;
  rating: number;
}

/** What the header and the chip badges print. */
export interface RunnerPaneCounts {
  available: number;
  topRated: number;
}

/**
 * Marketplace runners working around the store right now. The endpoint is a
 * geo search, so the store's lat/lng always ride along; `idle` keeps it to
 * runners free to take a drop this minute.
 *
 * @param vehicleType - narrows to one vehicle; omit for every vehicle, which
 *   is what the pane needs to count the vehicle rows in one call.
 */
export async function getNearbyRunners(
  vehicleType?: string,
): Promise<NearbyRunner[]> {
  const coords = AuthService.getLoggedInUserLatLng();

  const filter: Record<string, any> = {
    status: ACTIVE_STATUS,
    isAvailable: true,
  };
  if (vehicleType) filter.vehicleType = vehicleType;

  const response = await MarketplaceRunnerService.getNearbyRunners({
    lat: coords?.lat,
    lng: coords?.lng,
    distance: NEARBY_DISTANCE_KM,
    idle: true,
    limit: NEARBY_LIMIT,
    filter,
  });

  // Response shape is still to be handed over — logged until it lands.
  console.log("nearby runners", response);

  return response?.data?.data || [];
}

/** Header and chip badges, read off the whole nearby set. */
export function getRunnerPaneCounts(
  runners: NearbyRunner[],
): RunnerPaneCounts {
  return {
    available: runners.length,
    topRated: runners.filter((runner) => runner.rating >= TOP_RATED_FROM)
      .length,
  };
}
