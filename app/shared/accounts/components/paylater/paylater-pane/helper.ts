/** Data access + response formatting for the PayLater side pane sections. */

import PaylaterService from "~/services/PaylaterService";
import type { PaginationState } from "~/types/CommonTypes";

/**
 * Bands the portfolio health score into the word and dot tone shown beside it.
 * The endpoint sends the number only.
 */
export const portfolioHealthBand = (score: number) => {
  if (score >= 90) return { label: "Excellent", dotClass: "tw:bg-emerald-300" };
  if (score >= 75) return { label: "Good", dotClass: "tw:bg-emerald-300" };
  if (score >= 50) return { label: "Fair", dotClass: "tw:bg-amber-300" };
  return { label: "Needs attention", dotClass: "tw:bg-rose-300" };
};

/** Which window the "this week" strip reads. */
export type PaylaterSummaryPeriod = "week" | "month";

/**
 * The slice of the insights summary the pane's period strip renders — what went
 * out, what came back, which way days-past-due moved and how the nudges landed.
 */
export interface PaylaterPeriodSummary {
  issued: number;
  issuedWalletCount: number;
  recovered: number;
  recoveredPaymentCount: number;
  /** Days-past-due movement vs the previous period. Negative = improving. */
  dpdMovement: number;
  backOnTrack: number;
  /**
   * Nudge counters, only when the endpoint sends them — the summary payload
   * does not carry them yet, so the card stays hidden until it does.
   */
  nudges?: {
    sent: number;
    read: number;
    paid: number;
  };
}

/** One row in the "top nudge targets" list. */
export interface PaylaterNudgeTarget {
  userId: string;
  userName: string;
  userType: string;
  /** Positive = already late by this many days, negative = due in that many. */
  overdueDays: number;
  /** What the nudge is chasing — the amount owed on the due bill. */
  amount: number;
  /** Wallet balance in use right now, against the sanctioned limit. */
  outstanding: number;
  creditLimit: number;
  utilizationPercent: number;
  /** Feed's own bucket for the row — "late", "due", … */
  status: string;
}

/** A page of nudge targets plus how many the feed holds in total. */
export interface PaylaterNudgeTargetPage {
  targets: PaylaterNudgeTarget[];
  total: number;
}

/**
 * Period summary for the pane — `type=summary` on the insights dashboard, read
 * for one window (week by default, the same one the screenshot's strip shows).
 */
export const getPeriodSummary = async (
  period: PaylaterSummaryPeriod = "week",
): Promise<PaylaterPeriodSummary> => {
  const response: any = await PaylaterService.getInsightsDashboard({
    type: "summary",
    period,
  });

  const summary = response?.data?.data?.summary ?? {};
  const nudges = summary?.nudges;

  return {
    issued: Number(summary?.issuedThisPeriod || 0),
    issuedWalletCount: Number(summary?.issuedWalletCount || 0),
    recovered: Number(summary?.recoveredThisPeriod || 0),
    recoveredPaymentCount: Number(summary?.recoveredPaymentCount || 0),
    dpdMovement: Number(summary?.dpd?.movementVsLastWeek || 0),
    backOnTrack: Number(summary?.dpd?.backOnTrack || 0),
    nudges: nudges
      ? {
          sent: Number(nudges?.sent || 0),
          read: Number(nudges?.read || 0),
          paid: Number(nudges?.paid || 0),
        }
      : undefined,
  };
};

/**
 * Standard list params for the paginated nudge-target feed. `overdueOnly` keeps
 * wallets that are merely approaching their date in the list by default.
 */
export const prepareNudgeParams = (
  pagination: PaginationState,
  overdueOnly = false,
) => ({
  type: "nudge_targets",
  overdueOnly,
  page: pagination?.activePage ?? 1,
  limit: pagination?.rowsPerPage ?? 10,
});

/** Nudge-target document -> the row shape the list renders. */
const formatNudgeTarget = (raw: Record<string, any>): PaylaterNudgeTarget => ({
  userId: raw?.userId || "",
  userName: raw?.userName || "-",
  userType: raw?.userType || "",
  overdueDays: Number(raw?.overdueDays || 0),
  amount: Number(raw?.amount || 0),
  outstanding: Number(raw?.outstanding || 0),
  creditLimit: Number(raw?.creditLimit || 0),
  utilizationPercent: Number(raw?.utilizationPercent || 0),
  status: raw?.status || "",
});

/**
 * One page of nudge targets, worst first. The feed carries its own pagination
 * block, so the total comes back with the page — no separate count call.
 */
