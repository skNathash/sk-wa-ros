import CommonService from "~/services/CommonService";
import ProfitAndLossService, {
  type PnlSection,
} from "~/services/ProfitAndLossService";

/**
 * How a year card reads:
 * - `past`     — before the shop moved to StoreKing, printed muted
 * - `partial`  — the switchover year, only part of it on the OS
 * - `current`  — the year being forecast, highlighted as the payoff
 */
export type StoryTone = "past" | "partial" | "current";

export type StoryYear = {
  key: string;
  /** Financial year, e.g. "FY25". */
  label: string;
  /** Chip in the corner, e.g. "SK OS FROM OCT'25". */
  badge: string;
  revenue: string;
  netProfit: string;
  /** Net margin for the year, e.g. "13%". */
  margin: string;
  tone: StoryTone;
};

export type ThreeYearStoryData = {
  /** Header line, e.g. "3-year story · FY25, FY26, FY27 (forecast)". */
  title: string;
  years: StoryYear[];
  /** The sentence under the cards that reads the three years as one arc. */
  story: string;
};

type ApiStoryYear = {
  key: string;
  financialYear: string;
  isForecast: boolean;
  revenue: number;
  netProfit: number;
  marginPercent: number;
  hasActivity: boolean;
  basedOnMonths?: number;
};

type ApiStoryResponse = PnlSection<ApiStoryYear> & {
  expectedYoY?: {
    netProfitGrowthPercent?: number | null;
    changeAmount?: number;
    hasBaseline?: boolean;
    baselineNote?: string;
  };
};

export const emptyThreeYearStory = (): ThreeYearStoryData => ({
  title: "",
  years: [],
  story: "",
});

const toneForYear = (year: ApiStoryYear): StoryTone => {
  if (year.isForecast) return "current";
  if (!year.hasActivity) return "past";
  return "partial";
};

const badgeForYear = (tone: StoryTone, basedOnMonths?: number): string => {
  if (tone === "past") return "PRE-STOREKING";
  if (tone === "partial") return "SK OS FROM OCT'25";
  return basedOnMonths
    ? `FULL YEAR ON SK · FORECAST (${basedOnMonths}M)`
    : "FULL YEAR ON SK · FORECAST";
};

const formatMargin = (value: number): string =>
  `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;

const buildTitle = (years: ApiStoryYear[]): string => {
  const labels = years.map((y) => y.financialYear);
  const suffix = years.some((y) => y.isForecast) ? " (forecast)" : "";
  return `3-year story · ${labels.join(", ")}${suffix}`;
};

const describeYear = (year: ApiStoryYear): string => {
  if (!year.hasActivity) {
    return `${year.financialYear} had no recorded activity on StoreKing.`;
  }

  const basis = year.basedOnMonths
    ? ` (forecast based on ${year.basedOnMonths} month${year.basedOnMonths === 1 ? "" : "s"})`
    : "";
  const verb = year.isForecast ? "is forecast at" : "closed with";

  return `${year.financialYear}${basis} ${verb} ${CommonService.formatCompact(
    year.revenue,
  )} revenue, ${CommonService.formatCompact(
    year.netProfit,
  )} net profit and ${formatMargin(year.marginPercent)} margin.`;
};

const buildStory = (
  years: ApiStoryYear[],
  expectedYoY?: ApiStoryResponse["expectedYoY"],
): string => {
  const sentences = years.map(describeYear);

  if (expectedYoY?.baselineNote) {
    sentences.push(expectedYoY.baselineNote);
  } else if (
    typeof expectedYoY?.netProfitGrowthPercent === "number" &&
    expectedYoY.hasBaseline
  ) {
    sentences.push(
      `Net profit is expected to move ${expectedYoY.netProfitGrowthPercent.toFixed(
        1,
      )}% year-on-year.`,
    );
  }

  return sentences.join(" ");
};

const toThreeYearStoryData = (raw: ApiStoryResponse): ThreeYearStoryData => {
  const years = raw.data || [];

  return {
    title: buildTitle(years),
    years: years.map((year) => {
      const tone = toneForYear(year);
      return {
        key: year.key,
        label: year.financialYear,
        badge: badgeForYear(tone, year.basedOnMonths),
        revenue: CommonService.formatCompact(year.revenue),
        netProfit: CommonService.formatCompact(year.netProfit),
        margin: formatMargin(year.marginPercent),
        tone,
      };
    }),
    story: buildStory(years, raw.expectedYoY),
  };
};

export const getThreeYearStory = async (): Promise<ThreeYearStoryData> => {
  const section =
    await ProfitAndLossService.getFyViewSection<ApiStoryYear>("story");

  if (section.data.length === 0) {
    return emptyThreeYearStory();
  }

  return toThreeYearStoryData(section as ApiStoryResponse);
};
