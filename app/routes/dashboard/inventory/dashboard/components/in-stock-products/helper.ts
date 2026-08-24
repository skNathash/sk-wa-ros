import InventoryDashboardService from "~/services/InventoryDashboardService";
import type { PaginationState, TableHeaderItem } from "~/types/CommonTypes";
import type { SortValue } from "~/components/feature/utility/sort/SortPopover";
import { isLooseStockUom, type FastMovingProduct } from "../../helper";

export type InStockProduct = FastMovingProduct & {
  availableQuantityValue?: number | string;
  movement?: string;
};

export const getHeaders = (): TableHeaderItem[] => [
  { label: "#", key: "rank", width: "4%" },
  { label: "Product", key: "dealName", width: "24%", enableSort: true },
  {
    label: "Current Stock",
    key: "availableQuantity",
    isCentered: true,
    width: "12%",
    enableSort: true,
  },
  {
    label: "Stock Value",
    key: "availableQuantityValue",
    isCentered: true,
    width: "12%",
    enableSort: true,
  },
  { label: "Movement", key: "movement", width: "10%", enableSort: true },
  { label: "Menu", key: "menuName", width: "12%", enableSort: true },
  { label: "Category", key: "categoryName", width: "13%", enableSort: true },
  { label: "Brand", key: "brandName", width: "13%", enableSort: true },
];

const getArrayPayload = (response: any) => {
  const payload = response?.data?.data ?? response?.data ?? [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

export const getData = async (params: Record<string, any>) => {
  try {
    const response =
      await InventoryDashboardService.getSkuMovementBreakdown(params);
    return getArrayPayload(response) as InStockProduct[];
  } catch (error) {
    console.error("Error fetching in stock products:", error);
    return [];
  }
};

export const getCount = async (params: Record<string, any>) => {
  try {
    const response = await InventoryDashboardService.getSkuMovementBreakdown({
      ...params,
      outputType: "count",
    });
    return Number(response?.data?.data?.total || 0);
  } catch (error) {
    console.error("Error fetching in stock products count:", error);
    return 0;
  }
};

export const downloadExport = async (params: Record<string, any>) => {
  const response = await InventoryDashboardService.getSkuMovementBreakdown({
    ...params,
    outputType: "download",
  });
  return response?.data?.data || null;
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination?: PaginationState,
  sort?: SortValue,
) => {
  const params: Record<string, any> = {
    page: pagination?.activePage || 1,
    count: pagination?.rowsPerPage || 10,
    matchFilter: {
      availableQuantity: { $gt: 0 },
    },
    sort: sort ? { [sort.key]: sort.value } : { availableQuantityValue: -1 },
  };

  const { search, alpha, menu, category, brand } = filter || {};

  if (search?.trim()) {
    params.matchFilter.$or = [
      { dealName: { $regex: search.trim(), $options: "i" } },
      { dealRefId: { $regex: search.trim(), $options: "i" } },
    ];
  }

  if (alpha) {
    if (alpha === "123") {
      params.matchFilter.dealName = {
        ...params.matchFilter.dealName,
        $regex: `^[0-9]`,
        $options: "i",
      };
    } else {
      params.matchFilter.dealName = {
        ...params.matchFilter.dealName,
        $regex: `^${alpha}`,
        $options: "i",
      };
    }
  }

  if (category?.value?.id) {
    params.matchFilter["categoryId"] = category.value.id;
  }

  if (brand?.value?.id) {
    params.matchFilter["brandId"] = brand.value.id;
  }

  if (category?.value?.parentId) {
    params.matchFilter["parentCategoryId"] = category.value.parentId;
  }

  if (menu?.value?.id) {
    params.matchFilter["menuId"] = menu.value.id;
  }

  return params;
};

export const formatMovementLabel = (movement?: string) => {
  switch ((movement || "").toUpperCase()) {
    case "FAST":
      return "Fast Moving";
    case "SLOW":
      return "Slow Moving";
    case "NON_MOVING":
      return "Non Moving";
    case "INTAKE":
      return "New Stock";
    default:
      return movement ? movement.replaceAll("_", " ") : "-";
  }
};

/** Pill colours for the movement badge — one bucket per movement class. */
export const getMovementBadgeClass = (movement?: string) => {
  switch ((movement || "").toUpperCase()) {
    case "FAST":
      return "tw:bg-emerald-100 tw:text-emerald-700";
    case "SLOW":
      return "tw:bg-amber-100 tw:text-amber-700";
    case "NON_MOVING":
      return "tw:bg-rose-100 tw:text-rose-700";
    case "INTAKE":
      return "tw:bg-sky-100 tw:text-sky-700";
    default:
      return "tw:bg-slate-100 tw:text-slate-700";
  }
};

/** A breakdown-feed row with the per-cell display values already worked out. */
export interface InStockRow extends InStockProduct {
  _key: string;
  _stockQty: number;
  _isLooseQty: boolean;
  _stockValue: number;
  _movementLabel: string;
  _movementClassName: string;
}

/**
 * Turn the raw breakdown feed into rows the desktop and mobile views can render
 * straight out. Both read the same `_`-prefixed keys, so the two layouts can't
 * drift apart on how a cell is derived.
 */
export const prepareRows = (
  items: InStockProduct[],
  startIndex = 0,
): InStockRow[] =>
  items.map((item, index) => ({
    ...item,
    _key: String(item.dealId || `${startIndex + index}`),
    _stockQty: item.availableQuantity ?? 0,
    _isLooseQty: isLooseStockUom(item.selectedStockUom),
    _stockValue: Number(item.availableQuantityValue ?? 0),
    _movementLabel: formatMovementLabel(item.movement),
    _movementClassName: getMovementBadgeClass(item.movement),
  }));
