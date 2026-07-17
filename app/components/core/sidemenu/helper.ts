import OmsService from "~/services/OmsService";
import AuthService from "~/services/AuthService";
import type { MenuItem } from "~/types/CommonTypes";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import PaylaterService from "~/services/PaylaterService";

async function fetchOrderCount(): Promise<Record<string, number>> {
  const total = await OmsService.getPendingOrderCount();
  return { count: total };
}

async function fetchCatalogSubscribePendingCount(): Promise<
  Record<string, number>
> {
  try {
    const params = {
      outputType: "count",
      filter: {
        status: "Synced",
      },
    };
    const resp =
      await InventorySubscribeService.getSellerImportProducts(params);
    const total = resp.data.data.totalProducts || 0;
    return { count: total };
  } catch (e) {
    // swallow and return zero on failure
    return { count: 0 };
  }
}

async function fetchPoCount(): Promise<Record<string, number>> {
  try {
    const params = {
      outputType: "count",
      filter: {
        status: "Shipped",
      },
    };
    const response = await PurchaseOrderService.getPoPackages(
      AuthService.getLoggedInUserId() || "",
      params,
    );
    const total = response.data?.data?.count || 0;
    return { count: total };
  } catch (e) {
    // swallow and return zero on failure
    return { count: 0 };
  }
}

async function fetchPaylaterCount(): Promise<Record<string, number>> {
  try {
    const response = await PaylaterService.getRequestCount({
      filter: { status: "Pending" },
      isMyNetwork: true,
    });
    const total = response.data?.data?.count || 0;
    return { count: total };
  } catch (e) {
    // swallow and return zero on failure
    return { count: 0 };
  }
}

export async function attachCountsToMenu(
  items: MenuItem[],
): Promise<MenuItem[]> {
  const counts = await fetchOrderCount();
  const catalogSubscribePendingCount =
    await fetchCatalogSubscribePendingCount();
  const poCount = await fetchPoCount();

  const paylaterCount = await fetchPaylaterCount();

  // Map through top-level items and children and set item.count when langKey matches
  const attach = (menu: MenuItem[]) =>
    menu.map((it) => {
      const newItem: MenuItem = { ...it };
      if (newItem.key === "orders") {
        newItem.count = counts.count || 0;
      }

      if (newItem.key === "createMyCatalog") {
        newItem.count = catalogSubscribePendingCount.count || 0;
      }

      if (newItem.key === "purchaseOrders") {
        newItem.count = poCount.count || 0;
      }

      if (newItem.key === "paylater") {
        newItem.count = paylaterCount.count || 0;
      }

      if (newItem.children && newItem.children.length) {
        newItem.children = attach(newItem.children);
      }
      return newItem;
    });

  return attach(items);
}
