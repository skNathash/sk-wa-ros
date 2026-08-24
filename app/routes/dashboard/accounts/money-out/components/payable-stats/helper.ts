import { format } from "date-fns";
import AccountService from "~/services/AccountService";
import type { AccountsDateRange } from "~/shared/accounts/hooks/useAccountsDateRange";

/** Decides the tile's number colour — owed, already paid, or late. */
export type PayableStatTone = "owed" | "paid" | "overdue";

export type PayableStat = {
  key: string;
  /** Small caps label at the top of the tile. */
  label: string;
  amount: number;
  /** Supporting line under the number. */
  note: string;
  tone: PayableStatTone;
  /** Part of `note` printed in a stronger ink, e.g. the next due day. */
  noteHighlight?: string;
  query?: Record<string, any>;
  raw?: any;
};

export type PayableStatsData = {
  items: PayableStat[];
};

export const emptyPayableStats = (): PayableStatsData => ({ items: [] });

const resolveTone = (key: string): PayableStatTone => {
  if (key === "you_owe" || key.includes("owe")) return "owed";
  if (key === "paid_this_month" || key.includes("paid")) return "paid";
  if (key === "overdue_30" || key.includes("overdue")) return "overdue";
  return "owed";
};

const dayLabel = (value: string) => format(new Date(value), "dd MMM");

export const getPayableStats = async (
  range: AccountsDateRange,
): Promise<PayableStatsData> => {
  const response = await AccountService.getMoneyOutDashboard({
    type: "vendors",
    outputType: "summary",
    ...range,
  });

  const data = Array.isArray(response?.data)
    ? response.data
    : response?.data?.data || [];

  if (!Array.isArray(data) || data.length === 0) {
    return emptyPayableStats();
  }

  const items: PayableStat[] = data.map((item: any) => {
    const tone = resolveTone(item?.key || "");
    const vendorCountText =
      item?.vendorCount !== undefined
        ? `${item.vendorCount} ${item.vendorCount === 1 ? "vendor" : "vendors"}`
        : "";

    let note = "";
    let noteHighlight = "";

    if (tone === "paid") {
      if (item?.vendorCount !== undefined && item?.count !== undefined) {
        note = `${vendorCountText} · ${item.count} ${item.count === 1 ? "invoice" : "invoices"}`;
      } else if (item?.note) {
        note = vendorCountText ? `${vendorCountText} · ${item.note}` : item.note;
      } else {
        note = vendorCountText;
      }
    } else if (tone === "overdue") {
      const highlight = item?.vendorName || item?.note || "";
      note = vendorCountText
        ? `${vendorCountText}${highlight ? " · " : ""}`
        : "";
      noteHighlight = highlight;
    } else {
      // "owed" / default
      if (item?.note) {
        note = vendorCountText ? `${vendorCountText} · ` : "";
        noteHighlight = item.note;
      } else {
        note = vendorCountText;
      }
    }

    /* The paid tile is the only period-bound number here, so it names the
       window it was read for — the header's picker — instead of the API's
       fixed "this month" wording. */
    const label =
      tone === "paid"
        ? `Paid ${dayLabel(item?.period?.startDate || range.startDate)} – ${dayLabel(
            item?.period?.endDate || range.endDate,
          )}`
        : item?.label || "";

    return {
      key: item?.key || item?.label || String(Math.random()),
      label,
      amount: item?.amount || 0,
      note,
      noteHighlight,
      tone,
      query: item?.query,
      raw: item,
    };
  });

  return { items };
};
