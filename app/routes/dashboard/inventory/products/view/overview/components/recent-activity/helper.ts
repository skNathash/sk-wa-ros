import { endOfDay, startOfDay } from "date-fns";
import AuthService from "~/services/AuthService";
import PosService from "~/services/PosService";
import SellerCatalogService from "~/services/SellerCatalogService";
import StockLedgerService from "~/services/StockLedgerService";

// Prepare filter parameters for API calls (updated to match DealStockLedger)
export const prepareParams = (filter: any, pagination: any) => {
  const p: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {
      status: "Success",
      "sellerInfo._id": AuthService.getLoggedInSellerId(),
      dealId: filter.dealId,
    },
  };

  // Handle search
  if (filter.search?.trim()) {
    const regEx = {
      $regex: filter.search,
      $options: "gi",
    };
    p.filter.$or = [
      { refId: regEx },
      { "customerInfo.id": regEx },
      { "customerInfo.mobile": regEx },
      { "customerInfo.name": regEx },
    ];
  }

  // Handle date range
  if (filter.dateRange?.[0] && filter.dateRange?.[1]) {
    p.filter.createdAt = {
      $gte: startOfDay(new Date(filter.dateRange[0])),
      $lte: endOfDay(new Date(filter.dateRange[1])),
    };
  }

  // Handle entry type (IN/OUT)
  if (filter.entryType && filter.entryType !== "") {
    p.filter.direction = filter.entryType.toUpperCase();
  }

  // Handle reference type (from type select)
  if (filter.type && filter.type !== "all") {
    p.filter.referenceType = filter.type;
  }

  return p;
};

// Get deal stock ledger data from API (updated to use StockLedgerService)
export const getData = async (dealId: string) => {
  try {
    const response = await SellerCatalogService.getDealActivityLog(dealId);
    return response.data.data;
  } catch (error) {
    return [];
  }
};

// Get deal inventory count from API
export const getCount = async (dealId: string) => {
  try {
    const response = await SellerCatalogService.getDealActivityLog(dealId);
    if (response.statusCode === 200 && response.data) {
      return response.data.data.length || 0;
    }
    return 0;
  } catch (error) {
    return 0;
  }
};
