import InventorySubscribeService from "~/services/InventorySubscribeService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";

export const getData = async (params: Record<string, any>) => {
  const response = await InventorySubscribeService.getInvalidBarcodes(params);
  const data = response?.data?.data || [];

  // augment each record with UI helpers
  return (data || []).map((item: Record<string, any>) => {
    const status = item?.status || "PENDING";
    const showRemove = status === "PENDING";
    const showCreate = status === "PENDING";
    const statusColor =
      status === "PENDING"
        ? "primary"
        : status === "CREATED"
        ? "success"
        : "danger";

    return {
      ...item,
      showRemove,
      showCreate,
      statusColor,
    };
  });
};

export const getCount = async (params: Record<string, any>) => {
  const response = await InventorySubscribeService.getInvalidBarcodes({
    ...params,
    outputType: "count",
  });
  return response?.data?.data?.count || 0;
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort: SortProps
) => {
  const params: any = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
    sort: {},
  };

  // default status to PENDING if not provided
  const status = (filter.status || "PENDING").toString();
  if (status) {
    params.filter.status = status;
  }

  // search
  if (filter.search?.trim()) {
    params.filter.barcode = filter.search.trim();
  }

  // date range filter
  if (filter.dateRange && filter.dateRange.length > 0) {
    params.filter.createdAt = {
      $gte: filter.dateRange[0],
      $lte: filter.dateRange[1],
    };
  }

  // barcode filter
  if (filter.barcode?.trim()) {
    params.filter.barcode = {
      $regex: filter.barcode.trim(),
      $options: "i",
    };
  }

  // sort
  if (sort.key && sort.value) {
    params.sort[sort.key] = sort.value === "asc" ? 1 : -1;
  } else {
    // default sort
    params.sort.createdAt = -1;
  }

  // Remove empty filter object
  if (Object.keys(params.filter).length === 0) {
    delete params.filter;
  }

  return params;
};
