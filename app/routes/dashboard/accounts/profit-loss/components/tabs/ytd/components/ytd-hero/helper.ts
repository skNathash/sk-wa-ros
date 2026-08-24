import ProfitAndLossService from "~/services/ProfitAndLossService";
import {
  signedAmount,
  signedPercent,
  toFinite,
} from "~/shared/accounts/pnl-format";

export type YtdHeroData = {
  /** Caption above the amount, e.g. "YTD NET PROFIT · FY 2026-27 · APR → JUL". */
  caption: string;
  net: number;
  /** The line under the amount, e.g. "+72.1% vs same period FY26 · …". */
  note: string;
  /** Small caps label on the chip, e.g. "PACE VS FY26 FULL YEAR". */
  paceLabel: string;
  /** Already-formatted pace figure, e.g. "124%". */
  paceValue: string;
};

type ApiPace = {
  percent: number | null;
  projectedNetProfit: number;
  lastFullYearNetProfit: number;
  hasBaseline: boolean;
  baselineNote: string | null;
};

type ApiLastYear = {
  netProfit: number;
  hasActivity: boolean;
};

type ApiSummaryResponse = {
  netProfit: number;
  netMarginPercent: number;
  revenue: number;
  changeAmount: number;
  growthPercent: number | null;
  hasBaseline: boolean;
  baselineNote: string | null;
  lastYear: ApiLastYear;
  pace: ApiPace;
};

export const emptyYtdHero = (): YtdHeroData => ({
  caption: "",
  net: 0,
  note: "",
  paceLabel: "",
  paceValue: "",
});

const formatNote = (data: ApiSummaryResponse): string => {
  const growthPercent = Number.isFinite(data.growthPercent)
    ? (data.growthPercent as number)
    : null;
  const changeAmount = toFinite(data.changeAmount);

  if (growthPercent !== null) {
    return `${signedPercent(growthPercent)} vs same period last year · ${signedAmount(changeAmount)}`;
  }

  return `${signedAmount(changeAmount)} vs last year ₹0`;
};

const formatPace = (pace: ApiPace): { label: string; value: string } => {
  if (pace.baselineNote) {
    return { label: "PACE", value: "—" };
  }

  const percent = Number.isFinite(pace.percent)
    ? (pace.percent as number)
    : null;
  if (percent !== null) {
    return {
      label: "PACE VS LAST FULL YEAR",
      value: signedPercent(percent),
    };
  }

  return { label: "PACE", value: "—" };
};

export const getYtdHero = async (): Promise<YtdHeroData> => {
  const data = await ProfitAndLossService.getFySummary<ApiSummaryResponse>();

  if (!data || !Number.isFinite(data.netProfit)) {
    return emptyYtdHero();
  }

  const pace = formatPace(data.pace);

  return {
    caption: "YTD NET PROFIT",
    net: toFinite(data.netProfit),
    note: formatNote(data),
    paceLabel: pace.label,
    paceValue: pace.value,
  };
};
