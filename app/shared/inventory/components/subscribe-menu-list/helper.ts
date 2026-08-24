import InventorySubscribeService from "~/services/InventorySubscribeService";

/** A single menu row rendered by {@link SubscribeMenuList}. */
export interface SubscribeMenuItem {
  _id: string;
  name: string;
  _displayName: string;
  _displayImg?: string;
  totalDeals?: number;
  uniqueBrandCount?: number;
  /** First letter of the display name, for the avatar tile. */
  _initial: string;
  /** Deal count, thousands-separated — e.g. `18,420`. */
  _countLabel: string;
}

/**
 * Fetch the subscribable menu feed for the side pane, sorted by popularity so
 * the shortened pane list leads with the menus worth subscribing from (the
 * full A–Z list lives on the menus page). Mirrors the menu-chip resolver's
 * subscribe branch, but ranked rather than alphabetical.
 *
 * Never throws: the pane is ambient furniture, so a failed feed renders as an
 * empty list rather than taking the page down.
 */
export const getMenus = async (count: number): Promise<SubscribeMenuItem[]> => {
  try {
    const response = await InventorySubscribeService.getMenus({
      page: 1,
      count,
      // Same base filter + grouping the subscribe search list counts under
      // (see its `prepareParams`) — without them the row count here reads
      // higher than what tapping the row actually lists.
      filter: {
        status: "Active",
        "applicableBrand.brandName": { $ne: "" },
        isLocalDeal: false,
      },
      groupGroupedDeals: true,
      dealSubscribeType: "NOTSUBSCRIBED",
      sort: { sortType: "popular" },
    });
    const menus = InventorySubscribeService.formatMenuResponse(
      response.data?.data || [],
    );

    return menus.map((menu: SubscribeMenuItem) => {
      const label = menu._displayName || menu.name || "";
      return {
        ...menu,
        _initial: label.trim().charAt(0).toUpperCase() || "#",
        _countLabel: (menu.totalDeals || 0).toLocaleString("en-IN"),
      };
    });
  } catch (error) {
    console.error("Error fetching subscribe menus:", error);
    return [];
  }
};
