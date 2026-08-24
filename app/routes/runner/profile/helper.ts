import type { TabItem } from "~/types/CommonTypes";

/** Masthead lines for the screen. Hardcoded until the runner API lands. */
export const PROFILE_HEADER = {
  eyebrow: "Runner app",
  statusLbl: "Online",
  title: "My profile",
  subtitle: "Runner ID R-101 · KA 01 HK 4821",
};

/**
 * The runner as they are on their own profile — identity, standing and the
 * record the platform judges them on. Hardcoded until the runner API lands.
 */
export interface RunnerProfile {
  name: string;
  rating: number;
  /** "842 deliveries" — the lifetime run beside the stars. */
  _deliveriesLbl: string;
  /** The bike and its plate, read as one line under the name. */
  _vehicleLbl: string;
  _plateLbl: string;
  /** Shift state and home area, shown as the first chip. */
  _shiftLbl: string;
  /** KYC state — the second chip, the one that gates jobs. */
  _verifiedLbl: string;
  /** Trust score, as a whole number: the ring is drawn from it. */
  trustScore: number;
  _trustLbl: string;
  /** On-time streak — the figure and what it counts. */
  streakDays: number;
  _streakUnitLbl: string;
  _streakCaption: string;
  /** Drops closed without a complaint, against the lifetime run. */
  _cleanDropsLbl: string;
  _cleanTotalLbl: string;
  _cleanCaption: string;
}

export const RUNNER_PROFILE: RunnerProfile = {
  name: "Ashok Kumar",
  rating: 4.9,
  _deliveriesLbl: "842 deliveries",
  _vehicleLbl: "Honda Activa",
  _plateLbl: "KA 01 HK 4821",
  _shiftLbl: "Online · Kumbalgudu",
  _verifiedLbl: "Verified",
  trustScore: 100,
  _trustLbl: "Trust",
  streakDays: 24,
  _streakUnitLbl: "days",
  _streakCaption: "on-time in a row",
  _cleanDropsLbl: "838",
  _cleanTotalLbl: "/ 842",
  _cleanCaption: "99.5% clean",
};

/** The five faces of the profile, each one its own route under the layout. */
export const PROFILE_TABS: TabItem[] = [
  { key: "about", name: "About" },
  { key: "kyc", name: "KYC" },
  { key: "vehicle", name: "Vehicle" },
  { key: "service", name: "Service" },
  { key: "reviews", name: "Reviews" },
];

/** Tab key → the path it owns. About is the profile's own index route. */
export const PROFILE_TAB_PATHS: Record<string, string> = {
  about: "/runner/profile",
  kyc: "/runner/profile/kyc",
  vehicle: "/runner/profile/vehicle",
  service: "/runner/profile/service",
  reviews: "/runner/profile/reviews",
};

export const DEFAULT_PROFILE_TAB = "about";
