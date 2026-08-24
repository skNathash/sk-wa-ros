import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import MarketplaceRunnerService from "~/services/MarketplaceRunnerService";

/** How wide the pane looks around the store for its own runners, in km. */
const PANE_RADIUS_KM = 25;

/** Runners the pane pulls in one page — the store's own roster is small. */
const PANE_LIMIT = 100;

/** A runner is only on the roster once the registration is through. */
const ACTIVE_STATUS = "Active";

/** The registration fields a sign-up has to carry to count as complete. */
const KYC_FIELDS = ["vehicleType", "vehicleNumber", "licenceNo", "aadhaarNo"];

/** Working state shown as the pill on the right of a runner row. */
export type RunnerPresence = "online" | "idle" | "offline";

/** One runner in the pane, as `franchise/runner/nearby` returns it. */
export interface PaneRunner extends Record<string, any> {
  _id: string;
  name: string;
  mobile: string;
  status: string;
  isAvailable: boolean;
  /** The store's own first-call runner, badged PRIMARY on the row. */
  isPrimary: boolean;
  /** Set once the mobile has been proved with the OTP. */
  isMobileVerified: boolean;
  vehicleType: string;
  vehicleNumber: string;
  rating: number;
  totalDeliveries: number;
  /** Display fields derived once in {@link getPaneRunners}. */
  _initials: string;
  _ratingLbl: number;
  /** "KA01 HK 4821 · scooter" caption under the name. */
  _vehicleLbl: string;
  /** Which pill the row shows, and what it reads. */
  _presence: RunnerPresence;
  /** True while the registration is unfinished — the sign-up section. */
  _isPending: boolean;
  /** How much of the registration checklist is filled in, 0-100. */
  _kycPercent: number;
  /** "OTP verified · KYC 60%" caption on a pending sign-up. */
  _pendingLbl: string;
}

/** Pill colours per presence, keyed by {@link RunnerPresence}. */
export const PRESENCE_THEME: Record<
  RunnerPresence,
  { label: string; className: string }
> = {
  online: {
    label: "Online",
    className: "tw:bg-emerald-100 tw:text-emerald-700",
  },
  idle: {
    label: "Idle",
    className: "tw:bg-slate-100 tw:text-slate-600",
  },
  offline: {
    label: "Offline",
    className: "tw:bg-slate-100 tw:text-slate-500",
  },
};

/** The pane's filter chips; the key drives {@link filterRunners}. */
export type RunnerChipKey = "all" | "online" | "pending";

export const RUNNER_CHIPS: Array<{ key: RunnerChipKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "online", label: "Online" },
  { key: "pending", label: "Pending KYC" },
];

/** Headline counts — the pane header and the chip badges read off this. */
export interface RunnerCounts {
  all: number;
  online: number;
  pending: number;
}

/**
 * The store's own runners, nearest first. The endpoint is a geo search around
 * the store, so the store's lat/lng always ride along; the franchise filter is
 * what narrows it from the whole marketplace to this store's roster, and the
 * status is left open so half-finished sign-ups come back too.
 */
export async function getPaneRunners(): Promise<PaneRunner[]> {
  const coords = AuthService.getLoggedInUserLatLng();

  const response = await MarketplaceRunnerService.getNearbyRunners({
    lat: coords?.lat,
    lng: coords?.lng,
    radiusKm: PANE_RADIUS_KM,
    page: 1,
    limit: PANE_LIMIT,
    sort: { totalDeliveries: -1 },
    filter: { franchiseId: AuthService.getLoggedInUserId() },
  });

  const runners = response?.data?.data || [];

  return runners.map(formatRunner);
}

/** Derive everything a pane row renders. */
function formatRunner(runner: Record<string, any>): PaneRunner {
  const kycPercent = getKycPercent(runner);
  const isPending = runner.status !== ACTIVE_STATUS;

  return {
    ...runner,
    _initials: CommonService.prepareInitials(runner.name),
    _ratingLbl: CommonService.roundedByDecimalPlace(runner.rating, 1),
    _vehicleLbl: `${runner.vehicleNumber} · ${runner.vehicleType}`,
    _presence: getPresence(runner),
    _isPending: isPending,
    _kycPercent: kycPercent,
    _pendingLbl: `${
      runner.isMobileVerified ? "OTP verified" : "OTP pending"
    } · KYC ${kycPercent}%`,
  } as PaneRunner;
}

/**
 * Online while the runner is free to take a drop, idle once they are on the
 * roster but busy, and offline while the registration is still open.
 */
function getPresence(runner: Record<string, any>): RunnerPresence {
  if (runner.status !== ACTIVE_STATUS) return "offline";
  return runner.isAvailable ? "online" : "idle";
}

/** Share of {@link KYC_FIELDS} the sign-up has answered so far. */
function getKycPercent(runner: Record<string, any>): number {
  const filled = KYC_FIELDS.filter((field) => runner[field]).length;
  return Math.round((filled / KYC_FIELDS.length) * 100);
}

/** Headline counts over the whole roster, before search or chip narrowing. */
export function getRunnerCounts(runners: PaneRunner[]): RunnerCounts {
  return {
    all: runners.length,
    online: runners.filter((runner) => runner._presence === "online").length,
    pending: runners.filter((runner) => runner._isPending).length,
  };
}

/** Narrow the roster by the active chip and the search box, in that order. */
export function filterRunners(
  runners: PaneRunner[],
  chip: RunnerChipKey,
  search: string,
): PaneRunner[] {
  const term = search.trim().toLowerCase();

  return runners.filter((runner) => {
    if (chip === "online" && runner._presence !== "online") return false;
    if (chip === "pending" && !runner._isPending) return false;

    if (!term) return true;

    return (
      runner.name.toLowerCase().includes(term) ||
      runner.vehicleNumber.toLowerCase().includes(term)
    );
  });
}
