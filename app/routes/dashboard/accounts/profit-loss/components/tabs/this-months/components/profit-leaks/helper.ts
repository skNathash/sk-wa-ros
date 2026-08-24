import ProfitAndLossService from "~/services/ProfitAndLossService";

export type ProfitLeak = {
  key: string;
  label: string;
  /** The line under the label, saying where the number came from. */
  detail: string;
  /** What the leak cost the month, as a positive number. */
  amount: number;
};

export type ProfitLeaksData = {
  note: string;
  items: ProfitLeak[];
  /** Sum of the listed leaks — printed on the footer row. */
  total: number;
};

/**
 * A `type=leaks` row: a cost line that grew against the previous month,
 * biggest increase first. An empty list is the good outcome — nothing grew.
 */
type ApiLeak = {
  key?: string;
  label?: string;
  amount?: number;
  increase?: number;
  increasePercent?: number | null;
  percentOfRevenue?: number;
  isNew?: boolean;
  note?: string;
};

export const emptyProfitLeaks = (): ProfitLeaksData => ({
  note: "",
  items: [],
  total: 0,
});

export const getProfitLeaks = async (): Promise<ProfitLeaksData> => {
  const section =
    await ProfitAndLossService.getThisMonthSection<ApiLeak>("leaks");

  const comparedTo = section.comparedTo;
  const comparedLabel =
    typeof comparedTo === "string"
      ? comparedTo
      : ((comparedTo as { label?: string })?.label ?? "");

  return {
    note: comparedLabel ? `margin erosion vs ${comparedLabel}` : "",
    total: (section.totalIncrease as number) ?? 0,
    items: section.data.map((leak, index) => ({
      key: leak.key ?? `leak-${index}`,
      label: leak.label ?? "",
      detail: leak.note ?? "",
      /* The row reports the growth, not the whole cost — the cost itself is
         already a line on the P&L above. */
      amount: leak.increase ?? 0,
    })),
  };
};
