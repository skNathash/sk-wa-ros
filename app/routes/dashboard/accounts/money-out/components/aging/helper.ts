import { format, isToday } from "date-fns";
import AccountService from "~/services/AccountService";

/** The four windows a payable can sit in, oldest bill last. */
export type AgingBucketKey = "not_due" | "0_15" | "16_30" | "above_30";

export type AgingBucket = {
  key: string;
  /** Bucket name as the API prints it — "Not due yet", "0-15 days"… */
  label: string;
  amount: number;
  /** Bills in the bucket. */
  count: number;
  vendorCount: number;
  /** Line under the number: "2 vendors". */
  meta: string;
  /** Share of the total payable, used for the segment's width. */
  share: number;
  /** Colour the bucket carries in both the bar and its card. */
  accent: string;
  /** Filter for the drill-down list, kept as the API handed it. */
  query?: Record<string, any>;
};

export type AgingData = {
  totalPayable: number;
  /** "as of today" / "as of 13 Aug" — when the balances were read. */
  asOfLabel: string;
  buckets: AgingBucket[];
};

export const emptyAging = (): AgingData => ({
  totalPayable: 0,
  asOfLabel: "",
  buckets: [],
});

/**
 * Green while the bill is still within terms, blue and amber as it ages, red
 * once it is well past due — the same ladder the bar and the cards read from.
 */
const accents: Record<string, string> = {
  not_due: "#0f8a5f",
  "0_15": "#3b82f6",
  "16_30": "#f0a500",
  above_30: "#ef4444",
};

const fallbackAccent = "#94a3b8";

const vendorLine = (count: number) =>
  `${count} ${count === 1 ? "vendor" : "vendors"}`;

const asOfLabel = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return isToday(date) ? "as of today" : `as of ${format(date, "dd MMM")}`;
};

export const getAging = async (): Promise<AgingData> => {
  /* The totals ride alongside `data` on the envelope itself, which the shared
     response type does not carry. */
  const response: any = await AccountService.getMoneyOutDashboard({
    type: "aging",
    outputType: "summary",
  });

  const rows = Array.isArray(response?.data)
    ? response.data
    : response?.data?.data || [];

  if (!Array.isArray(rows) || rows.length === 0) return emptyAging();

  const totalPayable = response?.totalPayable || 0;

  /* The API's own percentage rounds a small bucket down to 0, which would drop
     its segment out of the bar entirely — so the widths are taken from the
     amounts here and every non-empty bucket keeps a visible sliver. */
  const sum = rows.reduce(
    (acc: number, item: any) => acc + (item?.amount || 0),
    0,
  );

  const buckets: AgingBucket[] = rows.map((item: any) => {
    const amount = item?.amount || 0;
    const vendorCount = item?.vendorCount || 0;
    const share = sum > 0 ? (amount / sum) * 100 : 0;

    return {
      key: item?.key || item?.label || "",
      label: item?.label || "",
      amount,
      count: item?.count || 0,
      vendorCount,
      meta: vendorLine(vendorCount),
      share: amount > 0 ? Math.max(share, 2) : 0,
      accent: accents[item?.key] || fallbackAccent,
      query: item?.query,
    };
  });

  return {
    totalPayable,
    asOfLabel: asOfLabel(response?.asOf),
    buckets,
  };
};
