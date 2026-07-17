import { endOfDay, startOfDay } from "date-fns";
import FranchiseService from "~/services/FranchiseService";
import RbacService from "~/services/RbacService";
import UserService from "~/services/UserService";
import type { PaginationState } from "~/types/CommonTypes";

export const defaultSummary = [
  {
    label: "Total Staff",
    value: 0,
    key: "total",
    icon: "users",
    color: "primary",
    apiValueKey: "grandTotal",
    langKey: "totalUsers",
  },
  {
    label: "Active Staff",
    value: 0,
    key: "active",
    icon: "users",
    color: "success",
    apiValueKey: "activeUsers",
    langKey: "activeUsers",
  },
  {
    label: "Admin Staff",
    value: 0,
    key: "inactive",
    icon: "users",
    color: "danger",
    apiValueKey: "adminUsers",
    langKey: "adminUsers",
  },
];

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState | null,
  sort: { key: string; value: "asc" | "desc" } | null
) => {
  const params: Record<string, any> = {
    page: pagination?.activePage || 1,
    limit: pagination?.rowsPerPage || 10,
    filter: {},
  };

  if (sort && sort.key) {
    params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  const search = filter.search?.trim();
  if (search) {
    params.filter.$or = [
      { name: search },
      { mobile: search },
      { email: search },
      { referenceId: search },
    ];
  }

  if (filter.dateRange && filter.dateRange.length > 0) {
    params.filter.createdAt = {
      $gte: startOfDay(filter.dateRange[0]),
      $lte: endOfDay(filter.dateRange[1]),
    };
  }

  if (filter.status === "Active") {
    params.filter.isActive = true;
  } else if (filter.status === "Inactive") {
    params.filter.isActive = false;
  }

  if (filter.alpha) {
    params.filter.name = { $regex: "^" + filter.alpha, $options: "i" };
  }

  if (filter.type && filter.type !== "All") {
    if (filter.type === "Admin") {
      params.filter.role = "Admin";
    } else {
      params.filter.position = filter.type;
    }
  }

  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  const response = await FranchiseService.getFranSubUser(params);
  return {
    data: UserService.formatUsers(response?.data?.data || []),
    count: response?.data?.pagination?.total || 0,
  };
};

export const getCount = async (params: Record<string, any>) => {
  const p = { ...params };

  delete p.page;
  delete p.limit;
  delete p.sort;

  const response = await FranchiseService.getFranSubUserCount(params);
  return typeof response?.data === "number" ? response.data : 0;
};

export const getSummary = async (filter: Record<string, any>) => {
  const params = prepareParams(filter, null, null);

  delete params.page;
  delete params.limit;
  delete params.sort;

  const response = await RbacService.getManpowerCount(params);
  const summary = [...defaultSummary];
  summary.forEach((item) => {
    item.value = response?.data?.data?.[item.apiValueKey] || 0;
  });
  return summary;
};

export const mapFeatures = (features: any[], data: any[]) => {
  return data.map((x) => {
    x._features = [];
    features.forEach((y) => {
      const found = (x.features || []).find((z: any) => z.code === y.key);

      // Map permissions with selected status
      const mappedPermissions = (y.permissions || []).map((permission: any) => {
        // Check if this permission's _id exists in the user's features array
        const isSelected = (x.features || []).some(
          (userFeature: any) => userFeature.id === permission._id
        );

        return {
          ...permission,
          selected: isSelected,
        };
      });

      // Check if all permissions are selected for this feature
      const allPermissionsSelected =
        mappedPermissions.length > 0 &&
        mappedPermissions.every((permission: any) => permission.selected);

      x._features.push({
        ...y,
        permissions: mappedPermissions,
        selected: found !== undefined || allPermissionsSelected,
      });
    });
    return x;
  });
};
