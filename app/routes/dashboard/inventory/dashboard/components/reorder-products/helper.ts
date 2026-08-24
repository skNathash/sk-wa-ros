import CommonService from "~/services/CommonService";
import InventoryDashboardService from "~/services/InventoryDashboardService";
import type { PaginationState } from "~/types/CommonTypes";
import type { SortValue } from "~/components/feature/utility/sort/SortPopover";
import {
  formatReserveQty,
  isLooseStockUom,
  type InventoryRiskItem,
} from "../../helper";

export type InventoryRiskType = "reorderRequired" | "expiryRisk" | "reserve";

/** A risk-feed row with the per-cell display values already worked out. */
export interface InventoryRiskRow extends InventoryRiskItem {
  _key: string;
  _isLooseQty: boolean;
  _stockQty: number;
  /** Reserve tables show this instead of the stock quantity. */
  _reserveQtyLabel: string;
  _sales7Qty: number;
  _sales7Value: number;
  _sales15Qty: number;
  _sales15Value: number;
  _sales30Qty: number;
  _sales30Value: number;
  _lastOrderValue: number;
}

/**
 * Turn the raw risk feed into rows the desktop and mobile views can render
 * straight out. Both read the same `_`-prefixed keys, so the two layouts can't
 * drift apart on how a cell is derived.
 */
export const prepareRows = (
  items: InventoryRiskItem[],
  startIndex = 0,
): InventoryRiskRow[] =>
  items.map((item, index) => {
    const sales = (item.salesAnalytics || {}) as Record<string, any>;

    return {
      ...item,
      _key: String(item.dealId || `${startIndex + index}`),
      _isLooseQty: isLooseStockUom(item.selectedStockUom),
      _stockQty: item.stockQty ?? 0,
      _reserveQtyLabel: formatReserveQty(
        item.totalReserveQty ?? 0,
        item.selectedStockUom,
      ),
      _sales7Qty: sales.last7Days?.quantity ?? 0,
      _sales7Value: sales.last7Days?.value ?? 0,
      _sales15Qty: sales.last15Days?.quantity ?? 0,
      _sales15Value: sales.last15Days?.value ?? 0,
      _sales30Qty: sales.last30Days?.quantity ?? 0,
      _sales30Value: sales.last30Days?.value ?? 0,
      _lastOrderValue: item.lastOrderValue ?? 0,
    };
  });

export const getData = async (
  type: InventoryRiskType,
  params: Record<string, any>,
) => {
  try {
    const response = await InventoryDashboardService.getInventoryRisk(
      type,
      params,
    );
    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch (error) {
    console.error(`Error fetching ${type} products:`, error);
    return [];
  }
};

export const getCount = async (
  type: InventoryRiskType,
  params: Record<string, any>,
) => {
  try {
    const response = await InventoryDashboardService.getInventoryRisk(type, {
      ...params,
      outputType: "count",
    });
    return response.data?.count || 0;
  } catch (error) {
    console.error(`Error fetching ${type} products count:`, error);
    return 0;
  }
};

export const downloadExport = async (
  type: InventoryRiskType,
  params: Record<string, any>,
) => {
  const response = await InventoryDashboardService.getInventoryRisk(type, {
    ...params,
    outputType: "download",
  });
  return response.data?.data || null;
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination?: PaginationState,
  sort?: SortValue,
) => {
  const params: Record<string, any> = {
    page: pagination?.activePage || 1,
    count: pagination?.rowsPerPage || 10,
    matchFilter: {},
    sort: sort ? { [sort.key]: sort.value } : {},
  };

  const { search, alpha, menu, category, brand } = filter || {};

  if (search?.trim()) {
    const term = search.trim();
    params.matchFilter.$or = [
      { dealName: { $regex: term, $options: "i" } },
      { dealRefId: { $regex: term, $options: "i" } },
    ];
  }

  if (alpha) {
    params.matchFilter.dealName = {
      ...params.matchFilter.dealName,
      ...CommonService.prepareAlphaRegexFilter(alpha),
    };
  }

  if (category?.value?.id) {
    params.matchFilter["categoryRefId"] = category.value.id;
  }

  if (brand?.value?.id) {
    params.matchFilter["brandRefId"] = brand.value.id;
  }

  if (category?.value?.parentId) {
    params.matchFilter["parentCategoryRefId"] = category.value.parentId;
  }

  if (menu?.value?.id) {
    params.matchFilter["menuRefId"] = menu.value.id;
  }

  return params;
};
