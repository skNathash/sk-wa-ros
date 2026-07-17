import { startOfDay, endOfDay } from "date-fns";
import AuthService from "~/services/AuthService";
import PosService from "~/services/PosService";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import RackBinService from "~/services/RackBinService";

// Prepare filter parameters for API calls
export const prepareParams = (filter: any, pagination: any) => {
  const params: any = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    sort: { createdAt: -1 },
    filter: {
      _id: AuthService.getLoggedInUserId(),
    },
    dealFilter: {},
  };

  // Add search filter
  if (filter.search?.trim()) {
    params.filter.$or = [
      { _id: { $regex: filter.search.trim(), $options: "i" } },
    ];
  }

  if (filter.alpha) {
    params.dealFilter.name = { $regex: "^" + filter.alpha, $options: "i" };
  }

  // Add date range filter
  if (
    filter.dateRange &&
    Array.isArray(filter.dateRange) &&
    filter.dateRange.length === 2
  ) {
    params.filter["createdAt"] = {
      $gte: startOfDay(filter.dateRange[0]).toISOString(),
      $lte: endOfDay(filter.dateRange[1]).toISOString(),
    };
  }

  if (filter.status && filter.status !== "All") {
    params.filter.status = filter.status;
  }

  if (!Object.keys(params.dealFilter).length) {
    delete params.dealFilter;
  }

  return params;
};

// Get deal inventory data from API
export const getData = async (params: Record<string, any>) => {
  try {
    const response = await PosService.getDealInventory(params);
    if (response.statusCode === 200 && Array.isArray(response.data)) {
      // Extract deal IDs from the response
      const dealIds = response.data
        .map((item: any) => item._id)
        .filter(Boolean);

      // Fetch location details if we have deal IDs
      let locationDetails: any[] = [];
      if (dealIds.length > 0) {
        locationDetails = await getLocationDetails(dealIds);
      }

      // Create a map of location details by dealId for quick lookup
      const locationMap = new Map();
      locationDetails.forEach((location: any) => {
        if (location.dealId) {
          locationMap.set(location.dealId, location);
        }
      });

      // open po qty
      const poResp = await PurchaseOrderService.getList({
        page: 1,
        count: 1000,
        filter: {
          "productsList.dealId": {
            $in: response.data.map((item: any) => item._id),
          },
          status: { $in: ["Approved"] },
        },
      });

      const poMap = new Map();
      poResp.data.forEach((item: any) => {
        poMap.set(
          item.dealId,
          item.productsList.filter(
            (product: any) => product.dealId === item.dealId
          )
        );
      });

      // Attach location details to each deal
      const enrichedData = response.data.map((item: any) => ({
        ...item,
        _location: locationMap.get(item._id) || null,
        openPOQty:
          poMap
            .get(item._id)
            ?.reduce((acc: number, curr: any) => acc + curr.qty, 0) || 0,
      }));

      return enrichedData;
    }
    return [];
  } catch (error) {
    console.error("Error fetching deal inventory:", error);
    return [];
  }
};

// Get deal inventory count from API
export const getCount = async (params: Record<string, any>) => {
  try {
    const response = await PosService.getDealInventory({
      ...params,
      showCount: true,
    });
    if (response.statusCode === 200 && response.data) {
      return response.data?.[0]?.totalSku || 0;
    }
    return 0;
  } catch (error) {
    console.error("Error fetching deal inventory count:", error);
    return 0;
  }
};

// Get location details for deals
export const getLocationDetails = async (dealIds: Array<string>) => {
  try {
    const response = await RackBinService.getLocationDetailsOfDeals(dealIds);
    if (response.statusCode === 200 && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching location details:", error);
    return [];
  }
};
