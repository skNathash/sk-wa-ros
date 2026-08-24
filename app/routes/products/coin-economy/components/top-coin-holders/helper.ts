import AccountService from "~/services/AccountService";
import LoyaltyPointService from "~/services/LoyaltyPointService";
import type { PaginationState } from "~/types/CommonTypes";
import { nextMilestone, type CoinMilestone } from "../../helper";

/** One row of the holder list, sorted by coins in hand. */
export interface CoinHolder {
  holderId: string;
  name: string;
  holderType: string;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  available: number;
  /** The next rung this holder has not cleared, or null once they top it. */
  milestone: CoinMilestone | null;
  /** Progress towards that rung, 0-100. */
  milestoneProgress: number;
  /**
   * The holder's profile — the b2b page for a franchise, the b2c page for a
   * customer, and "#" for a type that has no page of its own.
   */
  profileUrl: string;
}

/**
 * The holder feed takes paging only — no search or band filter — so the list
 * component narrows the loaded pages client-side.
 */
export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
) => ({
  type: "customerList",
  page: pagination.activePage,
  limit: pagination.rowsPerPage,
});

/**
 * Holder types the coin ledger reports, mapped onto the party types the
 * profile-link helper knows — a retailer is a franchise, everyone else is a
 * customer.
 */
const partyTypeOf = (holderType: string) => {
  const type = holderType.toLowerCase().trim();
  if (type === "franchise" || type === "retailer" || type === "b2b") {
    return "franchise";
  }
  return type === "vendor" ? "vendor" : "customer";
};

/** Holder document -> the row shape the views render. */
const formatHolder = (raw: Record<string, any>): CoinHolder => {
  const available = Number(raw?.available || 0);
  const milestone = nextMilestone(available);
  const holderId = raw?.holderId || "";
  const holderType = raw?.holderType || "Customer";

  return {
    holderId,
    name: raw?.name || "-",
    holderType,
    lifetimeEarned: Number(raw?.lifetimeEarned || 0),
    lifetimeRedeemed: Number(raw?.lifetimeRedeemed || 0),
    available,
    milestone,
    milestoneProgress: milestone
      ? Math.min(100, Math.round((available / milestone.coins) * 100))
      : 100,
    profileUrl: AccountService.preparePartyTypeRedirectionUrl(
      partyTypeOf(holderType),
      holderId,
    ),
  };
};

/** One page of holders, biggest wallet first. */
export const getData = async (
  params: Record<string, any>,
): Promise<CoinHolder[]> => {
  const response: any = await LoyaltyPointService.getKingCoinsSummary(params);
  const raw = response?.data?.data?.data;
  return Array.isArray(raw) ? raw.map(formatHolder) : [];
};

/**
 * How many holders there are in all. The feed has no count output type — it
 * carries `total` on every page — so this asks for the shortest page there is.
 */
export const getCount = async (
  params: Record<string, any>,
): Promise<number> => {
  const response: any = await LoyaltyPointService.getKingCoinsSummary({
    ...params,
    page: 1,
    limit: 1,
  });
  return Number(response?.data?.data?.total || 0);
};
