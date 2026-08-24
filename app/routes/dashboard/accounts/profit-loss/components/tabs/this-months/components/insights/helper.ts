import ProfitAndLossService from "~/services/ProfitAndLossService";

/**
 * How an insight should be read — good news, a caution, a neutral benchmark,
 * or something the platform itself made happen.
 */
export type InsightTone = "good" | "warning" | "neutral" | "platform";

export type Insight = {
  key: string;
  tone: InsightTone;
  title: string;
  detail: string;
};

export type InsightsData = {
  /** Header, naming the month the findings belong to. */
  title: string;
  note: string;
  items: Insight[];
};

/**
 * A `type=insights` finding. Each one is read off the numbers the other
 * sections already produced and is only emitted when its condition holds, so
 * the list is often shorter than the design's four cards.
 */
type ApiInsight = {
  key?: string;
  tone?: "positive" | "neutral" | "warning";
  title?: string;
  label?: string;
  headline?: string;
  detail?: string;
  message?: string;
  description?: string;
};

export const emptyInsights = (): InsightsData => ({
  title: "",
  note: "",
  items: [],
});

const TONE_MAP: Record<string, InsightTone> = {
  positive: "good",
  warning: "warning",
  neutral: "neutral",
};

export const getInsights = async (): Promise<InsightsData> => {
  const section =
    await ProfitAndLossService.getThisMonthSection<ApiInsight>("insights");

  const period = section.period.label ?? "";
  const count = section.data.length;

  return {
    title: period ? `Insights for ${period}` : "Insights",
    note: `auto-generated · ${count} finding${count === 1 ? "" : "s"}`,
    items: section.data.map((insight, index) => ({
      key: insight.key ?? `insight-${index}`,
      tone: TONE_MAP[insight.tone ?? ""] ?? "neutral",
      title: insight.title ?? insight.headline ?? insight.label ?? "",
      detail: insight.detail ?? insight.message ?? insight.description ?? "",
    })),
  };
};
