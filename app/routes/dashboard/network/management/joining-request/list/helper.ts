import FranchiseService from "~/services/FranchiseService";
import { startOfDay, endOfDay } from "date-fns";
import type { PaginationState } from "~/types/CommonTypes";
import type { SortValue } from "~/components/feature/utility/sort/SortPopover";
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

const initialsOf = (name?: string) =>
  (name || "")
    .split(" ")
    .filter(Boolean)
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** Compact single-line location for the identity row under the name. */
const locationLine = (
  sfsellerInfo: any,
  formatted: {
    addressPart1: string | null;
    addressPart2: string | null;
  },
) => {
  const details = sfsellerInfo?.details;
  if (details?.city && details?.state) {
    return `${details.city}, ${details.state}`;
  }
  return formatted.addressPart2 || formatted.addressPart1 || null;
};

export const getData = async (params: Record<string, any>) => {
  const response = await FranchiseService.getJoiningRequesFromBuyer(params);
  const requests = response?.data?.data?.requests || [];

  // Format address for each request
  return requests.map((request: any) => {
    const { addressPart1, addressPart2 } = formatAddress(request.sfsellerInfo);
    const name = request.sfsellerInfo?.name || "";

    return {
      ...request,
      name,
      mobile: request.sfsellerInfo?.details?.mobile || "",
      email: request.email || request.sfsellerInfo?.email || "",
      initials: initialsOf(name),
      distanceKm: request.sfsellerInfo?.details?.distanceKm,
      _formattedAddress: {
        part1: addressPart1,
        part2: addressPart2,
      },
      formattedLocation: locationLine(request.sfsellerInfo, {
        addressPart1,
        addressPart2,
      }),
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
  sort?: SortValue,
) => {
  let params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {},
  };

  if (sort && sort.key) {
    // params.sort = { [sort.key]: sort.value };
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

  // Status comes from the segment tiles / mobile pills / desktop dropdown —
  // "All" / "all" clears it so every status is returned.
  if (filter.status && filter.status !== "All" && filter.status !== "all") {
    params.filter.status = filter.status;
  }

  // Remove empty filter object
  if (Object.keys(params.filter).length === 0) {
    delete params.filter;
  }

  return params;
};

export async function getSummary(filters: Record<string, any>) {
  // Counts are status-scoped on their own — strip status so the tiles always
  // reflect the full book under the other active filters (search/date/alpha).
  const { status: _status, ...rest } = filters || {};
  const defaultFilter = { ...rest };

  // prepare params for overall count (pagination values are removed inside getCount)
  const paramsNow = prepareParams(defaultFilter, {
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  // four counts: total, approved, pending, rejected
  const promises = [
    getCount(paramsNow),
    getCount({
      ...paramsNow,
      filter: { ...paramsNow.filter, status: "Approved" },
    }),
    getCount({
      ...paramsNow,
      filter: { ...paramsNow.filter, status: "Pending" },
    }),
    getCount({
      ...paramsNow,
      filter: { ...paramsNow.filter, status: "Rejected" },
    }),
  ];

  const [total, approved, notApproved, rejected] = await Promise.all(promises);

  return {
    total: total || 0,
    approved: approved || 0,
    notApproved: notApproved || 0,
    rejected: rejected || 0,
  };
}
