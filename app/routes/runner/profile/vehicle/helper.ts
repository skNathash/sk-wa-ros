/** The bike the runner rides, as the platform records it. */
export const RUNNER_VEHICLE = {
  _nameLbl: "Honda Activa 5G",
  _typeLbl: "Scooter",
  _fuelLbl: "petrol",
  /** The plate, split the way a plate is read: state code, then the rest. */
  _plateStateLbl: "KA 01",
  _plateSeriesLbl: "HK 4821",
};

/** The two facts dispatch assigns on — what the bike takes, and its cover. */
export const VEHICLE_FACTS = [
  { key: "capacity", _labelLbl: "Capacity", _valueLbl: "6 bags · 6 kg" },
  { key: "insurance", _labelLbl: "Insurance", _valueLbl: "Valid till 2027" },
];

/** The licence held against the bike, and how long it runs. */
export const VEHICLE_LICENCE = {
  _numberLbl: "KA01 20240012345",
  _validLbl: "Verified · valid till 2032",
  _statusLbl: "Valid",
};

export const VEHICLE_CHANGE_LBL = "Change";
export const VEHICLE_ADD_LBL = "Add a second vehicle";
