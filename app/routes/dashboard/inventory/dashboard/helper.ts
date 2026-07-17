import CommonService from "~/services/CommonService";

// Loose UOMs (gm/ml) are stored in base units, so DisplayQty converts them
// for display. Everything else is unit based.
const LOOSE_STOCK_UOMS = ["gm", "ml"];

export const isLooseStockUom = (uom?: string | null): boolean =>
  !!uom && LOOSE_STOCK_UOMS.includes(uom.trim().toLowerCase());

// Loose qty is stored in base units (gm/ml); convert to display units (kg/ltr).
export const getLooseDisplayUnit = (uom?: string | null): string =>
  uom?.trim().toLowerCase() === "ml" ? "ltr" : "kg";

// Formats a reserve qty, converting gm/ml base units to kg/ltr when loose.
export const formatReserveQty = (
  qty: number,
  uom?: string | null,
): string => {
  if (isLooseStockUom(uom)) {
    const unit = getLooseDisplayUnit(uom);
    return `${CommonService.roundedByDecimalPlace(qty / 1000, 2)} ${unit}`;
  }
  return `${qty} ${qty === 1 ? "unit" : "units"}`;
};

export type InventorySummary = {
  totalSKUs: number;
  inventoryValue: number;
  inventoryValueChange: number;
  fastMovingSKUs: number;
  fastMovingSKUsChange: number;
  fastMovingPercentage: number;
  slowMovingSKUs: number;
  slowMovingSKUsChange: number;
  slowMovingPercentage: number;
  slowMovingValue: number;
  outOfStockSKUs: number;
  inventoryValueLocked: number;
  inventoryTurnover: number;
  inventoryTurnoverPct: number;
  inventoryTurnoverLocked: number;
  nonMovingSKUs: number;
  reservedSKUs: number;
  loading: boolean;
};

export const defaultSummary: InventorySummary = {
  totalSKUs: 0,
  inventoryValue: 0,
  inventoryValueChange: 0,
  fastMovingSKUs: 0,
  fastMovingSKUsChange: 0,
  fastMovingPercentage: 0,
  slowMovingSKUs: 0,
  slowMovingSKUsChange: 0,
  slowMovingPercentage: 0,
  slowMovingValue: 0,
  outOfStockSKUs: 0,
  inventoryValueLocked: 0,
  inventoryTurnover: 0,
  inventoryTurnoverPct: 0,
  inventoryTurnoverLocked: 0,
  nonMovingSKUs: 0,
  reservedSKUs: 0,
  loading: true,
};

export type CategoryValue = {
  category: string;
  value: number;
  categoryName: string;
  categoryId: string;
  categoryRefId: string;
  totalProducts: number;
  fast: number;
  slow: number;
  nonMoving: number;
};

export type AgingData = {
  range: string;
  fastMoving: number;
  slowMoving: number;
  nonMoving: number;
};

export type VelocityData = {
  daysOfInventory: number;
  fastMoving: number;
  slow: number;
  deadStock: number;
};

export type FastMovingProduct = {
  dealName: string;
  dealId: string;
  dealRefId: string | null;
  totalQty: number;
  revenue: number;
  categoryId: string;
  categoryRefId: string;
  categoryName: string;
  parentCategoryId: string;
  parentCategoryRefId: string;
  parentCategoryName: string;
  brandId: string;
  brandRefId: string;
  brandName: string;
  menuId: string;
  menuRefId: string;
  menuName: string;
  availableQuantity?: number;
  selectedStockUom?: string;
  lastOrderDate?: string | null;
  lastOrderValue?: number | null;
  salesAnalytics?: {
    last7Days?: { quantity: number; value: number };
    last15Days?: { quantity: number; value: number };
    last30Days?: { quantity: number; value: number };
    last45Days?: { quantity: number; value: number };
    last60Days?: { quantity: number; value: number };
    last90Days?: { quantity: number; value: number };
  };
};

export type DeadStockProduct = {
  stockQty: number;
  selectedStockUom?: string;
  dealId: string;
  dealName: string;
  dealRefId: string;
  categoryId: string;
  categoryRefId: string;
  categoryName: string;
  parentCategoryId: string;
  parentCategoryRefId: string;
  parentCategoryName: string;
  brandId: string;
  brandRefId: string;
  brandName: string;
  menuId: string;
  menuRefId: string;
  menuName: string;
};

export type SalesPerformanceProduct = {
  _id: string;
  dealName: string;
  dealId: string;
  dealRefId: string;
  totalSales: number;
  revenue: number;
  lastSoldAt: string;
  daysSinceLastSale: number;
};

export type InventoryRiskItem = {
  stockQty: number;
  maxReserveQty?: number;
  totalReserveQty?: number;
  selectedStockUom?: string;
  dealId: string;
  dealRefId: string;
  dealName: string;
  categoryId: string;
  categoryRefId: string;
  categoryName: string;
  brandId: string;
  brandRefId: string;
  brandName: string;
  menuId: string;
  menuRefId: string;
  menuName: string;
  category: string;
  brand: string;
  menu: string;
  lastOrderDate?: string | null;
  lastOrderValue?: number | null;
  salesAnalytics?: {
    last7Days?: { quantity: number; value: number };
    last15Days?: { quantity: number; value: number };
    last30Days?: { quantity: number; value: number };
    last45Days?: { quantity: number; value: number };
    last60Days?: { quantity: number; value: number };
    last90Days?: { quantity: number; value: number };
  };
};

export type RiskInsights = {
  reorderRequired: number;
  overstocked: number;
  expiryRisk: number;
  zeroSales30Days: number;
};

export type HealthScore = {
  score: number;
  status: string;
};
