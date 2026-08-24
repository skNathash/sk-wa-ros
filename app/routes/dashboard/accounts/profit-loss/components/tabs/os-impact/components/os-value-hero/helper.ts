// Static stand-in until the platform-attribution summary endpoint lands.

export type OsValueHeroData = {
  /** Caption above the amount, e.g. "VALUE STOREKING OS ADDED IN JUL 2026". */
  caption: string;
  /** Already-signed headline, e.g. "+₹54,360". */
  value: string;
  /** The line under it, e.g. "≈ 57% of your net profit · …". */
  note: string;
  /** Small caps label on the chip, e.g. "SINCE OCT '25". */
  cumulativeLabel: string;
  /** Already-signed running total, e.g. "+₹4.82L". */
  cumulativeValue: string;
};

export const emptyOsValueHero = (): OsValueHeroData => ({
  caption: "",
  value: "",
  note: "",
  cumulativeLabel: "",
  cumulativeValue: "",
});

export const getOsValueHero = async (): Promise<OsValueHeroData> =>
  Promise.resolve({
    caption: "VALUE STOREKING OS ADDED IN JUL 2026",
    value: "+₹54,360",
    note: "≈ 57% of your net profit · features that would cost you or lose you money if absent",
    cumulativeLabel: "SINCE OCT '25",
    cumulativeValue: "+₹4.82L",
  });
