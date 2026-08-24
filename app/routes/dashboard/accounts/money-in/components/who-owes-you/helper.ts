import AccountService from "~/services/AccountService";
import type { PaginationState } from "~/types/CommonTypes";
import { partyDecor, type PartyDecor, type PartyLane } from "../../helper";

export type OwingParty = {
  id: string;
  name: string;
  /** Customer / franchise / vendor code shown in callbacks and on the row. */
  code: string;
  /** What the party is to the shop — Retailer, Vendor, Customer. */
  typeLabel: string;
  /** Party page the name opens — b2b, b2c or vendor, resolved from the type. */
  link: string;
  /** Party id used to record a payment against the party. */
  partyId: string;
  /** Raw party type (customer / vendor / franchise) for the payment API. */
  partyType: string;
  /** Dial number behind the call action; empty when the party has none on file. */
  mobile: string;
  lane: PartyLane;
  /** Party is on the shop's credit book — carries the PL tag. */
  paylater: boolean;
  invoiceCount: number;
  owes: number;
  /** Age of the oldest open invoice, e.g. "19d ago"; empty when nothing is open. */
  oldestLabel: string;
  /** Oldest invoice has crossed the terms — printed in the late tone. */
  overdue: boolean;
} & PartyDecor;

/** Parties read per request; the list grows a page at a time. */
export const pageSize = 10;

/** Lane value the API reads as "both lanes". */
export const allLanes = "all";

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
) => {
  const params: Record<string, any> = {
    type: "who_owes",
    lane: filter.lane || allLanes,
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
  };

  if (filter.search?.trim()) {
    params.search = filter.search.trim();
  }
  return params;
};

const formatParty = (party: any): OwingParty => ({
  id: party.partyTransactionId,
  name: party.party.name,
  code: party.party.refId,
  typeLabel: AccountService.getPartyTypeLabel(party.party.type),
  link: AccountService.preparePartyTypeRedirectionUrl(
    party.party.type,
    party.party.id,
  ),
  partyId: party.party.id,
  partyType: party.party.type,
  mobile: party.party.mobile || "",
  lane: party.lane,
  paylater: party.isPaylater,
  invoiceCount: party.openInvoices,
  owes: party.owes,
  /* Parties carrying a balance with nothing open — an advance or an
     adjustment — have no age to print. */
  oldestLabel: party.oldestInvoiceDate
    ? `${party.oldestDays}d ${party.isOverdue ? "overdue" : "ago"}`
    : "",
  overdue: party.isOverdue,
  ...partyDecor(party.party.name),
});

export const getData = async (
  params: Record<string, any>,
): Promise<OwingParty[]> => {
  const response = await AccountService.getMoneyInDashboard(params);
  const parties = response?.data?.data?.who_owes?.parties || [];

  return parties.map(formatParty);
};

export const getCount = async (
  params: Record<string, any>,
): Promise<number> => {
  const response = await AccountService.getMoneyInDashboard({
    ...params,
    outputType: "count",
  });

  return response?.data?.data?.who_owes?.pagination?.total || 0;
};
