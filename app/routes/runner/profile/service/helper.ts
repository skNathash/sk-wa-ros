/** How far out the runner will ride, and what that reach is worth. */
export const SERVICE_RADIUS = {
  minKm: 1,
  maxKm: 15,
  defaultKm: 8,
  _shopsLbl: "~ 42 shops in range",
  _creditLbl: "Google · Map data © 2026",
};

/** A day of the week, as a single letter on the toggle row. */
export interface RunnerShiftDay {
  key: string;
  _dayLbl: string;
  isOn: boolean;
}

export const SERVICE_DAYS: RunnerShiftDay[] = [
  { key: "mon", _dayLbl: "M", isOn: true },
  { key: "tue", _dayLbl: "T", isOn: true },
  { key: "wed", _dayLbl: "W", isOn: true },
  { key: "thu", _dayLbl: "T", isOn: true },
  { key: "fri", _dayLbl: "F", isOn: true },
  { key: "sat", _dayLbl: "S", isOn: true },
  { key: "sun", _dayLbl: "S", isOn: false },
];

/** The window the runner holds on the days they work. */
export const SERVICE_HOURS = {
  _fromLbl: "8:00 AM",
  _toLbl: "9:00 PM",
};

/** A retailer the runner takes jobs from, and the run they have with them. */
export interface RunnerServiceStore {
  key: string;
  _nameLbl: string;
  _avatarLbl: string;
  _avatarCls: string;
  /** "187 jobs · 30 days" — the record that earns the primary tag. */
  _jobsLbl: string;
  _periodLbl: string;
  /** Set only on the shop that sends the most work; blank on the rest. */
  _primaryLbl: string;
  isOn: boolean;
}

export const SERVICE_STORES: RunnerServiceStore[] = [
  {
    key: "lakshmi",
    _nameLbl: "Sri Lakshmi Stores",
    _avatarLbl: "SL",
    _avatarCls: "runner-chat-avatar--teal",
    _jobsLbl: "187 jobs",
    _periodLbl: "30 days",
    _primaryLbl: "Primary",
    isOn: true,
  },
  {
    key: "anjali",
    _nameLbl: "Anjali Provisions",
    _avatarLbl: "AP",
    _avatarCls: "runner-chat-avatar--blue",
    _jobsLbl: "54 jobs",
    _periodLbl: "30 days",
    _primaryLbl: "",
    isOn: true,
  },
  {
    key: "ramesh",
    _nameLbl: "Ramesh Kirana",
    _avatarLbl: "RK",
    _avatarCls: "runner-chat-avatar--orange",
    _jobsLbl: "28 jobs",
    _periodLbl: "30 days",
    _primaryLbl: "",
    isOn: true,
  },
  {
    key: "divya",
    _nameLbl: "Divya Mart",
    _avatarLbl: "DM",
    _avatarCls: "runner-chat-avatar--brand",
    _jobsLbl: "19 jobs",
    _periodLbl: "30 days",
    _primaryLbl: "",
    isOn: true,
  },
  {
    key: "sunrise",
    _nameLbl: "Sunrise Supermart",
    _avatarLbl: "SS",
    _avatarCls: "runner-chat-avatar--amber",
    _jobsLbl: "6 jobs",
    _periodLbl: "30 days",
    _primaryLbl: "",
    isOn: false,
  },
];

export const SERVICE_RADIUS_LBL = "Delivery radius";
export const SERVICE_HOURS_LBL = "Working hours & days";
export const SERVICE_STORES_LBL = "Retailers you work with";
export const SERVICE_STORES_COUNT_LBL = "5 shops";
export const SERVICE_FROM_LBL = "From";
export const SERVICE_TO_LBL = "To";
