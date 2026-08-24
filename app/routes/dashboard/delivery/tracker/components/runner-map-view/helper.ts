import AuthService from "~/services/AuthService";
import MarketplaceRunnerService from "~/services/MarketplaceRunnerService";

const RADIUS_KM = 20;
const LIMIT = 50;

/** One marker on the live map — a nearby runner carrying a shipment. */
export interface MapRunner {
  _id: string;
  name: string;
  status: string;
  vehicleType: string;
  vehicleNumber: string;
  activeShipments: number;
  maxShipments: number;
  distance: number;
  eta: number;
  lat: number;
  lng: number;
  _initials: string;
  _loadLbl: string;
  _meta: string;
}

/**
 * Fetch the store's own runners currently carrying a shipment, for the live
 * map. Same geo-search the assign/register panes use, but pinned to the
 * tracker's fixed 20 km radius and "carrying only" scope.
 */
export async function getMapRunners(): Promise<MapRunner[]> {
  const coords = AuthService.getLoggedInUserLatLng();

  const response = await MarketplaceRunnerService.getNearbyRunners({
    lat: coords?.lat,
    lng: coords?.lng,
    radiusKm: RADIUS_KM,
    carrying: true,
    franchiseId: AuthService.getLoggedInUserId(),
    limit: LIMIT,
  });

  const runners = response?.data?.data || [];
  return runners.map(formatRunner);
}

/** Derive the fields a map marker renders. */
function formatRunner(runner: Record<string, any>): MapRunner {
  return {
    ...runner,
    _initials: (runner.name || "")
      .split(" ")
      .map((part: string) => part?.[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    _loadLbl: `${runner.activeShipments}/${runner.maxShipments}`,
    _meta: [runner.vehicleNumber, runner.vehicleType].filter(Boolean).join(" · "),
  } as MapRunner;
}
