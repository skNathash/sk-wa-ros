import { startOfDay, endOfDay, format } from "date-fns";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import LogisticsService from "~/services/LogisticsService";
import OmsService from "~/services/OmsService";
import SellerService from "~/services/SellerService";
import type { PaginationState } from "~/types/CommonTypes";
import type { DispatchSummaryTile } from "./components/theme2/helper";

// Prepare params for API/data filtering
export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort: { key: string; value: "asc" | "desc" }
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {
      status: { $in: ["Invoiced", "Pending Shipment"] },
    },
  };

  const search = filter.search?.trim();
  if (search) {
    params.filter.$or = [
      { orderRefNo: { $regex: search, $options: "i" } },
      { "customerInfo.name": { $regex: search, $options: "i" } },
      { "customerInfo.mobile": { $regex: search, $options: "i" } },
    ];
  }

  if (filter.dateRange && filter.dateRange.length > 0) {
    params.filter.orderDate = {
      $gte: startOfDay(filter.dateRange[0]),
      $lte: endOfDay(filter.dateRange[1]),
    };
  }

  if (filter.type && filter.type !== "All") {
    params.filter.type = filter.type;
  }

  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  return params;
};

export async function getData(params: Record<string, any>) {
  const response = await OmsService.getSalesOrders(
    AuthService.getLoggedInUserId() || "",
    params
  );
  return OmsService.formatOrderResponse(response?.data?.data || []);
}

export async function getCount(params: Record<string, any>) {
  const p: Record<string, any> = { ...params, outputType: "count" };

  delete p.page;
  delete p.limit;

  const response = await OmsService.getSalesOrders(
    AuthService.getLoggedInUserId() || "",
    p
  );
  return response?.data?.data || 0;
}

/** API wants plain local timestamps — no zone suffix. */
const toApiDate = (date: Date) => format(date, "yyyy-MM-dd'T'HH:mm:ss");

/**
 * Delivery counters for the theme-2 dispatch summary strip, for the given day
 * (today when no date is passed). Returns the tiles ready to print.
 * Endpoint: GET sales/shipment/fetch?outputType=summary
 */
export async function getDispatchSummary(
  date: Date = new Date()
): Promise<DispatchSummaryTile[]> {
  const response = await LogisticsService.fetchShipments({
    outputType: "summary",
    filter: {
      franchiseId: AuthService.getLoggedInUserId() || "",
      deliveredFrom: toApiDate(startOfDay(date)),
      deliveredTo: toApiDate(endOfDay(date)),
    },
  });

  const summary = response?.data?.data;
  if (!summary) return [];

  return [
    {
      key: "ready",
      label: "Ready",
      value: CommonService.commaSeparated(summary.ready),
      caption: "waiting to be handed over",
      tone: "neutral",
    },
    {
      key: "handoff",
      label: "Handoff",
      value: CommonService.commaSeparated(summary.handoff),
      caption: "with the runner, yet to move",
      tone: "amber",
    },
    {
      key: "onRoute",
      label: "On route",
      value: CommonService.commaSeparated(summary.onRoute),
      caption: "out for delivery now",
      tone: "blue",
    },
    {
      key: "codOnRoute",
      label: "COD on route",
      value: `₹${CommonService.formattedAmount(summary.codOnRoute)}`,
      caption: `${summary.codCollections} collections due`,
      tone: "teal",
    },
    {
      key: "delivered",
      label: "Delivered",
      value: CommonService.commaSeparated(summary.delivered),
      caption: "closed today",
      tone: "purple",
    },
  ];
}
