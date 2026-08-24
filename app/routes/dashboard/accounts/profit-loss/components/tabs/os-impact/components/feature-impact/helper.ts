// Static stand-in until the feature-attribution endpoint lands.

/** Which kind of gain a feature produced — decides its tile tone and icon. */
export type ImpactKind = "time" | "revenue" | "leak" | "wastage" | "growth";

export type FeatureImpactRow = {
  key: string;
  kind: ImpactKind;
  /** Badge text, e.g. "TIME SAVED". */
  kindLabel: string;
  label: string;
  /** The sentence that shows the working behind the figure. */
  description: string;
  /** This month's gain, already formatted — not every one of these is money. */
  value: string;
  /** Unit under the figure, e.g. "₹/mo", "hrs/mo", "cust/mo". */
  unit: string;
  /** The same gain added up since the shop moved onto the OS. */
  cumulativeValue: string;
  cumulativeUnit: string;
};

export type FeatureImpactData = {
  /** Small print on the right of the header. */
  note: string;
  /** Column caption for this month's figure, e.g. "JUL IMPACT". */
  periodLabel: string;
  /** Column caption for the running total, e.g. "CUMULATIVE SINCE OCT '25". */
  cumulativeLabel: string;
  rows: FeatureImpactRow[];
};

export const emptyFeatureImpact = (): FeatureImpactData => ({
  note: "",
  periodLabel: "",
  cumulativeLabel: "",
  rows: [],
});

export const getFeatureImpact = async (): Promise<FeatureImpactData> =>
  Promise.resolve({
    note: "click any to see the audit trail",
    periodLabel: "JUL IMPACT",
    cumulativeLabel: "CUMULATIVE SINCE OCT '25",
    rows: [
      {
        key: "billing",
        kind: "time",
        kindLabel: "TIME SAVED",
        label: "Faster billing",
        description:
          "5.2 sec avg bill time (was 42 sec) · 82% cashier time saved · equivalent to ₹18,400 labor recovered/month",
        value: "+₹18,400",
        unit: "₹/mo",
        cumulativeValue: "+₹184,000",
        cumulativeUnit: "₹ over 10 mo",
      },
      {
        key: "paylater",
        kind: "revenue",
        kindLabel: "EXTRA REVENUE",
        label: "Paylater collections",
        description:
          "₹25,040 collected via Paylater in Jul that would have walked away as lost sale · +4.3% revenue uplift",
        value: "+₹25,040",
        unit: "₹/mo",
        cumulativeValue: "+₹250,400",
        cumulativeUnit: "₹ over 10 mo",
      },
      {
        key: "vendorRecon",
        kind: "leak",
        kindLabel: "LEAK STOPPED",
        label: "Auto vendor recon",
        description:
          "GRN mismatches caught before payment · ₹6,800 short-shipments recovered as debit notes in Jul",
        value: "+₹6,800",
        unit: "₹/mo",
        cumulativeValue: "+₹68,000",
        cumulativeUnit: "₹ over 10 mo",
      },
      {
        key: "expiry",
        kind: "wastage",
        kindLabel: "WASTAGE SAVED",
        label: "Expiry & wastage",
        description:
          "Stock master flagged 12 near-expiry SKUs · discounted before write-off · saved ₹4,120 from waste",
        value: "+₹4,120",
        unit: "₹/mo",
        cumulativeValue: "+₹41,200",
        cumulativeUnit: "₹ over 10 mo",
      },
      {
        key: "gst",
        kind: "time",
        kindLabel: "TIME SAVED",
        label: "GST filing time",
        description:
          "GSTR-1 & 3B pre-populated · ITC auto-matched with 2B · you file in 22 min instead of 14 hrs with a CA",
        value: "+14",
        unit: "hrs/mo",
        cumulativeValue: "+140",
        cumulativeUnit: "hrs over 10 mo",
      },
      {
        key: "acquisition",
        kind: "growth",
        kindLabel: "GROWTH",
        label: "New customer acquisition",
        description:
          "42 new B2C customers found the store via Circle/WhatsApp catalog in Jul · ₹36,200 in first-time-buyer revenue",
        value: "+42",
        unit: "cust/mo",
        cumulativeValue: "+420",
        cumulativeUnit: "cust over 10 mo",
      },
    ],
  });
