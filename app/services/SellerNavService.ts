import FranchiseService from "./FranchiseService";

const LAST_SELLER_KEY = "sk-last-seller-id";

/**
 * Resolves where the desktop "Sellers" nav item should land. In the theme-2
 * split layout the seller detail page hosts the seller list as a side pane,
 * so the rail jumps straight to a seller detail page instead of the Discover
 * list: the last seller the user opened (remembered here), else the first
 * seller from the same nearby-sellers API the side pane uses, else the
 * Discover list as a final fallback.
 */
export default class SellerNavService {
  /** Remember the seller (franchise) id the user last opened. */
  static rememberLastSeller(id: string) {
    if (!id) return;
    try {
      localStorage.setItem(LAST_SELLER_KEY, id);
    } catch {
      // storage unavailable (private mode etc.) — nav falls back to fetch
    }
  }

  static getLastSellerId(): string | null {
    try {
      return localStorage.getItem(LAST_SELLER_KEY);
    } catch {
      return null;
    }
  }

  /** Redirect target for the desktop rail's "Sellers" item. */
  static async resolveSellersRedirect(): Promise<{
    url: string;
    params?: Record<string, string>;
  }> {
    const params = { distance: "all" };

    const lastId = SellerNavService.getLastSellerId();
    if (lastId) {
      return {
        url: `/products/buy-from-other-retailer/retailer/${lastId}`,
        params,
      };
    }

    try {
      // Same source + default filter/sort as the seller-list side pane
      // (see routes/products/buy-from-other-retailer/retailer/components/
      // sellers/helper.ts): sellers with subscribed in-stock deals, name A–Z,
      // "all" distance.
      const resp = await FranchiseService.getRetailersNearby({
        page: 1,
        limit: 1,
        distance: "100000000",
        excludeByDeliveryRadius: false,
        filter: { "analytics.totalSubscribedInStockDeals": { $gt: 0 } },
        sort: { name: 1 },
      });
      const first = resp?.data?.data?.[0];
      if (first?._id) {
        return {
          url: `/products/buy-from-other-retailer/retailer/${first._id}`,
          params,
        };
      }
    } catch (err) {
      console.error("Error resolving default seller", err);
    }

    return { url: "/products/buy-from-other-retailer/retailers", params };
  }
}
