// Static stand-in until the subscription-ROI endpoint lands.

export type SubscriptionRoiData = {
  /** Small print on the right of the header, e.g. "what you pay vs what you earn". */
  note: string;
  /** What the subscription costs, e.g. "₹1,499". */
  costValue: string;
  costLabel: string;
  costNote: string;
  /** What it gave back, e.g. "+₹54,360". */
  earnValue: string;
  earnLabel: string;
  earnNote: string;
  /** The two divided, e.g. "36×". */
  roiValue: string;
  roiLabel: string;
  roiNote: string;
};

export const emptySubscriptionRoi = (): SubscriptionRoiData => ({
  note: "",
  costValue: "",
  costLabel: "",
  costNote: "",
  earnValue: "",
  earnLabel: "",
  earnNote: "",
  roiValue: "",
  roiLabel: "",
  roiNote: "",
});

export const getSubscriptionRoi = async (): Promise<SubscriptionRoiData> =>
  Promise.resolve({
    note: "what you pay vs what you earn",
    costValue: "₹1,499",
    costLabel: "YOU PAY",
    costNote: "per month · SK OS Pro",
    earnValue: "+₹54,360",
    earnLabel: "YOU EARN",
    earnNote: "quantified per month",
    roiValue: "36×",
    roiLabel: "ROI",
    roiNote: "for every ₹1 spent on SK",
  });
