import { getNetworkViewLink } from "../../helper";
import PaylaterService from "~/services/PaylaterService";
import type { PaginationState } from "~/types/CommonTypes";

/** One account in the "high exposure · to nudge" list. */
export interface HighExposureAccount {
  userId: string;
  userName: string;
  userType: string;
  /** Owed right now. */
  outstanding: number;
  /** Sanctioned credit limit — 0 when the feed does not carry one. */
  creditLimit: number;
  /** Positive = already late by this many days, 0 or less = still on time. */
  overdueDays: number;
  /** Share of the limit used, 0–100. */
  utilization: number;
  /** Deep link to the customer's network profile. */
  profileUrl: string;
  /** Contact number for the WhatsApp nudge — empty when the feed omits it. */
  mobile: string;
  /** Due date as the feed carries it, for the reminder template. */
  dueDate: string;
}

/** Avatar tints, cycled so adjacent rows stay distinguishable. */
const AVATAR_TONES = [
  "tw:bg-violet-500",
  "tw:bg-orange-500",
  "tw:bg-amber-500",
  "tw:bg-sky-500",
];

export const avatarToneAt = (index: number) =>
  AVATAR_TONES[index % AVATAR_TONES.length];

/** Two-letter initials for the avatar bubble. */
export const initialsOf = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "-";

/**
 * The right-hand due line — the feed counts days past due, so anything above
 * zero is already late and everything else is still ahead of its date.
 */
export const formatDueLabel = (overdueDays: number) =>
  overdueDays > 0 ? `${overdueDays}d late` : "on time";

/** Standard list params for the paginated nudge-target feed. */
export const prepareParams = (pagination: PaginationState) => ({
  type: "nudge_targets",
  overdueOnly: false,
  page: pagination?.activePage ?? 1,
  limit: pagination?.rowsPerPage ?? 10,
});

/** Nudge-target document -> the row shape the card renders. */
const formatAccount = (raw: Record<string, any>): HighExposureAccount => {
  const outstanding = Number(raw?.amount || 0);
  const creditLimit = Number(raw?.creditLimit ?? raw?.limit ?? 0);

  return {
    userId: raw?.userId || "",
    userName: raw?.userName || "-",
    userType: raw?.userType || "",
    profileUrl: getNetworkViewLink(raw?.userType || "", raw?.userId || ""),
    outstanding,
    creditLimit,
    overdueDays: Number(raw?.overdueDays || 0),
    utilization: creditLimit
      ? Math.min(Math.round((outstanding / creditLimit) * 100), 100)
      : 0,
    mobile: raw?.mobile || raw?.userMobile || raw?.userInfo?.mobile || "",
    dueDate: raw?.dueDate || raw?.validityEndDate || "",
  };
};

/** One page of high-exposure accounts, worst first. */
export const getData = async (
  params: Record<string, any>,
): Promise<HighExposureAccount[]> => {
  const response: any = await PaylaterService.getInsightsDashboard(params);
  const raw = response?.data?.data?.nudge_targets?.targets;
  return Array.isArray(raw) ? raw.map(formatAccount) : [];
};

/**
 * The PayLater request row behind an account — the nudge-target feed carries
 * no contact details, so the reminder pulls them from the same request the
 * Collect list reads (customer mobile plus any nominees).
 */
export const getReminderRequest = async (userId: string) => {
  if (!userId) return null;
  const response: any = await PaylaterService.getRequests({
    filter: { "userInfo.id": userId },
    isMyNetwork: true,
  });
  const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
  return PaylaterService.formatPaylaterRequest(rows)?.[0] || null;
};

/** How many accounts are queued for a nudge in total. */
export const getCount = async (
  params: Record<string, any>,
): Promise<number> => {
  const { page, limit, ...restParams } = params;
  const response: any = await PaylaterService.getInsightsDashboard({
    ...restParams,
    outputType: "count",
  });
  return Number(
    response?.data?.data?.count ??
      response?.data?.data?.nudge_targets?.total ??
      0,
  );
};
