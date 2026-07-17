import OmsService from "~/services/OmsService";
import type { PaginationState } from "~/types/CommonTypes";

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await OmsService.getDeliveredPackagesFromSK({
      ...params,
      displayType: "data",
    });

    return response.data?.data || [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getCount = async (params: Record<string, any>) => {
  try {
    const response = await OmsService.getDeliveredPackagesFromSK({
      ...params,
      displayType: "count",
    });

    return response.data?.data?.count || 0;
  } catch (error) {
    console.error(error);
    return 0;
  }
};

export const prepareParams = (
  filters: Record<string, any>,
  pagination: PaginationState
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
  };

  if (filters.search?.trim()) {
    const searchTerm = filters.search.trim();
    params.filter = {
      $or: [
        {
          boxNo: { $regex: searchTerm, $options: "i" },
        },
        {
          orderId: { $regex: searchTerm, $options: "i" },
        },
      ],
    };
  }

  return params;
};
