import type { TabItem } from "~/types/CommonTypes";

/** The three feeds the job list switches between, and the query param key. */
export const JOB_TAB_PARAM = "tab";

export type RunnerJobTabKey = "active" | "today" | "available";

export const JOB_TABS: TabItem[] = [
  { key: "active", name: "Active", count: 2, countColor: "tw:bg-primary" },
  { key: "today", name: "Today", count: 7, countColor: "tw:bg-slate-400" },
  {
    key: "available",
    name: "Available",
    count: 4,
    countColor: "tw:bg-emerald-500",
  },
];

export const DEFAULT_JOB_TAB: RunnerJobTabKey = "active";

/** Masthead lines for the screen. Hardcoded until the runner API lands. */
export const JOBS_HEADER = {
  title: "Your jobs",
  subtitle: "2 active · 7 delivered today",
};

/**
 * A job the runner is on right now — the map card. Hardcoded until the runner
 * API lands.
 */
export interface RunnerActiveJobCard {
  id: number;
  orderCode: string;
  /** Where the runner is headed on this leg — the store or the customer. */
  name: string;
  lat: number;
  lng: number;
  /** Card colour seam — the stage strip, the rail and the ETA share it. */
  _cardCls: string;
  /** "Pickup from retailer" / "Delivering to customer" — the strip's label. */
  _stageLbl: string;
  /** "Pickup at" / "Drop to" — the label above the name. */
  _targetLbl: string;
  /** "ETA in 4 min" — already phrased for the chip on the map. */
  _etaLbl: string;
  /** The leg read as one row: place, distance, items, weight. */
  _placeLbl: string;
  _distanceLbl: string;
  _itemsLbl: string;
  _weightLbl: string;
  /** "Navigate to pickup" / "Navigate to drop" — the primary action. */
  _actionLbl: string;
  /** "Collect ₹240 on delivery", or empty when the order is prepaid. */
  _collectLbl: string;
}

export const ACTIVE_JOB_CARDS: RunnerActiveJobCard[] = [
  {
    id: 1,
    orderCode: "CLB-4828",
    name: "Green Leaf Cafe",
    lat: 12.9008,
    lng: 77.4471,
    _cardCls: "runner-job-card--pickup",
    _stageLbl: "Pickup from retailer",
    _targetLbl: "Pickup at",
    _etaLbl: "ETA in 4 min",
    _placeLbl: "Kumbalgudu",
    _distanceLbl: "0.9 km",
    _itemsLbl: "11 items",
    _weightLbl: "6.4 kg",
    _actionLbl: "Navigate to pickup",
    _collectLbl: "",
  },
  {
    id: 2,
    orderCode: "CLB-4805",
    name: "Deepa Nair",
    lat: 12.8161,
    lng: 77.5115,
    _cardCls: "runner-job-card--delivering",
    _stageLbl: "Delivering to customer",
    _targetLbl: "Drop to",
    _etaLbl: "ETA 5 min",
    _placeLbl: "Ullal",
    _distanceLbl: "2.5 km",
    _itemsLbl: "3 items",
    _weightLbl: "0.9 kg",
    _actionLbl: "Navigate to drop",
    _collectLbl: "Collect ₹240 on delivery",
  },
];

/** A job on today's run — delivered or still moving. */
export interface RunnerTodayJob {
  id: number;
  orderCode: string;
  customerName: string;
  earning: number;
  /** Card colour seam — the left rail takes the status colour. */
  _cardCls: string;
  /** "Pickup" / "Delivering" / "Delivered" with the badge class. */
  _statusLbl: string;
  _statusCls: string;
  /** "B2B" / "B2C" with the badge class that colours it. */
  _typeLbl: string;
  _typeCls: string;
  /** "9:52 AM" — when the job came in. */
  _timeLbl: string;
  /** Drop line, read as one row: place, distance, item count. */
  _placeLbl: string;
  _distanceLbl: string;
  _itemsLbl: string;
  /** "ETA in 4 min", or empty once the job is closed. */
  _etaLbl: string;
  /** Cash collected, "₹240", or empty when the order is prepaid. */
  _codLbl: string;
  /** The customer's stars, or 0 while the job is still running. */
  _rating: number;
}

