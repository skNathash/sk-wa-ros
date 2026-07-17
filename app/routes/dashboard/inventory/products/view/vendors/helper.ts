import PurchaseOrderService from "~/services/PurchaseOrderService";
import SellerCatalogService from "~/services/SellerCatalogService";

// Prepare filter parameters for API calls
export const prepareParams = (filter: any, pagination: any, sort: any) => {
  const params: any = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    sort: { [sort.key]: sort.value === "asc" ? 1 : -1 },
    filter: {},
  };

  // Add search filter
  if (filter.search?.trim()) {
    params.filter["vendor.name"] = filter.search.trim();
  }

  if (filter.status && filter.status !== "All") {
    params.filter.status = filter.status;
  }

  if (filter.vendor && filter.vendor !== "All") {
    params.filter.vendorId = filter.vendor;
  }

  return params;
};

// Get vendor-wise order history data from API
export const getData = async (params: Record<string, any>, dealId: string) => {
  try {
    const response = await SellerCatalogService.getVendorWiseOrderHistory(
      dealId,
      params
    );
    if (response.statusCode === 200 && response.data?.data) {
      // Enrich each purchase order with status label and color
      const data = response.data.data || [];
      const statuses = PurchaseOrderService.getStatuses();

      data.forEach((group: any) => {
        if (Array.isArray(group.purchaseOrders)) {
          group.purchaseOrders.forEach((po: any) => {
            const found = statuses.find(
              (s: any) =>
                s.status &&
                Array.isArray(s.status) &&
                s.status.includes(po.status)
            );
            if (found) {
              po._statusLbl = found.label;
              po._statusColor = found.color;
            } else {
              po._statusLbl = po.status || "";
              po._statusColor = undefined;
            }
          });
        }
      });

      return data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching vendor-wise order history:", error);
    return [];
  }
};

// Get vendor-wise order history count from API
export const getCount = async (params: Record<string, any>, dealId: string) => {
  try {
    const p: Record<string, any> = {
      ...params,
      outputType: "count",
    };

    delete p.limit;
    delete p.page;

    const response = await SellerCatalogService.getVendorWiseOrderHistory(
      dealId,
      p
    );
    if (response.statusCode === 200 && response.data?.data) {
      return response.data.data.totalVendors || 0;
    }
    return 0;
  } catch (error) {
    console.error("Error fetching vendor-wise order history count:", error);
    return 0;
  }
};
