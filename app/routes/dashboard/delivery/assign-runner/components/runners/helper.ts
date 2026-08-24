import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import MarketplaceRunnerService from "~/services/MarketplaceRunnerService";
import LogisticsService from "~/services/LogisticsService";
import type { PaginationState } from "~/types/CommonTypes";
import type { AssignRunnerOrder } from "../../helper";

/** One row of the nearby-runner list (`franchise/runner/nearby`). */
export interface Runner extends Record<string, any> {
  id: string;
  name: string;
  mobile: string;
  status: string;
  isAvailable: boolean;
  vehicleType: string;
  vehicleNumber: string;
  rating: number;
  /** Live jobs the runner is carrying, out of what they can take. */
  activeShipments: number;
  maxShipments: number;
  /** Kilometres from the store, as returned by the nearby query. */
  distance: number;
  /** Minutes to the drop. */
  eta: number;
  /** Display fields derived once in `getData`. */
  initials: string;
  /** "KA03 MP 2244 · scooter" caption under the name. */
  meta: string;
  /** "2/5" load, and how full that is as a percentage. */
  loadLbl: string;
  loadPct: number;
  loadColor: "success" | "warning" | "danger";
  etaLbl: string;
  /** "via Kumbalgudu" — the locality the runner rides in from. */
  viaLbl: string;
  /** Score to one decimal, e.g. "4.5". */
  ratingLbl: string;
  /** 0–100 suitability for this drop, as the API reports it (defaults to 0). */
  fitScore: number;
  fitColor: "success" | "warning" | "danger";
  /** Whether the API flags this runner as a top match for the drop. */
  isTop: boolean;
}

/** The chips the list filters by; `all` applies no extra condition. */
export type RunnerTabKey = "all" | "free" | "online";

/**
 * Build the nearby-runner query. The endpoint is a geo search around the
 * store, so lat/lng always ride along with the paging and filter.
 */
export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort: { key: string; value: "asc" | "desc" },
) => {
  const coords = AuthService.getLoggedInUserLatLng();

  const params: Record<string, any> = {
    lat: coords?.lat,
    lng: coords?.lng,
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    sort: { [sort.key]: sort.value === "asc" ? 1 : -1 },
    filter: {
      status: "Active",
    },
  };

  const search = filter.search?.trim();
  if (search) {
    params.filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { mobile: { $regex: search, $options: "i" } },
      { vehicleNumber: { $regex: search, $options: "i" } },
      { "vehicleDetails.vehicleNo": { $regex: search, $options: "i" } },
    ];
  }

  // "Free" runners are the ones carrying nothing right now; "Online" are the
  // ones on shift, whatever they are carrying.
  if (filter.tab === "free") {
    params.filter.activeShipments = 0;
  }

  if (filter.tab === "online") {
    params.filter.isAvailable = true;
  }

  return params;
};

export async function getData(params: Record<string, any>): Promise<Runner[]> {
  const response = await MarketplaceRunnerService.getNearbyRunners(params);
  const runners = response?.data?.data || [];

  return runners.map(formatRunner);
}

export async function getCount(params: Record<string, any>): Promise<number> {
  const response = await MarketplaceRunnerService.getNearbyRunners({
    ...params,
    outputType: "count",
  });

  return response?.data?.count || 0;
}

/**
 * Assign the picked runner to the order. Same shipment call the dispatch desk
 * makes — the runner is one of the store's own people, so the assignment is an
 * internal, personal delivery.
 */
export async function assignRunner(order: AssignRunnerOrder, runner: Runner) {
  return LogisticsService.assignDelivery({
    orderId: order._id,
    invoiceId: order._invoiceId,
    deliveryAgentId: runner.id,
    deliveryAgentType: "Internal",
    deliveryProcessType: "Personal",
    orderType: order.orderType,
    orderValue: order._payableAmt,
  });
}

/** Derive everything the runner row renders. */
function formatRunner(runner: Record<string, any>): Runner {
  const activeShipments = Number(runner.activeShipments) || 0;
  const maxShipments = Number(runner.maxShipments) || 0;
  const eta = Number(runner.eta) || 0;
  const fitScore = Number(runner.fitScore) || 0;
  const rating = Number(runner.rating) || 0;
  const city = runner.address?.city || "";
  const vehicleNumber =
    runner.vehicleNumber || runner.vehicleDetails?.vehicleNo || "";
  const vehicleType = runner.vehicleType || runner.vehicleDetails?.type || "";

  const loadPct = maxShipments ? (activeShipments / maxShipments) * 100 : 0;

  return {
    ...runner,
    id: runner._id ?? runner.id,
    rating,
    initials: CommonService.prepareInitials(runner.name),
    meta: [vehicleNumber, vehicleType].filter(Boolean).join(" · "),
    loadLbl: `${activeShipments}/${maxShipments}`,
    loadPct,
    loadColor: loadPct > 80 ? "danger" : loadPct > 50 ? "warning" : "success",
    etaLbl: eta ? `${eta} min` : "--",
    viaLbl: city ? `via ${city}` : "",
    ratingLbl: rating
      ? String(CommonService.roundedByDecimalPlace(rating, 1))
      : "--",
    fitScore,
    fitColor:
      fitScore >= 70 ? "success" : fitScore >= 40 ? "warning" : "danger",
    isTop: Boolean(runner.isTop ?? runner.isTopMatch ?? false),
  } as Runner;
}