export const TODAY_JOBS: RunnerTodayJob[] = [
  {
    id: 1,
    orderCode: "CLB-4828",
    customerName: "Green Leaf Cafe",
    earning: 42,
    _cardCls: "runner-job-card--pickup",
    _statusLbl: "Pickup",
    _statusCls: "runner-job-badge--pickup",
    _typeLbl: "B2B",
    _typeCls: "runner-job-badge--b2b",
    _timeLbl: "9:52 AM",
    _placeLbl: "Kumbalgudu",
    _distanceLbl: "0.9 km",
    _itemsLbl: "11 items",
    _etaLbl: "ETA in 4 min",
    _codLbl: "",
    _rating: 0,
  },
  {
    id: 2,
    orderCode: "CLB-4805",
    customerName: "Deepa Nair",
    earning: 50,
    _cardCls: "runner-job-card--delivering",
    _statusLbl: "Delivering",
    _statusCls: "runner-job-badge--delivering",
    _typeLbl: "B2C",
    _typeCls: "runner-job-badge--b2c",
    _timeLbl: "8:22 AM",
    _placeLbl: "Ullal",
    _distanceLbl: "2.5 km",
    _itemsLbl: "3 items",
    _etaLbl: "ETA 5 min",
    _codLbl: "₹240",
    _rating: 0,
  },
  {
    id: 3,
    orderCode: "CLB-4790",
    customerName: "Ashwini Rao",
    earning: 47,
    _cardCls: "runner-job-card--delivered",
    _statusLbl: "Delivered",
    _statusCls: "runner-job-badge--delivered",
    _typeLbl: "B2C",
    _typeCls: "runner-job-badge--b2c",
    _timeLbl: "7:14 AM",
    _placeLbl: "Ullal",
    _distanceLbl: "2 km",
    _itemsLbl: "5 items",
    _etaLbl: "",
    _codLbl: "₹350",
    _rating: 5,
  },
  {
    id: 4,
    orderCode: "CLB-4789",
    customerName: "Ravi Krishna",
    earning: 46,
    _cardCls: "runner-job-card--delivered",
    _statusLbl: "Delivered",
    _statusCls: "runner-job-badge--delivered",
    _typeLbl: "B2C",
    _typeCls: "runner-job-badge--b2c",
    _timeLbl: "7:03 AM",
    _placeLbl: "BEML Rd",
    _distanceLbl: "1.9 km",
    _itemsLbl: "7 items",
    _etaLbl: "",
    _codLbl: "",
    _rating: 5,
  },
  {
    id: 5,
    orderCode: "CLB-4786",
    customerName: "Divya Mart",
    earning: 58,
    _cardCls: "runner-job-card--delivered",
    _statusLbl: "Delivered",
    _statusCls: "runner-job-badge--delivered",
    _typeLbl: "B2B",
    _typeCls: "runner-job-badge--b2b",
    _timeLbl: "6:32 AM",
    _placeLbl: "Kumbalgudu",
    _distanceLbl: "0.6 km",
    _itemsLbl: "14 items",
    _etaLbl: "",
    _codLbl: "₹1,120",
    _rating: 4,
  },
];

/** Feed header — the day's tally beside the store the runner is riding for. */
export const TODAY_SUMMARY_LBL = "5 delivered · 2 in progress";
export const TODAY_STORE_LBL = "Sri Lakshmi Stores · today";

/** An open job the runner can still claim. */
export interface RunnerAvailableJob {
  id: number;
  orderCode: string;
  earning: number;
  /** Where the runner collects from, and how far that pickup is from them. */
  _pickupStoreLbl: string;
  _pickupDistanceLbl: string;
  /** Who it goes to, where, and how far the drop is from the pickup. */
  _dropNameLbl: string;
  _dropPlaceLbl: string;
  _dropDistanceLbl: string;
  /** What the run carries and what it collects. */
  _itemsLbl: string;
  _codLbl: string;
  /** "B2B" / "B2C" with the badge class that colours it. */
  _typeLbl: string;
  _typeCls: string;
  /** "Accept +₹42" — the pay is part of the button, not just above it. */
  _acceptLbl: string;
}

export const AVAILABLE_JOBS: RunnerAvailableJob[] = [
  {
    id: 1,
    orderCode: "CLB-4821",
    earning: 42,
    _pickupStoreLbl: "Sri Lakshmi Stores",
    _pickupDistanceLbl: "0.4 km away",
    _dropNameLbl: "Anjali Sharma",
    _dropPlaceLbl: "Kumbalgudu",
    _dropDistanceLbl: "1.2 km",
    _itemsLbl: "8 items · 2.4 kg",
    _codLbl: "₹428",
    _typeLbl: "B2C",
    _typeCls: "runner-job-badge--b2c",
    _acceptLbl: "Accept +₹42",
  },
  {
    id: 2,
    orderCode: "CLB-4820",
    earning: 41,
    _pickupStoreLbl: "Sri Lakshmi Stores",
    _pickupDistanceLbl: "0.4 km away",
    _dropNameLbl: "Ramesh & Sons",
    _dropPlaceLbl: "BEML Rd",
    _dropDistanceLbl: "0.8 km",
    _itemsLbl: "14 items · 6.1 kg",
    _codLbl: "₹1,240",
    _typeLbl: "B2B",
    _typeCls: "runner-job-badge--b2b",
    _acceptLbl: "Accept +₹41",
  },
  {
    id: 3,
    orderCode: "CLB-4818",
    earning: 48,
    _pickupStoreLbl: "Anjali Provisions",
    _pickupDistanceLbl: "0.9 km away",
    _dropNameLbl: "Priya Menon",
    _dropPlaceLbl: "Ullal",
    _dropDistanceLbl: "2.1 km",
    _itemsLbl: "5 items · 1.6 kg",
    _codLbl: "",
    _typeLbl: "B2C",
    _typeCls: "runner-job-badge--b2c",
    _acceptLbl: "Accept +₹48",
  },
  {
    id: 4,
    orderCode: "CLB-4815",
    earning: 39,
    _pickupStoreLbl: "Sri Lakshmi Stores",
    _pickupDistanceLbl: "0.4 km away",
    _dropNameLbl: "Manjunath K",
    _dropPlaceLbl: "Kengeri",
    _dropDistanceLbl: "1.7 km",
    _itemsLbl: "6 items · 3.2 kg",
    _codLbl: "₹610",
    _typeLbl: "B2C",
    _typeCls: "runner-job-badge--b2c",
    _acceptLbl: "Accept +₹39",
  },
];

/** Feed note — how the open list keeps itself current. */
export const AVAILABLE_NOTE_LBL =
  "Auto-refreshes every 30s · sorted by pickup distance";
