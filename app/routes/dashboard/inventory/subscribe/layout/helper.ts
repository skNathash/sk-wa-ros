// Helpers for the subscribe (SK Library) layout shell.

import InventorySubscribeService from "~/services/InventorySubscribeService";
import {
  formatCount,
  prepareLibraryParams,
} from "~/shared/catalog/components/catalog-signal-stats/helper";

/** What the section is for, tacked onto the count in the header subtitle. */
const SUBTITLE_PURPOSE = "discover & subscribe";

/**
 * Live SKUs in the master catalog. Same params as the "SK Library SKUs" tile on
 * Discover, so the header and the tile read the same number. The count is
 * decorative here — a failed call comes back as 0 and the header keeps its
 * title alone.
 */
export const fetchLibrarySkuCount = async (): Promise<number> => {
  try {
    const response = await InventorySubscribeService.getDealsCount(
      prepareLibraryParams(),
    );
    return response?.data?.data?.totalDeals || 0;
  } catch (error) {
    return 0;
  }
};

/**
 * Header subtitle for the catalog section — how many SKUs sit behind it, e.g.
 * `56,020 products · discover & subscribe`. Returns undefined while the count
 * is still 0 (not yet loaded, or the call failed) so the header shows its title
 * alone instead of headlining "0 products".
 */
export const prepareCatalogSubtitle = (librarySkus: number) =>
  librarySkus
    ? `${formatCount(librarySkus)} products · ${SUBTITLE_PURPOSE}`
    : undefined;
