import { useMemo } from "react";

export interface UseProfitOptions {
  sellingPrice: number;
  purchasePrice: number;
  decimalPlaces?: number;
  type: "network" | "customer";
}

export function useProfit({
  sellingPrice,
  purchasePrice,
  decimalPlaces = 2,
  type,
}: UseProfitOptions) {
  return useMemo(() => {
    const profit =
      type === "network"
        ? sellingPrice - purchasePrice
        : purchasePrice - sellingPrice;
    const margin = purchasePrice ? (profit / purchasePrice) * 100 : 0;
    return {
      profit: Number(profit.toFixed(decimalPlaces)),
      margin: Number(margin.toFixed(decimalPlaces)),
    };
  }, [sellingPrice, purchasePrice, decimalPlaces]);
}
