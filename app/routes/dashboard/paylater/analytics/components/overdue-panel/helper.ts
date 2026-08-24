import { isValid, parseISO } from "date-fns";
import { getNetworkViewLink } from "../../helper";
import PaylaterService from "~/services/PaylaterService";

/** One already-late account in the overdue recovery strip. */
export interface OverdueAccount {
  userId: string;
  userName: string;
  userType: string;
  /** Owed right now. */
  outstanding: number;
  /** Sanctioned credit limit. */
  creditLimit: number;
  /** Days past the due date. */
  overdueDays: number;
  /** Share of the limit used, 0–100, as the feed reports it. */
  utilization: number;
  /** Deep link to the customer's network profile. */
  profileUrl: string;
  /** Contact number for the WhatsApp nudge. */
  mobile: string;
  /** Due date as the feed carries it, for the reminder template. */
  dueDate: string;
  /** When this account last moved — empty when the feed omits it. */
  lastActivityAt: string;
}

/** What the overdue strip needs in one shot: the rows plus the book totals. */
export interface OverdueFeed {
  accounts: OverdueAccount[];
  /** How many accounts are overdue in total, not just on this page. */
  count: number;
  /** Money still to recover across every overdue account. */
  amount: number;
}

/** Overdue document -> the row shape the strip renders. */
const formatAccount = (raw: Record<string, any>): OverdueAccount => ({
  userId: raw?.customerId || raw?._id || "",
  userName: raw?.name || "-",
  userType: raw?.userType || "",
  profileUrl: getNetworkViewLink(
    raw?.userType || "",
    raw?.customerId || raw?._id || "",
  ),
  outstanding: Number(raw?.balance ?? raw?.used ?? 0),
  creditLimit: Number(raw?.limit || 0),
  overdueDays: Number(raw?.daysPastDue || 0),
  utilization: Number(raw?.usagePercent || 0),
  mobile: raw?.mobile || "",
  dueDate: raw?.dueDate || "",
  lastActivityAt: raw?.lastActivityAt || "",
});

/** Whether the feed carried a usable date for the last-activity subline. */
export const hasLastActivity = (value: string) =>
  Boolean(value) && isValid(parseISO(value));

/**
 * One page of overdue accounts from the portfolio dashboard's `type=overdue`
 * feed — the same call carries the total count and the amount to recover, so
 * the strip's header needs no second request.
 */
export const getOverdueFeed = async (
  params: Record<string, any>,
): Promise<OverdueFeed> => {
  const response: any = await PaylaterService.getPortfolioDashboard({
    type: "overdue",
    ...params,
  });
  const payload = response?.data?.data ?? {};
  const rows = Array.isArray(payload?.data) ? payload.data : [];

  return {
    accounts: rows.map(formatAccount),
    count: Number(payload?.total || 0),
    amount: Number(payload?.totalAmount || 0),
  };
};
