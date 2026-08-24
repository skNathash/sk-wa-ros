import ProfitAndLossService from "~/services/ProfitAndLossService";

export type QuarterRow = {
  key: string;
  /** Quarter and the months it covers, e.g. "Q2 FY27 · Jul-Sep'26". */
  label: string;
  revenue: number;
  net: number;
  /** Net margin for the quarter, as a percentage. */
  margin: number;
  /** Bar length as a share of the largest quarter on the list, 0–100. */
  percent: number;
  /** The quarter in progress — drawn solid and labelled with its progress. */
  current?: boolean;
  /** How far into the quarter the shop is, e.g. "month 1/3". */
  progressLabel?: string;
};

export type QuarterOverQuarterData = {
  note: string;
  rows: QuarterRow[];
};

export const emptyQuarterOverQuarter = (): QuarterOverQuarterData => ({
  note: "",
  rows: [],
});

const QUARTER_COUNT = 4;

type QuarterApiRow = {
  key: string;
  label: string;
  dateSpan: string;
  revenue: number;
  netProfit: number;
  marginPercent: number;
  barPercent: number;
  isCurrent: boolean;
  progress: string | null;
};

const formatDateSpan = (dateSpan: string) => {
  const [first, secondWithYear] = dateSpan.split("-");
  if (!secondWithYear) return dateSpan;

  const yearMatch = secondWithYear.match(/'(\d+)/);
  const year = yearMatch ? `'${yearMatch[1]}` : "";

  const toShort = (month: string) =>
    month.slice(0, 1).toUpperCase() + month.slice(1, 3).toLowerCase();

  const secondMonth = secondWithYear.replace(/'\d+/, "");

  return `${toShort(first)}-${toShort(secondMonth)}${year}`;
};

export const getQuarterOverQuarter =
  async (): Promise<QuarterOverQuarterData> => {
    const section = await ProfitAndLossService.getQuarterSection<QuarterApiRow>(
      "quarters",
      { quarterCount: QUARTER_COUNT },
    );

    const note = `trailing ${QUARTER_COUNT} quarters`;

    const rows: QuarterRow[] = section.data.map((row) => ({
      key: row.key,
      label: `${row.label} · ${formatDateSpan(row.dateSpan)}`,
      revenue: row.revenue,
      net: row.netProfit,
      margin: row.marginPercent,
      percent: row.barPercent,
      current: row.isCurrent,
      progressLabel: row.progress ?? undefined,
    }));

    return { note, rows };
  };
