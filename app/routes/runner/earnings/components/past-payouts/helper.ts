/** A week that has already been paid out. */
export interface RunnerPayout {
  id: number;
  /** "20 – 26 Jul" — the week the money covers. */
  _rangeLbl: string;
  /** "92 deliveries · Fri 26 Jul · 6:12 PM" — the run and when it settled. */
  _metaLbl: string;
  /** "UTR HDFC-778211" — the runner's handle on the transfer at the bank. */
  _utrLbl: string;
  _amountLbl: string;
  _statusLbl: string;
}

export const PAST_PAYOUTS: RunnerPayout[] = [
  {
    id: 1,
    _rangeLbl: "20 – 26 Jul",
    _metaLbl: "92 deliveries · Fri 26 Jul · 6:12 PM",
    _utrLbl: "UTR HDFC-778211",
    _amountLbl: "₹4,580",
    _statusLbl: "Paid",
  },
  {
    id: 2,
    _rangeLbl: "13 – 19 Jul",
    _metaLbl: "84 deliveries · Fri 19 Jul · 6:04 PM",
    _utrLbl: "UTR HDFC-771540",
    _amountLbl: "₹4,210",
    _statusLbl: "Paid",
  },
  {
    id: 3,
    _rangeLbl: "6 – 12 Jul",
    _metaLbl: "79 deliveries · Fri 12 Jul · 6:22 PM",
    _utrLbl: "UTR HDFC-765880",
    _amountLbl: "₹3,980",
    _statusLbl: "Paid",
  },
  {
    id: 4,
    _rangeLbl: "29 Jun – 5 Jul",
    _metaLbl: "87 deliveries · Fri 5 Jul · 6:08 PM",
    _utrLbl: "UTR HDFC-760104",
    _amountLbl: "₹4,340",
    _statusLbl: "Paid",
  },
];

export const PAST_PAYOUTS_LBL = "Past payouts";
export const PAST_PAYOUTS_RANGE_LBL = "Last 4 weeks";
