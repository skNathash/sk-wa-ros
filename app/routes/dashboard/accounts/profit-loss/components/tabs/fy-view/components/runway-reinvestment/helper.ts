// Static stand-in until the cash-position endpoint lands.

/**
 * How a tile reads, by the accent that runs down its left edge:
 * - `cash`      — money in hand today
 * - `cover`     — how long that money lasts if nothing comes in
 * - `investable` — what is left over once the buffer is set aside
 */
export type RunwayTone = "cash" | "cover" | "investable";

export type RunwayItem = {
  key: string;
  /** Small caps label, e.g. "CASH ON HAND". */
  label: string;
  /** Already-shortened headline — the cover column is in months, not rupees. */
  value: string;
  /** The line under it, e.g. "Wallet + bank + cash". */
  note: string;
  tone: RunwayTone;
};

export type RunwayData = {
  /** Small print on the right of the header, e.g. "what to do with the surplus". */
  note: string;
  items: RunwayItem[];
};

export const emptyRunway = (): RunwayData => ({ note: "", items: [] });

export const getRunway = async (): Promise<RunwayData> =>
  Promise.resolve({
    note: "what to do with the surplus",
    items: [
      {
        key: "cashOnHand",
        label: "CASH ON HAND",
        value: "₹6.82L",
        note: "Wallet + bank + cash",
        tone: "cash",
      },
      {
        key: "workingCapitalCover",
        label: "WORKING CAPITAL COVER",
        value: "7.2 months",
        note: "Even if revenue drops 100%",
        tone: "cover",
      },
      {
        key: "excessCash",
        label: "EXCESS CASH · INVESTABLE",
        value: "₹4.10L",
        note: "After 3-month buffer · consider fixed deposit or expansion",
        tone: "investable",
      },
    ],
  });
