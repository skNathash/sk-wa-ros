/** A add-on the week has already earned, beside the base delivery pay. */
export interface RunnerBonus {
  key: string;
  label: string;
  /** "₹340" / "+₹200" — the sign is part of the label, since a subsidy and a
      bonus read differently even though both add up. */
  _amountLbl: string;
  /** Colour seam — the tile's fill and its figure share it. */
  _tileCls: string;
}

export const WEEK_BONUSES: RunnerBonus[] = [
  {
    key: "tips",
    label: "Tips",
    _amountLbl: "₹340",
    _tileCls: "runner-earn-tile--tips",
  },
  {
    key: "streak",
    label: "Streak",
    _amountLbl: "+₹200",
    _tileCls: "runner-earn-tile--streak",
  },
  {
    key: "fuel",
    label: "Fuel",
    _amountLbl: "₹180",
    _tileCls: "runner-earn-tile--fuel",
  },
];
