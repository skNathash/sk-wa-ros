/**
 * The deposit held against the runner's cash handling, and how close they are
 * to getting it back. Hardcoded until the runner API lands.
 */
export interface RunnerTrustBond {
  title: string;
  _amountLbl: string;
  /** "Refunded after 100 clean drops" — what releases the money. */
  _captionLbl: string;
  /** Bar fill, already resolved to a percentage. */
  _progressPct: number;
  /** "838 clean drops" — the count the bar is measuring. */
  _dropsLbl: string;
  _statusLbl: string;
}

export const TRUST_BOND: RunnerTrustBond = {
  title: "Trust bond",
  _amountLbl: "₹500",
  _captionLbl: "Refunded after 100 clean drops",
  _progressPct: 100,
  _dropsLbl: "838 clean drops",
  _statusLbl: "Refunded",
};
