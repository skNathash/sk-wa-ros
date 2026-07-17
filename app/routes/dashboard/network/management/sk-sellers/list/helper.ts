import { formatDistance } from "date-fns";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import type { PaginationState } from "~/types/CommonTypes";

export const getData = async (params: Record<string, any>) => {
  const response = await FranchiseService.fetchSkSellers(params);
  return (response?.data?.data?.skSellers || []).map((item: any) => ({
    ...item,
    _initial: item.name.substring(0, 2).toUpperCase(),
    _since: formatDistance(new Date(item.createdAt), new Date(), {
      addSuffix: true,
    }),
    _address: ["addressLine1", "addressLine2"]
      .map((key) => item?.address?.[key])
      .filter(Boolean)
      .join(", "),
  }));
};

export const getCount = async (params: Record<string, any>) => {
  const p = { ...params };
  delete p.page;
  delete p.limit;
  delete p.sort;
  const response = await FranchiseService.fetchSkSellersCount(p);
  return response?.data?.data?.totalCount || 0;
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort?: { key: string; value: "asc" | "desc" }
) => {
  let params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {},
  };
  if (sort && sort.key) {
    // params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  if (filter.search?.trim()) {
    const search = filter.search.trim();
    params.filter.$or = [
      {
        name: {
          $regex: search,
          $options: "i",
        },
      },
      {
        mobile: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  if (filter.distanceKm) {
    const kmNum = Number(filter.distanceKm);
    if (!Number.isNaN(kmNum)) {
      params.filter.distanceKm = { $lte: kmNum };
    }
  }

  if (filter.alpha) {
    params.filter.name = CommonService.prepareAlphaRegexFilter(filter.alpha);
  }

  if (Object.keys(params.filter).length === 0) {
    delete params.filter;
  }

  return params;
};

export async function getSummary(filters: Record<string, any>) {
  const defaultFilter = {
    ...filters,
  };

  const paramsNow = prepareParams(defaultFilter, {
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const total = await getCount(paramsNow);

  return {
    total: total || 0,
  } as Record<string, any>;
}
