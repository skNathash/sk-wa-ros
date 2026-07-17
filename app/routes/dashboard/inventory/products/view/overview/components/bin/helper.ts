import StockLedgerService from "~/services/StockLedgerService";
import AuthService from "~/services/AuthService";
import RackBinService from "~/services/RackBinService";

export interface InventorySummary {
  sellableStock: number;
  sellableLocations: number;
  nonSellableStock: number;
  nonSellableLocations: number;
  totalStock: number;
  onOrder: number;
  stockValue: number;
}

export interface BinsDataResponse {
  data: any[];
  locations: any[];
  summary?: InventorySummary;
}

export const defaultInventorySummary: InventorySummary = {
  sellableStock: 0,
  sellableLocations: 0,
  nonSellableStock: 0,
  nonSellableLocations: 0,
  totalStock: 0,
  onOrder: 0,
  stockValue: 0,
};

export const getData = async (dealId: string, params: Record<string, any>) => {
  try {
    const response = await RackBinService.getBinsOfDeal(
      AuthService.getLoggedInUserId() || "",
      dealId,
      params
    );
    return response.data?.data || {};
  } catch (error) {
    console.error(error);
    return { data: [] };
  }
};

export const getCount = async (dealId: string, params: Record<string, any>) => {
  const p: Record<string, any> = { ...params, outputType: "count" };
  delete p.page;
  delete p.count;
  delete p.sort;
  try {
    const response = await RackBinService.getBinsOfDeal(
      AuthService.getLoggedInUserId() || "",
      dealId,
      p
    );
    return response.data.data?.totalLocationCount || 0;
  } catch (error) {
    console.error(error);
    return 0;
  }
};

export const prepareParam = (filter: Record<string, any>, pagination: any) => {
  const p: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {
      quantity: { $gt: 0 },
    },
  };
  return p;
};
