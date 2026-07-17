import FranchiseService from "~/services/FranchiseService";
import type { PaginationState } from "~/types/CommonTypes";

// Prepare params for API/data filtering
export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort?: { key: string; value: "asc" | "desc" },
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    sort: { name: 1 },
  };

  if (filter.activeTab === "other-retailers") {
    delete params.sort;
    params.distance = 100;
    params.filter = {
      // _id: { $ne: AuthService.getLoggedInUserId() },
      // networkType: "SKRETAILER",
    };
  }

  const search = filter.search?.trim();

  if (filter.activeTab === "other-retailers") {
    if (search) {
      params.filter = {
        ...(params.filter || {}),
        $or: [
          { name: { $regex: search, $options: "i" } },
          { mobile: search },
          { franchiseId: search },
        ],
      };
    }
  } else {
    if (search) {
      params.search = search;
    }
  }

  if (filter.alpha) {
    if (filter.activeTab === "other-retailers") {
      params.filter = {
        ...(params.filter || {}),
        name: {
          $regex: `^${filter.alpha}`,
          $options: "i",
        },
      };
    } else {
      params.search = `^${filter.alpha}`;
    }
  }

  if (filter.retailerType && filter.retailerType !== "All") {
    params.type = filter.retailerType;
  }

  return params;
};

export async function getData(
  params: Record<string, any>,
  type: string = "my-network",
): Promise<any[]> {
  let response: any;
  if (type === "my-network") {
    response = await FranchiseService.getFranchiseNetwork(params);
  } else if (type === "other-retailers") {
    response = await FranchiseService.getRetailersNearby(params);
  } else {
    response = await FranchiseService.getFranchiseNetwork(params);
  }
  return (response?.data?.data || []).map((item: any) => {
    return {
      ...item,
      displayType: FranchiseService.getDisplaySubType(
        item.subType || "",
        item.networkType || "",
      ),
      formatAddress: [
        item.city || item.town,
        item.district,
        item.state,
        item.postcode,
      ]
        .filter(Boolean)
        .join(", "),
    };
  });
}

export async function getCount(
  params: Record<string, any>,
  type: string = "my-network",
): Promise<number> {
  const p: Record<string, any> = { ...(params || {}) };

  // remove pagination/sort keys for count queries
  delete p.page;
  delete p.limit;
  delete p.sort;

  let response: any;
  if (type === "my-network") {
    response = await FranchiseService.getFranchiseNetworkCount(p);
    return response?.data?.data?.total || 0;
  } else if (type === "other-retailers") {
    response = await FranchiseService.getRetailersNearby({
      ...p,
      outputType: "count",
    });
    return response?.data?.data || 0;
  } else {
    response = await FranchiseService.getFranchiseNetworkCount(p);
    return response?.data?.data?.total || 0;
  }
}
