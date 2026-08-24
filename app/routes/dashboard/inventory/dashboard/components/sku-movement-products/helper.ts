import InventoryDashboardService from "~/services/InventoryDashboardService";
import type { PaginationState } from "~/types/CommonTypes";
import type { SortValue } from "~/components/feature/utility/sort/SortPopover";
import { isLooseStockUom, type FastMovingProduct } from "../../helper";

export type SkuMovementType =
  | "FAST"
  | "SLOW"
  | "NON_MOVING"
  | "OUT_OF_STOCK"
  | "NON_SELLABLE";

/**
 * Slow Moving items have no sales in the recent windows, so that tab surfaces
 * the longer 45/60/90-day periods instead of the default 7/15/30.
 */
export const getPeriods = (type?: SkuMovementType): number[] =>
  type === "SLOW" ? [45, 60, 90] : [7, 15, 30];

/** The Last Order column is hidden for the Non Moving tab. */
export const showLastOrder = (type?: SkuMovementType) => type !== "NON_MOVING";

// Non-Sellable reads from a dedicated endpoint; every other type is served by
// the shared sku-movement/list endpoint (differing only by matchFilter).
// Wrap in an arrow so the static method keeps its `this` binding to the class.
const listService = (type: SkuMovementType) => (params: Record<string, any>) =>
  type === "NON_SELLABLE"
    ? InventoryDashboardService.getSellableNonSellableList(params)
    : InventoryDashboardService.getSkuMovementList(params);

export const getData = async (
  type: SkuMovementType,
  params: Record<string, any>,
) => {
  try {
    const response = await listService(type)(params);
    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch (error) {
    console.error("Error fetching sku movement products:", error);
    return [];
  }
};

export const getCount = async (
  type: SkuMovementType,
  params: Record<string, any>,
) => {
  try {
    const response = await listService(type)({
      ...params,
      outputType: "count",
    });
    return response.data?.data?.total || 0;
  } catch (error) {
    console.error("Error fetching sku movement products count:", error);
    return 0;
  }
};

export const downloadExport = async (
  type: SkuMovementType,
  params: Record<string, any>,
) => {
  const response = await listService(type)({
    ...params,
    outputType: "download",
  });
  return response.data?.data || null;
};

export const prepareParams = (
  type: SkuMovementType,
  filter: Record<string, any>,
  pagination?: PaginationState,
  sort?: SortValue,
) => {
  const params: Record<string, any> = {
    page: pagination?.activePage || 1,
    count: pagination?.rowsPerPage || 10,
    filter: {},
    sort: sort ? { [sort.key]: sort.value } : {},
  };

  // Each type scopes the list differently: Non-Sellable via a top-level `type`
  // query param, Out of Stock via a zero-stock matchFilter, and the movement
  // tabs via a movement matchFilter.
  if (type === "NON_SELLABLE") {
    params.type = "non-sellable";
  } else if (type === "OUT_OF_STOCK") {
    params.matchFilter = { availableQuantity: { $lte: 0 } };
  } else {
    params.matchFilter = { movement: type };
  }

  const { search, alpha, menu, category, brand } = filter || {};

  if (search?.trim()) {
    params.filter.$or = [
      { dealName: { $regex: search.trim(), $options: "i" } },
      { dealRefId: { $regex: search.trim(), $options: "i" } },
    ];
  }

  if (alpha) {
    if (alpha === "123") {
      params.filter.dealName = {
        ...params.filter.dealName,
        $regex: `^[0-9]`,
        $options: "i",
      };
    } else {
      params.filter.dealName = {
        ...params.filter.dealName,
        $regex: `^${alpha}`,
        $options: "i",
      };
    }
  }

  if (category?.value?.id) {
    params.filter["applicableCategory.categoryId"] = category.value.id;
  }

  if (brand?.value?.id) {
    params.filter["applicableBrand.brandId"] = brand.value.id;
  }

  if (category?.value?.parentId) {
    params.filter["applicableParentCategory.categoryId"] =
      category.value.parentId;
  }

  if (menu?.value?.id) {
    params.filter["applicableMenu.menuId"] = menu.value.id;
  }

  return params;
};

/** One sales-window cell, already resolved to the numbers it renders. */
export interface SkuMovementPeriod {
  days: number;
  qty: number;
  value: number;
}

/** A movement-feed row with the per-cell display values already worked out. */
export interface SkuMovementRow extends FastMovingProduct {
  _key: string;
  _isLooseQty: boolean;
  _stockQty: number;
  _lastOrderValue: number;
  /** Windows in column order — which ones depends on the tab. */
  _periods: SkuMovementPeriod[];
}

/**
 * Turn the raw movement feed into rows the desktop and mobile views can render
 * straight out. The sales windows differ per tab, so `type` decides which ones
 * are resolved here — both layouts then just walk `_periods`.
 */
export const prepareRows = (
  items: FastMovingProduct[],
  type?: SkuMovementType,
  startIndex = 0,
): SkuMovementRow[] => {
  const periods = getPeriods(type);

  return items.map((item, index) => {
    const sales = (item.salesAnalytics || {}) as Record<string, any>;

    return {
      ...item,
      _key: String(item.dealId || `${startIndex + index}`),
      _isLooseQty: isLooseStockUom(item.selectedStockUom),
      _stockQty: item.availableQuantity ?? 0,
      _lastOrderValue: item.lastOrderValue ?? 0,
      _periods: periods.map((days) => ({
        days,
        qty: sales[`last${days}Days`]?.quantity ?? 0,
        value: sales[`last${days}Days`]?.value ?? 0,
      })),
    };
  });
};
