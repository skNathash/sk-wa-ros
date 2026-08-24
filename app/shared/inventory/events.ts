import { useEffect, useState } from "react";
import MiscService from "~/services/MiscService";

/**
 * Fired once stock has been added and the backend has finished processing it.
 * Any view showing stock-derived numbers (totals, stock health, activity feed,
 * menu counts) can listen and re-fetch instead of the host page threading a
 * refresh callback down to it.
 */
export const INVENTORY_STOCK_UPDATED = "inventory-stock-updated";

export interface InventoryStockUpdatedDetail {
  /** Deal the stock was added against, when known. */
  dealId?: string;
  /** Quantity added, in the API (base) unit. */
  qty?: number;
  /** Where the update came from, e.g. "inventory-add-stock-modal". */
  source?: string;
}

/** Announce a stock change to every listening view. */
export const emitInventoryStockUpdated = (
  detail: InventoryStockUpdatedDetail = {},
) => {
  MiscService.createEvent(INVENTORY_STOCK_UPDATED, detail);
};

/**
 * Subscribe to stock updates. Returns a token that changes on every event —
 * add it to a fetch effect's dependency list and the effect re-runs whenever
 * stock changes anywhere in the app.
 */
export const useInventoryStockUpdated = (): number => {
  const [token, setToken] = useState(0);

  useEffect(() => {
    const handler = () => setToken((value) => value + 1);
    MiscService.listenEvent(INVENTORY_STOCK_UPDATED, handler);
    return () => {
      MiscService.removeEventListener(INVENTORY_STOCK_UPDATED, handler);
    };
  }, []);

  return token;
};
