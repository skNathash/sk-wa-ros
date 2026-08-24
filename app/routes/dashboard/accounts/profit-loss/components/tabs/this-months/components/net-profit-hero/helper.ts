import CommonService from "~/services/CommonService";
import ProfitAndLossService from "~/services/ProfitAndLossService";
import { signedAmount, signedPercent } from "~/shared/accounts/pnl-format";

/** One comparison chip on the right of the hero. */
export type HeroChip = {
  key: string;
  /** Small caps label, e.g. "VS JUN". */
  label: string;
  /** The headline of the chip — a percentage or a rupee figure. */
  value: string;
  /** The line under it, e.g. "+₹10,500". */
  note: string;
};

export type NetProfitHeroData = {
  /** Caption above the amount, e.g. "NET PROFIT · JUL 2026". */
  caption: string;
  net: number;
  /** Net margin for the month, as a percentage. */
  margin: number;
  /** Days left before the month's books are locked. */
  daysToClose: number;
  chips: HeroChip[];
};

type ApiSummaryItem = {
  key: string;
  label: string;
  amount: number;
  revenue?: number;
  grossProfit?: number;
  marginPercent?: number;
  booksCloseInDays?: number;
  isClosed?: boolean;
  changeAmount?: number;
  changePercent?: number;
  startDate?: string;
  endDate?: string;
};

export const emptyNetProfitHero = (): NetProfitHeroData => ({
  caption: "",
  net: 0,
  margin: 0,
  daysToClose: 0,
  chips: [],
});

const toChips = (items: ApiSummaryItem[]): HeroChip[] =>
  items
    .filter((item) => item.key !== "net_profit")
    .map((item) => {
      const hasChange = typeof item.changePercent === "number";

      return {
        key: item.key,
        label: item.label,
        value: hasChange
          ? signedPercent(item.changePercent as number)
          : CommonService.formatCompact(item.amount),
        note: hasChange
          ? signedAmount(item.changeAmount ?? 0)
          : typeof item.revenue === "number"
            ? `${CommonService.formatCompact(item.revenue)} revenue`
            : "",
      };
    });

export const getNetProfitHero = async (): Promise<NetProfitHeroData> => {
  const section =
    await ProfitAndLossService.getThisMonthSection<ApiSummaryItem>("summary");
  const list = section.data;

  if (list.length === 0) {
    return emptyNetProfitHero();
  }

  const main = list.find((item) => item.key === "net_profit") ?? list[0];

  return {
    caption: main.label ?? "",
    net: main.amount ?? 0,
    margin: main.marginPercent ?? 0,
    daysToClose: main.booksCloseInDays ?? 0,
    chips: toChips(list),
  };
};