export const getNudgeTargets = async (
  params: Record<string, any>,
): Promise<PaylaterNudgeTargetPage> => {
  const response: any = await PaylaterService.getInsightsDashboard(params);
  const feed = response?.data?.data?.nudge_targets;
  const raw = feed?.targets;
  const targets = Array.isArray(raw) ? raw.map(formatNudgeTarget) : [];

  return {
    targets,
    total: Number(feed?.pagination?.total || 0),
  };
};

/** Tone for the status chip beside a name. */
export const nudgeStatusTone = (status: string, overdueDays: number) => {
  if (status === "late" || overdueDays > 0) {
    return "tw:bg-rose-50 tw:text-rose-500";
  }
  if (status === "due" || overdueDays === 0) {
    return "tw:bg-amber-50 tw:text-amber-600";
  }
  return "tw:bg-slate-100 tw:text-slate-500";
};

/**
 * The due line under a name. The feed counts days past due, so a positive value
 * is already late and anything else is still ahead of its date.
 */
export const formatDueLabel = (overdueDays: number): string => {
  if (overdueDays > 0) return `Overdue ${overdueDays}d`;
  if (overdueDays === 0) return "Due today";
  if (overdueDays === -1) return "Due tomorrow";
  return `Due in ${Math.abs(overdueDays)}d`;
};

/** Which side of the approval queue a pane list is reading. */
export type PaylaterApprovalKind = "pending" | "approved";

/** One row in the pane's approval lists. */
export interface PaylaterApprovalRow {
  id: string;
  refId: string;
  userName: string;
  /** "B2B" / "B2C", as `formatPaylaterRequest` derives it. */
  userCategory: string;
  kycStatus: string;
  /** Limit asked for (pending) or sanctioned (approved). */
  amount: number;
  /** When the request was raised, or when the decision landed. */
  date: string;
  /** Where the row goes when tapped. */
  href: string;
}

/** A page of approval rows plus how many the queue holds in total. */
export interface PaylaterApprovalPage {
  rows: PaylaterApprovalRow[];
  total: number;
}

/**
 * Pending / recently-approved requests for the pane. Both read the same list
 * endpoint — the status decides which, and the sort follows from it: the
 * pending queue is worked oldest first, while "recently approved" is exactly
 * the newest decisions.
 *
 * Only the pending queue reads the count endpoint: how deep it is tells the
 * user there is work left, while a running total of every approval ever made
 * says nothing about the handful of recent ones on show.
 */
export const getApprovalRequests = async (
  kind: PaylaterApprovalKind,
  limit = 5,
): Promise<PaylaterApprovalPage> => {
  const isPending = kind === "pending";

  const params = {
    filter: { status: isPending ? "Pending" : "Approved" },
    isMyNetwork: true,
  };

  const [listResp, countResp]: any[] = await Promise.all([
    PaylaterService.getRequests({
      ...params,
      page: 1,
      count: limit,
      sort: isPending ? { createdAt: 1 } : { updatedAt: -1 },
    }),
    isPending ? PaylaterService.getRequestCount(params) : null,
  ]);

  // The endpoint has been seen to ignore `count` on some filters, so the page
  // is trimmed here too — the caller asked for `limit` rows and gets exactly
  // that many.
  const raw = Array.isArray(listResp?.data?.data)
    ? listResp.data.data.slice(0, limit)
    : [];
  const rows: PaylaterApprovalRow[] = PaylaterService.formatPaylaterRequest(
    raw,
  ).map((item: any) => ({
    id: item._id,
    refId: item.refId || "",
    userName: item.userInfo?.name || "-",
    userCategory: item.userCategory || "",
    kycStatus: item.kycStatus || "",
    amount:
      kind === "pending"
        ? Number(item.requestedLimit ?? item.creditLimit) || 0
        : Number(item.creditLimit ?? item.approvedLimit) || 0,
    date: (kind === "pending" ? item.createdAt : item.updatedAt) || "",
    // A pending request has no wallet page yet; an approved one does.
    href:
      kind === "pending"
        ? `/dashboard/paylater/view/${item._id}`
        : item.userRedirectionLink || `/dashboard/paylater/view/${item._id}`,
  }));

  return {
    rows,
    total: Number(countResp?.data?.data?.count || 0),
  };
};

/** Signed days label for the DPD movement tile — "−12d" / "+7d". */
export const formatDpdMovement = (days: number): string => {
  if (!days) return "0d";
  return `${days > 0 ? "+" : "−"}${Math.abs(days)}d`;
};
