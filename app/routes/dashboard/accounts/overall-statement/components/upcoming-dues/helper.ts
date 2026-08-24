import { format } from "date-fns";
import { tileDecor, type TileDecor } from "~/components/core/tint/tints";
import AccountService from "~/services/AccountService";
import type { AccountsDateRange } from "~/shared/accounts/hooks/useAccountsDateRange";

export type UpcomingDue = {
  id: string;
  /** Due date, pre-formatted for print — e.g. "Fri, 25 Jul". */
  dueLabel: string;
  /** Party the amount is owed to / by. */
  name: string;
  /** Party code printed under the name, e.g. "VEN524". */
  partyRef: string;
  /** Document the due sits against, e.g. "PO007397". */
  reference: string;
  amount: number;
  /** Party page the row opens. */
  link: string;
} & TileDecor;

export const emptyUpcomingDues = (): UpcomingDue[] => [];

const normalise = (item: any): UpcomingDue => ({
  id: String(item.id),
  dueLabel: format(new Date(item.date), "EEE, dd MMM"),
  name: item.party.name,
  partyRef: item.party.refId,
  reference: item.reference,
  amount: item.amount,
  link: AccountService.preparePartyTypeRedirectionUrl(
    item.party.type,
    item.party.id,
  ),
  ...tileDecor(item.party.name),
});

export const prepareParams = (
  range: AccountsDateRange,
  eventLimit: number,
) => ({
  type: "dueAmount",
  ...range,
  eventLimit,
});

export const getUpcomingDues = async (
  params: Record<string, any>,
): Promise<UpcomingDue[]> => {
  const response = await AccountService.getDashboardOverview(params);
  const items: any[] = response?.data?.data || [];

  return items.map(normalise);
};
