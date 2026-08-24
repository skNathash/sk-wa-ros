/** One line of the week's maths — what added it, and what it added. */
export interface RunnerEarningLine {
  key: string;
  label: string;
  /** "+₹3,360" / "−₹30" — signed, because one of these lines takes money. */
  _amountLbl: string;
  /** Colour seam — a deduction reads red, a bonus in its own colour. */
  _amountCls: string;
}

export const EARNING_LINES: RunnerEarningLine[] = [
  {
    key: "base",
    label: "Base fees (96 drops)",
    _amountLbl: "+₹3,360",
    _amountCls: "tw:text-slate-900",
  },
  {
    key: "distance",
    label: "Distance (128.4 km × ₹6)",
    _amountLbl: "+₹770",
    _amountCls: "tw:text-slate-900",
  },
  {
    key: "tips",
    label: "Customer tips",
    _amountLbl: "+₹340",
    _amountCls: "tw:text-amber-600",
  },
  {
    key: "streak",
    label: "Streak bonus (weekly)",
    _amountLbl: "+₹200",
    _amountCls: "tw:text-primary",
  },
  {
    key: "fuel",
    label: "Fuel subsidy",
    _amountLbl: "+₹180",
    _amountCls: "tw:text-blue-600",
  },
  {
    key: "escrow",
    label: "Trust bond escrow",
    _amountLbl: "−₹30",
    _amountCls: "tw:text-red-500",
  },
];

export const BREAKDOWN_LBL = "How this week adds up";
export const NET_LBL = "Net this week";
export const NET_AMOUNT_LBL = "₹4,820";
