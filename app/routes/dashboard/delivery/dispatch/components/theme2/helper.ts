/** Colour the figure carries, so the strip reads at a glance. */
export type DispatchSummaryTone =
  | "neutral"
  | "blue"
  | "teal"
  | "purple"
  | "amber";

export interface DispatchSummaryTile {
  key: string;
  /** Mono eyebrow above the figure. */
  label: string;
  /** Figure, already formatted for print. */
  value: string;
  /** One line of context under the figure. */
  caption?: string;
  tone?: DispatchSummaryTone;
}

export const toneClasses: Record<DispatchSummaryTone, string> = {
  neutral: "tw:text-gray-900",
  blue: "tw:text-blue-700",
  teal: "tw:text-teal-700",
  purple: "tw:text-purple-700",
  amber: "tw:text-amber-600",
};

/** Marker placed on the stylised dispatch tracker map. */
export interface TrackerMarker {
  id: string;
  /** Order reference number shown inside the marker pill. */
  orderRef: string;
  /** Payment / pickup type: drives the marker colour. */
  type: "cod" | "prepaid" | "shop";
  /** Estimated time of arrival in minutes. */
  eta: number;
  /** Horizontal position on the map surface, 0–100%. */
  x: string;
  /** Vertical position on the map surface, 0–100%. */
  y: string;
}

/** Live runner dot rendered on the tracker map. */
export interface LiveRunner {
  id: string;
  name: string;
  initials: string;
  x: string;
  y: string;
}

/** One row in the live shipment feed. */
export interface LiveShipment {
  id: string;
  orderRef: string;
  customerName: string;
  status: "ON ROUTE" | "DELIVERED" | "DELAYED";
  runnerName: string;
  location: string;
  distanceKm: number;
  etaMinutes: number;
  amount: number;
}

/** Sample markers for the tracker map until the API is wired. */
export const defaultTrackerMarkers: TrackerMarker[] = [
  { id: "m1", orderRef: "4805", type: "cod", eta: 5, x: "28%", y: "22%" },
  { id: "m2", orderRef: "4804", type: "cod", eta: 7, x: "62%", y: "72%" },
  { id: "m3", orderRef: "4801", type: "prepaid", eta: 9, x: "46%", y: "48%" },
  { id: "m4", orderRef: "4802", type: "cod", eta: 11, x: "78%", y: "36%" },
  { id: "m5", orderRef: "4799", type: "cod", eta: 16, x: "18%", y: "40%" },
  { id: "m6", orderRef: "4797", type: "cod", eta: 22, x: "22%", y: "62%" },
  { id: "m7", orderRef: "4795", type: "cod", eta: 16, x: "38%", y: "14%" },
  { id: "m8", orderRef: "4800", type: "prepaid", eta: 14, x: "72%", y: "18%" },
  { id: "m9", orderRef: "4803", type: "cod", eta: 18, x: "82%", y: "54%" },
  { id: "m10", orderRef: "4802", type: "shop", eta: 11, x: "54%", y: "58%" },
];

/** Sample runner positions for the tracker map until the API is wired. */
export const defaultLiveRunners: LiveRunner[] = [
  { id: "r1", name: "Sunil", initials: "S", x: "32%", y: "30%" },
  { id: "r2", name: "Ravi", initials: "R", x: "56%", y: "44%" },
  { id: "r3", name: "Suresh", initials: "Su", x: "70%", y: "28%" },
  { id: "r4", name: "Ashok", initials: "A", x: "44%", y: "66%" },
];

/** Sample feed rows until the API is wired. */
export const defaultLiveShipments: LiveShipment[] = [
  {
    id: "s1",
    orderRef: "4805",
    customerName: "Deepa Nair",
    status: "ON ROUTE",
    runnerName: "Ashok",
    location: "Ullal",
    distanceKm: 2.5,
    etaMinutes: 5,
    amount: 240,
  },
  {
    id: "s2",
    orderRef: "4804",
    customerName: "Sunil Rathi",
    status: "ON ROUTE",
    runnerName: "Ashok",
    location: "BEML Rd",
    distanceKm: 1.8,
    etaMinutes: 7,
    amount: 1104,
  },
  {
    id: "s3",
    orderRef: "4802",
    customerName: "Radhika Rao",
    status: "ON ROUTE",
    runnerName: "Ravi",
    location: "Kengeri Sat",
    distanceKm: 2.9,
    etaMinutes: 11,
    amount: 180,
  },
  {
    id: "s4",
    orderRef: "4803",
    customerName: "Manoj Suppliers",
    status: "ON ROUTE",
    runnerName: "Suresh",
    location: "Bidadi",
    distanceKm: 5.4,
    etaMinutes: 18,
    amount: 2140,
  },
];
