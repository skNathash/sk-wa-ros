import UserService from "~/services/UserService";
import type { PaginationState } from "~/types/CommonTypes";

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
) => {
  const params: Record<string, any> = {
    page: pagination?.activePage,
    limit: pagination?.rowsPerPage,
    // sort: "name",
    // order: "asc",
    filter: {
      position: "Sales Employee",
    },
  };

  const search = filter?.search?.trim();
  if (search) {
    params.filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { mobile: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  if (filter.alpha) {
    params.filter.name = { $regex: "^" + filter.alpha, $options: "i" };
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await UserService.getUserList(params);
    return (response?.data?.data || []).map((item: any) => {
      const routes = Array.isArray(item.linkedRoutes)
        ? item.linkedRoutes
        : [];
      return {
        _id: item._id,
        name: item.name || "",
        mobile: item.mobile || "",
        email: item.email || "",
        position: item.position || "",
        routes: routes.map((r: any) => ({
          _id: r.routeId,
          name: r.description || r.routeCode || r.routeId,
        })),
        routeIds: routes.map((r: any) => r.routeId),
      };
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return [];
  }
};

export const getCount = async (params: Record<string, any>) => {
  try {
    const p: Record<string, any> = { ...params };
    delete p.page;
    delete p.limit;
    delete p.sort;
    delete p.order;

    const response = await UserService.getUserCount(p);
    return response?.data?.data?.count || 0;
  } catch (error) {
    return 0;
  }
};
