// Helper functions for stock ledger (copied and adapted from sales-history/helper.ts)
import { endOfDay, startOfDay } from "date-fns";
import {
  List,
  Repeat,
  Settings,
  ShoppingCart,
  Truck,
  Undo2,
} from "lucide-react";
import AuthService from "~/services/AuthService";
import RackBinService from "~/services/RackBinService";
import type { PaginationState } from "~/types/CommonTypes";

const icons = {
  Purchase: Truck,
  Sales: ShoppingCart,
  Adjustment: Settings,
  "Sales Return": Undo2,
  Subscription: Repeat,
  Movement: List,
};

// Prepare params for stock ledger fetch (DealStockLedger style)
export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState
) => {
  const p: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {
      // status: "Success",
      // "sellerInfo._id": AuthService.getLoggedInSellerId(),
      dealId: filter.productId,
    },
    sort: {
      createdAt: -1, // Default sort by createdAt descending
    },
  };

  // Handle search
  if (filter.search?.trim()) {
    const search = filter.search.trim();
    const regEx = {
      $regex: search,
      $options: "i",
    };
    p.filter.$or = [{ refNo: regEx }];
  }

  // Handle date range
  if (filter.dateRange?.[0] && filter.dateRange?.[1]) {
    p.filter.createdAt = {
      $gte: startOfDay(new Date(filter.dateRange[0])),
      $lte: endOfDay(new Date(filter.dateRange[1])),
    };
  }

  // Handle entry type (IN/OUT)
  if (filter.type && filter.type !== "All") {
    p.filter.direction = filter.type.toUpperCase();
  }

  // Handle reference type (from type select)
  if (filter.type && filter.type !== "all") {
    // p.filter.referenceType = filter.type;
  }

  return p;
};

// Fetch stock ledger data (DealStockLedger style)
export const getData = async (params: Record<string, any>) => {
  try {
    const response = await RackBinService.getLedgerList(
      AuthService.getLoggedInUserId() || "",
      params
    );
    return {
      data: RackBinService.formatLedgerResponse(response?.data?.data || []).map(
        (item: any) => ({
          ...item,
          icon: icons[item.referenceType as keyof typeof icons],
        })
      ),
    };
  } catch (error) {
    console.error(error);
    return { data: [] };
  }
};

// Fetch total count for pagination (DealStockLedger style)
export const getCount = async (params: Record<string, any>) => {
  const p: Record<string, any> = { ...params, outputType: "count" };
  delete p.page;
  delete p.count;
  try {
    const response = await RackBinService.getLedgerList(
      AuthService.getLoggedInUserId() || "",
      p
    );

    return response.data?.data || 0;
  } catch (error) {
    console.error(error);
    return 0;
  }
};
