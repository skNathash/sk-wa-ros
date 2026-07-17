// Shared helpers for the "Create My Catalog" (subscribe) flow.

// The legacy "Create My Catalog" menu entry enters via subscribe/search and
// carries `version=old` through navigation. The newer entry lands on
// subscribe/main. `version=old` is what tells the breadcrumb / home links to
// route back to the old search landing instead of the new main page.
export const SUBSCRIBE_VERSION_OLD = "old";

const SUBSCRIBE_MAIN_URL = "/dashboard/inventory/subscribe/main";
const SUBSCRIBE_SEARCH_URL = "/dashboard/inventory/subscribe/search";

/**
 * Resolves the "Create My Catalog" breadcrumb / home URL for the current flow.
 * Old flow (`version=old`) returns to subscribe/search (keeping the version so
 * the landing stays in the old flow); the default/new flow returns to
 * subscribe/main.
 */
export const getSubscribeHomeUrl = (version?: string | null): string =>
  version === SUBSCRIBE_VERSION_OLD
    ? `${SUBSCRIBE_SEARCH_URL}?version=${SUBSCRIBE_VERSION_OLD}`
    : SUBSCRIBE_MAIN_URL;

/**
 * Returns the `version` query param as a params object fragment so navigation
 * between subscribe pages preserves the active flow. Empty when not in the old
 * flow, so spreading it is a no-op.
 */
export const getSubscribeVersionParam = (
  version?: string | null,
): Record<string, string> =>
  version === SUBSCRIBE_VERSION_OLD ? { version } : {};
