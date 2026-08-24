/** Runner shown on the home screen. Hardcoded until the runner API lands. */
export interface RunnerHome {
  name: string;
  firstName: string;
  greeting: string;
  area: string;
  city: string;
  isOnline: boolean;
  todayEarning: number;
  streakDays: number;
  weekEarning: number;
  rating: number;
  /** "Kumbalgudu · Bengaluru" — the header's place line. */
  _placeLbl: string;
  /** Today's run, read as one line under the earning: drops, km, rating. */
  _deliveriesLbl: string;
  _distanceLbl: string;
  _ratingLbl: string;
  /** Bottom strip — streak, this week, rating, each with a caption. */
  _streakCaption: string;
  _weekEarningLbl: string;
  _weekDropsCaption: string;
  _lifetimeCaption: string;
}

export const RUNNER: RunnerHome = {
  name: "Ashok Kumar",
  firstName: "Ashok",
  greeting: "Good morning",
  area: "Kumbalgudu",
  city: "Bengaluru",
  isOnline: true,
  todayEarning: 233,
  streakDays: 24,
  weekEarning: 4800,
  rating: 4.9,
  _placeLbl: "Kumbalgudu · Bengaluru",
  _deliveriesLbl: "5",
  _distanceLbl: "9.8 km",
  _ratingLbl: "4.9",
  _streakCaption: "on-time in a row",
  _weekEarningLbl: "₹4.8k",
  _weekDropsCaption: "96 drops",
  _lifetimeCaption: "842 lifetime",
};

/** A job the runner is on right now. */
export interface RunnerActiveJob {
  id: number;
  orderCode: string;
  customerName: string;
  earning: number;
  /** Card colour seam — the left rail and the ETA take the stage's colour. */
  _cardCls: string;
  /** "Pickup" / "Delivering" with the badge class that colours it. */
  _stageLbl: string;
  _stageCls: string;
  /** "B2B" / "B2C" with the badge class that colours it. */
  _typeLbl: string;
  _typeCls: string;
  /** "9:52 AM" — when the job came in. */
  _timeLbl: string;
  /** Drop line, read as one row: place, distance, item count. */
  _placeLbl: string;
  _distanceLbl: string;
  _itemsLbl: string;
  /** "ETA in 4 min" — already phrased for the card. */
  _etaLbl: string;
  /** Cash to collect, "₹240", or empty when the order is prepaid. */
  _codLbl: string;
}

export const ACTIVE_JOBS: RunnerActiveJob[] = [
  {
    id: 1,
    orderCode: "CLB-4828",
    customerName: "Green Leaf Cafe",
    earning: 42,
    _cardCls: "runner-job-card--pickup",
    _stageLbl: "Pickup",
    _stageCls: "runner-job-badge--pickup",
    _typeLbl: "B2B",
    _typeCls: "runner-job-badge--b2b",
    _timeLbl: "9:52 AM",
    _placeLbl: "Kumbalgudu",
    _distanceLbl: "0.9 km",
    _itemsLbl: "11 items",
    _etaLbl: "ETA in 4 min",
    _codLbl: "",
  },
  {
    id: 2,
    orderCode: "CLB-4805",
    customerName: "Deepa Nair",
    earning: 50,
    _cardCls: "runner-job-card--delivering",
    _stageLbl: "Delivering",
    _stageCls: "runner-job-badge--delivering",
    _typeLbl: "B2C",
    _typeCls: "runner-job-badge--b2c",
    _timeLbl: "8:22 AM",
    _placeLbl: "Ullal",
    _distanceLbl: "2.5 km",
    _itemsLbl: "3 items",
    _etaLbl: "ETA 5 min",
    _codLbl: "₹240",
  },
];

/** An open job the runner can pick up. Hardcoded until the runner API lands. */
export interface RunnerNearbyJob {
  id: number;
  orderCode: string;
  customerName: string;
  earning: number;
  /** "B2B" / "B2C" with the badge class that colours it. */
  _typeLbl: string;
  _typeCls: string;
  /** Drop line, read as one row: place, distance to drop, item count. */
  _placeLbl: string;
  _dropDistanceLbl: string;
  _itemsLbl: string;
  /** Where the runner collects from, and how far that pickup is from them. */
  _pickupStoreLbl: string;
  _pickupDistanceLbl: string;
}

export const NEARBY_JOBS: RunnerNearbyJob[] = [
  {
    id: 1,
    orderCode: "CLB-4821",
    customerName: "Anjali Sharma",
    earning: 42,
    _typeLbl: "B2C",
    _typeCls: "runner-job-badge--b2c",
    _placeLbl: "Kumbalgudu",
    _dropDistanceLbl: "1.2 km drop",
    _itemsLbl: "8",
    _pickupStoreLbl: "Sri Lakshmi Stores",
    _pickupDistanceLbl: "0.4 km",
  },
  {
    id: 2,
    orderCode: "CLB-4820",
    customerName: "Ramesh & Sons",
    earning: 41,
    _typeLbl: "B2B",
    _typeCls: "runner-job-badge--b2b",
    _placeLbl: "BEML Rd",
    _dropDistanceLbl: "0.8 km drop",
    _itemsLbl: "14",
    _pickupStoreLbl: "Sri Lakshmi Stores",
    _pickupDistanceLbl: "0.4 km",
  },
  {
    id: 3,
    orderCode: "CLB-4818",
    customerName: "Priya Menon",
    earning: 48,
    _typeLbl: "B2C",
    _typeCls: "runner-job-badge--b2c",
    _placeLbl: "Ullal",
    _dropDistanceLbl: "2.1 km drop",
    _itemsLbl: "5",
    _pickupStoreLbl: "Anjali Provisions",
    _pickupDistanceLbl: "0.9 km",
  },
];

/** Feed header — "4 within 3 km" beside the AVAILABLE NEAR YOU label. */
export const NEARBY_JOBS_COUNT_LBL = "4 within 3 km";
