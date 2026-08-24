import { useEffect, useState } from "react";
import InventoryDashboardService from "~/services/InventoryDashboardService";

/**
 * Inventory-value summary (total / sellable / non-sellable) shared by the two
 * presentations of the same numbers: the theme-1 stat-card strip
 * (`InventoryValueSummary`) and the theme-2 breakdown card
 * (`theme2/ValueBreakdown`).
 *
 * The two value endpoints have shifted key names over time, so every figure is
 * read through `extractValue` with the known aliases rather than a fixed path.
 */
export type ValueBucket = {
  value: number;
  quantity: number;
  products: number;
};

export type ValueSummary = {
  inventory: ValueBucket;
  sellable: ValueBucket;
  nonSellable: ValueBucket;
};

const emptyBucket: ValueBucket = { value: 0, quantity: 0, products: 0 };

export const defaultValueSummary: ValueSummary = {
  inventory: emptyBucket,
  sellable: emptyBucket,
  nonSellable: emptyBucket,
};

const toNumber = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const extractValue = (payload: any, keys: string[]) => {
  if (!payload || typeof payload !== "object") return 0;
  for (const key of keys) {
    if (payload[key] !== undefined && payload[key] !== null) {
      return toNumber(payload[key]);
    }
  }
  return 0;
};

const parseInventoryValue = (response: any): ValueBucket => {
  const data = response?.data?.data ?? response?.data ?? {};
  if (typeof data === "number" || typeof data === "string") {
    return { value: toNumber(data), quantity: 0, products: 0 };
  }
  return {
    value: extractValue(data, [
      "inventoryValue",
      "totalInventoryValue",
      "value",
      "totalValue",
    ]),
    quantity: extractValue(data, ["totalQuantity", "quantity"]),
    products: extractValue(data, ["totalProducts", "products"]),
  };
};

const parseSellableNonSellable = (response: any) => {
  const data = response?.data?.data ?? response?.data ?? {};
  if (!data || typeof data !== "object") {
    return { sellable: emptyBucket, nonSellable: emptyBucket };
  }

  return {
    sellable: {
      value: extractValue(data, [
        "sellableValue",
        "sellableInventoryValue",
        "sellable",
        "sellableInventory",
      ]),
      quantity: extractValue(data, ["sellableQuantity"]),
      products: extractValue(data, ["sellableProducts"]),
    },
    nonSellable: {
      value: extractValue(data, [
        "nonSellableValue",
        "nonSellableInventoryValue",
        "nonSellable",
        "nonSellableInventory",
      ]),
      quantity: extractValue(data, ["nonSellableQuantity"]),
      products: extractValue(data, ["nonSellableProducts"]),
    },
  };
};

export const formatCount = (count: number) => count.toLocaleString("en-IN");

export const useInventoryValueSummary = () => {
  const [summary, setSummary] = useState<ValueSummary>(defaultValueSummary);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadSummary = async () => {
      setLoading(true);
      try {
        const [inventoryValueRes, sellableRes] = await Promise.all([
          InventoryDashboardService.getInventoryValue({}),
          InventoryDashboardService.getSellableInventoryValue({}),
        ]);

        const inventory = parseInventoryValue(inventoryValueRes);
        const { sellable, nonSellable } = parseSellableNonSellable(sellableRes);

        if (!mounted) return;
        setSummary({ inventory, sellable, nonSellable });
      } catch {
        if (!mounted) return;
        setSummary(defaultValueSummary);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadSummary();

    return () => {
      mounted = false;
    };
  }, []);

  return { summary, loading };
};
