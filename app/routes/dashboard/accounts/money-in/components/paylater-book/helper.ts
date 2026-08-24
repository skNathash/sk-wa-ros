import { format } from "date-fns";
import AccountService from "~/services/AccountService";
import type { PaginationState } from "~/types/CommonTypes";
import { partyDecor, type PartyDecor, type PartyLane } from "../../helper";

export type PaylaterCustomer = {
  id: string;
  name: string;
  /** Validity line under the name, e.g. "7 Days · Expired". */
  cycleLabel: string;
  /** Paylater request the limit was sanctioned against, e.g. "PLUL066". */
  code: string;
  /** Party page's paylater tab — where the row opens. */
  paylaterLink: string;
  mobile: string;
  lane: PartyLane;
  /** Sanctioned credit limit. */
  limit: number;
  /** Drawn against the limit. */
  used: number;
  /** 0-100 fill of the used-against-limit bar. */
  usedPercent: number;
  /** Validity end date, pre-formatted for print — e.g. "01 Dec". */
  dueLabel: string;
  /** The same date carrying what it means, for rows with no column header
      above them — e.g. "Valid till 01 Dec" / "Expired on 01 Dec". */
  dueLine: string;
  /** Validity has run out — printed in the late tone. */
  overdue: boolean;
  /** Party page the name opens — b2c, b2b or vendor, resolved from partyType. */
  link: string;
} & PartyDecor;

/** Header line of the book: how many customers, drawn and sanctioned. */
export type PaylaterSummary = {
  customerCount: number;
  outstanding: number;
  totalLimit: number;
};

/** Customers read per request; the list grows a page at a time. */
export const pageSize = 10;

/** Lane value the API reads as "both lanes". */
export const allLanes = "all";

export const emptySummary = (): PaylaterSummary => ({
  customerCount: 0,
  outstanding: 0,
  totalLimit: 0,
});

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
) => {
  const params: Record<string, any> = {
    type: "paylater_customers",
    lane: filter.lane || allLanes,
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
  };

  if (filter.search?.trim()) {
    params.search = filter.search.trim();
  }
  return params;
};

const formatCustomer = (customer: any): PaylaterCustomer => {
  const expired = customer.validityStatus === "Expired";
  const dueLabel = format(new Date(customer.validityEndDate), "dd MMM");
  const link = AccountService.preparePartyTypeRedirectionUrl(
    customer.partyType,
    customer.partyId,
  );

  return {
    id: customer.requestRefId,
    name: customer.name,
    cycleLabel: `${customer.validityPeriod} · ${customer.validityStatus}`,
    code: customer.requestRefId,
    mobile: customer.mobile,
    lane: customer.lane,
    limit: customer.creditLimit,
    used: customer.used,
    usedPercent: Math.min(
      100,
      (customer.used / Math.max(1, customer.creditLimit)) * 100,
    ),
    dueLabel,
    dueLine: `${expired ? "Expired on" : "Valid till"} ${dueLabel}`,
    overdue: expired,
    link,
    /* The party page's paylater tab is a child route of it, so the tab strip
       picks itself up from the last path segment. */
    paylaterLink: link === "#" ? link : `${link}/paylater`,
    ...partyDecor(customer.name),
  };
};

/**
 * The book's header totals ride along with the list payload, so one read gives
 * both the page of customers and the summary line above them.
 */
export const getData = async (
  params: Record<string, any>,
): Promise<{ list: PaylaterCustomer[]; summary: PaylaterSummary }> => {
  const response = await AccountService.getMoneyInDashboard(params);
  const book = response?.data?.data?.paylater_customers;
  const summary = book?.summary;

  return {
    list: (book?.customers || []).map(formatCustomer),
    summary: summary
      ? {
          customerCount: summary.customers,
          outstanding: summary.totalOutstanding,
          totalLimit: summary.totalLimit,
        }
      : emptySummary(),
  };
};

export const getCount = async (
  params: Record<string, any>,
): Promise<number> => {
  const response = await AccountService.getMoneyInDashboard({
    ...params,
    outputType: "count",
  });

  return response?.data?.data?.paylater_customers?.pagination?.total || 0;
};

