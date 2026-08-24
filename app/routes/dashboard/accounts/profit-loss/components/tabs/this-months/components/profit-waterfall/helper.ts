import ProfitAndLossService from "~/services/ProfitAndLossService";

/**
 * How a step reads on the ladder:
 * - `total` — a subtotal line (revenue, gross profit, net profit)
 * - `cogs`  — cost of goods, the one big deduction, kept in its own tone
 * - `cost`  — an operating expense
 */
export type WaterfallKind = "total" | "cogs" | "cost";

export type WaterfallStep = {
  key: string;
  label: string;
  amount: number;
  kind: WaterfallKind;
  /** Bar length as a share of revenue, 0–100. */
  percent: number;
};

export type ProfitWaterfallData = {
  /** Caption on the right of the block header. */
  note: string;
  steps: WaterfallStep[];
};

/**
 * A `type=waterfall` step. `amount` is always positive — the direction is in
 * `kind`, and `signedAmount` carries the sign for anything drawing bars below
 * an axis. The operating-expenses subtotal is deliberately absent: its parts
 * are already steps here, and drawing the sum too would subtract twice.
 */
type ApiWaterfallStep = {
  key?: string;
  label?: string;
  kind?: "income" | "cost" | "subtotal" | "total";
  amount?: number;
  signedAmount?: number;
  percentOfRevenue?: number;
};

export const emptyProfitWaterfall = (): ProfitWaterfallData => ({
  note: "",
  steps: [],
});

const toKind = (step: ApiWaterfallStep): WaterfallKind => {
  if (step.kind !== "cost") return "total";
  return step.key === "cogs" ? "cogs" : "cost";
};

/* The ladder is read as arithmetic, so each line wears its operator: costs are
   subtracted, subtotals are the running result. Revenue opens the ladder and
   is nothing's result, so it stays bare. */
const toLabel = (label: string, kind: WaterfallKind, index: number): string => {
  if (!label || index === 0) return label;
  return kind === "total" ? `= ${label}` : `– ${label}`;
};

export const getProfitWaterfall = async (): Promise<ProfitWaterfallData> => {
  const section =
    await ProfitAndLossService.getThisMonthSection<ApiWaterfallStep>(
      "waterfall",
    );

  const steps: WaterfallStep[] = section.data.map((step, index) => {
    const kind = toKind(step);
    const label = step.label ?? "";

    return {
      key: step.key ?? `${label}-${index}`,
      label: toLabel(label, kind, index),
      amount: step.amount ?? 0,
      kind,
      percent: step.percentOfRevenue ?? 0,
    };
  });

  return {
    note: section.period.label ?? "",
    steps,
  };
};
