import PaylaterService from "~/services/PaylaterService";

export interface AgingBucket {
  range: string;
  /** Human label for the bucket, e.g. "0–15 days". */
  label: string;
  customerCount: number;
  amount: number;
  /** Fill colour of the bar — cool for fresh debt, warm as it ages. */
  barClassName: string;
  /** Matching text colour for the rupee figure. */
  textClassName: string;
}

export interface CashFlowWeek {
  week: string;
  weekStart: string;
  issued: number;
  recovered: number;
}

/** Label + colour per aging range, keyed by what the API sends back. */
const BUCKET_META: Record<
  string,
  { label: string; barClassName: string; textClassName: string }
> = {
  "0-15": {
    label: "0–15 days",
    barClassName: "tw:bg-emerald-500",
    textClassName: "tw:text-emerald-600",
  },
  "16-30": {
    label: "16–30 days",
    barClassName: "tw:bg-amber-400",
    textClassName: "tw:text-amber-500",
  },
  "31-60": {
    label: "31–60 days",
    barClassName: "tw:bg-orange-500",
    textClassName: "tw:text-orange-500",
  },
  "60+": {
    label: "60+ days",
    barClassName: "tw:bg-rose-500",
    textClassName: "tw:text-rose-500",
  },
};

const FALLBACK_META = {
  label: "",
  barClassName: "tw:bg-slate-400",
  textClassName: "tw:text-slate-600",
};

/**
 * Aging buckets — how the outstanding book splits across days-past-due bands,
 * with the total the bands add up to.
 */
export const getAgingBuckets = async (): Promise<{
  totalOutstanding: number;
  buckets: AgingBucket[];
}> => {
  const response: any = await PaylaterService.getInsightsDashboard({
    type: "aging",
  });

  const aging = response?.data?.data?.aging ?? {};
  const raw = Array.isArray(aging?.buckets) ? aging.buckets : [];

  const buckets: AgingBucket[] = raw.map((item: Record<string, any>) => {
    const meta = BUCKET_META[item?.range] ?? {
      ...FALLBACK_META,
      label: item?.range || "-",
    };

    return {
      range: item?.range,
      label: meta.label,
      customerCount: Number(item?.customerCount || 0),
      amount: Number(item?.amount || 0),
      barClassName: meta.barClassName,
      textClassName: meta.textClassName,
    };
  });

  return {
    totalOutstanding: Number(aging?.totalOutstanding || 0),
    buckets,
  };
};

/** Weekly issued vs recovered for the trailing `weeks` weeks. */
export const getCashFlow = async (weeks = 12): Promise<CashFlowWeek[]> => {
  const response: any = await PaylaterService.getInsightsDashboard({
    type: "cashflow",
    weeks,
  });

  const raw = response?.data?.data?.cashflow?.weeks;
  if (!Array.isArray(raw)) return [];

  return raw.map((item: Record<string, any>) => ({
    week: item?.week || "-",
    weekStart: item?.weekStart || "",
    issued: Number(item?.issued || 0),
    recovered: Number(item?.recovered || 0),
  }));
};

/**
 * The most recent week where recovery overtook fresh credit — the "flip" the
 * cash flow card calls out below the bars. Null when it never happens.
 */
export const getFlipWeek = (weeks: CashFlowWeek[]) => {
  for (let i = weeks.length - 1; i >= 0; i -= 1) {
    const w = weeks[i];
    if (w.recovered > w.issued) return w;
  }
  return null;
};
