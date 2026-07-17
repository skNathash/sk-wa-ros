import { endOfDay, startOfDay } from "date-fns";
import CommonService from "~/services/CommonService";
import InventorySubscribeService from "~/services/InventorySubscribeService";

// Prepare filter parameters for API calls
export const prepareParams = (filter: any, pagination: any, sort: any) => {
  const params: any = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    sort: { [sort.key]: sort.value === "asc" ? 1 : -1 },
    filter: {
      // isNewProduct: true,
      status: "Synced", // Filter only status with "Synced"
    },
  };

  // Add search filter
  if (filter.search?.trim()) {
    params.filter.productName = { $regex: filter.search.trim(), $options: "i" };
  }

  if (filter.alpha) {
    params.filter.productName = CommonService.prepareAlphaRegexFilter(
      filter.alpha
    );
  }

  // Filter consumer offers when checkbox is used
  if (filter.isConsumerOffer === true) {
    params.filter.isConsumerOffer = !!filter.isConsumerOffer;
  }

  return params;
};

// Get seller import products data from API
export const getData = async (params: Record<string, any>) => {
  try {
    const response = await InventorySubscribeService.getSellerImportProducts(
      params
    );
    if (response.statusCode === 200 && response.data?.data) {
      return InventorySubscribeService.formatSellerImportProducts(
        response.data.data || []
      );
    }
    return [];
  } catch (error) {
    console.error("Error fetching seller import products:", error);
    return [];
  }
};

// Get seller import products count from API
export const getCount = async (params: Record<string, any>) => {
  try {
    const p: Record<string, any> = {
      ...params,
      outputType: "count",
    };

    delete p.page;
    delete p.count;
    delete p.sort;

    const response = await InventorySubscribeService.getSellerImportProducts(p);

    if (response.statusCode === 200 && response.data?.data?.totalProducts) {
      return response.data.data.totalProducts || 0;
    }
    return 0;
  } catch (error) {
    console.error("Error fetching seller import products count:", error);
    return 0;
  }
};
