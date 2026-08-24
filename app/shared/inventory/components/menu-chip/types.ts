/** Which product feed the menus are pulled from. */
export type MenuChipSource = "subscribe" | "inventory";

/** The browse entity the strip filters (used for call-site clarity; the menu
 *  fetch itself depends only on `source` today — see resolver.ts). */
export type MenuChipEntity = "category" | "brand";

/** Normalised menu shape as returned by both service `formatMenuResponse`s. */
export interface MenuItem {
  /** Menu id (`_id.menuId`). */
  _id: string;
  /** Raw menu name. */
  name?: string;
  /** Localised display name (falls back to `name`). */
  _displayName?: string;
  /** Menu thumbnail asset id. */
  _displayImg?: string;
  /** Deal count — `totalDeals` (subscribe) / `dealsCount` (inventory). */
  totalDeals?: number;
  dealsCount?: number;
}

export interface MenuChipsProps {
  /** Picks the backing service (subscribe vs inventory catalog). */
  source: MenuChipSource;
  /** The entity being filtered below the strip (category | brand). */
  entity: MenuChipEntity;
  /** Controlled selection; empty/undefined renders the "All" chip active. */
  selectedMenuId?: string;
  /** Fired on chip tap; `null` means the "All" chip or a deselect toggle. */
  onSelect: (menu: MenuItem | null) => void;
  className?: string;
}
