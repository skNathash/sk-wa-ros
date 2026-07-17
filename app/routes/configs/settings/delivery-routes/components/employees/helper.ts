import UserService from "~/services/UserService";
import type { PaginationState } from "~/types/CommonTypes";

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
) => {
  const params: Record<string, any> = {
    page: pagination?.activePage,
    limit: pagination?.rowsPerPage,
    filter: {},
    isRouteAssigned: true,
  };

  const search = filter?.search?.trim();
  if (search) {
    params.filter.$or = [
      { name: search },
      { mobile: search },
      { email: search },
    ];
  }

  if (filter.alpha) {
    params.filter.name = { $regex: "^" + filter.alpha, $options: "i" };
  }

  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  const response = await UserService.getUserList(params);

  const data = UserService.formatUsers(response?.data?.data || []).map(
    (item: any) => {
      const linkedRoutes = Array.isArray(item?.linkedRoutes)
        ? item.linkedRoutes.map((r: any) => ({
            routeId: r.routeId,
            routeCode: r.routeCode || "",
            description: r.description || "",
            routeName: r.description || r.routeCode || r.routeId || "",
          }))
        : [];

      return {
        _id: item._id,
        name: item.name,
        mobile: item.mobile,
        position: item.position || "",
        linkedRoutes,
        gender: item.gender,
        profileImages: item.profileImages || [],
        _userPicType: item._userPicType,
        _position: item._position,
        _positionBadgeColor: item._positionBadgeColor,
        digitalRole: item._position,
      };
    },
  );

  return {
    data,
    count: response?.data?.pagination?.total || 0,
  };
};
