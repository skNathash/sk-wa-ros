import { endOfDay, format, startOfDay } from "date-fns";
import AccountService from "~/services/AccountService";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import type { PaginationState } from "~/types/CommonTypes";

export type EventType = "All" | "PO" | "Inward" | "Payment" | "CN" | "DN";

export interface RecentEvent {
  id: string;
  date: string;
  month: string;
  year: string;
  time: string;
  type: Exclude<EventType, "All">;
  title: string;
  subtitle: string;
  amount: number;
  isNegative?: boolean;
  redirectionUrl: string;
}

const eventTypes = new Set<Exclude<EventType, "All">>([
  "PO",
  "Inward",
  "Payment",
  "CN",
  "DN",
]);

/**
 * Party type for redirection. Uses `party.type` when the API sends it;
 * otherwise infers it: PO/Inward always involve a vendor, and payments
 * against a PO reference are vendor payouts while the rest are customers.
 */
const resolvePartyType = (item: any): string => {
  if (item?.party?.type) return item.party.type;
  if (item?.type === "PO" || item?.type === "Inward") return "vendor";
  if (String(item?.reference ?? "").startsWith("PO")) return "vendor";
  return "customer";
};

const mapRecentEvents = (data: any): RecentEvent[] =>
  (data?.items ?? [])
    .filter((item: any) => eventTypes.has(item?.type))
    .map((item: any, index: number) => {
      const amount = Number(item?.amount) || 0;
      const eventDate = item?.date ? new Date(item.date) : null;
      return {
        id: String(item?.id ?? index),
        date: eventDate ? format(eventDate, "dd") : "",
        month: eventDate ? format(eventDate, "MMM") : "",
        year: eventDate ? format(eventDate, "yyyy") : "",
        time: eventDate ? format(eventDate, "hh:mm a") : "",
        type: item.type,
        title: item?.title ?? "",
        subtitle: item?.status ?? "",
        amount,
        isNegative: amount < 0,
        redirectionUrl: AccountService.preparePartyTypeRedirectionUrl(
          resolvePartyType(item),
          item?.party?.id,
        ),
      };
    });

export const prepareParams = (
  filters: Record<string, any>,
  pagination: PaginationState,
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {
      type: "recentEvents",
    },
  };

  if (filters?.eventType && filters.eventType !== "All") {
    params.filter.eventType = filters.eventType;
  }

  if (
    filters?.startDate &&
    filters.endDate &&
    filters.startDate !== "" &&
    filters.endDate !== ""
  ) {
    params.filter.createdAt = {
      $gte: startOfDay(new Date(filters.startDate)),
      $lte: endOfDay(new Date(filters.endDate)),
    };
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  const response = await PurchaseOrderService.getDashboardInsights(params);
  return mapRecentEvents(response?.data?.data?.recentEvents);
};

export const getCount = async (params: Record<string, any>) => {
  const { page, count, ...rest } = params || {};
  const response = await PurchaseOrderService.getDashboardInsights({
    ...rest,
    outputType: "count",
  });
  return (
    Number(response?.data?.data?.recentEvents?.total) ||
    Number(response?.data?.data?.count) ||
    0
  );
};
