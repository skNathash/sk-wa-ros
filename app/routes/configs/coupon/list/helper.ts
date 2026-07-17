import { endOfDay, startOfDay } from "date-fns";
import { BadgePercent, CheckCircle, CircleCheckBig, Clock } from "lucide-react";
import CouponService from "~/services/CouponService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";
import type { CouponFilterFields } from "./components/Filter";

// Serialize filter form values into URL query params (skip empty values)
export const filterToSearchParams = (filter: CouponFilterFields) => {
  const params: Record<string, string> = {};
  if (filter.search) params.search = filter.search;
  if (filter.applicableFor) params.applicableFor = filter.applicableFor;
  if (filter.discountKind) params.discountKind = filter.discountKind;
  if (filter.status) params.status = filter.status;
  if (filter.isActive) params.isActive = filter.isActive;
  if (
    Array.isArray(filter.validityRange) &&
    filter.validityRange.length === 2 &&
    filter.validityRange[0] &&
    filter.validityRange[1]
  ) {
    params.validFrom = new Date(filter.validityRange[0]).toISOString();
    params.validTill = new Date(filter.validityRange[1]).toISOString();
  }
  return params;
};

// Build filter form values from URL query params
export const searchParamsToFilter = (
  searchParams: URLSearchParams,
): CouponFilterFields => {
  const validFrom = searchParams.get("validFrom");
  const validTill = searchParams.get("validTill");
  return {
    search: searchParams.get("search") || "",
    applicableFor: searchParams.get("applicableFor") || "",
    discountKind: searchParams.get("discountKind") || "",
    status: searchParams.get("status") || "",
    isActive: searchParams.get("isActive") || "",
    validityRange:
      validFrom && validTill ? [new Date(validFrom), new Date(validTill)] : [],
  };
};

export interface CouponSummary {
  totalCoupons: number;
  upcomingCoupons: number;
  runningCoupons: number;
  completedCoupons: number;
}

export const defaultSummary = [
  {
    label: "Total Coupons",
    icon: BadgePercent,
    color: "primary",
    valueKey: "totalCoupons",
    status: "",
  },
  {
    label: "Upcoming",
    icon: Clock,
    color: "warning",
    valueKey: "upcomingCoupons",
    status: "Approved",
  },
  {
    label: "Running",
    icon: CheckCircle,
    color: "success",
    valueKey: "runningCoupons",
    status: "Running",
  },
  {
    label: "Completed",
    icon: CircleCheckBig,
    color: "info",
    valueKey: "completedCoupons",
    status: "Completed",
  },
];

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await CouponService.getCoupons(params);
    if (response?.statusCode === 200) {
      const payload = response.data?.data || [];
      const list = Array.isArray(payload) ? payload : [];
      const data = CouponService.formatCouponList(list);
      return { data };
    }
    return { data: [] };
  } catch (error) {
    console.error(error);
    return { data: [] };
  }
};

export const getCount = async (params: Record<string, any>) => {
  const p = { ...params };

  delete p.page;
  delete p.limit;
  delete p.sort;

  try {
    const response = await CouponService.getCouponsCount(p);
    if (response?.statusCode === 200) {
      const payload = response.data?.data ?? response.data;
      return (
        payload?.count ??
        payload?.totalRecords ??
        (typeof payload === "number" ? payload : 0) ??
        0
      );
    }
    return 0;
  } catch (error) {
    return 0;
  }
};

// Build the Mongo-style filter object shared by listing, count and summary.
export const buildFilterObj = (filter: Record<string, any>) => {
  const filterObj: Record<string, any> = {};

  // Handle search filter - search by title or code
  if (filter.search) {
    const search = filter.search.trim();
    if (search) {
      filterObj.$or = [
        { title: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }
  }

  // Handle applicableFor filter
  if (filter.applicableFor) {
    filterObj.applicableFor = filter.applicableFor;
  }

  // Handle discount kind filter
  if (filter.discountKind) {
    filterObj["discount.kind"] = filter.discountKind;
  }

  // Handle status filter (Approved / Running / Completed)
  if (filter.status) {
    filterObj.status = filter.status;
  }

  // Handle active/inactive filter
  if (filter.isActive === "true" || filter.isActive === "false") {
    filterObj.isActive = filter.isActive === "true";
  }

  // Handle validity date range filter (overlap with validFrom/validTill)
  const hasValidityRange =
    Array.isArray(filter.validityRange) &&
    filter.validityRange.length === 2 &&
    filter.validityRange[0] &&
    filter.validityRange[1];
  if (hasValidityRange) {
    const fromDate = startOfDay(new Date(filter.validityRange[0]));
    const toDate = endOfDay(new Date(filter.validityRange[1]));

    filterObj.$and = filterObj.$and || [];
    filterObj.$and.push({ validFrom: { $lte: toDate.toISOString() } });
    filterObj.$and.push({ validTill: { $gte: fromDate.toISOString() } });
  }

  return filterObj;
};

// Run a single count query for the given Mongo-style filter object.
const countByFilter = async (filterObj: Record<string, any>) => {
  const params: Record<string, any> = {};
  if (Object.keys(filterObj).length > 0) {
    params.filter = JSON.stringify(filterObj);
  }
  return getCount(params);
};

// Fetch the summary stats shown above the list. Total Coupons is always the
// overall count (ignores the active filter); the status cards stay filter-aware.
export const getSummary = async (
  filter: Record<string, any>,
): Promise<CouponSummary> => {
  const base = buildFilterObj(filter);

  const [totalCoupons, upcomingCoupons, runningCoupons, completedCoupons] =
    await Promise.all([
      countByFilter({}),
      countByFilter({ ...base, status: "Approved" }),
      countByFilter({ ...base, status: "Running" }),
      countByFilter({ ...base, status: "Completed" }),
    ]);

  return { totalCoupons, upcomingCoupons, runningCoupons, completedCoupons };
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort?: SortProps,
) => {
  const filterObj = buildFilterObj(filter);

  const p: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
  };

  if (Object.keys(filterObj).length > 0) {
    p.filter = JSON.stringify(filterObj);
  }

  if (sort && sort.key) {
    p.sort = {
      [sort.key]: sort.value === "asc" ? 1 : -1,
    };
  } else {
    p.sort = { createdAt: -1 };
  }

  return p;
};
