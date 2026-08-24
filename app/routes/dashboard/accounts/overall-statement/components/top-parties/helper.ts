import { tileDecor, type TileDecor } from "~/components/core/tint/tints";
import AccountService from "~/services/AccountService";
import type { AccountsDateRange } from "~/shared/accounts/hooks/useAccountsDateRange";

export type TopParty = {
  id: string;
  name: string;
  /** Customer ref or vendor code printed under the name. */
  ref: string;
  amount: number;
  /** Party page the row opens — b2c, b2b or vendor, resolved from partyType. */
  link: string;
  /** 0-100 share of the biggest party in the same list; purely visual. */
  percent: number;
} & TileDecor;

export const emptyTopParties = (): TopParty[] => [];

// Share bars are relative to the top row of each list, so the decoration is
// resolved once here rather than recomputed on every render.
const decorate = (items: any[]): TopParty[] => {
  const max = Math.max(1, ...items.map((item) => Math.abs(item.amount)));
  return items.map((item) => ({
    id: item.partyId,
    name: item.name,
    ref: item.refId,
    amount: item.amount,
    link: AccountService.preparePartyTypeRedirectionUrl(
      item.partyType,
      item.partyId
    ),
    ...tileDecor(item.name),
    percent: Math.min(100, Math.max(8, (Math.abs(item.amount) / max) * 100)),
  }));
};

export const getTopPayers = async (
  range: AccountsDateRange
): Promise<TopParty[]> => {
  const response = await AccountService.getDashboardOverview({
    type: "topParties",
    ...range,
    topLimit: 5,
  });
  const payers = response?.data?.data?.topPayers;

  return Array.isArray(payers) ? decorate(payers) : emptyTopParties();
};

export const getTopVendors = async (
  range: AccountsDateRange
): Promise<TopParty[]> => {
  const response = await AccountService.getDashboardOverview({
    type: "topVendors",
    ...range,
    topLimit: 5,
  });
  const vendors = response?.data?.data;

  return Array.isArray(vendors) ? decorate(vendors) : emptyTopParties();
};
