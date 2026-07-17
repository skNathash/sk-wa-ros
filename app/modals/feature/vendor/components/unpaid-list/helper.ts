import PurchaseOrderService from "~/services/PurchaseOrderService";

export const prepareParams = (
  filter: Record<string, any>,
  pagination: { activePage: number; rowsPerPage: number }
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {
      paymentStatus: { $nin: "Paid" },
      status: "Completed",
    },
  };

  if (filter?.vendorId) {
    params.filter["vendorInfo.id"] = filter.vendorId;
  }

  const search = filter.search?.trim();
  if (search) {
    params.filter.$or = [
      { orderId: search },
      // { "vendorInfo.name": { $regex: search, $options: "i" } },
    ];
  }

  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  const response = await PurchaseOrderService.getList(params);
  return (
    response?.data?.data?.map((x: any) =>
      PurchaseOrderService.formatPurchaseOrderData(x)
    ) || []
  );
};

export const getCount = async (params: Record<string, any>) => {
  const response = await PurchaseOrderService.getCount(params);
  return response?.data?.data?.count || 0;
};

export const mapSelectedOrders = (orders: any[], selectedOrders: any[]) => {
  return orders.map((x) => {
    const isSelected = selectedOrders.some((y) => y._id === x._id);
    return {
      ...x,
      isSelected,
    };
  });
};
