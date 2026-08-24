import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import TintTile from "~/components/core/tint/TintTile";
import { Skeleton } from "~/components/ui/skeleton";
import useAppNav from "~/hooks/useAppNav";
import {
  getAllItemsCount,
  getCatalogMenus,
  getMenuListQuery,
  MENU_LIST_PATH,
  type CatalogMenuItem,
} from "./helper";

interface CatalogMenuListProps {
  /** Small caps heading over the rows. Pass null to drop it. */
  title?: string | null;
  /** How many menus to pull. */
  limit?: number;
  /** Extra seller-deal filters applied to the menu feed. */
  params?: Record<string, any>;
  /**
   * Fired on row tap. Handles the navigation itself when not given — pass it
   * when the host page already renders the filtered list. `null` is the
   * "All items" row.
   */
  onMenuClick?: (menu: CatalogMenuItem | null) => void;
  className?: string;
}

/**
 * The seller's catalogue split by menu, as a full-bleed side-pane list. Fetches
 * its own feed (see `./helper`) so it can be dropped into any pane without the
 * host wiring anything up.
 *
 * Tapping a row opens the products list in a dedicated menu view (`view=menu`)
 * filtered to that menu. The destination uses the menu name as the page title
 * and the menu's deal count as the item count, and keeps the menu filter chip
 * hidden. The leading "All items" row clears the filter and carries the summed
 * deal count. The active menu (from the URL's `menuId`) is highlighted so the
 * pane reflects what the main column is showing.
 */
const CatalogMenuList = ({
  title = "Menus",
  limit = 12,
  params,
  onMenuClick,
  className,
}: CatalogMenuListProps) => {
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();

  const [items, setItems] = useState<CatalogMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  // Catalogue-wide deal count for the "All items" row. `null` until the count
  // call answers (or when it fails), which is when the summed menu counts stand
  // in for it.
  const [allItemsCount, setAllItemsCount] = useState<number | null>(null);

  const activeMenuId = searchParams.get("menuId") || "";

  // Callers rebuild `params` on every render, so the effect keys off its
  // serialised form instead of the object reference.
  const paramsKey = JSON.stringify(params || {});
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setLoading(true);
    setAllItemsCount(null);
    getCatalogMenus(limit, paramsRef.current || {}, controller.signal).then(
      (result) => {
        if (!active) return;
        setItems(result);
        setLoading(false);
      },
    );

    // Runs alongside the menu feed — the rows render as soon as the menus land
    // and the "All items" total swaps in when the count answers.
    getAllItemsCount(paramsRef.current || {}, controller.signal).then(
      (count) => {
        if (!active) return;
        setAllItemsCount(count);
      },
    );

    return () => {
      active = false;
      controller.abort();
    };
  }, [paramsKey, limit]);

  const handleSelect = (menu: CatalogMenuItem | null) => {
    if (onMenuClick) {
      onMenuClick(menu);
      return;
    }
    if (!menu) {
      appNav.to(MENU_LIST_PATH, { tab: "products" });
      return;
    }
    appNav.to(MENU_LIST_PATH, getMenuListQuery(menu));
  };

  // Nothing to show and nothing coming — drop the panel rather than leave an
  // orphan heading over an empty box.
  if (!loading && !items.length) return null;

  // Prefer the catalogue-wide count; the summed menu counts only cover the
  // menus actually fetched, so they read low until the count call lands.
  const totalLabel = (
    allItemsCount ?? items.reduce((sum, item) => sum + item.dealsCount, 0)
  ).toLocaleString("en-IN");

  const rowClass =
    "tw:group tw:relative tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:px-4 tw:py-2 tw:text-left tw:transition-colors tw:duration-150 tw:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-inset tw:focus-visible:ring-emerald-500";

  // `app-bleed-x` pulls the panel out of the page gutter on theme-2 mobile; with
  // no side border or radius the rows run edge to edge either way.
  return (
    <div
      className={clsx(
        "app-bleed-x tw:border-y tw:border-slate-200 tw:bg-white",
        className,
      )}
    >
      {title ? (
        <div className="tw:border-b tw:border-slate-200 tw:px-4 tw:py-3">
          <p className="tw:text-[11px] tw:font-bold tw:tracking-widest tw:text-slate-500 tw:uppercase">
            {title}
          </p>
        </div>
      ) : null}

      <div className="tw:divide-y tw:divide-slate-100">
        {loading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={`catalog-menu-skeleton-${idx}`}
              className="tw:flex tw:items-center tw:gap-3 tw:px-4 tw:py-3"
            >
              <Skeleton className="tw:h-10 tw:w-10 tw:shrink-0 tw:rounded-xl" />
              <Skeleton className="tw:h-3.5 tw:flex-1 tw:rounded" />
              <Skeleton className="tw:h-3.5 tw:w-8 tw:rounded" />
            </div>
          ))
        ) : (
          <>
            {/* Unfiltered view — the whole catalogue, with the summed count. */}
            <button
              type="button"
              onClick={() => handleSelect(null)}
              aria-current={!activeMenuId ? "true" : undefined}
              className={clsx(
                rowClass,
                !activeMenuId
                  ? "tw:bg-emerald-50/70"
                  : "tw:bg-white tw:hover:bg-slate-50",
              )}
            >
              {!activeMenuId ? (
                <span className="tw:absolute tw:inset-y-0 tw:left-0 tw:w-[3px] tw:bg-emerald-600" />
              ) : null}

              <span className="tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:bg-slate-400 tw:text-[15px] tw:font-bold tw:text-white">
                A
              </span>

              <span className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-[15px] tw:font-bold tw:text-slate-900">
                All items
              </span>

              <span className="tw:shrink-0 tw:text-[13px] tw:font-bold tw:text-slate-900">
                {totalLabel}
              </span>
            </button>

            {items.map((item, idx) => {
              const isActive = activeMenuId === item._id;
              return (
                <button
                  key={`${item._id}-${idx}`}
                  type="button"
                  onClick={() => handleSelect(item)}
                  aria-current={isActive ? "true" : undefined}
                  title={item._displayName || item.name}
                  className={clsx(
                    rowClass,
                    isActive
                      ? "tw:bg-emerald-50/70"
                      : "tw:bg-white tw:hover:bg-slate-50",
                  )}
                >
                  {isActive ? (
                    <span className="tw:absolute tw:inset-y-0 tw:left-0 tw:w-[3px] tw:bg-emerald-600" />
                  ) : null}

                  <TintTile
                    index={idx}
                    className="tw:h-10 tw:w-10 tw:shrink-0 tw:rounded-xl tw:text-[15px] tw:font-bold"
                  >
                    {item._initial}
                  </TintTile>

                  <span className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-[15px] tw:font-semibold tw:text-slate-900">
                    {item._displayName || item.name}
                  </span>

                  <span className="tw:shrink-0 tw:text-[13px] tw:font-bold tw:text-slate-900">
                    {item._countLabel}
                  </span>
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default CatalogMenuList;
export type { CatalogMenuItem };
