import {
  differenceInMinutes,
  format,
  isValid,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";
import AuthService from "~/services/AuthService";
import SellerService from "~/services/SellerService";
import type { PaginationState } from "~/types/CommonTypes";

/** One order as the board card renders it — every field is display ready. */
export interface FulfillmentOrder {
  orderId: string;
  /** Card heading, e.g. "#4823". */
  refLabel: string;
  orderType: string;
  isB2B: boolean;
  customerName: string;
  /** Network page for the customer, empty for walk-ins. */
  customerHref: string;
  /** "18 items · picker Ravi" — the picker half is dropped when unknown. */
  metaLabel: string;
  amount: number;
  /** "32m ago" style age of the order. */
  ageLabel: string;
  /** Exact order timestamp shown under the age — "12 Aug, 04:30 PM". */
  dateLabel: string;
  /** "Self Shipment: Ravi" — only carried on delivered orders. */
  shipmentLabel: string;
}

/** Compact age of an order — "32m ago", "5h ago", "3d ago". */
const formatOrderAge = (value?: string) => {
  if (!value) return "";
  const date = parseISO(value);
  if (!isValid(date)) return "";

  const minutes = Math.max(differenceInMinutes(new Date(), date), 0);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
};

/** Exact order timestamp — "12 Aug, 04:30 PM". */
const formatOrderDate = (value?: string) => {
  if (!value) return "";
  const date = parseISO(value);
  return isValid(date) ? format(date, "dd MMM, hh:mm a") : "";
};

/**
 * Flattens one API order into the fields the board card shows, so the card
 * itself stays free of lookups and formatting.
 */
const normalizeOrder = (item: any, statusKey?: string): FulfillmentOrder => {
  const isGuest = !!item.customerInfo?.isGuestCustomer;
  const customerId = item.customerInfo?.customerId;
  const isB2B = item.orderType === "B2B";
  const refNo = String(item.orderRefNo || item.orderId || "");

  const picker = item.activePicking?.pickedBy;
  const shipping = item.invoices?.[0]?.shippingDetails;

  return {
    orderId: item.orderId,
    refLabel: refNo.startsWith("#") ? refNo : `#${refNo}`,
    orderType: item.orderType,
    isB2B,
    customerName: isGuest
      ? "Walk-in Customer"
      : item.customerInfo?.name || refNo,
    customerHref:
      isGuest || !customerId
        ? ""
        : isB2B
          ? `/dashboard/network/view/b2b/${customerId}`
          : `/dashboard/network/view/b2c/${customerId}/purchase-history`,
    metaLabel: [
      `${item.itemsCount || 0} items`,
      picker ? `picker ${picker}` : "",
    ]
      .filter(Boolean)
      .join(" · "),
    amount: item.orderAmount || 0,
    ageLabel: formatOrderAge(item.orderedDate),
    dateLabel: formatOrderDate(item.orderedDate),
    shipmentLabel:
      statusKey === "delivered" && shipping?.shipmentType
        ? `${
            shipping.shipmentType === "selfship"
              ? "Self shipment"
              : "Delivered by"
          }: ${shipping.name || "--"}`
        : "",
  };
};

const getData = async (
  params: Record<string, any>,
  statusKey?: string,
): Promise<FulfillmentOrder[]> => {
  const fid = AuthService.getLoggedInUserId() || "";
  const response = await SellerService.getSellerOrders(fid, params);
  const rows = response?.data?.data || [];
  return rows.map((item: any) => normalizeOrder(item, statusKey));
};

const getCount = async (params: Record<string, any>) => {
  const p = { ...params };

  delete p.sort;
  delete p.page;
  delete p.limit;

  const fid = AuthService.getLoggedInUserId() || "";
  const response = await SellerService.getSellerOrders(fid, {
    ...p,
    outputType: "count",
  });
  return response?.data?.data || 0;
};

const prepareFilters = (
  filter: Record<string, any>,
  pagination: PaginationState,
  statusKey?: string
) => {
  let p: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {},
  };

  const search = filter.search?.trim();
  if (search) {
    p.filter.$or = [
      { orderRefNo: { $regex: search, $options: "i" } },
      { "customerInfo.name": { $regex: search, $options: "i" } },
      { "items.dealName": { $regex: search, $options: "i" } },
    ];
  }

  if (filter.type && filter.type !== "all") {
    p.filter.orderType = filter.type;
  }

  if (filter.routeId && filter.routeId !== "all") {
    p.filter["routeInfo.routeId"] = filter.routeId;
  }

  if (statusKey === "approval-pending") {
    p.sort = {
      orderedDate: -1,
    };
  }

  // The delivered lane only ever shows the last 30 days — older delivered
  // orders live in the order directory, not on the board.
  if (statusKey === "delivered") {
    p.filter.orderedDate = {
      $gte: startOfDay(subDays(new Date(), 30)),
    };
  }

  if (filter.status) {
    const statusesList = SellerService.getOrderStatuses();
    if (Array.isArray(filter.status)) {
      let allStatuses: string[] = [];
      for (const s of filter.status) {
        const statusObj = statusesList.find((status) => status.value === s);
        if (statusObj) {
          allStatuses = allStatuses.concat(statusObj.statuses);
        } else {
          allStatuses.push(s);
        }
      }
      p.filter.status = { $in: allStatuses };
    } else {
      const statusObj = statusesList.find(
        (status) => status.value === filter.status
      );
      if (statusObj) {
        p.filter.status = { $in: statusObj.statuses };
      } else {
        p.filter.status = filter.status;
      }
    }
  }

  return p;
};

/**
 * Get counts for each status key provided in the statusMap.
 * statusMap should be an object where keys are status keys and values
 * are either a single status string or an array of status strings.
 * Returns a mapping of statusKey -> count.
 */
const getCountsForStatusMap = async (
  statusMap: Record<string, string | string[]>,
  baseFilter: Record<string, any> = {}
): Promise<Record<string, number>> => {
  const entries = Object.entries(statusMap || {});

  // Build params for each statusKey using prepareFilters and fetch counts in parallel
  const promises = entries.map(([statusKey, statusValue]) => {
    const filterForStatus = { ...baseFilter, status: statusValue };
    const params = prepareFilters(
      filterForStatus,
      {
        activePage: 1,
        rowsPerPage: 1,
        endSlNo: 1,
        startSlNo: 1,
        totalRecords: 0,
      },
      statusKey
    );
    return getCount(params).then((count) => ({ statusKey, count }));
  });

  const results = await Promise.all(promises);
  const counts: Record<string, number> = {};
  for (const r of results) {
    counts[r.statusKey] = r.count || 0;
  }

  return counts;
};

export { getCount, getData, prepareFilters, getCountsForStatusMap };
