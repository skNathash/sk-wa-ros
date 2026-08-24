import ProfitAndLossService from "~/services/ProfitAndLossService";
import {
  deltaClass,
  signedPercent,
  type FlowDirection,
} from "~/shared/accounts/pnl-format";

export type LineByLineRow = {
  key: string;
  label: string;
  /** Reported month. */
  current: number;
  /** Month before it. */
  previous: number;
  /** Same month a year ago. */
  lastYear: number;
  /** Month-on-month movement, ready to print. */
  momText: string;
  momClass: string;
  /** Year-on-year movement, ready to print. */
  yoyText: string;
  yoyClass: string;
  /** Subtotal line — printed on a tinted row. */
  total?: boolean;
};

export type LineByLineData = {
  /** Header, spelling out the three periods being compared. */
  title: string;
  note: string;
  columns: {
    current: string;
    previous: string;
    lastYear: string;
  };
  rows: LineByLineRow[];
};

/**
 * A `type=line_items` row. `momPercent` / `yoyPercent` are null rather than 0
 * when the comparison period recorded nothing — there is no baseline to grow
 * from, and printing 0% would be a lie.
 */
type ApiLineItem = {
  key?: string;
  label?: string;
  kind?: "income" | "cost" | "subtotal" | "total";
  current?: number;
  previous?: number;
  lastYear?: number;
  momPercent?: number | null;
  yoyPercent?: number | null;
  percentOfRevenue?: number;
};

type ApiColumns = { current?: string; previous?: string; lastYear?: string };

export const emptyLineByLine = (): LineByLineData => ({
  title: "",
  note: "",
  columns: { current: "", previous: "", lastYear: "" },
  rows: [],
});

const toDirection = (kind?: ApiLineItem["kind"]): FlowDirection =>
  kind === "cost" ? "out" : "in";

/* Same arithmetic reading as the waterfall: costs are subtracted, subtotals are
   the running result, and revenue at the top is neither. */
const toLabel = (label: string, kind: ApiLineItem["kind"], index: number) => {
  if (!label || index === 0) return label;
  return kind === "cost" ? `– ${label}` : `= ${label}`;
};

/**
 * A movement with no baseline prints as a dash, in the neutral tone. Past 100%
 * the decimal place stops earning its width, so it is dropped — the movement
 * columns are the narrowest on the table.
 */
const movement = (
  value: number | null | undefined,
  direction: FlowDirection,
) =>
  typeof value === "number"
    ? {
        text: signedPercent(value, Math.abs(value) >= 100 ? 0 : 1),
        className: deltaClass(value, direction),
      }
    : { text: "—", className: "tw:text-gray-300" };

export const getLineByLine = async (): Promise<LineByLineData> => {
  const section =
    await ProfitAndLossService.getThisMonthSection<ApiLineItem>("line_items");

  const apiColumns = (section.columns as ApiColumns) ?? {};
  const columns = {
    current: apiColumns.current ?? "",
    previous: apiColumns.previous ?? "",
    lastYear: apiColumns.lastYear ?? "",
  };

  const rows: LineByLineRow[] = section.data.map((item, index) => {
    const direction = toDirection(item.kind);
    const label = item.label ?? "";
    const mom = movement(item.momPercent, direction);
    const yoy = movement(item.yoyPercent, direction);

    return {
      key: item.key ?? `${label}-${index}`,
      label: toLabel(label, item.kind, index),
      current: item.current ?? 0,
      previous: item.previous ?? 0,
      lastYear: item.lastYear ?? 0,
      momText: mom.text,
      momClass: mom.className,
      yoyText: yoy.text,
      yoyClass: yoy.className,
      total: item.kind === "subtotal" || item.kind === "total",
    };
  });

  const compared = [columns.current, columns.previous, columns.lastYear].filter(
    Boolean,
  );

  return {
    title: compared.length ? `Line-by-line · ${compared.join(" vs ")}` : "",
    note: section.period.label ?? "",
    columns,
    rows,
  };
};
