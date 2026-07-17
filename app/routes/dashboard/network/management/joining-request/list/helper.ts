import FranchiseService from "~/services/FranchiseService";
import { startOfDay, endOfDay } from "date-fns";
import type { PaginationState } from "~/types/CommonTypes";
import CommonService from "~/services/CommonService";

/**
 * Formats address into 2 parts for better display
 * Part 1: Address lines (addressLine1, addressLine2)
 * Part 2: Location details (city, district, state, pincode)
 */
const formatAddress = (sfsellerInfo: any) => {
  if (!sfsellerInfo?.details) {
    return {
      addressPart1: null,
      addressPart2: null,
    };
  }

  const { address, city, district, state } = sfsellerInfo.details;
  const pincode = sfsellerInfo.pincode;

  // Part 1: Address lines
  const addressLines = [];
  if (address?.addressLine1) addressLines.push(address.addressLine1);
  if (address?.addressLine2) addressLines.push(address.addressLine2);
  const addressPart1 = addressLines.length > 0 ? addressLines.join(", ") : null;

  // Part 2: Location details (city, district, state, pincode)
  const locationParts = [city, district, state, pincode].filter(Boolean);
  const addressPart2 =
    locationParts.length > 0 ? locationParts.join(", ") : null;

  return {
    addressPart1,
    addressPart2,
  };
};

export const getData = async (params: Record<string, any>) => {
  const response = await FranchiseService.getJoiningRequesFromBuyer(params);
  const requests = response?.data?.data?.requests || [];

  // Format address for each request
  return requests.map((request: any) => {
    const { addressPart1, addressPart2 } = formatAddress(request.sfsellerInfo);

    return {
      ...request,
      initials: request.sfsellerInfo?.name?.substring(0, 2).toUpperCase(),
      _formattedAddress: {
        part1: addressPart1,
        part2: addressPart2,
      },
    };
  });
};

export const getCount = async (params: Record<string, any>) => {
  const p = { ...params };

  delete p.page;
  delete p.limit;
  delete p.sort;

  const response = await FranchiseService.getJoiningRequesFromBuyerCount(p);
  return response?.data?.count || 0;
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort?: { key: string; value: "asc" | "desc" },
) => {
  let params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {},
  };

  if (sort && sort.key) {
    // params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  // Handle search filter
  if (filter.search?.trim()) {
    const search = filter.search.trim();
    params.filter.$or = [
      {
        "sfsellerInfo.name": {
          $regex: search,
          $options: "i",
        },
      },
      {
        "sfsellerInfo.details.mobile": {
          $regex: search,
          $options: "i",
        },
      },
      {
        "sfsellerInfo.email": {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  // Handle date range filter
  if (
    filter.dateRange &&
    Array.isArray(filter.dateRange) &&
    filter.dateRange.length === 2
  ) {
    const [startDate, endDate] = filter.dateRange;
    if (startDate && endDate) {
      params.filter.createdAt = {
        $gte: startOfDay(startDate).toISOString(),
        $lte: endOfDay(endDate).toISOString(),
      };
    }
  }

  // Handle alpha filter (alphabetical filtering)
  if (filter.alpha) {
    params.filter["sfsellerInfo.name"] = CommonService.prepareAlphaRegexFilter(
      filter.alpha,
    );
  }

  // Handle type filter (if needed in the future)
  // Handle status filter
  if (filter.status && filter.status !== "All") {
    params.filter.status = filter.status;
  }

  // Remove empty filter object
  if (Object.keys(params.filter).length === 0) {
    delete params.filter;
  }

  return params;
};

export async function getSummary(filters: Record<string, any>) {
  const defaultFilter = {
    ...filters,
  };

  // prepare params for overall count (pagination values are removed inside getCount)
  const paramsNow = prepareParams(defaultFilter, {
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  // four counts: total, approved, not-approved (status $nin Approved), rejected
  const promises = [
    getCount(paramsNow),
    getCount({ ...paramsNow, filter: { status: "Approved" } }),
    getCount({ ...paramsNow, filter: { status: "Pending" } }),
    getCount({ ...paramsNow, filter: { status: "Rejected" } }),
  ];

  const [total, approved, notApproved, rejected] = await Promise.all(promises);

  return {
    total: total || 0,
    approved: approved || 0,
    notApproved: notApproved || 0,
    rejected: rejected || 0,
    loyalty: 0,
    avg: 0,
  };
}
