/**
 * The week the runner is in the middle of, and where its money lands.
 * Hardcoded until the runner API lands.
 */
export interface RunnerWeekEarning {
  amount: number;
  /** "This week · Mon 27 Jul – Sun 2 Aug" — the band's own period line. */
  _periodLbl: string;
  /** "so far" — the week is still running, so the figure is not final. */
  _soFarLbl: string;
  /** The week's run, read as one line under the figure. */
  _deliveriesLbl: string;
  _distanceLbl: string;
  _hoursLbl: string;
  /** When the money moves, and the account it moves to. */
  _payoutLbl: string;
  _accountLbl: string;
}

export const WEEK_EARNING: RunnerWeekEarning = {
  amount: 4820,
  _periodLbl: "This week · Mon 27 Jul – Sun 2 Aug",
  _soFarLbl: "so far",
  _deliveriesLbl: "96 deliveries",
  _distanceLbl: "128.4 km",
  _hoursLbl: "47.5 hrs",
  _payoutLbl: "Fri 8 Aug · 6 PM",
  _accountLbl: "HDFC ****4821",
};

/** Label above the payout row — the slab inside the band. */
export const NEXT_PAYOUT_LBL = "Next payout";
