import { endOfDay, startOfDay, sub } from "date-fns";
import { AuthService } from "~/services/AuthService";
import LogisticsService from "~/services/LogisticsService";
import OmsService from "~/services/OmsService";
import type { PaginationState, SortValue } from "~/types/CommonTypes";

export const defaultFilter = {
  dateRange: [sub(new Date(), { days: 30 }), new Date()],
  search: "",
  status: "",
};

export const getData = async (params: Record<string, any>) => {
  const r = await OmsService.getShippedOrdersFromSK({
    ...params,
    displayType: "list",
  });
  return Array.isArray(r.data?.data)
    ? r.data?.data?.map((e: Record<string, any>) => {
        let _statusColor, _statusDisplay;

        if (e.status === "Shipped") {
          _statusColor = "success";
          _statusDisplay = "In Transit";
        } else if (e.status === "Delivered") {
          _statusColor = "danger";
          _statusDisplay = "Delivered";
        } else {
          _statusColor = "primary";
          _statusDisplay = e.status;
        }

        return {
          ...e,
          _statusColor,
          _statusDisplay,
        };
      })
    : [];
};

export const getCount = async (params: Record<string, any>) => {
  const p: Record<string, any> = { ...params, outputType: "count" };

  delete p.page;
  delete p.count;
  delete p.sort;

  const r = await LogisticsService.getBoxes(AuthService.getLoggedInUserId(), p);
  return r.data?.data || 0;
};

export const prepareParams = (
  filters: Record<string, any>,
  pagination: PaginationState,
  sort: { key: string; value: SortValue }
) => {
  let p: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {
      // status: { $in: ["Shipped", "Delivered"] },
    },
  };

  // Search filter
  const search = filters.search?.trim();
  if (search) {
    p.search = search;
    // p.filter.$or = [
    //   { orderId: { $regex: search, $options: "i" } },
    //   { orderRefNo: { $regex: search, $options: "i" } },
    //   { "sender.name": { $regex: search, $options: "i" } },
    //   { "sender.refId": { $regex: search, $options: "i" } },
    //   { "packages.packageRefNo": { $regex: search, $options: "i" } },
    // ];
  }

  // Status filter based on active tab
  if (filters.activeTab) {
    // if (filters.activeTab === "yet-to-receive") {
    //   p.filter.status = { $in: ["Shipped", "In Transit"] };
    // } else if (filters.activeTab === "received") {
    //   p.filter.status = { $in: ["Delivered", "Received"] };
    // }
  }

  // Date Range filter
  if (filters.dateRange && filters.dateRange.length > 0) {
    // p.filter.orderedDate = {
    //   $gte: startOfDay(filters.dateRange[0]),
    //   $lte: endOfDay(filters.dateRange[1]),
    // };
  }

  // Sorting
  if (sort.key && sort.value) {
    p.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  // Remove filter if empty
  if (!Object.keys(p.filter).length) {
    delete p.filter;
  }

  return p;
};
