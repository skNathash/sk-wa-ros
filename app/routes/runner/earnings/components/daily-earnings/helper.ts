/** One day of the week on the earnings chart. */
export interface RunnerDailyEarning {
  key: string;
  /** "MON" — the axis label under the bar. */
  dayLbl: string;
  amount: number;
  /** "₹720" — the figure that rides above the bar. */
  _amountLbl: string;
  /** Bar height as a share of the week's best day, already resolved to a
      percentage so the chart carries no maths of its own. */
  _heightPct: number;
  /** The day the runner is on — the only filled bar in the row. */
  isToday: boolean;
}

export const DAILY_EARNINGS: RunnerDailyEarning[] = [
  {
    key: "mon",
    dayLbl: "Mon",
    amount: 720,
    _amountLbl: "₹720",
    _heightPct: 73,
    isToday: false,
  },
  {
    key: "tue",
    dayLbl: "Tue",
    amount: 610,
    _amountLbl: "₹610",
    _heightPct: 62,
    isToday: false,
  },
  {
    key: "wed",
    dayLbl: "Wed",
    amount: 810,
    _amountLbl: "₹810",
    _heightPct: 83,
    isToday: false,
  },
  {
    key: "thu",
    dayLbl: "Thu",
    amount: 680,
    _amountLbl: "₹680",
    _heightPct: 69,
    isToday: false,
  },
  {
    key: "fri",
    dayLbl: "Fri",
    amount: 980,
    _amountLbl: "₹980",
    _heightPct: 100,
    isToday: true,
  },
  {
    key: "sat",
    dayLbl: "Sat",
    amount: 810,
    _amountLbl: "₹810",
    _heightPct: 83,
    isToday: false,
  },
  {
    key: "sun",
    dayLbl: "Sun",
    amount: 210,
    _amountLbl: "₹210",
    _heightPct: 21,
    isToday: false,
  },
];

export const DAILY_EARNINGS_LBL = "Daily earnings";
