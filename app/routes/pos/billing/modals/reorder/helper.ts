import AuthService from "~/services/AuthService";
import OmsService from "~/services/OmsService";
import RackBinService from "~/services/RackBinService";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { SellerDeal } from "~/types/CommonTypes";

export interface ReorderItem extends SellerDeal {
  /** Quantity the customer bought on the original order (shown as a hint). */
  orderedQty: number;
  _raw?: any;
}

/**
 * Deal ids of every item on the order, de-duplicated and in order of
 * appearance. Cancelled lines are skipped on a partially cancelled order, but
 * a fully cancelled order still lists all of its items — reordering one is the
 * whole point of picking it from recent orders.
 */
export const getOrderDealIds = async (orderId: string): Promise<
  { dealId: string; orderedQty: number }[]
> => {
  const response = await OmsService.getSellerOrderDetail(orderId);
  const order = response?.data?.data || {};
  const items = Array.isArray(order.items) ? order.items : [];

  const collect = (skipCancelled: boolean) => {
    const collected: { dealId: string; orderedQty: number }[] = [];
    const seen = new Set<string>();

    items.forEach((item: any) => {
      const dealId = String(item?.dealId || item?.deal?.id || "");
      if (!dealId) return;
      if (skipCancelled && (item.status || "").toLowerCase() === "cancelled") {
        return;
      }
      if (seen.has(dealId)) return;
      seen.add(dealId);
      collected.push({ dealId, orderedQty: Number(item.quantity) || 1 });
    });

    return collected;
  };

  const active = collect(true);
  return active.length > 0 ? active : collect(false);
};

/**
 * Current catalog state (price, mrp, stock) for the ordered deals. Deals that
 * are no longer in the seller catalog simply drop out of the list.
 */
export const getDeals = async (
  orderedDeals: { dealId: string; orderedQty: number }[],
  customerType: string,
): Promise<ReorderItem[]> => {
  const dealIds = orderedDeals.map((d) => d.dealId);
  if (dealIds.length === 0) return [];

  const isB2b = (customerType || "").toLowerCase() === "b2b";

  const response = await SellerCatalogService.getProducts({
    limit: dealIds.length,
    filter: {
      dealId: { $in: dealIds },
      status: "Active",
      ...(isB2b ? { isLocalDeal: { $ne: true } } : {}),
    },
  });

  if (response?.statusCode !== 200 || !Array.isArray(response.data?.data)) {
    return [];
  }

  const deals = SellerCatalogService.formatProductResponse(
    response.data.data,
    {
      view: "buyer",
      // B2C fulfills from sellable stock; B2B may draw on reserve stock.
      excludeReserveStock: !isB2b,
      ignoreCaseStock: !isB2b,
      priceSlabFormatType: isB2b ? "b2b" : "b2c",
    },
  );

  const qtyByDeal = new Map(
    orderedDeals.map((d) => [String(d.dealId), d.orderedQty]),
  );

  // Preserve the order the items appeared on the original order.
  const orderIndex = new Map(dealIds.map((id, idx) => [String(id), idx]));

  return deals
    .map((deal) => ({
      ...deal,
      orderedQty: qtyByDeal.get(String(deal._id)) || 1,
    }))
    .sort(
      (a, b) =>
        (orderIndex.get(String(a._id)) ?? 0) -
        (orderIndex.get(String(b._id)) ?? 0),
    );
};

/**
 * Re-fetch a single deal through the same pipeline as the list, so its stock
 * and price stay formatted the same way after an add-stock.
 */
export const refreshDeal = async (
  dealId: string,
  orderedQty: number,
  customerType: string,
): Promise<ReorderItem | null> => {
  const deals = await getDeals([{ dealId, orderedQty }], customerType);
  return deals[0] || null;
};

/**
 * Seller the deal is sold by — the bulk add-item API expects it on every item.
 * Deals served by the seller catalog carry it on the raw payload; fall back to
 * the logged-in seller/franchise.
 */
export const getDealSellerId = (deal: SellerDeal & { _raw?: any }) =>
  String(
    deal._raw?.sellerId ||
      deal._raw?.sellerInfo?.sellerId ||
      AuthService.getLoggedInSellerId() ||
      AuthService.getLoggedInUserId() ||
      "",
  );

/** Price shown/charged for a deal, based on the cart's customer type. */
export const getDealPrice = (deal: SellerDeal, customerType: string) => {
  const type = (customerType || "").toLowerCase();
  if (type === "b2b") return deal.b2bPrice || deal.price || 0;
  return deal.b2cPrice || deal.price || 0;
};

/**
 * Build the snapshots (physical stock batches to debit) for each deal, FIFO up
 * to the requested quantity. Only B2C — and quick-checkout B2B — carts carry
 * snapshots; a plain B2B cart adds items without them.
 *
 * Returns the snapshots per deal plus the deals we could not fully cover, so
 * the caller can tell the user which items were skipped.
 */
export const buildSnapshots = async (
  requests: { dealId: string; quantity: number }[],
): Promise<{
  snapshotsByDeal: Record<string, any[]>;
  insufficient: string[];
}> => {
  const snapshotsByDeal: Record<string, any[]> = {};
  const insufficient: string[] = [];

  const dealIds = requests.map((r) => r.dealId);
  if (dealIds.length === 0) return { snapshotsByDeal, insufficient };

  const response = await RackBinService.getMasterData(
    AuthService.getLoggedInUserId() || "",
    {
      filter: {
        dealId: { $in: dealIds },
        quantity: { $gt: 0 },
        isUsable: true,
      },
    },
  );

  const masters = Array.isArray(response?.data?.data) ? response.data.data : [];

  // Group the raw stock masters by deal, oldest expiry first (FIFO).
  const mastersByDeal: Record<string, any[]> = {};
  masters.forEach((master: any) => {
    const dealId = String(master.dealId || "");
    if (!dealId) return;
    if (!mastersByDeal[dealId]) mastersByDeal[dealId] = [];
    mastersByDeal[dealId].push(master);
  });

  Object.values(mastersByDeal).forEach((list) =>
    list.sort((a: any, b: any) => {
      if (!a.expiry) return 1;
      if (!b.expiry) return -1;
      return new Date(a.expiry).getTime() - new Date(b.expiry).getTime();
    }),
  );

  requests.forEach(({ dealId, quantity }) => {
    let remaining = quantity;
    const picked: any[] = [];

    for (const master of mastersByDeal[String(dealId)] || []) {
      if (remaining <= 0) break;
      const available = Number(master.quantity || 0);
      if (available <= 0) continue;
      const useQty = Math.min(available, remaining);
      picked.push({
        id: master._id,
        quantity: useQty,
        expiry: master.expiry,
        barcode: master.barcode,
        purchasePrice: master.purchasePrice,
        mrp: master.mrp,
      });
      remaining -= useQty;
    }

    if (remaining > 0 || picked.length === 0) {
      insufficient.push(String(dealId));
      return;
    }

    snapshotsByDeal[String(dealId)] = picked;
  });

  return { snapshotsByDeal, insufficient };
};
