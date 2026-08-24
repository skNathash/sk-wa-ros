/** A way the runner can lift next week's number. */
export interface RunnerEarnMore {
  key: string;
  label: string;
  _amountLbl: string;
  /** "/ week" / "one-time" — what the reward is paid against. */
  _unitLbl: string;
}

export const EARN_MORE_WAYS: RunnerEarnMore[] = [
  { key: "streak", label: "Streak 20+ days", _amountLbl: "+₹200", _unitLbl: "/ week" },
  { key: "daily", label: "10+ / day", _amountLbl: "+₹100", _unitLbl: "/ day" },
  { key: "rating", label: "Rating 4.8+", _amountLbl: "+₹50", _unitLbl: "/ day" },
  { key: "refer", label: "Refer a runner", _amountLbl: "₹500", _unitLbl: "one-time" },
];

export const EARN_MORE_LBL = "Ways to earn more";
